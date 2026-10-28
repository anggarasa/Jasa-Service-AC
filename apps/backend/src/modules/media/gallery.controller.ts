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
import { MediaService } from './media.service';
import { CreateGalleryItemDto } from './dto/create-gallery-item.dto';
import { UpdateGalleryItemDto } from './dto/update-gallery-item.dto';

@ApiTags('Admin Media & Gallery')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/gallery')
export class GalleryController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mendapatkan daftar semua item galeri bisnis' })
  @ApiResponse({ status: 200, description: 'Daftar item galeri berhasil dimuat' })
  async findAll() {
    return this.mediaService.findAllGallery();
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Menambahkan item galeri baru' })
  @ApiResponse({ status: 201, description: 'Item galeri berhasil dibuat' })
  async create(@Body() dto: CreateGalleryItemDto) {
    return this.mediaService.createGalleryItem(dto);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Memperbarui data item galeri (caption, urutan, status)' })
  async update(@Param('id') id: string, @Body() dto: UpdateGalleryItemDto) {
    return this.mediaService.updateGalleryItem(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Menghapus item galeri' })
  async remove(@Param('id') id: string) {
    return this.mediaService.deleteGalleryItem(id);
  }
}
