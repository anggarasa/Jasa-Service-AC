import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/server-auth';
import { LoginForm } from '@/components/auth/login-form';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Masuk — CoolCare AC Service Portal',
  description: 'Portal internal manajemen teknisi dan operasional servis AC.',
};

export default async function LoginPage() {
  const session = await getServerSession();

  if (session) {
    if (session.role === 'TECHNICIAN') {
      redirect('/technician');
    } else {
      redirect('/dashboard');
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-50/50">
      <Card className="w-full max-w-md border-slate-200/80 shadow-lg bg-white/95 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8 px-6 sm:px-8">
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
