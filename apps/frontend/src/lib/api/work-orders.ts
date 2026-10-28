import {
  AssignWorkOrderTechnicianDto,
  CancelWorkOrderDto,
  CreateWorkOrderFromBookingDto,
  UpdateWorkOrderStatusDto,
  WorkOrderListQuery,
} from '@tampilkit-ac/api-contract';
import { apiClient } from './client';

export interface WorkOrderListResponse {
  items: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchWorkOrders(query: WorkOrderListQuery): Promise<WorkOrderListResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.search) params.set('search', query.search);
  if (query.status) params.set('status', query.status);
  if (query.technicianId) params.set('technicianId', query.technicianId);
  if (query.startDate) params.set('startDate', query.startDate);
  if (query.endDate) params.set('endDate', query.endDate);

  const qs = params.toString();
  return apiClient.request<WorkOrderListResponse>(`/admin/work-orders${qs ? `?${qs}` : ''}`);
}

export async function fetchWorkOrderDetail(id: string): Promise<any> {
  return apiClient.request<any>(`/admin/work-orders/${id}`);
}

export async function createWorkOrderFromBooking(dto: CreateWorkOrderFromBookingDto): Promise<any> {
  return apiClient.request<any>('/admin/work-orders', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateWorkOrderStatus(id: string, dto: UpdateWorkOrderStatusDto): Promise<any> {
  return apiClient.request<any>(`/admin/work-orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function assignWorkOrderTechnician(id: string, dto: AssignWorkOrderTechnicianDto): Promise<any> {
  return apiClient.request<any>(`/admin/work-orders/${id}/assign`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function cancelWorkOrder(id: string, dto: CancelWorkOrderDto): Promise<any> {
  return apiClient.request<any>(`/admin/work-orders/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}
