import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { BookingWizard } from '@/components/booking/booking-wizard';
import { getPublicBusiness, getPublicServices, getPublicServiceAreas } from '@/lib/api/public';
import { PublicServiceItem, PublicServiceArea } from '@tampilkit-ac/api-contract';

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
    title: `Pemesanan Layanan Servis AC | ${businessName}`,
    description: `Pusat reservasi dan pemesanan layanan perawatan, cuci AC, dan perbaikan untuk hunian dan kantor Anda di ${businessName}.`,
    alternates: {
      canonical: '/booking',
    },
  };
}

interface BookingPageProps {
  searchParams: Promise<{
    service?: string;
  }>;
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const params = await searchParams;
  const preselectedServiceId = params.service || '';

  const [servicesRes, areasRes, businessRes] = await Promise.allSettled([
    getPublicServices({ limit: 50 }),
    getPublicServiceAreas(),
    getPublicBusiness(),
  ]);

  const services: PublicServiceItem[] =
    servicesRes.status === 'fulfilled' ? servicesRes.value.items : [];
  const areas: PublicServiceArea[] =
    areasRes.status === 'fulfilled' ? areasRes.value : [];
  const business =
    businessRes.status === 'fulfilled' ? businessRes.value : null;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary transition-colors font-medium mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Beranda
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Formulir Reservasi Servis AC
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Atur jadwal kedatangan teknisi profesional kami tanpa perlu mendaftar akun.
            </p>
          </div>
          {business?.whatsappNumber && (
            <a
              href={`https://wa.me/${business.whatsappNumber}?text=${encodeURIComponent('Halo CoolCare, saya ingin konsultasi mengenai jadwal servis AC.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm self-start sm:self-auto"
            >
              <MessageCircle className="w-4 h-4" /> Bantuan WhatsApp
            </a>
          )}
        </div>
      </div>

      <BookingWizard
        initialServices={services}
        initialAreas={areas}
        preselectedServiceId={preselectedServiceId}
      />
    </div>
  );
}
