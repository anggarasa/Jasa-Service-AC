import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WhatsAppButton } from '@/components/public/whatsapp-button';
import { PublicBusiness } from '@tampilkit-ac/api-contract';

interface CtaSectionProps {
  business?: PublicBusiness | null;
}

export function CtaSection({ business }: CtaSectionProps) {
  const businessName = business?.name || 'CoolCare AC Service';
  const whatsappNumber = business?.whatsappNumber || '6281234567890';

  return (
    <section id="booking-cta" className="py-16 lg:py-20 bg-primary text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4">
          Ingin AC Kembali Dingin, Bersih & Nyaman?
        </h2>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
          Jangan tunggu hingga unit AC Anda rusak total atau boros listrik. Hubungi tim {businessName} sekarang untuk mendapatkan jadwal kunjungan teknisi.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg" variant="accent" className="font-bold shadow-lg gap-2">
            <Link href="/booking">
              <Calendar className="w-5 h-5" />
              <span>Mulai Pemesanan</span>
            </Link>
          </Button>
          <WhatsAppButton
            phone={whatsappNumber}
            size="lg"
            label="Konsultasi WhatsApp"
          />
        </div>
      </div>
    </section>
  );
}
