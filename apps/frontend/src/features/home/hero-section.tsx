import Link from 'next/link';
import { Calendar, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WhatsAppButton } from '@/components/public/whatsapp-button';
import { PublicBusiness } from '@tampilkit-ac/api-contract';

interface HeroSectionProps {
  business?: PublicBusiness | null;
}

export function HeroSection({ business }: HeroSectionProps) {
  const businessName = business?.name || 'CoolCare AC Service';
  const whatsappNumber = business?.whatsappNumber || '6281234567890';

  return (
    <section className="relative bg-gradient-to-b from-slate-900 via-primary to-slate-900 text-white overflow-hidden py-16 lg:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-accent/20 via-transparent to-transparent opacity-60" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-accent font-medium backdrop-blur">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Spesialis Servis & Perawatan AC Jabodetabek</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            AC Bermasalah? <br className="hidden sm:inline" />
            <span className="text-accent">Teknisi Profesional</span> Siap Membantu Anda.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            Pesan layanan cuci rutin, penambahan freon, inspeksi kerusakan, hingga bongkar pasang AC dengan estimasi harga transparan dan teknisi berpengalaman.
          </p>

          <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Teknisi Berpengalaman</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Informasi Harga Terbuka</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Peralatan Lengkap & Bersih</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4">
            <Button asChild size="lg" variant="accent" className="font-bold shadow-lg gap-2">
              <Link href="/booking">
                <Calendar className="w-5 h-5" />
                <span>Booking Service Sekarang</span>
              </Link>
            </Button>
            <WhatsAppButton
              phone={whatsappNumber}
              size="lg"
              label="Konsultasi via WA"
            />
            <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <Link href="/services">Lihat Semua Layanan</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
