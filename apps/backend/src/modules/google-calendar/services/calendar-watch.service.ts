import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { GoogleCalendarClientService } from './google-calendar-client.service';

@Injectable()
export class CalendarWatchService {
  private readonly logger = new Logger(CalendarWatchService.name);
  private readonly webhookPublicUrl?: string;
  private readonly channelSecret: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly clientService: GoogleCalendarClientService,
  ) {
    this.webhookPublicUrl =
      this.config.get<string>('google.webhookPublicUrl') || process.env.GOOGLE_WEBHOOK_PUBLIC_URL;
    this.channelSecret =
      this.config.get<string>('google.webhookChannelSecret') ||
      process.env.GOOGLE_WEBHOOK_CHANNEL_SECRET ||
      'tampilkit_webhook_channel_secret_key!';
  }

  async setupWatchChannel(connectionId: string) {
    if (!this.webhookPublicUrl) {
      this.logger.warn('GOOGLE_WEBHOOK_PUBLIC_URL tidak diatur. Webhook watch channel dilewati.');
      return null;
    }

    const { calendar, connection } = await this.clientService.getAuthenticatedClient(connectionId);
    const calendarId = connection.calendarId;
    if (!calendarId) return null;

    const channelId = crypto.randomUUID();
    const token = crypto.createHmac('sha256', this.channelSecret).update(channelId).digest('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    try {
      const res = await calendar.events.watch({
        calendarId,
        requestBody: {
          id: channelId,
          type: 'web_hook',
          address: `${this.webhookPublicUrl.replace(/\/$/, '')}/api/v1/webhooks/google-calendar`,
          token,
          params: {
            ttl: '604800', // 7 days in seconds
          },
        },
      });

      const expiration = res.data.expiration
        ? new Date(Number(res.data.expiration))
        : new Date(Date.now() + 7 * 24 * 3600 * 1000);

      const channel = await this.prisma.calendarWebhookChannel.create({
        data: {
          connectionId: connection.id,
          channelId,
          resourceId: res.data.resourceId || '',
          verificationTokenHash: tokenHash,
          expiresAt: expiration,
          status: 'ACTIVE',
        },
      });

      return channel;
    } catch (err: any) {
      this.logger.warn(`Gagal membuat Google Watch Channel: ${err.message}`);
      return null;
    }
  }

  async validateWebhook(channelId: string, channelToken: string, resourceId: string) {
    if (!channelId || !channelToken) {
      return null;
    }

    const channel = await this.prisma.calendarWebhookChannel.findUnique({
      where: { channelId },
      include: { connection: true },
    });

    if (!channel || channel.status !== 'ACTIVE') {
      return null;
    }

    const incomingHash = crypto.createHash('sha256').update(channelToken).digest('hex');
    const isValid = crypto.timingSafeEqual(
      Buffer.from(incomingHash, 'hex'),
      Buffer.from(channel.verificationTokenHash, 'hex'),
    );

    if (!isValid) {
      return null;
    }

    return channel;
  }
}
