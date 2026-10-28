'use client';

import { ShieldCheck, CheckCircle2, Clock, Calendar, ArrowRight, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function HeroSection() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-secondary/50 via-background to-background pt-12 pb-16 lg:pt-20 lg:pb-24 border-b">
      {/* Background Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent shadow-sm">
            <Award className="w-4 h-4 text-accent" />
            <span>Spesialis Servis AC Rumah & Kantor Terpercaya</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-primary tracking-tight leading-[1.15]">
            AC Bermasalah?{' '}
            <span className="text-accent underline decoration-accent/30 decoration-wavy">
              Teknisi Profesional
            </span>{' '}
            Siap Membantu.
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Pesan layanan cuci, perawatan, dan perbaikan AC dengan jadwal kunjungan yang praktis dan harga transparan. Dikerjakan oleh teknisi bersertifikasi dengan jaminan garansi.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="accent"
              size="lg"
              className="w-full sm:w-auto gap-2 shadow-md hover:shadow-lg transition-shadow text-base font-semibold"
              onClick={() => scrollTo('booking-cta')}
            >
              <Calendar className="w-5 h-5" />
              <span>Booking Service AC</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto gap-2 text-base font-semibold border-slate-300 hover:bg-slate-100"
              onClick={() => scrollTo('layanan')}
            >
              <span>Lihat Layanan & Harga</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Value Highlights Pill Row */}
          <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm font-medium text-slate-600">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Garansi Servis 30 Hari</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-accent shrink-0" />
              <span>Teknisi Hadir Tepat Waktu</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Harga Terbuka Tanpa Sembunyi</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
