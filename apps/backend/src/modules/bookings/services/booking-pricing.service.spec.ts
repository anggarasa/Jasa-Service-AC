import { PriceType } from '@prisma/client';
import { BookingPricingService } from './booking-pricing.service';

describe('BookingPricingService', () => {
  let service: BookingPricingService;

  beforeEach(() => {
    service = new BookingPricingService();
  });

  it('harus menghitung harga FIXED secara akurat (unitPrice * unitCount + visitFee)', () => {
    const result = service.calculate(PriceType.FIXED, 75000, 3, 25000);
    expect(result.priceType).toBe(PriceType.FIXED);
    expect(result.basePrice).toBe('75000.00');
    expect(result.unitCount).toBe(3);
    expect(result.estimatedServicePrice).toBe('225000.00');
    expect(result.visitFee).toBe('25000.00');
    expect(result.estimatedTotal).toBe('250000.00');
    expect(result.isEstimateOnly).toBe(false);
  });

  it('harus menghitung harga STARTING_FROM dengan flag isEstimateOnly = true', () => {
    const result = service.calculate(PriceType.STARTING_FROM, 60000, 2, 0);
    expect(result.priceType).toBe(PriceType.STARTING_FROM);
    expect(result.basePrice).toBe('60000.00');
    expect(result.estimatedServicePrice).toBe('120000.00');
    expect(result.visitFee).toBe('0.00');
    expect(result.estimatedTotal).toBe('120000.00');
    expect(result.isEstimateOnly).toBe(true);
  });

  it('harus menangani harga INSPECTION_REQUIRED dengan service price null', () => {
    const result = service.calculate(PriceType.INSPECTION_REQUIRED, null, 1, 30000);
    expect(result.priceType).toBe(PriceType.INSPECTION_REQUIRED);
    expect(result.basePrice).toBeNull();
    expect(result.estimatedServicePrice).toBeNull();
    expect(result.visitFee).toBe('30000.00');
    expect(result.estimatedTotal).toBeNull();
    expect(result.isEstimateOnly).toBe(true);
  });
});
