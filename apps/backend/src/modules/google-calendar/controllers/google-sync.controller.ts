import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { SyncJobsQueryDto } from '../dto/google-calendar.dto';
import { CalendarSyncService } from '../services/calendar-sync.service';

@ApiTags('Google Calendar Integration')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/integrations/google')
export class GoogleSyncController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly syncService: CalendarSyncService,
  ) {}

  private async getBusinessId(): Promise<string> {
    const business = await this.prisma.business.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    return business?.id || '';
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Memicu sinkronisasi manual Google Calendar segera' })
  async triggerManualSync() {
    const businessId = await this.getBusinessId();
    const connection = await this.prisma.calendarConnection.findFirst({
      where: { businessId, status: 'CONNECTED' },
    });

    if (!connection) {
      return { message: 'Google Calendar belum terhubung atau belum aktif.' };
    }

    const job = await this.prisma.calendarSyncJob.create({
      data: {
        connectionId: connection.id,
        aggregateType: 'INCREMENTAL_SYNC',
        aggregateId: connection.id,
        operation: 'SYNC_EXTERNAL_EVENTS',
        status: 'PENDING',
        nextAttemptAt: new Date(),
      },
    });

    // Execute in background
    this.syncService.processSyncJob(job.id).catch(() => {});

    return {
      message: 'Pekerjaan sinkronisasi berhasil dijadwalkan.',
      jobId: job.id,
    };
  }

  @Get('jobs')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mendapatkan daftar antrean pekerjaan sinkronisasi outbox terpaginasi' })
  async getSyncJobs(@Query() query: SyncJobsQueryDto) {
    const businessId = await this.getBusinessId();
    const connection = await this.prisma.calendarConnection.findFirst({
      where: { businessId },
    });

    if (!connection) {
      return { items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(50, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = { connectionId: connection.id };
    if (query.status) {
      where.status = query.status;
    }

    const [total, items] = await Promise.all([
      this.prisma.calendarSyncJob.count({ where }),
      this.prisma.calendarSyncJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Post('jobs/:id/retry')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mencoba kembali (retry) pekerjaan sinkronisasi yang gagal' })
  async retryJob(@Param('id') id: string) {
    const job = await this.prisma.calendarSyncJob.findUnique({
      where: { id },
    });

    if (!job) {
      throw new Error(`Pekerjaan dengan ID ${id} tidak ditemukan.`);
    }

    const updated = await this.prisma.calendarSyncJob.update({
      where: { id },
      data: {
        status: 'PENDING',
        nextAttemptAt: new Date(),
        lockedUntil: null,
        lockedBy: null,
      },
    });

    this.syncService.processSyncJob(job.id).catch(() => {});

    return {
      message: 'Pekerjaan berhasil dijadwalkan ulang.',
      job: updated,
      ...updated,
    };
  }
}
