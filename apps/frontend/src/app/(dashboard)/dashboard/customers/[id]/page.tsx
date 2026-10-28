'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CustomerAddressForm } from '@/components/admin/customer-address-form';
import { AcUnitForm } from '@/components/admin/ac-unit-form';
import { MoveAcUnitDialog } from '@/components/admin/move-ac-unit-dialog';
import { ArchiveConfirmDialog } from '@/components/admin/archive-confirm-dialog';
import {
  Users,
  ChevronLeft,
  Phone,
  Mail,
  Home,
  MapPin,
  Cpu,
  History,
  Plus,
  Edit2,
  Archive,
  Star,
  ArrowRightLeft,
  ExternalLink,
  MessageCircle,
  FileText,
  Calendar,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;

  const [customer, setCustomer] = useState<any>(null);
  const [acUnits, setAcUnits] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'addresses' | 'units' | 'history'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Address Dialog state
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  // AC Unit Dialog state
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);

  // Move AC Unit state
  const [movingUnit, setMovingUnit] = useState<any>(null);

  // Archive Confirm state
  const [archiveTarget, setArchiveTarget] = useState<{
    type: 'customer' | 'address' | 'unit';
    id: string;
    title: string;
  } | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [cRes, uRes, hRes] = await Promise.all([
        fetch(`/api/admin/customers/${customerId}`),
        fetch(`/api/admin/customers/${customerId}/ac-units`),
        fetch(`/api/admin/customers/${customerId}/history`),
      ]);

      if (cRes.ok) {
        const cJson = await cRes.json();
        setCustomer(cJson.data);
      }
      if (uRes.ok) {
        const uJson = await uRes.json();
        setAcUnits(uJson.data || []);
      }
      if (hRes.ok) {
        const hJson = await hRes.json();
        setHistoryData(hJson.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSetPrimaryAddress(addressId: string) {
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/addresses/${addressId}/set-primary`, {
        method: 'POST',
      });
      if (res.ok) {
        loadData();
      }
    } catch {
      alert('Gagal menetapkan alamat utama.');
    }
  }

  async function handleConfirmArchive() {
    if (!archiveTarget) return;
    setIsArchiving(true);
    try {
      let url = '';
      if (archiveTarget.type === 'customer') {
        url = `/api/admin/customers/${customerId}`;
      } else if (archiveTarget.type === 'address') {
        url = `/api/admin/customers/${customerId}/addresses/${archiveTarget.id}`;
      } else if (archiveTarget.type === 'unit') {
        url = `/api/admin/ac-units/${archiveTarget.id}`;
      }

      const res = await fetch(url, { method: 'DELETE' });
      if (res.ok) {
        setArchiveTarget(null);
        loadData();
      }
    } catch {
      alert('Gagal mengarsipkan entitas.');
    } finally {
      setIsArchiving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-medium">Memuat profil pelanggan...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="py-20 text-center text-slate-600">
        <p className="font-semibold">Pelanggan tidak ditemukan.</p>
        <Link href="/dashboard/customers" className="text-xs text-primary underline mt-2 block">
          Kembali ke Direktori Pelanggan
        </Link>
      </div>
    );
  }

  const cleanWhatsapp = (customer.normalizedPhone || customer.phone).replace(/\D/g, '');

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          Kembali ke Direktori Pelanggan
        </Link>
      </div>

      {/* Customer Header Banner */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users className="w-7 h-7" />
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
              <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {customer.customerCode}
              </span>
              {customer.isActive ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Aktif
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                  Diarsipkan
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 mt-2">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {customer.displayPhone || customer.phone}
              </span>

              {customer.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {customer.email}
                </span>
              )}

              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Terdaftar: {new Date(customer.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`https://wa.me/${cleanWhatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <MessageCircle className="w-4 h-4" />
            Chat WhatsApp
          </a>

          <Button asChild variant="outline" size="sm" className="h-9 text-xs">
            <Link href={`/dashboard/customers/${customer.id}/edit`}>
              <Edit2 className="w-3.5 h-3.5 mr-1.5" />
              Ubah Profil
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold text-slate-500">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Ringkasan Profil
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('addresses')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'addresses'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Home className="w-4 h-4" />
          Alamat Servis ({customer.addresses?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('units')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'units'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Unit AC Terdaftar ({acUnits.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          Riwayat Layanan ({historyData?.totalBookings || 0})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-200 bg-white md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">Catatan Internal & Instruksi Staf</CardTitle>
              <CardDescription className="text-xs">
                Informasi penting yang hanya dapat dibaca oleh staf operasional dan teknisi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customer.notes ? (
                <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200/80 whitespace-pre-wrap leading-relaxed">
                  {customer.notes}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic">Belum ada catatan khusus untuk pelanggan ini.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">Statistik Operasional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <span className="text-slate-600 font-medium">Alamat Tersimpan:</span>
                <span className="font-bold text-slate-900">{customer.addresses?.length || 0} Lokasi</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <span className="text-slate-600 font-medium">Inventaris Unit AC:</span>
                <span className="font-bold text-slate-900">{acUnits.length} Unit</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <span className="text-slate-600 font-medium">Layanan Terakhir:</span>
                <span className="font-bold text-slate-900">
                  {historyData?.lastServiceDate
                    ? new Date(historyData.lastServiceDate).toLocaleDateString('id-ID')
                    : 'Belum ada'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: ADDRESSES */}
      {activeTab === 'addresses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daftar Alamat Lokasi Servis</h3>
              <p className="text-xs text-slate-500">
                Alamat utama akan digunakan sebagai default saat membuat pesanan servis baru.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setEditingAddress(null);
                setAddressModalOpen(true);
              }}
              className="bg-primary hover:bg-primary/95 text-white text-xs h-8"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Tambah Alamat Baru
            </Button>
          </div>

          {(!customer.addresses || customer.addresses.length === 0) ? (
            <div className="py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
              <Home className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-slate-700">Belum ada alamat servis terdaftar.</p>
              <p className="text-xs text-slate-400 mt-0.5">Tambahkan alamat rumah, ruko, atau kantor pelanggan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customer.addresses.map((addr: any) => (
                <Card
                  key={addr.id}
                  className={`border bg-white shadow-xs transition-shadow relative overflow-hidden ${
                    addr.isPrimary ? 'border-primary ring-1 ring-primary/20' : 'border-slate-200'
                  }`}
                >
                  {addr.isPrimary && (
                    <div className="bg-primary text-white text-[10px] font-bold px-3 py-0.5 uppercase tracking-wider inline-flex items-center gap-1 rounded-br-lg">
                      <Star className="w-3 h-3 fill-white" />
                      Alamat Utama
                    </div>
                  )}

                  <CardHeader className="pb-2 pt-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-accent" />
                        {addr.label}
                      </CardTitle>

                      {addr.serviceAreaName && (
                        <Badge variant="outline" className="text-[11px] bg-emerald-50 text-emerald-800 border-emerald-200 gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {addr.serviceAreaName}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 text-xs text-slate-600">
                    <p className="font-medium text-slate-800 leading-relaxed">
                      {addr.fullAddress}
                    </p>

                    <div className="text-slate-500 space-y-0.5">
                      <p>Kec. {addr.district}, {addr.city}, {addr.province} {addr.postalCode && `(${addr.postalCode})`}</p>
                      {addr.landmark && <p className="italic text-slate-400">Patokan: {addr.landmark}</p>}
                    </div>

                    {(addr.recipientName || addr.recipientPhone) && (
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-3 text-slate-700">
                        {addr.recipientName && <span className="font-semibold">{addr.recipientName}</span>}
                        {addr.recipientPhone && <span>• {addr.recipientPhone}</span>}
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[11px] font-semibold text-slate-500">
                        {addr.acUnitCount || 0} Unit AC Terpasang
                      </div>

                      <div className="flex items-center gap-1">
                        {!addr.isPrimary && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7 text-primary hover:bg-primary/5"
                            onClick={() => handleSetPrimaryAddress(addr.id)}
                          >
                            Set Utama
                          </Button>
                        )}

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 text-slate-600"
                          onClick={() => {
                            setEditingAddress(addr);
                            setAddressModalOpen(true);
                          }}
                        >
                          Ubah
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 text-slate-400 hover:text-red-600"
                          onClick={() =>
                            setArchiveTarget({
                              type: 'address',
                              id: addr.id,
                              title: `Arsipkan Alamat "${addr.label}"?`,
                            })
                          }
                        >
                          Arsipkan
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AC UNITS */}
      {activeTab === 'units' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daftar Unit AC Milik Pelanggan</h3>
              <p className="text-xs text-slate-500">
                Pencatatan unit AC terpasang untuk histori perawatan berkala dan pemindahan lokasi.
              </p>
            </div>

            <Button
              size="sm"
              disabled={!customer.addresses || customer.addresses.length === 0}
              onClick={() => {
                setEditingUnit(null);
                setUnitModalOpen(true);
              }}
              className="bg-primary hover:bg-primary/95 text-white text-xs h-8"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Tambah Unit AC
            </Button>
          </div>

          {acUnits.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
              <Cpu className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-slate-700">Belum ada unit AC terdaftar.</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {(!customer.addresses || customer.addresses.length === 0)
                  ? 'Tambahkan alamat servis terlebih dahulu sebelum mendaftarkan unit AC.'
                  : 'Daftarkan unit AC pertama milik pelanggan ini.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {acUnits.map((u) => (
                <Card key={u.id} className="border-slate-200 bg-white shadow-xs hover:shadow transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                        {u.unitCode}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs font-bold text-primary bg-primary/5">
                          {u.capacityPk} PK
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-slate-50">
                          {u.brand}
                        </Badge>
                      </div>
                    </div>

                    <CardTitle className="text-base font-bold text-slate-900 pt-2">
                      <Link href={`/dashboard/ac-units/${u.id}`} className="hover:text-accent transition-colors">
                        {u.unitLabel}
                      </Link>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Tipe: {u.type} {u.model && `• Model: ${u.model}`}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 text-xs text-slate-600">
                    <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-100 space-y-1">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-accent" />
                        <span>{u.customerAddressLabel || 'Alamat Terdaftar'}</span>
                      </div>
                      <p className="text-slate-500 truncate">{u.customerFullAddress}</p>
                      {u.installationRoom && (
                        <p className="text-slate-700 font-medium">Ruangan: {u.installationRoom}</p>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-[11px] text-slate-400">
                        {u.photos?.length || 0} Foto Dokumentasi
                      </span>

                      <div className="flex items-center gap-1">
                        <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-slate-600">
                          <Link href={`/dashboard/ac-units/${u.id}`}>
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            Detail
                          </Link>
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-primary"
                          onClick={() => setMovingUnit(u)}
                          title="Pindah Alamat"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                          Pindah
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-slate-400 hover:text-red-600"
                          onClick={() =>
                            setArchiveTarget({
                              type: 'unit',
                              id: u.id,
                              title: `Arsipkan Unit AC "${u.unitLabel}" (${u.unitCode})?`,
                            })
                          }
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SERVICE HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Riwayat Layanan Servis Lapangan</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar pemesanan servis nyata yang telah terkonfirmasi atau diselesaikan oleh teknisi.
            </p>
          </div>

          {(!historyData?.bookings || historyData.bookings.length === 0) ? (
            <div className="py-16 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-200 space-y-2">
              <History className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-800">Belum ada riwayat layanan.</p>
              <p className="text-xs text-slate-400">
                Pemesanan servis baru akan tercatat di sini setelah siklus Booking Engine (Phase 07) dijalankan.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyData.bookings.map((b: any) => (
                <div key={b.id} className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-700">{b.bookingCode}</span>
                    <h4 className="font-bold text-sm text-slate-900">{b.serviceName}</h4>
                    <p className="text-xs text-slate-500">
                      Jadwal: {new Date(b.scheduledStartAt).toLocaleDateString('id-ID')} • Teknisi: {b.technicianName || 'Belum ditugaskan'}
                    </p>
                  </div>

                  <div className="text-right">
                    <Badge variant="outline">{b.status}</Badge>
                    <p className="text-xs font-semibold text-slate-900 mt-1">Rp{Number(b.estimatedPrice).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals & Dialogs */}
      <CustomerAddressForm
        customerId={customerId}
        open={addressModalOpen}
        onOpenChange={setAddressModalOpen}
        onSuccess={loadData}
        initialData={editingAddress}
      />

      <AcUnitForm
        customerId={customerId}
        addresses={customer.addresses || []}
        open={unitModalOpen}
        onOpenChange={setUnitModalOpen}
        onSuccess={loadData}
        initialData={editingUnit}
      />

      {movingUnit && (
        <MoveAcUnitDialog
          unit={movingUnit}
          customerAddresses={customer.addresses || []}
          open={Boolean(movingUnit)}
          onOpenChange={(open) => !open && setMovingUnit(null)}
          onSuccess={loadData}
        />
      )}

      <ArchiveConfirmDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        title={archiveTarget?.title || 'Arsipkan Entitas?'}
        description="Data akan dinonaktifkan secara aman tanpa menghapus riwayat operasional yang sudah ada di database."
        onConfirm={handleConfirmArchive}
        isLoading={isArchiving}
      />
    </div>
  );
}
