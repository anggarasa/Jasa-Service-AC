import { Injectable, Logger } from '@nestjs/common';
const PDFDocument = require('pdfkit');

export interface InvoicePdfData {
  business: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  };
  invoice: {
    invoiceNumber: string;
    status: string;
    issuedAt: Date | string | null;
    dueAt: Date | string | null;
    subtotal: number | string;
    discountTotal: number | string;
    taxTotal: number | string;
    grandTotal: number | string;
    verifiedPaidTotal: number | string;
    outstandingBalance: number | string;
    items: Array<{
      lineType: string;
      descriptionSnapshot: string;
      quantity: number | string;
      unitPrice: number | string;
      lineTotal: number | string;
    }>;
  };
  customer: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  };
  workOrder: {
    workOrderNumber: string;
    completedAt?: Date | string | null;
    technicianName?: string | null;
  };
}

export interface ReceiptPdfData {
  business: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  };
  receiptNumber: string;
  paymentReference: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string | null;
  amount: number | string;
  method: string;
  paidAtClaimed?: Date | string | null;
  verifiedAt: Date | string | null;
  verifiedByName?: string | null;
}

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  private formatCurrency(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  }

  async generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err: Error) => reject(err));

        // Header
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#0284c7').text(data.business.name || 'CoolCare AC Service');
        doc.fontSize(9).font('Helvetica').fillColor('#475569');
        if (data.business.address) doc.text(data.business.address);
        const contactLine = [data.business.phone, data.business.email].filter(Boolean).join(' | ');
        if (contactLine) doc.text(contactLine);

        doc.moveDown(1);
        doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(1.5);

        // Title and Meta
        const topY = doc.y;
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f172a').text('FAKTUR TAGIHAN (INVOICE)', 40, topY);
        doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Nomor: ${data.invoice.invoiceNumber}`);
        doc.text(`Status: ${data.invoice.status}`);
        doc.text(`Tanggal Terbit: ${this.formatDate(data.invoice.issuedAt)}`);
        if (data.invoice.dueAt) {
          doc.text(`Jatuh Tempo: ${this.formatDate(data.invoice.dueAt)}`);
        }

        // Customer details on right column
        const rightColX = 320;
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('Ditujukan Kepada:', rightColX, topY);
        doc.fontSize(10).font('Helvetica').fillColor('#334155');
        doc.text(data.customer.name, rightColX);
        if (data.customer.phone) doc.text(`Telp: ${data.customer.phone}`, rightColX);
        if (data.customer.address) doc.text(`Alamat: ${data.customer.address}`, rightColX, undefined, { width: 235 });
        doc.text(`SPK Ref: ${data.workOrder.workOrderNumber}`, rightColX);
        if (data.workOrder.technicianName) {
          doc.text(`Teknisi: ${data.workOrder.technicianName}`, rightColX);
        }

        doc.moveDown(2.5);

        // Items Table
        const tableTop = Math.max(doc.y, 220);
        doc.rect(40, tableTop, 515, 22).fill('#f1f5f9');
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#334155');
        doc.text('No', 45, tableTop + 6);
        doc.text('Deskripsi Pekerjaan / Material', 70, tableTop + 6);
        doc.text('Qty', 340, tableTop + 6, { width: 40, align: 'right' });
        doc.text('Harga Satuan', 390, tableTop + 6, { width: 75, align: 'right' });
        doc.text('Jumlah', 475, tableTop + 6, { width: 75, align: 'right' });

        let currentY = tableTop + 24;
        doc.font('Helvetica').fontSize(9).fillColor('#1e293b');

        data.invoice.items.forEach((item, index) => {
          const itemY = currentY;
          doc.text(String(index + 1), 45, itemY);
          doc.text(item.descriptionSnapshot, 70, itemY, { width: 260 });
          doc.text(String(item.quantity), 340, itemY, { width: 40, align: 'right' });
          doc.text(this.formatCurrency(item.unitPrice), 390, itemY, { width: 75, align: 'right' });
          doc.text(this.formatCurrency(item.lineTotal), 475, itemY, { width: 75, align: 'right' });

          currentY += 20;
          doc.strokeColor('#f1f5f9').lineWidth(0.5).moveTo(40, currentY).lineTo(555, currentY).stroke();
          currentY += 4;
        });

        currentY += 10;

        // Totals Box
        const summaryX = 350;
        doc.fontSize(9).font('Helvetica');
        doc.text('Subtotal:', summaryX, currentY);
        doc.text(this.formatCurrency(data.invoice.subtotal), 460, currentY, { width: 90, align: 'right' });
        currentY += 16;

        if (Number(data.invoice.discountTotal) > 0) {
          doc.text('Diskon:', summaryX, currentY);
          doc.text(`-${this.formatCurrency(data.invoice.discountTotal)}`, 460, currentY, { width: 90, align: 'right' });
          currentY += 16;
        }

        if (Number(data.invoice.taxTotal) > 0) {
          doc.text('PPN:', summaryX, currentY);
          doc.text(this.formatCurrency(data.invoice.taxTotal), 460, currentY, { width: 90, align: 'right' });
          currentY += 16;
        }

        doc.strokeColor('#94a3b8').lineWidth(1).moveTo(summaryX, currentY).lineTo(555, currentY).stroke();
        currentY += 6;

        doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a');
        doc.text('Total Tagihan:', summaryX, currentY);
        doc.text(this.formatCurrency(data.invoice.grandTotal), 460, currentY, { width: 90, align: 'right' });
        currentY += 18;

        doc.fontSize(10).font('Helvetica').fillColor('#16a34a');
        doc.text('Total Terbayar (Verifikasi):', summaryX - 20, currentY);
        doc.text(this.formatCurrency(data.invoice.verifiedPaidTotal), 460, currentY, { width: 90, align: 'right' });
        currentY += 16;

        doc.fontSize(11).font('Helvetica-Bold').fillColor('#dc2626');
        doc.text('Sisa Tagihan:', summaryX, currentY);
        doc.text(this.formatCurrency(data.invoice.outstandingBalance), 460, currentY, { width: 90, align: 'right' });

        // Footer / Note
        doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94a3b8')
          .text('Dokumen ini diterbitkan secara otomatis dan sah sebagai bukti penagihan resmi.', 40, 760, {
            align: 'center',
            width: 515,
          });

        doc.end();
      } catch (err) {
        this.logger.error('Failed to generate Invoice PDF', err);
        reject(err);
      }
    });
  }

  async generateReceiptPdf(data: ReceiptPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err: Error) => reject(err));

        // Header
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#0284c7').text(data.business.name || 'CoolCare AC Service');
        doc.fontSize(9).font('Helvetica').fillColor('#475569');
        if (data.business.address) doc.text(data.business.address);
        const contactLine = [data.business.phone, data.business.email].filter(Boolean).join(' | ');
        if (contactLine) doc.text(contactLine);

        doc.moveDown(1);
        doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(1.5);

        // Title
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f172a').text('KUITANSI PEMBAYARAN RESMI', 40, doc.y, { align: 'center' });
        doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Nomor Kuitansi: ${data.receiptNumber}`, { align: 'center' });
        doc.moveDown(2);

        // Content Table / Box
        const startY = doc.y;
        doc.rect(40, startY, 515, 230).strokeColor('#e2e8f0').lineWidth(1).stroke();

        let rowY = startY + 20;
        const addRow = (label: string, value: string, boldValue = false) => {
          doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(label, 60, rowY, { width: 150 });
          doc.text(':', 210, rowY);
          if (boldValue) {
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text(value, 225, rowY, { width: 310 });
          } else {
            doc.fontSize(10).font('Helvetica').fillColor('#1e293b').text(value, 225, rowY, { width: 310 });
          }
          rowY += 26;
        };

        addRow('Telah Diterima Dari', data.customerName, true);
        addRow('No. Referensi Pembayaran', data.paymentReference);
        addRow('Untuk Pembayaran Faktur', data.invoiceNumber);
        addRow('Metode Pembayaran', data.method);
        addRow('Tanggal Bayar (Klaim)', this.formatDate(data.paidAtClaimed));
        addRow('Tanggal Verifikasi', this.formatDate(data.verifiedAt));
        if (data.verifiedByName) {
          addRow('Diverifikasi Oleh', data.verifiedByName);
        }

        doc.moveDown(2);
        const amountY = rowY + 20;
        doc.rect(60, amountY, 475, 50).fill('#f0fdf4');
        doc.strokeColor('#86efac').lineWidth(1).rect(60, amountY, 475, 50).stroke();

        doc.fontSize(11).font('Helvetica-Bold').fillColor('#15803d').text('JUMLAH PEMBAYARAN:', 80, amountY + 12);
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#166534').text(this.formatCurrency(data.amount), 80, amountY + 26);

        // Signatures
        const signY = amountY + 90;
        doc.fontSize(9).font('Helvetica').fillColor('#64748b');
        doc.text('Tanda Terima Kasir / Admin', 380, signY, { align: 'center', width: 150 });
        doc.moveDown(4);
        doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(380, signY + 65).lineTo(530, signY + 65).stroke();
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text(data.verifiedByName || data.business.name, 380, signY + 70, { align: 'center', width: 150 });

        // Footer
        doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94a3b8')
          .text('Kuitansi ini merupakan bukti pembayaran yang sah dan mengikat secara hukum.', 40, 760, {
            align: 'center',
            width: 515,
          });

        doc.end();
      } catch (err) {
        this.logger.error('Failed to generate Receipt PDF', err);
        reject(err);
      }
    });
  }
}
