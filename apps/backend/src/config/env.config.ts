import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().optional(),

  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_USE_SSL: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .default(false),
  MINIO_ACCESS_KEY: z.string().optional(),
  MINIO_SECRET_KEY: z.string().optional(),
  MINIO_BUCKET: z.string().default('tampilkit-ac-booking'),

  JWT_ACCESS_SECRET: z.string().default('tampilkit_access_super_secret_key_minimum_32_characters_12345'),
  JWT_REFRESH_SECRET: z.string().default('tampilkit_refresh_super_secret_key_minimum_32_characters_67890'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_ISSUER: z.string().default('tampilkit-ac-booking'),
  JWT_AUDIENCE: z.string().default('tampilkit-ac-api'),

  AUTH_SESSION_MAX_AGE_SECONDS: z.coerce.number().default(604800),
  AUTH_COOKIE_SECURE: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .default(false),
  AUTH_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),

  GOOGLE_CALENDAR_ENABLED: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .default(false),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().default('http://localhost:3001/api/v1/integrations/google/callback'),
  GOOGLE_TOKEN_ENCRYPTION_KEY: z.string().default('tampilkit_gcal_aes256_key_32_bytes_len!'),
  GOOGLE_OAUTH_STATE_SECRET: z.string().default('tampilkit_oauth_state_secret_min_32_characters!'),
  GOOGLE_WEBHOOK_PUBLIC_URL: z.string().optional(),
  GOOGLE_WEBHOOK_CHANNEL_SECRET: z.string().default('tampilkit_webhook_channel_secret_key!'),
  GOOGLE_SYNC_INTERVAL_MINUTES: z.coerce.number().default(5),
  GOOGLE_SYNC_MAX_RETRIES: z.coerce.number().default(5),
  GOOGLE_FREEBUSY_TIMEOUT_MS: z.coerce.number().default(5000),
  GOOGLE_FREEBUSY_MAX_STALENESS_SECONDS: z.coerce.number().default(60),
  GOOGLE_WORKER_ENABLED: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .default(false),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = EnvSchema.safeParse(config);
  if (!result.success) {
    const formatted = result.error.format();
    console.error('❌ Environment validation failed:', JSON.stringify(formatted, null, 2));
    throw new Error(`Environment validation error: ${result.error.message}`);
  }
  return result.data;
}
