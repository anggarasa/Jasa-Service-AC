import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { FastifyReply } from 'fastify';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import {
  PaymentListQueryDto,
  RecordPaymentDto,
  RejectPaymentDto,
  VerifyPaymentDto,
} from '../dto/payment.dto';
import { PaymentService } from '../services/payment.service';
import { PdfGeneratorService } from '../services/pdf-generator.service';

@ApiTags('Admin Payments & Receipts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OWNER)
@Controller('admin')
export class PaymentsController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly pdfGenerator: PdfGeneratorService,
  ) {}

  @ApiOperation({ summary: 'Daftar Semua Pembayaran (Antrean Verifikasi)' })
  @Get('payments')
  async listPayments(@Query() query: PaymentListQueryDto) {
    return this.paymentService.listPayments(query);
  }

  @ApiOperation({ summary: 'Merekam pembayaran baru untuk faktur' })
  @Post('invoices/:id/payments')
  @HttpCode(HttpStatus.CREATED)
  async recordPayment(
    @Param('id') invoiceId: string,
    @Body() dto: RecordPaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.paymentService.recordPayment(invoiceId, dto, userId);
    return {
      success: true,
      data,
      message: `Pembayaran ${data.paymentReference} berhasil dicatat`,
    };
  }

  @ApiOperation({ summary: 'Verifikasi Pembayaran (Hanya OWNER & ADMIN)' })
  @Post('payments/:id/verify')
  @HttpCode(HttpStatus.OK)
  async verifyPayment(
    @Param('id') paymentId: string,
    @Body() dto: VerifyPaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.paymentService.verifyPayment(paymentId, dto, userId);
    return {
      success: true,
      data,
      message: `Pembayaran berhasil diverifikasi dan kuitansi telah terbit`,
    };
  }

  @ApiOperation({ summary: 'Tolak Pembayaran (Hanya OWNER & ADMIN)' })
  @Post('payments/:id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectPayment(
    @Param('id') paymentId: string,
    @Body() dto: RejectPaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.paymentService.rejectPayment(paymentId, dto, userId);
    return {
      success: true,
      data,
      message: `Pembayaran berhasil ditolak`,
    };
  }

  @ApiOperation({ summary: 'Download Dokumen Kuitansi PDF Resmi' })
  @Get('payments/:id/receipt-pdf')
  async downloadReceiptPdf(
    @Param('id') paymentId: string,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const payment = await this.paymentService.getPaymentReceipt(paymentId);

    const pdfBuffer = await this.pdfGenerator.generateReceiptPdf({
      business: {
        name: payment.invoice.business.name,
        phone: payment.invoice.business.phone,
        email: payment.invoice.business.email,
        address: payment.invoice.business.address,
      },
      receiptNumber: payment.receipt!.receiptNumber,
      paymentReference: payment.paymentReference,
      invoiceNumber: payment.invoice.invoiceNumber,
      customerName: (payment.invoice.customer as any).name,
      customerPhone: payment.invoice.customer.phone,
      amount: payment.amount.toString(),
      method: payment.method,
      paidAtClaimed: payment.paidAtClaimed,
      verifiedAt: payment.verifiedAt,
      verifiedByName: payment.invoice.business.name,
    });

    res.header('Content-Type', 'application/pdf');
    res.header(
      'Content-Disposition',
      `inline; filename="Kuitansi-${payment.receipt!.receiptNumber}.pdf"`,
    );
    return res.send(pdfBuffer);
  }
}
