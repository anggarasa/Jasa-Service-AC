import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TokenService } from './token.service';
import { AuthAuditService } from './auth-audit.service';

@Injectable()
export class RefreshRotationService {
  private readonly logger = new Logger(RefreshRotationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly audit: AuthAuditService,
  ) {}

  async rotateToken(
    rawRefreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    sessionId: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: any;
      isActive: boolean;
      lastLoginAt: Date | null;
    };
  }> {
    // 1. Verify cryptographic validity
    const payload = await this.tokenService.verifyRefreshToken(rawRefreshToken);
    const tokenHash = this.tokenService.hashToken(rawRefreshToken);

    // 2. Query record and session lineage
    const record = await this.prisma.refreshTokenRecord.findUnique({
      where: { tokenHash },
      include: {
        session: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!record) {
      throw new UnauthorizedException('Token penyegaran tidak dikenali.');
    }

    const { session } = record;

    // 3. REUSE DETECTION: A consumed token must NEVER be reused!
    if (record.consumedAt) {
      this.logger.warn(
        `🚨 REUSE DETECTED for token JTI: ${record.jti}, session: ${session.id}, family: ${session.familyId}`,
      );

      // Revoke entire session family immediately
      const now = new Date();
      await this.prisma.$transaction([
        this.prisma.authSession.updateMany({
          where: { familyId: session.familyId, revokedAt: null },
          data: {
            revokedAt: now,
            revokedReason: 'TOKEN_REUSE_DETECTED',
          },
        }),
        this.prisma.refreshTokenRecord.updateMany({
          where: { sessionId: session.id, revokedAt: null },
          data: { revokedAt: now },
        }),
      ]);

      await this.audit.logEvent({
        eventType: 'TOKEN_REUSE_DETECTED',
        userId: session.userId,
        sessionId: session.id,
        ipAddress,
        userAgent,
        metadata: {
          jti: record.jti,
          familyId: session.familyId,
        },
      });

      throw new UnauthorizedException(
        'Terdeteksi penggunaan ulang token. Sesi keamanan Anda telah dicabut untuk perlindungan akun. Silakan login kembali.',
      );
    }

    // 4. Validate session and account state
    if (session.revokedAt) {
      throw new UnauthorizedException(
        `Sesi telah dicabut: ${session.revokedReason || 'Tidak aktif'}`,
      );
    }

    if (session.absoluteExpiresAt <= new Date()) {
      throw new UnauthorizedException('Masa berlaku sesi telah kedaluwarsa.');
    }

    if (!session.user || !session.user.isActive) {
      throw new UnauthorizedException('Akun pengguna telah dinonaktifkan.');
    }

    // 5. Generate replacement tokens
    const access = await this.tokenService.signAccessToken({
      userId: session.user.id,
      sessionId: session.id,
      role: session.user.role,
      tokenVersion: session.user.tokenVersion,
    });

    const newRefresh = await this.tokenService.signRefreshToken({
      userId: session.user.id,
      sessionId: session.id,
    });

    const newRefreshHash = this.tokenService.hashToken(newRefresh.token);
    const now = new Date();

    // 6. Atomic Transaction to consume old token and register new one
    await this.prisma.$transaction(async (tx) => {
      // Mark old token as consumed
      const updateResult = await tx.refreshTokenRecord.updateMany({
        where: {
          id: record.id,
          consumedAt: null,
        },
        data: {
          consumedAt: now,
          replacedByJti: newRefresh.jti,
        },
      });

      if (updateResult.count === 0) {
        // Race condition: another concurrent request consumed it first
        throw new UnauthorizedException(
          'Permintaan rotasi token bersamaan terdeteksi. Silakan coba lagi.',
        );
      }

      // Store replacement token record
      await tx.refreshTokenRecord.create({
        data: {
          sessionId: session.id,
          jti: newRefresh.jti,
          tokenHash: newRefreshHash,
          expiresAt: newRefresh.expiresAt,
        },
      });

      // Update session last activity
      await tx.authSession.update({
        where: { id: session.id },
        data: { lastUsedAt: now },
      });
    });

    await this.audit.logEvent({
      eventType: 'TOKEN_REFRESH',
      userId: session.user.id,
      sessionId: session.id,
      ipAddress,
      userAgent,
      metadata: {
        oldJti: record.jti,
        newJti: newRefresh.jti,
      },
    });

    return {
      accessToken: access.token,
      refreshToken: newRefresh.token,
      sessionId: session.id,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        isActive: session.user.isActive,
        lastLoginAt: session.user.lastLoginAt,
      },
    };
  }
}
