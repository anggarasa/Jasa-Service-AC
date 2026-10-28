import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import * as crypto from 'crypto';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { GoogleTokenService } from './google-token.service';

export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.freebusy',
];

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);
  private readonly clientId?: string;
  private readonly clientSecret?: string;
  private readonly redirectUri: string;
  private readonly stateSecret: string;
  private readonly usedStates = new Set<string>();

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly tokenService: GoogleTokenService,
  ) {
    this.clientId = this.config.get<string>('google.clientId') || process.env.GOOGLE_CLIENT_ID;
    this.clientSecret = this.config.get<string>('google.clientSecret') || process.env.GOOGLE_CLIENT_SECRET;
    this.redirectUri =
      this.config.get<string>('google.redirectUri') ||
      process.env.GOOGLE_REDIRECT_URI ||
      'http://localhost:3001/api/v1/integrations/google/callback';
    this.stateSecret =
      this.config.get<string>('google.oauthStateSecret') ||
      process.env.GOOGLE_OAUTH_STATE_SECRET ||
      'tampilkit_oauth_state_secret_min_32_characters!';
  }

  getOAuth2Client() {
    return new google.auth.OAuth2(this.clientId, this.clientSecret, this.redirectUri);
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  generateState(businessId: string, userId: string): string {
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');
    const payload = `${businessId}:${userId}:${timestamp}:${nonce}`;
    const signature = crypto.createHmac('sha256', this.stateSecret).update(payload).digest('hex');
    return `${payload}:${signature}`;
  }

  validateState(stateString: string): { businessId: string; userId: string } {
    if (!stateString) {
      throw new BadRequestException('State OAuth tidak disertakan.');
    }

    if (this.usedStates.has(stateString)) {
      throw new BadRequestException('State OAuth sudah pernah digunakan (Replay detected).');
    }

    const parts = stateString.split(':');
    if (parts.length !== 5) {
      throw new BadRequestException('Format state OAuth tidak valid.');
    }

    const [businessId, userId, timestampStr, nonce, signature] = parts;
    const payload = `${businessId}:${userId}:${timestampStr}:${nonce}`;
    const expectedSig = crypto.createHmac('sha256', this.stateSecret).update(payload).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSig, 'hex'))) {
      throw new BadRequestException('Tanda tangan state OAuth tidak valid.');
    }

    const timestamp = Number(timestampStr);
    const MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes
    if (Date.now() - timestamp > MAX_AGE_MS) {
      throw new BadRequestException('State OAuth telah kedaluwarsa.');
    }

    this.usedStates.add(stateString);
    setTimeout(() => this.usedStates.delete(stateString), MAX_AGE_MS);

    return { businessId, userId };
  }

  generateAuthorizationUrl(businessId: string, userId: string): string {
    if (!this.isConfigured()) {
      throw new BadRequestException(
        'Integrasi Google Calendar belum dikonfigurasi pada server (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET belum diisi).',
      );
    }

    const oauth2Client = this.getOAuth2Client();
    const state = this.generateState(businessId, userId);

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: GOOGLE_CALENDAR_SCOPES,
      state,
      include_granted_scopes: true,
    });
  }

  async handleCallback(code: string, state: string) {
    const { businessId, userId } = this.validateState(state);

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) {
      throw new NotFoundException('Data bisnis tidak ditemukan.');
    }

    const oauth2Client = this.getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      this.logger.warn('Google tidak mengembalikan refresh token. User mungkin sudah pernah otorisasi sebelumnya tanpa consent prompt.');
    }

    oauth2Client.setCredentials(tokens);

    // Fetch user email if scope permits
    let accountEmail: string | null = null;
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      accountEmail = userInfo.data.email || null;
    } catch {
      // Ignored if userinfo scope was not requested
    }

    const encryptedAccessToken = tokens.access_token
      ? this.tokenService.encrypt(tokens.access_token)
      : null;
    const encryptedRefreshToken = tokens.refresh_token
      ? this.tokenService.encrypt(tokens.refresh_token)
      : null;

    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
    const grantedScopes = tokens.scope ? tokens.scope.split(' ') : GOOGLE_CALENDAR_SCOPES;

    // Save or update CalendarConnection
    const connection = await this.prisma.calendarConnection.upsert({
      where: {
        id: (await this.prisma.calendarConnection.findFirst({ where: { businessId } }))?.id || 'new-uuid',
      },
      create: {
        businessId,
        provider: 'GOOGLE',
        googleAccountEmail: accountEmail,
        encryptedAccessToken,
        encryptedRefreshToken,
        accessTokenExpiresAt: expiresAt,
        grantedScopes,
        status: 'NEEDS_SELECTION',
      },
      update: {
        googleAccountEmail: accountEmail,
        encryptedAccessToken,
        ...(encryptedRefreshToken ? { encryptedRefreshToken } : {}),
        accessTokenExpiresAt: expiresAt,
        grantedScopes,
        status: 'NEEDS_SELECTION',
        lastError: null,
        lastErrorAt: null,
      },
    });

    return {
      connectionId: connection.id,
      googleAccountEmail: accountEmail,
      status: connection.status,
    };
  }

  async disconnect(businessId: string) {
    const connection = await this.prisma.calendarConnection.findFirst({
      where: { businessId },
    });

    if (!connection) {
      return { message: 'Google Calendar memang belum terhubung.' };
    }

    // Stop watch channels
    await this.prisma.calendarWebhookChannel.updateMany({
      where: { connectionId: connection.id, status: 'ACTIVE' },
      data: { status: 'STOPPED' },
    });

    // Remove tokens and mark DISCONNECTED
    await this.prisma.calendarConnection.update({
      where: { id: connection.id },
      data: {
        status: 'DISCONNECTED',
        encryptedAccessToken: null,
        encryptedRefreshToken: null,
        calendarId: null,
        calendarName: null,
        calendarTimezone: null,
      },
    });

    // Clean up external events
    await this.prisma.externalCalendarEvent.deleteMany({
      where: { connectionId: connection.id },
    });

    return {
      success: true,
      message: 'Google Calendar berhasil diputuskan. Seluruh data pemesanan lokal tetap tersimpan aman.',
    };
  }
}
