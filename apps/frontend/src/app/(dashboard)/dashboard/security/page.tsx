import { SecurityForm } from '@/components/dashboard/security-form';

export const metadata = {
  title: 'Keamanan Akun — CoolCare AC Service',
};

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Keamanan & Password
        </h1>
        <p className="text-sm text-muted-foreground">
          Perbarui kata sandi akun Anda menggunakan enkripsi Argon2id standar enterprise.
        </p>
      </div>

      <SecurityForm />
    </div>
  );
}
