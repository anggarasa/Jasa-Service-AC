import { MapPin, Navigation, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatRupiah } from '@/lib/utils';
import { PublicServiceArea } from '@tampilkit-ac/api-contract';

interface ServiceAreaCardProps {
  area: PublicServiceArea;
}

export function ServiceAreaCard({ area }: ServiceAreaCardProps) {
  const isFreeVisit = area.visitFeeNumber === 0;

  return (
    <Card className="hover:shadow-md transition-shadow border-slate-200">
      <CardContent className="p-5 flex flex-col justify-between h-full">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-bold text-primary text-base line-clamp-1">{area.name}</h4>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                isFreeVisit
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {isFreeVisit ? 'Bebas Biaya Kunjungan' : `Biaya: ${formatRupiah(area.visitFeeNumber)}`}
            </span>
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>
                {area.district}, {area.city}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Provinsi {area.province}</span>
            </div>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-accent" />
            <span>Estimasi Tiba: ± {area.estimatedTravelMinutes} Menit</span>
          </span>
          <span className="text-[11px] font-medium text-emerald-600">● Terlayani</span>
        </div>
      </CardContent>
    </Card>
  );
}
