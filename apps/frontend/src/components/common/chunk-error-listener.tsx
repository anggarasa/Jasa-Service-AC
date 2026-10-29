'use client';

import { useEffect } from 'react';

/**
 * Listener global untuk menangani ChunkLoadError pada Next.js / Webpack.
 * Biasa terjadi jika bundle asset diperbarui (misalnya setelah rebuild atau deployment baru),
 * sehingga chunk lama yang dicari browser menghasilkan error 404.
 * Komponen ini secara otomatis melakukan reload halaman satu kali untuk mengambil bundle terbaru.
 */
export function ChunkErrorListener() {
  useEffect(() => {
    const handleChunkError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const error = 'error' in event ? event.error : event.reason;
      const message = error?.message || ('message' in event ? event.message : '') || '';

      const isChunkLoadFailed =
        error?.name === 'ChunkLoadError' ||
        message.includes('Loading chunk') ||
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('Loading CSS chunk');

      if (isChunkLoadFailed && typeof window !== 'undefined') {
        const STORAGE_KEY = 'chunk_reload_timestamp';
        const lastReload = sessionStorage.getItem(STORAGE_KEY);
        const now = Date.now();

        // Mencegah infinite reload loop: batasi reload maksimal sekali dalam 10 detik
        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem(STORAGE_KEY, now.toString());
          console.warn('[ChunkErrorListener] Chunk lama tidak ditemukan (asset diperbarui). Memuat ulang halaman...');
          window.location.reload();
        }
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleChunkError);

    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleChunkError);
    };
  }, []);

  return null;
}
