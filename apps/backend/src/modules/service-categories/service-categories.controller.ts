import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ServiceCategoriesService } from './service-categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Admin Categories')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/service-categories')
export class ServiceCategoriesController {
  constructor(private readonly categoriesService: ServiceCategoriesService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mendapatkan daftar semua kategori layanan AC' })
  @ApiResponse({ status: 200, description: 'Daftar kategori berhasil dimuat' })
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Membuat kategori layanan AC baru' })
  @ApiResponse({ status: 201, description: 'Kategori berhasil dibuat' })
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mendapatkan detail kategori layanan AC berdasarkan ID' })
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Memperbarui data kategori layanan AC' })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Menghapus kategori layanan AC (Bila tidak memiliki layanan)' })
  async remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
