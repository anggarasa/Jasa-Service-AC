import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowRight, Calendar, Sparkles } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PriceLabel } from './price-label';
import { PublicServiceItem } from '@tampilkit-ac/api-contract';

interface ServiceCardProps {
  service: PublicServiceItem;
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden hover:shadow-lg transition-all duration-200 border-slate-200 group">
      {/* Service Cover / Placeholder */}
      <div className="relative w-full h-48 bg-slate-100 overflow-hidden">
        {service.imageUrl ? (
          <Image
            src={service.imageUrl}
            alt={service.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 p-4 text-center">
            <Sparkles className="w-8 h-8 text-slate-300 mb-2" />
            <span className="text-xs font-medium text-slate-500">{service.category?.name || 'Service AC'}</span>
          </div>
        )}
        {service.category && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur text-primary text-xs font-medium shadow-sm">
              {service.category.name}
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-primary group-hover:text-accent transition-colors line-clamp-1">
          <Link href={`/services/${service.slug}`}>{service.name}</Link>
        </CardTitle>
        <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {service.shortDescription || service.description}
        </p>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Clock className="w-3.5 h-3.5 text-accent" />
          <span>Estimasi: ± {service.estimatedDurationMinutes} Menit</span>
        </div>

        <PriceLabel
          priceType={service.priceType}
          basePrice={service.basePrice}
          pricingUnit={service.pricingUnit}
        />
      </CardContent>

      <CardFooter className="pt-0 pb-5 px-6 flex items-center gap-2 border-t border-slate-100 mt-auto">
        <Button asChild variant="outline" size="sm" className="w-1/2 text-xs">
          <Link href={`/services/${service.slug}`} className="gap-1">
            <span>Detail</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </Button>
        <Button asChild variant="accent" size="sm" className="w-1/2 text-xs gap-1 font-semibold">
          <Link href={`/booking?service=${service.id}`}>
            <Calendar className="w-3.5 h-3.5" />
            <span>Booking</span>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
