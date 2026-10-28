'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionItem } from '@tampilkit-ac/api-contract';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Laptop,
  Smartphone,
  ShieldCheck,
  Trash2,
  LogOut,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export function SessionTable() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getSessions();
      setSessions(data.sessions || []);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Gagal memuat daftar sesi aktif.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    try {
      await apiClient.revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Gagal mencabut sesi perangkat.';
      setError(msg);
    } finally {
      setRevokingId(null);
    }
  };

  const handleLogoutAll = async () => {
    if (
      !confirm(
        'Apakah Anda yakin ingin keluar dari seluruh perangkat? Anda harus login kembali.',
      )
    ) {
      return;
    }

    try {
      await apiClient.logoutAll();
      router.push('/login');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Gagal melakukan logout semua perangkat.';
      setError(msg);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Daftar Perangkat Terhubung
          </h3>
          <p className="text-xs text-muted-foreground">
            Kelola sesi aktif dan pantau riwayat akses akun Anda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSessions}
            disabled={loading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Perbarui
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogoutAll}
            className="gap-1.5 text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout Semua Sesi
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Perhatian</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm">Memuat sesi aktif...</span>
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground border rounded-xl bg-slate-50">
          Tidak ada sesi perangkat yang tercatat.
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
          <div className="divide-y divide-slate-100">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mt-0.5">
                    {s.userAgent?.includes('Mobile') ? (
                      <Smartphone className="w-5 h-5 text-accent" />
                    ) : (
                      <Laptop className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {s.userAgent?.includes('Windows')
                          ? 'Perangkat Windows'
                          : s.userAgent?.includes('Mac')
                          ? 'Perangkat MacOS'
                          : s.userAgent?.includes('Linux')
                          ? 'Perangkat Linux'
                          : s.userAgent?.includes('Android')
                          ? 'Perangkat Android'
                          : s.userAgent?.includes('iPhone')
                          ? 'Perangkat iPhone'
                          : 'Perangkat Web'}
                      </span>
                      {s.isCurrent ? (
                        <Badge variant="default" className="text-[10px] bg-green-600 hover:bg-green-600 gap-1">
                          <ShieldCheck className="w-3 h-3" /> Sesi Ini
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Aktif
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      IP: {s.ipAddress || '127.0.0.1'} • Dibuat:{' '}
                      {new Date(s.createdAt).toLocaleString('id-ID')}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Aktivitas terakhir: {new Date(s.lastUsedAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <div>
                  {!s.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 text-xs gap-1"
                      onClick={() => handleRevoke(s.id)}
                      disabled={revokingId === s.id}
                    >
                      {revokingId === s.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      Cabut Akses
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
