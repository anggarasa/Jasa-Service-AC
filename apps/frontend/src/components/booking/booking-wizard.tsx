'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  MapPin,
  ShieldCheck,
  CreditCard,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BookingStepper } from './booking-stepper';
import { PublicServiceItem, PublicServiceArea } from '@tampilkit-ac/api-contract';

interface BookingWizardProps {
  initialServices: PublicServiceItem[];
  initialAreas: PublicServiceArea[];
  preselectedServiceId?: string;
}

export function BookingWizard({
  initialServices,
  initialAreas,
  preselectedServiceId,
}: BookingWizardProps) {
  const router = useRouter();

  // Wizard Step State
  const [step, setStep] = useState(1);
  const [idempotencyKey, setIdempotencyKey] = useState('');

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    preselectedServiceId || initialServices[0]?.id || '',
  );

  const [units, setUnits] = useState<
    Array<{
      brand: string;
      model: string;
      type: 'SPLIT' | 'CASSETTE' | 'FLOOR_STANDING' | 'CENTRAL' | 'WINDOW' | 'PORTABLE' | 'OTHER';
      capacityPk: string;
      installationRoom: string;
      notes: string;
    }>
  >([
    {
      brand: 'Daikin',
      model: '',
      type: 'SPLIT',
      capacityPk: '1.00',
      installationRoom: 'Ruang Tamu',
      notes: '',
    },
  ]);

  const [serviceAreaId, setServiceAreaId] = useState<string>(initialAreas[0]?.id || '');
  const [address, setAddress] = useState({
    recipientName: '',
    recipientPhone: '',
    fullAddress: '',
    city: 'Jakarta Selatan',
    district: '',
    subdistrict: '',
    postalCode: '',
    landmark: '',
  });

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<
    Array<{ start: string; end: string; startIso: string; endIso: string; available: boolean }>
  >([]);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: string;
    end: string;
    startIso: string;
    endIso: string;
  } | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize unique idempotency key
  useEffect(() => {
    setIdempotencyKey(`idemp-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`);

    // Set default tomorrow date as minimum candidate
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  const selectedService = initialServices.find((s) => s.id === selectedServiceId);
  const selectedArea = initialAreas.find((a) => a.id === serviceAreaId);

  // Fetch slots whenever service, unit count, area, or date changes
  useEffect(() => {
    if (!selectedServiceId || !serviceAreaId || !selectedDate) return;

    let isCancelled = false;
    async function loadSlots() {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const res = await fetch(
          `/api/public/availability?serviceId=${selectedServiceId}&unitCount=${units.length}&serviceAreaId=${serviceAreaId}&date=${selectedDate}`,
        );
        const json = await res.json();
        if (!isCancelled) {
          if (res.ok && json.success) {
            setAvailableSlots(json.data.slots || []);
          } else {
            setAvailableSlots([]);
          }
        }
      } catch {
        if (!isCancelled) setAvailableSlots([]);
      } finally {
        if (!isCancelled) setLoadingSlots(false);
      }
    }

    loadSlots();
    return () => {
      isCancelled = true;
    };
  }, [selectedServiceId, units.length, serviceAreaId, selectedDate]);

  // Stepper Config
  const steps = [
    { id: 1, label: 'Layanan' },
    { id: 2, label: 'Unit AC' },
    { id: 3, label: 'Lokasi' },
    { id: 4, label: 'Jadwal' },
    { id: 5, label: 'Kontak' },
    { id: 6, label: 'Tinjauan' },
  ];

  // Helper unit handlers
  const handleAddUnit = () => {
    if (units.length >= 10) return;
    setUnits([
      ...units,
      {
        brand: 'Panasonic',
        model: '',
        type: 'SPLIT',
        capacityPk: '0.75',
        installationRoom: `Kamar ${units.length + 1}`,
        notes: '',
      },
    ]);
  };

  const handleRemoveUnit = (index: number) => {
    if (units.length <= 1) return;
    setUnits(units.filter((_, i) => i !== index));
  };

  const handleUnitChange = (index: number, field: string, value: string) => {
    const updated = [...units];
    (updated[index] as any)[field] = value;
    setUnits(updated);
  };

  // Submit Booking
  const handleSubmitBooking = async () => {
    if (!selectedSlot) {
      setErrorMessage('Silakan pilih slot waktu kunjungan.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      serviceId: selectedServiceId,
      units,
      serviceAreaId,
      serviceAddress: {
        recipientName: address.recipientName || customer.name,
        recipientPhone: address.recipientPhone || customer.phone,
        fullAddress: address.fullAddress,
        province: 'DKI Jakarta',
        city: address.city,
        district: address.district || selectedArea?.district || 'Kebayoran Baru',
        subdistrict: address.subdistrict,
        postalCode: address.postalCode,
        landmark: address.landmark,
      },
      selectedStartAt: selectedSlot.startIso,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email || undefined,
      customerNotes: customer.notes || undefined,
      idempotencyKey,
    };

    try {
      const res = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        const errorMsg = json.error?.message || json.message || 'Gagal membuat reservasi pemesanan.';
        setErrorMessage(errorMsg);
        setIsSubmitting(false);
        return;
      }

      // Successful persistence
      const accessToken = json.data.accessToken;
      router.push(`/booking/confirmation?token=${accessToken}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Terjadi kendala jaringan: ${message}`);
      setIsSubmitting(false);
    }
  };

  // Pricing calculations
  const basePriceNum = Number(selectedService?.basePrice || 0);
  const serviceTotalNum = basePriceNum * units.length;
  const visitFeeNum = Number(selectedArea?.visitFee || 0);
  const grandTotalNum = serviceTotalNum + visitFeeNum;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <BookingStepper currentStep={step} steps={steps} onStepClick={(s) => setStep(s)} />

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" />
          <div className="flex-1 text-sm font-medium">{errorMessage}</div>
        </div>
      )}

      {/* STEP 1: PILIH LAYANAN */}
      {step === 1 && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">Pilih Layanan Servis AC</CardTitle>
            <CardDescription>
              Pilih jenis pekerjaan servis yang Anda butuhkan untuk hunian atau kantor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {initialServices.map((service) => {
                const isSelected = service.id === selectedServiceId;
                return (
                  <div
                    key={service.id}
                    onClick={() => setSelectedServiceId(service.id)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-base text-slate-900">{service.name}</span>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                        {service.shortDescription || service.description}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> ~{service.estimatedDurationMinutes} mnt/unit
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {service.priceType === 'INSPECTION_REQUIRED'
                          ? 'Perlu Pengecekan'
                          : `Rp ${Number(service.basePrice).toLocaleString('id-ID')}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setStep(2)} className="gap-2 font-medium">
                Lanjut ke Rincian Unit <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: UNIT AC */}
      {step === 2 && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">Rincian Unit AC</CardTitle>
              <CardDescription>
                Berapa banyak unit AC yang ingin diservis? Masukkan rincian spesifikasi tiap unit.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddUnit}
              disabled={units.length >= 10}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" /> Tambah Unit
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {units.map((unit, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800">Unit #{idx + 1}</span>
                  {units.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUnit(idx)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Merk AC</Label>
                    <Input
                      value={unit.brand}
                      onChange={(e) => handleUnitChange(idx, 'brand', e.target.value)}
                      placeholder="Daikin, LG, Sharp..."
                      className="h-9 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Kapasitas (PK)</Label>
                    <select
                      value={unit.capacityPk}
                      onChange={(e) => handleUnitChange(idx, 'capacityPk', e.target.value)}
                      className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm mt-1 focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      <option value="0.50">0.5 PK</option>
                      <option value="0.75">0.75 PK</option>
                      <option value="1.00">1.0 PK</option>
                      <option value="1.50">1.5 PK</option>
                      <option value="2.00">2.0 PK</option>
                      <option value="2.50">2.5 PK</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Lokasi / Ruangan</Label>
                    <Input
                      value={unit.installationRoom}
                      onChange={(e) => handleUnitChange(idx, 'installationRoom', e.target.value)}
                      placeholder="Ruang Tamu, Kamar Utama..."
                      className="h-9 text-sm mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Keluhan / Catatan Unit (Opsional)</Label>
                  <Input
                    value={unit.notes}
                    onChange={(e) => handleUnitChange(idx, 'notes', e.target.value)}
                    placeholder="Contoh: Bunyi berisik, bocor air, atau tidak dingin..."
                    className="h-9 text-sm mt-1"
                  />
                </div>
              </div>
            ))}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Kembali
              </Button>
              <Button onClick={() => setStep(3)} className="gap-2">
                Lanjut ke Alamat Lokasi <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: LOKASI & WILAYAH */}
      {step === 3 && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">Alamat Lokasi Servis</CardTitle>
            <CardDescription>
              Tentukan alamat pengerjaan servis dan pilih wilayah jangkauan operasional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Wilayah Jangkauan Operasional</Label>
              <select
                value={serviceAreaId}
                onChange={(e) => setServiceAreaId(e.target.value)}
                className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm mt-1 focus:ring-2 focus:ring-primary focus:outline-none"
              >
                {initialAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name} (Ongkos Kunjungan: Rp {Number(area.visitFee).toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-sm font-semibold">Alamat Lengkap (Jalan, Nomor, RT/RW) *</Label>
              <textarea
                value={address.fullAddress}
                onChange={(e) => setAddress({ ...address, fullAddress: e.target.value })}
                placeholder="Jl. Melawai Raya No. 45, RT 02/RW 04, Rumah pagar putih..."
                rows={3}
                className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm mt-1 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Kota / Kabupaten *</Label>
                <Input
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  placeholder="Jakarta Selatan"
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Kecamatan *</Label>
                <Input
                  value={address.district}
                  onChange={(e) => setAddress({ ...address, district: e.target.value })}
                  placeholder="Kebayoran Baru"
                  className="h-9 text-sm mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Patokan Lokasi (Opsional)</Label>
                <Input
                  value={address.landmark}
                  onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                  placeholder="Seberang alfamart, dekat masjid..."
                  className="h-9 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Kode Pos (Opsional)</Label>
                <Input
                  value={address.postalCode}
                  onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                  placeholder="12160"
                  className="h-9 text-sm mt-1"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Kembali
              </Button>
              <Button
                onClick={() => {
                  if (!address.fullAddress || address.fullAddress.trim().length < 5) {
                    setErrorMessage('Alamat lengkap wajib diisi minimal 5 karakter.');
                    return;
                  }
                  setErrorMessage(null);
                  setStep(4);
                }}
                className="gap-2"
              >
                Lanjut ke Pilih Jadwal <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: PILIH JADWAL */}
      {step === 4 && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">Pilih Tanggal & Waktu Kunjungan</CardTitle>
            <CardDescription>
              Slot waktu berikut dihitung secara langsung berdasarkan ketersediaan teknisi CoolCare.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label className="text-sm font-semibold">Tanggal Servis</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="h-10 text-sm mt-1 max-w-xs"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Slot Jam Ketersediaan Teknisi {loadingSlots && '(Memeriksa ketersediaan...)'}
              </Label>

              {loadingSlots ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-11 rounded-lg bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-50 text-center border border-dashed border-slate-300">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">Belum ada jadwal tersedia pada tanggal ini.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Silakan pilih tanggal lain atau hubungi customer service kami melalui WhatsApp.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {availableSlots.map((slot, idx) => {
                    const isSelected = selectedSlot?.startIso === slot.startIso;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`h-11 rounded-lg border text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-md ring-2 ring-primary/20'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {slot.start} - {slot.end}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(3)} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Kembali
              </Button>
              <Button
                onClick={() => {
                  if (!selectedSlot) {
                    setErrorMessage('Pilih salah satu slot jam yang tersedia.');
                    return;
                  }
                  setErrorMessage(null);
                  setStep(5);
                }}
                disabled={!selectedSlot}
                className="gap-2"
              >
                Lanjut ke Data Pemesan <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: DATA KONTAK */}
      {step === 5 && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">Informasi Kontak Pemesan</CardTitle>
            <CardDescription>
              Tidak perlu mendaftar akun. Konfirmasi reservasi dan tiket status akan dikirimkan ke kontak Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Nama Lengkap *</Label>
              <Input
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                placeholder="Contoh: Ahmad Subagyo"
                className="h-10 text-sm mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">Nomor WhatsApp / HP *</Label>
              <Input
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                placeholder="081234567890"
                className="h-10 text-sm mt-1"
              />
              <span className="text-xs text-slate-500 mt-1 block">
                Digunakan teknisi untuk konfirmasi kedatangan ke lokasi.
              </span>
            </div>

            <div>
              <Label className="text-sm font-semibold">Alamat Email (Opsional)</Label>
              <Input
                type="email"
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                placeholder="ahmad@example.com"
                className="h-10 text-sm mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">Catatan Khusus untuk Teknisi (Opsional)</Label>
              <textarea
                value={customer.notes}
                onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                placeholder="Contoh: Tangga disiapkan di lokasi, mohon konfirmasi 30 menit sebelum tiba..."
                rows={2}
                className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm mt-1 focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(4)} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Kembali
              </Button>
              <Button
                onClick={() => {
                  if (!customer.name || customer.name.trim().length < 2) {
                    setErrorMessage('Nama lengkap wajib diisi minimal 2 karakter.');
                    return;
                  }
                  if (!customer.phone || customer.phone.trim().length < 8) {
                    setErrorMessage('Nomor kontak WhatsApp wajib diisi minimal 8 digit.');
                    return;
                  }
                  setErrorMessage(null);
                  setStep(6);
                }}
                className="gap-2"
              >
                Lanjut ke Tinjauan <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 6: TINJAUAN & SUBMIT */}
      {step === 6 && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">Tinjau & Konfirmasi Pemesanan</CardTitle>
            <CardDescription>
              Periksa kembali rincian pemesanan servis AC Anda sebelum mengajukan reservasi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Layanan & Unit</span>
                <p className="text-base font-bold text-slate-900">{selectedService?.name}</p>
                <p className="text-xs text-slate-600">Jumlah Unit: {units.length} unit AC</p>
                <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 space-y-1">
                  {units.map((u, i) => (
                    <div key={i} className="flex justify-between">
                      <span>Unit #{i + 1}: {u.brand} ({u.capacityPk} PK)</span>
                      <span className="text-slate-500">{u.installationRoom}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Jadwal & Lokasi</span>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-primary" /> {selectedDate}
                </p>
                <p className="text-xs text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" /> {selectedSlot?.start} - {selectedSlot?.end} WIB
                </p>
                <p className="text-xs text-slate-600 flex items-start gap-1.5 pt-1">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>
                    {address.fullAddress}, {address.city} ({selectedArea?.name})
                  </span>
                </p>
              </div>
            </div>

            {/* Rincian Biaya */}
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5">
              <span className="text-xs font-semibold uppercase text-primary tracking-wider">Estimasi Pembayaran</span>
              <div className="flex justify-between text-sm text-slate-700">
                <span>Biaya Layanan ({units.length} unit)</span>
                <span className="font-medium">
                  {selectedService?.priceType === 'INSPECTION_REQUIRED'
                    ? 'Pengecekan Fisik'
                    : `Rp ${serviceTotalNum.toLocaleString('id-ID')}`}
                </span>
              </div>
              <div className="flex justify-between text-sm text-slate-700">
                <span>Ongkos Kunjungan ({selectedArea?.name})</span>
                <span className="font-medium">Rp {visitFeeNum.toLocaleString('id-ID')}</span>
              </div>
              <div className="pt-2 border-t border-primary/20 flex justify-between text-base font-bold text-slate-900">
                <span>Estimasi Total</span>
                <span className="text-primary text-lg">
                  {selectedService?.priceType === 'INSPECTION_REQUIRED'
                    ? `Rp ${visitFeeNum.toLocaleString('id-ID')} + Biaya Perbaikan`
                    : `Rp ${grandTotalNum.toLocaleString('id-ID')}`}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                <CreditCard className="w-3.5 h-3.5" /> Pembayaran dilakukan di lokasi setelah servis selesai dikerjakan teknisi.
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(5)} disabled={isSubmitting} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Kembali
              </Button>
              <Button
                onClick={handleSubmitBooking}
                disabled={isSubmitting}
                className="gap-2 font-bold px-8 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? 'Memproses Reservasi...' : 'Konfirmasi Pemesanan Sekarang'}
                {!isSubmitting && <CheckCircle2 className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
