'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import { fetchConflicts, resolveConflict, fetchConflictDetail } from '@/lib/api/google-calendar';
import { ConflictsListResponse, CalendarSyncConflictItem, ResolveConflictAction } from '@tampilkit-ac/api-contract';

export default function GoogleCalendarConflictsPage() {
  const [data, setData] = useState<ConflictsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('OPEN');
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  const [selectedConflict, setSelectedConflict] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolutionAction, setResolutionAction] = useState<ResolveConflictAction>('RESTORE_LOCAL');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadConflicts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchConflicts({
        page,
        limit,
        status: status || undefined,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat daftar konflik sinkronisasi.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, status]);

  useEffect(() => {
    loadConflicts();
  }, [loadConflicts]);

  const handleOpenModal = async (conflictItem: CalendarSyncConflictItem) => {
    try {
      setError(null);
      const detail = await fetchConflictDetail(conflictItem.id);
      setSelectedConflict(detail);
      setResolutionNotes('');
      setResolutionAction('RESTORE_LOCAL');
      setModalOpen(true);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat detail konflik.');
    }
  };

  const handleResolve = async () => {
    if (!selectedConflict) return;
    try {
      setResolving(true);
      setError(null);
      await resolveConflict(selectedConflict.id, {
        action: resolutionAction,
        resolutionNotes: resolutionNotes.trim() || undefined,
      });
      setSuccessMsg('Konflik sinkronisasi berhasil diselesaikan.');
      setModalOpen(false);
      setSelectedConflict(null);
      await loadConflicts();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyelesaikan konflik.');
    } finally {
      setResolving(false);
    }
  };

  const getConflictTypeBadge = (type: string) => {
    switch (type) {
      case 'REMOTE_EVENT_CHANGED':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Event Google Berubah</Badge>;
      case 'REMOTE_EVENT_DELETED':
        return <Badge className="bg-rose-100 text-rose-800 border-rose-300">Event Google Dihapus</Badge>;
      case 'EXTERNAL_BUSY_OVERLAP':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300">Tumpang Tindih Event Luar</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'OPEN':
        return <Badge className="bg-rose-500 text-white">Terbuka (Perlu Tindakan)</Badge>;
      case 'RESOLVED':
        return <Badge className="bg-emerald-500 text-white">Terselesaikan</Badge>;
      case 'IGNORED':
        return <Badge variant="outline" className="text-slate-600">Diabaikan</Badge>;
      default:
        return <Badge variant="outline">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard/integrations/google-calendar"
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Integrasi Google
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <AlertTriangle className="w-7 h-7 text-amber-600" />
            Manajemen Konflik Sinkronisasi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tinjau perbedaan jadwal antara sistem CoolCare AC dan Google Calendar untuk mencegah ketidaksesuaian data di lapangan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadConflicts}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Perbarui
          </Button>
        </div>
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { label: 'Konflik Terbuka (Open)', value: 'OPEN' },
          { label: 'Terselesaikan (Resolved)', value: 'RESOLVED' },
          { label: 'Diabaikan (Ignored)', value: 'IGNORED' },
          { label: 'Semua Status', value: '' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              status === tab.value
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conflicts Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs">
                <tr>
                  <th className="py-3 px-4">Kode Booking</th>
                  <th className="py-3 px-4">Tipe Konflik</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Waktu Terdeteksi</th>
                  <th className="py-3 px-4">External Event ID</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      Memuat data konflik...
                    </td>
                  </tr>
                ) : !data?.items || data.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                      Tidak ada konflik sinkronisasi pada filter ini.
                    </td>
                  </tr>
                ) : (
                  data.items.map((item: CalendarSyncConflictItem) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {item.booking?.bookingCode || (item.bookingId ? item.bookingId.slice(0, 8) : '-')}
                      </td>
                      <td className="py-3 px-4">
                        {getConflictTypeBadge(item.conflictType)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {new Date(item.detectedAt).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500 truncate max-w-[150px]">
                        {item.externalEventId || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(item)}
                          className="h-8 text-xs flex items-center gap-1.5 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {item.status === 'OPEN' ? 'Bandingkan & Selesaikan' : 'Lihat Detail'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Menampilkan halaman {data.pagination.page} dari {data.pagination.totalPages} ({data.pagination.total} total item)
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page >= data.pagination.totalPages}
                  className="h-8 px-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison & Resolution Modal */}
      {modalOpen && selectedConflict && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-slate-900">
                  Resolusi Konflik: {selectedConflict.booking?.bookingCode || selectedConflict.id.slice(0, 8)}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Snapshot Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                    Data Lokal (CoolCare AC)
                  </span>
                  <div className="text-xs space-y-1 text-slate-700">
                    <p><strong>Mulai:</strong> {selectedConflict.localSnapshot?.scheduledStartAt || '-'}</p>
                    <p><strong>Selesai:</strong> {selectedConflict.localSnapshot?.scheduledEndAt || '-'}</p>
                    <p><strong>Status:</strong> {selectedConflict.localSnapshot?.status || '-'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
                    Data Remote (Google Calendar)
                  </span>
                  <div className="text-xs space-y-1 text-slate-700">
                    <p><strong>Mulai:</strong> {selectedConflict.remoteSnapshot?.start?.dateTime || selectedConflict.remoteSnapshot?.start?.date || '-'}</p>
                    <p><strong>Selesai:</strong> {selectedConflict.remoteSnapshot?.end?.dateTime || selectedConflict.remoteSnapshot?.end?.date || '-'}</p>
                    <p><strong>Status:</strong> {selectedConflict.remoteSnapshot?.status || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Action selection */}
              {selectedConflict.status === 'OPEN' ? (
                <div className="space-y-4">
                  <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider block">
                    Pilih Tindakan Resolusi
                  </label>

                  <div className="grid grid-cols-1 gap-2.5">
                    <label
                      className={`p-3 rounded-xl border cursor-pointer flex items-start gap-3 transition-colors ${
                        resolutionAction === 'RESTORE_LOCAL'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resolutionAction"
                        checked={resolutionAction === 'RESTORE_LOCAL'}
                        onChange={() => setResolutionAction('RESTORE_LOCAL')}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-semibold text-sm text-slate-900">Pulihkan Data Lokal (Restore Local)</p>
                        <p className="text-xs text-slate-500">
                          Jadwal di CoolCare AC adalah acuan utama. Sistem akan memperbarui kembali Google Calendar agar cocok dengan data lokal.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`p-3 rounded-xl border cursor-pointer flex items-start gap-3 transition-colors ${
                        resolutionAction === 'ACCEPT_REMOTE'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resolutionAction"
                        checked={resolutionAction === 'ACCEPT_REMOTE'}
                        onChange={() => setResolutionAction('ACCEPT_REMOTE')}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-semibold text-sm text-slate-900">Terima Perubahan Google (Accept Remote)</p>
                        <p className="text-xs text-slate-500">
                          Selesaikan konflik dan catat perubahan yang dilakukan secara eksternal di Google Calendar.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`p-3 rounded-xl border cursor-pointer flex items-start gap-3 transition-colors ${
                        resolutionAction === 'IGNORE'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resolutionAction"
                        checked={resolutionAction === 'IGNORE'}
                        onChange={() => setResolutionAction('IGNORE')}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-semibold text-sm text-slate-900">Abaikan Konflik (Ignore)</p>
                        <p className="text-xs text-slate-500">
                          Tandai konflik sebagai diabaikan tanpa mengubah data kalender apa pun.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-medium text-slate-700">Catatan Resolusi (Opsional)</label>
                    <Input
                      placeholder="Contoh: Telah konfirmasi dengan teknisi dan pelanggan..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <p className="text-xs text-slate-500">
                    Konflik ini telah diselesaikan pada{' '}
                    <strong>{selectedConflict.resolvedAt ? new Date(selectedConflict.resolvedAt).toLocaleString('id-ID') : '-'}</strong>.
                  </p>
                  {selectedConflict.resolutionNotes && (
                    <p className="text-xs text-slate-700">
                      <strong>Catatan:</strong> {selectedConflict.resolutionNotes}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Tutup
              </Button>
              {selectedConflict.status === 'OPEN' && (
                <Button
                  size="sm"
                  onClick={handleResolve}
                  disabled={resolving}
                  className="bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {resolving ? 'Menyimpan...' : 'Konfirmasi Resolusi'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
