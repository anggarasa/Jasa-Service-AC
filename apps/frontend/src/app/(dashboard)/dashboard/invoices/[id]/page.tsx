'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  fetchInvoiceDetail,
  issueInvoice,
  voidInvoice,
  recordInvoicePayment,
} from '@/lib/api/billing';
import {
  ArrowLeft,
  Receipt,
  FileDown,
  CreditCard,
  Ban,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Building2,
  User,
  Calendar,
  FileText,
  DollarSign,
} from 'lucide-react';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Record Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNotes, setPayNotes] = useState('');

  // Void Invoice Modal
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');

  const loadInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchInvoiceDetail(invoiceId);
      setInvoice(res);
      setPayAmount(Number(res.outstandingBalance || 0));
    } catch (err: any) {
      setError(err.message || 'Gagal memuat detail faktur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  const handleIssueInvoice = async () => {
    if (!confirm('Terbitkan faktur ini secara resmi? Item rincian tagihan akan dikunci permanen.')) return;
    try {
      setActionLoading(true);
      setError(null);
      await issueInvoice(invoiceId);
      setSuccessMsg('Faktur berhasil diterbitkan resmi.');
      await loadInvoice();
    } catch (err: any) {
      setError(err.message || 'Gagal menerbitkan faktur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) {
      setError('Jumlah pembayaran harus lebih dari Rp 0');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await recordInvoicePayment(invoiceId, {
        method: payMethod,
        amount: Number(payAmount),
        notes: payNotes,
        idempotencyKey: `pay-${invoiceId}-${Date.now()}`,
      });
      setShowPaymentModal(false);
      setSuccessMsg('Pembayaran berhasil dicatat dan masuk ke antrean verifikasi kasir.');
      await loadInvoice();
    } catch (err: any) {
      setError(err.message || 'Gagal merekam pembayaran');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVoidInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidReason.trim()) {
      setError('Alasan pembatalan faktur wajib diisi');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await voidInvoice(invoiceId, voidReason);
      setShowVoidModal(false);
      setSuccessMsg('Faktur berhasil dibatalkan (VOID).');
      await loadInvoice();
    } catch (err: any) {
      setError(err.message || 'Gagal membatalkan faktur');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  const formatDate = (val: string | null | undefined) => {
    if (!val) return '-';
    return new Date(val).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
        <p>Memuat detail faktur tagihan...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center text-slate-500 space-y-4">
        <p>Faktur tidak ditemukan.</p>
        <Link href="/dashboard/invoices" className="text-primary hover:underline">
          Kembali ke daftar faktur
        </Link>
      </div>
    );
  }

  const isDraft = invoice.status === 'DRAFT';
  const isVoid = invoice.status === 'VOID';
  const isPaid = invoice.status === 'PAID';
  const canPay = !isDraft && !isVoid && !isPaid;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/invoices"
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
                {invoice.invoiceNumber}
              </h1>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  invoice.status === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : invoice.status === 'PARTIALLY_PAID'
                    ? 'bg-amber-100 text-amber-800'
                    : invoice.status === 'ISSUED'
                    ? 'bg-sky-100 text-sky-800'
                    : invoice.status === 'VOID'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {invoice.status}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Diterbitkan: {formatDate(invoice.issuedAt)} | Jatuh Tempo: {formatDate(invoice.dueAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDraft && (
            <button
              onClick={handleIssueInvoice}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Terbitkan Faktur Resmi
            </button>
          )}

          {canPay && (
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              Catat Pembayaran
            </button>
          )}

          {!isVoid && (
            <a
              href={`/api/v1/admin/invoices/${invoice.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors shadow-sm"
            >
              <FileDown className="w-4 h-4" />
              Cetak / PDF
            </a>
          )}

          {!isVoid && !isPaid && (
            <button
              onClick={() => setShowVoidModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors"
            >
              <Ban className="w-4 h-4" />
              Batalkan
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Invoice Details Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
        {/* Parties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Building2 className="w-4 h-4" />
              Penyedia Jasa
            </div>
            <div className="text-slate-900 font-bold text-base">{invoice.business?.name}</div>
            <div className="text-sm text-slate-500 whitespace-pre-line">{invoice.business?.address}</div>
            <div className="text-sm text-slate-500">
              Telp: {invoice.business?.phone} | Email: {invoice.business?.email}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
              <User className="w-4 h-4" />
              Tagihan Ditujukan Kepada
            </div>
            <div className="text-slate-900 font-bold text-base">{invoice.customer?.name}</div>
            <div className="text-sm text-slate-500">
              Telp: {invoice.customer?.phone} | Email: {invoice.customer?.email || '-'}
            </div>
            <div className="text-xs text-slate-500 pt-1">
              Ref. SPK:{' '}
              <Link
                href={`/dashboard/work-orders/${invoice.workOrderId}`}
                className="text-primary font-mono hover:underline"
              >
                {invoice.workOrder?.workOrderNumber}
              </Link>{' '}
              | Teknisi: {invoice.workOrder?.technician?.user?.name || 'Belum Ditugaskan'}
            </div>
          </div>
        </div>

        {/* Itemized Table Snapshot */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            Rincian Tagihan Layanan & Material
          </h3>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase border-b border-slate-100">
                <tr>
                  <th className="p-3 w-12 text-center">No</th>
                  <th className="p-3">Deskripsi Pekerjaan / Suku Cadang</th>
                  <th className="p-3 w-20 text-right">Kuantitas</th>
                  <th className="p-3 w-36 text-right">Harga Satuan</th>
                  <th className="p-3 w-36 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items?.map((item: any, idx: number) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-center text-slate-400 text-xs">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-medium text-slate-800">{item.descriptionSnapshot}</div>
                      <div className="text-[11px] text-slate-400">{item.lineType}</div>
                    </td>
                    <td className="p-3 text-right text-slate-700">{Number(item.quantity)}</td>
                    <td className="p-3 text-right text-slate-700">{formatCurrency(item.unitPrice)}</td>
                    <td className="p-3 text-right font-semibold text-slate-900">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end pt-2">
          <div className="w-full max-w-sm space-y-2 text-sm bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-medium text-slate-900">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {Number(invoice.discountTotal) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Diskon:</span>
                <span className="font-medium text-slate-900">-{formatCurrency(invoice.discountTotal)}</span>
              </div>
            )}
            {Number(invoice.taxTotal) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>PPN:</span>
                <span className="font-medium text-slate-900">{formatCurrency(invoice.taxTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total Tagihan:</span>
              <span>{formatCurrency(invoice.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-emerald-700">
              <span>Total Terbayar:</span>
              <span>{formatCurrency(invoice.verifiedPaidTotal)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-red-600 pt-1 border-t border-slate-200">
              <span>Sisa Tagihan:</span>
              <span>{formatCurrency(invoice.outstandingBalance)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payments History & Receipts */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-900">Riwayat Pembayaran & Kuitansi</h3>
          </div>
          {canPay && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="text-xs bg-slate-900 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              + Catat Pembayaran
            </button>
          )}
        </div>

        {invoice.payments?.length === 0 ? (
          <p className="text-slate-400 text-xs py-2">Belum ada rekaman pembayaran untuk faktur ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase border-b border-slate-100">
                <tr>
                  <th className="p-3">No. Referensi</th>
                  <th className="p-3">Metode</th>
                  <th className="p-3 text-right">Jumlah</th>
                  <th className="p-3">Tanggal Klaim</th>
                  <th className="p-3">Status Verifikasi</th>
                  <th className="p-3 text-center">Kuitansi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-medium text-slate-800">{p.paymentReference}</td>
                    <td className="p-3">{p.method}</td>
                    <td className="p-3 text-right font-semibold text-slate-900">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="p-3 text-slate-600">{formatDate(p.paidAtClaimed)}</td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          p.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {p.status === 'VERIFIED' && p.receipt ? (
                        <a
                          href={`/api/v1/admin/payments/${p.id}/receipt-pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded border border-emerald-200 transition-colors"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          {p.receipt.receiptNumber}
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Catat Pembayaran */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Catat Pembayaran Masuk</h3>
            <p className="text-xs text-slate-500">
              Sisa tagihan saat ini:{' '}
              <strong className="text-red-600">{formatCurrency(invoice.outstandingBalance)}</strong>
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                >
                  <option value="CASH">Tunai (Diterima di Tempat)</option>
                  <option value="BANK_TRANSFER">Transfer Bank Manual</option>
                  <option value="EXTERNAL_QRIS">QRIS Statis / Eksternal</option>
                  <option value="OTHER_MANUAL">Lainnya (Manual)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah yang Diterima (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={Number(invoice.outstandingBalance)}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Pembayaran (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Misal: Diterima oleh teknisi Dani / Bukti transfer BCA atas nama..."
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Batalkan Faktur (VOID) */}
      {showVoidModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
              <Ban className="w-5 h-5" />
              Batalkan Faktur Tagihan
            </h3>
            <p className="text-xs text-slate-500">
              Membatalkan faktur akan mengubah status menjadi <strong>VOID</strong> secara permanen. Tindakan ini hanya diizinkan jika tidak ada pembayaran yang berstatus terverifikasi.
            </p>

            <form onSubmit={handleVoidInvoice} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Pembatalan (Wajib)
                </label>
                <textarea
                  required
                  rows={3}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="Jelaskan alasan pembatalan faktur..."
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVoidModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Memproses...' : 'Konfirmasi Batalkan Faktur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
