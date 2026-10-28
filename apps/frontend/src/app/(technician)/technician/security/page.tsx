import { SecurityForm } from '@/components/dashboard/security-form';

export const metadata = {
  title: 'Keamanan Akun Teknisi — CoolCare AC Service',
};

export default function TechnicianSecurityPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Keamanan Akun Teknisi
        </h1>
        <p className="text-sm text-muted-foreground">
          Perbarui kata sandi akun teknisi Anda menggunakan standar Argon2id.
        </p>
      </div>

      <SecurityForm />
    </div>
  );
}
