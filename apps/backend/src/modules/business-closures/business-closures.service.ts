import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateClosureDto } from './dto/create-closure.dto';
import { UpdateClosureDto } from './dto/update-closure.dto';

@Injectable()
export class BusinessClosuresService {
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
    return this.prisma.businessClosure.findMany({
      where: { businessId },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const businessId = await this.getBusinessId();
    const closure = await this.prisma.businessClosure.findFirst({
      where: { id, businessId },
    });
    if (!closure) {
      throw new NotFoundException(`Data penutupan dengan ID ${id} tidak ditemukan.`);
    }
    return closure;
  }

  async create(dto: CreateClosureDto) {
    const businessId = await this.getBusinessId();
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (start > end) {
      throw new BadRequestException('Tanggal mulai tidak boleh lebih besar dari tanggal selesai.');
    }

    return this.prisma.businessClosure.create({
      data: {
        businessId,
        startDate: start,
        endDate: end,
        reason: dto.reason,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async update(id: string, dto: UpdateClosureDto) {
    const current = await this.findOne(id);

    const start = dto.startDate ? new Date(dto.startDate) : current.startDate;
    const end = dto.endDate ? new Date(dto.endDate) : current.endDate;

    if (start > end) {
      throw new BadRequestException('Tanggal mulai tidak boleh lebih besar dari tanggal selesai.');
    }

    return this.prisma.businessClosure.update({
      where: { id: current.id },
      data: {
        startDate: start,
        endDate: end,
        reason: dto.reason !== undefined ? dto.reason : current.reason,
        isActive: dto.isActive !== undefined ? dto.isActive : current.isActive,
      },
    });
  }

  async remove(id: string) {
    const current = await this.findOne(id);
    await this.prisma.businessClosure.delete({
      where: { id: current.id },
    });
    return { message: 'Data hari libur / penutupan berhasil dihapus.' };
  }
}
