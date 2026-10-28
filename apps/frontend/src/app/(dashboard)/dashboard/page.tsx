'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  ArrowRight,
  Plus,
  RefreshCw,
  Wrench,
  CalendarDays,
} from 'lucide-react';
import { DashboardOverviewData, fetchDashboardOverview } from '@/lib/api/admin-dashboard';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchDashboardOverview();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat data ringkasan dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
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
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Pusat Kendali Operasional
          </h1>
          <p className="text-sm text-muted-foreground">
            Ikhtisar operasional harian, status pemesanan, dan penugasan teknisi lapangan CoolCare AC.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Perbarui
          </Button>
          <Link href="/dashboard/bookings/new">
            <Button size="sm" className="bg-primary hover:bg-primary/95 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Pemesanan Baru
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={loadData}>Coba Lagi</Button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Agenda Hari Ini</span>
              <Calendar className="w-4 h-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">
              {loading ? '...' : data?.metrics.totalBookingsToday || 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              {data?.metrics.inProgressBookings || 0} sedang dikerjakan
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-medium text-amber-600">
              <span>Menunggu Konfirmasi</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600">
              {loading ? '...' : data?.metrics.pendingBookings || 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">Perlu verifikasi admin</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-medium text-indigo-600">
              <span>SPK Lapangan Aktif</span>
              <FileText className="w-4 h-4 text-indigo-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-indigo-600">
              {loading ? '...' : data?.metrics.activeWorkOrders || 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              {data?.metrics.activeTechnicians || 0} teknisi aktif
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs font-medium text-emerald-600">
              <span>Estimasi Omzet Hari Ini</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl font-bold text-emerald-600 truncate">
              {loading ? '...' : formatRupiah(data?.metrics.estimatedRevenueToday || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">Dari booking hari ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments Table (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  Jadwal Servis Hari Ini
                </CardTitle>
                <CardDescription className="text-xs">
                  Daftar kunjungan teknisi yang dijadwalkan untuk hari ini
                </CardDescription>
              </div>
              <Link href="/dashboard/bookings/calendar">
                <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80">
                  Lihat Kalender <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Memuat jadwal...</div>
              ) : !data?.todayAppointments?.length ? (
                <div className="p-8 text-center text-sm text-muted-foreground space-y-2">
                  <p>Tidak ada janji temu servis yang dijadwalkan hari ini.</p>
                  <Link href="/dashboard/bookings/new">
                    <Button variant="outline" size="sm">Jadwalkan Servis Baru</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.todayAppointments.map((appt) => {
                    const startTime = new Date(appt.scheduledStartAt).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const endTime = new Date(appt.scheduledEndAt).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div key={appt.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900 truncate">
                              {appt.customer?.name}
                            </span>
                            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {appt.bookingCode}
                            </span>
                            {getStatusBadge(appt.status)}
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {appt.service?.name} • {appt.unitCount} Unit • {appt.customerAddress?.district}, {appt.customerAddress?.city}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-slate-600 pt-0.5">
                            <span className="font-medium text-primary">
                              ⏰ {startTime} - {endTime} WIB
                            </span>
                            <span>•</span>
                            <span>
                              Teknisi: <strong className="text-slate-700">{appt.technician?.user?.name || 'Belum ditugaskan'}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Link href={`/dashboard/bookings/${appt.id}`}>
                            <Button variant="outline" size="sm" className="text-xs h-8">
                              Detail
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Work Orders & Quick Actions (1 Col) */}
        <div className="space-y-6">
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-indigo-600" />
                  SPK Terbaru
                </CardTitle>
                <CardDescription className="text-xs">
                  Surat Perintah Kerja lapangan
                </CardDescription>
              </div>
              <Link href="/dashboard/work-orders">
                <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80">
                  Semua <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-center text-xs text-muted-foreground">Memuat data...</div>
              ) : !data?.recentWorkOrders?.length ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Belum ada Surat Perintah Kerja diterbitkan.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.recentWorkOrders.map((wo) => (
                    <Link
                      key={wo.id}
                      href={`/dashboard/work-orders/${wo.id}`}
                      className="p-3 hover:bg-slate-50 transition-colors block"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-medium text-slate-900">{wo.workOrderNumber}</span>
                        {getStatusBadge(wo.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        Pelanggan: {wo.customer?.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Teknisi: {wo.technician?.user?.name || 'Belum ditugaskan'}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links Card */}
          <Card className="border-slate-200/80 shadow-sm bg-slate-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-900">Aksi Cepat Manajemen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <Link href="/dashboard/bookings" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs bg-white">
                  <Calendar className="w-3.5 h-3.5 mr-2 text-primary" />
                  Kelola Seluruh Pemesanan
                </Button>
              </Link>
              <Link href="/dashboard/technicians/schedule" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs bg-white">
                  <Users className="w-3.5 h-3.5 mr-2 text-indigo-600" />
                  Monitor Jadwal & Kapasitas Teknisi
                </Button>
              </Link>
              <Link href="/dashboard/customers" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs bg-white">
                  <Users className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                  Direktori Pelanggan & Unit AC
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
