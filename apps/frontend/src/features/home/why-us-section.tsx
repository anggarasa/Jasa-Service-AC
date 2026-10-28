import { ShieldCheck, UserCheck, Receipt, Sparkles, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ADVANTAGES = [
  {
    icon: UserCheck,
    title: 'Teknisi Tersertifikasi',
    description: 'Setiap teknisi melewati uji kompetensi pendingin, berlatar belakang jelas, dan bekerja dengan SOP keselamatan kerja.',
  },
  {
    icon: ShieldCheck,
    title: 'Garansi Servis 30 Hari',
    description: 'Jika masalah yang sama timbul kembali dalam 30 hari pasca pengerjaan, teknisi akan datang kembali tanpa tambahan biaya jasa.',
  },
  {
    icon: Receipt,
    title: 'Harga Transparan',
    description: 'Estimasi biaya disampaikan di awal sebelum pengerjaan dimulai. Tidak ada pembengkakan biaya mendadak di akhir servis.',
  },
  {
    icon: Sparkles,
    title: 'Peralatan Higienis & Rapi',
    description: 'Menggunakan terpal pelindung dinding, pelindung lantai, serta pembersihan kembali ruangan setelah pekerjaan selesai.',
  },
];

export function WhyUsSection() {
  return (
    <section id="keunggulan" className="py-16 lg:py-24 bg-slate-50 border-y">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
          <Badge variant="secondary" className="px-3 py-1 text-xs uppercase tracking-wider font-semibold text-primary">
            Mengapa CoolCare AC
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-primary tracking-tight">
            Standar Kerja Lapangan Berkualitas Tinggi
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Kami mengutamakan kejujuran teknisi, kebersihan area kerja, dan ketahanan jangka panjang unit pendingin ruangan Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ADVANTAGES.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card key={index} className="bg-white border-slate-200 shadow-sm hover:border-accent/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary mb-3">
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>
                  <CardTitle className="text-base font-bold text-primary">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
