import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { RecordPaymentDto } from '../dto/payment.dto';
import {
  CreateChargeApprovalDto,
  SaveWorkOrderPricingDto,
} from '../dto/pricing.dto';
import { InvoiceService } from '../services/invoice.service';
import { PaymentService } from '../services/payment.service';
import { PricingService } from '../services/pricing.service';

@ApiTags('Technician Work Order Billing & Payment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TECHNICIAN)
@Controller('technician/work-orders')
export class TechnicianBillingController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
    private readonly invoiceService: InvoiceService,
    private readonly paymentService: PaymentService,
  ) {}

  private async assertTechnicianAssignment(workOrderId: string, technicianUserId: string) {
    const wo = await this.prisma.workOrder.findFirst({
      where: {
        id: workOrderId,
        technicianId: technicianUserId,
      },
      include: {
        invoice: true,
      },
    });

    if (!wo) {
      throw new NotFoundException('SPK tidak ditemukan atau bukan ditugaskan kepada Anda.');
    }

    return wo;
  }

  @ApiOperation({ summary: 'Melihat rincian kalkulasi biaya SPK dari aplikasi teknisi' })
  @Get(':id/pricing')
  async getPricing(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.assertTechnicianAssignment(id, userId);
    const data = await this.pricingService.getWorkOrderPricing(id);
    return {
      success: true,
      data,
      message: 'Rincian biaya SPK berhasil dimuat',
    };
  }

  @ApiOperation({ summary: 'Teknisi menginput tambahan biaya / material di lapangan' })
  @Put(':id/pricing')
  async savePricing(
    @Param('id') id: string,
    @Body() dto: SaveWorkOrderPricingDto,
    @CurrentUser('id') userId: string,
  ) {
    await this.assertTechnicianAssignment(id, userId);
    return this.pricingService.saveWorkOrderPricing(id, dto, userId);
  }

  @ApiOperation({ summary: 'Teknisi mencatat persetujuan biaya dari pelanggan di lokasi' })
  @Post(':id/approvals')
  @HttpCode(HttpStatus.CREATED)
  async recordApproval(
    @Param('id') id: string,
    @Body() dto: CreateChargeApprovalDto,
    @CurrentUser('id') userId: string,
  ) {
    await this.assertTechnicianAssignment(id, userId);
    return this.pricingService.createChargeApproval(id, dto, userId);
  }

  @ApiOperation({ summary: 'Teknisi mencatat penerimaan pembayaran di lapangan (Tunai / Transfer)' })
  @Post(':id/payments')
  @HttpCode(HttpStatus.CREATED)
  async recordFieldPayment(
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    const wo = await this.assertTechnicianAssignment(id, userId);

    let invoice = wo.invoice;
    if (!invoice) {
      // Jika faktur belum terbit saat pekerjaan selesai, terbitkan draft & issue secara otomatis
      const draft = await this.invoiceService.createDraftInvoice(
        { workOrderId: id },
        userId,
      );
      invoice = await this.invoiceService.issueInvoice(draft.id, userId);
    }

    const payment = await this.paymentService.recordPayment(invoice.id, dto, userId);
    return {
      success: true,
      data: payment,
      message: `Penerimaan pembayaran ${dto.method} sebesar Rp ${dto.amount} berhasil dicatat dan menunggu verifikasi`,
    };
  }
}
