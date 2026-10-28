import { CalendarCheck, UserCheck2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STEPS = [
  {
    step: '01',
    icon: CalendarCheck,
    title: 'Pilih Layanan & Jadwal',
    description: 'Tentukan jenis servis yang dibutuhkan (cuci, freon, perbaikan) dan tentukan tanggal serta jam kunjungan teknisi.',
  },
  {
    step: '02',
    icon: UserCheck2,
    title: 'Teknisi Menuju Lokasi',
    description: 'Sistem menugaskan teknisi terdekat. Anda menerima konfirmasi jadwal dan perkiraan waktu tiba teknisi.',
  },
  {
    step: '03',
    icon: ShieldCheck,
    title: 'Servis Beres & Bergaransi',
    description: 'Pengerjaan dilakukan rapi sesuai SOP. Anda melakukan pembayaran setelah AC dingin optimal dan kartu garansi aktif.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="cara-kerja" className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
          <Badge variant="secondary" className="px-3 py-1 text-xs uppercase tracking-wider font-semibold text-primary">
            Alur Pemesanan
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-primary tracking-tight">
            3 Langkah Mudah Memanggil Teknisi
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Tanpa repot antre atau menunggu seharian. Jadwal kunjungan jelas dan terpantau.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-slate-50 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-lg mb-4 shadow-md relative">
                  <Icon className="w-7 h-7 text-accent" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent text-white text-xs flex items-center justify-center font-extrabold border-2 border-white">
                    {idx + 1}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-primary mb-2">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
