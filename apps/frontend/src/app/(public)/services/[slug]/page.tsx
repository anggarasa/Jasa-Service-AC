import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  Clock,
  Calendar,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PriceLabel } from '@/components/public/price-label';
import { WhatsAppButton } from '@/components/public/whatsapp-button';
import { getPublicServiceBySlug, getPublicBusiness } from '@/lib/api/public';

export const revalidate = 60;

interface ServiceDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [service, business] = await Promise.all([
      getPublicServiceBySlug(slug),
      getPublicBusiness().catch(() => null),
    ]);

    const businessName = business?.name || 'CoolCare AC Service';
    const desc = service.shortDescription || service.description.slice(0, 160);

    return {
      title: `${service.name} | ${businessName}`,
      description: desc,
      alternates: {
        canonical: `/services/${slug}`,
      },
      openGraph: {
        title: `${service.name} | ${businessName}`,
        description: desc,
        type: 'article',
        ...(service.imageUrl ? { images: [{ url: service.imageUrl }] } : {}),
      },
    };
  } catch {
    return {
      title: 'Layanan Tidak Ditemukan | CoolCare AC Service',
    };
  }
}

export default async function ServiceDetailPage({
  params,
}: ServiceDetailPageProps) {
  const { slug } = await params;

  let service;
  let business;
  try {
    [service, business] = await Promise.all([
      getPublicServiceBySlug(slug),
      getPublicBusiness().catch(() => null),
    ]);
  } catch (err: unknown) {
    notFound();
  }

  const businessName = business?.name || 'CoolCare AC Service';
  const whatsappNumber = business?.whatsappNumber || '6281234567890';

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.shortDescription || service.description,
    provider: {
      '@type': 'LocalBusiness',
      name: businessName,
      telephone: business?.phone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: business?.address,
        addressLocality: business?.city,
        addressRegion: business?.province,
        postalCode: business?.postalCode,
        addressCountry: 'ID',
      },
    },
    ...(service.basePriceNumber
      ? {
          offers: {
            '@type': 'Offer',
            price: service.basePriceNumber,
            priceCurrency: 'IDR',
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="py-12 bg-slate-50 min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
            <Link href="/" className="hover:text-primary transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <Link href="/services" className="hover:text-primary transition-colors">
              Layanan
            </Link>
            <span>/</span>
            {service.category && (
              <>
                <Link
                  href={`/services?category=${service.category.slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {service.category.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-primary font-medium truncate max-w-[200px]">
              {service.name}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Columns: Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cover Image */}
              <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden bg-slate-200 border border-slate-200 shadow-sm">
                {service.imageUrl ? (
                  <Image
                    src={service.imageUrl}
                    alt={service.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                    <Sparkles className="w-12 h-12 text-slate-300 mb-2" />
                    <span className="text-sm font-medium text-slate-500">
                      Dokumentasi Servis AC
                    </span>
                  </div>
                )}
                {service.category && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-primary text-white font-medium px-3 py-1 text-xs shadow-md">
                      {service.category.name}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Title & Short Description */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h1 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
                  {service.name}
                </h1>
                {service.shortDescription && (
                  <p className="text-sm font-medium text-accent">
                    {service.shortDescription}
                  </p>
                )}

                {/* Duration & Units Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent shrink-0" />
                    <div>
                      <span className="block text-[11px] text-muted-foreground">Estimasi Waktu</span>
                      <span className="text-xs font-bold text-slate-800">
                        ± {service.estimatedDurationMinutes} Menit
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-[11px] text-muted-foreground">Batas Satuan Unit</span>
                    <span className="text-xs font-bold text-slate-800">
                      {service.minimumUnits} s/d {service.maximumUnits} Unit AC
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-muted-foreground">Kategori</span>
                    <span className="text-xs font-bold text-slate-800">
                      {service.category?.name || 'Umum'}
                    </span>
                  </div>
                </div>

                {/* Long Description */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <h3 className="text-sm font-bold text-primary">Deskripsi Pekerjaan</h3>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {service.description}
                  </p>
                </div>

                {/* Field Service Guarantee / Notice */}
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">
                      Standar Pengerjaan Lapangan CoolCare
                    </p>
                    <p>
                      Setiap pekerjaan dilakukan dengan peralatan teknis lengkap, pengecekan tekanan kompresor, dan perlindungan kebersihan area hunian pelanggan.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Column: Booking Card & Action */}
            <div className="space-y-6">
              <Card className="p-6 border-slate-200 bg-white shadow-md sticky top-24">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                  Penetapan Harga
                </span>

                <PriceLabel
                  priceType={service.priceType}
                  basePrice={service.basePrice}
                  pricingUnit={service.pricingUnit}
                  className="mb-4"
                />

                <div className="text-xs text-slate-500 space-y-2 mb-6 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                    <span>
                      Biaya kunjungan area dihitung terpisah sesuai wilayah tujuan.{' '}
                      <Link href="/service-areas" className="text-accent underline font-medium">
                        Cek Area Layanan
                      </Link>
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button asChild size="lg" variant="accent" className="w-full font-bold shadow-md gap-2">
                    <Link href={`/booking?service=${service.id}`}>
                      <Calendar className="w-4 h-4" />
                      <span>Booking Layanan Ini</span>
                    </Link>
                  </Button>

                  <WhatsAppButton
                    phone={whatsappNumber}
                    message={`Halo ${businessName}, saya ingin konsultasi mengenai layanan ${service.name}.`}
                    label="Tanya via WhatsApp"
                    className="w-full"
                  />
                </div>
              </Card>

              {/* Related Services */}
              {service.relatedServices && service.relatedServices.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-primary">Layanan Terkait Lainnya</h3>
                  <div className="space-y-3">
                    {service.relatedServices.map((rel) => (
                      <Link
                        key={rel.id}
                        href={`/services/${rel.slug}`}
                        className="group block p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <h4 className="text-xs font-bold text-primary group-hover:text-accent transition-colors">
                          {rel.name}
                        </h4>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                          <span>± {rel.estimatedDurationMinutes} Menit</span>
                          <span className="font-semibold text-slate-700">
                            {rel.priceType === 'INSPECTION_REQUIRED'
                              ? 'Periksa dahulu'
                              : rel.basePriceNumber
                                ? `Rp${rel.basePriceNumber.toLocaleString('id-ID')}`
                                : '—'}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
