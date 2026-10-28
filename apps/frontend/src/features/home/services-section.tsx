'use client';

import { Sparkles, Wind, Gauge, Wrench, Shield, Clock, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/utils';

interface ServiceCardItem {
  id: string;
  name: string;
  category: string;
  description: string;
  priceNote: string;
  price: number;
  duration: string;
  badge?: string;
  icon: typeof Wind;
  popular?: boolean;
}

const DEMO_SERVICES: ServiceCardItem[] = [
  {
    id: 'cuci-ac-standar',
    name: 'Cuci AC Split Standar',
    category: 'Pembersihan',
    description: 'Pembersihan evaporator, blower indoor, filter udara, dan condensor unit outdoor secara menyeluruh dengan jet pump.',
    priceNote: 'Mulai dari',
    price: 75000,
    duration: '± 60 Menit',
    badge: 'Paling Diminati',
    icon: Wind,
    popular: true,
  },
  {
    id: 'isi-tambah-freon',
    name: 'Isi & Tambah Freon',
    category: 'Perawatan Freon',
    description: 'Pengecekan tekanan manifold gauge, deteksi kebocoran halus, dan pengisian freon R32 / R410A sesuai standar pabrik.',
    priceNote: 'Mulai dari',
    price: 150000,
    duration: '± 45 Menit',
    icon: Gauge,
  },
  {
    id: 'pemeriksaan-perbaikan-ac',
    name: 'Inspeksi & Perbaikan AC',
    category: 'Reparasi & Diagnosa',
    description: 'Diagnosa mendalam untuk AC tidak dingin, meneteskan air, bau tidak sedap, kipas mati, atau error indikator.',
    priceNote: 'Estimasi Biaya',
    price: 0,
    duration: '± 90 Menit',
    badge: 'Inspeksi Awal',
    icon: Wrench,
  },
  {
    id: 'bongkar-pasang-ac',
    name: 'Bongkar Pasang AC Baru / Lama',
    category: 'Instalasi',
    description: 'Pemasangan bracket outdoor, instalasi pipa tembaga tebal, kabel power, drainase air rapi, dan proses vakum pipa.',
    priceNote: 'Mulai dari',
    price: 350000,
    duration: '± 120 Menit',
    icon: Sparkles,
  },
];

export function ServicesSection() {
  const handleSelectService = (name: string) => {
    const el = document.getElementById('booking-cta');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="layanan" className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-12">
          <Badge variant="secondary" className="px-3 py-1 text-xs uppercase tracking-wider font-semibold text-primary">
            Layanan Unggulan
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-primary tracking-tight">
            Pilihan Solusi AC Lengkap & Bergaransi
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Semua layanan dikerjakan menggunakan peralatan terstandarisasi dengan jaminan kebersihan rumah Anda.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DEMO_SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <Card
                key={service.id}
                className={`flex flex-col relative border transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
                  service.popular ? 'border-accent shadow-sm' : 'border-slate-200'
                }`}
              >
                {service.badge && (
                  <div className="absolute -top-3 left-6">
                    <Badge variant={service.popular ? 'accent' : 'secondary'} className="text-[11px] font-semibold">
                      {service.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="pt-7 pb-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-primary mb-3">
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                    {service.category}
                  </span>
                  <CardTitle className="text-lg font-bold text-primary leading-tight mt-1">
                    {service.name}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 pb-4">
                  <CardDescription className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                    {service.description}
                  </CardDescription>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {service.duration}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-emerald-600">
                      <Shield className="w-3.5 h-3.5" /> Garansi 30 Hari
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 pb-6 flex flex-col items-start gap-3 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">{service.priceNote}</span>
                    <div className="text-lg font-extrabold text-primary">
                      {service.price === 0 ? 'Sesuai Diagnosa' : formatRupiah(service.price)}
                    </div>
                  </div>

                  <Button
                    variant={service.popular ? 'accent' : 'outline'}
                    size="sm"
                    className="w-full gap-1.5 font-semibold text-xs"
                    onClick={() => handleSelectService(service.name)}
                  >
                    <span>Pilih Layanan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Demo Notice Banner */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 bg-slate-50 inline-block px-4 py-2 rounded-full border border-slate-200">
            * Daftar harga di atas merupakan simulasi katalog data demo. Harga aktual disesuaikan dengan kapasitas PK & jenis unit.
          </p>
        </div>
      </div>
    </section>
  );
}
