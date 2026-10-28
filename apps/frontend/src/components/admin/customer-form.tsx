'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Loader2, User, Phone, Mail, FileText } from 'lucide-react';

interface CustomerFormProps {
  initialData?: {
    id?: string;
    name: string;
    phone: string;
    email?: string | null;
    notes?: string | null;
  };
  isEdit?: boolean;
}

export function CustomerForm({ initialData, isEdit = false }: CustomerFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicateCandidates, setDuplicateCandidates] = useState<any[]>([]);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // Debounced duplicate detection
  useEffect(() => {
    if (isEdit) return; // Don't check on edit if unchanged
    const cleanPhone = phone.trim();
    if (cleanPhone.length < 8) {
      setDuplicateCandidates([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsCheckingDuplicate(true);
        const res = await fetch(`/api/admin/customers/check-duplicate?phone=${encodeURIComponent(cleanPhone)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data?.isDuplicateCandidate) {
            setDuplicateCandidates(json.data.candidates || []);
          } else {
            setDuplicateCandidates([]);
          }
        }
      } catch {
        // Ignore background duplicate check failure
      } finally {
        setIsCheckingDuplicate(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [phone, isEdit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Nama pelanggan wajib diisi.');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage('Nomor telepon wajib diisi.');
      return;
    }

    setIsLoading(true);

    try {
      const url = isEdit && initialData?.id
        ? `/api/admin/customers/${initialData.id}`
        : '/api/admin/customers';

      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.message || 'Gagal menyimpan data pelanggan');
      }

      const savedId = json.data?.id || initialData?.id;
      router.push(`/dashboard/customers/${savedId}`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900">
            {isEdit ? 'Ubah Informasi Pelanggan' : 'Pendaftaran Pelanggan Baru'}
          </CardTitle>
          <CardDescription>
            {isEdit
              ? 'Perbarui nomor kontak, email, atau catatan internal pelanggan.'
              : 'Daftarkan data kontak pelanggan untuk riwayat pemesanan dan unit AC.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertTitle className="font-semibold">Terjadi Kesalahan</AlertTitle>
              <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-700 font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              Nama Pelanggan <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Contoh: Budi Santoso"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-700 font-medium flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-500" />
              Nomor WhatsApp / Telepon <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="phone"
                placeholder="Contoh: 081234567890 atau +6281234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={isLoading}
                className="bg-white"
              />
              {isCheckingDuplicate && (
                <div className="absolute right-3 top-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Nomor telepon akan dinormalisasi secara otomatis ke format standar internasional (+62).
            </p>

            {duplicateCandidates.length > 0 && (
              <Alert className="bg-amber-50 border-amber-200 text-amber-900 mt-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <AlertTitle className="font-semibold text-sm">Nomor Telepon Mirip Terdeteksi</AlertTitle>
                <AlertDescription className="text-xs space-y-1 mt-1">
                  <p>
                    Nomor ini sudah terdaftar atas nama:
                  </p>
                  <ul className="list-disc list-inside font-medium text-amber-950">
                    {duplicateCandidates.map((c) => (
                      <li key={c.id}>
                        {c.name} ({c.customerCode})
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-amber-800 pt-1">
                    Catatan: Sistem tidak akan menggabungkan akun secara paksa. Anda tetap dapat melanjutkan pembuatan pelanggan jika nomor ini digunakan bersama keluarga/kantor.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700 font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-500" />
              Alamat Email (Opsional)
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Contoh: budi@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-700 font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              Catatan Internal (Opsional)
            </Label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Preferensi kunjungan, instruksi parkir, catatan khusus..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Batal
          </Button>

          <Button
            type="submit"
            disabled={isLoading}
            className="bg-primary hover:bg-primary/95 text-white min-w-[120px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : isEdit ? (
              'Simpan Perubahan'
            ) : (
              'Daftarkan Pelanggan'
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
