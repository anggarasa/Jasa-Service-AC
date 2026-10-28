import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StorageService } from '../../infrastructure/storage/storage.service';
import { MediaService } from '../media/media.service';
import { PublicBusinessResponseDto } from './dto/public-business-response.dto';
import { PublicServiceQueryDto } from './dto/public-service-query.dto';

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly mediaService: MediaService,
  ) {}

  private async getActiveBusiness() {
    const business = await this.prisma.business.findFirst({
      where: { isActive: true },
    });
    if (!business) {
      throw new NotFoundException('Data bisnis tidak tersedia.');
    }
    return business;
  }

  async getPublicBusiness(): Promise<PublicBusinessResponseDto> {
    const business = await this.getActiveBusiness();
    let logoMediaUrl: string | null = null;
    if (business.logoObjectKey) {
      try {
        logoMediaUrl = await this.storage.getPresignedDownloadUrl(business.logoObjectKey);
      } catch {
        logoMediaUrl = null;
      }
    }

    return {
      name: business.name,
      slug: business.slug,
      description: business.description,
      phone: business.phone,
      whatsappNumber: business.whatsappNumber,
      email: business.email,
      address: business.address,
      city: business.city,
      province: business.province,
      postalCode: business.postalCode,
      googleMapsUrl: business.googleMapsUrl,
      timezone: business.timezone,
      logoMediaUrl,
      isOpenForPublicDisplay: business.isActive,
    };
  }

  async getPublicOperatingHours() {
    const business = await this.getActiveBusiness();

    const [hours, closures] = await Promise.all([
      this.prisma.businessOperatingHour.findMany({
        where: { businessId: business.id },
        include: {
          breaks: {
            orderBy: { startTime: 'asc' },
          },
        },
        orderBy: { dayOfWeek: 'asc' },
      }),
      this.prisma.businessClosure.findMany({
        where: {
          businessId: business.id,
          isActive: true,
          endDate: { gte: new Date() },
        },
        orderBy: { startDate: 'asc' },
      }),
    ]);

    return {
      timezone: business.timezone,
      schedule: hours,
      upcomingClosures: closures,
    };
  }

  async getPublicCategories() {
    const business = await this.getActiveBusiness();
    const categories = await this.prisma.serviceCategory.findMany({
      where: {
        businessId: business.id,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            services: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      displayOrder: cat.displayOrder,
      serviceCount: cat._count.services,
    }));
  }

  async getPublicServices(query: PublicServiceQueryDto) {
    const business = await this.getActiveBusiness();
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ServiceWhereInput = {
      businessId: business.id,
      isActive: true,
      category: {
        isActive: true,
        ...(query.category
          ? {
              OR: [{ id: query.category }, { slug: query.category }],
            }
          : {}),
      },
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

    const [total, services] = await Promise.all([
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

    const items = await Promise.all(
      services.map(async (s) => {
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
          name: s.name,
          slug: s.slug,
          category: s.category,
          shortDescription: s.shortDescription,
          description: s.description,
          priceType: s.priceType,
          basePrice: s.basePrice ? s.basePrice.toString() : null,
          basePriceNumber: s.basePrice ? Number(s.basePrice) : null,
          pricingUnit: s.pricingUnit,
          estimatedDurationMinutes: s.estimatedDurationMinutes,
          minimumUnits: s.minimumUnits,
          maximumUnits: s.maximumUnits,
          imageUrl,
          displayOrder: s.displayOrder,
        };
      }),
    );

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPublicServiceBySlug(slug: string) {
    const business = await this.getActiveBusiness();

    const service = await this.prisma.service.findFirst({
      where: {
        businessId: business.id,
        slug,
        isActive: true,
        category: {
          isActive: true,
        },
      },
      include: {
        category: true,
      },
    });

    if (!service) {
      throw new NotFoundException(`Layanan dengan slug '${slug}' tidak ditemukan atau sedang tidak aktif.`);
    }

    let imageUrl: string | null = null;
    if (service.imageObjectKey) {
      try {
        imageUrl = await this.storage.getPresignedDownloadUrl(service.imageObjectKey);
      } catch {
        imageUrl = null;
      }
    }

    // Related active services
    const related = await this.prisma.service.findMany({
      where: {
        businessId: business.id,
        categoryId: service.categoryId,
        id: { not: service.id },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        priceType: true,
        basePrice: true,
        pricingUnit: true,
        estimatedDurationMinutes: true,
        imageObjectKey: true,
      },
      take: 3,
      orderBy: { displayOrder: 'asc' },
    });

    const relatedFormatted = await Promise.all(
      related.map(async (r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        shortDescription: r.shortDescription,
        priceType: r.priceType,
        basePrice: r.basePrice ? r.basePrice.toString() : null,
        basePriceNumber: r.basePrice ? Number(r.basePrice) : null,
        pricingUnit: r.pricingUnit,
        estimatedDurationMinutes: r.estimatedDurationMinutes,
        imageUrl: r.imageObjectKey
          ? await this.storage.getPresignedDownloadUrl(r.imageObjectKey).catch(() => null)
          : null,
      })),
    );

    return {
      id: service.id,
      name: service.name,
      slug: service.slug,
      categoryId: service.categoryId,
      category: {
        id: service.category.id,
        name: service.category.name,
        slug: service.category.slug,
        description: service.category.description,
      },
      shortDescription: service.shortDescription,
      description: service.description,
      priceType: service.priceType,
      basePrice: service.basePrice ? service.basePrice.toString() : null,
      basePriceNumber: service.basePrice ? Number(service.basePrice) : null,
      pricingUnit: service.pricingUnit,
      estimatedDurationMinutes: service.estimatedDurationMinutes,
      additionalBufferMinutes: service.additionalBufferMinutes,
      minimumUnits: service.minimumUnits,
      maximumUnits: service.maximumUnits,
      imageUrl,
      relatedServices: relatedFormatted,
    };
  }

  async getPublicServiceAreas() {
    const business = await this.getActiveBusiness();
    const areas = await this.prisma.serviceArea.findMany({
      where: {
        businessId: business.id,
        isActive: true,
      },
      orderBy: [{ displayOrder: 'asc' }, { city: 'asc' }, { district: 'asc' }],
    });

    return areas.map((a) => ({
      id: a.id,
      name: a.name,
      province: a.province,
      city: a.city,
      district: a.district,
      visitFee: a.visitFee.toString(),
      visitFeeNumber: Number(a.visitFee),
      estimatedTravelMinutes: a.estimatedTravelMinutes,
    }));
  }

  async getPublicGallery() {
    const business = await this.getActiveBusiness();
    const items = await this.prisma.businessGallery.findMany({
      where: {
        businessId: business.id,
        isActive: true,
      },
      include: {
        mediaAsset: true,
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return Promise.all(
      items.map(async (item) => {
        const url = await this.storage.getPresignedDownloadUrl(item.mediaAsset.objectKey);
        return {
          id: item.id,
          caption: item.caption,
          altText: item.altText,
          displayOrder: item.displayOrder,
          url,
        };
      }),
    );
  }

  async getPublicMedia(id: string) {
    return this.mediaService.getPublicMedia(id);
  }
}
