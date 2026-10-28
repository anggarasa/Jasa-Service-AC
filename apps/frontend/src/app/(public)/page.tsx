import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroSection } from '@/features/home/hero-section';
import { ServicesSection } from '@/features/home/services-section';
import { WhyUsSection } from '@/features/home/why-us-section';
import { HowItWorksSection } from '@/features/home/how-it-works-section';
import { ServiceAreaSection } from '@/features/home/service-area-section';
import { CtaSection } from '@/features/home/cta-section';
import { GalleryGrid } from '@/components/public/gallery-grid';
import {
  getPublicBusiness,
  getPublicServices,
  getPublicServiceAreas,
  getPublicGallery,
} from '@/lib/api/public';

export const revalidate = 60; // Cache freshness policy (1 minute)

export default async function HomePage() {
  const [businessRes, servicesRes, areasRes, galleryRes] = await Promise.allSettled([
    getPublicBusiness(),
    getPublicServices({ limit: 4 }),
    getPublicServiceAreas(),
    getPublicGallery(),
  ]);

  const business = businessRes.status === 'fulfilled' ? businessRes.value : null;
  const services = servicesRes.status === 'fulfilled' ? servicesRes.value.items : [];
  const areas = areasRes.status === 'fulfilled' ? areasRes.value.slice(0, 6) : [];
  const gallery = galleryRes.status === 'fulfilled' ? galleryRes.value.slice(0, 4) : [];

  const businessName = business?.name || 'CoolCare AC Service';

  return (
    <div className="flex flex-col">
      {/* Required Section Components: <HeroSection /> <ServicesSection /> <WhyUsSection /> <HowItWorksSection /> <ServiceAreaSection /> <CtaSection /> */}
      <HeroSection business={business} />
      <ServicesSection services={services} />
      <WhyUsSection businessName={businessName} />
      <HowItWorksSection />
      <ServiceAreaSection areas={areas} />

      {/* 6. Gallery Preview Section (If items exist) */}
      {gallery.length > 0 && (
        <section className="py-16 bg-slate-50/60 border-b border-slate-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-accent block mb-1">
                  Dokumentasi Lapangan
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">
                  Galeri Pengerjaan Teknisi
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Bukti nyata proses pengerjaan servis AC oleh tim teknisi kami.
                </p>
              </div>
              <Button asChild variant="outline" className="self-start md:self-auto gap-2">
                <Link href="/gallery">
                  <span>Lihat Semua Foto</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            <GalleryGrid items={gallery} />
          </div>
        </section>
      )}

      {/* 7. Contact CTA Section */}
      <CtaSection business={business} />
    </div>
  );
}
