import { Metadata } from 'next';
import Link from 'next/link';
import { Wind, ShieldCheck, CheckCircle2, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { WhatsAppButton } from '@/components/public/whatsapp-button';
import { GalleryGrid } from '@/components/public/gallery-grid';
import {
  getPublicBusiness,
  getPublicCategories,
  getPublicServiceAreas,
  getPublicGallery,
} from '@/lib/api/public';

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
    title: `Tentang Kami | ${businessName}`,
    description: `Mengenal ${businessName}, penyedia layanan servis cuci, perawatan berkala, dan perbaikan AC terpercaya di Jabodetabek.`,
    alternates: {
      canonical: '/about',
    },
  };
}

export default async function AboutPage() {
  const [businessRes, categoriesRes, areasRes, galleryRes] = await Promise.allSettled([
    getPublicBusiness(),
    getPublicCategories(),
    getPublicServiceAreas(),
    getPublicGallery(),
  ]);

  const business = businessRes.status === 'fulfilled' ? businessRes.value : null;
  const categories = categoriesRes.status === 'fulfilled' ? categoriesRes.value : [];
  const areas = areasRes.status === 'fulfilled' ? areasRes.value : [];
  const gallery = galleryRes.status === 'fulfilled' ? galleryRes.value.slice(0, 4) : [];

  const businessName = business?.name || 'CoolCare AC Service';
  const whatsappNumber = business?.whatsappNumber || '6281234567890';

  return (
    <div className="py-12 lg:py-16 bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl space-y-12">
        {/* Breadcrumb & Title */}
        <div>
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Link href="/" className="hover:text-primary transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <span className="text-primary font-medium">Tentang Kami</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-black text-primary tracking-tight">
            Tentang {businessName}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Dedikasi kami adalah menghadirkan udara bersih, sejuk, dan sehat di setiap ruangan tempat Anda beraktivitas.
          </p>
        </div>

        {/* Business Story Card */}
        <Card className="p-6 sm:p-8 border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 text-accent flex items-center justify-center">
              <Wind className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary">{businessName}</h2>
              <span className="text-xs text-muted-foreground">
                {business?.city || 'Jakarta Selatan'}, {business?.province || 'DKI Jakarta'}
              </span>
            </div>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed">
            {business?.description ||
              'Layanan spesialis cuci, perawatan berkala, perbaikan, dan instalasi AC profesional di Jabodetabek dengan teknisi berpengalaman dan tarif yang transparan.'}
          </p>

          <p className="text-sm text-slate-600 leading-relaxed">
            Kami memahami bahwa pendingin ruangan (AC) yang kotor atau kurang freon bukan hanya membuat suhu ruangan tidak nyaman, tetapi juga menjadi sarang debu dan memicu pemborosan tagihan listrik. Melalui prosedur pembersihan menyeluruh dan diagnosa presisi, kami memastikan unit AC Anda beroperasi dengan efisiensi maksimal.
          </p>
        </Card>

        {/* Specialties / Available Categories */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-primary">Keahlian & Bidang Layanan</h3>
          <p className="text-xs text-muted-foreground">
            Layanan kami mencakup berbagai kategori perawatan unit AC tipe split, inverter, maupun kaset komersial:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-primary">{cat.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {cat.description || 'Pengerjaan berstandar teknis dengan jaminan hasil bersih dan rapi.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Values */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-primary">Prinsip Pelayanan Kami</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-white border border-slate-200">
              <h4 className="font-bold text-sm text-primary mb-1">Transparansi Harga</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Biaya jasa tertera jelas di muka. Segala tindakan perbaikan tambahan selalu dijelaskan kepada pelanggan terlebih dahulu.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-white border border-slate-200">
              <h4 className="font-bold text-sm text-primary mb-1">Kebersihan Lokasi</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Teknisi menggunakan plastik pelindung dinding dan penampung air agar lantai dan perabot rumah Anda tetap terjaga bersih.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-white border border-slate-200">
              <h4 className="font-bold text-sm text-primary mb-1">Peralatan Terkalibrasi</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Manifold gauge, alat vakum, dan jet pump tekanan presisi menjamin pengerjaan tuntas tanpa merusak sirip evaporator.
              </p>
            </div>
          </div>
        </div>

        {/* Gallery Preview */}
        {gallery.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-primary">Dokumentasi Kerja</h3>
              <Link href="/gallery" className="text-xs font-semibold text-accent hover:underline">
                Lihat Galeri Lengkap →
              </Link>
            </div>
            <GalleryGrid items={gallery} />
          </div>
        )}

        {/* CTA Bar */}
        <div className="p-8 rounded-2xl bg-primary text-white text-center space-y-4">
          <h3 className="text-xl font-bold">Siap Menjadwalkan Servis AC Anda?</h3>
          <p className="text-xs text-slate-300 max-w-lg mx-auto">
            Tim teknisi {businessName} siap datang ke lokasi Anda sesuai jadwal yang disepakati.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button asChild variant="accent" size="lg" className="font-bold gap-2">
              <Link href="/booking">
                <Calendar className="w-4 h-4" />
                <span>Pesan Layanan Sekarang</span>
              </Link>
            </Button>
            <WhatsAppButton
              phone={whatsappNumber}
              size="lg"
              label="Hubungi via WhatsApp"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
