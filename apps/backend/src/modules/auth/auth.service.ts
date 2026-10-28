import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { RefreshRotationService } from './services/refresh-rotation.service';
import { RateLimitService } from './services/rate-limit.service';
import { AuthAuditService } from './services/auth-audit.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RATE_LIMIT_WINDOWS } from './auth.constants';
import { AuthUser, SessionItem } from '@tampilkit-ac/api-contract';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly refreshRotationService: RefreshRotationService,
    private readonly rateLimitService: RateLimitService,
    private readonly auditService: AuthAuditService,
  ) {}

  async login(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    user: AuthUser;
    sessionId: string;
    accessToken: string;
    refreshToken: string;
  }> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const rateLimitKey = `login:${ipAddress || 'unknown'}:${normalizedEmail}`;

    // 1. Rate limiting
    await this.rateLimitService.check(
      rateLimitKey,
      RATE_LIMIT_WINDOWS.LOGIN.limit,
      RATE_LIMIT_WINDOWS.LOGIN.windowSeconds,
    );

    // 2. Find user
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      await this.auditService.logEvent({
        eventType: 'LOGIN_FAILED',
        ipAddress,
        userAgent,
        metadata: { email: normalizedEmail, reason: 'USER_NOT_FOUND' },
      });
      throw new UnauthorizedException('Email atau password tidak sesuai.');
    }

    // 3. Verify password
    const isPasswordValid = await this.passwordService.verifyPassword(
      user.passwordHash,
      dto.password,
    );

    if (!isPasswordValid) {
      await this.auditService.logEvent({
        eventType: 'LOGIN_FAILED',
        userId: user.id,
        ipAddress,
        userAgent,
        metadata: { reason: 'INVALID_PASSWORD' },
      });
      throw new UnauthorizedException('Email atau password tidak sesuai.');
    }

    // 4. Verify account active state
    if (!user.isActive) {
      await this.auditService.logEvent({
        eventType: 'LOGIN_FAILED',
        userId: user.id,
        ipAddress,
        userAgent,
        metadata: { reason: 'ACCOUNT_DISABLED' },
      });
      throw new UnauthorizedException(
        'Akun Anda saat ini tidak aktif. Silakan hubungi administrator.',
      );
    }

    // 5. Update lastLoginAt
    const now = new Date();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: now },
    });

    // 6. Create session & tokens
    const { sessionId, accessToken, refreshToken } =
      await this.sessionService.createSession({
        userId: user.id,
        role: user.role,
        tokenVersion: user.tokenVersion,
        userAgent,
        ipAddress,
      });

    // 7. Audit log & reset rate limit
    await this.auditService.logEvent({
      eventType: 'LOGIN_SUCCESS',
      userId: user.id,
      sessionId,
      ipAddress,
      userAgent,
    });
    await this.rateLimitService.reset(rateLimitKey);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as any,
        isActive: user.isActive,
        lastLoginAt: now.toISOString(),
      },
      sessionId,
      accessToken,
      refreshToken,
    };
  }

  async refresh(
    rawRefreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    user: AuthUser;
    sessionId: string;
    accessToken: string;
    refreshToken: string;
  }> {
    const rateLimitKey = `refresh:${ipAddress || 'unknown'}`;
    await this.rateLimitService.check(
      rateLimitKey,
      RATE_LIMIT_WINDOWS.REFRESH.limit,
      RATE_LIMIT_WINDOWS.REFRESH.windowSeconds,
    );

    const rotated = await this.refreshRotationService.rotateToken(
      rawRefreshToken,
      ipAddress,
      userAgent,
    );

    return {
      user: {
        id: rotated.user.id,
        name: rotated.user.name,
        email: rotated.user.email,
        role: rotated.user.role,
        isActive: rotated.user.isActive,
        lastLoginAt: rotated.user.lastLoginAt?.toISOString() || null,
      },
      sessionId: rotated.sessionId,
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
    };
  }

  async logout(
    sessionId: string,
    userId: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.sessionService.revokeSession(
      sessionId,
      userId,
      'USER_LOGOUT',
      ipAddress,
    );
    await this.auditService.logEvent({
      eventType: 'LOGOUT',
      userId,
      sessionId,
      ipAddress,
    });
  }

  async logoutAll(userId: string, ipAddress?: string): Promise<void> {
    await this.sessionService.revokeAllSessions(
      userId,
      'USER_LOGOUT_ALL',
      ipAddress,
    );
  }

  async getMe(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
    };
  }

  async getSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<SessionItem[]> {
    return this.sessionService.getUserSessions(userId, currentSessionId);
  }

  async revokeSession(
    sessionId: string,
    userId: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.sessionService.revokeSession(
      sessionId,
      userId,
      'REVOKED_BY_USER',
      ipAddress,
    );
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<AuthUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name.trim() },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
    };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const rateLimitKey = `changepass:${userId}`;
    await this.rateLimitService.check(
      rateLimitKey,
      RATE_LIMIT_WINDOWS.CHANGE_PASSWORD.limit,
      RATE_LIMIT_WINDOWS.CHANGE_PASSWORD.windowSeconds,
    );

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    // Verify current password
    const isCurrentValid = await this.passwordService.verifyPassword(
      user.passwordHash,
      dto.currentPassword,
    );

    if (!isCurrentValid) {
      throw new BadRequestException('Password saat ini tidak sesuai.');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'Password baru tidak boleh sama dengan password saat ini.',
      );
    }

    // Hash new password using Argon2id
    const newHash = await this.passwordService.hashPassword(dto.newPassword);
    const now = new Date();

    // Revoke all sessions and increment tokenVersion in transaction
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newHash,
          passwordChangedAt: now,
          tokenVersion: { increment: 1 },
        },
      }),
      this.prisma.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: {
          revokedAt: now,
          revokedReason: 'PASSWORD_CHANGED',
        },
      }),
    ]);

    await this.auditService.logEvent({
      eventType: 'PASSWORD_CHANGED',
      userId,
      ipAddress,
      userAgent,
    });
  }
}
