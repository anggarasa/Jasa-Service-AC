import {
  AdminAssignTechnicianDto,
  AdminBookingListQuery,
  AdminCalendarQuery,
  AdminCancelBookingDto,
  AdminConfirmBookingDto,
  AdminCreateManualBookingDto,
  AdminReassignTechnicianDto,
  AdminRejectBookingDto,
  AdminRescheduleBookingDto,
  AdminUpdateInternalNotesDto,
  TechnicianScheduleQuery,
} from '@tampilkit-ac/api-contract';
import { apiClient } from './client';

export interface AdminBookingListResponse {
  items: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchAdminBookings(query: AdminBookingListQuery): Promise<AdminBookingListResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.search) params.set('search', query.search);
  if (query.status) params.set('status', query.status);
  if (query.technicianId) params.set('technicianId', query.technicianId);
  if (query.startDate) params.set('startDate', query.startDate);
  if (query.endDate) params.set('endDate', query.endDate);

  const qs = params.toString();
  return apiClient.request<AdminBookingListResponse>(`/admin/bookings${qs ? `?${qs}` : ''}`);
}

export async function fetchAdminBookingDetail(id: string): Promise<any> {
  return apiClient.request<any>(`/admin/bookings/${id}`);
}

export async function confirmAdminBooking(id: string, dto: AdminConfirmBookingDto): Promise<any> {
  return apiClient.request<any>(`/admin/bookings/${id}/confirm`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function rejectAdminBooking(id: string, dto: AdminRejectBookingDto): Promise<any> {
  return apiClient.request<any>(`/admin/bookings/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function assignBookingTechnician(id: string, dto: AdminAssignTechnicianDto): Promise<any> {
  return apiClient.request<any>(`/admin/bookings/${id}/assign-technician`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function reassignBookingTechnician(id: string, dto: AdminReassignTechnicianDto): Promise<any> {
  return apiClient.request<any>(`/admin/bookings/${id}/reassign-technician`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function rescheduleAdminBooking(id: string, dto: AdminRescheduleBookingDto): Promise<any> {
  return apiClient.request<any>(`/admin/bookings/${id}/reschedule`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function cancelAdminBooking(id: string, dto: AdminCancelBookingDto): Promise<any> {
  return apiClient.request<any>(`/admin/bookings/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateAdminBookingInternalNotes(id: string, dto: AdminUpdateInternalNotesDto): Promise<any> {
  return apiClient.request<any>(`/admin/bookings/${id}/internal-notes`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function createManualAdminBooking(dto: AdminCreateManualBookingDto): Promise<any> {
  return apiClient.request<any>('/admin/bookings', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function fetchAdminCalendarEvents(query: AdminCalendarQuery): Promise<any[]> {
  const params = new URLSearchParams();
  params.set('view', query.view);
  params.set('startDate', query.startDate);
  params.set('endDate', query.endDate);
  if (query.technicianId) params.set('technicianId', query.technicianId);

  return apiClient.request<any[]>(`/admin/bookings/calendar?${params.toString()}`);
}

export async function fetchTechniciansSchedule(query: TechnicianScheduleQuery): Promise<any[]> {
  const params = new URLSearchParams();
  params.set('date', query.date);
  if (query.technicianId) params.set('technicianId', query.technicianId);

  return apiClient.request<any[]>(`/admin/technicians/schedule?${params.toString()}`);
}
