import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TokenService } from './token.service';
import { AuthAuditService } from './auth-audit.service';
import { SESSION_MAX_AGE_SECONDS } from '../auth.constants';
import { SessionItem } from '@tampilkit-ac/api-contract';

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly audit: AuthAuditService,
  ) {}

  async createSession(params: {
    userId: string;
    role: UserRole;
    tokenVersion: number;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<{
    sessionId: string;
    accessToken: string;
    refreshToken: string;
  }> {
    const now = new Date();
    const absoluteExpiresAt = new Date(
      now.getTime() + SESSION_MAX_AGE_SECONDS * 1000,
    );

    const session = await this.prisma.authSession.create({
      data: {
        userId: params.userId,
        userAgent: params.userAgent || null,
        ipAddress: params.ipAddress || null,
        absoluteExpiresAt,
        lastUsedAt: now,
      },
    });

    const access = await this.tokenService.signAccessToken({
      userId: params.userId,
      sessionId: session.id,
      role: params.role,
      tokenVersion: params.tokenVersion,
    });

    const refresh = await this.tokenService.signRefreshToken({
      userId: params.userId,
      sessionId: session.id,
    });

    const refreshHash = this.tokenService.hashToken(refresh.token);

    await this.prisma.refreshTokenRecord.create({
      data: {
        sessionId: session.id,
        jti: refresh.jti,
        tokenHash: refreshHash,
        expiresAt: refresh.expiresAt,
      },
    });

    return {
      sessionId: session.id,
      accessToken: access.token,
      refreshToken: refresh.token,
    };
  }

  async validateSession(params: {
    sessionId: string;
    userId: string;
    tokenVersion: number;
  }) {
    const session = await this.prisma.authSession.findUnique({
      where: { id: params.sessionId },
      include: { user: true },
    });

    if (!session || session.userId !== params.userId) {
      throw new UnauthorizedException('Sesi tidak ditemukan atau tidak valid.');
    }

    if (session.revokedAt) {
      throw new UnauthorizedException(
        `Sesi telah dicabut: ${session.revokedReason || 'Logout'}`,
      );
    }

    if (session.absoluteExpiresAt <= new Date()) {
      throw new UnauthorizedException('Masa berlaku sesi telah berakhir.');
    }

    if (!session.user || !session.user.isActive) {
      throw new UnauthorizedException('Akun pengguna telah dinonaktifkan.');
    }

    if (session.user.tokenVersion !== params.tokenVersion) {
      throw new UnauthorizedException(
        'Kredensial atau versi sesi telah diperbarui. Silakan login kembali.',
      );
    }

    // Touch lastUsedAt asynchronously
    this.prisma.authSession
      .update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});

    return {
      session,
      user: session.user,
    };
  }

  async getUserSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<SessionItem[]> {
    const sessions = await this.prisma.authSession.findMany({
      where: {
        userId,
        revokedAt: null,
        absoluteExpiresAt: { gt: new Date() },
      },
      orderBy: { lastUsedAt: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      familyId: s.familyId,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt.toISOString(),
      lastUsedAt: s.lastUsedAt.toISOString(),
      isCurrent: s.id === currentSessionId,
    }));
  }

  async revokeSession(
    sessionId: string,
    userId: string,
    reason = 'REVOKED_BY_USER',
    ipAddress?: string,
  ): Promise<void> {
    const session = await this.prisma.authSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('Sesi tidak ditemukan.');
    }

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.authSession.update({
        where: { id: sessionId },
        data: {
          revokedAt: now,
          revokedReason: reason,
        },
      }),
      this.prisma.refreshTokenRecord.updateMany({
        where: { sessionId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);

    await this.audit.logEvent({
      eventType: 'SESSION_REVOKED',
      userId,
      sessionId,
      ipAddress,
      metadata: { reason },
    });
  }

  async revokeAllSessions(
    userId: string,
    reason = 'LOGOUT_ALL',
    ipAddress?: string,
  ): Promise<void> {
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: {
          revokedAt: now,
          revokedReason: reason,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          tokenVersion: { increment: 1 },
        },
      }),
    ]);

    await this.audit.logEvent({
      eventType: 'LOGOUT_ALL',
      userId,
      ipAddress,
      metadata: { reason },
    });
  }
}
