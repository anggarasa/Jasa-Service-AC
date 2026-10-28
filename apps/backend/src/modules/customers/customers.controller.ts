import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('Admin Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
@Controller('admin/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('check-duplicate')
  @ApiOperation({ summary: 'Periksa kandidat duplikasi pelanggan berdasarkan nomor telepon' })
  @ApiResponse({ status: 200, description: 'Hasil pemeriksaan kandidat duplikasi' })
  checkDuplicate(@Query('phone') phone: string) {
    return this.customersService.checkDuplicate(phone || '');
  }

  @Get()
  @ApiOperation({ summary: 'Daftar direktori pelanggan dengan paginasi, filter, dan pencarian' })
  @ApiResponse({ status: 200, description: 'Daftar pelanggan berhasil diambil' })
  findAll(@Query() query: CustomerQueryDto) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail profil pelanggan beserta alamat dan unit AC' })
  @ApiResponse({ status: 200, description: 'Detail pelanggan berhasil diambil' })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tambah pelanggan baru' })
  @ApiResponse({ status: 201, description: 'Pelanggan berhasil didaftarkan' })
  create(
    @Body() dto: CreateCustomerDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.customersService.create(dto, user?.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui profil pelanggan' })
  @ApiResponse({ status: 200, description: 'Data pelanggan berhasil diperbarui' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.customersService.update(id, dto, user?.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Arsipkan pelanggan (soft-delete aman)' })
  @ApiResponse({ status: 200, description: 'Pelanggan berhasil diarsipkan' })
  archive(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.customersService.archive(id, user?.id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Riwayat layanan servis dan pesanan pelanggan' })
  @ApiResponse({ status: 200, description: 'Riwayat layanan pelanggan' })
  getHistory(@Param('id') id: string) {
    return this.customersService.getHistory(id);
  }
}
