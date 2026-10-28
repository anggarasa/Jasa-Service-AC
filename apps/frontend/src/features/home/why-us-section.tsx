import { CheckCircle2, Clock, ShieldCheck, Wind } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface WhyUsSectionProps {
  businessName?: string;
}

export function WhyUsSection({ businessName = 'CoolCare AC Service' }: WhyUsSectionProps) {
  return (
    <section id="keunggulan" className="py-16 lg:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-accent block mb-1">
            Keunggulan Layanan
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">
            Mengapa Memilih {businessName}?
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Kami mengutamakan kejujuran teknis, transparansi biaya, dan kenyamanan pelanggan dalam setiap kunjungan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 border-slate-200 bg-slate-50/50 hover:bg-white transition-colors">
            <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-4">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-primary mb-2">Informasi Layanan Jelas</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Penjelasan teknis diberikan langsung sebelum dan sesudah pengerjaan agar Anda memahami kondisi unit AC.
            </p>
          </Card>

          <Card className="p-6 border-slate-200 bg-slate-50/50 hover:bg-white transition-colors">
            <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-primary mb-2">Jadwal Kunjungan Praktis</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pilih tanggal dan waktu kunjungan sesuai ketersediaan Anda dengan estimasi tiba yang terpantau.
            </p>
          </Card>

          <Card className="p-6 border-slate-200 bg-slate-50/50 hover:bg-white transition-colors">
            <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-primary mb-2">Estimasi Harga Terbuka</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Biaya jasa tertera jelas di katalog tanpa biaya tersembunyi. Pekerjaan ekstra selalu dikonfirmasikan lebih dahulu.
            </p>
          </Card>

          <Card className="p-6 border-slate-200 bg-slate-50/50 hover:bg-white transition-colors">
            <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-4">
              <Wind className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-primary mb-2">Peralatan Standar Industri</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Menggunakan jet pump tekanan terukur, manifold gauge akurat, dan pelindung dinding agar rumah tetap bersih.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
