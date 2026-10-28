import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, PriceType, Prisma, WorkOrderStatus } from '@prisma/client';
import { normalizeIndonesianPhone } from '@tampilkit-ac/api-contract';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { generateCustomerCode } from '../customers/utils/customer-code.util';
import { BookingCodeService } from '../bookings/services/booking-code.service';
import { BookingPricingService } from '../bookings/services/booking-pricing.service';
import { CalendarSyncService } from '../google-calendar/services/calendar-sync.service';
import {
  AdminAssignTechnicianDto,
  AdminCancelBookingDto,
  AdminConfirmBookingDto,
  AdminReassignTechnicianDto,
  AdminRejectBookingDto,
  AdminRescheduleBookingDto,
  AdminUpdateInternalNotesDto,
} from './dto/admin-booking-actions.dto';
import { AdminBookingListQueryDto } from './dto/admin-booking-list-query.dto';
import {
  AdminCalendarQueryDto,
  AdminCreateManualBookingDto,
  TechnicianScheduleQueryDto,
} from './dto/admin-booking-queries.dto';

@Injectable()
export class AdminBookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingCodeService: BookingCodeService,
    private readonly bookingPricingService: BookingPricingService,
    private readonly calendarSyncService: CalendarSyncService,
  ) {}

  private async getActiveBusiness() {
    const business = await this.prisma.business.findFirst({
      where: { isActive: true },
      include: { settings: true },
    });
    if (!business) {
      throw new NotFoundException('Data bisnis tidak ditemukan.');
    }
    return business;
  }

  async listBookings(query: AdminBookingListQueryDto) {
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
        { bookingCode: { contains: s, mode: 'insensitive' } },
        { customer: { name: { contains: s, mode: 'insensitive' } } },
        { customer: { normalizedPhone: { contains: s } } },
        { serviceNameSnapshot: { contains: s, mode: 'insensitive' } },
      ];
    }

    const page = Math.max(1, query.page);
    const limit = Math.max(1, Math.min(100, query.limit));
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledStartAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, phone: true, normalizedPhone: true, email: true },
          },
          customerAddress: {
            select: { id: true, label: true, fullAddress: true, district: true, city: true },
          },
          service: {
            select: { id: true, name: true, slug: true },
          },
          technician: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          workOrders: {
            select: { id: true, workOrderNumber: true, status: true },
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

  async getBookingById(id: string) {
    const business = await this.getActiveBusiness();
    const booking = await this.prisma.booking.findFirst({
      where: { id, businessId: business.id },
      include: {
        customer: true,
        customerAddress: true,
        serviceArea: true,
        service: true,
        technician: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        bookingUnits: {
          include: { acUnit: true },
        },
        bookingItems: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
        },
        workOrders: {
          include: {
            technician: {
              include: { user: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Pemesanan dengan ID ${id} tidak ditemukan.`);
    }

    return booking;
  }

  async confirmBooking(id: string, dto: AdminConfirmBookingDto, actorUserId: string) {
    const booking = await this.getBookingById(id);
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        `Pemesanan dengan status ${booking.status} tidak dapat dikonfirmasi ulang.`,
      );
    }

    const targetStatus = dto.technicianId || booking.technicianId ? BookingStatus.ASSIGNED : BookingStatus.CONFIRMED;

    return this.prisma.$transaction(async (tx) => {
      let finalTechnicianId = booking.technicianId;

      if (dto.technicianId && dto.technicianId !== booking.technicianId) {
        finalTechnicianId = await this.verifyAndAllocateTechnician(
          tx,
          booking.businessId,
          dto.technicianId,
          booking.occupancyStartAt || booking.scheduledStartAt,
          booking.occupancyEndAt || booking.scheduledEndAt,
          booking.id,
        );
      }

      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: targetStatus,
          technicianId: finalTechnicianId,
          internalNotes: dto.internalNotes ? dto.internalNotes : booking.internalNotes,
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: targetStatus,
          reason: 'Dikonfirmasi oleh Admin',
          actorUserId,
        },
      });

      await tx.bookingAuditLog.create({
        data: {
          bookingId: booking.id,
          actorUserId,
          action: 'CONFIRM_BOOKING',
          fromStatus: booking.status,
          toStatus: targetStatus,
          details: { technicianId: finalTechnicianId, internalNotes: dto.internalNotes },
        },
      });

      await this.calendarSyncService.enqueueBookingSync(tx, booking.id, 'CREATE_EVENT');

      return updated;
    });
  }

  async rejectBooking(id: string, dto: AdminRejectBookingDto, actorUserId: string) {
    const booking = await this.getBookingById(id);
    if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REJECTED) {
      throw new BadRequestException(`Pemesanan dengan status ${booking.status} tidak dapat ditolak.`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Free up resource occupancy
      await tx.resourceOccupancy.updateMany({
        where: { bookingId: booking.id, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      });

      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.REJECTED,
          rejectionReason: dto.reason,
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: BookingStatus.REJECTED,
          reason: dto.reason,
          actorUserId,
        },
      });

      await tx.bookingAuditLog.create({
        data: {
          bookingId: booking.id,
          actorUserId,
          action: 'REJECT_BOOKING',
          fromStatus: booking.status,
          toStatus: BookingStatus.REJECTED,
          details: { reason: dto.reason },
        },
      });

      return updated;
    });
  }

  async assignTechnician(id: string, dto: AdminAssignTechnicianDto, actorUserId: string) {
    const booking = await this.getBookingById(id);
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REJECTED || booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException(
        `Pemesanan dengan status ${booking.status} tidak dapat dialokasikan teknisi.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const allocatedTechId = await this.verifyAndAllocateTechnician(
        tx,
        booking.businessId,
        dto.technicianId,
        booking.occupancyStartAt || booking.scheduledStartAt,
        booking.occupancyEndAt || booking.scheduledEndAt,
        booking.id,
      );

      const newStatus =
        booking.status === BookingStatus.PENDING || booking.status === BookingStatus.CONFIRMED
          ? BookingStatus.ASSIGNED
          : booking.status;

      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          technicianId: allocatedTechId,
          status: newStatus,
        },
      });

      // Also update linked active work orders if any
      await tx.workOrder.updateMany({
        where: {
          bookingId: booking.id,
          status: { in: [WorkOrderStatus.DRAFT, WorkOrderStatus.SCHEDULED, WorkOrderStatus.ASSIGNED] },
        },
        data: { technicianId: allocatedTechId },
      });

      if (booking.status !== newStatus) {
        await tx.bookingStatusHistory.create({
          data: {
            bookingId: booking.id,
            fromStatus: booking.status,
            toStatus: newStatus,
            reason: 'Penugasan Teknisi oleh Admin',
            actorUserId,
          },
        });
      }

      await tx.bookingAuditLog.create({
        data: {
          bookingId: booking.id,
          actorUserId,
          action: 'ASSIGN_TECHNICIAN',
          fromStatus: booking.status,
          toStatus: newStatus,
          details: { technicianId: allocatedTechId, notes: dto.notes },
        },
      });

      await this.calendarSyncService.enqueueBookingSync(tx, booking.id, 'UPDATE_EVENT');

      return updated;
    });
  }

  async reassignTechnician(id: string, dto: AdminReassignTechnicianDto, actorUserId: string) {
    const booking = await this.getBookingById(id);
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REJECTED || booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException(
        `Pemesanan dengan status ${booking.status} tidak dapat dialihkan teknisinya.`,
      );
    }

    const previousTechnicianId = booking.technicianId;

    return this.prisma.$transaction(async (tx) => {
      // Free old active occupancy
      await tx.resourceOccupancy.updateMany({
        where: { bookingId: booking.id, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      });

      const allocatedTechId = await this.verifyAndAllocateTechnician(
        tx,
        booking.businessId,
        dto.technicianId,
        booking.occupancyStartAt || booking.scheduledStartAt,
        booking.occupancyEndAt || booking.scheduledEndAt,
        booking.id,
      );

      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          technicianId: allocatedTechId,
          status: BookingStatus.ASSIGNED,
        },
      });

      // Update linked work orders and record assignment history
      const activeWorkOrders = await tx.workOrder.findMany({
        where: {
          bookingId: booking.id,
          status: { in: [WorkOrderStatus.DRAFT, WorkOrderStatus.SCHEDULED, WorkOrderStatus.ASSIGNED] },
        },
      });

      for (const wo of activeWorkOrders) {
        await tx.workOrder.update({
          where: { id: wo.id },
          data: { technicianId: allocatedTechId },
        });

        await tx.workOrderAssignmentHistory.create({
          data: {
            workOrderId: wo.id,
            fromTechnicianId: previousTechnicianId,
            toTechnicianId: allocatedTechId,
            reason: dto.reason,
            actorUserId,
          },
        });
      }

      await tx.bookingAuditLog.create({
        data: {
          bookingId: booking.id,
          actorUserId,
          action: 'REASSIGN_TECHNICIAN',
          fromStatus: booking.status,
          toStatus: BookingStatus.ASSIGNED,
          details: {
            fromTechnicianId: previousTechnicianId,
            toTechnicianId: allocatedTechId,
            reason: dto.reason,
          },
        },
      });

      await this.calendarSyncService.enqueueBookingSync(tx, booking.id, 'UPDATE_EVENT');

      return updated;
    });
  }

  async rescheduleBooking(id: string, dto: AdminRescheduleBookingDto, actorUserId: string) {
    const booking = await this.getBookingById(id);
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.REJECTED || booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException(
        `Pemesanan dengan status ${booking.status} tidak dapat dijadwalkan ulang.`,
      );
    }

    const business = await this.getActiveBusiness();
    const serviceDuration = booking.estimatedDurationMinutes || 60;
    const serviceBuffer = business.settings?.defaultServiceBufferMinutes || 15;
    const travelBuffer = business.settings?.defaultTravelBufferMinutes || 30;
    const totalOccupancyMinutes = serviceDuration + serviceBuffer + travelBuffer;

    const newScheduledStartAt = new Date(dto.newStartAt);
    const newScheduledEndAt = new Date(newScheduledStartAt.getTime() + serviceDuration * 60 * 1000);
    const newOccupancyStartAt = newScheduledStartAt;
    const newOccupancyEndAt = new Date(newScheduledStartAt.getTime() + totalOccupancyMinutes * 60 * 1000);

    const targetTechId = dto.technicianId || booking.technicianId;

    return this.prisma.$transaction(async (tx) => {
      // Cancel old occupancies
      await tx.resourceOccupancy.updateMany({
        where: { bookingId: booking.id, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      });

      let finalTechId: string | null = null;
      if (targetTechId) {
        finalTechId = await this.verifyAndAllocateTechnician(
          tx,
          booking.businessId,
          targetTechId,
          newOccupancyStartAt,
          newOccupancyEndAt,
          booking.id,
        );
      }

      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          scheduledStartAt: newScheduledStartAt,
          scheduledEndAt: newScheduledEndAt,
          occupancyStartAt: newOccupancyStartAt,
          occupancyEndAt: newOccupancyEndAt,
          technicianId: finalTechId,
          rescheduleCount: { increment: 1 },
        },
      });

      // Update linked work orders
      await tx.workOrder.updateMany({
        where: {
          bookingId: booking.id,
          status: { in: [WorkOrderStatus.DRAFT, WorkOrderStatus.SCHEDULED, WorkOrderStatus.ASSIGNED] },
        },
        data: {
          scheduledStartAt: newScheduledStartAt,
          scheduledEndAt: newScheduledEndAt,
          technicianId: finalTechId,
        },
      });

      await tx.bookingAuditLog.create({
        data: {
          bookingId: booking.id,
          actorUserId,
          action: 'RESCHEDULE',
          fromStatus: booking.status,
          toStatus: booking.status,
          details: {
            oldStartAt: booking.scheduledStartAt,
            newStartAt: newScheduledStartAt,
            reason: dto.reason,
            technicianId: finalTechId,
          },
        },
      });

      await this.calendarSyncService.enqueueBookingSync(tx, booking.id, 'UPDATE_EVENT');

      return updated;
    });
  }

  async cancelBooking(id: string, dto: AdminCancelBookingDto, actorUserId: string) {
    const booking = await this.getBookingById(id);
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException(
        `Pemesanan dengan status ${booking.status} sudah selesai atau dibatalkan.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Cancel active occupancies
      await tx.resourceOccupancy.updateMany({
        where: { bookingId: booking.id, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      });

      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: dto.reason,
        },
      });

      // Also cancel linked work orders if active
      await tx.workOrder.updateMany({
        where: {
          bookingId: booking.id,
          status: {
            notIn: [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED],
          },
        },
        data: {
          status: WorkOrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: `Booking dibatalkan: ${dto.reason}`,
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: BookingStatus.CANCELLED,
          reason: dto.reason,
          actorUserId,
        },
      });

      await tx.bookingAuditLog.create({
        data: {
          bookingId: booking.id,
          actorUserId,
          action: 'CANCEL_BOOKING',
          fromStatus: booking.status,
          toStatus: BookingStatus.CANCELLED,
          details: { reason: dto.reason },
        },
      });

      await this.calendarSyncService.enqueueBookingSync(tx, booking.id, 'DELETE_EVENT');

      return updated;
    });
  }

  async updateInternalNotes(id: string, dto: AdminUpdateInternalNotesDto, actorUserId: string) {
    const booking = await this.getBookingById(id);

    const updated = await this.prisma.booking.update({
      where: { id: booking.id },
      data: { internalNotes: dto.internalNotes },
    });

    await this.prisma.bookingAuditLog.create({
      data: {
        bookingId: booking.id,
        actorUserId,
        action: 'UPDATE_INTERNAL_NOTES',
        details: { previousNotes: booking.internalNotes, newNotes: dto.internalNotes },
      },
    });

    return updated;
  }

  async createManualBooking(dto: AdminCreateManualBookingDto, actorUserId: string) {
    const business = await this.getActiveBusiness();
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, businessId: business.id, isActive: true },
    });
    if (!service) {
      throw new NotFoundException('Layanan tidak ditemukan atau nonaktif.');
    }

    const serviceArea = await this.prisma.serviceArea.findFirst({
      where: { id: dto.serviceAreaId, businessId: business.id, isActive: true },
    });
    if (!serviceArea) {
      throw new BadRequestException('Wilayah operasional tidak valid.');
    }

    const serviceDuration = service.estimatedDurationMinutes * dto.units.length;
    const serviceBuffer = service.additionalBufferMinutes || business.settings?.defaultServiceBufferMinutes || 15;
    const travelBuffer = serviceArea.estimatedTravelMinutes || business.settings?.defaultTravelBufferMinutes || 30;
    const totalOccupancyMinutes = serviceDuration + serviceBuffer + travelBuffer;

    const scheduledStartAt = new Date(dto.selectedStartAt);
    const scheduledEndAt = new Date(scheduledStartAt.getTime() + serviceDuration * 60 * 1000);
    const occupancyStartAt = scheduledStartAt;
    const occupancyEndAt = new Date(scheduledStartAt.getTime() + totalOccupancyMinutes * 60 * 1000);

    const pricing = this.bookingPricingService.calculate(
      service.priceType,
      service.basePrice,
      dto.units.length,
      serviceArea.visitFee,
    );

    const phoneRes = normalizeIndonesianPhone(dto.customerPhone);
    const normalizedPhone = phoneRes.normalized;
    const targetStatus = (dto.status as BookingStatus) || BookingStatus.CONFIRMED;

    return this.prisma.$transaction(async (tx) => {
      // 1. Customer Resolution
      let customer = await tx.customer.findFirst({
        where: { businessId: business.id, normalizedPhone },
      });

      if (!customer) {
        const customerCode = await generateCustomerCode(tx, business.id);

        customer = await tx.customer.create({
          data: {
            businessId: business.id,
            customerCode,
            name: dto.customerName,
            phone: dto.customerPhone,
            normalizedPhone,
            email: dto.customerEmail || null,
          },
        });
      }

      // 2. Customer Address Resolution
      let customerAddress = await tx.customerAddress.findFirst({
        where: {
          customerId: customer.id,
          fullAddress: dto.serviceAddress.fullAddress,
          city: dto.serviceAddress.city,
        },
      });

      if (!customerAddress) {
        customerAddress = await tx.customerAddress.create({
          data: {
            customerId: customer.id,
            label: dto.serviceAddress.recipientName || 'Lokasi Servis',
            recipientName: dto.serviceAddress.recipientName || customer.name,
            recipientPhone: dto.serviceAddress.recipientPhone || customer.phone,
            fullAddress: dto.serviceAddress.fullAddress,
            province: dto.serviceAddress.province || 'DKI Jakarta',
            city: dto.serviceAddress.city,
            district: dto.serviceAddress.district,
            subdistrict: dto.serviceAddress.subdistrict,
            postalCode: dto.serviceAddress.postalCode,
            landmark: dto.serviceAddress.landmark,
            serviceAreaId: serviceArea.id,
            isPrimary: true,
          },
        });
      }

      // 3. Technician Allocation
      let allocatedTechId: string | null = null;
      if (dto.technicianId) {
        allocatedTechId = await this.verifyAndAllocateTechnician(
          tx,
          business.id,
          dto.technicianId,
          occupancyStartAt,
          occupancyEndAt,
        );
      }

      const bookingCode = await this.bookingCodeService.generateCode();

      const booking = await tx.booking.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          customerAddressId: customerAddress.id,
          serviceAreaId: serviceArea.id,
          serviceId: service.id,
          technicianId: allocatedTechId,
          bookingCode,
          bookingSource: 'ADMIN_MANUAL',
          status: allocatedTechId && targetStatus === BookingStatus.PENDING ? BookingStatus.ASSIGNED : targetStatus,
          scheduledStartAt,
          scheduledEndAt,
          occupancyStartAt,
          occupancyEndAt,
          serviceNameSnapshot: service.name,
          priceTypeSnapshot: service.priceType,
          unitCount: dto.units.length,
          estimatedPrice: pricing.estimatedServicePrice ? Number(pricing.estimatedServicePrice) : 0,
          estimatedServicePrice: pricing.estimatedServicePrice ? Number(pricing.estimatedServicePrice) : null,
          visitFeeSnapshot: Number(pricing.visitFee),
          estimatedTotal: pricing.estimatedTotal ? Number(pricing.estimatedTotal) : null,
          estimatedDurationMinutes: serviceDuration,
          customerNotes: dto.customerNotes,
          internalNotes: dto.internalNotes,
        },
      });

      // Link occupancy to booking if allocated
      if (allocatedTechId) {
        await tx.resourceOccupancy.updateMany({
          where: {
            technicianId: allocatedTechId,
            startsAt: occupancyStartAt,
            endsAt: occupancyEndAt,
            bookingId: null,
          },
          data: { bookingId: booking.id },
        });
      }

      // Create Booking Items
      for (const unit of dto.units) {
        await tx.bookingItem.create({
          data: {
            bookingId: booking.id,
            serviceId: service.id,
            brandSnapshot: unit.brand,
            modelSnapshot: unit.model,
            typeSnapshot: unit.type,
            capacityPkSnapshot: unit.capacityPk ? Number(unit.capacityPk) : null,
            installationRoomSnapshot: unit.installationRoom,
            unitPriceSnapshot: service.basePrice ? Number(service.basePrice) : null,
            estimatedDurationMinutes: service.estimatedDurationMinutes,
            notes: unit.notes,
          },
        });
      }

      // History & Audit
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          fromStatus: null,
          toStatus: booking.status,
          reason: 'Pemesanan dibuat manual oleh Admin',
          actorUserId,
        },
      });

      await tx.bookingAuditLog.create({
        data: {
          bookingId: booking.id,
          actorUserId,
          action: 'CREATE_MANUAL_BOOKING',
          toStatus: booking.status,
          details: { bookingCode, source: 'ADMIN_MANUAL' },
        },
      });

      if (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.ASSIGNED) {
        await this.calendarSyncService.enqueueBookingSync(tx, booking.id, 'CREATE_EVENT');
      }

      return booking;
    });
  }

  async getCalendarEvents(query: AdminCalendarQueryDto) {
    const business = await this.getActiveBusiness();
    const startDate = new Date(`${query.startDate}T00:00:00.000Z`);
    const endDate = new Date(`${query.endDate}T23:59:59.999Z`);

    const where: any = {
      businessId: business.id,
      scheduledStartAt: { gte: startDate, lte: endDate },
    };

    if (query.technicianId) {
      where.technicianId = query.technicianId;
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      orderBy: { scheduledStartAt: 'asc' },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        customerAddress: { select: { district: true, city: true } },
        service: { select: { name: true } },
        technician: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    return bookings.map((b) => ({
      id: b.id,
      bookingCode: b.bookingCode,
      title: `${b.serviceNameSnapshot || b.service.name} - ${b.customer.name}`,
      start: b.scheduledStartAt.toISOString(),
      end: b.scheduledEndAt.toISOString(),
      status: b.status,
      customerName: b.customer.name,
      customerPhone: b.customer.phone,
      location: `${b.customerAddress.district}, ${b.customerAddress.city}`,
      technicianName: b.technician?.user?.name || 'Belum ditugaskan',
      unitCount: b.unitCount,
      estimatedTotal: b.estimatedTotal,
    }));
  }

  async getTechniciansSchedule(query: TechnicianScheduleQueryDto) {
    const business = await this.getActiveBusiness();
    const dayStart = new Date(`${query.date}T00:00:00.000Z`);
    const dayEnd = new Date(`${query.date}T23:59:59.999Z`);

    const technicianWhere: Prisma.TechnicianWhereInput = { businessId: business.id, isActive: true };
    if (query.technicianId) {
      technicianWhere.id = query.technicianId;
    }

    const technicians = await this.prisma.technician.findMany({
      where: technicianWhere,
      include: {
        user: { select: { id: true, name: true, email: true } },
        occupancies: {
          where: {
            status: 'ACTIVE',
            startsAt: { lt: dayEnd },
            endsAt: { gt: dayStart },
          },
          include: {
            booking: {
              select: {
                id: true,
                bookingCode: true,
                status: true,
                serviceNameSnapshot: true,
                customer: { select: { name: true, phone: true } },
                customerAddress: { select: { fullAddress: true, district: true } },
              },
            },
          },
        },
        workOrders: {
          where: {
            status: { notIn: [WorkOrderStatus.CANCELLED] },
            scheduledStartAt: { lt: dayEnd },
            scheduledEndAt: { gt: dayStart },
          },
          select: {
            id: true,
            workOrderNumber: true,
            status: true,
            scheduledStartAt: true,
            scheduledEndAt: true,
          },
        },
      },
    });

    return technicians.map((tech) => ({
      technicianId: tech.id,
      name: tech.user.name,
      email: tech.user.email,
      totalOccupancies: tech.occupancies.length,
      occupancies: tech.occupancies.map((occ: any) => ({
        id: occ.id,
        startsAt: occ.startsAt,
        endsAt: occ.endsAt,
        booking: occ.booking,
      })),
      workOrders: tech.workOrders,
    }));
  }

  private async verifyAndAllocateTechnician(
    tx: any,
    businessId: string,
    technicianId: string,
    occupancyStartAt: Date,
    occupancyEndAt: Date,
    excludeBookingId?: string,
  ): Promise<string> {
    const tech = await tx.technician.findFirst({
      where: { id: technicianId, businessId, isActive: true },
    });
    if (!tech) {
      throw new NotFoundException('Teknisi tidak ditemukan atau tidak aktif.');
    }

    // Try advisory lock
    const lockResult = await tx.$queryRaw<Array<{ locked: boolean }>>`
      SELECT pg_try_advisory_xact_lock(hashtext(${technicianId})) as locked
    `;
    if (!lockResult?.[0]?.locked) {
      throw new ConflictException(
        'Teknisi sedang dalam proses penugasan lain. Silakan coba sesaat lagi.',
      );
    }

    // Check conflict
    const conflictWhere: any = {
      technicianId,
      status: 'ACTIVE',
      startsAt: { lt: occupancyEndAt },
      endsAt: { gt: occupancyStartAt },
    };
    if (excludeBookingId) {
      conflictWhere.NOT = { bookingId: excludeBookingId };
    }

    const hasConflict = await tx.resourceOccupancy.findFirst({
      where: conflictWhere,
    });

    if (hasConflict) {
      throw new ConflictException(
        'Jadwal teknisi berbenturan dengan agenda atau tugas lain di waktu yang sama.',
      );
    }

    // Free any existing active occupancies for this booking to avoid exclusion constraint conflicts
    if (excludeBookingId) {
      await tx.resourceOccupancy.updateMany({
        where: { bookingId: excludeBookingId, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      });
    }

    // Create resource occupancy
    await tx.resourceOccupancy.create({
      data: {
        businessId,
        technicianId,
        startsAt: occupancyStartAt,
        endsAt: occupancyEndAt,
        status: 'ACTIVE',
        bookingId: excludeBookingId || null,
      },
    });

    return technicianId;
  }
}
