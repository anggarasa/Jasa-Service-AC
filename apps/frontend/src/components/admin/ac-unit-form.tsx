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
import { AlertCircle, Cpu, Loader2 } from 'lucide-react';

interface AcUnitFormProps {
  customerId: string;
  addresses: Array<{ id: string; label: string; fullAddress: string; isPrimary: boolean }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any;
}

const COMMON_BRANDS = ['Daikin', 'Panasonic', 'LG', 'Sharp', 'Mitsubishi', 'Gree', 'Samsung', 'Midea', 'Aqua'];
const AC_TYPES = [
  { value: 'SPLIT', label: 'Split Wall (Standar Rumah)' },
  { value: 'CASSETTE', label: 'Cassette (Plafon Kantor/Ruko)' },
  { value: 'FLOOR_STANDING', label: 'Floor Standing' },
  { value: 'CENTRAL', label: 'Central AC' },
  { value: 'WINDOW', label: 'Window Unit' },
  { value: 'PORTABLE', label: 'Portable' },
  { value: 'OTHER', label: 'Lainnya' },
];
const PK_CAPACITIES = ['0.5', '0.75', '1', '1.5', '2', '2.5', '3', '5'];

export function AcUnitForm({
  customerId,
  addresses,
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: AcUnitFormProps) {
  const isEdit = Boolean(initialData?.id);

  const defaultAddressId = initialData?.customerAddressId || addresses.find((a) => a.isPrimary)?.id || addresses[0]?.id || '';
  const [customerAddressId, setCustomerAddressId] = useState(defaultAddressId);
  const [unitLabel, setUnitLabel] = useState(initialData?.unitLabel || 'AC Kamar Utama');
  const [brand, setBrand] = useState(initialData?.brand || 'Daikin');
  const [model, setModel] = useState(initialData?.model || '');
  const [type, setType] = useState(initialData?.type || 'SPLIT');
  const [capacityPk, setCapacityPk] = useState(initialData?.capacityPk || '1');
  const [serialNumber, setSerialNumber] = useState(initialData?.serialNumber || '');
  const [installationRoom, setInstallationRoom] = useState(initialData?.installationRoom || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!isEdit && !customerAddressId) {
      setErrorMessage('Pilih alamat tempat unit AC dipasang.');
      return;
    }

    if (!unitLabel.trim() || !brand.trim() || !capacityPk.trim()) {
      setErrorMessage('Label unit, merk, dan kapasitas PK wajib diisi.');
      return;
    }

    setIsLoading(true);

    try {
      const url = isEdit
        ? `/api/admin/ac-units/${initialData.id}`
        : `/api/admin/customers/${customerId}/ac-units`;

      const method = isEdit ? 'PATCH' : 'POST';

      const payload: any = {
        unitLabel: unitLabel.trim(),
        brand: brand.trim(),
        model: model.trim() || null,
        type,
        capacityPk,
        serialNumber: serialNumber.trim() || null,
        installationRoom: installationRoom.trim() || null,
        notes: notes.trim() || null,
      };

      if (!isEdit) {
        payload.customerAddressId = customerAddressId;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Gagal menyimpan data unit AC');
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
              <Cpu className="w-5 h-5 text-accent" />
              {isEdit ? 'Ubah Informasi Unit AC' : 'Daftarkan Unit AC Baru'}
            </DialogTitle>
            <DialogDescription>
              Catat spesifikasi teknis unit pendingin ruangan milik pelanggan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {errorMessage && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 py-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
              </Alert>
            )}

            {!isEdit && (
              <div className="space-y-1">
                <Label htmlFor="address" className="text-xs font-medium">Alamat Instalasi *</Label>
                <select
                  id="address"
                  value={customerAddressId}
                  onChange={(e) => setCustomerAddressId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="" disabled>-- Pilih Alamat Pemasangan --</option>
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} {a.isPrimary ? '(Utama)' : ''} — {a.fullAddress}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="unitLabel" className="text-xs font-medium">Label Unit AC *</Label>
                <Input
                  id="unitLabel"
                  placeholder="Contoh: AC Kamar Tidur Utama"
                  value={unitLabel}
                  onChange={(e) => setUnitLabel(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="room" className="text-xs font-medium">Ruangan Terpasang</Label>
                <Input
                  id="room"
                  placeholder="Contoh: Kamar Depan / Lantai 2"
                  value={installationRoom}
                  onChange={(e) => setInstallationRoom(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="brand" className="text-xs font-medium">Merk / Brand *</Label>
                <div className="space-y-1.5">
                  <Input
                    id="brand"
                    placeholder="Daikin / Panasonic / LG"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    required
                  />
                  <div className="flex flex-wrap gap-1">
                    {COMMON_BRANDS.slice(0, 5).map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBrand(b)}
                        className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="capacity" className="text-xs font-medium">Kapasitas PK *</Label>
                <div className="space-y-1.5">
                  <Input
                    id="capacity"
                    placeholder="1 atau 0.5"
                    value={capacityPk}
                    onChange={(e) => setCapacityPk(e.target.value)}
                    required
                  />
                  <div className="flex flex-wrap gap-1">
                    {PK_CAPACITIES.slice(0, 5).map((pk) => (
                      <button
                        key={pk}
                        type="button"
                        onClick={() => setCapacityPk(pk)}
                        className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      >
                        {pk} PK
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="type" className="text-xs font-medium">Tipe AC</Label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {AC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="model" className="text-xs font-medium">Nomor Model / Seri</Label>
                <Input
                  id="model"
                  placeholder="FTKQ25UVM4"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="serialNumber" className="text-xs font-medium">Nomor Seri Pabrik (Barcode)</Label>
              <Input
                id="serialNumber"
                placeholder="SN-1234567890"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes" className="text-xs font-medium">Catatan Khusus Unit</Label>
              <textarea
                id="notes"
                rows={2}
                placeholder="Letak outdoor di dak belakang, pipa 5 meter, perlu tangga lipat..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
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
                'Simpan Unit AC'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
