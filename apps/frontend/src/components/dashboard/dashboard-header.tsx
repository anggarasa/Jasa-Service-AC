'use client';

import { useRouter } from 'next/navigation';
import { AuthUser } from '@tampilkit-ac/api-contract';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Shield, Key } from 'lucide-react';
import Link from 'next/link';

interface DashboardHeaderProps {
  user: AuthUser;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } catch {
      // Ignore error and continue redirect
    }
    router.push('/login');
    router.refresh();
  };

  const roleBadgeVariant =
    user.role === 'OWNER'
      ? 'default'
      : user.role === 'ADMIN'
      ? 'secondary'
      : 'outline';

  const roleLabel =
    user.role === 'OWNER'
      ? 'Owner Bisnis'
      : user.role === 'ADMIN'
      ? 'Administrator'
      : 'Teknisi Lapangan';

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm sm:text-base text-slate-900">
              {user.name}
            </span>
            <Badge variant={roleBadgeVariant} className="text-[11px] px-2 py-0.5">
              {roleLabel}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-slate-200"
          onClick={handleLogout}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Keluar</span>
        </Button>
      </div>
    </header>
  );
}
