import {
  CalendarConnectionStatusResponse,
  GoogleCalendarListItem,
  SelectCalendarDto,
  ResolveConflictDto,
  SyncJobsQuery,
  ConflictsQuery,
  SyncJobsListResponse,
  ConflictsListResponse,
} from '@tampilkit-ac/api-contract';
import { apiClient } from './client';

export async function fetchGoogleCalendarStatus(): Promise<CalendarConnectionStatusResponse> {
  return apiClient.request<CalendarConnectionStatusResponse>('/admin/integrations/google');
}

export async function fetchGoogleAuthUrl(): Promise<{ authorizationUrl: string }> {
  return apiClient.request<{ authorizationUrl: string }>('/admin/integrations/google/connect');
}

export async function disconnectGoogleCalendar(): Promise<{ success: boolean; message: string }> {
  return apiClient.request<{ success: boolean; message: string }>('/admin/integrations/google', {
    method: 'DELETE',
  });
}

export async function fetchAvailableCalendars(): Promise<{ items: GoogleCalendarListItem[] }> {
  return apiClient.request<{ items: GoogleCalendarListItem[] }>('/admin/integrations/google/calendars');
}

export async function selectGoogleCalendar(calendarId: string): Promise<any> {
  return apiClient.request<any>('/admin/integrations/google/calendar', {
    method: 'POST',
    body: JSON.stringify({ calendarId }),
  });
}

export async function triggerManualSync(): Promise<any> {
  return apiClient.request<any>('/admin/integrations/google/sync', {
    method: 'POST',
  });
}

export async function fetchSyncJobs(query: SyncJobsQuery = {}): Promise<SyncJobsListResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.status) params.set('status', query.status);

  const qs = params.toString();
  return apiClient.request<SyncJobsListResponse>(`/admin/integrations/google/jobs${qs ? `?${qs}` : ''}`);
}

export async function retrySyncJob(jobId: string): Promise<any> {
  return apiClient.request<any>(`/admin/integrations/google/jobs/${jobId}/retry`, {
    method: 'POST',
  });
}

export async function fetchConflicts(query: ConflictsQuery = {}): Promise<ConflictsListResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.status) params.set('status', query.status);

  const qs = params.toString();
  return apiClient.request<ConflictsListResponse>(
    `/admin/integrations/google/conflicts${qs ? `?${qs}` : ''}`,
  );
}

export async function fetchConflictDetail(id: string): Promise<any> {
  return apiClient.request<any>(`/admin/integrations/google/conflicts/${id}`);
}

export async function resolveConflict(
  id: string,
  dto: ResolveConflictDto,
): Promise<any> {
  return apiClient.request<any>(`/admin/integrations/google/conflicts/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}
