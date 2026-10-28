import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CalendarSyncService } from '../services/calendar-sync.service';
import { CalendarWatchService } from '../services/calendar-watch.service';

@ApiTags('Google Calendar Webhook')
@Controller('webhooks/google-calendar')
export class GoogleWebhookController {
  private readonly logger = new Logger(GoogleWebhookController.name);

  constructor(
    private readonly watchService: CalendarWatchService,
    private readonly syncService: CalendarSyncService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Menerima notifikasi perubahan dari Google Calendar Push Notifications' })
  @ApiResponse({ status: 200, description: 'Notifikasi berhasil diterima dan diproses' })
  @ApiResponse({ status: 401, description: 'Token verifikasi channel tidak valid' })
  async handleWebhook(
    @Headers('x-goog-channel-id') channelId?: string,
    @Headers('x-goog-channel-token') channelToken?: string,
    @Headers('x-goog-resource-id') resourceId?: string,
    @Headers('x-goog-resource-state') resourceState?: string,
  ) {
    if (!channelId || !channelToken) {
      this.logger.warn('Menerima request webhook tanpa x-goog-channel-id atau x-goog-channel-token');
      throw new UnauthorizedException('Header verifikasi tidak lengkap');
    }

    // Google sends 'sync' state upon channel creation
    if (resourceState === 'sync') {
      this.logger.log(`Google Webhook handshake channel diautentikasi: ${channelId}`);
      return { status: 'acknowledged', type: 'sync_handshake' };
    }

    const channel = await this.watchService.validateWebhook(
      channelId,
      channelToken,
      resourceId || '',
    );

    if (!channel) {
      this.logger.warn(`Validasi webhook gagal untuk channelId: ${channelId}`);
      throw new UnauthorizedException('Token verifikasi channel tidak cocok atau channel kedaluwarsa');
    }

    // Trigger asynchronous incremental sync
    this.logger.log(`Google Calendar perubahan terdeteksi untuk koneksi ${channel.connectionId}, memulai incremental sync`);
    // Run incremental sync asynchronously so webhook returns HTTP 200 immediately
    setImmediate(async () => {
      try {
        await this.syncService.executeIncrementalSync(channel.connectionId);
      } catch (err: any) {
        this.logger.error(`Error pemrosesan webhook incremental sync: ${err.message}`, err.stack);
      }
    });

    return { status: 'success', connectionId: channel.connectionId };
  }
}
