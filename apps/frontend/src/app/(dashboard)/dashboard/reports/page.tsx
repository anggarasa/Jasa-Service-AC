'use client';

import { useEffect, useState } from 'react';
import { fetchOperationalReports } from '@/lib/api/billing';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Users,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

export default function OperationalReportsPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportType, setExportType] = useState<'invoices' | 'payments' | 'work-orders'>('invoices');

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchOperationalReports({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat laporan operasional & keuangan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadReports();
  };

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    params.set('type', exportType);

    const url = `/api/v1/admin/reports/export?${params.toString()}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" />
            Laporan Operasional & Keuangan
          </h1>
          <p className="text-sm text-slate-500">
            Analisis metrik pendapatan tertagih (billed), kas terverifikasi (received), dan produktivitas teknisi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={exportType}
            onChange={(e) => setExportType(e.target.value as any)}
            className="border border-slate-200 rounded-lg py-2 px-3 text-xs bg-white focus:outline-none"
          >
            <option value="invoices">Faktur Tagihan</option>
            <option value="payments">Penerimaan Pembayaran</option>
            <option value="work-orders">Surat Tugas (SPK)</option>
          </select>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs font-medium transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Ekspor CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Date Filter Bar */}
      <form onSubmit={handleFilter} className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Mulai</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-slate-200 rounded-lg p-2 text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Selesai</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-slate-200 rounded-lg p-2 text-sm focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          Terapkan Filter
        </button>
      </form>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-3" />
          <p>Mengkalkulasi laporan operasional & keuangan...</p>
        </div>
      ) : (
        <>
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Invoiced */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Total Ditagihkan (Billed)</span>
                <DollarSign className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-xl font-bold text-slate-900">
                {formatCurrency(data?.kpi.totalInvoicedAmount || 0)}
              </div>
              <p className="text-[11px] text-slate-400">Akumulasi faktur resmi yang diterbitkan</p>
            </div>

            {/* Total Received */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Kas Terverifikasi (Received)</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-emerald-600">
                {formatCurrency(data?.kpi.totalVerifiedRevenue || 0)}
              </div>
              <p className="text-[11px] text-slate-400">Pembayaran riil yang masuk rekening / kas</p>
            </div>

            {/* Total Receivables */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Piutang Belum Lunas</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-bold text-amber-600">
                {formatCurrency(data?.kpi.totalOutstandingReceivables || 0)}
              </div>
              <p className="text-[11px] text-slate-400">Sisa saldo tagihan yang belum terbayar</p>
            </div>

            {/* Pending Verification */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                <span>Menunggu Verifikasi Kasir</span>
                <AlertCircle className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xl font-bold text-purple-600">
                {formatCurrency(data?.kpi.totalPendingVerification || 0)}
              </div>
              <p className="text-[11px] text-slate-400">Klaim pembayaran yang belum divalidasi</p>
            </div>
          </div>

          {/* Operational Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{data?.kpi.totalBookings || 0}</div>
                <div className="text-xs text-slate-500">Total Reservasi Dibuat</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{data?.kpi.completedWorkOrders || 0}</div>
                <div className="text-xs text-slate-500">Pekerjaan Servis Selesai</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{data?.kpi.cancelledWorkOrders || 0}</div>
                <div className="text-xs text-slate-500">Pekerjaan SPK Dibatalkan</div>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Payment Breakdown & Technician Ranking */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Methods Breakdown */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-slate-900 text-sm">
                Distribusi Metode Pembayaran Terverifikasi
              </h3>
              <div className="space-y-3">
                {data?.paymentMethods?.map((pm: any) => (
                  <div key={pm.method} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>{pm.method} ({pm.count} transaksi)</span>
                      <span>{formatCurrency(pm.totalAmount)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{
                          width: `${
                            Number(data?.kpi.totalVerifiedRevenue) > 0
                              ? Math.min(
                                  100,
                                  (Number(pm.totalAmount) / Number(data.kpi.totalVerifiedRevenue)) * 100,
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technician Performance & Revenue Ranking */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-600" />
                <h3 className="font-semibold text-slate-900 text-sm">
                  Kinerja & Kontribusi Pendapatan Teknisi
                </h3>
              </div>

              {data?.technicianStats?.length === 0 ? (
                <p className="text-xs text-slate-400">Belum ada data teknisi yang tercatat.</p>
              ) : (
                <div className="space-y-3">
                  {data?.technicianStats?.map((t: any, idx: number) => (
                    <div
                      key={t.technicianId}
                      className="flex items-center justify-between p-3 bg-slate-50/70 border border-slate-100 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-medium text-slate-900">{t.technicianName}</div>
                          <div className="text-xs text-slate-500">
                            {t.completedJobs} SPK Selesai
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600">
                          {formatCurrency(t.verifiedRevenue)}
                        </div>
                        <div className="text-[11px] text-slate-400">Pendapatan Terverifikasi</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
