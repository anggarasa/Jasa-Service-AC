import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { normalizeIndonesianPhone } from '@tampilkit-ac/api-contract';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CustomerAuditService } from '../customer-audit/customer-audit.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { generateCustomerCode } from './utils/customer-code.util';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: CustomerAuditService,
  ) {}

  public async getBusinessId(): Promise<string> {
    const business = await this.prisma.business.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    if (!business) {
      throw new NotFoundException('Data bisnis belum diinisialisasi.');
    }
    return business.id;
  }

  async checkDuplicate(phone: string) {
    const businessId = await this.getBusinessId();
    const phoneResult = normalizeIndonesianPhone(phone);
    if (!phoneResult.isValid) {
      return {
        isDuplicateCandidate: false,
        candidates: [],
      };
    }

    const matches = await this.prisma.customer.findMany({
      where: {
        businessId,
        normalizedPhone: phoneResult.normalized,
      },
      select: {
        id: true,
        customerCode: true,
        name: true,
        normalizedPhone: true,
        displayPhone: true,
        isActive: true,
      },
    });

    return {
      isDuplicateCandidate: matches.length > 0,
      candidates: matches,
    };
  }

  async findAll(query: CustomerQueryDto) {
    const businessId = await this.getBusinessId();
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = { businessId };

    if (query.status === 'active') {
      where.isActive = true;
    } else if (query.status === 'archived') {
      where.isActive = false;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      const phoneNorm = normalizeIndonesianPhone(term);
      const searchConditions: Prisma.CustomerWhereInput[] = [
        { name: { contains: term, mode: 'insensitive' } },
        { customerCode: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term } },
      ];

      if (phoneNorm.isValid) {
        searchConditions.push({ normalizedPhone: { contains: phoneNorm.normalized } });
      }

      where.OR = searchConditions;
    }

    const orderBy: Prisma.CustomerOrderByWithRelationInput = {};
    if (query.sortBy === 'name') {
      orderBy.name = query.sortOrder || 'asc';
    } else if (query.sortBy === 'customerCode') {
      orderBy.customerCode = query.sortOrder || 'asc';
    } else {
      orderBy.createdAt = query.sortOrder || 'desc';
    }

    const [total, items] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              addresses: { where: { isActive: true } },
              acUnits: { where: { isActive: true } },
            },
          },
        },
      }),
    ]);

    const formatted = items.map((c) => ({
      id: c.id,
      businessId: c.businessId,
      customerCode: c.customerCode,
      name: c.name,
      phone: c.phone,
      normalizedPhone: c.normalizedPhone,
      displayPhone: c.displayPhone,
      email: c.email,
      notes: c.notes,
      isActive: c.isActive,
      archivedAt: c.archivedAt?.toISOString() || null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      addressCount: c._count.addresses,
      acUnitCount: c._count.acUnits,
    }));

    return {
      data: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const businessId = await this.getBusinessId();
    const customer = await this.prisma.customer.findFirst({
      where: { id, businessId },
      include: {
        addresses: {
          where: { isActive: true },
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
        },
        _count: {
          select: {
            addresses: { where: { isActive: true } },
            acUnits: { where: { isActive: true } },
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Pelanggan dengan ID ${id} tidak ditemukan.`);
    }

    return {
      id: customer.id,
      businessId: customer.businessId,
      customerCode: customer.customerCode,
      name: customer.name,
      phone: customer.phone,
      normalizedPhone: customer.normalizedPhone,
      displayPhone: customer.displayPhone,
      email: customer.email,
      notes: customer.notes,
      isActive: customer.isActive,
      archivedAt: customer.archivedAt?.toISOString() || null,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      addressCount: customer._count.addresses,
      acUnitCount: customer._count.acUnits,
      addresses: customer.addresses.map((a) => ({
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
        acUnitCount: a._count.acUnits,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
    };
  }

  async create(dto: CreateCustomerDto, actorUserId?: string) {
    const businessId = await this.getBusinessId();
    const phoneResult = normalizeIndonesianPhone(dto.phone);
    if (!phoneResult.isValid) {
      throw new BadRequestException(phoneResult.error || 'Nomor telepon tidak valid');
    }

    const customerCode = await generateCustomerCode(this.prisma, businessId);

    const created = await this.prisma.customer.create({
      data: {
        businessId,
        customerCode,
        name: dto.name.trim(),
        phone: phoneResult.normalized,
        normalizedPhone: phoneResult.normalized,
        displayPhone: phoneResult.display,
        email: dto.email ? dto.email.trim().toLowerCase() : null,
        notes: dto.notes ? dto.notes.trim() : null,
        isActive: true,
      },
    });

    await this.audit.log({
      businessId,
      customerId: created.id,
      actorUserId,
      action: 'CUSTOMER_CREATED',
      changedFields: { customerCode, name: created.name, phone: created.phone },
    });

    return this.findOne(created.id);
  }

  async update(id: string, dto: UpdateCustomerDto, actorUserId?: string) {
    const businessId = await this.getBusinessId();
    const existing = await this.prisma.customer.findFirst({
      where: { id, businessId },
    });

    if (!existing) {
      throw new NotFoundException(`Pelanggan dengan ID ${id} tidak ditemukan.`);
    }

    const data: Prisma.CustomerUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.phone !== undefined) {
      const phoneResult = normalizeIndonesianPhone(dto.phone);
      if (!phoneResult.isValid) {
        throw new BadRequestException(phoneResult.error || 'Nomor telepon tidak valid');
      }
      data.phone = phoneResult.normalized;
      data.normalizedPhone = phoneResult.normalized;
      data.displayPhone = phoneResult.display;
    }

    if (dto.email !== undefined) {
      data.email = dto.email ? dto.email.trim().toLowerCase() : null;
    }

    if (dto.notes !== undefined) {
      data.notes = dto.notes ? dto.notes.trim() : null;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
      if (!dto.isActive) {
        data.archivedAt = new Date();
      } else {
        data.archivedAt = null;
      }
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data,
    });

    await this.audit.log({
      businessId,
      customerId: updated.id,
      actorUserId,
      action: dto.isActive === false ? 'CUSTOMER_ARCHIVED' : 'CUSTOMER_UPDATED',
      changedFields: dto as any,
    });

    return this.findOne(updated.id);
  }

  async archive(id: string, actorUserId?: string) {
    return this.update(id, { isActive: false }, actorUserId);
  }

  async getHistory(customerId: string) {
    const businessId = await this.getBusinessId();
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, businessId },
      select: { id: true },
    });

    if (!customer) {
      throw new NotFoundException(`Pelanggan dengan ID ${customerId} tidak ditemukan.`);
    }

    // Historical service records from real Bookings and WorkOrders
    const bookings = await this.prisma.booking.findMany({
      where: { customerId, businessId },
      orderBy: { scheduledStartAt: 'desc' },
      include: {
        service: { select: { name: true } },
        technician: {
          select: {
            user: { select: { name: true } },
          },
        },
        workOrders: {
          select: {
            status: true,
            completedAt: true,
          },
        },
        _count: {
          select: { bookingUnits: true },
        },
      },
    });

    let lastServiceDate: string | null = null;
    const completedWorkOrder = bookings
      .flatMap((b) => b.workOrders)
      .filter((w) => w.status === 'COMPLETED' && w.completedAt)
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())[0];

    if (completedWorkOrder?.completedAt) {
      lastServiceDate = completedWorkOrder.completedAt.toISOString();
    }

    const mappedBookings = bookings.map((b) => ({
      id: b.id,
      bookingCode: b.bookingCode,
      scheduledStartAt: b.scheduledStartAt.toISOString(),
      scheduledEndAt: b.scheduledEndAt.toISOString(),
      status: b.status,
      serviceName: b.service.name,
      unitCount: b._count.bookingUnits || 1,
      estimatedPrice: b.estimatedPrice.toString(),
      technicianName: b.technician?.user?.name || null,
      workOrderStatus: b.workOrders[0]?.status || null,
    }));

    return {
      customerId,
      bookings: mappedBookings,
      totalBookings: mappedBookings.length,
      lastServiceDate,
    };
  }
}
