import { z } from 'zod';

export const PriceTypeEnum = z.enum(['FIXED', 'STARTING_FROM', 'INSPECTION_REQUIRED']);
export type PriceType = z.infer<typeof PriceTypeEnum>;

export const ServiceItemPreviewSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  priceType: PriceTypeEnum,
  basePrice: z.number(),
  estimatedDurationMinutes: z.number().int().positive(),
  isActive: z.boolean(),
});
export type ServiceItemPreview = z.infer<typeof ServiceItemPreviewSchema>;

export const ServiceAreaPreviewSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  district: z.string(),
  visitFee: z.number(),
  isActive: z.boolean(),
});
export type ServiceAreaPreview = z.infer<typeof ServiceAreaPreviewSchema>;

export const BusinessInfoSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  phone: z.string(),
  whatsappNumber: z.string(),
  email: z.string().email(),
  address: z.string(),
  timezone: z.string(),
});
export type BusinessInfo = z.infer<typeof BusinessInfoSchema>;
