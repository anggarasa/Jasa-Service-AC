import {
  ArriveWorkOrderDto,
  CompleteWorkOrderDto,
  FollowUpWorkOrderDto,
  SaveServiceReportDto,
  SaveUnitInspectionDto,
  StartWorkOrderDto,
  TechnicianJobsQuery,
  UpdateChecklistItemDto,
} from '@tampilkit-ac/api-contract';
import { apiClient } from './client';

export interface TechnicianDashboardResponse {
  technician: {
    id: string;
    name: string;
    email: string;
    businessName: string;
  };
  metrics: {
    assignedCount: number;
    onTheWayCount: number;
    arrivedCount: number;
    inProgressCount: number;
    completedTodayCount: number;
    activeTotal: number;
  };
  todayJobs: any[];
}

export interface TechnicianJobsListResponse {
  items: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchTechnicianDashboard(): Promise<TechnicianDashboardResponse> {
  return apiClient.request<TechnicianDashboardResponse>('/technician/dashboard');
}

export async function fetchTechnicianWorkOrders(
  query: TechnicianJobsQuery,
): Promise<TechnicianJobsListResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.status) params.set('status', query.status);
  if (query.date) params.set('date', query.date);
  if (query.search) params.set('search', query.search);

  const qs = params.toString();
  return apiClient.request<TechnicianJobsListResponse>(
    `/technician/work-orders${qs ? `?${qs}` : ''}`,
  );
}

export async function fetchTechnicianWorkOrderDetail(id: string): Promise<any> {
  return apiClient.request<any>(`/technician/work-orders/${id}`);
}

export async function startJourney(id: string): Promise<any> {
  return apiClient.request<any>(`/technician/work-orders/${id}/start-journey`, {
    method: 'POST',
  });
}

export async function arriveWorkOrder(id: string, dto: ArriveWorkOrderDto): Promise<any> {
  return apiClient.request<any>(`/technician/work-orders/${id}/arrive`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function startWork(id: string, dto: StartWorkOrderDto): Promise<any> {
  return apiClient.request<any>(`/technician/work-orders/${id}/start`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function saveUnitInspection(
  workOrderId: string,
  itemId: string,
  dto: SaveUnitInspectionDto,
): Promise<any> {
  return apiClient.request<any>(
    `/technician/work-orders/${workOrderId}/items/${itemId}/inspection`,
    {
      method: 'PUT',
      body: JSON.stringify(dto),
    },
  );
}

export async function updateChecklistItem(
  workOrderId: string,
  checklistItemId: string,
  dto: UpdateChecklistItemDto,
): Promise<any> {
  return apiClient.request<any>(
    `/technician/work-orders/${workOrderId}/checklist/${checklistItemId}`,
    {
      method: 'PUT',
      body: JSON.stringify(dto),
    },
  );
}

export async function uploadWorkOrderPhoto(
  workOrderId: string,
  formData: FormData,
): Promise<any> {
  return apiClient.request<any>(`/technician/work-orders/${workOrderId}/photos`, {
    method: 'POST',
    body: formData,
  });
}

export async function deleteWorkOrderPhoto(
  workOrderId: string,
  photoId: string,
): Promise<any> {
  return apiClient.request<any>(
    `/technician/work-orders/${workOrderId}/photos/${photoId}`,
    {
      method: 'DELETE',
    },
  );
}

export async function saveServiceReport(
  workOrderId: string,
  dto: SaveServiceReportDto,
): Promise<any> {
  return apiClient.request<any>(`/technician/work-orders/${workOrderId}/report`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function completeWorkOrder(
  workOrderId: string,
  dto: CompleteWorkOrderDto,
): Promise<any> {
  return apiClient.request<any>(`/technician/work-orders/${workOrderId}/complete`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function followUpWorkOrder(
  workOrderId: string,
  dto: FollowUpWorkOrderDto,
): Promise<any> {
  return apiClient.request<any>(`/technician/work-orders/${workOrderId}/follow-up`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}
