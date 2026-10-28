import { z } from 'zod';

export const UserRoleEnum = z.enum(['OWNER', 'ADMIN', 'TECHNICIAN']);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const AuthUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: UserRoleEnum,
  isActive: z.boolean(),
  lastLoginAt: z.string().nullable().optional(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(1, { message: 'Password wajib diisi' }),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseDataSchema = z.object({
  user: AuthUserSchema,
});
export type LoginResponseData = z.infer<typeof LoginResponseDataSchema>;

export const UpdateProfileRequestSchema = z.object({
  name: z.string().min(2, { message: 'Nama minimal 2 karakter' }).max(100),
});
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Password saat ini wajib diisi' }),
  newPassword: z
    .string()
    .min(12, { message: 'Password baru minimal 12 karakter' })
    .max(128, { message: 'Password maksimal 128 karakter' }),
});
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;

export const SessionItemSchema = z.object({
  id: z.string(),
  familyId: z.string(),
  userAgent: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  createdAt: z.string(),
  lastUsedAt: z.string(),
  isCurrent: z.boolean(),
});
export type SessionItem = z.infer<typeof SessionItemSchema>;

export const SessionsResponseDataSchema = z.object({
  sessions: z.array(SessionItemSchema),
});
export type SessionsResponseData = z.infer<typeof SessionsResponseDataSchema>;
