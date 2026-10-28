'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wrench, FileText, CalendarDays, User } from 'lucide-react';

export function TechnicianBottomNav() {
  const pathname = usePathname();

  const items = [
    {
      href: '/technician',
      label: 'Beranda',
      icon: Wrench,
      exact: true,
    },
    {
      href: '/technician/jobs',
      label: 'Tugas SPK',
      icon: FileText,
      exact: false,
    },
    {
      href: '/technician/schedule',
      label: 'Jadwal',
      icon: CalendarDays,
      exact: false,
    },
    {
      href: '/technician/profile',
      label: 'Profil',
      icon: User,
      exact: false,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`w-5 h-5 mb-0.5 ${
                  isActive ? 'text-primary stroke-[2.5]' : 'text-slate-400'
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
