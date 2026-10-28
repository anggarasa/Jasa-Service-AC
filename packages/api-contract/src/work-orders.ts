import { z } from 'zod';

export const WorkOrderStatusEnum = z.enum([
  'DRAFT',
  'SCHEDULED',
  'ASSIGNED',
  'ON_THE_WAY',
  'ARRIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'FOLLOW_UP_REQUIRED',
]);
export type WorkOrderStatus = z.infer<typeof WorkOrderStatusEnum>;

export const CreateWorkOrderFromBookingSchema = z.object({
  bookingId: z.string().uuid('ID Pemesanan tidak valid'),
  technicianId: z.string().uuid('ID Teknisi tidak valid').optional(),
  adminInstructions: z.string().max(2000).optional(),
  status: WorkOrderStatusEnum.optional(),
});
export type CreateWorkOrderFromBookingDto = z.infer<typeof CreateWorkOrderFromBookingSchema>;

export const UpdateWorkOrderStatusSchema = z.object({
  status: WorkOrderStatusEnum,
  reason: z.string().max(500).optional(),
  diagnosis: z.string().max(2000).optional(),
  technicianNotes: z.string().max(2000).optional(),
});
export type UpdateWorkOrderStatusDto = z.infer<typeof UpdateWorkOrderStatusSchema>;

export const AssignWorkOrderTechnicianSchema = z.object({
  technicianId: z.string().uuid('ID Teknisi wajib diisi'),
  reason: z.string().max(500).optional(),
});
export type AssignWorkOrderTechnicianDto = z.infer<typeof AssignWorkOrderTechnicianSchema>;

export const CancelWorkOrderSchema = z.object({
  reason: z.string().min(3, 'Alasan pembatalan SPK minimal 3 karakter').max(500),
});
export type CancelWorkOrderDto = z.infer<typeof CancelWorkOrderSchema>;

export const WorkOrderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: WorkOrderStatusEnum.optional(),
  technicianId: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD').optional(),
});
export type WorkOrderListQuery = z.infer<typeof WorkOrderListQuerySchema>;
