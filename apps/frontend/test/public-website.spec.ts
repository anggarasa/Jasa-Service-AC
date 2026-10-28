import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  PublicBusinessSchema,
  PublicServiceItemSchema,
  PublicServiceAreaSchema,
} from '@tampilkit-ac/api-contract';

describe('Frontend Public Website & SEO Test Suite (Phase 04)', () => {
  it('should validate PublicBusinessSchema correctly', () => {
    const raw = {
      name: 'CoolCare AC Service',
      slug: 'coolcare-ac',
      description: 'Spesialis cuci dan servis AC',
      phone: '+62 812-3456-7890',
      whatsappNumber: '6281234567890',
      email: 'halo@coolcare.id',
      address: 'Jl. Merdeka No. 45',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12160',
      googleMapsUrl: 'https://maps.google.com/?q=-6.2088,106.8456',
      timezone: 'Asia/Jakarta',
      logoMediaUrl: null,
      isOpenForPublicDisplay: true,
    };

    const parsed = PublicBusinessSchema.parse(raw);
    assert.strictEqual(parsed.name, 'CoolCare AC Service');
    assert.strictEqual(parsed.city, 'Jakarta Selatan');
    assert.strictEqual(parsed.isOpenForPublicDisplay, true);
  });

  it('should validate PublicServiceItemSchema for FIXED, STARTING_FROM, and INSPECTION_REQUIRED', () => {
    // 1. FIXED
    const fixed = PublicServiceItemSchema.parse({
      id: 'srv-1',
      name: 'Cuci AC Standar',
      slug: 'cuci-ac-standar',
      description: 'Pembersihan unit AC',
      priceType: 'FIXED',
      basePrice: '75000.00',
      basePriceNumber: 75000,
      pricingUnit: 'PER_UNIT',
      estimatedDurationMinutes: 60,
      minimumUnits: 1,
      maximumUnits: 10,
    });
    assert.strictEqual(fixed.priceType, 'FIXED');
    assert.strictEqual(fixed.basePriceNumber, 75000);

    // 2. STARTING_FROM
    const startingFrom = PublicServiceItemSchema.parse({
      id: 'srv-2',
      name: 'Isi Freon',
      slug: 'isi-freon',
      description: 'Penambahan freon R32',
      priceType: 'STARTING_FROM',
      basePrice: '150000.00',
      basePriceNumber: 150000,
      pricingUnit: 'PER_UNIT',
      estimatedDurationMinutes: 45,
      minimumUnits: 1,
      maximumUnits: 8,
    });
    assert.strictEqual(startingFrom.priceType, 'STARTING_FROM');

    // 3. INSPECTION_REQUIRED (basePrice is null, no fake Rp0)
    const inspection = PublicServiceItemSchema.parse({
      id: 'srv-3',
      name: 'Perbaikan Kompresor',
      slug: 'perbaikan-kompresor',
      description: 'Diagnosa teknisi di lokasi',
      priceType: 'INSPECTION_REQUIRED',
      basePrice: null,
      basePriceNumber: null,
      pricingUnit: 'INSPECTION',
      estimatedDurationMinutes: 90,
      minimumUnits: 1,
      maximumUnits: 5,
    });
    assert.strictEqual(inspection.priceType, 'INSPECTION_REQUIRED');
    assert.strictEqual(inspection.basePrice, null);
    assert.strictEqual(inspection.basePriceNumber, null);
  });

  it('should format WhatsApp URL with normalized phone numbers and URL encoded message', () => {
    const rawPhone = '+62 812-3456-7890';
    const message = 'Halo CoolCare AC, saya ingin booking cuci AC.';
    const cleanNumber = rawPhone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

    assert.strictEqual(cleanNumber, '6281234567890');
    assert.ok(url.startsWith('https://wa.me/6281234567890?text=Halo%20CoolCare'));
  });

  it('should validate ServiceArea schema with decimal visitFee and travel time', () => {
    const area = PublicServiceAreaSchema.parse({
      id: 'area-1',
      name: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      city: 'Jakarta Selatan',
      district: 'Kebayoran Baru',
      visitFee: '0.00',
      visitFeeNumber: 0,
      estimatedTravelMinutes: 20,
    });

    assert.strictEqual(area.city, 'Jakarta Selatan');
    assert.strictEqual(area.visitFeeNumber, 0);
    assert.strictEqual(area.estimatedTravelMinutes, 20);
  });
});
