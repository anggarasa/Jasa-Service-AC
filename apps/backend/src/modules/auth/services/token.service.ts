import { Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jose from 'jose';
import * as crypto from 'crypto';
import { UserRole } from '@prisma/client';
import { AccessTokenPayload, RefreshTokenPayload } from '../types/token-payload';
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from '../auth.constants';

@Injectable()
export class TokenService {
  private readonly accessSecretKey: Uint8Array;
  private readonly refreshSecretKey: Uint8Array;
  private readonly issuer: string;
  private readonly audience: string;

  constructor(@Optional() private readonly config?: ConfigService) {
    const accessSecret =
      this.config?.get<string>('jwt.accessSecret') ||
      process.env.JWT_ACCESS_SECRET ||
      'tampilkit_access_super_secret_key_minimum_32_characters_12345';
    const refreshSecret =
      this.config?.get<string>('jwt.refreshSecret') ||
      process.env.JWT_REFRESH_SECRET ||
      'tampilkit_refresh_super_secret_key_minimum_32_characters_67890';

    this.accessSecretKey = new TextEncoder().encode(accessSecret);
    this.refreshSecretKey = new TextEncoder().encode(refreshSecret);
    this.issuer =
      this.config?.get<string>('jwt.issuer') ||
      process.env.JWT_ISSUER ||
      'tampilkit-ac-booking';
    this.audience =
      this.config?.get<string>('jwt.audience') ||
      process.env.JWT_AUDIENCE ||
      'tampilkit-ac-api';
  }

  async signAccessToken(params: {
    userId: string;
    sessionId: string;
    role: UserRole;
    tokenVersion: number;
  }): Promise<{ token: string; jti: string; expiresAt: Date }> {
    const jti = crypto.randomUUID();
    const expiresIn =
      this.config?.get<string>('jwt.accessExpiresIn') ||
      process.env.JWT_ACCESS_EXPIRES_IN ||
      ACCESS_TOKEN_EXPIRY;

    const token = await new jose.SignJWT({
      sid: params.sessionId,
      role: params.role,
      tv: params.tokenVersion,
      type: 'access',
    })
      .setSubject(params.userId)
      .setJti(jti)
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .setProtectedHeader({ alg: 'HS256' })
      .sign(this.accessSecretKey);

    // Default 15 minutes expiration date
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    return { token, jti, expiresAt };
  }

  async signRefreshToken(params: {
    userId: string;
    sessionId: string;
  }): Promise<{ token: string; jti: string; expiresAt: Date }> {
    const jti = crypto.randomUUID();
    const expiresIn =
      this.config?.get<string>('jwt.refreshExpiresIn') ||
      process.env.JWT_REFRESH_EXPIRES_IN ||
      REFRESH_TOKEN_EXPIRY;

    const token = await new jose.SignJWT({
      sid: params.sessionId,
      type: 'refresh',
    })
      .setSubject(params.userId)
      .setJti(jti)
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .setProtectedHeader({ alg: 'HS256' })
      .sign(this.refreshSecretKey);

    // Default 7 days expiration date
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return { token, jti, expiresAt };
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      const { payload } = await jose.jwtVerify(token, this.accessSecretKey, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256'],
      });

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Tipe token tidak valid untuk otorisasi akses.');
      }

      if (!payload.sub || !payload.sid || !payload.role || typeof payload.tv !== 'number') {
        throw new UnauthorizedException('Klaim token akses tidak lengkap.');
      }

      return payload as unknown as AccessTokenPayload;
    } catch (err: unknown) {
      if (err instanceof UnauthorizedException) throw err;
      const msg = err instanceof Error ? err.message : 'Token tidak valid';
      throw new UnauthorizedException(`Token akses tidak valid atau kedaluwarsa: ${msg}`);
    }
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const { payload } = await jose.jwtVerify(token, this.refreshSecretKey, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256'],
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Tipe token tidak valid untuk penyegaran sesi.');
      }

      if (!payload.sub || !payload.sid || !payload.jti) {
        throw new UnauthorizedException('Klaim refresh token tidak lengkap.');
      }

      return payload as unknown as RefreshTokenPayload;
    } catch (err: unknown) {
      if (err instanceof UnauthorizedException) throw err;
      const msg = err instanceof Error ? err.message : 'Token tidak valid';
      throw new UnauthorizedException(`Refresh token tidak valid atau kedaluwarsa: ${msg}`);
    }
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
