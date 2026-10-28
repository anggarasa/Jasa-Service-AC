import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CalendarSyncService } from '../services/calendar-sync.service';

@Injectable()
export class CalendarJobProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CalendarJobProcessor.name);
  private readonly workerId = `worker-${crypto.randomUUID().slice(0, 8)}`;
  private isRunning = false;
  private intervalTimer: NodeJS.Timeout | null = null;
  private readonly enabled: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly syncService: CalendarSyncService,
    private readonly config: ConfigService,
  ) {
    this.enabled =
      this.config.get<boolean>('google.workerEnabled') === true ||
      process.env.GOOGLE_WORKER_ENABLED === 'true';
  }

  onModuleInit() {
    if (this.enabled) {
      this.start();
    } else {
      this.logger.log('Calendar outbox worker is disabled by configuration (GOOGLE_WORKER_ENABLED=false).');
    }
  }

  onModuleDestroy() {
    this.stop();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.logger.log(`Calendar Outbox Worker started [${this.workerId}].`);

    this.intervalTimer = setInterval(async () => {
      await this.processPendingJobs();
    }, 5000);
  }

  stop() {
    this.isRunning = false;
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.logger.log(`Calendar Outbox Worker stopped [${this.workerId}].`);
  }

  async processPendingJobs(batchSize = 5) {
    const now = new Date();
    const leaseExpiry = new Date(Date.now() + 60 * 1000); // 60s lease

    // Atomic claim using transaction
    const claimedJobIds: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      const candidates = await tx.calendarSyncJob.findMany({
        where: {
          status: { in: ['PENDING', 'FAILED_RETRY'] },
          nextAttemptAt: { lte: now },
          OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
        },
        take: batchSize,
        orderBy: { nextAttemptAt: 'asc' },
      });

      for (const job of candidates) {
        await tx.calendarSyncJob.update({
          where: { id: job.id },
          data: {
            lockedUntil: leaseExpiry,
            lockedBy: this.workerId,
            status: 'PROCESSING',
          },
        });
        claimedJobIds.push(job.id);
      }
    });

    for (const jobId of claimedJobIds) {
      try {
        await this.syncService.processSyncJob(jobId);
      } catch (err: any) {
        this.logger.error(`Error processing job ${jobId}: ${err.message}`);
      }
    }
  }
}
