import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AuthenticatedUser } from '../../auth/types/token-payload';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { SelectCalendarDto } from '../dto/google-calendar.dto';
import { GoogleCalendarClientService } from '../services/google-calendar-client.service';
import { GoogleOAuthService } from '../services/google-oauth.service';
import { CalendarWatchService } from '../services/calendar-watch.service';
import { CalendarSyncService } from '../services/calendar-sync.service';

@ApiTags('Google Calendar Integration')
@Controller(['admin/integrations/google', 'calendar', 'integrations/google'])
export class GoogleOAuthController {
  constructor(
    private readonly oauthService: GoogleOAuthService,
    private readonly clientService: GoogleCalendarClientService,
    private readonly watchService: CalendarWatchService,
    private readonly syncService: CalendarSyncService,
    private readonly prisma: PrismaService,
  ) {}

  private async getBusinessId(): Promise<string> {
    const business = await this.prisma.business.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    return business?.id || '';
  }

  @Get('connect')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Menghasilkan tautan otorisasi Google OAuth 2.0 (Hanya OWNER)' })
  @ApiResponse({ status: 200, description: 'URL otorisasi Google berhasil dibuat' })
  async getConnectUrl(@CurrentUser() user: AuthenticatedUser) {
    const businessId = await this.getBusinessId();
    const url = this.oauthService.generateAuthorizationUrl(businessId, user?.id || '');
    return { authorizationUrl: url, url };
  }

  @Public()
  @Get('callback')
  @ApiOperation({ summary: 'OAuth 2.0 Callback endpoint dari Google Calendar' })
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    if (error) {
      if (req.headers.accept?.includes('application/json')) {
        throw new BadRequestException(error);
      }
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/settings/integrations/google?error=${encodeURIComponent(
          error,
        )}`,
        302,
      );
    }

    try {
      const protocol = (req.headers['x-forwarded-proto'] as string) || 'http';
      const host = (req.headers.host as string) || 'localhost:3001';
      const cleanUrl = req.url ? req.url.split('?')[0] : '';
      const requestUrl = `${protocol}://${host}${cleanUrl}`;
      await this.oauthService.handleCallback(code, state, requestUrl);
      if (req.headers.accept?.includes('application/json')) {
        return res.status(200).send({ success: true, message: 'Google Calendar berhasil terhubung.' });
      }
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/settings/integrations/google?connected=true`,
        302,
      );
    } catch (err: any) {
      if (req.headers.accept?.includes('application/json') || err instanceof BadRequestException) {
        throw err;
      }
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/settings/integrations/google?error=${encodeURIComponent(
          err.message || 'Gagal otentikasi Google',
        )}`,
        302,
      );
    }
  }

  @Get()
  @Get('status')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mendapatkan status koneksi Google Calendar & metrik sinkronisasi' })
  async getStatus() {
    const businessId = await this.getBusinessId();
    const connection = await this.prisma.calendarConnection.findFirst({
      where: { businessId },
      include: {
        webhookChannels: {
          where: { status: 'ACTIVE' },
          orderBy: { expiresAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!connection) {
      return {
        status: 'DISCONNECTED',
        googleAccountEmail: null,
        calendarId: null,
        calendarName: null,
        calendarTimezone: null,
        lastSuccessfulSyncAt: null,
        lastError: null,
        lastErrorAt: null,
        watchChannelActive: false,
        watchExpiresAt: null,
        stats: {
          totalSyncedEvents: 0,
          pendingJobs: 0,
          failedJobs: 0,
          openConflicts: 0,
        },
      };
    }

    const [totalSynced, pendingJobs, failedJobs, openConflicts] = await Promise.all([
      this.prisma.calendarEventMapping.count({
        where: { calendarConnectionId: connection.id, syncStatus: 'SYNCED' },
      }),
      this.prisma.calendarSyncJob.count({
        where: { connectionId: connection.id, status: { in: ['PENDING', 'PROCESSING'] } },
      }),
      this.prisma.calendarSyncJob.count({
        where: { connectionId: connection.id, status: { in: ['FAILED_RETRY', 'FAILED_PERMANENT'] } },
      }),
      this.prisma.calendarSyncConflict.count({
        where: { connectionId: connection.id, status: 'OPEN' },
      }),
    ]);

    const activeChannel = connection.webhookChannels[0];

    return {
      id: connection.id,
      status: connection.status,
      googleAccountEmail: connection.googleAccountEmail,
      calendarId: connection.calendarId,
      calendarName: connection.calendarName,
      calendarTimezone: connection.calendarTimezone,
      lastSuccessfulSyncAt: connection.lastSuccessfulSyncAt,
      lastError: connection.lastError,
      lastErrorAt: connection.lastErrorAt,
      watchChannelActive: Boolean(activeChannel && activeChannel.expiresAt > new Date()),
      watchExpiresAt: activeChannel?.expiresAt || null,
      stats: {
        totalSyncedEvents: totalSynced,
        pendingJobs,
        failedJobs,
        openConflicts,
      },
    };
  }

  @Get('calendars')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Mendapatkan daftar kalender yang dapat dipilih dari akun Google terhubung' })
  async listCalendars() {
    const businessId = await this.getBusinessId();
    const connection = await this.prisma.calendarConnection.findFirst({
      where: { businessId },
    });
    if (!connection) {
      return { items: [] };
    }
    const items = await this.clientService.listCalendars(connection.id);
    return { items };
  }

  @Post('calendar')
  @Post('select-calendar')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Memilih kalender Google resmi untuk integrasi (Hanya OWNER)' })
  async selectCalendar(@Body() dto: SelectCalendarDto) {
    const businessId = await this.getBusinessId();
    const connection = await this.prisma.calendarConnection.findFirst({
      where: { businessId },
    });
    if (!connection) {
      throw new Error('Koneksi Google Calendar tidak ditemukan.');
    }

    const result = await this.clientService.selectCalendar(connection.id, dto.calendarId);

    // Trigger initial full sync job and watch setup
    await this.prisma.calendarSyncJob.create({
      data: {
        connectionId: connection.id,
        aggregateType: 'FULL_SYNC',
        aggregateId: connection.id,
        operation: 'SYNC_EXTERNAL_EVENTS',
        status: 'PENDING',
      },
    });

    await this.watchService.setupWatchChannel(connection.id);

    return result;
  }

  @Delete()
  @Post('disconnect')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Memutuskan integrasi Google Calendar (Seluruh data pemesanan lokal tetap aman)' })
  async disconnect() {
    const businessId = await this.getBusinessId();
    return this.oauthService.disconnect(businessId);
  }
}
