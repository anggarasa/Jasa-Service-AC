'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar,
  Search,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Wrench,
  Clock,
  Phone,
  MapPin,
} from 'lucide-react';
import {
  AdminBookingListResponse,
  confirmAdminBooking,
  fetchAdminBookings,
} from '@/lib/api/admin-bookings';

export default function BookingsListPage() {
  const [data, setData] = useState<AdminBookingListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAdminBookings({
        page,
        limit,
        search: search.trim() || undefined,
        status: status ? (status as any) : undefined,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat data pemesanan servis.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleQuickConfirm = async (id: string) => {
    if (!confirm('Konfirmasi pemesanan ini?')) return;
    try {
      setActionLoadingId(id);
      await confirmAdminBooking(id, {});
      await loadBookings();
    } catch (err: any) {
      alert(err?.message || 'Gagal mengonfirmasi pemesanan.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (bStatus: string) => {
    switch (bStatus) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">Menunggu</Badge>;
      case 'CONFIRMED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Dikonfirmasi</Badge>;
      case 'ASSIGNED':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">Ditugaskan</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">Dikerjakan</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">Selesai</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300">Dibatalkan</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Ditolak</Badge>;
      default:
        return <Badge variant="outline">{bStatus}</Badge>;
    }
  };

  const formatRupiah = (val?: number | string | null) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(val));
  };

  const bookingItems = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : [];

  const pagination = data?.pagination || {
    page,
    limit,
    total: bookingItems.length,
    totalPages: Math.ceil(bookingItems.length / limit) || 1,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Daftar Pemesanan Servis
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola seluruh reservasi servis AC pelanggan, alokasi teknisi, dan status jadwal lapangan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => loadBookings()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Perbarui
          </Button>
          <Link href="/dashboard/bookings/new">
            <Button size="sm" className="bg-primary hover:bg-primary/95 text-white">
              <Plus className="w-4 h-4 mr-1.5" />
              Pemesanan Manual
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="border-slate-200/80 shadow-sm bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cari kode booking, nama pelanggan, telepon..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="text-xs h-9 px-3 rounded-md border border-slate-200 bg-white font-medium text-slate-700"
              >
                <option value="">Semua Status</option>
                <option value="PENDING">Menunggu (Pending)</option>
                <option value="CONFIRMED">Dikonfirmasi (Confirmed)</option>
                <option value="ASSIGNED">Ditugaskan (Assigned)</option>
                <option value="IN_PROGRESS">Dikerjakan (In Progress)</option>
                <option value="COMPLETED">Selesai (Completed)</option>
                <option value="CANCELLED">Dibatalkan (Cancelled)</option>
                <option value="REJECTED">Ditolak (Rejected)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => loadBookings()}>Coba Lagi</Button>
        </div>
      )}

      {/* Bookings Table Card */}
      <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Kode & Waktu</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Layanan & Unit</th>
                <th className="py-3 px-4">Teknisi</th>
                <th className="py-3 px-4">Estimasi Biaya</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    Memuat data pemesanan...
                  </td>
                </tr>
              ) : bookingItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    Tidak ada data pemesanan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                bookingItems.map((b) => {
                  const startDate = new Date(b.scheduledStartAt);
                  const dateStr = startDate.toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const timeStr = startDate.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono font-semibold text-slate-900 block text-xs">
                            {b.bookingCode}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {dateStr} • {timeStr} WIB
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 max-w-[180px]">
                          <span className="font-medium text-slate-900 block truncate">
                            {b.customer?.name}
                          </span>
                          <span className="text-xs text-slate-500 block truncate flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {b.customer?.phone}
                          </span>
                          <span className="text-xs text-slate-400 block truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {b.customerAddress?.district}, {b.customerAddress?.city}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-medium text-slate-800 block text-xs truncate max-w-[160px]">
                            {b.service?.name || b.serviceNameSnapshot}
                          </span>
                          <span className="text-xs text-slate-500">
                            {b.unitCount} Unit AC
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-medium text-slate-700">
                          {b.technician?.user?.name ? (
                            <span className="text-indigo-600 font-semibold">{b.technician.user.name}</span>
                          ) : (
                            <span className="text-slate-400 italic">Belum ditugaskan</span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 text-xs">
                        {formatRupiah(b.estimatedTotal)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(b.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {b.status === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickConfirm(b.id)}
                              disabled={actionLoadingId === b.id}
                              className="text-xs h-7 px-2 text-emerald-600 hover:text-emerald-700 border-emerald-300 bg-emerald-50/50"
                              title="Konfirmasi Cepat"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Konfirmasi
                            </Button>
                          )}
                          <Link href={`/dashboard/bookings/${b.id}`}>
                            <Button size="sm" variant="outline" className="text-xs h-7 px-2">
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Detail
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan {((page - 1) * limit) + 1} s/d {Math.min(page * limit, pagination.total)} dari {pagination.total} pemesanan
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="px-2 font-medium text-slate-800">
                {page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
