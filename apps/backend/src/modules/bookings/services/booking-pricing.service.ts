import { Injectable } from '@nestjs/common';
import { PriceType } from '@prisma/client';

export interface CalculatedPricing {
  priceType: PriceType;
  basePrice: string | null;
  unitCount: number;
  estimatedServicePrice: string | null;
  visitFee: string;
  estimatedTotal: string | null;
  isEstimateOnly: boolean;
}

@Injectable()
export class BookingPricingService {
  calculate(
    priceType: PriceType,
    basePrice: any,
    unitCount: number,
    visitFee: any,
  ): CalculatedPricing {
    const numVisitFee = Number(visitFee || 0);
    const visitFeeStr = numVisitFee.toFixed(2);

    if (priceType === PriceType.INSPECTION_REQUIRED) {
      return {
        priceType,
        basePrice: null,
        unitCount,
        estimatedServicePrice: null,
        visitFee: visitFeeStr,
        estimatedTotal: null,
        isEstimateOnly: true,
      };
    }

    const numBasePrice = Number(basePrice || 0);
    const numServicePrice = numBasePrice * unitCount;
    const numTotal = numServicePrice + numVisitFee;

    return {
      priceType,
      basePrice: numBasePrice.toFixed(2),
      unitCount,
      estimatedServicePrice: numServicePrice.toFixed(2),
      visitFee: visitFeeStr,
      estimatedTotal: numTotal.toFixed(2),
      isEstimateOnly: priceType === PriceType.STARTING_FROM,
    };
  }
}
