'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  fetchTechnicianDashboard,
  TechnicianDashboardResponse,
} from '@/lib/api/technician';
import {
  Wrench,
  Navigation,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  ArrowRight,
  RefreshCw,
  Calendar,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string }> = {
  ASSIGNED: { label: 'Ditugaskan', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  ON_THE_WAY: { label: 'Menuju Lokasi', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  ARRIVED: { label: 'Tiba di Lokasi', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  IN_PROGRESS: { label: 'Sedang Dikerjakan', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  COMPLETED: { label: 'Selesai', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  FOLLOW_UP_REQUIRED: { label: 'Perlu Tindak Lanjut', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-slate-100 text-slate-800 border-slate-200' },
};

export default function TechnicianDashboardPage() {
  const [data, setData] = useState<TechnicianDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchTechnicianDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat ringkasan dashboard teknisi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500 font-medium">Memuat data operasional teknisi...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 sm:p-6 bg-red-50 border border-red-200 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-red-700 font-semibold">
          <AlertCircle className="w-5 h-5" />
          <span>Terjadi Kendala Memuat Data</span>
        </div>
        <p className="text-sm text-red-600">{error}</p>
        <Button variant="outline" size="sm" onClick={loadData}>
          Coba Lagi
        </Button>
      </div>
    );
  }

  const { metrics, technician, todayJobs } = data;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-primary to-blue-900 rounded-2xl p-5 sm:p-6 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-blue-200">
            {technician.businessName} • Field Service
          </span>
          <h1 className="text-xl sm:text-2xl font-bold mt-0.5">
            Semangat Bekerja, {technician.name}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-1">
            Utamakan keselamatan kerja, kelengkapan inspeksi, dan kepuasan pelanggan.
          </p>
        </div>
        <Button
          asChild
          variant="secondary"
          size="sm"
          className="bg-white/90 text-slate-900 hover:bg-white text-xs font-semibold shrink-0"
        >
          <Link href="/technician/jobs">Lihat Semua Tugas SPK</Link>
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-3 sm:p-4">
            <span className="text-xs text-amber-700 font-medium">Ditugaskan</span>
            <div className="text-2xl font-bold text-amber-900 mt-1">
              {metrics.assignedCount}
            </div>
            <span className="text-[11px] text-amber-600 mt-0.5 block">Siap jalan</span>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/40">
          <CardContent className="p-3 sm:p-4">
            <span className="text-xs text-blue-700 font-medium">Perjalanan</span>
            <div className="text-2xl font-bold text-blue-900 mt-1">
              {metrics.onTheWayCount}
            </div>
            <span className="text-[11px] text-blue-600 mt-0.5 block">Menuju lokasi</span>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-indigo-50/40">
          <CardContent className="p-3 sm:p-4">
            <span className="text-xs text-indigo-700 font-medium">Tiba</span>
            <div className="text-2xl font-bold text-indigo-900 mt-1">
              {metrics.arrivedCount}
            </div>
            <span className="text-[11px] text-indigo-600 mt-0.5 block">Di tempat</span>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/40">
          <CardContent className="p-3 sm:p-4">
            <span className="text-xs text-purple-700 font-medium">Pengerjaan</span>
            <div className="text-2xl font-bold text-purple-900 mt-1">
              {metrics.inProgressCount}
            </div>
            <span className="text-[11px] text-purple-600 mt-0.5 block">Sedang servis</span>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/40 col-span-2 sm:col-span-1">
          <CardContent className="p-3 sm:p-4">
            <span className="text-xs text-emerald-700 font-medium">Selesai Hari Ini</span>
            <div className="text-2xl font-bold text-emerald-900 mt-1">
              {metrics.completedTodayCount}
            </div>
            <span className="text-[11px] text-emerald-600 mt-0.5 block">Tuntas diperiksa</span>
          </CardContent>
        </Card>
      </div>

      {/* Today Jobs Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Pekerjaan Hari Ini & Tugas Aktif
            </h2>
            <p className="text-xs text-muted-foreground">
              Daftar SPK yang perlu dieksekusi atau sedang berjalan.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={loadData} className="text-xs text-slate-600">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Segarkan
          </Button>
        </div>

        {todayJobs.length === 0 ? (
          <Card className="border-dashed border-slate-300 bg-white">
            <CardContent className="py-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <div className="space-y-1">
                <p className="font-semibold text-slate-800">Tidak ada tugas aktif saat ini</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Semua SPK hari ini telah selesai atau belum ada penugasan baru dari admin.
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="mt-2 text-xs">
                <Link href="/technician/jobs">Periksa Riwayat Tugas</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayJobs.map((job) => {
              const statusInfo = statusConfig[job.status] || {
                label: job.status,
                color: 'bg-slate-100 text-slate-800',
              };

              const scheduledTime = new Date(job.scheduledStartAt).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <Card
                  key={job.id}
                  className="border-slate-200/80 shadow-sm hover:shadow transition-all bg-white overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-semibold text-primary">
                          {job.workOrderNumber}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base mt-0.5">
                          {job.customer.name}
                        </h3>
                      </div>
                      <Badge variant="outline" className={`text-[11px] font-semibold ${statusInfo.color}`}>
                        {statusInfo.label}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Pukul {scheduledTime} WIB</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {job.customerAddress.fullAddress}, {job.customerAddress.district}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{job.items.length} Unit AC terdaftar</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 bg-slate-50/50 p-3 px-4 flex items-center justify-between">
                    <a
                      href={`tel:${job.customer.phone}`}
                      className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" /> Telepon
                    </a>
                    <Button asChild size="sm" className="text-xs h-8">
                      <Link href={`/technician/jobs/${job.id}`}>
                        Buka SPK <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
