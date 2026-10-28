import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CalendarSyncService } from './calendar-sync.service';

@Injectable()
export class CalendarConflictService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly syncService: CalendarSyncService,
  ) {}

  async listConflicts(businessId: string, page = 1, limit = 10, status = 'OPEN') {
    const connection = await this.prisma.calendarConnection.findFirst({
      where: { businessId },
    });

    if (!connection) {
      return { items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    }

    const where: any = { connectionId: connection.id };
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      this.prisma.calendarSyncConflict.count({ where }),
      this.prisma.calendarSyncConflict.findMany({
        where,
        skip,
        take: limit,
        orderBy: { detectedAt: 'desc' },
        include: {
          booking: {
            select: {
              id: true,
              bookingCode: true,
              scheduledStartAt: true,
              scheduledEndAt: true,
              customer: { select: { name: true } },
            },
          },
        },
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

  async getConflictById(id: string) {
    const conflict = await this.prisma.calendarSyncConflict.findUnique({
      where: { id },
      include: {
        booking: {
          include: { customer: true, technician: true },
        },
      },
    });

    if (!conflict) {
      throw new NotFoundException(`Konflik dengan ID ${id} tidak ditemukan.`);
    }

    return conflict;
  }

  async resolveConflict(
    conflictId: string,
    action: 'RESTORE_LOCAL' | 'ACCEPT_REMOTE' | 'IGNORE',
    userId: string,
    notes?: string,
  ) {
    const conflict = await this.getConflictById(conflictId);

    if (action === 'RESTORE_LOCAL' && conflict.bookingId) {
      // Enqueue job to re-sync local booking to Google
      await this.prisma.calendarSyncJob.create({
        data: {
          connectionId: conflict.connectionId,
          aggregateType: 'BOOKING',
          aggregateId: conflict.bookingId,
          operation: 'UPDATE_EVENT',
          status: 'PENDING',
        },
      });
    }

    const updated = await this.prisma.calendarSyncConflict.update({
      where: { id: conflictId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedByUserId: userId,
        resolutionNotes: notes || `Tindakan: ${action}`,
      },
    });

    return updated;
  }
}
