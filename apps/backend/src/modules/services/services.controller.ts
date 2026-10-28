import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';

@ApiTags('Admin Services')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mendapatkan daftar katalog layanan AC dengan filter & paginasi' })
  @ApiResponse({ status: 200, description: 'Daftar layanan berhasil dimuat' })
  async findAll(@Query() query: QueryServiceDto) {
    return this.servicesService.findAll(query);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Membuat layanan AC baru dengan penetapan aturan harga' })
  @ApiResponse({ status: 201, description: 'Layanan AC berhasil dibuat' })
  async create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mendapatkan detail layanan AC berdasarkan ID' })
  async findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Memperbarui layanan AC dan aturan harga' })
  async update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Menghapus layanan AC (Bila belum tercatat dalam riwayat booking)' })
  async remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
