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
  CreateDraftInvoiceDto,
  InvoiceListQueryDto,
  VoidInvoiceDto,
} from '../dto/invoice.dto';
import { InvoiceService } from '../services/invoice.service';
import { PdfGeneratorService } from '../services/pdf-generator.service';

@ApiTags('Admin Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OWNER)
@Controller('admin/invoices')
export class InvoicesController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly pdfGenerator: PdfGeneratorService,
  ) { }

  @ApiOperation({ summary: 'Daftar Faktur Tagihan' })
  @Get()
  async listInvoices(@Query() query: InvoiceListQueryDto) {
    return this.invoiceService.listInvoices(query);
  }

  @ApiOperation({ summary: 'Menerbitkan draf faktur baru dari SPK' })
  @Post('drafts')
  @HttpCode(HttpStatus.CREATED)
  async createDraftInvoice(
    @Body() dto: CreateDraftInvoiceDto,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.invoiceService.createDraftInvoice(dto, userId);
    return {
      success: true,
      data,
      message: `Draf faktur ${data.invoiceNumber} berhasil dibuat`,
    };
  }

  @ApiOperation({ summary: 'Detail Faktur Tagihan' })
  @Get(':id')
  async getInvoiceById(@Param('id') id: string) {
    const data = await this.invoiceService.getInvoiceById(id);
    return {
      success: true,
      data,
      message: 'Detail faktur berhasil dimuat',
    };
  }

  @ApiOperation({ summary: 'Menerbitkan Faktur (DRAFT -> ISSUED)' })
  @Post(':id/issue')
  @HttpCode(HttpStatus.OK)
  async issueInvoice(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.invoiceService.issueInvoice(id, userId);
    return {
      success: true,
      data,
      message: `Faktur ${data.invoiceNumber} berhasil diterbitkan resmi`,
    };
  }

  @ApiOperation({ summary: 'Membatalkan Faktur (VOID)' })
  @Post(':id/void')
  @HttpCode(HttpStatus.OK)
  async voidInvoice(
    @Param('id') id: string,
    @Body() dto: VoidInvoiceDto,
    @CurrentUser('id') userId: string,
  ) {
    const data = await this.invoiceService.voidInvoice(id, dto, userId);
    return {
      success: true,
      data,
      message: `Faktur ${data.invoiceNumber} berhasil dibatalkan`,
    };
  }

  @ApiOperation({ summary: 'Download Dokumen Faktur PDF Resmi' })
  @Get(':id/pdf')
  async downloadInvoicePdf(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const inv: any = await this.invoiceService.getInvoiceById(id);

    const pdfBuffer = await this.pdfGenerator.generateInvoicePdf({
      business: {
        name: inv.business.name,
        phone: inv.business.phone,
        email: inv.business.email,
        address: inv.business.address,
      },
      invoice: {
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        issuedAt: inv.issuedAt,
        dueAt: inv.dueAt,
        subtotal: inv.subtotal.toString(),
        discountTotal: inv.discountTotal.toString(),
        taxTotal: inv.taxTotal.toString(),
        grandTotal: inv.grandTotal.toString(),
        verifiedPaidTotal: inv.verifiedPaidTotal.toString(),
        outstandingBalance: inv.outstandingBalance.toString(),
        items: inv.items.map((i: any) => ({
          lineType: i.lineType,
          descriptionSnapshot: i.descriptionSnapshot,
          quantity: i.quantity.toString(),
          unitPrice: i.unitPrice.toString(),
          lineTotal: i.lineTotal.toString(),
        })),
      },
      customer: {
        name: inv.customer?.name || inv.booking?.customer?.name || 'Pelanggan',
        phone: inv.customer?.phone || inv.booking?.customer?.phone,
        email: inv.customer?.email || inv.booking?.customer?.email,
        address: inv.booking?.customerAddress?.addressLine1 || '',
      },
      workOrder: {
        workOrderNumber: inv.workOrder.workOrderNumber,
        completedAt: inv.workOrder.completedAt,
        technicianName: inv.workOrder.technician?.user?.name || null,
      },
    });

    res.header('Content-Type', 'application/pdf');
    res.header(
      'Content-Disposition',
      `inline; filename="Faktur-${inv.invoiceNumber}.pdf"`,
    );
    return res.send(pdfBuffer);
  }
}
