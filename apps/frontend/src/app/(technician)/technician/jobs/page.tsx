'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  fetchTechnicianWorkOrders,
  TechnicianJobsListResponse,
} from '@/lib/api/technician';
import {
  FileText,
  Search,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  Navigation,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { WorkOrderStatus } from '@tampilkit-ac/api-contract';

const statusConfig: Record<string, { label: string; color: string }> = {
  ASSIGNED: { label: 'Ditugaskan', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  ON_THE_WAY: { label: 'Menuju Lokasi', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  ARRIVED: { label: 'Tiba di Lokasi', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  IN_PROGRESS: { label: 'Sedang Dikerjakan', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  COMPLETED: { label: 'Selesai', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  FOLLOW_UP_REQUIRED: { label: 'Perlu Tindak Lanjut', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-slate-100 text-slate-800 border-slate-200' },
};

const filterTabs = [
  { key: '', label: 'Semua Status' },
  { key: 'ASSIGNED', label: 'Ditugaskan' },
  { key: 'ON_THE_WAY', label: 'Menuju Lokasi' },
  { key: 'ARRIVED', label: 'Tiba di Lokasi' },
  { key: 'IN_PROGRESS', label: 'Dikerjakan' },
  { key: 'COMPLETED', label: 'Selesai' },
  { key: 'FOLLOW_UP_REQUIRED', label: 'Tindak Lanjut' },
];

export default function TechnicianJobsPage() {
  const [data, setData] = useState<TechnicianJobsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(1);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchTechnicianWorkOrders({
        page,
        limit: 10,
        status: (selectedStatus as WorkOrderStatus) || undefined,
        search: search.trim() || undefined,
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar pekerjaan SPK');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [page, selectedStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadJobs();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Pekerjaan Saya (SPK Lapangan)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daftar Surat Perintah Kerja yang ditugaskan kepada Anda.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadJobs} className="text-xs self-start sm:self-auto">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Segarkan
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
        {filterTabs.map((tab) => {
          const isActive = selectedStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setSelectedStatus(tab.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Cari nomor SPK, nama pelanggan, alamat, atau no HP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white text-xs sm:text-sm"
          />
        </div>
        <Button type="submit" size="sm" className="text-xs">
          Cari
        </Button>
      </form>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-red-700 font-semibold text-xs">
            <AlertCircle className="w-4 h-4" />
            <span>Gagal Memuat SPK</span>
          </div>
          <p className="text-xs text-red-600">{error}</p>
          <Button variant="outline" size="sm" onClick={loadJobs} className="text-xs">
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <RefreshCw className="w-7 h-7 animate-spin text-primary" />
          <p className="text-xs text-slate-500 font-medium">Memuat data SPK...</p>
        </div>
      )}

      {/* Jobs list */}
      {!loading && !error && data && (
        <div className="space-y-3">
          {data.items.length === 0 ? (
            <Card className="border-dashed border-slate-300 bg-white">
              <CardContent className="py-12 text-center space-y-2">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-800 text-sm">Tidak ada SPK ditemukan</p>
                <p className="text-xs text-muted-foreground">
                  Coba sesuaikan filter status atau kata kunci pencarian Anda.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {data.items.map((job) => {
                const statusInfo = statusConfig[job.status] || {
                  label: job.status,
                  color: 'bg-slate-100 text-slate-800',
                };

                const dateStr = new Date(job.scheduledStartAt).toLocaleDateString('id-ID', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const timeStr = new Date(job.scheduledStartAt).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                // WhatsApp prefilled link
                const cleanPhone = job.customer.normalizedPhone?.replace('+', '') || job.customer.phone.replace(/[^0-9]/g, '');
                const waText = encodeURIComponent(
                  `Halo Bapak/Ibu ${job.customer.name}, saya teknisi CoolCare AC Service untuk jadwal servis hari ini (${job.workOrderNumber}). Apakah lokasi sudah dapat dikunjungi?`,
                );
                const waUrl = `https://wa.me/${cleanPhone}?text=${waText}`;

                // Maps navigation URL
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${job.customerAddress.fullAddress}, ${job.customerAddress.district}`,
                )}`;

                return (
                  <Card
                    key={job.id}
                    className="border-slate-200/80 shadow-sm hover:shadow-md transition-all bg-white flex flex-col justify-between overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs font-semibold text-primary">
                            {job.workOrderNumber}
                          </span>
                          <h3 className="font-bold text-slate-900 text-base mt-0.5">
                            {job.customer.name}
                          </h3>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-semibold shrink-0 ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {dateStr} • {timeStr} WIB
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">
                            {job.customerAddress.fullAddress}, {job.customerAddress.district}
                          </span>
                        </div>
                      </div>

                      {/* Quick Contact & Navigation Shortcuts */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        <a
                          href={`tel:${job.customer.phone}`}
                          className="flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors"
                        >
                          <Phone className="w-3 h-3 text-slate-600" /> Telepon
                        </a>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition-colors"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" /> WhatsApp
                        </a>
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
                        >
                          <Navigation className="w-3 h-3 text-blue-600" /> Petunjuk Arah
                        </a>
                      </div>
                    </div>

                    <div className="bg-slate-50 border-t border-slate-100 p-3 px-4 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">
                        {job.items.length} Unit AC
                      </span>
                      <Button asChild size="sm" className="text-xs h-8">
                        <Link href={`/technician/jobs/${job.id}`}>
                          Detail & Eksekusi <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 text-xs">
              <span className="text-muted-foreground">
                Halaman {data.pagination.page} dari {data.pagination.totalPages} ({data.pagination.total} SPK)
              </span>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="text-xs h-8"
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-xs h-8"
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
