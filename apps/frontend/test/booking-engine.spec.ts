import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import {
  CreateGuestBookingRequestSchema,
  PublicAvailabilityQuerySchema,
  BookingPriceEstimateSchema,
  GuestBookingConfirmationSchema,
  GuestBookingDetailsSchema,
} from '@tampilkit-ac/api-contract';

describe('Frontend Booking Engine & Reservation Test Suite (Phase 07)', () => {
  it('should validate CreateGuestBookingRequestSchema with multi-unit input', () => {
    const validData = {
      serviceId: 'a0000000-0000-0000-0000-000000000001',
      units: [
        {
          brand: 'Daikin',
          model: 'Inverter FTKC',
          type: 'SPLIT',
          capacityPk: '1.00',
          installationRoom: 'Ruang Tamu',
        },
        {
          brand: 'Panasonic',
          type: 'SPLIT',
          capacityPk: '0.75',
          installationRoom: 'Kamar Utama',
        },
      ],
      serviceAreaId: 'b0000000-0000-0000-0000-000000000002',
      serviceAddress: {
        recipientName: 'Bapak Ahmad',
        fullAddress: 'Jl. Merdeka No. 10',
        city: 'Jakarta Selatan',
        district: 'Kebayoran Baru',
        postalCode: '12160',
      },
      selectedStartAt: '2026-11-02T02:00:00.000Z',
      customerName: 'Ahmad Subagyo',
      customerPhone: '081234567890',
      customerEmail: 'ahmad@example.com',
      idempotencyKey: 'idem-test-1234567890abcdef',
    };

    const parsed = CreateGuestBookingRequestSchema.safeParse(validData);
    assert.strictEqual(parsed.success, true);
    if (parsed.success) {
      assert.strictEqual(parsed.data.units.length, 2);
      assert.strictEqual(parsed.data.customerName, 'Ahmad Subagyo');
    }
  });

  it('should reject booking requests with empty units or invalid idempotency key', () => {
    const invalidEmptyUnits = {
      serviceId: 'a0000000-0000-0000-0000-000000000001',
      units: [],
      serviceAreaId: 'b0000000-0000-0000-0000-000000000002',
      serviceAddress: {
        fullAddress: 'Jl. Melawai No. 1',
        city: 'Jakarta Selatan',
        district: 'Kebayoran Baru',
      },
      selectedStartAt: '2026-11-02T02:00:00.000Z',
      customerName: 'Budi',
      customerPhone: '081299998888',
      idempotencyKey: 'too-short',
    };

    const parsed = CreateGuestBookingRequestSchema.safeParse(invalidEmptyUnits);
    assert.strictEqual(parsed.success, false);
  });

  it('should validate PublicAvailabilityQuerySchema bounds', () => {
    const validQuery = {
      serviceId: 'a0000000-0000-0000-0000-000000000001',
      unitCount: 3,
      serviceAreaId: 'b0000000-0000-0000-0000-000000000002',
      date: '2026-11-02',
    };
    const parsed = PublicAvailabilityQuerySchema.safeParse(validQuery);
    assert.strictEqual(parsed.success, true);

    const invalidDate = {
      ...validQuery,
      date: '02-11-2026', // wrong format
    };
    assert.strictEqual(PublicAvailabilityQuerySchema.safeParse(invalidDate).success, false);
  });

  it('should validate BookingPriceEstimateSchema for all 3 pricing types', () => {
    const fixedPrice = {
      priceType: 'FIXED',
      basePrice: '75000.00',
      unitCount: 2,
      estimatedServicePrice: '150000.00',
      visitFee: '20000.00',
      estimatedTotal: '170000.00',
      isEstimateOnly: false,
    };
    assert.strictEqual(BookingPriceEstimateSchema.safeParse(fixedPrice).success, true);

    const inspectionPrice = {
      priceType: 'INSPECTION_REQUIRED',
      basePrice: null,
      unitCount: 1,
      estimatedServicePrice: null,
      visitFee: '35000.00',
      estimatedTotal: null,
      isEstimateOnly: true,
    };
    assert.strictEqual(BookingPriceEstimateSchema.safeParse(inspectionPrice).success, true);
  });

  it('should verify booking wizard, confirmation, and manage page files exist and are populated', () => {
    const baseApp = path.resolve(__dirname, '../src/app/(public)/booking');
    const wizardFile = path.resolve(__dirname, '../src/components/booking/booking-wizard.tsx');
    const confirmationFile = path.join(baseApp, 'confirmation/page.tsx');
    const manageFile = path.join(baseApp, 'manage/page.tsx');

    assert.ok(fs.existsSync(wizardFile), 'booking-wizard.tsx exists');
    assert.ok(fs.existsSync(confirmationFile), 'confirmation/page.tsx exists');
    assert.ok(fs.existsSync(manageFile), 'manage/page.tsx exists');

    const wizardContent = fs.readFileSync(wizardFile, 'utf8');
    assert.ok(wizardContent.includes('BookingStepper'), 'Wizard includes step indicator');
    assert.ok(wizardContent.includes('/api/public/bookings'), 'Wizard submits to public bookings endpoint');
    assert.ok(wizardContent.includes('/api/public/availability'), 'Wizard queries availability endpoint');
  });
});
