'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ListOrdered,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { fetchSyncJobs, retrySyncJob } from '@/lib/api/google-calendar';
import { SyncJobsListResponse, CalendarSyncJobItem } from '@tampilkit-ac/api-contract';

export default function GoogleCalendarJobsPage() {
  const [data, setData] = useState<SyncJobsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = 10;

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchSyncJobs({
        page,
        limit,
        status: status || undefined,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat daftar pekerjaan sinkronisasi outbox.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, status]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleRetry = async (jobId: string) => {
    try {
      setRetryingId(jobId);
      setError(null);
      setSuccessMsg(null);
      await retrySyncJob(jobId);
      setSuccessMsg(`Pekerjaan ${jobId.slice(0, 8)} telah diatur ulang untuk dicoba kembali.`);
      await loadJobs();
    } catch (err: any) {
      setError(err?.message || 'Gagal mengatur ulang pekerjaan sinkronisasi.');
    } finally {
      setRetryingId(null);
    }
  };

  const getStatusBadge = (jobStatus: string) => {
    switch (jobStatus) {
      case 'COMPLETED':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Selesai</Badge>;
      case 'PENDING':
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Menunggu</Badge>;
      case 'PROCESSING':
        return <Badge className="bg-sky-500 hover:bg-sky-600 text-white">Diproses</Badge>;
      case 'FAILED_RETRY':
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white">Coba Ulang</Badge>;
      case 'FAILED_PERMANENT':
        return <Badge className="bg-rose-500 hover:bg-rose-600 text-white">Gagal Permanen</Badge>;
      default:
        return <Badge variant="outline">{jobStatus}</Badge>;
    }
  };

  const getOperationBadge = (op: string) => {
    switch (op) {
      case 'CREATE_EVENT':
        return <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">Buat Event</Badge>;
      case 'UPDATE_EVENT':
        return <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200">Ubah Event</Badge>;
      case 'DELETE_EVENT':
        return <Badge variant="outline" className="text-rose-700 bg-rose-50 border-rose-200">Hapus Event</Badge>;
      default:
        return <Badge variant="outline">{op}</Badge>;
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
            <ListOrdered className="w-7 h-7 text-primary" />
            Antrean Pekerjaan Sinkronisasi (Outbox Jobs)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Daftar pekerjaan sinkronisasi asinkron berbasis Transactional Outbox dengan lease locks dan retry bertahap.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadJobs}
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
          { label: 'Semua Status', value: '' },
          { label: 'Pending', value: 'PENDING' },
          { label: 'Diproses', value: 'PROCESSING' },
          { label: 'Selesai', value: 'COMPLETED' },
          { label: 'Coba Ulang', value: 'FAILED_RETRY' },
          { label: 'Gagal Permanen', value: 'FAILED_PERMANENT' },
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

      {/* Jobs Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs">
                <tr>
                  <th className="py-3 px-4">ID Job</th>
                  <th className="py-3 px-4">Operasi</th>
                  <th className="py-3 px-4">Agregat</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Percobaan</th>
                  <th className="py-3 px-4">Waktu Eksekusi</th>
                  <th className="py-3 px-4">Pesan Terakhir</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      Memuat data pekerjaan outbox...
                    </td>
                  </tr>
                ) : !data?.items || data.items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500">
                      <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      Tidak ada antrean pekerjaan sinkronisasi ditemukan.
                    </td>
                  </tr>
                ) : (
                  data.items.map((job: CalendarSyncJobItem) => (
                    <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">
                        {job.id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-4">
                        {getOperationBadge(job.operation)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-medium text-slate-800">{job.aggregateType}</div>
                        <div className="text-[11px] font-mono text-slate-500 truncate max-w-[120px]">
                          {job.aggregateId}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(job.status)}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-700">
                        {job.attemptCount} / {job.maxAttempts}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {job.nextAttemptAt ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(job.nextAttemptAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 max-w-[200px] truncate" title={job.lastErrorMessage || ''}>
                        {job.lastErrorMessage || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(job.status === 'FAILED_RETRY' || job.status === 'FAILED_PERMANENT') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetry(job.id)}
                            disabled={retryingId === job.id}
                            className="h-8 text-xs flex items-center gap-1.5"
                          >
                            <RotateCw className={`w-3.5 h-3.5 ${retryingId === job.id ? 'animate-spin' : ''}`} />
                            Coba Lagi
                          </Button>
                        )}
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
    </div>
  );
}
