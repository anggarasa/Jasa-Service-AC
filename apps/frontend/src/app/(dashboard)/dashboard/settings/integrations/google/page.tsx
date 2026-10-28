'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Unlink,
  Check,
  Info,
} from 'lucide-react';
import {
  fetchGoogleCalendarStatus,
  fetchGoogleAuthUrl,
  disconnectGoogleCalendar,
  fetchAvailableCalendars,
  selectGoogleCalendar,
} from '@/lib/api/google-calendar';
import {
  CalendarConnectionStatusResponse,
  GoogleCalendarListItem,
} from '@tampilkit-ac/api-contract';

export default function GoogleIntegrationSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [statusData, setStatusData] = useState<CalendarConnectionStatusResponse | null>(null);
  const [calendars, setCalendars] = useState<GoogleCalendarListItem[]>([]);
  const [selectedCalId, setSelectedCalId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [savingCal, setSavingCal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchGoogleCalendarStatus();
      setStatusData(res);
      setSelectedCalId(res.calendarId || '');

      if (res.status === 'CONNECTED') {
        const calList = await fetchAvailableCalendars();
        setCalendars(calList.items || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat status integrasi Google.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Check query params from OAuth redirect
    if (searchParams.get('connected') === 'true') {
      setSuccessMsg('Akun Google berhasil dihubungkan! Silakan pilih kalender untuk sinkronisasi.');
    } else if (searchParams.get('error')) {
      setError(`Otorisasi Google gagal: ${searchParams.get('error')}`);
    }
  }, [loadData, searchParams]);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);
      const { authorizationUrl } = await fetchGoogleAuthUrl();
      if (authorizationUrl) {
        window.location.href = authorizationUrl;
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memulai otorisasi Google OAuth.');
      setConnecting(false);
    }
  };

  const handleSelectCalendar = async () => {
    if (!selectedCalId) return;
    try {
      setSavingCal(true);
      setError(null);
      await selectGoogleCalendar(selectedCalId);
      setSuccessMsg('Kalender sinkronisasi berhasil disimpan.');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan pilihan kalender.');
    } finally {
      setSavingCal(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Apakah Anda yakin ingin memutuskan integrasi Google Calendar? Sinkronisasi otomatis akan dihentikan.')) {
      return;
    }

    try {
      setDisconnecting(true);
      setError(null);
      await disconnectGoogleCalendar();
      setSuccessMsg('Koneksi Google Calendar berhasil diputuskan.');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Gagal memutuskan koneksi Google Calendar.');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/dashboard/integrations/google-calendar"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Status Integrasi
          </Link>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <Calendar className="w-7 h-7 text-primary" />
          Pengaturan Akun Google Calendar
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Konfigurasikan otentikasi OAuth 2.0 dan pemilihan kalender untuk proyeksi jadwal servis.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Connection Management Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center justify-between">
            <span>Status Autentikasi OAuth 2.0</span>
            {statusData?.status === 'CONNECTED' ? (
              <Badge className="bg-emerald-500 text-white">Terhubung</Badge>
            ) : statusData?.status === 'REAUTH_REQUIRED' ? (
              <Badge className="bg-amber-500 text-white">Perlu Login Ulang</Badge>
            ) : (
              <Badge variant="outline">Belum Terhubung</Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {statusData?.status === 'CONNECTED' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Akun Google Terhubung
                    </p>
                    <p className="font-bold text-slate-900 text-base">
                      {statusData.googleAccountEmail || 'Akun Google Terhubung'}
                    </p>
                  </div>
                  <ShieldCheck className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="text-xs text-slate-500 pt-1 border-t border-slate-200/60 flex items-center gap-4">
                  <span>
                    Masa Berlaku Token: {statusData.expiresAt ? new Date(statusData.expiresAt).toLocaleString('id-ID') : '-'}
                  </span>
                  <span>•</span>
                  <span>Enkripsi Token: AES-256-GCM Aktif</span>
                </div>
              </div>

              {/* Calendar Selector */}
              <div className="space-y-3 pt-2">
                <label className="text-sm font-semibold text-slate-900 block">
                  Pilih Kalender Tujuan Sinkronisasi
                </label>
                <p className="text-xs text-muted-foreground">
                  Semua jadwal pemesanan servis AC akan diproyeksikan ke kalender yang dipilih di bawah ini.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <select
                    value={selectedCalId}
                    onChange={(e) => setSelectedCalId(e.target.value)}
                    className="w-full sm:max-w-md h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="" disabled>-- Pilih Salah Satu Kalender --</option>
                    {calendars.map((cal) => (
                      <option key={cal.id} value={cal.id}>
                        {cal.summary} {cal.primary ? '(Utama)' : ''}
                      </option>
                    ))}
                  </select>

                  <Button
                    size="sm"
                    onClick={handleSelectCalendar}
                    disabled={savingCal || !selectedCalId || selectedCalId === statusData.calendarId}
                    className="bg-primary hover:bg-primary/90 text-white shrink-0 flex items-center gap-1.5 h-10 px-4"
                  >
                    <Check className="w-4 h-4" />
                    {savingCal ? 'Menyimpan...' : 'Simpan Kalender'}
                  </Button>
                </div>

                {statusData.calendarName && (
                  <p className="text-xs text-emerald-700 font-medium flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Kalender aktif saat ini: <strong>{statusData.calendarName}</strong>
                  </p>
                )}
              </div>

              {/* Disconnect Action */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Putuskan Akses Google</h4>
                  <p className="text-xs text-muted-foreground">
                    Menghapus token akses dan menghentikan pengiriman data jadwal ke Google Calendar.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 flex items-center gap-1.5"
                >
                  <Unlink className="w-4 h-4" />
                  {disconnecting ? 'Memutuskan...' : 'Putuskan Koneksi'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 bg-primary/10 rounded-3xl mx-auto flex items-center justify-center text-primary">
                <Calendar className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-slate-900">Hubungkan CoolCare ke Google Calendar</h3>
                <p className="text-sm text-slate-500">
                  Otorisasikan aplikasi CoolCare AC Service untuk menyinkronkan jadwal servis langsung ke Google Calendar bisnis Anda.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="bg-primary hover:bg-primary/90 text-white w-full py-5 rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  {connecting ? 'Mengarahkan ke Google...' : 'Hubungkan Akun Google Sekarang'}
                </Button>
              </div>

              <p className="text-xs text-slate-400">
                Akses aman menggunakan OAuth 2.0 Authorization Code Flow dengan single-use state verification.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security & Architecture Details */}
      <Card className="border-slate-200 bg-slate-50/50">
        <CardContent className="p-5 text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <Info className="w-4 h-4 text-primary" />
            Catatan Keamanan & Privasi
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li>Refresh token Google dienkripsi dengan standar industri AES-256-GCM di level database PostgreSQL.</li>
            <li>Browser Frontend Next.js tidak pernah menerima token mentah Google dan hanya berkomunikasi melalui backend NestJS berotentikasi JWT.</li>
            <li>Sinkronisasi bersifat proyeksi satu kalender multi-teknisi tanpa duplikasi slot.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
