'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchInvoices } from '@/lib/api/billing';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  FileDown,
  AlertCircle,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

export default function InvoicesListPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchInvoices({
        page,
        limit: 10,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setInvoices(res.items);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar faktur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Draf</span>;
      case 'ISSUED':
        return <span className="bg-sky-100 text-sky-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Diterbitkan</span>;
      case 'PARTIALLY_PAID':
        return <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Dibayar Sebagian</span>;
      case 'PAID':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Lunas</span>;
      case 'VOID':
        return <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Dibatalkan</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-primary" />
            Faktur & Penagihan
          </h1>
          <p className="text-sm text-slate-500">
            Kelola penagihan resmi, status jatuh tempo, dan rekonsiliasi pembayaran servis
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari no. faktur atau nama pelanggan..."
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

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Semua Status</option>
            <option value="DRAFT">Draf</option>
            <option value="ISSUED">Diterbitkan (Belum Bayar)</option>
            <option value="PARTIALLY_PAID">Dibayar Sebagian</option>
            <option value="PAID">Lunas</option>
            <option value="VOID">Dibatalkan (Void)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase border-b border-slate-100">
              <tr>
                <th className="p-4">No. Faktur</th>
                <th className="p-4">Pelanggan</th>
                <th className="p-4">Ref. SPK</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Total Tagihan</th>
                <th className="p-4 text-right">Terbayar</th>
                <th className="p-4 text-right">Sisa Tagihan</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mb-2" />
                    <p className="text-xs">Memuat daftar faktur...</p>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-sm">
                    Tidak ada faktur yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 font-mono font-medium text-slate-900">
                      <Link
                        href={`/dashboard/invoices/${inv.id}`}
                        className="text-primary hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                      <div className="text-[11px] text-slate-400 font-sans">
                        {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString('id-ID') : 'Draf'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{inv.customer.name}</div>
                      <div className="text-xs text-slate-500">{inv.customer.phone}</div>
                    </td>
                    <td className="p-4 text-slate-600">
                      <span className="font-mono text-xs">{inv.workOrder.workOrderNumber}</span>
                      {inv.workOrder.technician && (
                        <div className="text-[11px] text-slate-400">
                          Teknisi: {inv.workOrder.technician.user?.name}
                        </div>
                      )}
                    </td>
                    <td className="p-4">{getStatusBadge(inv.status)}</td>
                    <td className="p-4 text-right font-medium text-slate-900">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="p-4 text-right font-medium text-emerald-600">
                      {formatCurrency(inv.verifiedPaidTotal)}
                    </td>
                    <td className="p-4 text-right font-bold text-red-600">
                      {formatCurrency(inv.outstandingBalance)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/dashboard/invoices/${inv.id}`}
                          className="p-1.5 text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                          title="Lihat Detail Faktur"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {inv.status !== 'DRAFT' && (
                          <a
                            href={`/api/v1/admin/invoices/${inv.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Unduh PDF Resmi"
                          >
                            <FileDown className="w-4 h-4" />
                          </a>
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
              Menampilkan hal {pagination.page} dari {pagination.totalPages} ({pagination.total} faktur)
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
    </div>
  );
}
