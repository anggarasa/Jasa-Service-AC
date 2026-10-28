import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MediaPurpose, UserRole } from '@prisma/client';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/token-payload';
import { MediaService } from './media.service';

@ApiTags('Admin Media & Gallery')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Mengunggah gambar (logo, cover layanan, galeri) ke MinIO' })
  @ApiResponse({ status: 201, description: 'Gambar berhasil divalidasi dan diunggah' })
  async upload(
    @Req() req: FastifyRequest,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    // Fastify multipart extraction
    if (!req.file) {
      throw new BadRequestException('Metode unggah berkas multipart tidak tersedia pada request.');
    }

    const part = await req.file();
    if (!part) {
      throw new BadRequestException('Berkas berkas gambar tidak ditemukan.');
    }

    const buffer = await part.toBuffer();
    const purposeField = (part.fields?.purpose as any)?.value;
    const purpose =
      purposeField && Object.values(MediaPurpose).includes(purposeField)
        ? (purposeField as MediaPurpose)
        : MediaPurpose.GALLERY_IMAGE;

    return this.mediaService.uploadMedia(
      buffer,
      part.filename,
      purpose,
      user?.id,
    );
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mendapatkan daftar media asset terunggah' })
  async findAll(@Query('purpose') purpose?: MediaPurpose) {
    return this.mediaService.findAllMedia(purpose);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mendapatkan metadata media asset berdasarkan ID' })
  async findOne(@Param('id') id: string) {
    return this.mediaService.findMediaById(id);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Menghapus media asset dari database dan MinIO' })
  async remove(@Param('id') id: string) {
    return this.mediaService.deleteMedia(id);
  }
}
