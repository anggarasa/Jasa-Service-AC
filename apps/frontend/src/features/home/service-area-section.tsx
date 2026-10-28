import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceAreaCard } from '@/components/public/service-area-card';
import { PublicServiceArea } from '@tampilkit-ac/api-contract';

interface ServiceAreaSectionProps {
  areas: PublicServiceArea[];
}

export function ServiceAreaSection({ areas }: ServiceAreaSectionProps) {
  return (
    <section id="area-layanan" className="py-16 bg-white border-b border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-accent block mb-1">
              Jangkauan Operasional
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">
              Cakupan Area Layanan
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Teknisi CoolCare siap melayani wilayah Jabodetabek dengan ongkos kunjungan transparan.
            </p>
          </div>
          <Button asChild variant="outline" className="self-start md:self-auto gap-2">
            <Link href="/service-areas">
              <span>Lihat Semua Area</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {areas.map((area) => (
            <ServiceAreaCard key={area.id} area={area} />
          ))}
        </div>
      </div>
    </section>
  );
}
