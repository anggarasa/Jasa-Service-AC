'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Public error caught:', error);

    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Failed to fetch dynamically imported module');

    if (isChunkError && typeof window !== 'undefined') {
      const STORAGE_KEY = 'chunk_error_reloaded';
      const lastReload = sessionStorage.getItem(STORAGE_KEY);
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem(STORAGE_KEY, now.toString());
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center max-w-md min-h-[50vh]">
      <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-primary mb-2">Terjadi Kendala Memuat Halaman</h2>
      <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
        Maaf, sistem sedang mengalami sedikit kendala saat mengambil data terbaru. Silakan coba muat ulang halaman.
      </p>
      <Button onClick={() => reset()} variant="default" className="gap-2">
        <RefreshCw className="w-4 h-4" />
        <span>Coba Lagi</span>
      </Button>
    </div>
  );
}
