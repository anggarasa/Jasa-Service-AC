import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { HealthData, LivenessData } from '@tampilkit-ac/api-contract';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Status kesehatan aplikasi secara umum' })
  @ApiResponse({
    status: 200,
    description: 'Aplikasi berjalan dan status dependensi dilaporkan secara transparan.',
  })
  async getHealth(): Promise<HealthData> {
    const dbStatus = await this.prisma.checkDatabaseHealth();
    const storageStatus = await this.storage.checkStorageHealth();

    const isDegraded = dbStatus === 'disconnected' || storageStatus === 'disconnected';
    const isOutage = dbStatus === 'disconnected' && storageStatus === 'disconnected';

    return {
      application: 'tampilkit-ac-booking',
      status: isOutage ? 'outage' : isDegraded ? 'degraded' : 'operational',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      version: '0.1.0',
      dependencies: {
        database: dbStatus,
        storage: storageStatus,
      },
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Pemeriksaan liveness (apakah proses aplikasi masih berjalan)' })
  @ApiResponse({ status: 200, description: 'Proses backend aktif.' })
  getLiveness(): LivenessData {
    return {
      status: 'up',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Pemeriksaan readiness (kesiapan menangani traffic)' })
  @ApiResponse({ status: 200, description: 'Semua dependensi siap.' })
  @ApiResponse({ status: 503, description: 'Salah satu dependensi penting bermasalah.' })
  async getReadiness(@Res({ passthrough: true }) res: FastifyReply) {
    const dbStatus = await this.prisma.checkDatabaseHealth();
    const storageStatus = await this.storage.checkStorageHealth();

    const isReady = dbStatus !== 'disconnected' && storageStatus !== 'disconnected';

    if (!isReady) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return {
      ready: isReady,
      timestamp: new Date().toISOString(),
      dependencies: {
        database: dbStatus,
        storage: storageStatus,
      },
    };
  }
}
