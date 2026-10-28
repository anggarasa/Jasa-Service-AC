import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeIndonesianPhone,
  CreateCustomerSchema,
  CustomerAddressSchema,
  CreateCustomerAddressSchema,
  AcUnitSchema,
  CreateAcUnitSchema,
  MoveAcUnitAddressSchema,
  CustomerHistorySchema,
} from '@tampilkit-ac/api-contract';

describe('Frontend Customer & AC Unit Management Test Suite (Phase 05)', () => {
  it('should correctly normalize Indonesian phone numbers across various formats', () => {
    // 08xx standard format
    const res1 = normalizeIndonesianPhone('081234567890');
    assert.equal(res1.isValid, true);
    assert.equal(res1.normalized, '+6281234567890');
    assert.equal(res1.display, '0812-3456-7890');

    // +628xx international format
    const res2 = normalizeIndonesianPhone('+6281234567890');
    assert.equal(res2.isValid, true);
    assert.equal(res2.normalized, '+6281234567890');

    // 628xx without plus
    const res3 = normalizeIndonesianPhone('6281234567890');
    assert.equal(res3.isValid, true);
    assert.equal(res3.normalized, '+6281234567890');

    // Formatted with spaces and dashes
    const res4 = normalizeIndonesianPhone('0812 - 3456 - 7890');
    assert.equal(res4.isValid, true);
    assert.equal(res4.normalized, '+6281234567890');

    // Invalid non-Indonesian or short number
    const res5 = normalizeIndonesianPhone('021555666');
    assert.equal(res5.isValid, false);
    assert.ok(res5.error);

    const res6 = normalizeIndonesianPhone('12345');
    assert.equal(res6.isValid, false);
  });

  it('should validate CreateCustomerSchema with required and optional fields', () => {
    const valid = CreateCustomerSchema.safeParse({
      name: 'Budi Santoso',
      phone: '081234567890',
      email: 'budi@example.com',
      notes: 'Pelanggan residensial setia',
    });
    assert.equal(valid.success, true);

    const invalid = CreateCustomerSchema.safeParse({
      name: 'A', // Too short
      phone: '',
    });
    assert.equal(invalid.success, false);
  });

  it('should validate CreateCustomerAddressSchema with address and location invariants', () => {
    const valid = CreateCustomerAddressSchema.safeParse({
      label: 'Rumah',
      fullAddress: 'Jl. Senopati No. 45, Kebayoran Baru',
      province: 'DKI Jakarta',
      city: 'Jakarta Selatan',
      district: 'Kebayoran Baru',
      postalCode: '12190',
      isPrimary: true,
    });
    assert.equal(valid.success, true);

    const invalid = CreateCustomerAddressSchema.safeParse({
      label: '',
      fullAddress: 'Jalan', // Too short
      city: '',
      district: '',
    });
    assert.equal(invalid.success, false);
  });

  it('should validate CreateAcUnitSchema and enforce fractional PK capacities', () => {
    // Valid 0.5 PK
    const halfPk = CreateAcUnitSchema.safeParse({
      customerAddressId: '9d1ab0a6-f83f-4bcf-8bd4-45b297f4d31f',
      unitLabel: 'AC Kamar Anak',
      brand: 'Panasonic',
      type: 'SPLIT',
      capacityPk: '0.5',
    });
    assert.equal(halfPk.success, true);

    // Valid 1 PK
    const onePk = CreateAcUnitSchema.safeParse({
      customerAddressId: '9d1ab0a6-f83f-4bcf-8bd4-45b297f4d31f',
      unitLabel: 'AC Ruang Tamu',
      brand: 'Daikin',
      type: 'SPLIT',
      capacityPk: '1',
    });
    assert.equal(onePk.success, true);

    // Valid 1.5 PK
    const oneHalfPk = CreateAcUnitSchema.safeParse({
      customerAddressId: '9d1ab0a6-f83f-4bcf-8bd4-45b297f4d31f',
      unitLabel: 'AC Kantor',
      brand: 'LG',
      type: 'CASSETTE',
      capacityPk: '1.5',
    });
    assert.equal(oneHalfPk.success, true);

    // Invalid non-numeric capacity
    const invalidPk = CreateAcUnitSchema.safeParse({
      customerAddressId: '9d1ab0a6-f83f-4bcf-8bd4-45b297f4d31f',
      unitLabel: 'AC Kamar',
      brand: 'Sharp',
      capacityPk: 'besar',
    });
    assert.equal(invalidPk.success, false);
  });

  it('should validate MoveAcUnitAddressSchema', () => {
    const valid = MoveAcUnitAddressSchema.safeParse({
      newCustomerAddressId: '9d1ab0a6-f83f-4bcf-8bd4-45b297f4d31f',
      newInstallationRoom: 'Kamar Utama Lt. 2',
      notes: 'Dipindahkan karena renovasi',
    });
    assert.equal(valid.success, true);

    const invalid = MoveAcUnitAddressSchema.safeParse({
      newCustomerAddressId: 'not-a-uuid',
    });
    assert.equal(invalid.success, false);
  });

  it('should validate CustomerHistorySchema structure without requiring fake bookings', () => {
    const emptyHistory = CustomerHistorySchema.safeParse({
      customerId: '9d1ab0a6-f83f-4bcf-8bd4-45b297f4d31f',
      bookings: [],
      totalBookings: 0,
      lastServiceDate: null,
    });
    assert.equal(emptyHistory.success, true);
  });
});
