'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  CalendarCheck2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  ListOrdered,
  AlertCircle,
} from 'lucide-react';
import {
  fetchGoogleCalendarStatus,
  triggerManualSync,
  fetchSyncJobs,
  fetchConflicts,
} from '@/lib/api/google-calendar';
import { CalendarConnectionStatusResponse } from '@tampilkit-ac/api-contract';

export default function GoogleCalendarIntegrationPage() {
  const [statusData, setStatusData] = useState<CalendarConnectionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [pendingJobsCount, setPendingJobsCount] = useState<number>(0);
  const [openConflictsCount, setOpenConflictsCount] = useState<number>(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchGoogleCalendarStatus();
      setStatusData(res);

      if (res.status === 'CONNECTED') {
        const [jobsRes, conflictsRes] = await Promise.all([
          fetchSyncJobs({ page: 1, limit: 1, status: 'PENDING' }).catch(() => null),
          fetchConflicts({ page: 1, limit: 1, status: 'OPEN' }).catch(() => null),
        ]);
        if (jobsRes) setPendingJobsCount(jobsRes.pagination.total);
        if (conflictsRes) setOpenConflictsCount(conflictsRes.pagination.total);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat status integrasi Google Calendar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSuccessMsg(null);
      await triggerManualSync();
      setSuccessMsg('Permintaan sinkronisasi manual berhasil dikirim. Antrean outbox sedang diproses.');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Gagal memicu sinkronisasi manual.');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1.5 py-1 px-3">
            <CheckCircle2 className="w-3.5 h-3.5" /> Terhubung Aktif
          </Badge>
        );
      case 'NEEDS_SELECTION':
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 py-1 px-3">
            <AlertCircle className="w-3.5 h-3.5" /> Perlu Pilih Kalender
          </Badge>
        );
      case 'REAUTH_REQUIRED':
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 py-1 px-3">
            <AlertTriangle className="w-3.5 h-3.5" /> Perlu Autentikasi Ulang
          </Badge>
        );
      case 'ERROR':
        return (
          <Badge className="bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-1.5 py-1 px-3">
            <XCircle className="w-3.5 h-3.5" /> Terjadi Kesalahan
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-600 flex items-center gap-1.5 py-1 px-3">
            <Clock className="w-3.5 h-3.5" /> Belum Terhubung
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-primary" />
            Integrasi Google Calendar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sinkronisasi jadwal pemesanan servis AC dua arah secara otomatis antara TampilKit dan Google Calendar.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Perbarui
          </Button>

          {statusData?.status === 'CONNECTED' && (
            <Button
              size="sm"
              onClick={handleSyncNow}
              disabled={syncing}
              className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Menyinkronkan...' : 'Sinkronisasi Sekarang'}
            </Button>
          )}

          <Link href="/dashboard/settings/integrations/google">
            <Button variant="secondary" size="sm" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Pengaturan Akun
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Terjadi Kesalahan</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {statusData?.status === 'NEEDS_SELECTION' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
            <span>Akun Google (<strong>{statusData.googleAccountEmail}</strong>) sudah terhubung, tetapi kalender tujuan belum dipilih.</span>
          </div>
          <Link href="/dashboard/settings/integrations/google" className="shrink-0">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8">
              Pilih Kalender Sekarang
            </Button>
          </Link>
        </div>
      )}

      {/* Main Status Banner */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <CalendarCheck2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-lg text-slate-900">Status Google Calendar</h3>
                {statusData ? getStatusBadge(statusData.status) : null}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {statusData?.googleAccountEmail
                  ? `Terhubung dengan akun Google: ${statusData.googleAccountEmail}`
                  : 'Belum ada akun Google Workspace / Gmail yang terhubung.'}
              </p>
            </div>
          </div>

          <div>
            {statusData?.status !== 'CONNECTED' ? (
              <Link href="/dashboard/settings/integrations/google">
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  Hubungkan Sekarang
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard/settings/integrations/google">
                <Button variant="outline" size="sm">
                  Ganti Kalender / Akun
                </Button>
              </Link>
            )}
          </div>
        </div>

        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Kalender Aktif</span>
            <p className="font-semibold text-slate-900">
              {statusData?.calendarName || '-'}
            </p>
            <p className="text-xs text-slate-500 truncate" title={statusData?.calendarId || ''}>
              ID: {statusData?.calendarId || 'Belum dipilih'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Zona Waktu</span>
            <p className="font-semibold text-slate-900">
              {statusData?.calendarTimezone || 'Asia/Jakarta'}
            </p>
            <p className="text-xs text-slate-500">Waktu Indonesia Barat (WIB)</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sinkronisasi Terakhir</span>
            <p className="font-semibold text-slate-900">
              {statusData?.lastSuccessfulSyncAt
                ? new Date(statusData.lastSuccessfulSyncAt).toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : 'Belum pernah sinkronisasi'}
            </p>
            <p className="text-xs text-slate-500">
              {statusData?.nextSyncToken ? 'Sinkronisasi Bertahap Aktif' : 'Memerlukan Sinkronisasi Penuh'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sub-modules & Monitoring Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200 hover:border-slate-300 transition-all shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-primary" />
              Antrean Pekerjaan Sinkronisasi (Outbox)
            </CardTitle>
            {pendingJobsCount > 0 ? (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                {pendingJobsCount} Pending
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Bersih
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Pantau status antrean sinkronisasi asinkron (Transactional Outbox). Semua mutasi pemesanan (buat, ubah jadwal, ganti teknisi, batal) diproses secara andal dengan retry otomatis.
            </p>
            <div className="pt-2">
              <Link href="/dashboard/integrations/google-calendar/jobs">
                <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-2">
                  Buka Antrean Outbox Jobs
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:border-slate-300 transition-all shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Manajemen Konflik Sinkronisasi
            </CardTitle>
            {openConflictsCount > 0 ? (
              <Badge className="bg-rose-100 text-rose-800 border-rose-200">
                {openConflictsCount} Terbuka
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                0 Konflik
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Kelola perbedaan data jika ada perubahan eksternal di Google Calendar yang bertentangan dengan jadwal resmi di CoolCare AC (misal: event digeser manual atau dihapus di Google).
            </p>
            <div className="pt-2">
              <Link href="/dashboard/integrations/google-calendar/conflicts">
                <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-2">
                  Tinjau Resolusi Konflik
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Architecture Explanatory Notice */}
      <Card className="border-slate-200 bg-slate-50/50">
        <CardContent className="p-5 text-sm text-slate-600 space-y-2">
          <h4 className="font-semibold text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Prinsip Desain Kalender Bersama (Multi-Teknisi Basic v1)
          </h4>
          <p>
            Semua penugasan teknisi diproyeksikan ke dalam 1 Google Calendar terpusat. Keberadaan jadwal pemesanan tidak memblokir ketersediaan teknisi lain untuk jam yang sama. Jadwal kesibukan eksternal non-pemesanan (seperti libur toko) tetap dihormati dan memblokir reservasi baru.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
