import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ArriveWorkOrderSchema,
  StartWorkOrderSchema,
  FollowUpWorkOrderSchema,
  CompleteWorkOrderSchema,
  SaveUnitInspectionSchema,
  UpdateChecklistItemSchema,
  SaveServiceReportSchema,
  UploadPhotoMetadataSchema,
  TechnicianJobsQuerySchema,
} from '@tampilkit-ac/api-contract';

describe('Frontend Technician Workspace & Execution Test Suite (Phase 09)', () => {
  it('should validate ArriveWorkOrderSchema with notes and coordinates', () => {
    const valid = ArriveWorkOrderSchema.parse({
      notes: 'Sudah di gerbang perumahan',
      latitude: -6.2,
      longitude: 106.8,
    });
    assert.equal(valid.notes, 'Sudah di gerbang perumahan');
    assert.equal(valid.latitude, -6.2);
  });

  it('should validate StartWorkOrderSchema', () => {
    const valid = StartWorkOrderSchema.parse({
      notes: 'Mulai cuci indoor unit',
    });
    assert.equal(valid.notes, 'Mulai cuci indoor unit');
  });

  it('should reject FollowUpWorkOrderSchema when reason is shorter than 3 characters', () => {
    assert.throws(() => {
      FollowUpWorkOrderSchema.parse({
        reason: 'ab',
      });
    });

    const valid = FollowUpWorkOrderSchema.parse({
      reason: 'Kapasitor blower lemah',
      notes: 'Perlu penggantian 1.5uF',
    });
    assert.equal(valid.reason, 'Kapasitor blower lemah');
  });

  it('should validate CompleteWorkOrderSchema with signees', () => {
    const valid = CompleteWorkOrderSchema.parse({
      technicianNotes: 'AC berhembus dingin normal',
      customerSignedName: 'Bapak Ahmad',
      technicianSignedName: 'Budi Santoso',
    });
    assert.equal(valid.customerSignedName, 'Bapak Ahmad');
  });

  it('should validate SaveUnitInspectionSchema with technical parameters', () => {
    const valid = SaveUnitInspectionSchema.parse({
      inspectionStatus: 'GOOD',
      reportedComplaint: 'AC tidak dingin',
      observedCondition: 'Filter berdebu',
      diagnosis: 'Hambatan sirkulasi udara',
      recommendedAction: 'Cuci steam',
      requiresFollowUp: false,
    });
    assert.equal(valid.inspectionStatus, 'GOOD');
    assert.equal(valid.requiresFollowUp, false);
  });

  it('should validate UpdateChecklistItemSchema status transitions', () => {
    const valid = UpdateChecklistItemSchema.parse({
      status: 'DONE',
      notes: 'Normal 140 PSI',
    });
    assert.equal(valid.status, 'DONE');

    const naItem = UpdateChecklistItemSchema.parse({
      status: 'NOT_APPLICABLE',
      notes: 'Unit inverter tidak pakai kapasitor manual',
    });
    assert.equal(naItem.status, 'NOT_APPLICABLE');
  });

  it('should validate SaveServiceReportSchema requiring summary and workPerformed', () => {
    assert.throws(() => {
      SaveServiceReportSchema.parse({
        summary: 'abc', // min 5 chars
        workPerformed: 'Pembersihan',
      });
    });

    const valid = SaveServiceReportSchema.parse({
      summary: 'Perawatan berkala 2 unit AC selesai',
      workPerformed: 'Cuci steam indoor dan outdoor serta pembersihan saluran drainase',
      customerSignedName: 'Ibu Siti',
      technicianSignedName: 'Budi',
      isCompleted: true,
    });
    assert.equal(valid.isCompleted, true);
    assert.equal(valid.summary, 'Perawatan berkala 2 unit AC selesai');
  });

  it('should validate UploadPhotoMetadataSchema with categories', () => {
    const valid = UploadPhotoMetadataSchema.parse({
      category: 'BEFORE',
      caption: 'Kondisi evaporator sebelum dicuci',
    });
    assert.equal(valid.category, 'BEFORE');
  });

  it('should validate TechnicianJobsQuerySchema with filters', () => {
    const valid = TechnicianJobsQuerySchema.parse({
      page: '1',
      limit: '15',
      status: 'IN_PROGRESS',
      date: '2026-10-28',
      search: 'CoolCare',
    });
    assert.equal(valid.page, 1);
    assert.equal(valid.limit, 15);
    assert.equal(valid.status, 'IN_PROGRESS');
  });
});
