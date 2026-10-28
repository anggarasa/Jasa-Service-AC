import { z } from 'zod';

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const PaginationMetadataSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: PaginationMetadata;
  correlationId?: string;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export const ApiErrorDetailSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
  correlationId?: string;
}

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: ApiErrorDetailSchema,
  correlationId: z.string().optional(),
});

export interface ApplicationInfo {
  application: string;
  name: string;
  version: string;
  environment: string;
}

export const ApplicationInfoSchema = z.object({
  application: z.string(),
  name: z.string(),
  version: z.string(),
  environment: z.string(),
});
