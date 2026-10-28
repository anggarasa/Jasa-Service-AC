'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginRequest, LoginRequestSchema } from '@tampilkit-ac/api-contract';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail, Wind } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.login(data);
      const user = response.user;

      if (user.role === 'TECHNICIAN') {
        router.push('/technician');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat masuk. Silakan periksa kembali email dan password Anda.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-accent shadow-md mb-2">
          <Wind className="w-7 h-7 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Masuk ke Portal Internal
        </h1>
        <p className="text-sm text-muted-foreground">
          Portal manajemen operasional CoolCare AC Service untuk Owner, Admin, dan Teknisi.
        </p>
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Gagal Masuk</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="nama@coolcare.id"
              className="pl-9"
              autoComplete="email"
              disabled={isLoading}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              className="pl-9 pr-10"
              autoComplete="current-password"
              disabled={isLoading}
              {...register('password')}
            />
            <button
              type="button"
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="default"
          className="w-full bg-primary hover:bg-primary/95 text-white h-10 font-semibold shadow-sm transition-all"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Memverifikasi...
            </span>
          ) : (
            'Masuk ke Akun'
          )}
        </Button>
      </form>

      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">
          Akses portal ini dibatasi untuk staf CoolCare AC Service berwenang. Kredensial awal diinisialisasi melalui CLI server.
        </p>
      </div>
    </div>
  );
}
