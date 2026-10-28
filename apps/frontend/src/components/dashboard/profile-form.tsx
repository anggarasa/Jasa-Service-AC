'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@tampilkit-ac/api-contract';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, Save, User } from 'lucide-react';

interface ProfileFormProps {
  user: AuthUser;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    if (name.trim().length < 2) {
      setStatusMessage({
        type: 'error',
        text: 'Nama minimal harus 2 karakter.',
      });
      setIsLoading(false);
      return;
    }

    try {
      await apiClient.updateProfile({ name });
      setStatusMessage({
        type: 'success',
        text: 'Profil berhasil diperbarui.',
      });
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Gagal memperbarui profil.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {statusMessage && (
        <Alert
          variant={statusMessage.type === 'error' ? 'destructive' : 'default'}
          className={
            statusMessage.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : ''
          }
        >
          {statusMessage.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          )}
          <AlertTitle>
            {statusMessage.type === 'success' ? 'Berhasil' : 'Kesalahan'}
          </AlertTitle>
          <AlertDescription>{statusMessage.text}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nama Lengkap</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-9"
              disabled={isLoading}
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Nama yang ditampilkan pada kartu tugas dan sistem internal.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Alamat Email</Label>
          <Input id="email" value={user.email} disabled className="bg-slate-50 text-slate-500 cursor-not-allowed" />
          <p className="text-xs text-muted-foreground">
            Alamat email terdaftar tidak dapat diubah secara mandiri untuk mencegah pengambilalihan akun.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Peran / Hak Akses</Label>
            <div>
              <Badge variant="outline" className="font-semibold text-primary">
                {user.role}
              </Badge>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status Akun</Label>
            <div>
              <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                {user.isActive ? 'Aktif' : 'Dinonaktifkan'}
              </Badge>
            </div>
          </div>
        </div>

        {user.lastLoginAt && (
          <div className="pt-2 border-t border-slate-100 text-xs text-muted-foreground">
            Login terakhir: {new Date(user.lastLoginAt).toLocaleString('id-ID')}
          </div>
        )}

        <div className="pt-3 flex justify-end">
          <Button type="submit" disabled={isLoading} className="gap-2">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Simpan Perubahan
          </Button>
        </div>
      </div>
    </form>
  );
}
