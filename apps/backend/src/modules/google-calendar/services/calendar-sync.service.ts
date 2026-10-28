import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { GoogleCalendarClientService } from './google-calendar-client.service';
import { GoogleEventService } from './google-event.service';

@Injectable()
export class CalendarSyncService {
  private readonly logger = new Logger(CalendarSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clientService: GoogleCalendarClientService,
    private readonly eventService: GoogleEventService,
  ) {}

  async enqueueBookingSync(
    tx: any,
    bookingId: string,
    operation: 'CREATE_EVENT' | 'UPDATE_EVENT' | 'DELETE_EVENT',
  ) {
    const booking = await (tx || this.prisma).booking.findUnique({
      where: { id: bookingId },
      select: { id: true, businessId: true },
    });

    if (!booking) return;

    const connection = await (tx || this.prisma).calendarConnection.findFirst({
      where: { businessId: booking.businessId, status: 'CONNECTED' },
    });

    if (!connection) return;

    await (tx || this.prisma).calendarSyncJob.create({
      data: {
        connectionId: connection.id,
        aggregateType: 'BOOKING',
        aggregateId: bookingId,
        operation,
        status: 'PENDING',
        nextAttemptAt: new Date(),
      },
    });
  }

  async processSyncJob(jobId: string) {
    const job = await this.prisma.calendarSyncJob.findUnique({
      where: { id: jobId },
      include: { connection: true },
    });

    if (!job || job.status === 'COMPLETED' || job.status === 'FAILED_PERMANENT') {
      return;
    }

    try {
      if (job.aggregateType === 'BOOKING') {
        await this.eventService.syncBookingEvent(
          job.connectionId,
          job.aggregateId,
          job.operation as any,
        );
      } else if (job.aggregateType === 'INCREMENTAL_SYNC') {
        await this.executeIncrementalSync(job.connectionId);
      } else if (job.aggregateType === 'FULL_SYNC') {
        await this.executeFullSync(job.connectionId);
      }

      await this.prisma.calendarSyncJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          lockedUntil: null,
          lockedBy: null,
          lastError: null,
        },
      });

      await this.prisma.calendarConnection.update({
        where: { id: job.connectionId },
        data: { lastSuccessfulSyncAt: new Date() },
      });
    } catch (err: any) {
      const nextAttempt = job.attemptCount + 1;
      const isPermanent = nextAttempt >= 5 || err?.status === 403;

      this.logger.error(`Error processing sync job ${jobId} (attempt ${nextAttempt}): ${err.message}`);

      await this.prisma.calendarSyncJob.update({
        where: { id: jobId },
        data: {
          attemptCount: nextAttempt,
          status: isPermanent ? 'FAILED_PERMANENT' : 'FAILED_RETRY',
          nextAttemptAt: new Date(Date.now() + Math.pow(2, nextAttempt) * 1000 * 5),
          lockedUntil: null,
          lockedBy: null,
          lastError: err.message || 'Unknown error',
        },
      });
    }
  }

  async executeIncrementalSync(connectionId: string) {
    const { calendar, connection } = await this.clientService.getAuthenticatedClient(connectionId);
    const calendarId = connection.calendarId;
    if (!calendarId) return;

    const syncState = await this.prisma.calendarSyncState.findUnique({
      where: { connectionId },
    });

    if (!syncState || !syncState.nextSyncToken) {
      return this.executeFullSync(connectionId);
    }

    try {
      const res = await calendar.events.list({
        calendarId,
        syncToken: syncState.nextSyncToken,
      });

      const events = res.data.items || [];
      for (const evt of events) {
        await this.processIncomingEventChange(connectionId, evt);
      }

      await this.prisma.calendarSyncState.update({
        where: { connectionId },
        data: {
          nextSyncToken: res.data.nextSyncToken || syncState.nextSyncToken,
          lastIncrementalSyncAt: new Date(),
          lastSuccessfulSyncAt: new Date(),
        },
      });
    } catch (err: any) {
      if (err?.code === 410) {
        this.logger.warn(`Google Calendar syncToken expired (HTTP 410). Starting Full Sync...`);
        return this.executeFullSync(connectionId);
      }
      throw err;
    }
  }

  async executeFullSync(connectionId: string) {
    const { calendar, connection } = await this.clientService.getAuthenticatedClient(connectionId);
    const calendarId = connection.calendarId;
    if (!calendarId) return;

    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 7); // past 7 days
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 90); // next 90 days

    const res = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    // Clear old external events
    await this.prisma.externalCalendarEvent.deleteMany({
      where: { connectionId },
    });

    const events = res.data.items || [];
    for (const evt of events) {
      await this.processIncomingEventChange(connectionId, evt);
    }

    await this.prisma.calendarSyncState.upsert({
      where: { connectionId },
      create: {
        connectionId,
        nextSyncToken: res.data.nextSyncToken || null,
        lastFullSyncAt: new Date(),
        lastSuccessfulSyncAt: new Date(),
      },
      update: {
        nextSyncToken: res.data.nextSyncToken || null,
        lastFullSyncAt: new Date(),
        lastSuccessfulSyncAt: new Date(),
      },
    });
  }

  private async processIncomingEventChange(connectionId: string, evt: any) {
    if (!evt.id) return;

    if (evt.status === 'cancelled') {
      await this.prisma.externalCalendarEvent.deleteMany({
        where: { connectionId, eventId: evt.id },
      });
      return;
    }

    // Check if this event was generated by TampilKit
    const isManaged = evt.extendedProperties?.private?.source === 'TampilKit-AC';
    const bookingId = evt.extendedProperties?.private?.bookingId;

    if (isManaged && bookingId) {
      // Check for conflict: if remote event start time changed from local booking time
      const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
      const remoteStart = evt.start?.dateTime ? new Date(evt.start.dateTime) : null;

      if (booking && remoteStart && Math.abs(booking.scheduledStartAt.getTime() - remoteStart.getTime()) > 60000) {
        // Record conflict!
        await this.prisma.calendarSyncConflict.create({
          data: {
            connectionId,
            bookingId,
            externalEventId: evt.id,
            conflictType: 'REMOTE_EVENT_CHANGED',
            localSnapshot: {
              scheduledStartAt: booking.scheduledStartAt.toISOString(),
              scheduledEndAt: booking.scheduledEndAt.toISOString(),
              bookingCode: booking.bookingCode,
            },
            remoteSnapshot: {
              summary: evt.summary,
              start: evt.start,
              end: evt.end,
            },
            status: 'OPEN',
          },
        });
      }
      return;
    }

    // External busy event
    const startAt = evt.start?.dateTime ? new Date(evt.start.dateTime) : evt.start?.date ? new Date(evt.start.date) : null;
    const endAt = evt.end?.dateTime ? new Date(evt.end.dateTime) : evt.end?.date ? new Date(evt.end.date) : null;
    const isAllDay = Boolean(evt.start?.date && !evt.start?.dateTime);

    if (startAt && endAt) {
      await this.prisma.externalCalendarEvent.upsert({
        where: {
          connectionId_eventId: {
            connectionId,
            eventId: evt.id,
          },
        },
        create: {
          connectionId,
          eventId: evt.id,
          etag: evt.etag || null,
          summary: evt.summary || null,
          startAt,
          endAt,
          isBusy: evt.transparency !== 'transparent',
          isAllDay,
          sourceType: 'EXTERNAL_BUSY',
          lastObservedAt: new Date(),
        },
        update: {
          etag: evt.etag || null,
          summary: evt.summary || null,
          startAt,
          endAt,
          isBusy: evt.transparency !== 'transparent',
          isAllDay,
          lastObservedAt: new Date(),
        },
      });
    }
  }
}
