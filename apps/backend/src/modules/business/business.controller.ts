import {
  Body,
  Controller,
  Get,
  Patch,
  Put,
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
import { BusinessService } from './business.service';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { UpdateBookingSettingsDto } from './dto/update-booking-settings.dto';
import { UpdateOperatingScheduleDto } from './dto/operating-hours.dto';

@ApiTags('Admin Business')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mendapatkan profil informasi bisnis saat ini' })
  @ApiResponse({ status: 200, description: 'Profil bisnis berhasil dimuat' })
  async getProfile() {
    return this.businessService.getBusinessProfile();
  }

  @Patch()
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Memperbarui informasi profil bisnis (Khusus OWNER)' })
  @ApiResponse({ status: 200, description: 'Profil bisnis berhasil diperbarui' })
  async updateProfile(@Body() dto: UpdateBusinessDto) {
    return this.businessService.updateBusinessProfile(dto);
  }

  @Get('booking-settings')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mendapatkan konfigurasi interval dan buffer pemesanan' })
  @ApiResponse({ status: 200, description: 'Pengaturan pemesanan berhasil dimuat' })
  async getBookingSettings() {
    return this.businessService.getBookingSettings();
  }

  @Patch('booking-settings')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Memperbarui konfigurasi interval dan buffer pemesanan (Khusus OWNER)' })
  @ApiResponse({ status: 200, description: 'Pengaturan pemesanan berhasil diperbarui' })
  async updateBookingSettings(@Body() dto: UpdateBookingSettingsDto) {
    return this.businessService.updateBookingSettings(dto);
  }

  @Get('operating-hours')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mendapatkan jadwal jam operasional dan istirahat mingguan' })
  @ApiResponse({ status: 200, description: 'Jadwal operasional mingguan berhasil dimuat' })
  async getOperatingHours() {
    return this.businessService.getOperatingHours();
  }

  @Put('operating-hours')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Memperbarui jadwal jam operasional dan istirahat mingguan (Khusus OWNER)' })
  @ApiResponse({ status: 200, description: 'Jadwal operasional mingguan berhasil disimpan' })
  async updateOperatingHours(@Body() dto: UpdateOperatingScheduleDto) {
    return this.businessService.updateOperatingHours(dto);
  }
}
