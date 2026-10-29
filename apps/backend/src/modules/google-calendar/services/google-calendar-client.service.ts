import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { google, calendar_v3 } from 'googleapis';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { GoogleOAuthService } from './google-oauth.service';
import { GoogleTokenService } from './google-token.service';

@Injectable()
export class GoogleCalendarClientService {
  private readonly logger = new Logger(GoogleCalendarClientService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly oauthService: GoogleOAuthService,
    private readonly tokenService: GoogleTokenService,
  ) {}

  async getAuthenticatedClient(connectionId: string) {
    const connection = await this.prisma.calendarConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException('Koneksi Google Calendar tidak ditemukan.');
    }

    if (connection.status === 'DISCONNECTED') {
      throw new BadRequestException('Google Calendar belum terhubung.');
    }

    if (!connection.encryptedRefreshToken) {
      await this.prisma.calendarConnection.update({
        where: { id: connectionId },
        data: { status: 'REAUTH_REQUIRED', lastError: 'Refresh token tidak tersedia.' },
      });
      throw new ForbiddenException('Refresh token tidak tersedia. Diperlukan otorisasi ulang (REAUTH_REQUIRED).');
    }

    const refreshToken = this.tokenService.decrypt(connection.encryptedRefreshToken);
    let accessToken = connection.encryptedAccessToken
      ? this.tokenService.decrypt(connection.encryptedAccessToken)
      : null;

    const oauth2Client = this.oauthService.getOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
      access_token: accessToken || undefined,
    });

    // Check if access token expired or missing
    const isExpired =
      !connection.accessTokenExpiresAt ||
      connection.accessTokenExpiresAt.getTime() - Date.now() < 60 * 1000;

    if (isExpired || !accessToken) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        accessToken = credentials.access_token || null;
        const newExpiry = credentials.expiry_date ? new Date(credentials.expiry_date) : null;

        await this.prisma.calendarConnection.update({
          where: { id: connectionId },
          data: {
            encryptedAccessToken: accessToken ? this.tokenService.encrypt(accessToken) : null,
            accessTokenExpiresAt: newExpiry,
            lastError: null,
          },
        });
        oauth2Client.setCredentials(credentials);
      } catch (err: any) {
        this.logger.error(`Gagal merefresh Google Access Token: ${err.message}`);
        await this.prisma.calendarConnection.update({
          where: { id: connectionId },
          data: {
            status: 'REAUTH_REQUIRED',
            lastError: `Gagal refresh token: ${err.message}`,
            lastErrorAt: new Date(),
          },
        });
        throw new ForbiddenException(
          'Otorisasi Google Calendar telah kedaluwarsa atau dicabut oleh pengguna. Diperlukan otorisasi ulang (REAUTH_REQUIRED).',
        );
      }
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    return { calendar, connection, oauth2Client };
  }

  async listCalendars(connectionId: string) {
    const { calendar } = await this.getAuthenticatedClient(connectionId);
    try {
      const res = await calendar.calendarList.list({ minAccessRole: 'reader' });
      const items = res.data.items || [];
      return items.map((c) => ({
        id: c.id || '',
        name: c.summary || '',
        summary: c.summary || '',
        timeZone: c.timeZone || 'Asia/Jakarta',
        primary: Boolean(c.primary),
        accessRole: c.accessRole || 'reader',
        canEdit: c.accessRole === 'owner' || c.accessRole === 'writer',
      }));
    } catch (err: any) {
      this.logger.error(`Gagal mengambil daftar kalender Google: ${err.message}`);
      throw new BadRequestException(`Gagal mengambil kalender Google: ${err.message}`);
    }
  }

  async selectCalendar(connectionId: string, calendarId: string) {
    const { calendar } = await this.getAuthenticatedClient(connectionId);

    try {
      const calMeta = await calendar.calendars.get({ calendarId });
      const calendarName = calMeta.data.summary || 'Google Calendar';
      const calendarTimezone = calMeta.data.timeZone || 'Asia/Jakarta';

      const updated = await this.prisma.calendarConnection.update({
        where: { id: connectionId },
        data: {
          calendarId,
          calendarName,
          calendarTimezone,
          status: 'CONNECTED',
          lastError: null,
          lastErrorAt: null,
        },
      });

      return {
        calendarId: updated.calendarId,
        calendarName: updated.calendarName,
        calendarTimezone: updated.calendarTimezone,
        status: updated.status,
      };
    } catch (err: any) {
      throw new BadRequestException(`Tidak dapat mengakses kalender "${calendarId}": ${err.message}`);
    }
  }
}
