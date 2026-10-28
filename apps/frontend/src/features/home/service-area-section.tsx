import { MapPin, CheckCircle, Navigation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/lib/utils';

const AREAS = [
  { city: 'Jakarta Selatan', districts: ['Kebayoran Baru', 'Cilandak', 'Tebet', 'Pasar Minggu', 'Mampang Prapatan'], fee: 0, tag: 'Bebas Biaya Kunjungan' },
  { city: 'Jakarta Barat', districts: ['Kebon Jeruk', 'Kembangan', 'Palmerah'], fee: 20000, tag: 'Tersedia Setiap Hari' },
  { city: 'Tangerang Selatan', districts: ['Serpong & BSD', 'Bintaro', 'Ciputat'], fee: 25000, tag: 'Tersedia Setiap Hari' },
  { city: 'Jakarta Pusat & Timur', districts: ['Tanah Abang', 'Menteng', 'Matraman', 'Duren Sawit'], fee: 20000, tag: 'Konfirmasi Terlebih Dahulu' },
];

export function ServiceAreaSection() {
  return (
    <section id="area-layanan" className="py-16 lg:py-24 bg-slate-50 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
          <Badge variant="secondary" className="px-3 py-1 text-xs uppercase tracking-wider font-semibold text-primary">
            Jangkauan Wilayah
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-primary tracking-tight">
            Cakupan Layanan Teknisi AC
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Teknisi kami siap melayani area pemukiman, apartemen, ruko, dan perkantoran di Jabodetabek.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {AREAS.map((area, index) => (
            <Card key={index} className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-primary text-base">{area.city}</h3>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <span className="font-medium text-slate-500 block">Kecamatan / Wilayah:</span>
                  <p className="leading-relaxed">{area.districts.join(', ')}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Ongkos Kunjungan:</span>
                  <span className="font-bold text-primary">
                    {area.fee === 0 ? 'GRATIS' : formatRupiah(area.fee)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
