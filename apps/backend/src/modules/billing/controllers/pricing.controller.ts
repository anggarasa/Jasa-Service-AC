import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import {
  CreateChargeApprovalDto,
  SaveWorkOrderPricingDto,
} from '../dto/pricing.dto';
import { PricingService } from '../services/pricing.service';

@ApiTags('Admin Work Order Pricing & Approvals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OWNER)
@Controller('admin/work-orders')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @ApiOperation({ summary: 'Melihat rincian kalkulasi biaya SPK (Estimasi Awal vs Biaya Aktual)' })
  @Get(':id/pricing')
  async getPricing(@Param('id') id: string) {
    const data = await this.pricingService.getWorkOrderPricing(id);
    return {
      success: true,
      data,
      message: 'Rincian biaya SPK berhasil dimuat',
    };
  }

  @ApiOperation({ summary: 'Menyimpan rincian biaya tenaga kerja tambahan dan material SPK' })
  @Put(':id/pricing')
  async savePricing(
    @Param('id') id: string,
    @Body() dto: SaveWorkOrderPricingDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.pricingService.saveWorkOrderPricing(id, dto, userId);
  }

  @ApiOperation({ summary: 'Merekam persetujuan pelanggan atas tambahan biaya servis' })
  @Post(':id/approvals')
  @HttpCode(HttpStatus.CREATED)
  async createApproval(
    @Param('id') id: string,
    @Body() dto: CreateChargeApprovalDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.pricingService.createChargeApproval(id, dto, userId);
  }
}
