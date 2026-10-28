import { Metadata } from 'next';
import Link from 'next/link';
import { GalleryGrid } from '@/components/public/gallery-grid';
import { EmptyState } from '@/components/public/empty-state';
import { getPublicGallery, getPublicBusiness } from '@/lib/api/public';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  let businessName = 'CoolCare AC Service';
  try {
    const b = await getPublicBusiness();
    businessName = b.name;
  } catch {
    // fallback
  }

  return {
    title: `Galeri Pengerjaan Servis AC | ${businessName}`,
    description: `Dokumentasi foto nyata pengerjaan servis cuci AC, perbaikan pipa, dan pengisian freon oleh tim teknisi ${businessName}.`,
    alternates: {
      canonical: '/gallery',
    },
  };
}

export default async function GalleryPage() {
  const [galleryRes, businessRes] = await Promise.allSettled([
    getPublicGallery(),
    getPublicBusiness(),
  ]);

  const items = galleryRes.status === 'fulfilled' ? galleryRes.value : [];
  const business = businessRes.status === 'fulfilled' ? businessRes.value : null;
  const businessName = business?.name || 'CoolCare AC Service';

  return (
    <div className="py-12 lg:py-16 bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header Breadcrumb & Title */}
        <div className="mb-10 max-w-2xl">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Link href="/" className="hover:text-primary transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <span className="text-primary font-medium">Galeri</span>
          </nav>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">
            Dokumentasi Pengerjaan Teknisi
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Foto-foto asli proses pembersihan unit indoor & outdoor, penanganan kompresor, dan instalasi AC yang dikerjakan langsung di lokasi pelanggan.
          </p>
        </div>

        {items.length > 0 ? (
          <GalleryGrid items={items} />
        ) : (
          <EmptyState
            title="Galeri Belum Memuat Foto"
            description="Dokumentasi pengerjaan sedang disiapkan oleh tim teknisi. Silakan cek kembali dalam waktu dekat."
            actionHref="/"
            actionLabel="Kembali ke Beranda"
          />
        )}
      </div>
    </div>
  );
}
