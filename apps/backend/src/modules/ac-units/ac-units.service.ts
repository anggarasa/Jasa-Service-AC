import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { CustomerAuditService } from '../customer-audit/customer-audit.service';
import { CustomersService } from '../customers/customers.service';
import { AcUnitQueryDto } from './dto/ac-unit-query.dto';
import { CreateAcUnitDto } from './dto/create-ac-unit.dto';
import { MoveAcUnitDto } from './dto/move-ac-unit.dto';
import { UpdateAcUnitDto } from './dto/update-ac-unit.dto';
import { generateAcUnitCode } from './utils/ac-unit-code.util';

@Injectable()
export class AcUnitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customersService: CustomersService,
    private readonly storage: StorageService,
    private readonly audit: CustomerAuditService,
  ) {}

  private async getBusinessId(): Promise<string> {
    return this.customersService.getBusinessId();
  }

  async findAll(query: AcUnitQueryDto) {
    const businessId = await this.getBusinessId();
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AcUnitWhereInput = {
      customer: { businessId },
    };

    if (query.status === 'active') {
      where.isActive = true;
    } else if (query.status === 'archived') {
      where.isActive = false;
    }

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.customerAddressId) {
      where.customerAddressId = query.customerAddressId;
    }

    if (query.brand && query.brand.trim()) {
      where.brand = { contains: query.brand.trim(), mode: 'insensitive' };
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.capacityPk) {
      where.capacityPk = new Prisma.Decimal(query.capacityPk);
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { unitCode: { contains: term, mode: 'insensitive' } },
        { unitLabel: { contains: term, mode: 'insensitive' } },
        { brand: { contains: term, mode: 'insensitive' } },
        { model: { contains: term, mode: 'insensitive' } },
        { serialNumber: { contains: term, mode: 'insensitive' } },
        { customer: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const orderBy: Prisma.AcUnitOrderByWithRelationInput = {};
    if (query.sortBy === 'unitCode') {
      orderBy.unitCode = query.sortOrder || 'asc';
    } else if (query.sortBy === 'unitLabel') {
      orderBy.unitLabel = query.sortOrder || 'asc';
    } else if (query.sortBy === 'brand') {
      orderBy.brand = query.sortOrder || 'asc';
    } else {
      orderBy.createdAt = query.sortOrder || 'desc';
    }

    const [total, items] = await Promise.all([
      this.prisma.acUnit.count({ where }),
      this.prisma.acUnit.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, name: true, customerCode: true } },
          customerAddress: { select: { id: true, label: true, fullAddress: true, city: true } },
          photos: {
            orderBy: { displayOrder: 'asc' },
            include: { mediaAsset: true },
          },
        },
      }),
    ]);

    return {
      data: items.map((u) => this.mapUnit(u)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findByCustomer(customerId: string) {
    const businessId = await this.getBusinessId();
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, businessId },
    });

    if (!customer) {
      throw new NotFoundException(`Pelanggan dengan ID ${customerId} tidak ditemukan.`);
    }

    const units = await this.prisma.acUnit.findMany({
      where: { customerId, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        customerAddress: { select: { id: true, label: true, fullAddress: true, city: true } },
        photos: {
          orderBy: { displayOrder: 'asc' },
          include: { mediaAsset: true },
        },
      },
    });

    return units.map((u) => this.mapUnit(u));
  }

  async findOne(id: string) {
    const businessId = await this.getBusinessId();
    const unit = await this.prisma.acUnit.findFirst({
      where: { id, customer: { businessId } },
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        customerAddress: { select: { id: true, label: true, fullAddress: true, city: true } },
        photos: {
          orderBy: { displayOrder: 'asc' },
          include: { mediaAsset: true },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException(`Unit AC dengan ID ${id} tidak ditemukan.`);
    }

    return this.mapUnit(unit);
  }

  async create(customerId: string, dto: CreateAcUnitDto, actorUserId?: string) {
    const businessId = await this.getBusinessId();
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, businessId },
    });

    if (!customer) {
      throw new NotFoundException(`Pelanggan dengan ID ${customerId} tidak ditemukan.`);
    }

    // Verify address belongs strictly to this customer
    const address = await this.prisma.customerAddress.findFirst({
      where: { id: dto.customerAddressId, customerId, isActive: true },
    });

    if (!address) {
      throw new BadRequestException('Alamat instalasi tidak valid atau bukan milik pelanggan ini.');
    }

    const unitCode = await generateAcUnitCode(this.prisma);
    const capacityPkDecimal = new Prisma.Decimal(dto.capacityPk);

    const created = await this.prisma.acUnit.create({
      data: {
        customerId,
        customerAddressId: dto.customerAddressId,
        unitCode,
        unitLabel: dto.unitLabel.trim(),
        brand: dto.brand.trim(),
        model: dto.model ? dto.model.trim() : null,
        type: dto.type || 'SPLIT',
        capacityPk: capacityPkDecimal,
        serialNumber: dto.serialNumber ? dto.serialNumber.trim() : null,
        installationRoom: dto.installationRoom ? dto.installationRoom.trim() : null,
        installationDate: dto.installationDate ? new Date(dto.installationDate) : null,
        notes: dto.notes ? dto.notes.trim() : null,
        isActive: true,
      },
    });

    await this.audit.log({
      businessId,
      customerId,
      actorUserId,
      action: 'AC_UNIT_CREATED',
      changedFields: { unitId: created.id, unitCode, brand: created.brand, capacityPk: dto.capacityPk },
    });

    return this.findOne(created.id);
  }

  async update(id: string, dto: UpdateAcUnitDto, actorUserId?: string) {
    const businessId = await this.getBusinessId();
    const existing = await this.prisma.acUnit.findFirst({
      where: { id, customer: { businessId } },
    });

    if (!existing) {
      throw new NotFoundException(`Unit AC dengan ID ${id} tidak ditemukan.`);
    }

    const data: Prisma.AcUnitUpdateInput = {};
    if (dto.unitLabel !== undefined) data.unitLabel = dto.unitLabel.trim();
    if (dto.brand !== undefined) data.brand = dto.brand.trim();
    if (dto.model !== undefined) data.model = dto.model ? dto.model.trim() : null;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.capacityPk !== undefined) data.capacityPk = new Prisma.Decimal(dto.capacityPk);
    if (dto.serialNumber !== undefined) data.serialNumber = dto.serialNumber ? dto.serialNumber.trim() : null;
    if (dto.installationRoom !== undefined) data.installationRoom = dto.installationRoom ? dto.installationRoom.trim() : null;
    if (dto.installationDate !== undefined) data.installationDate = dto.installationDate ? new Date(dto.installationDate) : null;
    if (dto.notes !== undefined) data.notes = dto.notes ? dto.notes.trim() : null;

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
      if (!dto.isActive) {
        data.archivedAt = new Date();
      } else {
        data.archivedAt = null;
      }
    }

    const updated = await this.prisma.acUnit.update({
      where: { id },
      data,
    });

    await this.audit.log({
      businessId,
      customerId: existing.customerId,
      actorUserId,
      action: dto.isActive === false ? 'AC_UNIT_ARCHIVED' : 'AC_UNIT_UPDATED',
      changedFields: dto as any,
    });

    return this.findOne(updated.id);
  }

  async moveAddress(id: string, dto: MoveAcUnitDto, actorUserId?: string) {
    const businessId = await this.getBusinessId();
    const unit = await this.prisma.acUnit.findFirst({
      where: { id, customer: { businessId } },
    });

    if (!unit) {
      throw new NotFoundException(`Unit AC dengan ID ${id} tidak ditemukan.`);
    }

    // Crucial Relationship Integrity: Destination address MUST belong to the SAME customer
    const destinationAddress = await this.prisma.customerAddress.findFirst({
      where: { id: dto.newCustomerAddressId, customerId: unit.customerId, isActive: true },
    });

    if (!destinationAddress) {
      throw new BadRequestException('Alamat tujuan tidak valid atau bukan milik pelanggan pemilik unit AC ini.');
    }

    const oldAddressId = unit.customerAddressId;

    const updated = await this.prisma.acUnit.update({
      where: { id },
      data: {
        customerAddressId: dto.newCustomerAddressId,
        installationRoom: dto.newInstallationRoom !== undefined ? dto.newInstallationRoom : unit.installationRoom,
        notes: dto.notes ? (unit.notes ? `${unit.notes}\n[Dipindah]: ${dto.notes}` : `[Dipindah]: ${dto.notes}`) : unit.notes,
      },
    });

    await this.audit.log({
      businessId,
      customerId: unit.customerId,
      actorUserId,
      action: 'AC_UNIT_MOVED',
      changedFields: {
        unitId: id,
        fromAddressId: oldAddressId,
        toAddressId: dto.newCustomerAddressId,
        newInstallationRoom: dto.newInstallationRoom,
      },
      reason: dto.notes || 'Pemindahan alamat instalasi unit AC',
    });

    return this.findOne(updated.id);
  }

  async archive(id: string, actorUserId?: string) {
    return this.update(id, { isActive: false }, actorUserId);
  }

  async getHistory(id: string) {
    const businessId = await this.getBusinessId();
    const unit = await this.prisma.acUnit.findFirst({
      where: { id, customer: { businessId } },
    });

    if (!unit) {
      throw new NotFoundException(`Unit AC dengan ID ${id} tidak ditemukan.`);
    }

    // Historical service derived from actual BookingAcUnit records
    const bookingUnits = await this.prisma.bookingAcUnit.findMany({
      where: { acUnitId: id },
      include: {
        booking: {
          include: {
            service: { select: { name: true } },
            technician: {
              select: {
                user: { select: { name: true } },
              },
            },
            workOrders: {
              select: {
                id: true,
                status: true,
                diagnosis: true,
                technicianNotes: true,
                completedAt: true,
              },
            },
          },
        },
      },
      orderBy: { booking: { scheduledStartAt: 'desc' } },
    });

    const services = bookingUnits.map((bu) => {
      const b = bu.booking;
      const wo = b.workOrders[0];
      return {
        id: b.id,
        bookingCode: b.bookingCode,
        serviceName: b.service.name,
        scheduledDate: b.scheduledStartAt.toISOString(),
        status: b.status,
        technicianName: b.technician?.user?.name || null,
        diagnosis: wo?.diagnosis || null,
        technicianNotes: wo?.technicianNotes || null,
        completedAt: wo?.completedAt?.toISOString() || null,
      };
    });

    const completed = services
      .filter((s) => s.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0];

    return {
      acUnitId: id,
      services,
      totalServices: services.length,
      lastServiceDate: completed ? completed.completedAt : null,
    };
  }

  async uploadPhoto(
    unitId: string,
    fileBuffer: Buffer,
    fileName: string,
    declaredMimeType?: string,
    caption?: string,
    actorUserId?: string,
  ) {
    const businessId = await this.getBusinessId();
    const unit = await this.prisma.acUnit.findFirst({
      where: { id: unitId, customer: { businessId } },
    });

    if (!unit) {
      throw new NotFoundException(`Unit AC dengan ID ${unitId} tidak ditemukan.`);
    }

    const validated = this.storage.validateImage(fileBuffer, declaredMimeType);

    const { objectKey } = await this.storage.uploadObject(
      'ac-units/photos/',
      validated.buffer,
      fileName,
      validated.mimeType,
    );

    const mediaAsset = await this.prisma.mediaAsset.create({
      data: {
        businessId,
        objectKey,
        mimeType: validated.mimeType,
        fileSize: validated.size,
        purpose: 'AC_UNIT_PHOTO',
        createdByUserId: actorUserId || null,
      },
    });

    const photo = await this.prisma.acUnitMedia.create({
      data: {
        acUnitId: unitId,
        mediaAssetId: mediaAsset.id,
        caption: caption ? caption.trim() : null,
      },
      include: { mediaAsset: true },
    });

    await this.audit.log({
      businessId,
      customerId: unit.customerId,
      actorUserId,
      action: 'AC_UNIT_PHOTO_ADDED',
      changedFields: { photoId: photo.id, mediaAssetId: mediaAsset.id },
    });

    return {
      id: photo.id,
      acUnitId: photo.acUnitId,
      mediaAssetId: photo.mediaAssetId,
      url: `/api/v1/admin/ac-units/${unitId}/photos/${photo.id}/content`,
      caption: photo.caption,
      displayOrder: photo.displayOrder,
      createdAt: photo.createdAt.toISOString(),
      updatedAt: photo.updatedAt.toISOString(),
    };
  }

  async getPhotos(unitId: string) {
    const businessId = await this.getBusinessId();
    const unit = await this.prisma.acUnit.findFirst({
      where: { id: unitId, customer: { businessId } },
    });

    if (!unit) {
      throw new NotFoundException(`Unit AC dengan ID ${unitId} tidak ditemukan.`);
    }

    const photos = await this.prisma.acUnitMedia.findMany({
      where: { acUnitId: unitId },
      orderBy: { displayOrder: 'asc' },
      include: { mediaAsset: true },
    });

    return photos.map((p) => ({
      id: p.id,
      acUnitId: p.acUnitId,
      mediaAssetId: p.mediaAssetId,
      url: `/api/v1/admin/ac-units/${unitId}/photos/${p.id}/content`,
      caption: p.caption,
      displayOrder: p.displayOrder,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

  async getPhotoContent(unitId: string, photoId: string) {
    const businessId = await this.getBusinessId();
    const photo = await this.prisma.acUnitMedia.findFirst({
      where: {
        id: photoId,
        acUnitId: unitId,
        acUnit: { customer: { businessId } },
      },
      include: { mediaAsset: true },
    });

    if (!photo || !photo.mediaAsset) {
      throw new NotFoundException('Foto unit AC tidak ditemukan.');
    }

    const stream = await this.storage.getObjectStream(photo.mediaAsset.objectKey);
    if (!stream) {
      throw new NotFoundException('Berkas foto tidak ditemukan di penyimpanan penyimpanan.');
    }

    return {
      stream,
      mimeType: photo.mediaAsset.mimeType,
      fileSize: photo.mediaAsset.fileSize,
    };
  }

  async deletePhoto(unitId: string, photoId: string, actorUserId?: string) {
    const businessId = await this.getBusinessId();
    const photo = await this.prisma.acUnitMedia.findFirst({
      where: {
        id: photoId,
        acUnitId: unitId,
        acUnit: { customer: { businessId } },
      },
      include: { mediaAsset: true },
    });

    if (!photo) {
      throw new NotFoundException('Foto unit AC tidak ditemukan.');
    }

    await this.prisma.acUnitMedia.delete({
      where: { id: photoId },
    });

    // Check if other records reference this media asset
    const remainingReferences = await this.prisma.acUnitMedia.count({
      where: { mediaAssetId: photo.mediaAssetId },
    });

    if (remainingReferences === 0) {
      await this.storage.deleteObject(photo.mediaAsset.objectKey);
      await this.prisma.mediaAsset.delete({
        where: { id: photo.mediaAssetId },
      });
    }

    await this.audit.log({
      businessId,
      customerId: (await this.prisma.acUnit.findUnique({ where: { id: unitId }, select: { customerId: true } }))?.customerId || '',
      actorUserId,
      action: 'AC_UNIT_PHOTO_REMOVED',
      changedFields: { photoId, mediaAssetId: photo.mediaAssetId },
    });

    return { id: photoId, deleted: true };
  }

  private mapUnit(u: any) {
    return {
      id: u.id,
      customerId: u.customerId,
      customerName: u.customer?.name,
      customerCode: u.customer?.customerCode,
      customerAddressId: u.customerAddressId,
      customerAddressLabel: u.customerAddress?.label,
      customerFullAddress: u.customerAddress?.fullAddress,
      unitCode: u.unitCode,
      unitLabel: u.unitLabel,
      brand: u.brand,
      model: u.model,
      type: u.type,
      capacityPk: u.capacityPk.toString(),
      serialNumber: u.serialNumber,
      installationRoom: u.installationRoom,
      installationDate: u.installationDate?.toISOString() || null,
      notes: u.notes,
      isActive: u.isActive,
      archivedAt: u.archivedAt?.toISOString() || null,
      photos: (u.photos || []).map((p: any) => ({
        id: p.id,
        acUnitId: p.acUnitId,
        mediaAssetId: p.mediaAssetId,
        url: `/api/v1/admin/ac-units/${u.id}/photos/${p.id}/content`,
        caption: p.caption,
        displayOrder: p.displayOrder,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    };
  }
}
