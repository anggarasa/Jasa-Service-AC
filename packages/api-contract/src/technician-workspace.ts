import { z } from 'zod';
import { WorkOrderStatusEnum } from './work-orders';

export const InspectionStatusEnum = z.enum([
  'NOT_INSPECTED',
  'GOOD',
  'NEEDS_SERVICE',
  'REPAIR_REQUIRED',
  'CRITICAL',
]);
export type InspectionStatus = z.infer<typeof InspectionStatusEnum>;

export const ChecklistItemStatusEnum = z.enum([
  'NOT_STARTED',
  'DONE',
  'NOT_APPLICABLE',
  'NEEDS_ATTENTION',
]);
export type ChecklistItemStatus = z.infer<typeof ChecklistItemStatusEnum>;

export const WorkOrderPhotoCategoryEnum = z.enum([
  'BEFORE',
  'DURING',
  'AFTER',
  'ISSUE',
]);
export type WorkOrderPhotoCategory = z.infer<typeof WorkOrderPhotoCategoryEnum>;

export const ArriveWorkOrderSchema = z.object({
  notes: z.string().max(500).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});
export type ArriveWorkOrderDto = z.infer<typeof ArriveWorkOrderSchema>;

export const StartWorkOrderSchema = z.object({
  notes: z.string().max(500).optional(),
});
export type StartWorkOrderDto = z.infer<typeof StartWorkOrderSchema>;

export const FollowUpWorkOrderSchema = z.object({
  reason: z.string().min(3, 'Alasan tindak lanjut minimal 3 karakter').max(500),
  notes: z.string().max(2000).optional(),
});
export type FollowUpWorkOrderDto = z.infer<typeof FollowUpWorkOrderSchema>;

export const CompleteWorkOrderSchema = z.object({
  technicianNotes: z.string().max(2000).optional(),
  customerSignedName: z.string().max(100).optional(),
  technicianSignedName: z.string().max(100).optional(),
});
export type CompleteWorkOrderDto = z.infer<typeof CompleteWorkOrderSchema>;

export const SaveUnitInspectionSchema = z.object({
  inspectionStatus: InspectionStatusEnum.default('NOT_INSPECTED'),
  reportedComplaint: z.string().max(1000).optional().nullable(),
  observedCondition: z.string().max(1000).optional().nullable(),
  diagnosis: z.string().max(1000).optional().nullable(),
  recommendedAction: z.string().max(1000).optional().nullable(),
  requiresFollowUp: z.boolean().default(false),
});
export type SaveUnitInspectionDto = z.infer<typeof SaveUnitInspectionSchema>;

export const UpdateChecklistItemSchema = z.object({
  status: ChecklistItemStatusEnum,
  notes: z.string().max(500).optional().nullable(),
});
export type UpdateChecklistItemDto = z.infer<typeof UpdateChecklistItemSchema>;

export const SaveServiceReportSchema = z.object({
  summary: z.string().min(5, 'Ringkasan servis minimal 5 karakter').max(2000),
  workPerformed: z.string().min(5, 'Tindakan teknis yang dilakukan minimal 5 karakter').max(2000),
  issuesFound: z.string().max(2000).optional().nullable(),
  recommendations: z.string().max(2000).optional().nullable(),
  customerSignedName: z.string().max(100).optional().nullable(),
  technicianSignedName: z.string().max(100).optional().nullable(),
  isCompleted: z.boolean().default(false),
});
export type SaveServiceReportDto = z.infer<typeof SaveServiceReportSchema>;

export const UploadPhotoMetadataSchema = z.object({
  category: WorkOrderPhotoCategoryEnum,
  workOrderItemId: z.string().uuid().optional().nullable(),
  caption: z.string().max(255).optional().nullable(),
});
export type UploadPhotoMetadataDto = z.infer<typeof UploadPhotoMetadataSchema>;

export const TechnicianJobsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: WorkOrderStatusEnum.optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD').optional(),
  search: z.string().optional(),
});
export type TechnicianJobsQuery = z.infer<typeof TechnicianJobsQuerySchema>;
