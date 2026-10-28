import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { GoogleCalendarClientService } from './google-calendar-client.service';

@Injectable()
export class GoogleEventService {
  private readonly logger = new Logger(GoogleEventService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clientService: GoogleCalendarClientService,
  ) {}

  private formatEventPayload(booking: any, timeZone: string, version: number) {
    const summary = `Service AC — ${booking.serviceNameSnapshot || 'Perawatan AC'} — ${booking.bookingCode}`;
    const technicianName = booking.technician?.user?.name || 'Belum Dialokasikan';

    const description = [
      `Kode Booking: ${booking.bookingCode}`,
      `Layanan: ${booking.serviceNameSnapshot || '-'}`,
      `Jumlah Unit: ${booking.unitCount || 1} Unit`,
      `Teknisi: ${technicianName}`,
      `Status: ${booking.status}`,
    ].join('\n');

    const location = booking.customerAddress
      ? `${booking.customerAddress.fullAddress}, ${booking.customerAddress.district}, ${booking.customerAddress.city}`
      : undefined;

    return {
      summary,
      description,
      location,
      start: {
        dateTime: booking.scheduledStartAt.toISOString(),
        timeZone,
      },
      end: {
        dateTime: booking.scheduledEndAt.toISOString(),
        timeZone,
      },
      extendedProperties: {
        private: {
          bookingId: booking.id,
          bookingCode: booking.bookingCode,
          source: 'TampilKit-AC',
          aggregateVersion: String(version),
        },
      },
    };
  }

  async syncBookingEvent(
    connectionId: string,
    bookingId: string,
    operation: 'CREATE_EVENT' | 'UPDATE_EVENT' | 'DELETE_EVENT',
  ) {
    const { calendar, connection } = await this.clientService.getAuthenticatedClient(connectionId);
    const calendarId = connection.calendarId;

    if (!calendarId) {
      this.logger.warn(`Koneksi ${connectionId} belum memilih kalender tujuan.`);
      return;
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        customerAddress: true,
        technician: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    const existingMapping = await this.prisma.calendarEventMapping.findUnique({
      where: { bookingId },
    });

    if (operation === 'DELETE_EVENT' || (booking && booking.status === 'CANCELLED')) {
      if (existingMapping) {
        try {
          await calendar.events.delete({
            calendarId,
            eventId: existingMapping.externalEventId,
          });
        } catch (err: any) {
          // If already 404 or 410, it's already gone
          if (err?.code !== 404 && err?.code !== 410) {
            throw err;
          }
        }
        await this.prisma.calendarEventMapping.delete({
          where: { id: existingMapping.id },
        });
      }
      return;
    }

    if (!booking) {
      throw new NotFoundException(`Booking dengan ID ${bookingId} tidak ditemukan.`);
    }

    const nextVersion = (existingMapping?.aggregateVersion || 0) + 1;
    const eventPayload = this.formatEventPayload(
      booking,
      connection.calendarTimezone || 'Asia/Jakarta',
      nextVersion,
    );

    if (existingMapping) {
      // Update existing Google Calendar event
      try {
        const updated = await calendar.events.update({
          calendarId,
          eventId: existingMapping.externalEventId,
          requestBody: eventPayload,
        });

        await this.prisma.calendarEventMapping.update({
          where: { id: existingMapping.id },
          data: {
            externalEventEtag: updated.data.etag || existingMapping.externalEventEtag,
            aggregateVersion: nextVersion,
            syncStatus: 'SYNCED',
            lastSyncedAt: new Date(),
            lastError: null,
          },
        });
      } catch (err: any) {
        if (err?.code === 404 || err?.code === 410) {
          // Event was deleted in Google! Re-create
          this.logger.warn(`Event ${existingMapping.externalEventId} terhapus di Google Calendar. Membuat ulang...`);
          const created = await calendar.events.insert({
            calendarId,
            requestBody: eventPayload,
          });

          await this.prisma.calendarEventMapping.update({
            where: { id: existingMapping.id },
            data: {
              externalEventId: created.data.id || existingMapping.externalEventId,
              externalEventEtag: created.data.etag,
              aggregateVersion: nextVersion,
              syncStatus: 'SYNCED',
              lastSyncedAt: new Date(),
              lastError: null,
            },
          });
        } else {
          throw err;
        }
      }
    } else {
      // Insert new Google Calendar event
      const created = await calendar.events.insert({
        calendarId,
        requestBody: eventPayload,
      });

      await this.prisma.calendarEventMapping.create({
        data: {
          calendarConnectionId: connection.id,
          bookingId: booking.id,
          externalEventId: created.data.id!,
          externalEventEtag: created.data.etag,
          aggregateVersion: nextVersion,
          syncStatus: 'SYNCED',
          lastSyncedAt: new Date(),
        },
      });
    }
  }
}
