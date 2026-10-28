import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceCard } from '@/components/public/service-card';
import { PublicServiceItem } from '@tampilkit-ac/api-contract';

interface ServicesSectionProps {
  services: PublicServiceItem[];
}

// Core services represented: Cuci AC (Perawatan), Isi Freon, Perbaikan AC, Bongkar Pasang
export function ServicesSection({ services }: ServicesSectionProps) {
  return (
    <section id="layanan" className="py-16 lg:py-20 bg-slate-50/60 border-b border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-accent block mb-1">
              Katalog Utama
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">
              Layanan AC Terpopuler
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Pilih paket servis yang sesuai dengan kebutuhan pendingin ruangan di rumah, apartemen, atau kantor Anda.
            </p>
          </div>
          <Button asChild variant="outline" className="self-start md:self-auto gap-2">
            <Link href="/services">
              <span>Katalog Lengkap</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-10">Katalog layanan sedang diperbarui.</p>
        )}
      </div>
    </section>
  );
}
