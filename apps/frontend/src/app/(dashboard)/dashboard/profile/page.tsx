import { getServerSession } from '@/lib/auth/server-auth';
import { ProfileForm } from '@/components/dashboard/profile-form';

export const metadata = {
  title: 'Profil Pengguna — CoolCare AC Service',
};

export default async function ProfilePage() {
  const session = await getServerSession();

  if (!session) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Profil Pengguna
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola informasi nama dan identitas akun operasional Anda.
        </p>
      </div>

      <ProfileForm user={session} />
    </div>
  );
}
