import { RefreshRotationService } from './refresh-rotation.service';
import { TokenService } from './token.service';
import { AuthAuditService } from './auth-audit.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('RefreshRotationService', () => {
  let service: RefreshRotationService;
  let prisma: any;
  let tokenService: any;
  let audit: any;

  beforeEach(() => {
    prisma = {
      refreshTokenRecord: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      authSession: {
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(async (cbOrArr) => {
        if (typeof cbOrArr === 'function') {
          return cbOrArr(prisma);
        }
        return Promise.all(cbOrArr);
      }),
    };

    tokenService = {
      verifyRefreshToken: jest.fn(),
      hashToken: jest.fn((t) => `hashed_${t}`),
      signAccessToken: jest.fn(async () => ({
        token: 'new_access_token',
        jti: 'new_access_jti',
        expiresAt: new Date(),
      })),
      signRefreshToken: jest.fn(async () => ({
        token: 'new_refresh_token',
        jti: 'new_refresh_jti',
        expiresAt: new Date(Date.now() + 7 * 86400000),
      })),
    };

    audit = {
      logEvent: jest.fn(),
    };

    service = new RefreshRotationService(prisma, tokenService, audit);
  });

  it('should successfully rotate valid refresh token atomically', async () => {
    tokenService.verifyRefreshToken.mockResolvedValue({
      sub: 'user-1',
      sid: 'session-1',
      jti: 'old_jti',
      type: 'refresh',
    });

    prisma.refreshTokenRecord.findUnique.mockResolvedValue({
      id: 'rec-1',
      sessionId: 'session-1',
      jti: 'old_jti',
      tokenHash: 'hashed_valid_token',
      consumedAt: null,
      session: {
        id: 'session-1',
        userId: 'user-1',
        familyId: 'family-1',
        revokedAt: null,
        absoluteExpiresAt: new Date(Date.now() + 100000),
        user: {
          id: 'user-1',
          email: 'owner@coolcare.id',
          name: 'Owner',
          role: UserRole.OWNER,
          isActive: true,
          tokenVersion: 1,
        },
      },
    });

    prisma.refreshTokenRecord.updateMany.mockResolvedValue({ count: 1 });
    prisma.refreshTokenRecord.create.mockResolvedValue({ id: 'rec-2' });
    prisma.authSession.update.mockResolvedValue({});

    const result = await service.rotateToken('valid_token');

    expect(result.accessToken).toBe('new_access_token');
    expect(result.refreshToken).toBe('new_refresh_token');
    expect(audit.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'TOKEN_REFRESH' }),
    );
  });

  it('should detect token replay and revoke session family immediately', async () => {
    tokenService.verifyRefreshToken.mockResolvedValue({
      sub: 'user-1',
      sid: 'session-1',
      jti: 'stolen_jti',
      type: 'refresh',
    });

    // Record already consumed!
    prisma.refreshTokenRecord.findUnique.mockResolvedValue({
      id: 'rec-1',
      sessionId: 'session-1',
      jti: 'stolen_jti',
      tokenHash: 'hashed_replayed_token',
      consumedAt: new Date(Date.now() - 5000), // ALREADY CONSUMED
      session: {
        id: 'session-1',
        userId: 'user-1',
        familyId: 'family-1',
        revokedAt: null,
        absoluteExpiresAt: new Date(Date.now() + 100000),
        user: {
          id: 'user-1',
          email: 'owner@coolcare.id',
          name: 'Owner',
          role: UserRole.OWNER,
          isActive: true,
          tokenVersion: 1,
        },
      },
    });

    await expect(service.rotateToken('replayed_token')).rejects.toThrow(
      UnauthorizedException,
    );

    // Verify session family was revoked in transaction
    expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
      where: { familyId: 'family-1', revokedAt: null },
      data: expect.objectContaining({ revokedReason: 'TOKEN_REUSE_DETECTED' }),
    });

    expect(audit.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'TOKEN_REUSE_DETECTED' }),
    );
  });
});
