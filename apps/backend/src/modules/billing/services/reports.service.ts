import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ExportReportsQueryDto, OperationalReportsQueryDto } from '../dto/reports.dto';
import { CsvExportService } from './csv-export.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly csvExport: CsvExportService,
  ) {}

  async getOperationalOverview(query: OperationalReportsQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : new Date(new Date().setDate(1));
    const endDate = query.endDate ? new Date(`${query.endDate}T23:59:59.999Z`) : new Date();

    const bookingWhere: Prisma.BookingWhereInput = {
      createdAt: { gte: startDate, lte: endDate },
    };

    const workOrderWhere: Prisma.WorkOrderWhereInput = {
      createdAt: { gte: startDate, lte: endDate },
    };

    if (query.technicianId) {
      workOrderWhere.technicianId = query.technicianId;
    }

    const invoiceWhere: Prisma.InvoiceWhereInput = {
      createdAt: { gte: startDate, lte: endDate },
    };

    const paymentWhere: Prisma.PaymentWhereInput = {
      recordedAt: { gte: startDate, lte: endDate },
    };

    const [
      totalBookings,
      completedWorkOrders,
      cancelledWorkOrders,
      allInvoices,
      allPayments,
      technicians,
    ] = await Promise.all([
      this.prisma.booking.count({ where: bookingWhere }),
      this.prisma.workOrder.count({
        where: { ...workOrderWhere, status: 'COMPLETED' },
      }),
      this.prisma.workOrder.count({
        where: { ...workOrderWhere, status: 'CANCELLED' },
      }),
      this.prisma.invoice.findMany({
        where: invoiceWhere,
        select: {
          id: true,
          status: true,
          grandTotal: true,
          verifiedPaidTotal: true,
          outstandingBalance: true,
          workOrder: {
            select: {
              technicianId: true,
            },
          },
        },
      }),
      this.prisma.payment.findMany({
        where: paymentWhere,
        select: {
          id: true,
          method: true,
          status: true,
          amount: true,
        },
      }),
      this.prisma.technician.findMany({
        where: { isActive: true },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    let totalInvoicedAmount = 0;
    let totalOutstandingReceivables = 0;

    for (const inv of allInvoices) {
      if (['ISSUED', 'PARTIALLY_PAID', 'PAID'].includes(inv.status)) {
        totalInvoicedAmount += Number(inv.grandTotal);
        totalOutstandingReceivables += Number(inv.outstandingBalance);
      }
    }

    let totalVerifiedRevenue = 0;
    let totalPendingVerification = 0;
    const paymentMethodsMap: Record<string, { count: number; totalAmount: number }> = {
      CASH: { count: 0, totalAmount: 0 },
      BANK_TRANSFER: { count: 0, totalAmount: 0 },
      EXTERNAL_QRIS: { count: 0, totalAmount: 0 },
      OTHER_MANUAL: { count: 0, totalAmount: 0 },
    };

    for (const p of allPayments) {
      const amt = Number(p.amount);
      if (p.status === 'VERIFIED') {
        totalVerifiedRevenue += amt;
        if (!paymentMethodsMap[p.method]) {
          paymentMethodsMap[p.method] = { count: 0, totalAmount: 0 };
        }
        paymentMethodsMap[p.method].count += 1;
        paymentMethodsMap[p.method].totalAmount += amt;
      } else if (p.status === 'PENDING_VERIFICATION') {
        totalPendingVerification += amt;
      }
    }

    const technicianStats = await Promise.all(
      technicians.map(async (t) => {
        const completedJobs = await this.prisma.workOrder.count({
          where: {
            technicianId: t.id,
            status: 'COMPLETED',
            createdAt: { gte: startDate, lte: endDate },
          },
        });

        const techInvoices = allInvoices.filter(
          (inv) => inv.workOrder?.technicianId === t.id && ['ISSUED', 'PARTIALLY_PAID', 'PAID'].includes(inv.status),
        );

        let verifiedRevenue = 0;
        for (const inv of techInvoices) {
          verifiedRevenue += Number(inv.verifiedPaidTotal);
        }

        return {
          technicianId: t.id,
          technicianName: t.user.name,
          completedJobs,
          verifiedRevenue: verifiedRevenue.toString(),
        };
      }),
    );

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      kpi: {
        totalBookings,
        completedWorkOrders,
        cancelledWorkOrders,
        totalInvoicedAmount: totalInvoicedAmount.toString(),
        totalVerifiedRevenue: totalVerifiedRevenue.toString(),
        totalOutstandingReceivables: totalOutstandingReceivables.toString(),
        totalPendingVerification: totalPendingVerification.toString(),
      },
      paymentMethods: Object.entries(paymentMethodsMap).map(([method, data]) => ({
        method,
        count: data.count,
        totalAmount: data.totalAmount.toString(),
      })),
      technicianStats,
    };
  }

  async exportCsv(query: ExportReportsQueryDto): Promise<{ filename: string; content: string }> {
    const type = query.type || 'invoices';
    const startDate = query.startDate ? new Date(query.startDate) : new Date(new Date().setDate(1));
    const endDate = query.endDate ? new Date(`${query.endDate}T23:59:59.999Z`) : new Date();

    if (type === 'payments') {
      const payments = await this.prisma.payment.findMany({
        where: { recordedAt: { gte: startDate, lte: endDate } },
        include: {
          invoice: {
            include: { customer: true },
          },
          receipt: true,
        },
        orderBy: { recordedAt: 'desc' },
      });

      const headers = [
        'No. Referensi',
        'No. Faktur',
        'Nama Pelanggan',
        'Metode Pembayaran',
        'Jumlah (IDR)',
        'Status',
        'No. Kuitansi',
        'Tanggal Bayar Klaim',
        'Tanggal Verifikasi',
        'Catatan',
      ];

      const rows = payments.map((p) => [
        p.paymentReference,
        p.invoice.invoiceNumber,
        p.invoice.customer.name,
        p.method,
        Number(p.amount),
        p.status,
        p.receipt?.receiptNumber || '-',
        p.paidAtClaimed ? p.paidAtClaimed.toISOString() : '-',
        p.verifiedAt ? p.verifiedAt.toISOString() : '-',
        p.notes || '',
      ]);

      return {
        filename: `laporan-pembayaran-${Date.now()}.csv`,
        content: this.csvExport.toCsvString(headers, rows),
      };
    }

    if (type === 'work-orders') {
      const wos = await this.prisma.workOrder.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        include: {
          booking: { include: { customer: true } },
          technician: { include: { user: true } },
          invoice: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const headers = [
        'No. SPK',
        'Kode Pemesanan',
        'Nama Pelanggan',
        'Status SPK',
        'Nama Teknisi',
        'No. Faktur',
        'Status Faktur',
        'Total Tagihan (IDR)',
        'Tanggal Mulai',
        'Tanggal Selesai',
      ];

      const rows = wos.map((wo) => [
        wo.workOrderNumber,
        wo.booking.bookingCode,
        wo.booking.customer.name,
        wo.status,
        wo.technician?.user.name || 'Belum Ditugaskan',
        wo.invoice?.invoiceNumber || '-',
        wo.invoice?.status || 'Belum Terbit',
        wo.invoice ? Number(wo.invoice.grandTotal) : 0,
        wo.startedAt ? wo.startedAt.toISOString() : '-',
        wo.completedAt ? wo.completedAt.toISOString() : '-',
      ]);

      return {
        filename: `laporan-spk-${Date.now()}.csv`,
        content: this.csvExport.toCsvString(headers, rows),
      };
    }

    // Default: invoices
    const invoices = await this.prisma.invoice.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      include: {
        customer: true,
        workOrder: {
          include: { technician: { include: { user: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'No. Faktur',
      'No. SPK',
      'Nama Pelanggan',
      'No. Telepon',
      'Status',
      'Subtotal',
      'Diskon',
      'PPN',
      'Total Tagihan (IDR)',
      'Total Terbayar (IDR)',
      'Sisa Tagihan (IDR)',
      'Nama Teknisi',
      'Tanggal Terbit',
      'Tanggal Jatuh Tempo',
      'Tanggal Lunas',
    ];

    const rows = invoices.map((inv) => [
      inv.invoiceNumber,
      inv.workOrder.workOrderNumber,
      inv.customer.name,
      inv.customer.phone,
      inv.status,
      Number(inv.subtotal),
      Number(inv.discountTotal),
      Number(inv.taxTotal),
      Number(inv.grandTotal),
      Number(inv.verifiedPaidTotal),
      Number(inv.outstandingBalance),
      inv.workOrder.technician?.user.name || '-',
      inv.issuedAt ? inv.issuedAt.toISOString() : '-',
      inv.dueAt ? inv.dueAt.toISOString() : '-',
      inv.paidAt ? inv.paidAt.toISOString() : '-',
    ]);

    return {
      filename: `laporan-faktur-${Date.now()}.csv`,
      content: this.csvExport.toCsvString(headers, rows),
    };
  }
}
