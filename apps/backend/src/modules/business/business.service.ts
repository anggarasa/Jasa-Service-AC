import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { UpdateBookingSettingsDto } from './dto/update-booking-settings.dto';
import { UpdateOperatingScheduleDto } from './dto/operating-hours.dto';

@Injectable()
export class BusinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async getActiveBusiness() {
    const business = await this.prisma.business.findFirst({
      where: { isActive: true },
      include: {
        settings: true,
      },
    });

    if (!business) {
      const anyBusiness = await this.prisma.business.findFirst({
        include: { settings: true },
      });
      if (!anyBusiness) {
        throw new NotFoundException('Data profil bisnis belum diinisialisasi.');
      }
      return anyBusiness;
    }

    return business;
  }

  async getBusinessProfile() {
    const business = await this.getActiveBusiness();
    let logoUrl: string | null = null;
    if (business.logoObjectKey) {
      try {
        logoUrl = await this.storage.getPresignedDownloadUrl(business.logoObjectKey);
      } catch {
        logoUrl = null;
      }
    }

    return {
      ...business,
      logoUrl,
    };
  }

  async updateBusinessProfile(dto: UpdateBusinessDto) {
    const current = await this.getActiveBusiness();

    // Check slug conflict
    if (dto.slug !== current.slug) {
      const existing = await this.prisma.business.findUnique({
        where: { slug: dto.slug },
      });
      if (existing && existing.id !== current.id) {
        throw new ConflictException(`Slug '${dto.slug}' sudah digunakan oleh bisnis lain.`);
      }
    }

    const updated = await this.prisma.business.update({
      where: { id: current.id },
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        email: dto.email,
        phone: dto.phone,
        whatsappNumber: dto.whatsappNumber,
        address: dto.address,
        city: dto.city,
        province: dto.province,
        postalCode: dto.postalCode,
        googleMapsUrl: dto.googleMapsUrl || null,
        timezone: dto.timezone || 'Asia/Jakarta',
        logoObjectKey: dto.logoObjectKey !== undefined ? dto.logoObjectKey : current.logoObjectKey,
        isActive: dto.isActive !== undefined ? dto.isActive : current.isActive,
      },
    });

    let logoUrl: string | null = null;
    if (updated.logoObjectKey) {
      try {
        logoUrl = await this.storage.getPresignedDownloadUrl(updated.logoObjectKey);
      } catch {
        logoUrl = null;
      }
    }

    return {
      ...updated,
      logoUrl,
    };
  }

  async getBookingSettings() {
    const business = await this.getActiveBusiness();
    let settings = await this.prisma.businessSetting.findUnique({
      where: { businessId: business.id },
    });

    if (!settings) {
      settings = await this.prisma.businessSetting.create({
        data: {
          businessId: business.id,
          bookingEnabled: true,
          bookingIntervalMinutes: 30,
          defaultServiceBufferMinutes: 15,
          defaultTravelBufferMinutes: 30,
          minimumAdvanceMinutes: 120,
          maximumAdvanceDays: 30,
          autoConfirmBooking: false,
          allowCustomerCancellation: false,
          cancellationWindowHours: 24,
          maximumUnitsPerBooking: 5,
          currency: 'IDR',
        },
      });
    }

    return settings;
  }

  async updateBookingSettings(dto: UpdateBookingSettingsDto) {
    const business = await this.getActiveBusiness();

    return this.prisma.businessSetting.upsert({
      where: { businessId: business.id },
      update: {
        bookingEnabled: dto.bookingEnabled,
        bookingIntervalMinutes: dto.bookingIntervalMinutes,
        defaultServiceBufferMinutes: dto.defaultServiceBufferMinutes,
        defaultTravelBufferMinutes: dto.defaultTravelBufferMinutes,
        minimumAdvanceMinutes: dto.minimumAdvanceMinutes,
        maximumAdvanceDays: dto.maximumAdvanceDays,
        autoConfirmBooking: dto.autoConfirmBooking,
        allowCustomerCancellation: dto.allowCustomerCancellation,
        cancellationWindowHours: dto.cancellationWindowHours,
        maximumUnitsPerBooking: dto.maximumUnitsPerBooking,
        currency: dto.currency,
      },
      create: {
        businessId: business.id,
        bookingEnabled: dto.bookingEnabled,
        bookingIntervalMinutes: dto.bookingIntervalMinutes,
        defaultServiceBufferMinutes: dto.defaultServiceBufferMinutes,
        defaultTravelBufferMinutes: dto.defaultTravelBufferMinutes,
        minimumAdvanceMinutes: dto.minimumAdvanceMinutes,
        maximumAdvanceDays: dto.maximumAdvanceDays,
        autoConfirmBooking: dto.autoConfirmBooking,
        allowCustomerCancellation: dto.allowCustomerCancellation,
        cancellationWindowHours: dto.cancellationWindowHours,
        maximumUnitsPerBooking: dto.maximumUnitsPerBooking,
        currency: dto.currency,
      },
    });
  }

  async getOperatingHours() {
    const business = await this.getActiveBusiness();
    const hours = await this.prisma.businessOperatingHour.findMany({
      where: { businessId: business.id },
      include: {
        breaks: {
          orderBy: { startTime: 'asc' },
        },
      },
      orderBy: { dayOfWeek: 'asc' },
    });

    return hours;
  }

  async updateOperatingHours(dto: UpdateOperatingScheduleDto) {
    const business = await this.getActiveBusiness();
    const daysSeen = new Set<number>();

    // Validate schedule integrity
    for (const item of dto.schedule) {
      if (daysSeen.has(item.dayOfWeek)) {
        throw new BadRequestException(`Duplikasi konfigurasi hari ke-${item.dayOfWeek} terdeteksi.`);
      }
      daysSeen.add(item.dayOfWeek);

      if (item.isOpen) {
        if (item.openTime >= item.closeTime) {
          throw new BadRequestException(
            `Jam buka (${item.openTime}) harus lebih awal daripada jam tutup (${item.closeTime}) pada hari ke-${item.dayOfWeek}.`,
          );
        }

        // Validate breaks
        const sortedBreaks = [...item.breaks].sort((a, b) => a.startTime.localeCompare(b.startTime));
        for (let i = 0; i < sortedBreaks.length; i++) {
          const currentBreak = sortedBreaks[i];
          if (currentBreak.startTime >= currentBreak.endTime) {
            throw new BadRequestException(
              `Jam mulai istirahat (${currentBreak.startTime}) harus lebih awal daripada jam selesai (${currentBreak.endTime}).`,
            );
          }

          if (currentBreak.startTime < item.openTime || currentBreak.endTime > item.closeTime) {
            throw new BadRequestException(
              `Waktu istirahat (${currentBreak.startTime}-${currentBreak.endTime}) harus berada di dalam jam operasional (${item.openTime}-${item.closeTime}).`,
            );
          }

          if (i > 0) {
            const prevBreak = sortedBreaks[i - 1];
            if (prevBreak.endTime > currentBreak.startTime) {
              throw new BadRequestException(
                `Jeda istirahat tidak boleh saling tumpang tindih (${prevBreak.startTime}-${prevBreak.endTime} dengan ${currentBreak.startTime}-${currentBreak.endTime}).`,
              );
            }
          }
        }
      }
    }

    // Atomic update in Prisma transaction
    return this.prisma.$transaction(async (tx) => {
      for (const item of dto.schedule) {
        const operatingHour = await tx.businessOperatingHour.upsert({
          where: {
            businessId_dayOfWeek: {
              businessId: business.id,
              dayOfWeek: item.dayOfWeek,
            },
          },
          update: {
            isOpen: item.isOpen,
            openTime: item.openTime,
            closeTime: item.closeTime,
          },
          create: {
            businessId: business.id,
            dayOfWeek: item.dayOfWeek,
            isOpen: item.isOpen,
            openTime: item.openTime,
            closeTime: item.closeTime,
          },
        });

        // Delete existing breaks and recreate
        await tx.businessOperatingBreak.deleteMany({
          where: { operatingHourId: operatingHour.id },
        });

        if (item.isOpen && item.breaks && item.breaks.length > 0) {
          await tx.businessOperatingBreak.createMany({
            data: item.breaks.map((b) => ({
              operatingHourId: operatingHour.id,
              startTime: b.startTime,
              endTime: b.endTime,
            })),
          });
        }
      }

      return tx.businessOperatingHour.findMany({
        where: { businessId: business.id },
        include: {
          breaks: {
            orderBy: { startTime: 'asc' },
          },
        },
        orderBy: { dayOfWeek: 'asc' },
      });
    });
  }
}
