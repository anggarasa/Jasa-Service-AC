import { z } from 'zod';
import { PriceTypeEnum } from './schemas';
import { PricingUnitEnum } from './services';

export const PublicBusinessSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  phone: z.string(),
  whatsappNumber: z.string(),
  email: z.string(),
  address: z.string(),
  city: z.string(),
  province: z.string(),
  postalCode: z.string().nullable().optional(),
  googleMapsUrl: z.string().nullable().optional(),
  timezone: z.string(),
  logoMediaUrl: z.string().nullable().optional(),
  isOpenForPublicDisplay: z.boolean(),
});
export type PublicBusiness = z.infer<typeof PublicBusinessSchema>;

export const PublicOperatingBreakSchema = z.object({
  id: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
});
export type PublicOperatingBreak = z.infer<typeof PublicOperatingBreakSchema>;

export const PublicOperatingHourItemSchema = z.object({
  id: z.string().optional(),
  dayOfWeek: z.number().int().min(0).max(6),
  isOpen: z.boolean(),
  openTime: z.string(),
  closeTime: z.string(),
  breaks: z.array(PublicOperatingBreakSchema).default([]),
});
export type PublicOperatingHourItem = z.infer<typeof PublicOperatingHourItemSchema>;

export const PublicClosureSchema = z.object({
  id: z.string(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  reason: z.string(),
  isActive: z.boolean(),
});
export type PublicClosure = z.infer<typeof PublicClosureSchema>;

export const PublicOperatingHoursSchema = z.object({
  timezone: z.string(),
  schedule: z.array(PublicOperatingHourItemSchema),
  upcomingClosures: z.array(PublicClosureSchema).default([]),
});
export type PublicOperatingHours = z.infer<typeof PublicOperatingHoursSchema>;

export const PublicCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  displayOrder: z.number().int().default(0),
  serviceCount: z.number().int().default(0),
});
export type PublicCategory = z.infer<typeof PublicCategorySchema>;

export const PublicServiceItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  category: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }).optional(),
  shortDescription: z.string().nullable().optional(),
  description: z.string(),
  priceType: PriceTypeEnum,
  basePrice: z.string().nullable().optional(),
  basePriceNumber: z.number().nullable().optional(),
  pricingUnit: PricingUnitEnum.default('PER_UNIT'),
  estimatedDurationMinutes: z.number().int(),
  minimumUnits: z.number().int().default(1),
  maximumUnits: z.number().int().default(10),
  imageUrl: z.string().nullable().optional(),
  displayOrder: z.number().int().default(0),
});
export type PublicServiceItem = z.infer<typeof PublicServiceItemSchema>;

export const PublicServiceDetailSchema = PublicServiceItemSchema.extend({
  categoryId: z.string().optional(),
  additionalBufferMinutes: z.number().int().optional(),
  relatedServices: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      shortDescription: z.string().nullable().optional(),
      priceType: PriceTypeEnum,
      basePrice: z.string().nullable().optional(),
      basePriceNumber: z.number().nullable().optional(),
      pricingUnit: PricingUnitEnum.optional(),
      estimatedDurationMinutes: z.number().int(),
      imageUrl: z.string().nullable().optional(),
    }),
  ).default([]),
});
export type PublicServiceDetail = z.infer<typeof PublicServiceDetailSchema>;

export const PublicServiceAreaSchema = z.object({
  id: z.string(),
  name: z.string(),
  province: z.string(),
  city: z.string(),
  district: z.string(),
  visitFee: z.string(),
  visitFeeNumber: z.number(),
  estimatedTravelMinutes: z.number().int(),
});
export type PublicServiceArea = z.infer<typeof PublicServiceAreaSchema>;

export const PublicGalleryItemSchema = z.object({
  id: z.string(),
  caption: z.string().nullable().optional(),
  altText: z.string().nullable().optional(),
  displayOrder: z.number().int().default(0),
  url: z.string(),
});
export type PublicGalleryItem = z.infer<typeof PublicGalleryItemSchema>;
