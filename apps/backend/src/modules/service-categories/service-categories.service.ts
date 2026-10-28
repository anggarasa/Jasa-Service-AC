import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class ServiceCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

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

  async findAll() {
    const businessId = await this.getBusinessId();
    const categories = await this.prisma.serviceCategory.findMany({
      where: { businessId },
      include: {
        _count: {
          select: { services: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      businessId: cat.businessId,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      displayOrder: cat.displayOrder,
      isActive: cat.isActive,
      serviceCount: cat._count.services,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));
  }

  async findOne(id: string) {
    const businessId = await this.getBusinessId();
    const category = await this.prisma.serviceCategory.findFirst({
      where: { id, businessId },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Kategori dengan ID ${id} tidak ditemukan.`);
    }

    return {
      id: category.id,
      businessId: category.businessId,
      name: category.name,
      slug: category.slug,
      description: category.description,
      displayOrder: category.displayOrder,
      isActive: category.isActive,
      serviceCount: category._count.services,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  async create(dto: CreateCategoryDto) {
    const businessId = await this.getBusinessId();

    const existing = await this.prisma.serviceCategory.findUnique({
      where: {
        businessId_slug: {
          businessId,
          slug: dto.slug,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Slug kategori '${dto.slug}' sudah digunakan.`);
    }

    return this.prisma.serviceCategory.create({
      data: {
        businessId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        displayOrder: dto.displayOrder !== undefined ? dto.displayOrder : 0,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const current = await this.findOne(id);
    const businessId = await this.getBusinessId();

    if (dto.slug && dto.slug !== current.slug) {
      const existing = await this.prisma.serviceCategory.findUnique({
        where: {
          businessId_slug: {
            businessId,
            slug: dto.slug,
          },
        },
      });
      if (existing && existing.id !== current.id) {
        throw new ConflictException(`Slug kategori '${dto.slug}' sudah digunakan.`);
      }
    }

    return this.prisma.serviceCategory.update({
      where: { id: current.id },
      data: {
        name: dto.name !== undefined ? dto.name : current.name,
        slug: dto.slug !== undefined ? dto.slug : current.slug,
        description: dto.description !== undefined ? dto.description : current.description,
        displayOrder: dto.displayOrder !== undefined ? dto.displayOrder : current.displayOrder,
        isActive: dto.isActive !== undefined ? dto.isActive : current.isActive,
      },
    });
  }

  async remove(id: string) {
    const current = await this.findOne(id);

    if (current.serviceCount > 0) {
      throw new BadRequestException(
        'Kategori tidak dapat dihapus karena masih memuat layanan terkait. Silakan nonaktifkan kategori alih-alih menghapusnya.',
      );
    }

    await this.prisma.serviceCategory.delete({
      where: { id: current.id },
    });

    return { message: 'Kategori layanan berhasil dihapus.' };
  }
}
