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
  Users,
  UserPlus,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit2,
  Archive,
  Phone,
  Mail,
  Home,
  Cpu,
  Loader2,
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'active' | 'archived' | 'all'>('active');
  const [isLoading, setIsLoading] = useState(true);

  // Archive dialog state
  const [archiveTarget, setArchiveTarget] = useState<{ id: string; name: string } | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const fetchCustomers = useCallback(async (pageToFetch = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageToFetch),
        limit: '10',
        status,
      });
      if (search.trim()) {
        params.append('search', search.trim());
      }

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setCustomers(json.data?.data || []);
        if (json.data?.meta) {
          setMeta(json.data.meta);
        }
      }
    } catch {
      // Handle network error
    } finally {
      setIsLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  async function handleConfirmArchive() {
    if (!archiveTarget) return;
    setIsArchiving(true);
    try {
      const res = await fetch(`/api/admin/customers/${archiveTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setArchiveTarget(null);
        fetchCustomers(meta.page);
      }
    } catch {
      alert('Gagal mengarsipkan data pelanggan.');
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
            <Users className="w-6 h-6 text-primary" />
            Direktori Pelanggan
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Kelola profil pelanggan, nomor kontak WhatsApp, alamat servis, dan unit AC terdaftar.
          </p>
        </div>

        <Button asChild className="bg-primary hover:bg-primary/95 text-white shadow-sm">
          <Link href="/dashboard/customers/new">
            <UserPlus className="w-4 h-4 mr-2" />
            Tambah Pelanggan
          </Link>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <Input
            placeholder="Cari nama, kode (CUS-...), atau nomor HP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-50/50 border-slate-200 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Status:</span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              type="button"
              onClick={() => setStatus('active')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                status === 'active' ? 'bg-white shadow-xs text-primary font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aktif
            </button>
            <button
              type="button"
              onClick={() => setStatus('archived')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                status === 'archived' ? 'bg-white shadow-xs text-primary font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Diarsipkan
            </button>
            <button
              type="button"
              onClick={() => setStatus('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                status === 'all' ? 'bg-white shadow-xs text-primary font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs font-medium">Memuat data pelanggan...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-800">Tidak ada pelanggan ditemukan</p>
            <p className="text-xs text-slate-400">
              {search ? 'Coba ubah kata kunci pencarian Anda.' : 'Mulai daftarkan pelanggan pertama Anda.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 bg-slate-50/70">
                <TableHead className="w-[120px]">Kode</TableHead>
                <TableHead>Nama Pelanggan</TableHead>
                <TableHead>WhatsApp / Telepon</TableHead>
                <TableHead className="hidden lg:table-cell">Email</TableHead>
                <TableHead className="text-center">Alamat</TableHead>
                <TableHead className="text-center">Unit AC</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-slate-600">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                      {c.customerCode}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Link
                      href={`/dashboard/customers/${c.id}`}
                      className="font-semibold text-slate-900 hover:text-accent transition-colors block"
                    >
                      {c.name}
                    </Link>
                  </TableCell>

                  <TableCell className="text-xs text-slate-700">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.displayPhone || c.phone}</span>
                    </div>
                  </TableCell>

                  <TableCell className="hidden lg:table-cell text-xs text-slate-600">
                    {c.email ? (
                      <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs bg-slate-50 gap-1 font-semibold">
                      <Home className="w-3 h-3 text-slate-400" />
                      {c.addressCount || 0}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs bg-slate-50 gap-1 font-semibold">
                      <Cpu className="w-3 h-3 text-slate-400" />
                      {c.acUnitCount || 0}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center">
                    {c.isActive ? (
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
                      <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0" title="Buka Profil">
                        <Link href={`/dashboard/customers/${c.id}`}>
                          <ExternalLink className="w-4 h-4 text-slate-500" />
                        </Link>
                      </Button>

                      <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0" title="Ubah Data">
                        <Link href={`/dashboard/customers/${c.id}/edit`}>
                          <Edit2 className="w-4 h-4 text-slate-500" />
                        </Link>
                      </Button>

                      {c.isActive && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                          title="Arsipkan Pelanggan"
                          onClick={() => setArchiveTarget({ id: c.id, name: c.name })}
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
              Menampilkan {customers.length} dari {meta.total} pelanggan (Halaman {meta.page} dari {meta.totalPages})
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs"
                disabled={meta.page <= 1}
                onClick={() => fetchCustomers(meta.page - 1)}
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs"
                disabled={meta.page >= meta.totalPages}
                onClick={() => fetchCustomers(meta.page + 1)}
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
        title="Arsipkan Pelanggan?"
        description={`Pelanggan "${archiveTarget?.name}" akan dinonaktifkan. Seluruh data kontak, histori riwayat pemesanan, dan unit AC akan tetap terjaga di database secara aman.`}
        onConfirm={handleConfirmArchive}
        isLoading={isArchiving}
      />
    </div>
  );
}
