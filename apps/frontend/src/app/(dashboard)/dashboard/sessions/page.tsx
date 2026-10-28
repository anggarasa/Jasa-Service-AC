import { SessionTable } from '@/components/dashboard/session-table';

export const metadata = {
  title: 'Perangkat & Sesi — CoolCare AC Service',
};

export default function SessionsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Sesi & Perangkat Terhubung
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola perangkat yang memiliki akses ke akun Anda. Anda dapat mencabut sesi perangkat lain sewaktu-waktu.
        </p>
      </div>

      <SessionTable />
    </div>
  );
}
