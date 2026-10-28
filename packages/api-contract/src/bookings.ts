import { z } from 'zod';

export const BookingStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'REJECTED',
  'EXPIRED',
  'NO_SHOW',
]);
export type BookingStatus = z.infer<typeof BookingStatusEnum>;

export const BookingAcUnitInputSchema = z.object({
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  type: z.enum(['SPLIT', 'CASSETTE', 'FLOOR_STANDING', 'CENTRAL', 'WINDOW', 'PORTABLE', 'OTHER']).default('SPLIT'),
  capacityPk: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Kapasitas PK harus berupa angka/desimal valid').optional(),
  installationRoom: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  acUnitId: z.string().uuid().optional(),
});
export type BookingAcUnitInput = z.infer<typeof BookingAcUnitInputSchema>;

export const BookingAddressInputSchema = z.object({
  recipientName: z.string().max(100).optional(),
  recipientPhone: z.string().max(30).optional(),
  fullAddress: z.string().min(5, 'Alamat lengkap minimal 5 karakter').max(500),
  province: z.string().default('DKI Jakarta'),
  city: z.string().min(2, 'Kota/Kabupaten wajib diisi'),
  district: z.string().min(2, 'Kecamatan wajib diisi'),
  subdistrict: z.string().max(100).optional(),
  postalCode: z.string().regex(/^\d{5}$/, 'Kode pos harus 5 digit').optional().or(z.literal('')),
  landmark: z.string().max(255).optional(),
});
export type BookingAddressInput = z.infer<typeof BookingAddressInputSchema>;

export const PublicAvailabilityQuerySchema = z.object({
  serviceId: z.string().uuid('ID Layanan tidak valid'),
  unitCount: z.coerce.number().int().min(1, 'Jumlah unit minimal 1').max(10, 'Jumlah unit maksimal 10').default(1),
  serviceAreaId: z.string().uuid('ID Wilayah Layanan tidak valid'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
});
export type PublicAvailabilityQuery = z.infer<typeof PublicAvailabilityQuerySchema>;

export const AvailabilitySlotSchema = z.object({
  start: z.string(), // "09:00"
  end: z.string(),   // "11:00"
  startIso: z.string(),
  endIso: z.string(),
  available: z.boolean(),
});
export type AvailabilitySlot = z.infer<typeof AvailabilitySlotSchema>;

export const PublicAvailabilityResponseSchema = z.object({
  date: z.string(),
  timezone: z.string(),
  estimatedDurationMinutes: z.number(),
  slots: z.array(AvailabilitySlotSchema),
});
export type PublicAvailabilityResponse = z.infer<typeof PublicAvailabilityResponseSchema>;

export const BookingPriceEstimateSchema = z.object({
  priceType: z.enum(['FIXED', 'STARTING_FROM', 'INSPECTION_REQUIRED']),
  basePrice: z.string().nullable(),
  unitCount: z.number(),
  estimatedServicePrice: z.string().nullable(),
  visitFee: z.string(),
  estimatedTotal: z.string().nullable(),
  isEstimateOnly: z.boolean(),
  notes: z.string().optional(),
});
export type BookingPriceEstimate = z.infer<typeof BookingPriceEstimateSchema>;

export const CreateGuestBookingRequestSchema = z.object({
  serviceId: z.string().uuid('ID Layanan wajib dipilih'),
  units: z.array(BookingAcUnitInputSchema).min(1, 'Minimal 1 unit AC harus didaftarkan').max(10, 'Maksimal 10 unit AC'),
  serviceAreaId: z.string().uuid('Wilayah operasional wajib dipilih'),
  serviceAddress: BookingAddressInputSchema,
  selectedStartAt: z.string().datetime({ message: 'Waktu mulai harus dalam format ISO 8601' }),
  customerName: z.string().min(2, 'Nama lengkap minimal 2 karakter').max(150),
  customerPhone: z.string().min(8, 'Nomor WhatsApp minimal 8 digit').max(25),
  customerEmail: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  customerNotes: z.string().max(1000).optional(),
  idempotencyKey: z.string().min(16, 'Idempotency key minimal 16 karakter').max(128),
});
export type CreateGuestBookingRequest = z.infer<typeof CreateGuestBookingRequestSchema>;

export const GuestBookingConfirmationSchema = z.object({
  bookingId: z.string(),
  bookingCode: z.string(),
  status: BookingStatusEnum,
  accessToken: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  serviceName: z.string(),
  unitCount: z.number(),
  scheduledStartAt: z.string(),
  scheduledEndAt: z.string(),
  estimatedDurationMinutes: z.number(),
  priceType: z.string(),
  estimatedServicePrice: z.string().nullable(),
  visitFee: z.string(),
  estimatedTotal: z.string().nullable(),
  fullAddress: z.string(),
  areaName: z.string(),
  createdAt: z.string(),
});
export type GuestBookingConfirmation = z.infer<typeof GuestBookingConfirmationSchema>;

export const GuestBookingItemDetailSchema = z.object({
  id: z.string(),
  brandSnapshot: z.string().nullable(),
  modelSnapshot: z.string().nullable(),
  typeSnapshot: z.string(),
  capacityPkSnapshot: z.string().nullable(),
  installationRoomSnapshot: z.string().nullable(),
  notes: z.string().nullable(),
  estimatedDurationMinutes: z.number(),
});
export type GuestBookingItemDetail = z.infer<typeof GuestBookingItemDetailSchema>;

export const GuestBookingDetailsSchema = z.object({
  id: z.string(),
  bookingCode: z.string(),
  status: BookingStatusEnum,
  customerName: z.string(),
  customerPhone: z.string(),
  serviceName: z.string(),
  serviceSlug: z.string(),
  unitCount: z.number(),
  items: z.array(GuestBookingItemDetailSchema),
  scheduledStartAt: z.string(),
  scheduledEndAt: z.string(),
  estimatedDurationMinutes: z.number(),
  priceType: z.string(),
  estimatedServicePrice: z.string().nullable(),
  visitFee: z.string(),
  estimatedTotal: z.string().nullable(),
  serviceAddress: z.object({
    fullAddress: z.string(),
    province: z.string(),
    city: z.string(),
    district: z.string(),
    subdistrict: z.string().nullable(),
    postalCode: z.string().nullable(),
    landmark: z.string().nullable(),
    areaName: z.string().nullable(),
  }),
  customerNotes: z.string().nullable(),
  createdAt: z.string(),
  statusHistory: z.array(z.object({
    fromStatus: BookingStatusEnum.nullable(),
    toStatus: BookingStatusEnum,
    reason: z.string().nullable(),
    createdAt: z.string(),
  })),
});
export type GuestBookingDetails = z.infer<typeof GuestBookingDetailsSchema>;
