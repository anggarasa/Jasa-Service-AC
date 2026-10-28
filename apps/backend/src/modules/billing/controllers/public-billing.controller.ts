import {
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { FastifyReply } from 'fastify';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Public } from '../../auth/decorators/public.decorator';
import { InvoiceService } from '../services/invoice.service';
import { PdfGeneratorService } from '../services/pdf-generator.service';

@ApiTags('Public Customer Financial Summary')
@Public()
@Controller('public')
export class PublicBillingController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceService: InvoiceService,
    private readonly pdfGenerator: PdfGeneratorService,
  ) {}

  private async validateBookingToken(code: string, rawToken?: string, authHeader?: string) {
    let token = rawToken;
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      throw new UnauthorizedException('Token akses pemesanan wajib disertakan.');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const accessToken = await this.prisma.bookingAccessToken.findUnique({
      where: { tokenHash },
      include: {
        booking: true,
      },
    });

    if (!accessToken || accessToken.revokedAt) {
      throw new UnauthorizedException('Token akses tidak valid atau telah dicabut.');
    }

    if (accessToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Token akses telah kedaluwarsa.');
    }

    if (accessToken.booking.bookingCode !== code) {
      throw new UnauthorizedException('Token akses tidak cocok dengan nomor pemesanan ini.');
    }

    return accessToken.booking;
  }

  @ApiOperation({ summary: 'Melihat ringkasan finansial dan faktur untuk pelanggan' })
  @Get('bookings/:code/financial-summary')
  async getCustomerFinancialSummary(
    @Param('code') code: string,
    @Query('token') queryToken?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const booking = await this.validateBookingToken(code, queryToken, authHeader);

    // Dapatkan data invoice terkait booking
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        bookingId: booking.id,
        status: { not: 'DRAFT' }, // Pelanggan hanya melihat faktur yang sudah diterbitkan (ISSUED / PARTIALLY_PAID / PAID)
      },
      include: {
        items: true,
        payments: {
          where: { status: 'VERIFIED' },
          select: {
            id: true,
            paymentReference: true,
            method: true,
            amount: true,
            paidAtClaimed: true,
            verifiedAt: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        bookingCode: booking.bookingCode,
        estimatedTotal: (booking.estimatedTotal || 0).toString(),
        visitFeeSnapshot: booking.visitFeeSnapshot.toString(),
        invoice: invoice
          ? {
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              status: invoice.status,
              issuedAt: invoice.issuedAt?.toISOString() || null,
              dueAt: invoice.dueAt?.toISOString() || null,
              subtotal: invoice.subtotal.toString(),
              discountTotal: invoice.discountTotal.toString(),
              taxTotal: invoice.taxTotal.toString(),
              grandTotal: invoice.grandTotal.toString(),
              verifiedPaidTotal: invoice.verifiedPaidTotal.toString(),
              outstandingBalance: invoice.outstandingBalance.toString(),
              items: invoice.items.map((it) => ({
                id: it.id,
                lineType: it.lineType,
                descriptionSnapshot: it.descriptionSnapshot,
                quantity: Number(it.quantity),
                unitPrice: it.unitPrice.toString(),
                lineTotal: it.lineTotal.toString(),
              })),
              verifiedPayments: invoice.payments.map((p) => ({
                id: p.id,
                paymentReference: p.paymentReference,
                method: p.method,
                amount: p.amount.toString(),
                paidAtClaimed: p.paidAtClaimed?.toISOString() || null,
                verifiedAt: p.verifiedAt?.toISOString() || null,
              })),
            }
          : null,
      },
    };
  }

  @ApiOperation({ summary: 'Pelanggan mengunduh faktur PDF resmi dengan token' })
  @Get('invoices/:id/pdf')
  async downloadCustomerInvoicePdf(
    @Param('id') invoiceId: string,
    @Query('token') rawToken: string,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    if (!rawToken) {
      throw new UnauthorizedException('Token akses pemesanan wajib disertakan.');
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const accessToken = await this.prisma.bookingAccessToken.findUnique({
      where: { tokenHash },
      include: { booking: true },
    });

    if (!accessToken || accessToken.revokedAt || accessToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Token akses tidak valid atau kedaluwarsa.');
    }

    const inv: any = await this.invoiceService.getInvoiceById(invoiceId);
    if (inv.bookingId !== accessToken.bookingId) {
      throw new UnauthorizedException('Akses ke faktur ini ditolak.');
    }

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
