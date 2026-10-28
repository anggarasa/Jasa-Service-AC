import { z } from 'zod';
import { PriceTypeEnum } from './schemas';

export { PriceTypeEnum };

export const PricingUnitEnum = z.enum(['PER_UNIT', 'PER_VISIT', 'INSPECTION']);
export type PricingUnit = z.infer<typeof PricingUnitEnum>;

// Service Category
export const ServiceCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nama kategori wajib diisi').max(100),
  slug: z.string().min(1, 'Slug kategori wajib diisi').max(100),
  description: z.string().max(500).nullable().optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  serviceCount: z.number().int().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});
export type ServiceCategory = z.infer<typeof ServiceCategorySchema>;

export const CreateServiceCategorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi').max(100),
  slug: z.string().min(1, 'Slug kategori wajib diisi').max(100),
  description: z.string().max(500).optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});
export type CreateServiceCategory = z.infer<typeof CreateServiceCategorySchema>;

export const UpdateServiceCategorySchema = CreateServiceCategorySchema.partial();
export type UpdateServiceCategory = z.infer<typeof UpdateServiceCategorySchema>;

// AC Service
export const ServiceSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  category: ServiceCategorySchema.optional(),
  name: z.string().min(1, 'Nama layanan wajib diisi').max(150),
  slug: z.string().min(1, 'Slug layanan wajib diisi').max(150),
  shortDescription: z.string().max(255).nullable().optional(),
  description: z.string().min(1, 'Deskripsi layanan wajib diisi').max(2000),
  priceType: PriceTypeEnum,
  basePrice: z.string().nullable().optional(), // Decimal string representation (e.g. "75000.00")
  basePriceNumber: z.number().nullable().optional(),
  pricingUnit: PricingUnitEnum.default('PER_UNIT'),
  estimatedDurationMinutes: z.number().int().min(15, 'Durasi minimal 15 menit').max(600),
  additionalBufferMinutes: z.number().int().min(0).max(120).default(0),
  minimumUnits: z.number().int().min(1).default(1),
  maximumUnits: z.number().int().min(1).default(10),
  imageObjectKey: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});
export type ServiceItem = z.infer<typeof ServiceSchema>;

export const CreateServiceSchema = z.object({
  categoryId: z.string().min(1, 'Kategori layanan wajib dipilih'),
  name: z.string().min(1, 'Nama layanan wajib diisi').max(150),
  slug: z.string().min(1, 'Slug layanan wajib diisi').max(150),
  shortDescription: z.string().max(255).optional(),
  description: z.string().min(1, 'Deskripsi layanan wajib diisi').max(2000),
  priceType: PriceTypeEnum,
  basePrice: z.number().min(0, 'Harga tidak boleh negatif').nullable().optional(),
  pricingUnit: PricingUnitEnum.default('PER_UNIT'),
  estimatedDurationMinutes: z.number().int().min(15, 'Durasi minimal 15 menit').max(600).default(60),
  additionalBufferMinutes: z.number().int().min(0).max(120).default(0),
  minimumUnits: z.number().int().min(1).default(1),
  maximumUnits: z.number().int().min(1).default(10),
  imageObjectKey: z.string().optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
}).refine((data) => {
  if (data.priceType === 'FIXED' && (data.basePrice === null || data.basePrice === undefined || data.basePrice <= 0)) {
    return false;
  }
  return true;
}, {
  message: 'Layanan harga tetap (FIXED) wajib memiliki harga dasar di atas 0',
  path: ['basePrice'],
}).refine((data) => {
  if (data.maximumUnits < data.minimumUnits) {
    return false;
  }
  return true;
}, {
  message: 'Batas maksimum unit tidak boleh lebih kecil dari batas minimum',
  path: ['maximumUnits'],
});
export type CreateService = z.infer<typeof CreateServiceSchema>;

export const UpdateServiceSchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(1).max(150).optional(),
  slug: z.string().min(1).max(150).optional(),
  shortDescription: z.string().max(255).optional().nullable(),
  description: z.string().min(1).max(2000).optional(),
  priceType: PriceTypeEnum.optional(),
  basePrice: z.number().min(0).nullable().optional(),
  pricingUnit: PricingUnitEnum.optional(),
  estimatedDurationMinutes: z.number().int().min(15).max(600).optional(),
  additionalBufferMinutes: z.number().int().min(0).max(120).optional(),
  minimumUnits: z.number().int().min(1).optional(),
  maximumUnits: z.number().int().min(1).optional(),
  imageObjectKey: z.string().optional().nullable(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateService = z.infer<typeof UpdateServiceSchema>;

// Service Area
export const ServiceAreaSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nama area wajib diisi').max(100),
  province: z.string().min(1, 'Provinsi wajib diisi').max(100),
  city: z.string().min(1, 'Kota wajib diisi').max(100),
  district: z.string().min(1, 'Kecamatan wajib diisi').max(100),
  visitFee: z.string().default('0.00'), // Decimal string representation
  visitFeeNumber: z.number().optional(),
  estimatedTravelMinutes: z.number().int().min(0).max(360).default(30),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});
export type ServiceAreaItem = z.infer<typeof ServiceAreaSchema>;

export const CreateServiceAreaSchema = z.object({
  name: z.string().min(1, 'Nama area wajib diisi').max(100),
  province: z.string().min(1, 'Provinsi wajib diisi').max(100),
  city: z.string().min(1, 'Kota wajib diisi').max(100),
  district: z.string().min(1, 'Kecamatan wajib diisi').max(100),
  visitFee: z.number().min(0, 'Ongkos kunjungan tidak boleh negatif').default(0),
  estimatedTravelMinutes: z.number().int().min(0, 'Estimasi perjalanan tidak boleh negatif').max(360).default(30),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});
export type CreateServiceArea = z.infer<typeof CreateServiceAreaSchema>;

export const UpdateServiceAreaSchema = CreateServiceAreaSchema.partial();
export type UpdateServiceArea = z.infer<typeof UpdateServiceAreaSchema>;

export const PaginationMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
