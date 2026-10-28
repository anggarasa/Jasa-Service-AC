import { TokenService } from './token.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('TokenService', () => {
  let service: TokenService;
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService({
      jwt: {
        accessSecret: 'test_access_super_secret_key_minimum_32_characters_123',
        refreshSecret: 'test_refresh_super_secret_key_minimum_32_characters_456',
        accessExpiresIn: '15m',
        refreshExpiresIn: '7d',
        issuer: 'test-issuer',
        audience: 'test-audience',
      },
    });
    service = new TokenService(configService);
  });

  it('should sign and verify valid access token', async () => {
    const { token } = await service.signAccessToken({
      userId: 'user-123',
      sessionId: 'session-456',
      role: UserRole.OWNER,
      tokenVersion: 1,
    });

    const payload = await service.verifyAccessToken(token);
    expect(payload.sub).toBe('user-123');
    expect(payload.sid).toBe('session-456');
    expect(payload.role).toBe(UserRole.OWNER);
    expect(payload.tv).toBe(1);
    expect(payload.type).toBe('access');
  });

  it('should sign and verify valid refresh token', async () => {
    const { token } = await service.signRefreshToken({
      userId: 'user-123',
      sessionId: 'session-456',
    });

    const payload = await service.verifyRefreshToken(token);
    expect(payload.sub).toBe('user-123');
    expect(payload.sid).toBe('session-456');
    expect(payload.type).toBe('refresh');
  });

  it('should reject access token when presented as refresh token', async () => {
    const { token } = await service.signAccessToken({
      userId: 'user-123',
      sessionId: 'session-456',
      role: UserRole.OWNER,
      tokenVersion: 1,
    });

    // Verification with refresh secret must fail signature or token type check
    await expect(service.verifyRefreshToken(token)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should reject token with tampered signature', async () => {
    const { token } = await service.signAccessToken({
      userId: 'user-123',
      sessionId: 'session-456',
      role: UserRole.ADMIN,
      tokenVersion: 1,
    });

    const tampered = token.slice(0, -5) + 'xxxxx';
    await expect(service.verifyAccessToken(tampered)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should hash token deterministically using SHA-256', () => {
    const hash1 = service.hashToken('my-secret-token');
    const hash2 = service.hashToken('my-secret-token');
    const hash3 = service.hashToken('other-token');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(64);
  });
});
