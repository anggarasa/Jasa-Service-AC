import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AcUnitsService } from './ac-units.service';

@ApiTags('Admin AC Unit Photos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
@Controller('admin/ac-units/:id/photos')
export class AcUnitPhotosController {
  constructor(private readonly acUnitsService: AcUnitsService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar foto dokumentasi unit AC' })
  @ApiResponse({ status: 200, description: 'Daftar foto berhasil dimuat' })
  getPhotos(@Param('id') id: string) {
    return this.acUnitsService.getPhotos(id);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Unggah foto dokumentasi unit AC ke MinIO (JPEG, PNG, WebP max 5MB)' })
  @ApiResponse({ status: 201, description: 'Foto berhasil diunggah' })
  async uploadPhoto(
    @Param('id') id: string,
    @Req() req: FastifyRequest,
    @CurrentUser() user: { id: string },
  ) {
    if (!req.file) {
      throw new BadRequestException('Metode unggah berkas multipart tidak tersedia pada request.');
    }

    const part = await req.file();
    if (!part) {
      throw new BadRequestException('Berkas foto tidak ditemukan.');
    }

    const buffer = await part.toBuffer();
    const captionField = (part.fields?.caption as any)?.value;

    return this.acUnitsService.uploadPhoto(
      id,
      buffer,
      part.filename,
      part.mimetype,
      captionField,
      user?.id,
    );
  }

  @Get(':photoId/content')
  @ApiOperation({ summary: 'Streaming berkas foto unit AC berotorisasi' })
  async getPhotoContent(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @Res() res: FastifyReply,
  ) {
    const { stream, mimeType } = await this.acUnitsService.getPhotoContent(id, photoId);

    res.header('Content-Type', mimeType);
    res.header('Cache-Control', 'private, max-age=3600');
    res.header('X-Content-Type-Options', 'nosniff');
    return res.send(stream);
  }

  @Delete(':photoId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus foto dokumentasi unit AC secara aman dari MinIO dan database' })
  @ApiResponse({ status: 200, description: 'Foto berhasil dihapus' })
  deletePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.acUnitsService.deletePhoto(id, photoId, user?.id);
  }
}
