import { getServerSession } from '@/lib/auth/server-auth';
import { ProfileForm } from '@/components/dashboard/profile-form';

export const metadata = {
  title: 'Profil Teknisi — CoolCare AC Service',
};

export default async function TechnicianProfilePage() {
  const session = await getServerSession();

  if (!session) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Profil Teknisi
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola nama tampilan profil teknisi Anda pada sistem.
        </p>
      </div>

      <ProfileForm user={session} />
    </div>
  );
}
