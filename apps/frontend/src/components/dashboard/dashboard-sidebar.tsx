'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@tampilkit-ac/api-contract';
import {
  LayoutDashboard,
  User,
  ShieldAlert,
  Smartphone,
  Wrench,
  Wind,
  Users,
  Cpu,
  CalendarDays,
  Calendar,
  UserCheck,
  FileText,
  RefreshCw,
  Receipt,
  CreditCard,
  BarChart3,
} from 'lucide-react';

interface DashboardSidebarProps {
  role: UserRole;
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname();

  const isTechnician = role === 'TECHNICIAN';

  const adminLinks = [
    {
      href: '/dashboard',
      label: 'Ringkasan',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: '/dashboard/bookings',
      label: 'Pemesanan Servis',
      icon: CalendarDays,
      exact: true,
    },
    {
      href: '/dashboard/bookings/calendar',
      label: 'Kalender Jadwal',
      icon: Calendar,
    },
    {
      href: '/dashboard/technicians/schedule',
      label: 'Jadwal Teknisi',
      icon: UserCheck,
    },
    {
      href: '/dashboard/work-orders',
      label: 'Surat Tugas (SPK)',
      icon: FileText,
    },
    {
      href: '/dashboard/invoices',
      label: 'Faktur & Tagihan',
      icon: Receipt,
    },
    {
      href: '/dashboard/payments',
      label: 'Verifikasi Bayar',
      icon: CreditCard,
    },
    {
      href: '/dashboard/reports',
      label: 'Laporan Operasional',
      icon: BarChart3,
    },
    {
      href: '/dashboard/integrations/google-calendar',
      label: 'Google Calendar Sync',
      icon: RefreshCw,
    },
    {
      href: '/dashboard/customers',
      label: 'Pelanggan',
      icon: Users,
    },
    {
      href: '/dashboard/ac-units',
      label: 'Inventaris Unit AC',
      icon: Cpu,
    },
    {
      href: '/dashboard/profile',
      label: 'Profil Pengguna',
      icon: User,
    },
    {
      href: '/dashboard/security',
      label: 'Keamanan & Sandi',
      icon: ShieldAlert,
    },
    {
      href: '/dashboard/sessions',
      label: 'Perangkat & Sesi',
      icon: Smartphone,
    },
  ];

  const technicianLinks = [
    {
      href: '/technician',
      label: 'Dashboard Lapangan',
      icon: Wrench,
      exact: true,
    },
    {
      href: '/technician/jobs',
      label: 'Pekerjaan Saya (SPK)',
      icon: FileText,
    },
    {
      href: '/technician/schedule',
      label: 'Jadwal Servis',
      icon: CalendarDays,
    },
    {
      href: '/technician/profile',
      label: 'Profil Saya',
      icon: User,
    },
    {
      href: '/technician/security',
      label: 'Keamanan & Sandi',
      icon: ShieldAlert,
    },
  ];

  const links = isTechnician ? technicianLinks : adminLinks;

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-slate-50/60 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        <div className="px-2 py-1 flex items-center gap-2 text-primary font-bold tracking-tight">
          <Wind className="w-5 h-5 text-accent stroke-[2.5]" />
          <span>{isTechnician ? 'Portal Teknisi' : 'Portal Manajemen'}</span>
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-3 bg-white/80 rounded-xl border border-slate-200/80 text-xs text-muted-foreground space-y-1 shadow-sm">
        <p className="font-semibold text-slate-800">CoolCare AC Service</p>
        <p>Sistem Operasional Lapangan (Phase 02 Auth Active)</p>
      </div>
    </aside>
  );
}
