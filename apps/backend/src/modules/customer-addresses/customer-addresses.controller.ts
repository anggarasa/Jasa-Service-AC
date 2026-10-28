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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CustomerAddressesService } from './customer-addresses.service';
import { CreateCustomerAddressDto } from './dto/create-customer-address.dto';
import { UpdateCustomerAddressDto } from './dto/update-customer-address.dto';
import { ValidateAreaDto } from './dto/validate-area.dto';

@ApiTags('Admin Customer Addresses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
@Controller('admin/customers/:customerId/addresses')
export class CustomerAddressesController {
  constructor(private readonly addressesService: CustomerAddressesService) {}

  @Post('validate-area')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validasi ketercakupan area servis berdasarkan kota dan kecamatan' })
  @ApiResponse({ status: 200, description: 'Hasil validasi area servis' })
  validateArea(
    @Param('customerId') customerId: string,
    @Body() dto: ValidateAreaDto,
  ) {
    return this.addressesService.validateServiceArea(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar semua alamat aktif milik pelanggan' })
  @ApiResponse({ status: 200, description: 'Daftar alamat berhasil diambil' })
  findAll(@Param('customerId') customerId: string) {
    return this.addressesService.findAll(customerId);
  }

  @Get(':addressId')
  @ApiOperation({ summary: 'Detail alamat pelanggan' })
  @ApiResponse({ status: 200, description: 'Detail alamat berhasil diambil' })
  findOne(
    @Param('customerId') customerId: string,
    @Param('addressId') addressId: string,
  ) {
    return this.addressesService.findOne(customerId, addressId);
  }

  @Post()
  @ApiOperation({ summary: 'Tambah alamat servis baru untuk pelanggan' })
  @ApiResponse({ status: 201, description: 'Alamat berhasil ditambahkan' })
  create(
    @Param('customerId') customerId: string,
    @Body() dto: CreateCustomerAddressDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.addressesService.create(customerId, dto, user?.id);
  }

  @Patch(':addressId')
  @ApiOperation({ summary: 'Perbarui alamat pelanggan' })
  @ApiResponse({ status: 200, description: 'Alamat berhasil diperbarui' })
  update(
    @Param('customerId') customerId: string,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateCustomerAddressDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.addressesService.update(customerId, addressId, dto, user?.id);
  }

  @Post(':addressId/set-primary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Jadikan alamat sebagai alamat utama pelanggan secara transaksional' })
  @ApiResponse({ status: 200, description: 'Alamat utama berhasil ditetapkan' })
  setPrimary(
    @Param('customerId') customerId: string,
    @Param('addressId') addressId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.addressesService.setPrimary(customerId, addressId, user?.id);
  }

  @Delete(':addressId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Arsipkan alamat pelanggan (soft-delete aman)' })
  @ApiResponse({ status: 200, description: 'Alamat berhasil diarsipkan' })
  archive(
    @Param('customerId') customerId: string,
    @Param('addressId') addressId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.addressesService.archive(customerId, addressId, user?.id);
  }
}
