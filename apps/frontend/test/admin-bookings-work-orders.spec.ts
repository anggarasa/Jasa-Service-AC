import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AdminConfirmBookingSchema,
  AdminRejectBookingSchema,
  AdminAssignTechnicianSchema,
  AdminReassignTechnicianSchema,
  AdminRescheduleBookingSchema,
  AdminCancelBookingSchema,
  AdminUpdateInternalNotesSchema,
  AdminCreateManualBookingSchema,
  CreateWorkOrderFromBookingSchema,
  UpdateWorkOrderStatusSchema,
  CancelWorkOrderSchema,
} from '@tampilkit-ac/api-contract';

describe('Frontend Admin Bookings & Work Orders Test Suite (Phase 08)', () => {
  it('should validate AdminConfirmBookingSchema correctly', () => {
    const valid = AdminConfirmBookingSchema.parse({
      internalNotes: 'Konfirmasi via WhatsApp',
    });
    assert.equal(valid.internalNotes, 'Konfirmasi via WhatsApp');
  });

  it('should reject AdminRejectBookingSchema with empty reason', () => {
    assert.throws(() => {
      AdminRejectBookingSchema.parse({ reason: 'a' }); // min 3 chars
    });
  });

  it('should validate AdminAssignTechnicianSchema and require valid UUID', () => {
    const valid = AdminAssignTechnicianSchema.parse({
      technicianId: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
      notes: 'Bawa tangga lipat',
    });
    assert.equal(valid.notes, 'Bawa tangga lipat');

    assert.throws(() => {
      AdminAssignTechnicianSchema.parse({ technicianId: 'invalid-uuid' });
    });
  });

  it('should validate AdminReassignTechnicianSchema requiring reason', () => {
    assert.throws(() => {
      AdminReassignTechnicianSchema.parse({
        technicianId: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
        reason: 'ab', // too short
      });
    });
  });

  it('should validate AdminRescheduleBookingSchema with ISO date', () => {
    const valid = AdminRescheduleBookingSchema.parse({
      newStartAt: '2026-11-05T09:00:00.000Z',
      reason: 'Pelanggan minta undur jam servis',
    });
    assert.equal(valid.reason, 'Pelanggan minta undur jam servis');
  });

  it('should validate AdminCancelBookingSchema with reason', () => {
    const valid = AdminCancelBookingSchema.parse({
      reason: 'Pelanggan pindah ke luar kota',
    });
    assert.equal(valid.reason, 'Pelanggan pindah ke luar kota');
  });

  it('should validate CreateWorkOrderFromBookingSchema', () => {
    const valid = CreateWorkOrderFromBookingSchema.parse({
      bookingId: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d',
      adminInstructions: 'Cek pipa refrigrant',
    });
    assert.equal(valid.bookingId, 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d');
  });

  it('should validate UpdateWorkOrderStatusSchema for COMPLETED with diagnosis', () => {
    const valid = UpdateWorkOrderStatusSchema.parse({
      status: 'COMPLETED',
      diagnosis: 'AC kotor berlendir',
      technicianNotes: 'Cuci steam indoor dan outdoor berhasil dilakukan',
    });
    assert.equal(valid.status, 'COMPLETED');
  });

  it('should validate CancelWorkOrderSchema', () => {
    const valid = CancelWorkOrderSchema.parse({
      reason: 'Unit dibatalkan sepihak oleh pelanggan',
    });
    assert.equal(valid.reason, 'Unit dibatalkan sepihak oleh pelanggan');
  });
});
