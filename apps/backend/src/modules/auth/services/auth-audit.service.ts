import { Injectable, Logger } from '@nestjs/common';
import { AuthAuditEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class AuthAuditService {
  private readonly logger = new Logger(AuthAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logEvent(params: {
    eventType: AuthAuditEventType;
    userId?: string | null;
    sessionId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<void> {
    try {
      const sanitizedMeta = params.metadata ? { ...params.metadata } : {};
      // Ensure no passwords or raw JWTs ever get recorded
      delete sanitizedMeta.password;
      delete sanitizedMeta.token;
      delete sanitizedMeta.currentPassword;
      delete sanitizedMeta.newPassword;

      await this.prisma.authAuditLog.create({
        data: {
          eventType: params.eventType,
          userId: params.userId || null,
          sessionId: params.sessionId || null,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
          metadata: sanitizedMeta as Prisma.InputJsonValue,
        },
      });

      this.logger.log(
        `[AUDIT] ${params.eventType} - User: ${params.userId || 'anonymous'}, IP: ${
          params.ipAddress || 'unknown'
        }`,
      );
    } catch (err: unknown) {
      this.logger.error('Failed to persist auth audit log entry', err);
    }
  }
}
