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
import { ServiceAreasService } from './service-areas.service';
import { CreateServiceAreaDto } from './dto/create-service-area.dto';
import { UpdateServiceAreaDto } from './dto/update-service-area.dto';

@ApiTags('Admin Service Areas')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/service-areas')
export class ServiceAreasController {
  constructor(private readonly serviceAreasService: ServiceAreasService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mendapatkan daftar seluruh area cakupan layanan & ongkos kunjungan' })
  @ApiResponse({ status: 200, description: 'Daftar area layanan berhasil dimuat' })
  async findAll() {
    return this.serviceAreasService.findAll();
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Menambahkan area cakupan layanan baru' })
  @ApiResponse({ status: 201, description: 'Area layanan berhasil ditambahkan' })
  async create(@Body() dto: CreateServiceAreaDto) {
    return this.serviceAreasService.create(dto);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mendapatkan detail area layanan berdasarkan ID' })
  async findOne(@Param('id') id: string) {
    return this.serviceAreasService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Memperbarui area cakupan layanan & ongkos kunjungan' })
  async update(@Param('id') id: string, @Body() dto: UpdateServiceAreaDto) {
    return this.serviceAreasService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Menghapus area layanan' })
  async remove(@Param('id') id: string) {
    return this.serviceAreasService.remove(id);
  }
}
