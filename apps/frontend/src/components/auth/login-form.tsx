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
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail, Wind, Crown, ShieldCheck, Wrench, Sparkles } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
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

      {/* Quick Login Dummy Accounts */}
      <div className="space-y-3 pt-2">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-accent" /> Masuk Cepat Akun Demo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              setValue('email', 'owner@coolcare.id', { shouldValidate: true });
              setValue('password', 'OwnerSecurePass123!', { shouldValidate: true });
              onSubmit({ email: 'owner@coolcare.id', password: 'OwnerSecurePass123!' });
            }}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-amber-200/90 bg-amber-50/70 hover:bg-amber-100/80 text-amber-900 transition-all text-center group disabled:opacity-50 shadow-2xs"
            title="Masuk sebagai Owner / Pemilik"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-200/60 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Crown className="w-4 h-4 text-amber-700" />
            </div>
            <span className="text-xs font-bold leading-tight">Owner</span>
            <span className="text-[10px] text-amber-700/80 mt-0.5">Semua Akses</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              setValue('email', 'admin@coolcare.id', { shouldValidate: true });
              setValue('password', 'AdminSecurePass123!', { shouldValidate: true });
              onSubmit({ email: 'admin@coolcare.id', password: 'AdminSecurePass123!' });
            }}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-blue-200/90 bg-blue-50/70 hover:bg-blue-100/80 text-blue-900 transition-all text-center group disabled:opacity-50 shadow-2xs"
            title="Masuk sebagai Admin Operasional"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-200/60 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
            </div>
            <span className="text-xs font-bold leading-tight">Admin</span>
            <span className="text-[10px] text-blue-700/80 mt-0.5">Operasional</span>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              setValue('email', 'technician@coolcare.id', { shouldValidate: true });
              setValue('password', 'TechSecurePass123!', { shouldValidate: true });
              onSubmit({ email: 'technician@coolcare.id', password: 'TechSecurePass123!' });
            }}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-emerald-200/90 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-900 transition-all text-center group disabled:opacity-50 shadow-2xs"
            title="Masuk sebagai Teknisi Lapangan"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-200/60 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Wrench className="w-4 h-4 text-emerald-700" />
            </div>
            <span className="text-xs font-bold leading-tight">Teknisi</span>
            <span className="text-[10px] text-emerald-700/80 mt-0.5">Workspace</span>
          </button>
        </div>
      </div>

      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">
          Akses portal ini dibatasi untuk staf CoolCare AC Service berwenang. Kredensial awal diinisialisasi melalui CLI server.
        </p>
      </div>
    </div>
  );
}
