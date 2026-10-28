import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/server-auth';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { TechnicianBottomNav } from '@/components/technician/bottom-nav';

export default async function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  // If owner or admin visits, redirect to their main dashboard
  if (session.role !== 'TECHNICIAN') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <DashboardHeader user={session} />
      <div className="flex-1 flex">
        <DashboardSidebar role={session.role} />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 md:pb-8">
          {children}
        </main>
      </div>
      <TechnicianBottomNav />
    </div>
  );
}
