'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, Calendar, Clock, MapPin, User, ShieldAlert } from 'lucide-react';
import { createManualAdminBooking, fetchTechniciansSchedule } from '@/lib/api/admin-bookings';
import { getPublicServices, getPublicServiceAreas } from '@/lib/api/public';

export default function NewManualBookingPage() {
  const router = useRouter();

  const [services, setServices] = useState<any[]>([]);
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [serviceId, setServiceId] = useState('');
  const [serviceAreaId, setServiceAreaId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('Jakarta Selatan');
  const [technicianId, setTechnicianId] = useState('');
  const [status, setStatus] = useState<'PENDING' | 'CONFIRMED' | 'ASSIGNED'>('CONFIRMED');
  const [customerNotes, setCustomerNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Units list
  const [units, setUnits] = useState<Array<{
    brand: string;
    model: string;
    type: 'SPLIT' | 'CASSETTE' | 'FLOOR_STANDING' | 'CENTRAL' | 'WINDOW' | 'PORTABLE' | 'OTHER';
    capacityPk: string;
    installationRoom: string;
    notes: string;
  }>>([
    {
      brand: 'Daikin',
      model: '',
      type: 'SPLIT',
      capacityPk: '1',
      installationRoom: 'Ruang Tamu',
      notes: '',
    },
  ]);

  useEffect(() => {
    async function init() {
      try {
        setLoadingInitial(true);
        const [svcsRes, areas, techs] = await Promise.all([
          getPublicServices(),
          getPublicServiceAreas(),
          fetchTechniciansSchedule({ date: new Date().toISOString().slice(0, 10) }),
        ]);
        const svcs = svcsRes.items;
        setServices(svcs);
        if (svcs.length > 0) setServiceId(svcs[0].id);
        setServiceAreas(areas);
        if (areas.length > 0) setServiceAreaId(areas[0].id);
        setTechnicians(techs);
      } catch (err: any) {
        setError(err?.message || 'Gagal memuat opsi data pendukung.');
      } finally {
        setLoadingInitial(false);
      }
    }
    init();
  }, []);

  const addUnit = () => {
    if (units.length >= 10) return;
    setUnits([
      ...units,
      {
        brand: 'Daikin',
        model: '',
        type: 'SPLIT',
        capacityPk: '1',
        installationRoom: 'Kamar',
        notes: '',
      },
    ]);
  };

  const removeUnit = (index: number) => {
    if (units.length <= 1) return;
    setUnits(units.filter((_, i) => i !== index));
  };

  const updateUnit = (index: number, field: string, value: string) => {
    const next = [...units];
    (next[index] as any)[field] = value;
    setUnits(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!scheduledDate) throw new Error('Tanggal dan jam pemesanan wajib diisi');
      const startIso = new Date(scheduledDate).toISOString();

      const booking = await createManualAdminBooking({
        serviceId,
        units,
        serviceAreaId,
        serviceAddress: {
          recipientName: customerName,
          recipientPhone: customerPhone,
          fullAddress,
          city,
          district: district || 'Kebayoran Baru',
          province: 'DKI Jakarta',
        },
        selectedStartAt: startIso,
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        customerNotes: customerNotes || undefined,
        internalNotes: internalNotes || undefined,
        technicianId: technicianId || undefined,
        status,
      });

      alert(`Pemesanan servis manual berhasil dibuat! Kode: ${booking.bookingCode}`);
      router.push(`/dashboard/bookings/${booking.id}`);
    } catch (err: any) {
      setError(err?.message || 'Gagal membuat pemesanan servis.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Menyiapkan form pemesanan...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/bookings">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Buat Pemesanan Servis Manual
          </h1>
          <p className="text-xs text-muted-foreground">
            Daftarkan janji temu servis AC langsung dari telepon/WhatsApp pelanggan atau panggilan kantor.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Customer & Address */}
        <Card className="border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              1. Identitas Pelanggan & Alamat Lokasi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Nama Lengkap Pelanggan *</label>
              <Input
                placeholder="Contoh: Budi Santoso"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Nomor WhatsApp / Telepon *</label>
              <Input
                placeholder="Contoh: 081234567890"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="font-medium text-slate-700">Email Pelanggan (Opsional)</label>
              <Input
                type="email"
                placeholder="pelanggan@email.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="font-medium text-slate-700">Alamat Lengkap Servis *</label>
              <Input
                placeholder="Nama jalan, nomor rumah/ruko, patokan..."
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Kecamatan *</label>
              <Input
                placeholder="Contoh: Tebet"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Kota / Kabupaten *</label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Service & Schedule */}
        <Card className="border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              2. Layanan, Wilayah & Jadwal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Pilih Layanan *</label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-300 px-3 bg-white"
                required
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.priceType})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Wilayah Operasional *</label>
              <select
                value={serviceAreaId}
                onChange={(e) => setServiceAreaId(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-300 px-3 bg-white"
                required
              >
                {serviceAreas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (Kunjungan Rp {Number(a.visitFee).toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Jadwal Tanggal & Jam *</label>
              <Input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 3: AC Units */}
        <Card className="border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-900">
              3. Rincian Unit AC ({units.length} Unit)
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addUnit}
              disabled={units.length >= 10}
              className="text-xs h-8"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Unit
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {units.map((u, i) => (
              <div key={i} className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-800">Unit AC #{i + 1}</span>
                  {units.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUnit(i)}
                      className="text-red-600 hover:text-red-700 h-6 px-2 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Hapus
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-600">Merk AC</label>
                    <Input
                      placeholder="Daikin/Panasonic"
                      value={u.brand}
                      onChange={(e) => updateUnit(i, 'brand', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-600">Tipe</label>
                    <select
                      value={u.type}
                      onChange={(e) => updateUnit(i, 'type', e.target.value)}
                      className="w-full h-9 rounded-md border border-slate-300 px-2 bg-white"
                    >
                      <option value="SPLIT">Split Wall</option>
                      <option value="CASSETTE">Cassette</option>
                      <option value="FLOOR_STANDING">Standing</option>
                      <option value="CENTRAL">Central</option>
                      <option value="OTHER">Lainnya</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-600">Kapasitas PK</label>
                    <Input
                      placeholder="1"
                      value={u.capacityPk}
                      onChange={(e) => updateUnit(i, 'capacityPk', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-600">Ruangan</label>
                    <Input
                      placeholder="Ruang Tamu"
                      value={u.installationRoom}
                      onChange={(e) => updateUnit(i, 'installationRoom', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Step 4: Technician & Status Assignment */}
        <Card className="border-slate-200/80 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-900">
              4. Penugasan Teknisi & Catatan Internal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Tugaskan Teknisi (Opsional)</label>
              <select
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-300 px-3 bg-white"
              >
                <option value="">-- Alokasikan Otomatis / Nanti --</option>
                {technicians.map((t) => (
                  <option key={t.technicianId} value={t.technicianId}>
                    {t.name} ({t.totalOccupancies} tugas hari ini)
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Status Awal</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full h-9 rounded-md border border-slate-300 px-3 bg-white"
              >
                <option value="CONFIRMED">Dikonfirmasi (CONFIRMED)</option>
                <option value="ASSIGNED">Ditugaskan (ASSIGNED)</option>
                <option value="PENDING">Menunggu Verifikasi (PENDING)</option>
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="font-medium text-slate-700">Catatan dari Pelanggan</label>
              <textarea
                rows={2}
                placeholder="Keluhan atau instruksi dari pelanggan..."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2 text-xs"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="font-medium text-slate-700">Catatan Internal Admin</label>
              <textarea
                rows={2}
                placeholder="Catatan tim admin (tidak terlihat pelanggan)..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/dashboard/bookings">
            <Button type="button" variant="outline" size="sm">Batal</Button>
          </Link>
          <Button
            type="submit"
            size="sm"
            disabled={submitting}
            className="bg-primary hover:bg-primary/95 text-white px-6"
          >
            {submitting ? 'Menyimpan...' : 'Buat Pemesanan Sekarang'}
          </Button>
        </div>
      </form>
    </div>
  );
}
