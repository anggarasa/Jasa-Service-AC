import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { GoogleFreeBusyService } from '../google-calendar/services/google-freebusy.service';
import { PublicAvailabilityQueryDto } from './dto/public-availability-query.dto';

export interface TimeSlotResult {
  start: string;
  end: string;
  startIso: string;
  endIso: string;
  available: boolean;
}

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly freeBusyService: GoogleFreeBusyService,
  ) {}

  async getPublicAvailability(query: PublicAvailabilityQueryDto) {
    const business = await this.prisma.business.findFirst({
      where: { isActive: true },
      include: {
        settings: true,
      },
    });

    if (!business) {
      throw new NotFoundException('Data bisnis belum dikonfigurasi.');
    }

    const settings = business.settings || {
      bookingEnabled: true,
      bookingIntervalMinutes: 30,
      defaultServiceBufferMinutes: 15,
      defaultTravelBufferMinutes: 30,
      minimumAdvanceMinutes: 120,
      maximumAdvanceDays: 30,
      pendingHoldMinutes: 120,
    };

    if (!settings.bookingEnabled) {
      return {
        date: query.date,
        timezone: business.timezone || 'Asia/Jakarta',
        estimatedDurationMinutes: 0,
        slots: [],
      };
    }

    const service = await this.prisma.service.findFirst({
      where: { id: query.serviceId, businessId: business.id, isActive: true },
    });
    if (!service) {
      throw new NotFoundException('Layanan yang dipilih tidak aktif atau tidak ditemukan.');
    }

    const serviceArea = await this.prisma.serviceArea.findFirst({
      where: { id: query.serviceAreaId, businessId: business.id, isActive: true },
    });
    if (!serviceArea) {
      throw new BadRequestException('Wilayah operasional tidak aktif atau tidak ditemukan.');
    }

    const [year, month, day] = query.date.split('-').map(Number);
    const dayOfWeek = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();

    // Check Business Closures
    const dateStartUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const dateEndUtc = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    const closure = await this.prisma.businessClosure.findFirst({
      where: {
        businessId: business.id,
        isActive: true,
        startDate: { lte: dateEndUtc },
        endDate: { gte: dateStartUtc },
      },
    });

    if (closure) {
      return {
        date: query.date,
        timezone: business.timezone || 'Asia/Jakarta',
        estimatedDurationMinutes: service.estimatedDurationMinutes * query.unitCount,
        slots: [],
      };
    }

    // Check Operating Hours
    const operatingHour = await this.prisma.businessOperatingHour.findFirst({
      where: {
        businessId: business.id,
        dayOfWeek,
      },
      include: {
        breaks: true,
      },
    });

    if (!operatingHour || !operatingHour.isOpen) {
      return {
        date: query.date,
        timezone: business.timezone || 'Asia/Jakarta',
        estimatedDurationMinutes: service.estimatedDurationMinutes * query.unitCount,
        slots: [],
      };
    }

    // Durations and buffers
    const serviceDuration = service.estimatedDurationMinutes * query.unitCount;
    const serviceBuffer = service.additionalBufferMinutes || settings.defaultServiceBufferMinutes || 15;
    const travelBuffer = serviceArea.estimatedTravelMinutes || settings.defaultTravelBufferMinutes || 30;
    const totalOccupancyMinutes = serviceDuration + serviceBuffer + travelBuffer;

    // Active Technicians
    const technicians = await this.prisma.technician.findMany({
      where: {
        businessId: business.id,
        isActive: true,
      },
      select: { id: true },
    });

    if (technicians.length === 0) {
      return {
        date: query.date,
        timezone: business.timezone || 'Asia/Jakarta',
        estimatedDurationMinutes: serviceDuration,
        slots: [],
      };
    }

    const technicianIds = technicians.map((t) => t.id);

    // Fetch existing active occupancies and blocks for this date window
    // Window from start of day to end of day + 6 hours
    const windowStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const windowEnd = new Date(Date.UTC(year, month - 1, day + 1, 6, 0, 0));

    const [existingOccupancies, existingBlocks, freeBusyData] = await Promise.all([
      this.prisma.resourceOccupancy.findMany({
        where: {
          technicianId: { in: technicianIds },
          status: 'ACTIVE',
          startsAt: { lt: windowEnd },
          endsAt: { gt: windowStart },
        },
      }),
      this.prisma.technicianBlock.findMany({
        where: {
          technicianId: { in: technicianIds },
          isActive: true,
          startsAt: { lt: windowEnd },
          endsAt: { gt: windowStart },
        },
      }),
      this.freeBusyService.getExternalBusyIntervals(business.id, windowStart, windowEnd),
    ]);

    if (freeBusyData.isFailClosed) {
      return {
        date: query.date,
        timezone: business.timezone || 'Asia/Jakarta',
        estimatedDurationMinutes: serviceDuration,
        slots: [],
      };
    }

    // Parse open and close times
    const [openH, openM] = operatingHour.openTime.split(':').map(Number);
    const [closeH, closeM] = operatingHour.closeTime.split(':').map(Number);
    const openTotalMinutes = openH * 60 + openM;
    const closeTotalMinutes = closeH * 60 + closeM;

    const breaks = (operatingHour.breaks || []).map((b) => {
      const [bStartH, bStartM] = b.startTime.split(':').map(Number);
      const [bEndH, bEndM] = b.endTime.split(':').map(Number);
      return {
        startMin: bStartH * 60 + bStartM,
        endMin: bEndH * 60 + bEndM,
      };
    });

    const intervalMinutes = settings.bookingIntervalMinutes || 30;
    const minAdvanceMinutes = settings.minimumAdvanceMinutes || 120;
    const now = new Date();
    const minBookingTime = new Date(now.getTime() + minAdvanceMinutes * 60 * 1000);

    const slots: TimeSlotResult[] = [];

    for (
      let currentMinutes = openTotalMinutes;
      currentMinutes + serviceDuration <= closeTotalMinutes;
      currentMinutes += intervalMinutes
    ) {
      const slotEndMinutes = currentMinutes + serviceDuration;

      // Check break overlaps
      const overlapsBreak = breaks.some(
        (b) => currentMinutes < b.endMin && slotEndMinutes > b.startMin,
      );
      if (overlapsBreak) {
        continue;
      }

      const startH = Math.floor(currentMinutes / 60);
      const startM = currentMinutes % 60;
      const endH = Math.floor(slotEndMinutes / 60);
      const endM = slotEndMinutes % 60;

      const startFormatted = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
      const endFormatted = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      // In Jakarta (UTC+7), UTC time is local time minus 7 hours
      const slotStartUtc = new Date(Date.UTC(year, month - 1, day, startH - 7, startM, 0));
      const slotEndUtc = new Date(slotStartUtc.getTime() + serviceDuration * 60 * 1000);
      const occupancyEndUtc = new Date(slotStartUtc.getTime() + totalOccupancyMinutes * 60 * 1000);

      // Check min advance time
      if (slotStartUtc.getTime() < minBookingTime.getTime()) {
        continue;
      }

      // Check external busy intervals from Google Calendar (blocks all technicians)
      const hasExternalBusyConflict = freeBusyData.busyIntervals.some(
        (busy) => busy.start < occupancyEndUtc && busy.end > slotStartUtc,
      );
      if (hasExternalBusyConflict) {
        continue;
      }

      // Check if ANY technician is free for this interval
      const hasAvailableTechnician = technicianIds.some((techId) => {
        const hasOccupancyConflict = existingOccupancies.some(
          (occ) =>
            occ.technicianId === techId &&
            occ.startsAt < occupancyEndUtc &&
            occ.endsAt > slotStartUtc,
        );
        if (hasOccupancyConflict) return false;

        const hasBlockConflict = existingBlocks.some(
          (blk) =>
            blk.technicianId === techId &&
            blk.startsAt < occupancyEndUtc &&
            blk.endsAt > slotStartUtc,
        );
        if (hasBlockConflict) return false;

        return true;
      });

      if (hasAvailableTechnician) {
        slots.push({
          start: startFormatted,
          end: endFormatted,
          startIso: slotStartUtc.toISOString(),
          endIso: slotEndUtc.toISOString(),
          available: true,
        });
      }
    }

    return {
      date: query.date,
      timezone: business.timezone || 'Asia/Jakarta',
      estimatedDurationMinutes: serviceDuration,
      slots,
    };
  }
}
