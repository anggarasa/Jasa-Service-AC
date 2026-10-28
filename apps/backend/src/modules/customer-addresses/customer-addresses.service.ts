import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CustomerAuditService } from '../customer-audit/customer-audit.service';
import { CustomersService } from '../customers/customers.service';
import { CreateCustomerAddressDto } from './dto/create-customer-address.dto';
import { UpdateCustomerAddressDto } from './dto/update-customer-address.dto';
import { ValidateAreaDto } from './dto/validate-area.dto';

@Injectable()
export class CustomerAddressesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customersService: CustomersService,
    private readonly audit: CustomerAuditService,
  ) {}

  private async verifyCustomer(customerId: string): Promise<string> {
    const businessId = await this.customersService.getBusinessId();
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, businessId },
      select: { id: true, businessId: true },
    });

    if (!customer) {
      throw new NotFoundException(`Pelanggan dengan ID ${customerId} tidak ditemukan.`);
    }

    return businessId;
  }

  async validateServiceArea(dto: ValidateAreaDto) {
    const businessId = await this.customersService.getBusinessId();
    const cityClean = dto.city.trim().toLowerCase();
    const districtClean = dto.district.trim().toLowerCase();

    // Look for matching service areas
    const areas = await this.prisma.serviceArea.findMany({
      where: { businessId },
    });

    const match = areas.find(
      (a) =>
        a.city.toLowerCase() === cityClean &&
        a.district.toLowerCase() === districtClean,
    );

    if (match) {
      if (match.isActive) {
        return {
          serviceable: true,
          status: 'SERVICEABLE',
          serviceArea: {
            id: match.id,
            name: match.name,
            province: match.province,
            city: match.city,
            district: match.district,
            visitFee: match.visitFee.toString(),
            estimatedTravelMinutes: match.estimatedTravelMinutes,
          },
          visitFee: match.visitFee.toString(),
          estimatedTravelMinutes: match.estimatedTravelMinutes,
          message: 'Lokasi alamat terjangkau dalam area servis operasional.',
        };
      } else {
        return {
          serviceable: false,
          status: 'NOT_SERVICEABLE',
          serviceArea: {
            id: match.id,
            name: match.name,
            province: match.province,
            city: match.city,
            district: match.district,
            visitFee: match.visitFee.toString(),
            estimatedTravelMinutes: match.estimatedTravelMinutes,
          },
          message: 'Area servis di wilayah ini saat ini sedang dinonaktifkan.',
        };
      }
    }

    return {
      serviceable: false,
      status: 'UNVERIFIED',
      serviceArea: null,
      message: 'Wilayah ini belum terdaftar di basis data area servis aktif.',
    };
  }

  async findAll(customerId: string) {
    await this.verifyCustomer(customerId);

    const addresses = await this.prisma.customerAddress.findMany({
      where: { customerId, isActive: true },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      include: {
        serviceArea: {
          select: {
            id: true,
            name: true,
            visitFee: true,
            estimatedTravelMinutes: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            acUnits: { where: { isActive: true } },
          },
        },
      },
    });

    return addresses.map((a) => this.mapAddress(a));
  }

  async findOne(customerId: string, addressId: string) {
    await this.verifyCustomer(customerId);

    const address = await this.prisma.customerAddress.findFirst({
      where: { id: addressId, customerId },
      include: {
        serviceArea: {
          select: {
            id: true,
            name: true,
            visitFee: true,
            estimatedTravelMinutes: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            acUnits: { where: { isActive: true } },
          },
        },
      },
    });

    if (!address) {
      throw new NotFoundException(`Alamat dengan ID ${addressId} tidak ditemukan untuk pelanggan ini.`);
    }

    return this.mapAddress(address);
  }

  async create(customerId: string, dto: CreateCustomerAddressDto, actorUserId?: string) {
    const businessId = await this.verifyCustomer(customerId);

    if (dto.serviceAreaId) {
      const area = await this.prisma.serviceArea.findFirst({
        where: { id: dto.serviceAreaId, businessId },
      });
      if (!area) {
        throw new BadRequestException('ID area servis yang dipilih tidak valid atau bukan milik bisnis ini.');
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      // Check existing active addresses
      const activeCount = await tx.customerAddress.count({
        where: { customerId, isActive: true },
      });

      // First address must automatically become primary
      let shouldBePrimary = dto.isPrimary === true || activeCount === 0;

      if (shouldBePrimary) {
        // Demote other addresses
        await tx.customerAddress.updateMany({
          where: { customerId, isActive: true, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      const created = await tx.customerAddress.create({
        data: {
          customerId,
          label: dto.label.trim(),
          recipientName: dto.recipientName ? dto.recipientName.trim() : null,
          recipientPhone: dto.recipientPhone ? dto.recipientPhone.trim() : null,
          fullAddress: dto.fullAddress.trim(),
          province: dto.province ? dto.province.trim() : 'DKI Jakarta',
          city: dto.city.trim(),
          district: dto.district.trim(),
          subdistrict: dto.subdistrict ? dto.subdistrict.trim() : null,
          postalCode: dto.postalCode ? dto.postalCode.trim() : null,
          landmark: dto.landmark ? dto.landmark.trim() : null,
          serviceAreaId: dto.serviceAreaId || null,
          latitude: dto.latitude !== undefined && dto.latitude !== null ? new Prisma.Decimal(dto.latitude) : null,
          longitude: dto.longitude !== undefined && dto.longitude !== null ? new Prisma.Decimal(dto.longitude) : null,
          isPrimary: shouldBePrimary,
          isActive: true,
        },
        include: {
          serviceArea: {
            select: {
              id: true,
              name: true,
              visitFee: true,
              estimatedTravelMinutes: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              acUnits: { where: { isActive: true } },
            },
          },
        },
      });

      await this.audit.log({
        businessId,
        customerId,
        actorUserId,
        action: 'ADDRESS_CREATED',
        changedFields: { id: created.id, label: created.label, isPrimary: created.isPrimary },
      });

      return this.mapAddress(created);
    });
  }

  async update(customerId: string, addressId: string, dto: UpdateCustomerAddressDto, actorUserId?: string) {
    const businessId = await this.verifyCustomer(customerId);

    const existing = await this.prisma.customerAddress.findFirst({
      where: { id: addressId, customerId },
    });

    if (!existing) {
      throw new NotFoundException(`Alamat dengan ID ${addressId} tidak ditemukan.`);
    }

    if (dto.serviceAreaId) {
      const area = await this.prisma.serviceArea.findFirst({
        where: { id: dto.serviceAreaId, businessId },
      });
      if (!area) {
        throw new BadRequestException('ID area servis yang dipilih tidak valid.');
      }
    }

    const data: Prisma.CustomerAddressUpdateInput = {};
    if (dto.label !== undefined) data.label = dto.label.trim();
    if (dto.recipientName !== undefined) data.recipientName = dto.recipientName ? dto.recipientName.trim() : null;
    if (dto.recipientPhone !== undefined) data.recipientPhone = dto.recipientPhone ? dto.recipientPhone.trim() : null;
    if (dto.fullAddress !== undefined) data.fullAddress = dto.fullAddress.trim();
    if (dto.province !== undefined) data.province = dto.province.trim();
    if (dto.city !== undefined) data.city = dto.city.trim();
    if (dto.district !== undefined) data.district = dto.district.trim();
    if (dto.subdistrict !== undefined) data.subdistrict = dto.subdistrict ? dto.subdistrict.trim() : null;
    if (dto.postalCode !== undefined) data.postalCode = dto.postalCode ? dto.postalCode.trim() : null;
    if (dto.landmark !== undefined) data.landmark = dto.landmark ? dto.landmark.trim() : null;
    if (dto.serviceAreaId !== undefined) data.serviceArea = dto.serviceAreaId ? { connect: { id: dto.serviceAreaId } } : { disconnect: true };
    if (dto.latitude !== undefined) data.latitude = dto.latitude !== null ? new Prisma.Decimal(dto.latitude) : null;
    if (dto.longitude !== undefined) data.longitude = dto.longitude !== null ? new Prisma.Decimal(dto.longitude) : null;

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
      if (!dto.isActive) {
        data.archivedAt = new Date();
      } else {
        data.archivedAt = null;
      }
    }

    const updated = await this.prisma.customerAddress.update({
      where: { id: addressId },
      data,
      include: {
        serviceArea: {
          select: {
            id: true,
            name: true,
            visitFee: true,
            estimatedTravelMinutes: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            acUnits: { where: { isActive: true } },
          },
        },
      },
    });

    await this.audit.log({
      businessId,
      customerId,
      actorUserId,
      action: dto.isActive === false ? 'ADDRESS_ARCHIVED' : 'ADDRESS_UPDATED',
      changedFields: dto as any,
    });

    return this.mapAddress(updated);
  }

  async setPrimary(customerId: string, addressId: string, actorUserId?: string) {
    const businessId = await this.verifyCustomer(customerId);

    return await this.prisma.$transaction(async (tx) => {
      const target = await tx.customerAddress.findFirst({
        where: { id: addressId, customerId, isActive: true },
      });

      if (!target) {
        throw new NotFoundException(`Alamat aktif dengan ID ${addressId} tidak ditemukan.`);
      }

      // Demote all active addresses of this customer
      await tx.customerAddress.updateMany({
        where: { customerId, isActive: true, isPrimary: true },
        data: { isPrimary: false },
      });

      // Promote target
      const updated = await tx.customerAddress.update({
        where: { id: addressId },
        data: { isPrimary: true },
        include: {
          serviceArea: {
            select: {
              id: true,
              name: true,
              visitFee: true,
              estimatedTravelMinutes: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              acUnits: { where: { isActive: true } },
            },
          },
        },
      });

      await this.audit.log({
        businessId,
        customerId,
        actorUserId,
        action: 'PRIMARY_ADDRESS_CHANGED',
        changedFields: { previousPrimaryAddressRevoked: true, newPrimaryAddressId: addressId },
      });

      return this.mapAddress(updated);
    });
  }

  async archive(customerId: string, addressId: string, actorUserId?: string) {
    const businessId = await this.verifyCustomer(customerId);

    return await this.prisma.$transaction(async (tx) => {
      const address = await tx.customerAddress.findFirst({
        where: { id: addressId, customerId, isActive: true },
      });

      if (!address) {
        throw new NotFoundException(`Alamat aktif dengan ID ${addressId} tidak ditemukan.`);
      }

      const wasPrimary = address.isPrimary;

      const archived = await tx.customerAddress.update({
        where: { id: addressId },
        data: {
          isActive: false,
          isPrimary: false,
          archivedAt: new Date(),
        },
      });

      // If it was primary, promote next available active address
      if (wasPrimary) {
        const nextAddress = await tx.customerAddress.findFirst({
          where: { customerId, isActive: true },
          orderBy: { createdAt: 'desc' },
        });

        if (nextAddress) {
          await tx.customerAddress.update({
            where: { id: nextAddress.id },
            data: { isPrimary: true },
          });

          await this.audit.log({
            businessId,
            customerId,
            actorUserId,
            action: 'PRIMARY_ADDRESS_CHANGED',
            changedFields: { autoReassignedPrimaryTo: nextAddress.id },
          });
        }
      }

      await this.audit.log({
        businessId,
        customerId,
        actorUserId,
        action: 'ADDRESS_ARCHIVED',
        changedFields: { addressId, label: address.label },
      });

      return {
        id: archived.id,
        archived: true,
        archivedAt: archived.archivedAt?.toISOString(),
      };
    });
  }

  private mapAddress(a: any) {
    return {
      id: a.id,
      customerId: a.customerId,
      label: a.label,
      recipientName: a.recipientName,
      recipientPhone: a.recipientPhone,
      fullAddress: a.fullAddress,
      province: a.province,
      city: a.city,
      district: a.district,
      subdistrict: a.subdistrict,
      postalCode: a.postalCode,
      landmark: a.landmark,
      serviceAreaId: a.serviceAreaId,
      serviceAreaName: a.serviceArea?.name || null,
      isServiceable: a.serviceArea?.isActive || false,
      latitude: a.latitude ? Number(a.latitude) : null,
      longitude: a.longitude ? Number(a.longitude) : null,
      isPrimary: a.isPrimary,
      isActive: a.isActive,
      archivedAt: a.archivedAt?.toISOString() || null,
      acUnitCount: a._count?.acUnits || 0,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    };
  }
}
