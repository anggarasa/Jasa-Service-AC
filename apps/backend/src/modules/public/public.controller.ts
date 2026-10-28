import {
  Controller,
  Get,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { Public } from '../auth/decorators/public.decorator';
import { PublicService } from './public.service';
import { PublicServiceQueryDto } from './dto/public-service-query.dto';

@ApiTags('Public Website')
@Public()
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('business')
  @ApiOperation({ summary: 'Mendapatkan informasi profil publik bisnis & kontak operasional' })
  @ApiResponse({ status: 200, description: 'Profil publik berhasil dimuat' })
  async getBusiness() {
    return this.publicService.getPublicBusiness();
  }

  @Get('operating-hours')
  @ApiOperation({ summary: 'Mendapatkan jam operasional publik dan jadwal libur mendatang' })
  @ApiResponse({ status: 200, description: 'Jadwal operasional berhasil dimuat' })
  async getOperatingHours() {
    return this.publicService.getPublicOperatingHours();
  }

  @Get('service-categories')
  @ApiOperation({ summary: 'Mendapatkan daftar kategori layanan AC publik yang aktif' })
  @ApiResponse({ status: 200, description: 'Daftar kategori publik berhasil dimuat' })
  async getCategories() {
    return this.publicService.getPublicCategories();
  }

  @Get('services')
  @ApiOperation({ summary: 'Mendapatkan katalog layanan AC publik yang aktif dengan filter & paginasi' })
  @ApiResponse({ status: 200, description: 'Katalog layanan berhasil dimuat' })
  async getServices(@Query() query: PublicServiceQueryDto) {
    return this.publicService.getPublicServices(query);
  }

  @Get('services/:slug')
  @ApiOperation({ summary: 'Mendapatkan detail layanan AC publik berdasarkan slug' })
  @ApiResponse({ status: 200, description: 'Detail layanan berhasil dimuat' })
  async getServiceBySlug(@Param('slug') slug: string) {
    return this.publicService.getPublicServiceBySlug(slug);
  }

  @Get('service-areas')
  @ApiOperation({ summary: 'Mendapatkan daftar cakupan wilayah layanan AC publik dan ongkos kunjungan' })
  @ApiResponse({ status: 200, description: 'Daftar area berhasil dimuat' })
  async getServiceAreas() {
    return this.publicService.getPublicServiceAreas();
  }

  @Get('gallery')
  @ApiOperation({ summary: 'Mendapatkan galeri foto pengerjaan servis AC publik' })
  @ApiResponse({ status: 200, description: 'Galeri publik berhasil dimuat' })
  async getGallery() {
    return this.publicService.getPublicGallery();
  }

  @Get('media/:id')
  @ApiOperation({ summary: 'Akses aman berkas media publik (Logo, Gambar Layanan, Galeri)' })
  async getMedia(@Param('id') id: string, @Res() res: FastifyReply) {
    const { asset, stream, presignedUrl } = await this.publicService.getPublicMedia(id);

    if (stream) {
      res.header('Content-Type', asset.mimeType);
      res.header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=43200');
      return res.send(stream);
    }

    return res.redirect(presignedUrl, 302);
  }
}
