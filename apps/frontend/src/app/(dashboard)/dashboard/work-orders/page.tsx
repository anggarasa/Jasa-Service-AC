'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Search,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  User,
  Wrench,
  Calendar,
} from 'lucide-react';
import { fetchWorkOrders, WorkOrderListResponse } from '@/lib/api/work-orders';

export default function WorkOrdersListPage() {
  const [data, setData] = useState<WorkOrderListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const loadWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWorkOrders({
        page,
        limit,
        search: search.trim() || undefined,
        status: status ? (status as any) : undefined,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat Surat Perintah Kerja.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status]);

  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  const getStatusBadge = (woStatus: string) => {
    switch (woStatus) {
      case 'DRAFT':
        return <Badge variant="outline" className="bg-slate-50 text-slate-700">Draf</Badge>;
      case 'SCHEDULED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Terjadwal</Badge>;
      case 'ASSIGNED':
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">Ditugaskan</Badge>;
      case 'ON_THE_WAY':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">Menuju Lokasi</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">Pengerjaan</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">Selesai</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300">Dibatalkan</Badge>;
      case 'FOLLOW_UP_REQUIRED':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">Perlu Tindak Lanjut</Badge>;
      default:
        return <Badge variant="outline">{woStatus}</Badge>;
    }
  };

  const workOrderItems = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : [];

  const pagination = data?.pagination || {
    page,
    limit,
    total: workOrderItems.length,
    totalPages: Math.ceil(workOrderItems.length / limit) || 1,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Surat Perintah Kerja (SPK) Lapangan
          </h1>
          <p className="text-sm text-muted-foreground">
            Daftar tugas resmi teknisi servis AC, diagnosa pekerjaan, dan tracking penyelesaian order.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => loadWorkOrders()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Perbarui
          </Button>
          <Link href="/dashboard/work-orders/new">
            <Button size="sm" className="bg-primary hover:bg-primary/95 text-white">
              <Plus className="w-4 h-4 mr-1.5" />
              Terbitkan SPK
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="border-slate-200/80 shadow-sm bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cari nomor SPK, nama pelanggan, booking..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 text-sm"
              />
            </div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs h-9 px-3 rounded-md border border-slate-200 bg-white font-medium text-slate-700"
            >
              <option value="">Semua Status SPK</option>
              <option value="SCHEDULED">Terjadwal (Scheduled)</option>
              <option value="ASSIGNED">Ditugaskan (Assigned)</option>
              <option value="ON_THE_WAY">Menuju Lokasi (On The Way)</option>
              <option value="IN_PROGRESS">Sedang Dikerjakan (In Progress)</option>
              <option value="COMPLETED">Selesai (Completed)</option>
              <option value="FOLLOW_UP_REQUIRED">Perlu Tindak Lanjut</option>
              <option value="CANCELLED">Dibatalkan</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => loadWorkOrders()}>Coba Lagi</Button>
        </div>
      )}

      {/* Work Orders Table */}
      <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Nomor SPK & Jadwal</th>
                <th className="py-3 px-4">Pelanggan & Lokasi</th>
                <th className="py-3 px-4">Teknisi Bertugas</th>
                <th className="py-3 px-4">Pemesanan Terkait</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Memuat data SPK...
                  </td>
                </tr>
              ) : workOrderItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Belum ada Surat Perintah Kerja yang sesuai.
                  </td>
                </tr>
              ) : (
                workOrderItems.map((wo) => {
                  const s = new Date(wo.scheduledStartAt);
                  const dateStr = s.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const timeStr = s.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={wo.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-slate-900 block text-xs">
                            {wo.workOrderNumber}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {dateStr} • {timeStr} WIB
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 max-w-[200px]">
                          <span className="font-medium text-slate-900 block truncate">
                            {wo.customer?.name}
                          </span>
                          <span className="text-xs text-slate-400 block truncate">
                            {wo.customerAddress?.district}, {wo.customerAddress?.city}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-medium text-slate-800">
                          {wo.technician?.user?.name ? (
                            <span className="text-indigo-600 font-semibold">{wo.technician.user.name}</span>
                          ) : (
                            <span className="text-slate-400 italic">Belum ditentukan</span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/dashboard/bookings/${wo.booking?.id}`}>
                          <span className="font-mono text-xs text-primary hover:underline">
                            {wo.booking?.bookingCode}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(wo.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/dashboard/work-orders/${wo.id}`}>
                          <Button size="sm" variant="outline" className="text-xs h-7 px-2">
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Detail SPK
                          </Button>
                        </Link>
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
              Menampilkan {((page - 1) * limit) + 1} s/d {Math.min(page * limit, pagination.total)} dari {pagination.total} SPK
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
