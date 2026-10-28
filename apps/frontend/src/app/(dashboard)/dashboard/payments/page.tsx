'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchPayments, verifyPayment, rejectPayment } from '@/lib/api/billing';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileDown,
  Eye,
  Check,
  X,
} from 'lucide-react';

export default function PaymentsMonitoringPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Verification & Rejection Modals
  const [verifyTarget, setVerifyTarget] = useState<any | null>(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPayments({
        page,
        limit: 10,
        status: statusFilter || undefined,
        method: methodFilter || undefined,
        search: search || undefined,
      });
      setPayments(res.items);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat antrean pembayaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter, methodFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleConfirmVerify = async () => {
    if (!verifyTarget) return;
    try {
      setActionLoading(true);
      setError(null);
      await verifyPayment(verifyTarget.id, verifyNotes);
      setSuccessMsg(`Pembayaran ${verifyTarget.paymentReference} berhasil diverifikasi dan kuitansi telah terbit.`);
      setVerifyTarget(null);
      setVerifyNotes('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Gagal memverifikasi pembayaran');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      setError('Alasan penolakan pembayaran wajib diisi');
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      await rejectPayment(rejectTarget.id, rejectReason);
      setSuccessMsg(`Pembayaran ${rejectTarget.paymentReference} telah ditolak.`);
      setRejectTarget(null);
      setRejectReason('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Gagal menolak pembayaran');
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
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-primary" />
            Antrean & Verifikasi Pembayaran
          </h1>
          <p className="text-sm text-slate-500">
            Validasi mutasi bank, kas tunai teknisi, dan penerbitan kuitansi resmi
          </p>
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
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari referensi bayar, no. faktur, atau nama pelanggan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Cari
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Semua Status</option>
            <option value="PENDING_VERIFICATION">Menunggu Verifikasi</option>
            <option value="VERIFIED">Terverifikasi</option>
            <option value="REJECTED">Ditolak</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
            className="border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Semua Metode</option>
            <option value="CASH">Tunai</option>
            <option value="BANK_TRANSFER">Transfer Bank</option>
            <option value="EXTERNAL_QRIS">QRIS</option>
            <option value="OTHER_MANUAL">Lainnya</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase border-b border-slate-100">
              <tr>
                <th className="p-4">No. Referensi</th>
                <th className="p-4">Faktur Terkait</th>
                <th className="p-4">Pelanggan</th>
                <th className="p-4">Metode</th>
                <th className="p-4 text-right">Jumlah (Rp)</th>
                <th className="p-4">Waktu Rekam</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mb-2" />
                    <p className="text-xs">Memuat data pembayaran...</p>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-sm">
                    Tidak ada transaksi pembayaran dalam daftar antrean.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 font-mono font-medium text-slate-900">
                      {p.paymentReference}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/dashboard/invoices/${p.invoice.id}`}
                        className="text-primary font-mono text-xs hover:underline block"
                      >
                        {p.invoice.invoiceNumber}
                      </Link>
                      <span className="text-[11px] text-slate-400">
                        Total Faktur: {formatCurrency(p.invoice.grandTotal)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{p.invoice.customer.name}</div>
                      <div className="text-xs text-slate-500">{p.invoice.customer.phone}</div>
                    </td>
                    <td className="p-4 font-medium text-slate-700">{p.method}</td>
                    <td className="p-4 text-right font-bold text-slate-900">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="p-4 text-xs text-slate-500">{formatDate(p.recordedAt)}</td>
                    <td className="p-4">
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
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {p.status === 'PENDING_VERIFICATION' ? (
                          <>
                            <button
                              onClick={() => {
                                setVerifyTarget(p);
                                setVerifyNotes('');
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 transition-colors"
                              title="Verifikasi Pembayaran"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Verifikasi
                            </button>
                            <button
                              onClick={() => {
                                setRejectTarget(p);
                                setRejectReason('');
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 border border-red-200 text-red-600 rounded text-xs font-medium hover:bg-red-50 transition-colors"
                              title="Tolak Pembayaran"
                            >
                              <X className="w-3.5 h-3.5" />
                              Tolak
                            </button>
                          </>
                        ) : p.status === 'VERIFIED' && p.receipt ? (
                          <a
                            href={`/api/v1/admin/payments/${p.id}/receipt-pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded"
                            title="Unduh Kuitansi PDF"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            Kuitansi
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
            <span>
              Menampilkan hal {pagination.page} dari {pagination.totalPages} ({pagination.total} pembayaran)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Verifikasi Pembayaran */}
      {verifyTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Verifikasi Pembayaran
            </h3>
            <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-1">
              <div>Ref: <strong>{verifyTarget.paymentReference}</strong></div>
              <div>Faktur: <strong>{verifyTarget.invoice.invoiceNumber}</strong></div>
              <div>Jumlah: <strong className="text-emerald-600">{formatCurrency(verifyTarget.amount)}</strong> ({verifyTarget.method})</div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Verifikasi (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Misal: Mutasi rekening BCA nomor tx #8192 telah cocok"
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyTarget(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleConfirmVerify}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Memverifikasi...' : 'Verifikasi & Terbitkan Kuitansi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tolak Pembayaran */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Tolak Pembayaran
            </h3>
            <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-1">
              <div>Ref: <strong>{rejectTarget.paymentReference}</strong></div>
              <div>Jumlah: <strong>{formatCurrency(rejectTarget.amount)}</strong></div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Penolakan (Wajib)
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Misal: Mutasi bank tidak ditemukan / Bukti transfer fiktif"
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectTarget(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleConfirmReject}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Memproses...' : 'Tolak Pembayaran'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
