import { z } from 'zod';
import { AcTypeEnum } from './customers';

export const AcUnitMediaSchema = z.object({
  id: z.string().uuid(),
  acUnitId: z.string().uuid(),
  mediaAssetId: z.string().uuid(),
  url: z.string(),
  caption: z.string().nullable().optional(),
  displayOrder: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AcUnitMediaDto = z.infer<typeof AcUnitMediaSchema>;

export const AcUnitSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  customerName: z.string().optional(),
  customerCode: z.string().optional(),
  customerAddressId: z.string().uuid(),
  customerAddressLabel: z.string().optional(),
  customerFullAddress: z.string().optional(),
  unitCode: z.string(),
  unitLabel: z.string().min(1).max(100),
  brand: z.string().min(1).max(50),
  model: z.string().nullable().optional(),
  type: AcTypeEnum.default('SPLIT'),
  capacityPk: z.string(), // Decimal string representation e.g. "0.50", "1.00", "1.50"
  serialNumber: z.string().nullable().optional(),
  installationRoom: z.string().nullable().optional(),
  installationDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  archivedAt: z.string().nullable().optional(),
  photos: z.array(AcUnitMediaSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AcUnitDto = z.infer<typeof AcUnitSchema>;

export const CreateAcUnitSchema = z.object({
  customerAddressId: z.string().uuid('Pilih alamat instalasi yang valid'),
  unitLabel: z.string().min(1, 'Label unit AC wajib diisi').max(100),
  brand: z.string().min(1, 'Merk / Brand wajib diisi').max(50),
  model: z.string().max(100).optional().nullable(),
  type: AcTypeEnum.default('SPLIT'),
  capacityPk: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Kapasitas PK harus berupa angka desimal positif (misal: 0.5, 1, 1.5, 2)'),
  serialNumber: z.string().max(100).optional().nullable(),
  installationRoom: z.string().max(100).optional().nullable(),
  installationDate: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});
export type CreateAcUnitRequest = z.infer<typeof CreateAcUnitSchema>;

export const UpdateAcUnitSchema = CreateAcUnitSchema.omit({ customerAddressId: true }).partial();
export type UpdateAcUnitRequest = z.infer<typeof UpdateAcUnitSchema>;

export const MoveAcUnitAddressSchema = z.object({
  newCustomerAddressId: z.string().uuid('Alamat tujuan baru harus valid'),
  newInstallationRoom: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});
export type MoveAcUnitAddressRequest = z.infer<typeof MoveAcUnitAddressSchema>;

export const AcUnitListQuerySchema = z.object({
  search: z.string().optional(),
  brand: z.string().optional(),
  type: AcTypeEnum.optional(),
  capacityPk: z.string().optional(),
  customerId: z.string().uuid().optional(),
  customerAddressId: z.string().uuid().optional(),
  status: z.enum(['all', 'active', 'archived']).optional().default('active'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'unitCode', 'unitLabel', 'brand']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
export type AcUnitListQuery = z.infer<typeof AcUnitListQuerySchema>;

export const AcUnitHistoryItemSchema = z.object({
  id: z.string().uuid(),
  bookingCode: z.string(),
  serviceName: z.string(),
  scheduledDate: z.string(),
  status: z.string(),
  technicianName: z.string().nullable().optional(),
  diagnosis: z.string().nullable().optional(),
  technicianNotes: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
});
export type AcUnitHistoryItemDto = z.infer<typeof AcUnitHistoryItemSchema>;

export const AcUnitHistorySchema = z.object({
  acUnitId: z.string().uuid(),
  services: z.array(AcUnitHistoryItemSchema),
  totalServices: z.number(),
  lastServiceDate: z.string().nullable(),
});
export type AcUnitHistoryDto = z.infer<typeof AcUnitHistorySchema>;
