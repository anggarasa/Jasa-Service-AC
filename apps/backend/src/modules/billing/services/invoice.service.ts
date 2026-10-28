import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  CreateDraftInvoiceDto,
  InvoiceListQueryDto,
  VoidInvoiceDto,
} from '../dto/invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateNextInvoiceNumber(businessId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `INV-${year}${month}-`;

    const lastInvoice = await this.prisma.invoice.findFirst({
      where: {
        businessId,
        invoiceNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        invoiceNumber: 'desc',
      },
      select: { invoiceNumber: true },
    });

    let nextSeq = 1;
    if (lastInvoice?.invoiceNumber) {
      const parts = lastInvoice.invoiceNumber.split('-');
      const seqStr = parts[parts.length - 1];
      const parsed = parseInt(seqStr, 10);
      if (!isNaN(parsed)) {
        nextSeq = parsed + 1;
      }
    }

    return `${prefix}${String(nextSeq).padStart(5, '0')}`;
  }

  async createDraftInvoice(dto: CreateDraftInvoiceDto, userId: string) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: dto.workOrderId },
      include: {
        booking: {
          include: {
            bookingItems: true,
            service: true,
          },
        },
        charges: true,
        materials: true,
        invoice: true,
      },
    });

    if (!workOrder) {
      throw new NotFoundException(`SPK dengan ID ${dto.workOrderId} tidak ditemukan`);
    }

    if (workOrder.invoice) {
      throw new ConflictException(
        `Faktur untuk SPK ini sudah pernah dibuat dengan nomor ${workOrder.invoice.invoiceNumber}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const invoiceNumber = await this.generateNextInvoiceNumber(workOrder.businessId);

      // Siapkan item faktur snapshot
      const itemsToCreate: Array<{
        lineType: string;
        descriptionSnapshot: string;
        quantity: Prisma.Decimal;
        unitPrice: Prisma.Decimal;
        lineTotal: Prisma.Decimal;
      }> = [];

      let subtotal = 0;

      // 1. Biaya Kunjungan / Transport (jika ada)
      const visitFee = Number(workOrder.booking?.visitFeeSnapshot || 0);
      if (visitFee > 0) {
        itemsToCreate.push({
          lineType: 'VISIT_FEE',
          descriptionSnapshot: 'Biaya Kunjungan & Transportasi Teknisi',
          quantity: new Prisma.Decimal(1),
          unitPrice: new Prisma.Decimal(visitFee),
          lineTotal: new Prisma.Decimal(visitFee),
        });
        subtotal += visitFee;
      }

      // 2. Layanan Dasar dari Booking Items atau Service
      if (workOrder.booking?.bookingItems && workOrder.booking.bookingItems.length > 0) {
        for (const it of workOrder.booking.bookingItems) {
          const price = Number(it.unitPriceSnapshot || 0);
          itemsToCreate.push({
            lineType: 'SERVICE_ITEM',
            descriptionSnapshot: `${workOrder.booking.serviceNameSnapshot || 'Layanan Servis AC'} (${it.brandSnapshot || 'AC'} ${it.capacityPkSnapshot || 1} PK)`,
            quantity: new Prisma.Decimal(1),
            unitPrice: new Prisma.Decimal(price),
            lineTotal: new Prisma.Decimal(price),
          });
          subtotal += price;
        }
      } else if (workOrder.booking?.service) {
        const price = Number(
          workOrder.booking.estimatedServicePrice || workOrder.booking.estimatedPrice || 0,
        );
        const count = workOrder.booking.unitCount || 1;
        itemsToCreate.push({
          lineType: 'SERVICE_ITEM',
          descriptionSnapshot: workOrder.booking.serviceNameSnapshot || workOrder.booking.service.name,
          quantity: new Prisma.Decimal(count),
          unitPrice: new Prisma.Decimal(price),
          lineTotal: new Prisma.Decimal(price * count),
        });
        subtotal += price * count;
      }

      // 3. Biaya Tenaga Kerja / Pekerjaan Tambahan dari WorkOrderCharge
      for (const ch of workOrder.charges) {
        const qty = Number(ch.quantity || 1);
        const price = Number(ch.unitPrice || 0);
        const total = Number(ch.lineAmount || qty * price);
        itemsToCreate.push({
          lineType: ch.lineType || 'ADDITIONAL_LABOR',
          descriptionSnapshot: ch.description,
          quantity: new Prisma.Decimal(qty),
          unitPrice: new Prisma.Decimal(price),
          lineTotal: new Prisma.Decimal(total),
        });
        subtotal += total;
      }

      // 4. Material yang Digunakan dari WorkOrderMaterial
      for (const mat of workOrder.materials) {
        const qty = Number(mat.quantity || 1);
        const price = Number(mat.unitPrice || 0);
        const total = Number(mat.totalAmount || qty * price);
        itemsToCreate.push({
          lineType: 'MATERIAL',
          descriptionSnapshot: `Material: ${mat.materialName} (${qty} ${mat.unit})`,
          quantity: new Prisma.Decimal(qty),
          unitPrice: new Prisma.Decimal(price),
          lineTotal: new Prisma.Decimal(total),
        });
        subtotal += total;
      }

      const discountTotal = dto.discountTotal || 0;
      const taxTotal = dto.taxTotal || 0;
      const grandTotal = Math.max(0, subtotal - discountTotal + taxTotal);

      const invoice = await tx.invoice.create({
        data: {
          businessId: workOrder.businessId,
          bookingId: workOrder.bookingId,
          workOrderId: workOrder.id,
          invoiceNumber,
          customerId: workOrder.booking.customerId,
          status: 'DRAFT',
          currency: 'IDR',
          subtotal: new Prisma.Decimal(subtotal),
          discountTotal: new Prisma.Decimal(discountTotal),
          taxTotal: new Prisma.Decimal(taxTotal),
          grandTotal: new Prisma.Decimal(grandTotal),
          verifiedPaidTotal: new Prisma.Decimal(0),
          outstandingBalance: new Prisma.Decimal(grandTotal),
          createdByUserId: userId,
          items: {
            create: itemsToCreate,
          },
        },
        include: {
          items: true,
        },
      });

      // Audit Log
      await tx.financialAuditLog.create({
        data: {
          businessId: workOrder.businessId,
          aggregateType: 'INVOICE',
          aggregateId: invoice.id,
          action: 'DRAFT_INVOICE_CREATED',
          performedByUserId: userId,
          newState: {
            invoiceNumber,
            grandTotal,
            itemCount: itemsToCreate.length,
          },
        },
      });

      return invoice;
    });
  }

  async issueInvoice(invoiceId: string, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException(`Faktur dengan ID ${invoiceId} tidak ditemukan`);
    }

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException(
        `Faktur berstatus ${invoice.status} tidak dapat diterbitkan kembali`,
      );
    }

    const issuedAt = new Date();
    const dueAt = new Date(issuedAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 hari

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'ISSUED',
          issuedAt,
          dueAt,
          version: { increment: 1 },
        },
        include: {
          items: true,
          workOrder: true,
          booking: true,
        },
      });

      await tx.financialAuditLog.create({
        data: {
          businessId: invoice.businessId,
          aggregateType: 'INVOICE',
          aggregateId: invoice.id,
          action: 'INVOICE_ISSUED',
          performedByUserId: userId,
          previousState: { status: invoice.status },
          newState: { status: 'ISSUED', issuedAt, dueAt },
        },
      });

      return updated;
    });
  }

  async voidInvoice(invoiceId: string, dto: VoidInvoiceDto, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: {
          where: { status: 'VERIFIED' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Faktur dengan ID ${invoiceId} tidak ditemukan`);
    }

    if (invoice.status === 'VOID') {
      throw new BadRequestException('Faktur sudah berstatus VOID');
    }

    if (invoice.payments.length > 0) {
      throw new ForbiddenException(
        'Faktur tidak dapat dibatalkan karena memiliki pembayaran terverifikasi. Harap batalkan pembayaran terlebih dahulu.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'VOID',
          cancelledAt: new Date(),
          voidReason: dto.reason,
          version: { increment: 1 },
        },
      });

      await tx.financialAuditLog.create({
        data: {
          businessId: invoice.businessId,
          aggregateType: 'INVOICE',
          aggregateId: invoice.id,
          action: 'INVOICE_VOIDED',
          performedByUserId: userId,
          previousState: { status: invoice.status },
          newState: { status: 'VOID', reason: dto.reason },
          metadata: { reason: dto.reason },
        },
      });

      return updated;
    });
  }

  async getInvoiceById(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        payments: {
          orderBy: { recordedAt: 'desc' },
          include: {
            receipt: true,
            proofMedia: true,
          },
        },
        workOrder: {
          include: {
            technician: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        booking: {
          include: {
            customer: true,
            customerAddress: true,
          },
        },
        customer: true,
        business: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Faktur dengan ID ${invoiceId} tidak ditemukan`);
    }

    return invoice;
  }

  async getInvoiceByWorkOrderId(workOrderId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { workOrderId },
      include: {
        items: true,
        payments: {
          orderBy: { recordedAt: 'desc' },
          include: {
            receipt: true,
            proofMedia: true,
          },
        },
        workOrder: true,
      },
    });

    return invoice;
  }

  async listInvoices(query: InvoiceListQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { invoiceNumber: { contains: query.search, mode: 'insensitive' } },
        { customer: { name: { contains: query.search, mode: 'insensitive' } } },
        { customer: { phone: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(`${query.endDate}T23:59:59.999Z`);
      }
    }

    const [total, items] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          workOrder: {
            select: {
              id: true,
              workOrderNumber: true,
              technician: {
                select: {
                  id: true,
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              method: true,
              status: true,
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

  async recalculateInvoiceBalance(tx: Prisma.TransactionClient, invoiceId: string) {
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: {
          where: { status: 'VERIFIED' },
        },
      },
    });

    if (!invoice) return null;

    let verifiedSum = 0;
    let latestVerifiedDate: Date | null = null;

    for (const p of invoice.payments) {
      verifiedSum += Number(p.amount);
      if (p.verifiedAt && (!latestVerifiedDate || p.verifiedAt > latestVerifiedDate)) {
        latestVerifiedDate = p.verifiedAt;
      }
    }

    const grandTotal = Number(invoice.grandTotal);
    const outstanding = Math.max(0, grandTotal - verifiedSum);

    let status = invoice.status;
    let paidAt = invoice.paidAt;

    if (invoice.status !== 'VOID' && invoice.status !== 'DRAFT') {
      if (outstanding === 0 && verifiedSum > 0) {
        status = 'PAID';
        paidAt = latestVerifiedDate || new Date();
      } else if (verifiedSum > 0) {
        status = 'PARTIALLY_PAID';
      } else {
        status = 'ISSUED';
      }
    }

    return tx.invoice.update({
      where: { id: invoiceId },
      data: {
        verifiedPaidTotal: new Prisma.Decimal(verifiedSum),
        outstandingBalance: new Prisma.Decimal(outstanding),
        status,
        paidAt,
        version: { increment: 1 },
      },
    });
  }
}
