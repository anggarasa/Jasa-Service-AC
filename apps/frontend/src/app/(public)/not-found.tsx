import Link from 'next/link';
import { Search, Home, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublicNotFound() {
  return (
    <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center max-w-md min-h-[50vh]">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
        <Search className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-black text-primary mb-2">Halaman Tidak Ditemukan</h1>
      <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
        Maaf, halaman atau layanan AC yang Anda cari tidak tersedia atau tautan telah dipindahkan.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="default" className="gap-2">
          <Link href="/">
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/services">
            <Calendar className="w-4 h-4" />
            <span>Lihat Katalog Layanan</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
