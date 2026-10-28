import { z } from 'zod';

export const BusinessProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nama bisnis wajib diisi').max(100),
  slug: z.string().min(1, 'Slug bisnis wajib diisi').max(100),
  description: z.string().max(1000).nullable().optional(),
  email: z.string().email('Format email tidak valid'),
  phone: z.string().min(8, 'Nomor telepon minimal 8 digit').max(20),
  whatsappNumber: z.string().min(8, 'Nomor WhatsApp minimal 8 digit').max(20),
  address: z.string().min(5, 'Alamat lengkap wajib diisi').max(255),
  city: z.string().min(2, 'Kota wajib diisi').max(100),
  province: z.string().min(2, 'Provinsi wajib diisi').max(100),
  postalCode: z.string().max(10).nullable().optional(),
  googleMapsUrl: z.string().url('URL Google Maps tidak valid').nullable().optional().or(z.literal('')),
  timezone: z.string().default('Asia/Jakarta'),
  logoObjectKey: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});
export type BusinessProfile = z.infer<typeof BusinessProfileSchema>;

export const UpdateBusinessProfileSchema = z.object({
  name: z.string().min(1, 'Nama bisnis wajib diisi').max(100),
  slug: z.string().min(1, 'Slug bisnis wajib diisi').max(100),
  description: z.string().max(1000).nullable().optional(),
  email: z.string().email('Format email tidak valid'),
  phone: z.string().min(8, 'Nomor telepon minimal 8 digit').max(20),
  whatsappNumber: z.string().min(8, 'Nomor WhatsApp minimal 8 digit').max(20),
  address: z.string().min(5, 'Alamat lengkap wajib diisi').max(255),
  city: z.string().min(2, 'Kota wajib diisi').max(100),
  province: z.string().min(2, 'Provinsi wajib diisi').max(100),
  postalCode: z.string().max(10).nullable().optional(),
  googleMapsUrl: z.string().url('URL Google Maps tidak valid').nullable().optional().or(z.literal('')),
  timezone: z.string().default('Asia/Jakarta'),
  logoObjectKey: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateBusinessProfile = z.infer<typeof UpdateBusinessProfileSchema>;

export const BusinessOperatingBreakSchema = z.object({
  id: z.string().optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam mulai harus HH:mm (contoh: 12:00)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam selesai harus HH:mm (contoh: 13:00)'),
});
export type BusinessOperatingBreak = z.infer<typeof BusinessOperatingBreakSchema>;

export const BusinessOperatingHourSchema = z.object({
  id: z.string().optional(),
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Minggu s/d 6 = Sabtu
  isOpen: z.boolean(),
  openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam buka harus HH:mm'),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam tutup harus HH:mm'),
  breaks: z.array(BusinessOperatingBreakSchema).default([]),
});
export type BusinessOperatingHour = z.infer<typeof BusinessOperatingHourSchema>;

export const UpdateOperatingHoursSchema = z.object({
  schedule: z.array(BusinessOperatingHourSchema).length(7, 'Jadwal harus mencakup 7 hari (Minggu s/d Sabtu)'),
});
export type UpdateOperatingHours = z.infer<typeof UpdateOperatingHoursSchema>;

export const BusinessClosureSchema = z.object({
  id: z.string(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  reason: z.string().min(1, 'Alasan libur wajib diisi').max(200),
  isActive: z.boolean().default(true),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});
export type BusinessClosure = z.infer<typeof BusinessClosureSchema>;

export const CreateBusinessClosureSchema = z.object({
  startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
  endDate: z.string().min(1, 'Tanggal selesai wajib diisi'),
  reason: z.string().min(1, 'Alasan penutupan wajib diisi').max(200),
  isActive: z.boolean().default(true),
});
export type CreateBusinessClosure = z.infer<typeof CreateBusinessClosureSchema>;

export const UpdateBusinessClosureSchema = CreateBusinessClosureSchema.partial();
export type UpdateBusinessClosure = z.infer<typeof UpdateBusinessClosureSchema>;

export const BookingSettingsSchema = z.object({
  id: z.string().optional(),
  bookingEnabled: z.boolean().default(true),
  bookingIntervalMinutes: z.number().int().min(5, 'Interval minimal 5 menit').max(180),
  defaultServiceBufferMinutes: z.number().int().min(0, 'Buffer servis tidak boleh negatif').max(120),
  defaultTravelBufferMinutes: z.number().int().min(0, 'Buffer perjalanan tidak boleh negatif').max(180),
  minimumAdvanceMinutes: z.number().int().min(0, 'Waktu muka minimal tidak boleh negatif').max(10080),
  maximumAdvanceDays: z.number().int().min(1, 'Pemesanan maksimal hari minimal 1 hari').max(365),
  autoConfirmBooking: z.boolean().default(false),
  allowCustomerCancellation: z.boolean().default(false),
  cancellationWindowHours: z.number().int().min(0).max(168),
  maximumUnitsPerBooking: z.number().int().min(1).max(50),
  currency: z.string().default('IDR'),
});
export type BookingSettings = z.infer<typeof BookingSettingsSchema>;

export const UpdateBookingSettingsSchema = BookingSettingsSchema.omit({ id: true });
export type UpdateBookingSettings = z.infer<typeof UpdateBookingSettingsSchema>;

export const MediaPurposeEnum = z.enum(['BUSINESS_LOGO', 'SERVICE_IMAGE', 'GALLERY_IMAGE']);
export type MediaPurpose = z.infer<typeof MediaPurposeEnum>;

export const MediaAssetSchema = z.object({
  id: z.string(),
  objectKey: z.string(),
  bucket: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  purpose: MediaPurposeEnum,
  url: z.string().optional(),
  createdAt: z.string().or(z.date()).optional(),
});
export type MediaAsset = z.infer<typeof MediaAssetSchema>;

export const GalleryItemSchema = z.object({
  id: z.string(),
  mediaAssetId: z.string(),
  caption: z.string().nullable().optional(),
  altText: z.string().nullable().optional(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  mediaAsset: MediaAssetSchema.optional(),
  url: z.string().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});
export type GalleryItem = z.infer<typeof GalleryItemSchema>;

export const CreateGalleryItemSchema = z.object({
  mediaAssetId: z.string().min(1, 'ID media asset wajib diisi'),
  caption: z.string().max(255).optional(),
  altText: z.string().max(255).optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});
export type CreateGalleryItem = z.infer<typeof CreateGalleryItemSchema>;

export const UpdateGalleryItemSchema = CreateGalleryItemSchema.partial();
export type UpdateGalleryItem = z.infer<typeof UpdateGalleryItemSchema>;
