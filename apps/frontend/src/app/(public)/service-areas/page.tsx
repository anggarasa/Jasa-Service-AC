import { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Navigation, Clock, ShieldCheck, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ServiceAreaCard } from '@/components/public/service-area-card';
import { WhatsAppButton } from '@/components/public/whatsapp-button';
import { EmptyState } from '@/components/public/empty-state';
import { getPublicServiceAreas, getPublicBusiness } from '@/lib/api/public';

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
    title: `Area Jangkauan Servis AC | ${businessName}`,
    description: `Daftar wilayah operasional teknisi AC ${businessName} di Jabodetabek dengan ongkos kunjungan transparan.`,
    alternates: {
      canonical: '/service-areas',
    },
  };
}

export default async function ServiceAreasPage() {
  const [areasRes, businessRes] = await Promise.allSettled([
    getPublicServiceAreas(),
    getPublicBusiness(),
  ]);

  const areas = areasRes.status === 'fulfilled' ? areasRes.value : [];
  const business = businessRes.status === 'fulfilled' ? businessRes.value : null;

  const businessName = business?.name || 'CoolCare AC Service';
  const whatsappNumber = business?.whatsappNumber || '6281234567890';

  // Group areas by city
  const areasByCity = areas.reduce<Record<string, typeof areas>>((acc, area) => {
    const key = `${area.city} (${area.province})`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(area);
    return acc;
  }, {});

  return (
    <div className="py-12 lg:py-16 bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header Breadcrumb & Title */}
        <div className="mb-10 max-w-3xl">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Link href="/" className="hover:text-primary transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <span className="text-primary font-medium">Area Layanan</span>
          </nav>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">
            Wilayah Jangkauan Teknisi CoolCare
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Kami melayani panggilan servis, cuci, dan perawatan AC ke berbagai kawasan hunian dan komersial di Jabodetabek. Ongkos kunjungan dihitung transparan per wilayah.
          </p>
        </div>

        {/* Transparency Alert Box */}
        <div className="mb-10 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed space-y-1">
              <p className="font-bold text-slate-800 text-sm">Ketentuan Ongkos Kunjungan Lapangan</p>
              <p>
                Biaya kunjungan area disajikan terpisah dari tarif servis AC. Bila teknisi melakukan beberapa pekerjaan sekaligus pada satu lokasi, biaya kunjungan hanya dihitung satu kali.
              </p>
            </div>
          </div>
          <WhatsAppButton
            phone={whatsappNumber}
            message="Halo, saya ingin menanyakan apakah alamat saya terjangkau oleh teknisi CoolCare."
            label="Tanya Jangkauan Alamat"
            size="sm"
            className="shrink-0"
          />
        </div>

        {/* Grouped Service Areas */}
        {areas.length > 0 ? (
          <div className="space-y-10">
            {Object.entries(areasByCity).map(([cityLabel, cityAreas]) => (
              <div key={cityLabel} className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <MapPin className="w-4 h-4 text-accent" />
                  <h2 className="text-lg font-bold text-primary">{cityLabel}</h2>
                  <span className="text-xs text-muted-foreground font-normal">
                    ({cityAreas.length} area terdaftar)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {cityAreas.map((area) => (
                    <ServiceAreaCard key={area.id} area={area} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Informasi Area Layanan Belum Tersedia"
            description="Informasi cakupan wilayah operasional sedang diperbarui. Hubungi layanan pelanggan kami untuk memastikan jangkauan teknisi ke alamat Anda."
            actionHref="/contact"
            actionLabel="Hubungi Kontak Layanan"
          />
        )}
      </div>
    </div>
  );
}
