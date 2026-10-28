import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateServiceAreaDto } from './dto/create-service-area.dto';
import { UpdateServiceAreaDto } from './dto/update-service-area.dto';

@Injectable()
export class ServiceAreasService {
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
    const areas = await this.prisma.serviceArea.findMany({
      where: { businessId },
      orderBy: [{ displayOrder: 'asc' }, { city: 'asc' }, { district: 'asc' }],
    });

    return areas.map((a) => ({
      ...a,
      visitFee: a.visitFee.toString(),
      visitFeeNumber: Number(a.visitFee),
    }));
  }

  async findOne(id: string) {
    const businessId = await this.getBusinessId();
    const area = await this.prisma.serviceArea.findFirst({
      where: { id, businessId },
    });

    if (!area) {
      throw new NotFoundException(`Area layanan dengan ID ${id} tidak ditemukan.`);
    }

    return {
      ...area,
      visitFee: area.visitFee.toString(),
      visitFeeNumber: Number(area.visitFee),
    };
  }

  async create(dto: CreateServiceAreaDto) {
    const businessId = await this.getBusinessId();

    const existing = await this.prisma.serviceArea.findUnique({
      where: {
        businessId_name: {
          businessId,
          name: dto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Area layanan dengan nama '${dto.name}' sudah terdaftar.`);
    }

    const created = await this.prisma.serviceArea.create({
      data: {
        businessId,
        name: dto.name,
        province: dto.province,
        city: dto.city,
        district: dto.district,
        visitFee: new Prisma.Decimal(dto.visitFee !== undefined ? dto.visitFee : 0),
        estimatedTravelMinutes: dto.estimatedTravelMinutes !== undefined ? dto.estimatedTravelMinutes : 30,
        displayOrder: dto.displayOrder !== undefined ? dto.displayOrder : 0,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    return {
      ...created,
      visitFee: created.visitFee.toString(),
      visitFeeNumber: Number(created.visitFee),
    };
  }

  async update(id: string, dto: UpdateServiceAreaDto) {
    const current = await this.findOne(id);
    const businessId = await this.getBusinessId();

    if (dto.name && dto.name !== current.name) {
      const existing = await this.prisma.serviceArea.findUnique({
        where: {
          businessId_name: {
            businessId,
            name: dto.name,
          },
        },
      });
      if (existing && existing.id !== current.id) {
        throw new ConflictException(`Area layanan dengan nama '${dto.name}' sudah terdaftar.`);
      }
    }

    const updated = await this.prisma.serviceArea.update({
      where: { id: current.id },
      data: {
        name: dto.name !== undefined ? dto.name : current.name,
        province: dto.province !== undefined ? dto.province : current.province,
        city: dto.city !== undefined ? dto.city : current.city,
        district: dto.district !== undefined ? dto.district : current.district,
        visitFee:
          dto.visitFee !== undefined
            ? new Prisma.Decimal(dto.visitFee)
            : new Prisma.Decimal(current.visitFee),
        estimatedTravelMinutes:
          dto.estimatedTravelMinutes !== undefined
            ? dto.estimatedTravelMinutes
            : current.estimatedTravelMinutes,
        displayOrder: dto.displayOrder !== undefined ? dto.displayOrder : current.displayOrder,
        isActive: dto.isActive !== undefined ? dto.isActive : current.isActive,
      },
    });

    return {
      ...updated,
      visitFee: updated.visitFee.toString(),
      visitFeeNumber: Number(updated.visitFee),
    };
  }

  async remove(id: string) {
    const current = await this.findOne(id);
    await this.prisma.serviceArea.delete({
      where: { id: current.id },
    });

    return { message: 'Area layanan berhasil dihapus.' };
  }
}
