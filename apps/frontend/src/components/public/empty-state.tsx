import Link from 'next/link';
import { LucideIcon, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionHref?: string;
  actionLabel?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Search,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm max-w-lg mx-auto my-8">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-500">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-primary mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{description}</p>
      {actionHref && actionLabel && (
        <Button asChild variant="outline">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
