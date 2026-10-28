import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { GoogleCalendarClientService } from './google-calendar-client.service';

export interface BusyInterval {
  start: Date;
  end: Date;
  source: 'EXTERNAL_BUSY' | 'MANAGED_BOOKING';
  summary?: string;
}

@Injectable()
export class GoogleFreeBusyService {
  private readonly logger = new Logger(GoogleFreeBusyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clientService: GoogleCalendarClientService,
  ) {}

  async getExternalBusyIntervals(
    businessId: string,
    timeMin: Date,
    timeMax: Date,
  ): Promise<{ busyIntervals: BusyInterval[]; isFailClosed: boolean }> {
    const connection = await this.prisma.calendarConnection.findFirst({
      where: { businessId },
    });

    if (!connection || connection.status === 'DISCONNECTED' || !connection.calendarId) {
      return { busyIntervals: [], isFailClosed: false };
    }

    if (connection.status === 'REAUTH_REQUIRED') {
      this.logger.warn(`Google Calendar connection ${connection.id} is REAUTH_REQUIRED. Applying fail-closed policy.`);
      return { busyIntervals: [], isFailClosed: true };
    }

    // Retrieve cached external events from PostgreSQL table ExternalCalendarEvent
    const externalEvents = await this.prisma.externalCalendarEvent.findMany({
      where: {
        connectionId: connection.id,
        isBusy: true,
        sourceType: 'EXTERNAL_BUSY',
        startAt: { lt: timeMax },
        endAt: { gt: timeMin },
      },
    });

    const busyIntervals: BusyInterval[] = externalEvents.map((evt) => ({
      start: evt.startAt,
      end: evt.endAt,
      source: 'EXTERNAL_BUSY',
      summary: evt.summary || undefined,
    }));

    return { busyIntervals, isFailClosed: false };
  }
}
