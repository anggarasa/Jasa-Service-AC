'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArchiveConfirmDialog } from '@/components/admin/archive-confirm-dialog';
import {
  Cpu,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Archive,
  MapPin,
  User,
  Loader2,
  Camera,
} from 'lucide-react';

export default function AcUnitsPage() {
  const [units, setUnits] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState<'active' | 'archived' | 'all'>('active');
  const [isLoading, setIsLoading] = useState(true);

  // Archive dialog state
  const [archiveTarget, setArchiveTarget] = useState<{ id: string; label: string; code: string } | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const fetchUnits = useCallback(async (pageToFetch = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageToFetch),
        limit: '10',
        status,
      });
      if (search.trim()) params.append('search', search.trim());
      if (brand.trim()) params.append('brand', brand.trim());
      if (type.trim()) params.append('type', type.trim());

      const res = await fetch(`/api/admin/ac-units?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setUnits(json.data?.data || []);
        if (json.data?.meta) {
          setMeta(json.data.meta);
        }
      }
    } catch {
      // Handle network error
    } finally {
      setIsLoading(false);
    }
  }, [search, brand, type, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUnits(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUnits]);

  async function handleConfirmArchive() {
    if (!archiveTarget) return;
    setIsArchiving(true);
    try {
      const res = await fetch(`/api/admin/ac-units/${archiveTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setArchiveTarget(null);
        fetchUnits(meta.page);
      }
    } catch {
      alert('Gagal mengarsipkan unit AC.');
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-primary" />
            Direktori Unit AC
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Daftar seluruh mesin pendingin ruangan pelanggan, riwayat pemeliharaan, dan dokumentasi foto.
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <Input
              placeholder="Cari kode (AC-...), label, merk, atau nama pelanggan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50/50 border-slate-200 text-sm"
            />
          </div>

          <div>
            <Input
              placeholder="Filter merk (Daikin, LG...)"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="bg-slate-50/50 border-slate-200 text-sm"
            />
          </div>

          <div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-md border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800"
            >
              <option value="">Semua Tipe AC</option>
              <option value="SPLIT">Split Wall</option>
              <option value="CASSETTE">Cassette</option>
              <option value="FLOOR_STANDING">Floor Standing</option>
              <option value="CENTRAL">Central AC</option>
              <option value="WINDOW">Window</option>
              <option value="PORTABLE">Portable</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Status:</span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  status === 'active' ? 'bg-white shadow-xs text-primary font-bold' : 'text-slate-600'
                }`}
              >
                Aktif
              </button>
              <button
                type="button"
                onClick={() => setStatus('archived')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  status === 'archived' ? 'bg-white shadow-xs text-primary font-bold' : 'text-slate-600'
                }`}
              >
                Diarsipkan
              </button>
              <button
                type="button"
                onClick={() => setStatus('all')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  status === 'all' ? 'bg-white shadow-xs text-primary font-bold' : 'text-slate-600'
                }`}
              >
                Semua
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AC Units Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs font-medium">Memuat data unit AC...</span>
          </div>
        ) : units.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <Cpu className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-800">Tidak ada unit AC ditemukan</p>
            <p className="text-xs text-slate-400">
              {search || brand || type ? 'Coba sesuaikan filter pencarian Anda.' : 'Unit AC akan muncul setelah didaftarkan pada profil pelanggan.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 bg-slate-50/70">
                <TableHead className="w-[120px]">Kode</TableHead>
                <TableHead>Label Unit</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Merk / Seri</TableHead>
                <TableHead className="text-center">Kapasitas</TableHead>
                <TableHead>Alamat Pemasangan</TableHead>
                <TableHead className="text-center">Foto</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((u) => (
                <TableRow key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-slate-600">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                      {u.unitCode}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Link
                      href={`/dashboard/ac-units/${u.id}`}
                      className="font-semibold text-slate-900 hover:text-accent transition-colors block"
                    >
                      {u.unitLabel}
                    </Link>
                    {u.installationRoom && (
                      <span className="text-[11px] text-slate-500 block">
                        Ruang: {u.installationRoom}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-xs">
                    {u.customerId ? (
                      <Link
                        href={`/dashboard/customers/${u.customerId}`}
                        className="font-medium text-slate-800 hover:text-primary flex items-center gap-1.5"
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.customerName || 'Pelanggan'}</span>
                      </Link>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-xs text-slate-700">
                    <span className="font-semibold">{u.brand}</span>
                    {u.model && <span className="text-slate-400 block text-[11px]">{u.model}</span>}
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-bold text-primary bg-primary/5 text-xs">
                      {u.capacityPk} PK
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs text-slate-600 max-w-[200px] truncate">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{u.customerAddressLabel || u.customerFullAddress || '—'}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs bg-slate-50 gap-1 font-semibold">
                      <Camera className="w-3 h-3 text-slate-400" />
                      {u.photos?.length || 0}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center">
                    {u.isActive ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-700">
                        Diarsipkan
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0" title="Buka Detail">
                        <Link href={`/dashboard/ac-units/${u.id}`}>
                          <ExternalLink className="w-4 h-4 text-slate-500" />
                        </Link>
                      </Button>

                      {u.isActive && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                          title="Arsipkan Unit AC"
                          onClick={() => setArchiveTarget({ id: u.id, label: u.unitLabel, code: u.unitCode })}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination Bar */}
        {!isLoading && meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-600">
            <span>
              Menampilkan {units.length} dari {meta.total} unit AC (Halaman {meta.page} dari {meta.totalPages})
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs"
                disabled={meta.page <= 1}
                onClick={() => fetchUnits(meta.page - 1)}
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs"
                disabled={meta.page >= meta.totalPages}
                onClick={() => fetchUnits(meta.page + 1)}
              >
                Berikutnya
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Archive Confirmation Dialog */}
      <ArchiveConfirmDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        title={`Arsipkan Unit AC "${archiveTarget?.label}"?`}
        description={`Unit ${archiveTarget?.code} akan dinonaktifkan. Data histori servis dan foto dokumentasi tetap aman di database.`}
        onConfirm={handleConfirmArchive}
        isLoading={isArchiving}
      />
    </div>
  );
}
