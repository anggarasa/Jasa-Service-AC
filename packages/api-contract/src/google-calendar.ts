import { z } from 'zod';

export const GoogleConnectionStatusEnum = z.enum([
  'CONNECTED',
  'DISCONNECTED',
  'REAUTH_REQUIRED',
  'NEEDS_SELECTION',
]);
export type GoogleConnectionStatus = z.infer<typeof GoogleConnectionStatusEnum>;

export const GoogleCalendarSummarySchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  timeZone: z.string().optional(),
  primary: z.boolean().optional(),
  accessRole: z.string().optional(),
  summary: z.string().optional(),
});
export type GoogleCalendarSummary = z.infer<typeof GoogleCalendarSummarySchema>;
export type GoogleCalendarListItem = GoogleCalendarSummary;

export const GoogleCalendarConnectionSchema = z.object({
  status: GoogleConnectionStatusEnum,
  googleAccountEmail: z.string().nullable().optional(),
  calendarId: z.string().nullable().optional(),
  calendarName: z.string().nullable().optional(),
  calendarTimezone: z.string().nullable().optional(),
  lastSuccessfulSyncAt: z.string().nullable().optional(),
  lastError: z.string().nullable().optional(),
  lastErrorAt: z.string().nullable().optional(),
  watchChannelActive: z.boolean().default(false),
  watchExpiresAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  nextSyncToken: z.string().nullable().optional(),
});
export type GoogleCalendarConnectionDto = z.infer<typeof GoogleCalendarConnectionSchema>;
export type CalendarConnectionStatusResponse = GoogleCalendarConnectionDto;

export const SelectCalendarSchema = z.object({
  calendarId: z.string().min(1, 'ID Kalender wajib dipilih'),
});
export type SelectCalendarDto = z.infer<typeof SelectCalendarSchema>;

export const ResolveConflictActionEnum = z.enum([
  'RESTORE_LOCAL',
  'ACCEPT_REMOTE',
  'IGNORE',
]);
export type ResolveConflictAction = z.infer<typeof ResolveConflictActionEnum>;

export const ResolveConflictSchema = z.object({
  action: ResolveConflictActionEnum,
  resolutionNotes: z.string().max(1000).optional(),
});
export type ResolveConflictDto = z.infer<typeof ResolveConflictSchema>;

export const GoogleCalendarStatsSchema = z.object({
  totalSyncedEvents: z.number().default(0),
  pendingJobs: z.number().default(0),
  failedJobs: z.number().default(0),
  openConflicts: z.number().default(0),
  lastSyncAt: z.string().nullable().optional(),
});
export type GoogleCalendarStatsDto = z.infer<typeof GoogleCalendarStatsSchema>;

export const GoogleSyncJobsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.string().optional(),
});
export type GoogleSyncJobsQuery = z.input<typeof GoogleSyncJobsQuerySchema>;
export type SyncJobsQuery = GoogleSyncJobsQuery;

export const GoogleConflictsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.string().optional(),
});
export type GoogleConflictsQuery = z.input<typeof GoogleConflictsQuerySchema>;
export type ConflictsQuery = GoogleConflictsQuery;

export interface CalendarSyncJobItem {
  id: string;
  connectionId: string;
  aggregateType: string;
  aggregateId: string;
  operation: string;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  lastErrorMessage?: string | null;
  lockedUntil?: string | null;
  lockedBy?: string | null;
  nextAttemptAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SyncJobsListResponse {
  items: CalendarSyncJobItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CalendarSyncConflictItem {
  id: string;
  connectionId: string;
  bookingId?: string | null;
  externalEventId?: string | null;
  conflictType: string;
  localSnapshot?: any;
  remoteSnapshot?: any;
  detectedAt: string;
  status: string;
  resolvedAt?: string | null;
  resolvedByUserId?: string | null;
  resolutionNotes?: string | null;
  booking?: {
    id: string;
    bookingCode: string;
    scheduledStartAt: string;
    scheduledEndAt: string;
    customer?: {
      name: string;
    };
  } | null;
}

export interface ConflictsListResponse {
  items: CalendarSyncConflictItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
