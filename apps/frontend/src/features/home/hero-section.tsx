import Link from 'next/link';
import {
  Calendar,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Star,
  Clock,
  Wrench,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WhatsAppButton } from '@/components/public/whatsapp-button';
import { PublicBusiness } from '@tampilkit-ac/api-contract';

interface HeroSectionProps {
  business?: PublicBusiness | null;
}

export function HeroSection({ business }: HeroSectionProps) {
  const whatsappNumber = business?.whatsappNumber || '6281234567890';

  return (
    <section className="relative bg-gradient-to-br from-slate-950 via-[#102340] to-slate-900 text-white overflow-hidden py-14 sm:py-20 lg:py-24">
      {/* Decorative Glow Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Headline & Action Buttons */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-xs text-sky-300 font-semibold backdrop-blur shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Spesialis Servis & Perawatan AC Jabodetabek</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.18] text-white">
              AC Bermasalah? <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-200">
                Teknisi Profesional
              </span>{' '}
              Siap Membantu Anda.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Pesan layanan cuci rutin, penambahan freon, inspeksi kerusakan, hingga bongkar pasang AC dengan estimasi harga transparan, teknisi berpengalaman, dan garansi pengerjaan 30 hari.
            </p>

            {/* Checklist Keunggulan */}
            <div className="flex flex-wrap gap-y-2 gap-x-5 pt-1 text-xs sm:text-sm text-slate-200 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Teknisi Berpengalaman & Sopan</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Estimasi Biaya Terbuka</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Garansi Servis 30 Hari</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Button asChild size="lg" variant="accent" className="font-bold shadow-lg gap-2 text-sm sm:text-base px-6 h-12">
                <Link href="/booking">
                  <Calendar className="w-5 h-5" />
                  <span>Booking Service Sekarang</span>
                </Link>
              </Button>

              <WhatsAppButton
                phone={whatsappNumber}
                size="lg"
                label="Konsultasi via WA"
                className="h-12 px-5 text-sm sm:text-base"
              />

              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-1.5 h-12 px-5 rounded-md text-sm sm:text-base font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur transition-all shadow-sm"
              >
                <span>Lihat Semua Layanan</span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Trust & Service Card (Desktop) */}
          <div className="lg:col-span-5 w-full">
            <div className="relative rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-6 sm:p-7 shadow-2xl space-y-5 text-slate-100">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Standar Servis CoolCare</h3>
                    <p className="text-[11px] text-slate-300">Pengerjaan Bersih & Rapi</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">
                  Garansi 30 Hari
                </span>
              </div>

              {/* Service Features List */}
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-white">Cuci Bersih Indoor & Outdoor</p>
                      <p className="text-[11px] text-slate-300">Pembersihan talang air & filter</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-cyan-300 shrink-0">~60 Menit</span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Wrench className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-white">Uji Tekanan & Isi Freon</p>
                      <p className="text-[11px] text-slate-300">Manifold gauge akurat (R32/R410)</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-cyan-300 shrink-0">Digital Test</span>
                </div>
              </div>

              {/* Trust Stats Bar */}
              <div className="pt-2 flex items-center justify-between text-xs border-t border-white/10 text-slate-300">
                <div className="flex items-center gap-1.5">
                  <div className="flex text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                  </div>
                  <span className="font-bold text-white text-xs">4.9 / 5.0</span>
                </div>
                <span className="text-[11px] text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Teknisi Siap Datang Hari Ini
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
