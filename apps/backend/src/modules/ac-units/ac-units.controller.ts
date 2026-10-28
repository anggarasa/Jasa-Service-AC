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
import { AcUnitsService } from './ac-units.service';
import { AcUnitQueryDto } from './dto/ac-unit-query.dto';
import { CreateAcUnitDto } from './dto/create-ac-unit.dto';
import { MoveAcUnitDto } from './dto/move-ac-unit.dto';
import { UpdateAcUnitDto } from './dto/update-ac-unit.dto';

@ApiTags('Admin AC Units')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
@Controller('admin')
export class AcUnitsController {
  constructor(private readonly acUnitsService: AcUnitsService) {}

  @Get('ac-units')
  @ApiOperation({ summary: 'Direktori global unit AC dengan pencarian, filter, dan paginasi' })
  @ApiResponse({ status: 200, description: 'Daftar unit AC berhasil diambil' })
  findAllGlobal(@Query() query: AcUnitQueryDto) {
    return this.acUnitsService.findAll(query);
  }

  @Get('customers/:customerId/ac-units')
  @ApiOperation({ summary: 'Daftar unit AC milik pelanggan tertentu' })
  @ApiResponse({ status: 200, description: 'Daftar unit AC pelanggan berhasil diambil' })
  findByCustomer(@Param('customerId') customerId: string) {
    return this.acUnitsService.findByCustomer(customerId);
  }

  @Post('customers/:customerId/ac-units')
  @ApiOperation({ summary: 'Tambahkan unit AC baru untuk pelanggan pada alamat instalasi tertentu' })
  @ApiResponse({ status: 201, description: 'Unit AC berhasil didaftarkan' })
  create(
    @Param('customerId') customerId: string,
    @Body() dto: CreateAcUnitDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.acUnitsService.create(customerId, dto, user?.id);
  }

  @Get('ac-units/:id')
  @ApiOperation({ summary: 'Detail unit AC beserta data pelanggan, alamat, dan foto' })
  @ApiResponse({ status: 200, description: 'Detail unit AC berhasil diambil' })
  findOne(@Param('id') id: string) {
    return this.acUnitsService.findOne(id);
  }

  @Patch('ac-units/:id')
  @ApiOperation({ summary: 'Perbarui data teknis unit AC' })
  @ApiResponse({ status: 200, description: 'Data unit AC berhasil diperbarui' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAcUnitDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.acUnitsService.update(id, dto, user?.id);
  }

  @Post('ac-units/:id/move-address')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pindahkan unit AC ke alamat lain milik pelanggan yang sama' })
  @ApiResponse({ status: 200, description: 'Lokasi alamat unit AC berhasil dipindahkan' })
  moveAddress(
    @Param('id') id: string,
    @Body() dto: MoveAcUnitDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.acUnitsService.moveAddress(id, dto, user?.id);
  }

  @Delete('ac-units/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Arsipkan unit AC (soft-delete aman)' })
  @ApiResponse({ status: 200, description: 'Unit AC berhasil diarsipkan' })
  archive(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.acUnitsService.archive(id, user?.id);
  }

  @Get('ac-units/:id/history')
  @ApiOperation({ summary: 'Riwayat pengerjaan servis unit AC' })
  @ApiResponse({ status: 200, description: 'Riwayat servis unit AC' })
  getHistory(@Param('id') id: string) {
    return this.acUnitsService.getHistory(id);
  }
}
