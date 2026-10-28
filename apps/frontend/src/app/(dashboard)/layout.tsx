import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/server-auth';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  // Reject technicians from accessing admin/owner dashboard
  if (session.role === 'TECHNICIAN') {
    redirect('/technician');
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <DashboardHeader user={session} />
      <div className="flex-1 flex">
        <DashboardSidebar role={session.role} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
