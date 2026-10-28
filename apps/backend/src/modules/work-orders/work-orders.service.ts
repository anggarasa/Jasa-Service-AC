import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, WorkOrderStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  AssignWorkOrderTechnicianDto,
  CancelWorkOrderDto,
  CreateWorkOrderDto,
  UpdateWorkOrderStatusDto,
  WorkOrderListQueryDto,
} from './dto/work-order.dto';

@Injectable()
export class WorkOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private async getActiveBusiness() {
    const business = await this.prisma.business.findFirst({
      where: { isActive: true },
    });
    if (!business) {
      throw new NotFoundException('Data bisnis tidak ditemukan.');
    }
    return business;
  }

  private async generateWorkOrderNumber(tx: any, businessId: string): Promise<string> {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const prefix = `WO-${datePart}-`;

    const countToday = await tx.workOrder.count({
      where: {
        businessId,
        workOrderNumber: { startsWith: prefix },
      },
    });

    const sequence = String(countToday + 1).padStart(4, '0');
    return `${prefix}${sequence}`;
  }

  async createFromBooking(dto: CreateWorkOrderDto, actorUserId: string) {
    const business = await this.getActiveBusiness();

    const booking = await this.prisma.booking.findFirst({
      where: { id: dto.bookingId, businessId: business.id },
      include: {
        customer: true,
        customerAddress: true,
        bookingItems: true,
        technician: true,
        workOrders: {
          where: {
            status: { notIn: [WorkOrderStatus.CANCELLED] },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Pemesanan dengan ID ${dto.bookingId} tidak ditemukan.`);
    }

    if (
      booking.status !== BookingStatus.CONFIRMED &&
      booking.status !== BookingStatus.ASSIGNED &&
      booking.status !== BookingStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        `SPK hanya dapat dibuat dari pemesanan berstatus Dikonfirmasi (CONFIRMED) atau Ditugaskan (ASSIGNED). Status saat ini: ${booking.status}`,
      );
    }

    if (booking.workOrders.length > 0) {
      throw new ConflictException(
        `Pemesanan ini sudah memiliki SPK aktif dengan nomor ${booking.workOrders[0].workOrderNumber}.`,
      );
    }

    const technicianId = dto.technicianId || booking.technicianId || null;

    return this.prisma.$transaction(async (tx) => {
      const workOrderNumber = await this.generateWorkOrderNumber(tx, business.id);

      const workOrder = await tx.workOrder.create({
        data: {
          workOrderNumber,
          businessId: business.id,
          bookingId: booking.id,
          customerId: booking.customerId,
          customerAddressId: booking.customerAddressId,
          technicianId,
          status: dto.status || (technicianId ? WorkOrderStatus.ASSIGNED : WorkOrderStatus.SCHEDULED),
          scheduledStartAt: booking.scheduledStartAt,
          scheduledEndAt: booking.scheduledEndAt,
          serviceSummarySnapshot: booking.serviceNameSnapshot,
          customerComplaintSnapshot: booking.customerNotes,
          adminInstructions: dto.adminInstructions,
          createdByUserId: actorUserId,
        },
      });

      // Snapshot booking items to work order items
      for (const item of booking.bookingItems) {
        await tx.workOrderItem.create({
          data: {
            workOrderId: workOrder.id,
            acUnitId: item.acUnitId,
            serviceId: item.serviceId,
            serviceNameSnapshot: item.brandSnapshot
              ? `${booking.serviceNameSnapshot || 'Servis AC'} - ${item.brandSnapshot}`
              : booking.serviceNameSnapshot || 'Servis AC',
            unitPriceSnapshot: item.unitPriceSnapshot || 0,
            quantity: 1,
            itemTotal: item.unitPriceSnapshot || 0,
            actionNotes: item.notes,
          },
        });
      }

      // History
      await tx.workOrderStatusHistory.create({
        data: {
          workOrderId: workOrder.id,
          fromStatus: null,
          toStatus: workOrder.status,
          reason: 'SPK Diterbitkan',
          actorUserId,
        },
      });

      if (technicianId) {
        await tx.workOrderAssignmentHistory.create({
          data: {
            workOrderId: workOrder.id,
            fromTechnicianId: null,
            toTechnicianId: technicianId,
            reason: 'Penugasan awal teknisi pada pembuatan SPK',
            actorUserId,
          },
        });

        // Ensure booking is marked ASSIGNED
        if (booking.status === BookingStatus.CONFIRMED) {
          await tx.booking.update({
            where: { id: booking.id },
            data: { status: BookingStatus.ASSIGNED, technicianId },
          });
        }
      }

      // Audit Log on booking
      await tx.bookingAuditLog.create({
        data: {
          bookingId: booking.id,
          actorUserId,
          action: 'CREATE_WORK_ORDER',
          details: { workOrderId: workOrder.id, workOrderNumber },
        },
      });

      return workOrder;
    });
  }

  async listWorkOrders(query: WorkOrderListQueryDto) {
    const business = await this.getActiveBusiness();
    const where: any = { businessId: business.id };

    if (query.status) {
      where.status = query.status;
    }
    if (query.technicianId) {
      where.technicianId = query.technicianId;
    }
    if (query.startDate || query.endDate) {
      where.scheduledStartAt = {};
      if (query.startDate) {
        where.scheduledStartAt.gte = new Date(`${query.startDate}T00:00:00.000Z`);
      }
      if (query.endDate) {
        where.scheduledStartAt.lte = new Date(`${query.endDate}T23:59:59.999Z`);
      }
    }
    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { workOrderNumber: { contains: s, mode: 'insensitive' } },
        { customer: { name: { contains: s, mode: 'insensitive' } } },
        { customer: { normalizedPhone: { contains: s } } },
        { booking: { bookingCode: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const page = Math.max(1, query.page);
    const limit = Math.max(1, Math.min(100, query.limit));
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.workOrder.count({ where }),
      this.prisma.workOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledStartAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, phone: true, normalizedPhone: true },
          },
          customerAddress: {
            select: { id: true, label: true, fullAddress: true, district: true, city: true },
          },
          technician: {
            include: {
              user: { select: { id: true, name: true } },
            },
          },
          booking: {
            select: { id: true, bookingCode: true, status: true, estimatedTotal: true },
          },
          items: true,
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

  async getWorkOrderById(id: string) {
    const business = await this.getActiveBusiness();
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id, businessId: business.id },
      include: {
        customer: true,
        customerAddress: true,
        technician: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        booking: {
          include: {
            service: true,
          },
        },
        items: {
          include: {
            acUnit: true,
            inspection: true,
            checklistItems: {
              orderBy: { displayOrder: 'asc' },
            },
            photos: {
              include: { mediaAsset: true },
            },
          },
        },
        photos: {
          include: {
            mediaAsset: true,
            workOrderItem: {
              select: {
                id: true,
                serviceNameSnapshot: true,
                acUnit: { select: { brand: true, model: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        serviceReport: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        assignmentHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!workOrder) {
      throw new NotFoundException(`Surat Perintah Kerja dengan ID ${id} tidak ditemukan.`);
    }

    return workOrder;
  }

  async updateStatus(id: string, dto: UpdateWorkOrderStatusDto, actorUserId: string) {
    const workOrder = await this.getWorkOrderById(id);

    if (workOrder.status === WorkOrderStatus.COMPLETED || workOrder.status === WorkOrderStatus.CANCELLED) {
      throw new BadRequestException(
        `SPK dengan status ${workOrder.status} sudah bersifat final dan tidak dapat diubah statusnya.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {
        status: dto.status,
      };

      if (dto.diagnosis !== undefined) {
        updateData.diagnosis = dto.diagnosis;
      }
      if (dto.technicianNotes !== undefined) {
        updateData.technicianNotes = dto.technicianNotes;
      }
      if (dto.status === WorkOrderStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }

      const updated = await tx.workOrder.update({
        where: { id: workOrder.id },
        data: updateData,
      });

      await tx.workOrderStatusHistory.create({
        data: {
          workOrderId: workOrder.id,
          fromStatus: workOrder.status,
          toStatus: dto.status,
          reason: dto.reason || `Status diubah menjadi ${dto.status}`,
          actorUserId,
        },
      });

      // Synchronize booking status if needed
      const booking = await tx.booking.findUnique({
        where: { id: workOrder.bookingId },
      });

      if (booking) {
        if (dto.status === WorkOrderStatus.IN_PROGRESS && booking.status !== BookingStatus.IN_PROGRESS) {
          await tx.booking.update({
            where: { id: workOrder.bookingId },
            data: { status: BookingStatus.IN_PROGRESS },
          });
        } else if (dto.status === WorkOrderStatus.COMPLETED && booking.status !== BookingStatus.COMPLETED) {
          await tx.booking.update({
            where: { id: workOrder.bookingId },
            data: { status: BookingStatus.COMPLETED },
          });
        }
      }

      return updated;
    });
  }

  async assignTechnician(id: string, dto: AssignWorkOrderTechnicianDto, actorUserId: string) {
    const workOrder = await this.getWorkOrderById(id);

    if (workOrder.status === WorkOrderStatus.COMPLETED || workOrder.status === WorkOrderStatus.CANCELLED) {
      throw new BadRequestException(
        `SPK dengan status ${workOrder.status} tidak dapat diubah teknisinya.`,
      );
    }

    const tech = await this.prisma.technician.findFirst({
      where: { id: dto.technicianId, businessId: workOrder.businessId, isActive: true },
    });
    if (!tech) {
      throw new NotFoundException('Teknisi tidak ditemukan atau tidak aktif.');
    }

    const previousTechId = workOrder.technicianId;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id: workOrder.id },
        data: {
          technicianId: dto.technicianId,
          status: workOrder.status === WorkOrderStatus.DRAFT || workOrder.status === WorkOrderStatus.SCHEDULED
            ? WorkOrderStatus.ASSIGNED
            : workOrder.status,
        },
      });

      await tx.workOrderAssignmentHistory.create({
        data: {
          workOrderId: workOrder.id,
          fromTechnicianId: previousTechId,
          toTechnicianId: dto.technicianId,
          reason: dto.reason || 'Penugasan teknisi melalui SPK',
          actorUserId,
        },
      });

      // Also sync to booking
      await tx.booking.update({
        where: { id: workOrder.bookingId },
        data: {
          technicianId: dto.technicianId,
          status: BookingStatus.ASSIGNED,
        },
      });

      return updated;
    });
  }

  async cancelWorkOrder(id: string, dto: CancelWorkOrderDto, actorUserId: string) {
    const workOrder = await this.getWorkOrderById(id);

    if (workOrder.status === WorkOrderStatus.COMPLETED || workOrder.status === WorkOrderStatus.CANCELLED) {
      throw new BadRequestException(
        `SPK dengan status ${workOrder.status} tidak dapat dibatalkan.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id: workOrder.id },
        data: {
          status: WorkOrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: dto.reason,
        },
      });

      await tx.workOrderStatusHistory.create({
        data: {
          workOrderId: workOrder.id,
          fromStatus: workOrder.status,
          toStatus: WorkOrderStatus.CANCELLED,
          reason: dto.reason,
          actorUserId,
        },
      });

      return updated;
    });
  }
}
