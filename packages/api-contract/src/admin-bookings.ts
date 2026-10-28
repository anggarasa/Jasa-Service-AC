import { z } from 'zod';
import { BookingStatusEnum, BookingAcUnitInputSchema, BookingAddressInputSchema } from './bookings';

export const AdminBookingListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: BookingStatusEnum.optional(),
  technicianId: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD').optional(),
});
export type AdminBookingListQuery = z.infer<typeof AdminBookingListQuerySchema>;

export const AdminConfirmBookingSchema = z.object({
  technicianId: z.string().uuid().optional(),
  internalNotes: z.string().max(2000).optional(),
});
export type AdminConfirmBookingDto = z.infer<typeof AdminConfirmBookingSchema>;

export const AdminRejectBookingSchema = z.object({
  reason: z.string().min(3, 'Alasan penolakan minimal 3 karakter').max(500),
});
export type AdminRejectBookingDto = z.infer<typeof AdminRejectBookingSchema>;

export const AdminAssignTechnicianSchema = z.object({
  technicianId: z.string().uuid('ID Teknisi tidak valid'),
  notes: z.string().max(1000).optional(),
});
export type AdminAssignTechnicianDto = z.infer<typeof AdminAssignTechnicianSchema>;

export const AdminReassignTechnicianSchema = z.object({
  technicianId: z.string().uuid('ID Teknisi pengganti tidak valid'),
  reason: z.string().min(3, 'Alasan pengalihan teknisi minimal 3 karakter').max(500),
});
export type AdminReassignTechnicianDto = z.infer<typeof AdminReassignTechnicianSchema>;

export const AdminRescheduleBookingSchema = z.object({
  newStartAt: z.string().datetime({ message: 'Jadwal baru harus berformat ISO 8601' }),
  technicianId: z.string().uuid().optional(),
  reason: z.string().min(3, 'Alasan penjadwalan ulang minimal 3 karakter').max(500),
});
export type AdminRescheduleBookingDto = z.infer<typeof AdminRescheduleBookingSchema>;

export const AdminCancelBookingSchema = z.object({
  reason: z.string().min(3, 'Alasan pembatalan minimal 3 karakter').max(500),
});
export type AdminCancelBookingDto = z.infer<typeof AdminCancelBookingSchema>;

export const AdminUpdateInternalNotesSchema = z.object({
  internalNotes: z.string().max(2000, 'Catatan internal maksimal 2000 karakter'),
});
export type AdminUpdateInternalNotesDto = z.infer<typeof AdminUpdateInternalNotesSchema>;

export const AdminCreateManualBookingSchema = z.object({
  serviceId: z.string().uuid('ID Layanan wajib dipilih'),
  units: z.array(BookingAcUnitInputSchema).min(1, 'Minimal 1 unit AC didaftarkan').max(10),
  serviceAreaId: z.string().uuid('Wilayah operasional wajib dipilih'),
  serviceAddress: BookingAddressInputSchema,
  selectedStartAt: z.string().datetime({ message: 'Waktu mulai harus dalam format ISO 8601' }),
  customerName: z.string().min(2, 'Nama pelanggan minimal 2 karakter').max(150),
  customerPhone: z.string().min(8, 'Nomor WhatsApp minimal 8 digit').max(25),
  customerEmail: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  customerNotes: z.string().max(1000).optional(),
  internalNotes: z.string().max(2000).optional(),
  technicianId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'ASSIGNED']).default('CONFIRMED'),
});
export type AdminCreateManualBookingDto = z.infer<typeof AdminCreateManualBookingSchema>;

export const AdminCalendarQuerySchema = z.object({
  view: z.enum(['day', 'week', 'month']).default('month'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD'),
  technicianId: z.string().optional(),
});
export type AdminCalendarQuery = z.infer<typeof AdminCalendarQuerySchema>;

export const TechnicianScheduleQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD'),
  technicianId: z.string().optional(),
});
export type TechnicianScheduleQuery = z.infer<typeof TechnicianScheduleQuerySchema>;
