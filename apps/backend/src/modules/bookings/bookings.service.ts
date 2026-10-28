import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BookingStatus, PriceType } from '@prisma/client';
import { normalizeIndonesianPhone } from '@tampilkit-ac/api-contract';
import * as crypto from 'crypto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { generateCustomerCode } from '../customers/utils/customer-code.util';
import { CreateGuestBookingDto } from './dto/create-guest-booking.dto';
import { BookingAccessService } from './services/booking-access.service';
import { BookingCodeService } from './services/booking-code.service';
import { BookingPricingService } from './services/booking-pricing.service';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingCodeService: BookingCodeService,
    private readonly bookingAccessService: BookingAccessService,
    private readonly bookingPricingService: BookingPricingService,
  ) {}

  async createGuestBooking(dto: CreateGuestBookingDto) {
    const business = await this.prisma.business.findFirst({
      where: { isActive: true },
      include: { settings: true },
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
      autoConfirmBooking: false,
    };

    if (!settings.bookingEnabled) {
      throw new BadRequestException('Sistem pemesanan servis saat ini sedang dinonaktifkan.');
    }

    // 1. Idempotency Check
    const keyHash = crypto
      .createHash('sha256')
      .update(`${business.id}:${dto.idempotencyKey}`)
      .digest('hex');

    const fingerprint = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          serviceId: dto.serviceId,
          units: dto.units,
          serviceAreaId: dto.serviceAreaId,
          startAt: dto.selectedStartAt,
          phone: dto.customerPhone,
        }),
      )
      .digest('hex');

    const existingIdempotency = await this.prisma.bookingIdempotency.findUnique({
      where: { keyHash },
    });

    if (existingIdempotency) {
      if (existingIdempotency.state === 'COMMITTED') {
        if (existingIdempotency.requestFingerprint === fingerprint) {
          return existingIdempotency.responsePayload;
        }
        throw new ConflictException(
          'Kunci idempotensi (idempotency key) sudah pernah digunakan dengan parameter berbeda.',
        );
      }
      throw new ConflictException(
        'Permintaan pemesanan sedang diproses. Mohon tunggu sejenak sebelum mencoba lagi.',
      );
    }

    // Record initial IN_PROGRESS idempotency
    await this.prisma.bookingIdempotency.create({
      data: {
        businessId: business.id,
        keyHash,
        requestFingerprint: fingerprint,
        state: 'IN_PROGRESS',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    try {
      // 2. Validate Service and Service Area
      const service = await this.prisma.service.findFirst({
        where: { id: dto.serviceId, businessId: business.id, isActive: true },
      });
      if (!service) {
        throw new NotFoundException('Layanan yang dipilih tidak aktif atau tidak ditemukan.');
      }

      if (dto.units.length < service.minimumUnits || dto.units.length > service.maximumUnits) {
        throw new BadRequestException(
          `Jumlah unit AC untuk layanan ${service.name} harus antara ${service.minimumUnits} s/d ${service.maximumUnits} unit.`,
        );
      }

      const serviceArea = await this.prisma.serviceArea.findFirst({
        where: { id: dto.serviceAreaId, businessId: business.id, isActive: true },
      });
      if (!serviceArea) {
        throw new BadRequestException('Wilayah operasional tidak aktif atau tidak ditemukan.');
      }

      // 3. Durations and Occupancy Window
      const serviceDuration = service.estimatedDurationMinutes * dto.units.length;
      const serviceBuffer = service.additionalBufferMinutes || settings.defaultServiceBufferMinutes || 15;
      const travelBuffer = serviceArea.estimatedTravelMinutes || settings.defaultTravelBufferMinutes || 30;
      const totalOccupancyMinutes = serviceDuration + serviceBuffer + travelBuffer;

      const scheduledStartAt = new Date(dto.selectedStartAt);
      const scheduledEndAt = new Date(scheduledStartAt.getTime() + serviceDuration * 60 * 1000);
      const occupancyStartAt = scheduledStartAt;
      const occupancyEndAt = new Date(scheduledStartAt.getTime() + totalOccupancyMinutes * 60 * 1000);

      // Verify minimum advance
      const now = new Date();
      const minBookingTime = new Date(now.getTime() + (settings.minimumAdvanceMinutes || 120) * 60 * 1000);
      if (scheduledStartAt.getTime() < minBookingTime.getTime()) {
        throw new BadRequestException(
          `Waktu pemesanan minimal ${settings.minimumAdvanceMinutes || 120} menit dari waktu sekarang.`,
        );
      }

      // 4. Calculate Pricing
      const pricing = this.bookingPricingService.calculate(
        service.priceType,
        service.basePrice,
        dto.units.length,
        serviceArea.visitFee,
      );

      // 5. Atomic Technician Allocation & Booking Creation in Transaction
      const confirmation = await this.prisma.$transaction(async (tx) => {
        // Find active technicians
        const technicians = await tx.technician.findMany({
          where: { businessId: business.id, isActive: true },
          select: { id: true },
          orderBy: { id: 'asc' },
        });

        if (technicians.length === 0) {
          throw new ConflictException('Tidak ada teknisi aktif yang tersedia saat ini.');
        }

        // Find existing occupancies and blocks
        const [conflictingOccupancies, conflictingBlocks] = await Promise.all([
          tx.resourceOccupancy.findMany({
            where: {
              technicianId: { in: technicians.map((t) => t.id) },
              status: 'ACTIVE',
              startsAt: { lt: occupancyEndAt },
              endsAt: { gt: occupancyStartAt },
            },
          }),
          tx.technicianBlock.findMany({
            where: {
              technicianId: { in: technicians.map((t) => t.id) },
              isActive: true,
              startsAt: { lt: occupancyEndAt },
              endsAt: { gt: occupancyStartAt },
            },
          }),
        ]);

        const busyTechnicianIds = new Set<string>([
          ...conflictingOccupancies.map((o) => o.technicianId),
          ...conflictingBlocks.map((b) => b.technicianId),
        ]);

        const candidateTechnicians = technicians.filter((t) => !busyTechnicianIds.has(t.id));

        if (candidateTechnicians.length === 0) {
          throw new ConflictException({
            statusCode: 409,
            code: 'SLOT_UNAVAILABLE',
            message: 'Slot waktu yang dipilih sudah terisi atau tidak tersedia. Silakan pilih jadwal lain.',
          });
        }

        let allocatedTechnicianId: string | null = null;
        let createdOccupancyId: string | null = null;

        for (const candidate of candidateTechnicians) {
          // Acquire transaction-level advisory lock on this technician to prevent concurrency deadlock
          const lockResult = await tx.$queryRaw<Array<{ locked: boolean }>>`
            SELECT pg_try_advisory_xact_lock(hashtext(${candidate.id})) as locked
          `;

          if (!lockResult?.[0]?.locked) {
            continue; // Another concurrent transaction is allocating this technician, try next
          }

          // Double check occupancy under advisory lock
          const hasConflict = await tx.resourceOccupancy.findFirst({
            where: {
              technicianId: candidate.id,
              status: 'ACTIVE',
              startsAt: { lt: occupancyEndAt },
              endsAt: { gt: occupancyStartAt },
            },
          });

          if (hasConflict) {
            continue;
          }

          try {
            const occ = await tx.resourceOccupancy.create({
              data: {
                businessId: business.id,
                technicianId: candidate.id,
                startsAt: occupancyStartAt,
                endsAt: occupancyEndAt,
                status: 'ACTIVE',
              },
            });
            allocatedTechnicianId = candidate.id;
            createdOccupancyId = occ.id;
            break;
          } catch (err: any) {
            // Check for PostgreSQL exclusion constraint violation (code 23P01)
            if (err?.code === '23P01' || err?.message?.includes('no_overlapping_technician_occupancy')) {
              continue; // try next technician
            }
            throw err;
          }
        }

        if (!allocatedTechnicianId || !createdOccupancyId) {
          throw new ConflictException({
            statusCode: 409,
            code: 'SLOT_UNAVAILABLE',
            message: 'Kapasitas teknisi untuk slot waktu ini sudah penuh. Silakan pilih jadwal lain.',
          });
        }

        // Customer resolution (safe without silent cross-merges)
        const phoneResult = normalizeIndonesianPhone(dto.customerPhone);
        const normalizedPhone = phoneResult.isValid ? phoneResult.normalized : dto.customerPhone.trim();

        let customer = await tx.customer.findFirst({
          where: {
            businessId: business.id,
            normalizedPhone,
          },
        });

        if (!customer) {
          const customerCode = await generateCustomerCode(tx, business.id);
          customer = await tx.customer.create({
            data: {
              businessId: business.id,
              customerCode,
              name: dto.customerName.trim(),
              phone: dto.customerPhone.trim(),
              normalizedPhone,
              email: dto.customerEmail?.trim() || null,
            },
          });
        }

        // Service address record
        const address = await tx.customerAddress.create({
          data: {
            customerId: customer.id,
            label: 'Alamat Kunjungan',
            recipientName: dto.serviceAddress.recipientName?.trim() || dto.customerName.trim(),
            recipientPhone: dto.serviceAddress.recipientPhone?.trim() || dto.customerPhone.trim(),
            fullAddress: dto.serviceAddress.fullAddress.trim(),
            province: dto.serviceAddress.province || 'DKI Jakarta',
            city: dto.serviceAddress.city.trim(),
            district: dto.serviceAddress.district.trim(),
            subdistrict: dto.serviceAddress.subdistrict?.trim() || null,
            postalCode: dto.serviceAddress.postalCode?.trim() || null,
            landmark: dto.serviceAddress.landmark?.trim() || null,
            serviceAreaId: serviceArea.id,
            isPrimary: false,
            isActive: true,
          },
        });

        // Resolve status & expiration
        const autoConfirm = settings.autoConfirmBooking ?? false;
        const status = autoConfirm ? BookingStatus.CONFIRMED : BookingStatus.PENDING;
        const pendingHoldMinutes = settings.pendingHoldMinutes || 120;
        const expiresAt = autoConfirm ? null : new Date(Date.now() + pendingHoldMinutes * 60 * 1000);

        const bookingCode = await this.bookingCodeService.generateCode();

        const booking = await tx.booking.create({
          data: {
            businessId: business.id,
            customerId: customer.id,
            customerAddressId: address.id,
            serviceAreaId: serviceArea.id,
            serviceId: service.id,
            technicianId: allocatedTechnicianId,
            bookingCode,
            bookingSource: 'WEBSITE',
            status,
            scheduledStartAt,
            scheduledEndAt,
            occupancyStartAt,
            occupancyEndAt,
            serviceNameSnapshot: service.name,
            priceTypeSnapshot: pricing.priceType,
            unitCount: dto.units.length,
            estimatedPrice: pricing.estimatedTotal ? Number(pricing.estimatedTotal) : 0,
            estimatedServicePrice: pricing.estimatedServicePrice ? Number(pricing.estimatedServicePrice) : null,
            visitFeeSnapshot: Number(pricing.visitFee),
            estimatedTotal: pricing.estimatedTotal ? Number(pricing.estimatedTotal) : null,
            estimatedDurationMinutes: serviceDuration,
            customerNotes: dto.customerNotes?.trim() || null,
            expiresAt,
          },
        });

        // Link occupancy to booking
        await tx.resourceOccupancy.update({
          where: { id: createdOccupancyId },
          data: { bookingId: booking.id },
        });

        // Create BookingItems
        for (const unit of dto.units) {
          await tx.bookingItem.create({
            data: {
              bookingId: booking.id,
              acUnitId: unit.acUnitId || null,
              brandSnapshot: unit.brand?.trim() || null,
              modelSnapshot: unit.model?.trim() || null,
              typeSnapshot: unit.type,
              capacityPkSnapshot: unit.capacityPk ? Number(unit.capacityPk) : null,
              installationRoomSnapshot: unit.installationRoom?.trim() || null,
              serviceId: service.id,
              unitPriceSnapshot: pricing.basePrice ? Number(pricing.basePrice) : null,
              estimatedDurationMinutes: service.estimatedDurationMinutes,
              notes: unit.notes?.trim() || null,
            },
          });
        }

        // Create initial Status History
        await tx.bookingStatusHistory.create({
          data: {
            bookingId: booking.id,
            fromStatus: null,
            toStatus: status,
            reason: autoConfirm
              ? 'Pemesanan langsung dikonfirmasi otomatis oleh sistem.'
              : 'Pemesanan baru dibuat oleh pelanggan (menunggu konfirmasi admin).',
          },
        });

        // Create BookingAccessToken (30 days validity)
        const { token, hash } = this.bookingAccessService.generateToken();
        await tx.bookingAccessToken.create({
          data: {
            bookingId: booking.id,
            tokenHash: hash,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        const resultPayload = {
          bookingId: booking.id,
          bookingCode: booking.bookingCode,
          status: booking.status,
          accessToken: token,
          customerName: dto.customerName.trim(),
          customerPhone: dto.customerPhone.trim(),
          serviceName: service.name,
          unitCount: dto.units.length,
          scheduledStartAt: booking.scheduledStartAt.toISOString(),
          scheduledEndAt: booking.scheduledEndAt.toISOString(),
          estimatedDurationMinutes: serviceDuration,
          priceType: pricing.priceType,
          estimatedServicePrice: pricing.estimatedServicePrice,
          visitFee: pricing.visitFee,
          estimatedTotal: pricing.estimatedTotal,
          fullAddress: dto.serviceAddress.fullAddress.trim(),
          areaName: serviceArea.name,
          createdAt: booking.createdAt.toISOString(),
        };

        // Update Idempotency Record
        await tx.bookingIdempotency.update({
          where: { keyHash },
          data: {
            state: 'COMMITTED',
            bookingId: booking.id,
            responsePayload: resultPayload,
          },
        });

        return resultPayload;
      });

      return confirmation;
    } catch (error) {
      // Clean up in-progress idempotency on failure so user can retry safely
      await this.prisma.bookingIdempotency
        .delete({
          where: { keyHash },
        })
        .catch(() => {});
      throw error;
    }
  }

  async getBookingByToken(rawToken: string) {
    if (!rawToken || rawToken.trim().length === 0) {
      throw new UnauthorizedException('Token akses pemesanan tidak boleh kosong.');
    }

    const tokenHash = this.bookingAccessService.hashToken(rawToken);

    const accessToken = await this.prisma.bookingAccessToken.findUnique({
      where: { tokenHash },
      include: {
        booking: {
          include: {
            customer: true,
            customerAddress: {
              include: { serviceArea: true },
            },
            service: true,
            bookingItems: true,
            statusHistory: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!accessToken || accessToken.revokedAt || accessToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Token akses pemesanan tidak valid atau telah kedaluwarsa.');
    }

    const b = accessToken.booking;

    return {
      id: b.id,
      bookingCode: b.bookingCode,
      status: b.status,
      customerName: b.customer.name,
      customerPhone: b.customer.phone,
      serviceName: b.serviceNameSnapshot || b.service.name,
      serviceSlug: b.service.slug,
      unitCount: b.unitCount,
      items: b.bookingItems.map((item) => ({
        id: item.id,
        brandSnapshot: item.brandSnapshot,
        modelSnapshot: item.modelSnapshot,
        typeSnapshot: item.typeSnapshot,
        capacityPkSnapshot: item.capacityPkSnapshot ? item.capacityPkSnapshot.toString() : null,
        installationRoomSnapshot: item.installationRoomSnapshot,
        notes: item.notes,
        estimatedDurationMinutes: item.estimatedDurationMinutes,
      })),
      scheduledStartAt: b.scheduledStartAt.toISOString(),
      scheduledEndAt: b.scheduledEndAt.toISOString(),
      estimatedDurationMinutes: b.estimatedDurationMinutes || 60,
      priceType: b.priceTypeSnapshot || b.service.priceType,
      estimatedServicePrice: b.estimatedServicePrice ? b.estimatedServicePrice.toString() : null,
      visitFee: b.visitFeeSnapshot.toString(),
      estimatedTotal: b.estimatedTotal ? b.estimatedTotal.toString() : null,
      serviceAddress: {
        fullAddress: b.customerAddress.fullAddress,
        province: b.customerAddress.province,
        city: b.customerAddress.city,
        district: b.customerAddress.district,
        subdistrict: b.customerAddress.subdistrict,
        postalCode: b.customerAddress.postalCode,
        landmark: b.customerAddress.landmark,
        areaName: b.customerAddress.serviceArea?.name || null,
      },
      customerNotes: b.customerNotes,
      createdAt: b.createdAt.toISOString(),
      statusHistory: b.statusHistory.map((h) => ({
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        reason: h.reason,
        createdAt: h.createdAt.toISOString(),
      })),
    };
  }
}
