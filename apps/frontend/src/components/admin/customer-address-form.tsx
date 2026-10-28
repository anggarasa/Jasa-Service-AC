'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, HelpCircle, Loader2, MapPin } from 'lucide-react';

interface CustomerAddressFormProps {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any;
}

export function CustomerAddressForm({
  customerId,
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: CustomerAddressFormProps) {
  const isEdit = Boolean(initialData?.id);

  const [label, setLabel] = useState(initialData?.label || 'Rumah');
  const [recipientName, setRecipientName] = useState(initialData?.recipientName || '');
  const [recipientPhone, setRecipientPhone] = useState(initialData?.recipientPhone || '');
  const [fullAddress, setFullAddress] = useState(initialData?.fullAddress || '');
  const [province, setProvince] = useState(initialData?.province || 'DKI Jakarta');
  const [city, setCity] = useState(initialData?.city || 'Jakarta Selatan');
  const [district, setDistrict] = useState(initialData?.district || 'Kebayoran Baru');
  const [subdistrict, setSubdistrict] = useState(initialData?.subdistrict || '');
  const [postalCode, setPostalCode] = useState(initialData?.postalCode || '');
  const [landmark, setLandmark] = useState(initialData?.landmark || '');
  const [isPrimary, setIsPrimary] = useState(initialData?.isPrimary || false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Area Validation State
  const [areaValidation, setAreaValidation] = useState<{
    checked: boolean;
    serviceable: boolean;
    status: string;
    message: string;
    visitFee?: string;
    travelMinutes?: number;
    areaId?: string;
  } | null>(null);
  const [isValidatingArea, setIsValidatingArea] = useState(false);

  async function handleValidateArea() {
    if (!city.trim() || !district.trim()) {
      setErrorMessage('Isi Kota dan Kecamatan terlebih dahulu untuk memvalidasi area servis.');
      return;
    }

    setIsValidatingArea(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/customers/${customerId}/addresses/validate-area`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: city.trim(), district: district.trim() }),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        setAreaValidation({
          checked: true,
          serviceable: json.data.serviceable,
          status: json.data.status,
          message: json.data.message,
          visitFee: json.data.visitFee,
          travelMinutes: json.data.estimatedTravelMinutes,
          areaId: json.data.serviceArea?.id,
        });
      }
    } catch {
      setErrorMessage('Gagal memvalidasi ketercakupan area servis.');
    } finally {
      setIsValidatingArea(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!label.trim() || !fullAddress.trim() || !city.trim() || !district.trim()) {
      setErrorMessage('Label, alamat lengkap, kota, dan kecamatan wajib diisi.');
      return;
    }

    setIsLoading(true);

    try {
      const url = isEdit
        ? `/api/admin/customers/${customerId}/addresses/${initialData.id}`
        : `/api/admin/customers/${customerId}/addresses`;

      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: label.trim(),
          recipientName: recipientName.trim() || null,
          recipientPhone: recipientPhone.trim() || null,
          fullAddress: fullAddress.trim(),
          province: province.trim() || 'DKI Jakarta',
          city: city.trim(),
          district: district.trim(),
          subdistrict: subdistrict.trim() || null,
          postalCode: postalCode.trim() || null,
          landmark: landmark.trim() || null,
          serviceAreaId: areaValidation?.areaId || initialData?.serviceAreaId || null,
          isPrimary,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Gagal menyimpan alamat');
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent" />
              {isEdit ? 'Ubah Alamat Servis' : 'Tambah Alamat Servis Baru'}
            </DialogTitle>
            <DialogDescription>
              Tentukan lokasi kunjungan servis teknisi AC untuk pelanggan ini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {errorMessage && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 py-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="label" className="text-xs font-medium">Label Alamat *</Label>
                <Input
                  id="label"
                  placeholder="Rumah / Kantor / Ruko"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="recipientName" className="text-xs font-medium">Nama Penerima</Label>
                <Input
                  id="recipientName"
                  placeholder="Nama kontak di lokasi"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="fullAddress" className="text-xs font-medium">Alamat Lengkap *</Label>
              <textarea
                id="fullAddress"
                rows={2}
                placeholder="Nama jalan, nomor rumah/gedung, RT/RW..."
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="city" className="text-xs font-medium">Kota / Kabupaten *</Label>
                <Input
                  id="city"
                  placeholder="Jakarta Selatan"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="district" className="text-xs font-medium">Kecamatan *</Label>
                <Input
                  id="district"
                  placeholder="Kebayoran Baru"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Service Area Validation Widget */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Verifikasi Cakupan Area Servis</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleValidateArea}
                  disabled={isValidatingArea}
                  className="h-7 text-xs px-2"
                >
                  {isValidatingArea ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 mr-1 text-accent" />
                  )}
                  Cek Area
                </Button>
              </div>

              {areaValidation?.checked && (
                <div
                  className={`text-xs p-2.5 rounded-md flex items-start gap-2 ${
                    areaValidation.serviceable
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : areaValidation.status === 'NOT_SERVICEABLE'
                      ? 'bg-red-50 text-red-900 border border-red-200'
                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                  }`}
                >
                  {areaValidation.serviceable ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold">{areaValidation.message}</p>
                    {areaValidation.serviceable && (
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Ongkos Kunjungan: Rp{Number(areaValidation.visitFee || 0).toLocaleString('id-ID')} • Estimasi Perjalanan: {areaValidation.travelMinutes || 30} menit
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="landmark" className="text-xs font-medium">Patokan / Catatan Lokasi</Label>
                <Input
                  id="landmark"
                  placeholder="Sebelah minimarket..."
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="postalCode" className="text-xs font-medium">Kode Pos</Label>
                <Input
                  id="postalCode"
                  placeholder="12190"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>
            </div>

            {!isEdit && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4"
                />
                <Label htmlFor="isPrimary" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Jadikan sebagai alamat utama pelanggan
                </Label>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-end border-t pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-primary/95 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Alamat'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
