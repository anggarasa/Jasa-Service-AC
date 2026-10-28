'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, ShieldAlert } from 'lucide-react';

const PasswordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
    newPassword: z
      .string()
      .min(12, 'Password baru minimal 12 karakter')
      .max(128, 'Password maksimal 128 karakter'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Konfirmasi password baru tidak cocok',
    path: ['confirmPassword'],
  });

type PasswordChangeInput = z.infer<typeof PasswordChangeSchema>;

export function SecurityForm() {
  const router = useRouter();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordChangeInput>({
    resolver: zodResolver(PasswordChangeSchema),
  });

  const onSubmit = async (data: PasswordChangeInput) => {
    setIsLoading(true);
    setStatusMessage(null);

    try {
      await apiClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      setStatusMessage({
        type: 'success',
        text: 'Password berhasil diperbarui. Seluruh sesi Anda telah dicabut untuk keamanan. Anda akan diarahkan ke halaman login dalam 3 detik.',
      });

      reset();
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Gagal memperbarui password. Periksa password saat ini Anda.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
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
            {statusMessage.type === 'success' ? 'Sukses' : 'Gagal'}
          </AlertTitle>
          <AlertDescription>{statusMessage.text}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <KeyRound className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-slate-900">
            Perbarui Password Akun
          </h3>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">Password Saat Ini</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              placeholder="••••••••••••"
              disabled={isLoading}
              {...register('currentPassword')}
            />
            <button
              type="button"
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              onClick={() => setShowCurrent(!showCurrent)}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-xs text-destructive">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="newPassword">Password Baru</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNew ? 'text' : 'password'}
              placeholder="Minimal 12 karakter"
              disabled={isLoading}
              {...register('newPassword')}
            />
            <button
              type="button"
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              onClick={() => setShowNew(!showNew)}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-xs text-destructive">{errors.newPassword.message}</p>
          )}
          <p className="text-[11px] text-muted-foreground">
            Gunakan minimal 12 karakter. Disarankan menggunakan passphrase kombinasi kata aman.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
          <Input
            id="confirmPassword"
            type={showNew ? 'text' : 'password'}
            placeholder="Ulangi password baru"
            disabled={isLoading}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="pt-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200/60 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <span>
            Mengganti password akan secara otomatis mencabut seluruh sesi aktif di perangkat lain demi keamanan akun Anda.
          </span>
        </div>

        <div className="pt-3 flex justify-end">
          <Button type="submit" disabled={isLoading} className="gap-2">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4" />
            )}
            Simpan Password Baru
          </Button>
        </div>
      </div>
    </form>
  );
}
