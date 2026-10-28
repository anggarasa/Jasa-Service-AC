import { z } from 'zod';

export const AcTypeEnum = z.enum([
  'SPLIT',
  'CASSETTE',
  'FLOOR_STANDING',
  'CENTRAL',
  'WINDOW',
  'PORTABLE',
  'OTHER',
]);
export type AcType = z.infer<typeof AcTypeEnum>;

export const CustomerAuditActionEnum = z.enum([
  'CUSTOMER_CREATED',
  'CUSTOMER_UPDATED',
  'CUSTOMER_ARCHIVED',
  'ADDRESS_CREATED',
  'ADDRESS_UPDATED',
  'PRIMARY_ADDRESS_CHANGED',
  'ADDRESS_ARCHIVED',
  'AC_UNIT_CREATED',
  'AC_UNIT_UPDATED',
  'AC_UNIT_MOVED',
  'AC_UNIT_ARCHIVED',
  'AC_UNIT_PHOTO_ADDED',
  'AC_UNIT_PHOTO_REMOVED',
]);
export type CustomerAuditAction = z.infer<typeof CustomerAuditActionEnum>;

export const CustomerAddressSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  label: z.string().min(1).max(50),
  recipientName: z.string().nullable().optional(),
  recipientPhone: z.string().nullable().optional(),
  fullAddress: z.string().min(5).max(500),
  province: z.string().default('DKI Jakarta'),
  city: z.string().min(2).max(100),
  district: z.string().min(2).max(100),
  subdistrict: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  landmark: z.string().nullable().optional(),
  serviceAreaId: z.string().uuid().nullable().optional(),
  serviceAreaName: z.string().nullable().optional(),
  isServiceable: z.boolean().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
  archivedAt: z.string().nullable().optional(),
  acUnitCount: z.number().optional().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CustomerAddressDto = z.infer<typeof CustomerAddressSchema>;

export const CreateCustomerAddressSchema = z.object({
  label: z.string().min(1, 'Label alamat wajib diisi').max(50),
  recipientName: z.string().max(100).optional().nullable(),
  recipientPhone: z.string().max(20).optional().nullable(),
  fullAddress: z.string().min(5, 'Alamat lengkap minimal 5 karakter').max(500),
  province: z.string().min(2).default('DKI Jakarta'),
  city: z.string().min(2, 'Kota wajib diisi').max(100),
  district: z.string().min(2, 'Kecamatan wajib diisi').max(100),
  subdistrict: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(10).optional().nullable(),
  landmark: z.string().max(255).optional().nullable(),
  serviceAreaId: z.string().uuid().optional().nullable(),
  isPrimary: z.boolean().optional().default(false),
});
export type CreateCustomerAddressRequest = z.infer<typeof CreateCustomerAddressSchema>;

export const UpdateCustomerAddressSchema = CreateCustomerAddressSchema.partial();
export type UpdateCustomerAddressRequest = z.infer<typeof UpdateCustomerAddressSchema>;

export const ServiceAreaValidationSchema = z.object({
  serviceable: z.boolean(),
  status: z.enum(['SERVICEABLE', 'NOT_SERVICEABLE', 'UNVERIFIED']),
  serviceArea: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      province: z.string(),
      city: z.string(),
      district: z.string(),
      visitFee: z.string(),
      estimatedTravelMinutes: z.number(),
    })
    .nullable()
    .optional(),
  visitFee: z.string().optional(),
  estimatedTravelMinutes: z.number().optional(),
  message: z.string(),
});
export type ServiceAreaValidationDto = z.infer<typeof ServiceAreaValidationSchema>;

export const CustomerSchema = z.object({
  id: z.string().uuid(),
  businessId: z.string().uuid(),
  customerCode: z.string(),
  name: z.string().min(1).max(100),
  phone: z.string(),
  normalizedPhone: z.string(),
  displayPhone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  archivedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  addressCount: z.number().optional().default(0),
  acUnitCount: z.number().optional().default(0),
  addresses: z.array(CustomerAddressSchema).optional(),
});
export type CustomerDto = z.infer<typeof CustomerSchema>;

export const CreateCustomerSchema = z.object({
  name: z.string().min(2, 'Nama pelanggan minimal 2 karakter').max(100),
  phone: z.string().min(8, 'Nomor telepon tidak valid').max(20),
  email: z.string().email('Format email tidak valid').optional().nullable().or(z.literal('')),
  notes: z.string().max(1000).optional().nullable(),
});
export type CreateCustomerRequest = z.infer<typeof CreateCustomerSchema>;

export const UpdateCustomerSchema = CreateCustomerSchema.partial();
export type UpdateCustomerRequest = z.infer<typeof UpdateCustomerSchema>;

export const CustomerListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['all', 'active', 'archived']).optional().default('active'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'name', 'customerCode']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
export type CustomerListQuery = z.infer<typeof CustomerListQuerySchema>;

export const DuplicateCandidateSchema = z.object({
  isDuplicateCandidate: z.boolean(),
  candidates: z.array(
    z.object({
      id: z.string().uuid(),
      customerCode: z.string(),
      name: z.string(),
      normalizedPhone: z.string(),
      displayPhone: z.string().nullable().optional(),
      isActive: z.boolean(),
    }),
  ),
});
export type DuplicateCandidateDto = z.infer<typeof DuplicateCandidateSchema>;

export const CustomerHistoryItemSchema = z.object({
  id: z.string().uuid(),
  bookingCode: z.string(),
  scheduledStartAt: z.string(),
  scheduledEndAt: z.string(),
  status: z.string(),
  serviceName: z.string(),
  unitCount: z.number(),
  estimatedPrice: z.string(),
  technicianName: z.string().nullable().optional(),
  workOrderStatus: z.string().nullable().optional(),
});
export type CustomerHistoryItemDto = z.infer<typeof CustomerHistoryItemSchema>;

export const CustomerHistorySchema = z.object({
  customerId: z.string().uuid(),
  bookings: z.array(CustomerHistoryItemSchema),
  totalBookings: z.number(),
  lastServiceDate: z.string().nullable(),
});
export type CustomerHistoryDto = z.infer<typeof CustomerHistorySchema>;
