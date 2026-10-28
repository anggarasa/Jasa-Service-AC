import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SaveWorkOrderPricingSchema,
  CreateChargeApprovalSchema,
  VoidInvoiceSchema,
  RecordPaymentSchema,
  VerifyPaymentSchema,
  RejectPaymentSchema,
  OperationalReportsQuerySchema,
} from '@tampilkit-ac/api-contract';

describe('Frontend Phase 11 — Pricing, Billing, Payment & Reporting Contract Tests', () => {
  it('should validate SaveWorkOrderPricingSchema with charges and materials', () => {
    const valid = SaveWorkOrderPricingSchema.parse({
      charges: [
        {
          lineType: 'ADDITIONAL_LABOR',
          description: 'Pengelasan pipa tembaga',
          quantity: 1,
          unitPrice: '75000',
        },
      ],
      materials: [
        {
          materialName: 'Freon R32',
          quantity: 1.5,
          unit: 'kg',
          unitPrice: '120000',
          notes: 'Pengisian ulang freon kompresor',
        },
      ],
      discountAmount: '10000',
      taxPercent: 11,
    });

    assert.equal(valid.charges.length, 1);
    assert.equal(valid.materials.length, 1);
    assert.equal(valid.materials[0].quantity, 1.5);
    assert.equal(valid.discountAmount, '10000');
  });

  it('should reject SaveWorkOrderPricingSchema when unitPrice is not a valid decimal string', () => {
    assert.throws(() => {
      SaveWorkOrderPricingSchema.parse({
        charges: [
          {
            lineType: 'ADDITIONAL_LABOR',
            description: 'Minus price',
            quantity: 1,
            unitPrice: '-5000',
          },
        ],
        materials: [],
      });
    });
  });

  it('should validate CreateChargeApprovalSchema', () => {
    const valid = CreateChargeApprovalSchema.parse({
      approvalMethod: 'IN_PERSON',
      approvedByName: 'Hendra Setiawan',
      approvedByContact: '08123456789',
      internalNotes: 'Disetujui secara lisan di tempat',
    });

    assert.equal(valid.approvedByName, 'Hendra Setiawan');
    assert.equal(valid.approvalMethod, 'IN_PERSON');
  });

  it('should reject VoidInvoiceSchema when voidReason is shorter than 5 chars', () => {
    assert.throws(() => {
      VoidInvoiceSchema.parse({
        voidReason: 'abc',
      });
    });

    const valid = VoidInvoiceSchema.parse({
      voidReason: 'Salah hitung jumlah pipa',
    });
    assert.equal(valid.voidReason, 'Salah hitung jumlah pipa');
  });

  it('should validate RecordPaymentSchema with valid payment methods', () => {
    const validCash = RecordPaymentSchema.parse({
      method: 'CASH',
      amount: '150000',
      notes: 'Diterima tunai oleh teknisi',
      idempotencyKey: 'idemp-cash-12345',
    });
    assert.equal(validCash.method, 'CASH');
    assert.equal(validCash.amount, '150000');

    const validTransfer = RecordPaymentSchema.parse({
      method: 'BANK_TRANSFER',
      amount: '250000',
      proofMediaId: '123e4567-e89b-12d3-a456-426614174000',
      idempotencyKey: 'idemp-tx-12345',
    });
    assert.equal(validTransfer.method, 'BANK_TRANSFER');
    assert.equal(validTransfer.idempotencyKey, 'idemp-tx-12345');
  });

  it('should reject RecordPaymentSchema with invalid method or non-numeric amount', () => {
    assert.throws(() => {
      RecordPaymentSchema.parse({
        method: 'INVALID_GATEWAY' as any,
        amount: '50000',
        idempotencyKey: 'idemp-valid-key',
      });
    });

    assert.throws(() => {
      RecordPaymentSchema.parse({
        method: 'CASH',
        amount: 'not-a-number',
        idempotencyKey: 'idemp-valid-key',
      });
    });
  });

  it('should validate VerifyPaymentSchema and RejectPaymentSchema', () => {
    const verify = VerifyPaymentSchema.parse({
      notes: 'Rekening koran BCA cocok',
    });
    assert.equal(verify.notes, 'Rekening koran BCA cocok');

    const reject = RejectPaymentSchema.parse({
      rejectionReason: 'Mutasi bank tidak ditemukan',
    });
    assert.equal(reject.rejectionReason, 'Mutasi bank tidak ditemukan');
  });

  it('should validate OperationalReportsQuerySchema', () => {
    const valid = OperationalReportsQuerySchema.parse({
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      technicianId: '123e4567-e89b-12d3-a456-426614174000',
    });
    assert.equal(valid.startDate, '2026-10-01');
    assert.equal(valid.technicianId, '123e4567-e89b-12d3-a456-426614174000');
  });
});
