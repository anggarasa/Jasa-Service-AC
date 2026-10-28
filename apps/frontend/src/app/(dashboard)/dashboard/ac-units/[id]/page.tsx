'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AcUnitPhotoGallery } from '@/components/admin/ac-unit-photo-gallery';
import { MoveAcUnitDialog } from '@/components/admin/move-ac-unit-dialog';
import { ArchiveConfirmDialog } from '@/components/admin/archive-confirm-dialog';
import { AcUnitForm } from '@/components/admin/ac-unit-form';
import {
  Cpu,
  ChevronLeft,
  User,
  MapPin,
  Calendar,
  History,
  ArrowRightLeft,
  Edit2,
  Archive,
  Loader2,
  Layers,
  Barcode,
  Camera,
} from 'lucide-react';

export default function AcUnitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const unitId = resolvedParams.id;

  const [unit, setUnit] = useState<any>(null);
  const [customerAddresses, setCustomerAddresses] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [uRes, hRes] = await Promise.all([
        fetch(`/api/admin/ac-units/${unitId}`),
        fetch(`/api/admin/ac-units/${unitId}/history`),
      ]);

      if (uRes.ok) {
        const uJson = await uRes.json();
        setUnit(uJson.data);

        // Fetch customer addresses for move dialog
        if (uJson.data?.customerId) {
          const aRes = await fetch(`/api/admin/customers/${uJson.data.customerId}/addresses`);
          if (aRes.ok) {
            const aJson = await aRes.json();
            setCustomerAddresses(aJson.data || []);
          }
        }
      }

      if (hRes.ok) {
        const hJson = await hRes.json();
        setHistoryData(hJson.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleConfirmArchive() {
    setIsArchiving(true);
    try {
      const res = await fetch(`/api/admin/ac-units/${unitId}`, { method: 'DELETE' });
      if (res.ok) {
        setArchiveConfirmOpen(false);
        loadData();
      }
    } catch {
      alert('Gagal mengarsipkan unit AC.');
    } finally {
      setIsArchiving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-medium">Memuat data unit AC...</span>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="py-20 text-center text-slate-600">
        <p className="font-semibold">Unit AC tidak ditemukan.</p>
        <Link href="/dashboard/ac-units" className="text-xs text-primary underline mt-2 block">
          Kembali ke Direktori Unit AC
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/ac-units"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          Kembali ke Direktori Unit AC
        </Link>
      </div>

      {/* Header Banner */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Cpu className="w-7 h-7" />
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{unit.unitLabel}</h1>
              <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {unit.unitCode}
              </span>
              <Badge variant="outline" className="font-bold text-primary bg-primary/5 text-xs">
                {unit.capacityPk} PK
              </Badge>
              {unit.isActive ? (
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
                <span className="font-bold text-slate-800">{unit.brand}</span>
                {unit.model && <span>({unit.model})</span>}
              </span>

              {unit.customerId && (
                <Link
                  href={`/dashboard/customers/${unit.customerId}`}
                  className="flex items-center gap-1.5 hover:text-primary font-medium transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Pemilik: <span className="underline">{unit.customerName}</span>
                </Link>
              )}

              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Terdaftar: {new Date(unit.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMoveModalOpen(true)}
            className="text-xs h-9 text-primary border-primary/30 hover:bg-primary/5"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" />
            Pindah Lokasi
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditModalOpen(true)}
            className="text-xs h-9 text-slate-700"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Ubah
          </Button>

          {unit.isActive && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setArchiveConfirmOpen(true)}
              className="text-xs h-9 text-slate-400 hover:text-red-600"
            >
              <Archive className="w-3.5 h-3.5 mr-1.5" />
              Arsipkan
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Specifications & Location */}
        <div className="space-y-6">
          {/* Location Card */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent" />
                Lokasi Pemasangan Unit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="font-bold text-slate-800">
                  {unit.customerAddressLabel || 'Alamat Terdaftar'}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {unit.customerFullAddress || '—'}
                </p>
                {unit.installationRoom && (
                  <div className="pt-2 border-t border-slate-200 text-slate-800 font-semibold">
                    Ruangan: {unit.installationRoom}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Technical Specs Card */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Spesifikasi Teknis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Merk / Brand:</span>
                <span className="font-bold text-slate-800">{unit.brand}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Kapasitas Pendingin:</span>
                <span className="font-bold text-slate-800">{unit.capacityPk} PK</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Tipe Konstruksi:</span>
                <span className="font-semibold text-slate-800">{unit.type}</span>
              </div>

              {unit.model && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Model Seri:</span>
                  <span className="font-mono text-slate-800">{unit.model}</span>
                </div>
              )}

              {unit.serialNumber && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Barcode className="w-3.5 h-3.5 text-slate-400" />
                    Nomor Seri (SN):
                  </span>
                  <span className="font-mono text-slate-800">{unit.serialNumber}</span>
                </div>
              )}

              {unit.notes && (
                <div className="pt-2">
                  <span className="text-slate-500 font-medium block mb-1">Catatan Teknis Unit:</span>
                  <p className="p-2.5 rounded-lg bg-slate-50 text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {unit.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: MinIO Photos & History */}
        <div className="md:col-span-2 space-y-6">
          {/* Photo Documentation Section */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-accent" />
                Dokumentasi Foto Unit (Penyimpanan MinIO)
              </CardTitle>
              <CardDescription className="text-xs">
                Dokumentasi kondisi fisik unit indoor/outdoor dan label spesifikasi pabrik yang disimpan di bucket privat.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AcUnitPhotoGallery unitId={unitId} initialPhotos={unit.photos || []} />
            </CardContent>
          </Card>

          {/* Service History Section */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                Riwayat Servis Unit AC
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!historyData?.services || historyData.services.length === 0) ? (
                <div className="py-10 text-center text-slate-500 space-y-1">
                  <History className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                  <p className="font-semibold text-slate-700 text-sm">Belum ada riwayat layanan.</p>
                  <p className="text-xs text-slate-400">
                    Histori pengerjaan servis akan tercatat otomatis saat Work Order diselesaikan oleh teknisi.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyData.services.map((s: any) => (
                    <div key={s.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-slate-600">{s.bookingCode}</span>
                        <h5 className="font-bold text-slate-900">{s.serviceName}</h5>
                        <p className="text-slate-500">
                          Tanggal: {new Date(s.scheduledDate).toLocaleDateString('id-ID')} • Teknisi: {s.technicianName || '—'}
                        </p>
                      </div>

                      <div className="text-right">
                        <Badge variant="outline">{s.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals & Dialogs */}
      {moveModalOpen && (
        <MoveAcUnitDialog
          unit={{
            id: unit.id,
            unitCode: unit.unitCode,
            unitLabel: unit.unitLabel,
            customerAddressId: unit.customerAddressId,
            customerAddressLabel: unit.customerAddressLabel,
          }}
          customerAddresses={customerAddresses}
          open={moveModalOpen}
          onOpenChange={setMoveModalOpen}
          onSuccess={loadData}
        />
      )}

      {editModalOpen && (
        <AcUnitForm
          customerId={unit.customerId}
          addresses={customerAddresses}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSuccess={loadData}
          initialData={unit}
        />
      )}

      <ArchiveConfirmDialog
        open={archiveConfirmOpen}
        onOpenChange={setArchiveConfirmOpen}
        title={`Arsipkan Unit AC "${unit.unitLabel}"?`}
        description={`Unit ${unit.unitCode} akan dinonaktifkan secara aman. Seluruh riwayat servis dan foto dokumentasi tetap tersimpan.`}
        onConfirm={handleConfirmArchive}
        isLoading={isArchiving}
      />
    </div>
  );
}
