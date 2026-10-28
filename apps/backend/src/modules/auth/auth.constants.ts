export const ACCESS_COOKIE_NAME = 'tk_ac_access';
export const REFRESH_COOKIE_NAME = 'tk_ac_refresh';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds
export const ACCESS_COOKIE_MAX_AGE_SECONDS = 15 * 60; // 15 minutes
export const REFRESH_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export const RATE_LIMIT_WINDOWS = {
  LOGIN: { limit: 5, windowSeconds: 15 * 60 }, // 5 attempts per 15 min
  CHANGE_PASSWORD: { limit: 5, windowSeconds: 60 * 60 }, // 5 attempts per hour
  REFRESH: { limit: 60, windowSeconds: 60 }, // 60 requests per minute
};
