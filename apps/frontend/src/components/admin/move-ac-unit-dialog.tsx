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
import { AlertCircle, ArrowRightLeft, Loader2, MapPin } from 'lucide-react';

interface MoveAcUnitDialogProps {
  unit: {
    id: string;
    unitCode: string;
    unitLabel: string;
    customerAddressId: string;
    customerAddressLabel?: string;
  };
  customerAddresses: Array<{
    id: string;
    label: string;
    fullAddress: string;
    isPrimary: boolean;
  }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MoveAcUnitDialog({
  unit,
  customerAddresses,
  open,
  onOpenChange,
  onSuccess,
}: MoveAcUnitDialogProps) {
  // Destination addresses: exclude current address
  const destinationAddresses = customerAddresses.filter(
    (a) => a.id !== unit.customerAddressId,
  );

  const [newAddressId, setNewAddressId] = useState(
    destinationAddresses[0]?.id || '',
  );
  const [newRoom, setNewRoom] = useState('');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleMove(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!newAddressId) {
      setErrorMessage('Pilih alamat tujuan baru untuk unit AC ini.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/ac-units/${unit.id}/move-address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newCustomerAddressId: newAddressId,
          newInstallationRoom: newRoom.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.error?.message || json.message || 'Gagal memindahkan unit AC',
        );
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
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleMove}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-accent" />
              Pindahkan Lokasi Unit AC
            </DialogTitle>
            <DialogDescription>
              Pindahkan unit <strong>{unit.unitLabel}</strong> ({unit.unitCode}) ke alamat lain milik pelanggan ini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {errorMessage && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 py-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <span className="font-semibold text-slate-500">Lokasi Alamat Saat Ini:</span>
              <p className="font-medium text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {unit.customerAddressLabel || 'Alamat Terdaftar'}
              </p>
            </div>

            {destinationAddresses.length === 0 ? (
              <Alert className="bg-amber-50 border-amber-200 text-amber-900 py-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-xs">
                  Pelanggan ini hanya memiliki 1 alamat aktif. Tambahkan alamat servis baru terlebih dahulu di profil pelanggan sebelum memindahkan unit AC.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-1">
                  <Label htmlFor="destAddress" className="text-xs font-medium">Alamat Tujuan Baru *</Label>
                  <select
                    id="destAddress"
                    value={newAddressId}
                    onChange={(e) => setNewAddressId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {destinationAddresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label} — {a.fullAddress}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="newRoom" className="text-xs font-medium">Ruangan di Alamat Baru (Opsional)</Label>
                  <Input
                    id="newRoom"
                    placeholder="Contoh: Kamar Tamu Lt. 2"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="moveNotes" className="text-xs font-medium">Alasan / Catatan Pemindahan</Label>
                  <textarea
                    id="moveNotes"
                    rows={2}
                    placeholder="Contoh: Dipindahkan karena renovasi rumah..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </>
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
              disabled={isLoading || destinationAddresses.length === 0}
              className="bg-primary hover:bg-primary/95 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memindahkan...
                </>
              ) : (
                'Konfirmasi Pindah Lokasi'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
