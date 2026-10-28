import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PriceType, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private async getBusinessId(): Promise<string> {
    const business = await this.prisma.business.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    if (!business) {
      throw new NotFoundException('Data bisnis belum diinisialisasi.');
    }
    return business.id;
  }

  private validatePricingAndUnits(
    priceType: PriceType,
    basePrice: number | undefined | null,
    minimumUnits?: number,
    maximumUnits?: number,
  ) {
    if (priceType === PriceType.FIXED) {
      if (basePrice === undefined || basePrice === null || basePrice <= 0) {
        throw new BadRequestException('Layanan harga tetap (FIXED) wajib memiliki harga dasar di atas 0.');
      }
    } else if (priceType === PriceType.STARTING_FROM) {
      if (basePrice === undefined || basePrice === null || basePrice < 0) {
        throw new BadRequestException('Layanan mulai dari (STARTING_FROM) wajib memiliki harga dasar non-negatif.');
      }
    }

    if (minimumUnits !== undefined && maximumUnits !== undefined) {
      if (maximumUnits < minimumUnits) {
        throw new BadRequestException('Jumlah maksimum unit tidak boleh lebih kecil dari jumlah minimum unit.');
      }
    }
  }

  async findAll(query: QueryServiceDto) {
    const businessId = await this.getBusinessId();
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ServiceWhereInput = {
      businessId,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.priceType ? { priceType: query.priceType } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
              { shortDescription: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.service.count({ where }),
      this.prisma.service.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    const formattedItems = await Promise.all(
      items.map(async (s) => {
        let imageUrl: string | null = null;
        if (s.imageObjectKey) {
          try {
            imageUrl = await this.storage.getPresignedDownloadUrl(s.imageObjectKey);
          } catch {
            imageUrl = null;
          }
        }
        return {
          id: s.id,
          businessId: s.businessId,
          categoryId: s.categoryId,
          category: s.category,
          name: s.name,
          slug: s.slug,
          shortDescription: s.shortDescription,
          description: s.description,
          priceType: s.priceType,
          basePrice: s.basePrice ? s.basePrice.toString() : null,
          basePriceNumber: s.basePrice ? Number(s.basePrice) : null,
          pricingUnit: s.pricingUnit,
          estimatedDurationMinutes: s.estimatedDurationMinutes,
          additionalBufferMinutes: s.additionalBufferMinutes,
          minimumUnits: s.minimumUnits,
          maximumUnits: s.maximumUnits,
          imageObjectKey: s.imageObjectKey,
          imageUrl,
          displayOrder: s.displayOrder,
          isActive: s.isActive,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        };
      }),
    );

    return {
      items: formattedItems,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const businessId = await this.getBusinessId();
    const s = await this.prisma.service.findFirst({
      where: { id, businessId },
      include: {
        category: true,
      },
    });

    if (!s) {
      throw new NotFoundException(`Layanan AC dengan ID ${id} tidak ditemukan.`);
    }

    let imageUrl: string | null = null;
    if (s.imageObjectKey) {
      try {
        imageUrl = await this.storage.getPresignedDownloadUrl(s.imageObjectKey);
      } catch {
        imageUrl = null;
      }
    }

    return {
      id: s.id,
      businessId: s.businessId,
      categoryId: s.categoryId,
      category: s.category,
      name: s.name,
      slug: s.slug,
      shortDescription: s.shortDescription,
      description: s.description,
      priceType: s.priceType,
      basePrice: s.basePrice ? s.basePrice.toString() : null,
      basePriceNumber: s.basePrice ? Number(s.basePrice) : null,
      pricingUnit: s.pricingUnit,
      estimatedDurationMinutes: s.estimatedDurationMinutes,
      additionalBufferMinutes: s.additionalBufferMinutes,
      minimumUnits: s.minimumUnits,
      maximumUnits: s.maximumUnits,
      imageObjectKey: s.imageObjectKey,
      imageUrl,
      displayOrder: s.displayOrder,
      isActive: s.isActive,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }

  async create(dto: CreateServiceDto) {
    const businessId = await this.getBusinessId();

    // Check category exists in business
    const category = await this.prisma.serviceCategory.findFirst({
      where: { id: dto.categoryId, businessId },
    });
    if (!category) {
      throw new BadRequestException('Kategori layanan yang dipilih tidak valid.');
    }

    // Check slug uniqueness
    const existing = await this.prisma.service.findUnique({
      where: {
        businessId_slug: {
          businessId,
          slug: dto.slug,
        },
      },
    });
    if (existing) {
      throw new ConflictException(`Slug layanan '${dto.slug}' sudah digunakan.`);
    }

    const minUnits = dto.minimumUnits !== undefined ? dto.minimumUnits : 1;
    const maxUnits = dto.maximumUnits !== undefined ? dto.maximumUnits : 10;
    this.validatePricingAndUnits(dto.priceType, dto.basePrice, minUnits, maxUnits);

    const created = await this.prisma.service.create({
      data: {
        businessId,
        categoryId: dto.categoryId,
        name: dto.name,
        slug: dto.slug,
        shortDescription: dto.shortDescription,
        description: dto.description,
        priceType: dto.priceType,
        basePrice: dto.basePrice !== undefined && dto.basePrice !== null ? new Prisma.Decimal(dto.basePrice) : null,
        pricingUnit: dto.pricingUnit || 'PER_UNIT',
        estimatedDurationMinutes: dto.estimatedDurationMinutes !== undefined ? dto.estimatedDurationMinutes : 60,
        additionalBufferMinutes: dto.additionalBufferMinutes !== undefined ? dto.additionalBufferMinutes : 0,
        minimumUnits: minUnits,
        maximumUnits: maxUnits,
        imageObjectKey: dto.imageObjectKey || null,
        displayOrder: dto.displayOrder !== undefined ? dto.displayOrder : 0,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      include: {
        category: true,
      },
    });

    return {
      ...created,
      basePrice: created.basePrice ? created.basePrice.toString() : null,
      basePriceNumber: created.basePrice ? Number(created.basePrice) : null,
    };
  }

  async update(id: string, dto: UpdateServiceDto) {
    const current = await this.findOne(id);
    const businessId = await this.getBusinessId();

    if (dto.categoryId && dto.categoryId !== current.categoryId) {
      const category = await this.prisma.serviceCategory.findFirst({
        where: { id: dto.categoryId, businessId },
      });
      if (!category) {
        throw new BadRequestException('Kategori layanan yang dipilih tidak valid.');
      }
    }

    if (dto.slug && dto.slug !== current.slug) {
      const existing = await this.prisma.service.findUnique({
        where: {
          businessId_slug: {
            businessId,
            slug: dto.slug,
          },
        },
      });
      if (existing && existing.id !== current.id) {
        throw new ConflictException(`Slug layanan '${dto.slug}' sudah digunakan.`);
      }
    }

    const targetPriceType = dto.priceType || current.priceType;
    const targetPrice = dto.basePrice !== undefined ? dto.basePrice : current.basePriceNumber;
    const targetMinUnits = dto.minimumUnits !== undefined ? dto.minimumUnits : current.minimumUnits;
    const targetMaxUnits = dto.maximumUnits !== undefined ? dto.maximumUnits : current.maximumUnits;

    this.validatePricingAndUnits(targetPriceType, targetPrice, targetMinUnits, targetMaxUnits);

    const updated = await this.prisma.service.update({
      where: { id: current.id },
      data: {
        categoryId: dto.categoryId !== undefined ? dto.categoryId : current.categoryId,
        name: dto.name !== undefined ? dto.name : current.name,
        slug: dto.slug !== undefined ? dto.slug : current.slug,
        shortDescription: dto.shortDescription !== undefined ? dto.shortDescription : current.shortDescription,
        description: dto.description !== undefined ? dto.description : current.description,
        priceType: dto.priceType !== undefined ? dto.priceType : current.priceType,
        basePrice:
          dto.basePrice !== undefined
            ? dto.basePrice !== null
              ? new Prisma.Decimal(dto.basePrice)
              : null
            : current.basePrice !== null
              ? new Prisma.Decimal(current.basePrice)
              : null,
        pricingUnit: dto.pricingUnit !== undefined ? dto.pricingUnit : current.pricingUnit,
        estimatedDurationMinutes:
          dto.estimatedDurationMinutes !== undefined
            ? dto.estimatedDurationMinutes
            : current.estimatedDurationMinutes,
        additionalBufferMinutes:
          dto.additionalBufferMinutes !== undefined
            ? dto.additionalBufferMinutes
            : current.additionalBufferMinutes,
        minimumUnits: targetMinUnits,
        maximumUnits: targetMaxUnits,
        imageObjectKey: dto.imageObjectKey !== undefined ? dto.imageObjectKey : current.imageObjectKey,
        displayOrder: dto.displayOrder !== undefined ? dto.displayOrder : current.displayOrder,
        isActive: dto.isActive !== undefined ? dto.isActive : current.isActive,
      },
      include: {
        category: true,
      },
    });

    return {
      ...updated,
      basePrice: updated.basePrice ? updated.basePrice.toString() : null,
      basePriceNumber: updated.basePrice ? Number(updated.basePrice) : null,
    };
  }

  async remove(id: string) {
    const current = await this.findOne(id);

    // Check if referenced by any bookings
    const bookingsCount = await this.prisma.booking.count({
      where: { serviceId: current.id },
    });

    if (bookingsCount > 0) {
      throw new BadRequestException(
        'Layanan tidak dapat dihapus karena tercatat dalam riwayat booking. Silakan nonaktifkan layanan alih-alih menghapusnya.',
      );
    }

    await this.prisma.service.delete({
      where: { id: current.id },
    });

    return { message: 'Layanan AC berhasil dihapus.' };
  }
}
