import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class RateLimitService {
  constructor(private readonly prisma: PrismaService) {}

  async check(key: string, limit: number, windowSeconds: number): Promise<void> {
    const now = new Date();

    try {
      const record = await this.prisma.rateLimitRecord.findUnique({
        where: { key },
      });

      if (!record || record.expiresAt <= now) {
        // Reset or create record
        const expiresAt = new Date(now.getTime() + windowSeconds * 1000);
        await this.prisma.rateLimitRecord.upsert({
          where: { key },
          update: {
            points: 1,
            expiresAt,
          },
          create: {
            key,
            points: 1,
            expiresAt,
          },
        });
        return;
      }

      if (record.points >= limit) {
        const retryAfterSeconds = Math.ceil(
          (record.expiresAt.getTime() - now.getTime()) / 1000,
        );
        throw new HttpException(
          {
            success: false,
            error: {
              code: 'RATE_LIMITED',
              message: `Batas percobaan terlampaui. Silakan tunggu ${retryAfterSeconds} detik sebelum mencoba lagi.`,
            },
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Increment points
      await this.prisma.rateLimitRecord.update({
        where: { key },
        data: {
          points: { increment: 1 },
        },
      });
    } catch (err: unknown) {
      if (err instanceof HttpException) throw err;
      // In case of transient database rate limit error, do not block user action unnecessarily
      console.warn('Rate limit check warning:', err);
    }
  }

  async reset(key: string): Promise<void> {
    try {
      await this.prisma.rateLimitRecord.deleteMany({
        where: { key },
      });
    } catch {
      // Ignore cleanup error
    }
  }
}
