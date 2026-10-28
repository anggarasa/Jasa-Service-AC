import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  PaymentListQueryDto,
  RecordPaymentDto,
  RejectPaymentDto,
  VerifyPaymentDto,
} from '../dto/payment.dto';
import { InvoiceService } from './invoice.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceService: InvoiceService,
  ) {}

  private async generateNextPaymentReference(businessId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `PAY-${year}${month}-`;

    const lastPayment = await this.prisma.payment.findFirst({
      where: {
        businessId,
        paymentReference: { startsWith: prefix },
      },
      orderBy: { paymentReference: 'desc' },
      select: { paymentReference: true },
    });

    let nextSeq = 1;
    if (lastPayment?.paymentReference) {
      const parts = lastPayment.paymentReference.split('-');
      const seqStr = parts[parts.length - 1];
      const parsed = parseInt(seqStr, 10);
      if (!isNaN(parsed)) {
        nextSeq = parsed + 1;
      }
    }

    return `${prefix}${String(nextSeq).padStart(5, '0')}`;
  }

  private async generateNextReceiptNumber(businessId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `REC-${year}${month}-`;

    const lastReceipt = await this.prisma.paymentReceipt.findFirst({
      where: {
        receiptNumber: { startsWith: prefix },
      },
      orderBy: { receiptNumber: 'desc' },
      select: { receiptNumber: true },
    });

    let nextSeq = 1;
    if (lastReceipt?.receiptNumber) {
      const parts = lastReceipt.receiptNumber.split('-');
      const seqStr = parts[parts.length - 1];
      const parsed = parseInt(seqStr, 10);
      if (!isNaN(parsed)) {
        nextSeq = parsed + 1;
      }
    }

    return `${prefix}${String(nextSeq).padStart(5, '0')}`;
  }

  async recordPayment(
    invoiceId: string,
    dto: RecordPaymentDto,
    userId: string,
  ) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException(`Faktur dengan ID ${invoiceId} tidak ditemukan`);
    }

    if (!['ISSUED', 'PARTIALLY_PAID'].includes(invoice.status)) {
      throw new BadRequestException(
        `Pembayaran tidak dapat dicatat untuk faktur berstatus ${invoice.status}`,
      );
    }

    const outstanding = Number(invoice.outstandingBalance);
    if (dto.amount > outstanding) {
      throw new BadRequestException(
        `Jumlah pembayaran (Rp ${dto.amount}) melebihi sisa tagihan (Rp ${outstanding})`,
      );
    }

    let idempotencyKeyHash: string | null = null;
    if (dto.idempotencyKey) {
      idempotencyKeyHash = crypto
        .createHash('sha256')
        .update(dto.idempotencyKey)
        .digest('hex');

      const existing = await this.prisma.payment.findUnique({
        where: { idempotencyKeyHash },
        include: { receipt: true },
      });

      if (existing) {
        return existing;
      }
    }

    const paymentReference = await this.generateNextPaymentReference(invoice.businessId);

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          businessId: invoice.businessId,
          invoiceId: invoice.id,
          paymentReference,
          method: dto.method,
          amount: new Prisma.Decimal(dto.amount),
          currency: 'IDR',
          status: 'PENDING_VERIFICATION',
          paidAtClaimed: dto.paidAtClaimed ? new Date(dto.paidAtClaimed) : new Date(),
          notes: dto.notes || null,
          idempotencyKeyHash,
          proofMediaId: dto.proofMediaId || null,
          recordedByUserId: userId,
        },
        include: {
          proofMedia: true,
        },
      });

      await tx.financialAuditLog.create({
        data: {
          businessId: invoice.businessId,
          aggregateType: 'PAYMENT',
          aggregateId: payment.id,
          action: 'PAYMENT_RECORDED',
          performedByUserId: userId,
          newState: {
            paymentReference,
            invoiceId,
            amount: dto.amount,
            method: dto.method,
            status: payment.status,
          },
        },
      });

      return payment;
    });
  }

  async verifyPayment(paymentId: string, dto: VerifyPaymentDto, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: true,
        receipt: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Data pembayaran dengan ID ${paymentId} tidak ditemukan`);
    }

    if (payment.status === 'VERIFIED') {
      return payment;
    }

    if (payment.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException(
        `Pembayaran berstatus ${payment.status} tidak dapat diverifikasi`,
      );
    }

    if (payment.invoice.status === 'VOID') {
      throw new BadRequestException('Faktur telah berstatus VOID, verifikasi pembayaran dibatalkan');
    }

    return this.prisma.$transaction(async (tx) => {
      const currentInvoice = await tx.invoice.findUnique({
        where: { id: payment.invoiceId },
      });

      if (!currentInvoice) {
        throw new NotFoundException('Faktur tidak ditemukan');
      }

      const verifiedPaidTotal = Number(currentInvoice.verifiedPaidTotal);
      const grandTotal = Number(currentInvoice.grandTotal);
      const paymentAmount = Number(payment.amount);

      if (verifiedPaidTotal + paymentAmount > grandTotal) {
        throw new BadRequestException(
          `Pembayaran akan melebihi total tagihan (Total: Rp ${grandTotal}, Saat ini terverifikasi: Rp ${verifiedPaidTotal}, Klaim pembayaran: Rp ${paymentAmount})`,
        );
      }

      const verifiedAt = new Date();
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'VERIFIED',
          verifiedAt,
          verifiedByUserId: userId,
          notes: dto.notes ? `${payment.notes ? payment.notes + ' | ' : ''}${dto.notes}` : payment.notes,
        },
      });

      const receiptNumber = await this.generateNextReceiptNumber(currentInvoice.businessId);
      const receipt = await tx.paymentReceipt.create({
        data: {
          paymentId: updatedPayment.id,
          receiptNumber,
          issuedAt: verifiedAt,
        },
      });

      await this.invoiceService.recalculateInvoiceBalance(tx, currentInvoice.id);

      await tx.financialAuditLog.create({
        data: {
          businessId: currentInvoice.businessId,
          aggregateType: 'PAYMENT',
          aggregateId: payment.id,
          action: 'PAYMENT_VERIFIED',
          performedByUserId: userId,
          previousState: { status: payment.status },
          newState: {
            status: 'VERIFIED',
            receiptNumber,
            verifiedAt,
            amount: paymentAmount,
          },
        },
      });

      return {
        ...updatedPayment,
        receipt,
      };
    });
  }

  async rejectPayment(paymentId: string, dto: RejectPaymentDto, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException(`Data pembayaran dengan ID ${paymentId} tidak ditemukan`);
    }

    if (payment.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException(
        `Pembayaran berstatus ${payment.status} tidak dapat ditolak`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REJECTED',
          rejectionReason: dto.rejectionReason,
        },
      });

      await tx.financialAuditLog.create({
        data: {
          businessId: payment.businessId,
          aggregateType: 'PAYMENT',
          aggregateId: payment.id,
          action: 'PAYMENT_REJECTED',
          performedByUserId: userId,
          previousState: { status: payment.status },
          newState: {
            status: 'REJECTED',
            rejectionReason: dto.rejectionReason,
          },
          metadata: {
            rejectionReason: dto.rejectionReason,
          },
        },
      });

      return updated;
    });
  }

  async listPayments(query: PaymentListQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.method) {
      where.method = query.method;
    }

    if (query.search) {
      where.OR = [
        { paymentReference: { contains: query.search, mode: 'insensitive' } },
        { invoice: { invoiceNumber: { contains: query.search, mode: 'insensitive' } } },
        { invoice: { customer: { name: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { recordedAt: 'desc' },
        include: {
          receipt: true,
          proofMedia: true,
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              grandTotal: true,
              status: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPaymentReceipt(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        receipt: true,
        invoice: {
          include: {
            customer: true,
            business: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Pembayaran dengan ID ${paymentId} tidak ditemukan`);
    }

    if (payment.status !== 'VERIFIED' || !payment.receipt) {
      throw new BadRequestException('Kuitansi hanya tersedia untuk pembayaran yang telah diverifikasi.');
    }

    return payment;
  }
}
