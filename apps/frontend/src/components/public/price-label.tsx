import { PriceType } from '@tampilkit-ac/api-contract';
import { formatRupiah } from '@/lib/utils';

interface PriceLabelProps {
  priceType: PriceType;
  basePrice?: string | number | null;
  pricingUnit?: string | null;
  className?: string;
  badgeClassName?: string;
}

export function PriceLabel({
  priceType,
  basePrice,
  pricingUnit = 'PER_UNIT',
  className = '',
}: PriceLabelProps) {
  const unitLabel =
    pricingUnit === 'PER_VISIT'
      ? '/ kunjungan'
      : pricingUnit === 'INSPECTION'
        ? '/ inspeksi'
        : '/ unit';

  const numPrice = typeof basePrice === 'string' ? parseFloat(basePrice) : basePrice;

  if (priceType === 'INSPECTION_REQUIRED') {
    return (
      <div className={`flex flex-col ${className}`}>
        <span className="text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 rounded-md px-2.5 py-1 w-fit">
          Harga setelah inspeksi teknisi
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">
          Estimasi biaya disepakati di lokasi
        </span>
      </div>
    );
  }

  if (priceType === 'STARTING_FROM') {
    return (
      <div className={`flex flex-col ${className}`}>
        <span className="text-xs text-muted-foreground font-medium">Mulai dari</span>
        <span className="text-lg font-bold text-primary">
          {numPrice ? formatRupiah(numPrice) : 'Rp—'}{' '}
          <span className="text-xs font-normal text-muted-foreground">{unitLabel}</span>
        </span>
      </div>
    );
  }

  // FIXED
  return (
    <div className={`flex flex-col ${className}`}>
      <span className="text-xs text-muted-foreground font-medium">Tarif tetap</span>
      <span className="text-lg font-bold text-primary">
        {numPrice ? formatRupiah(numPrice) : 'Rp—'}{' '}
        <span className="text-xs font-normal text-muted-foreground">{unitLabel}</span>
      </span>
    </div>
  );
}
