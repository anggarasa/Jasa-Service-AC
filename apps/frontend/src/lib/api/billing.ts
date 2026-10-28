import { apiClient } from './client';

export interface WorkOrderPricingSummary {
  workOrderId: string;
  workOrderNumber: string;
  bookingCode?: string;
  status: string;
  pricingVersion: number;
  invoice: {
    id: string;
    invoiceNumber: string;
    status: string;
    grandTotal: string;
    verifiedPaidTotal: string;
    outstandingBalance: string;
  } | null;
  originalEstimate: {
    visitFeeSnapshot: string;
    baseServicesTotal: string;
    estimatedTotal: string;
    items: Array<{
      id: string;
      serviceName: string;
      quantity: number;
      unitPrice: string;
      totalPrice: string;
    }>;
  };
  actualCharges: {
    charges: Array<{
      id: string;
      lineType: string;
      description: string;
      quantity: number;
      unitPrice: string;
      lineAmount: string;
      status: string;
      approvedAt?: string | null;
    }>;
    materials: Array<{
      id: string;
      materialName: string;
      quantity: number;
      unit: string;
      unitPrice: string;
      totalAmount: string;
      notes?: string | null;
    }>;
    additionalLaborTotal: string;
    materialsTotal: string;
    grossSubtotal: string;
    finalGrandTotal: string;
  };
  approvals: Array<{
    id: string;
    pricingVersion: number;
    proposedTotal: string;
    approvedTotal: string | null;
    status: string;
    approvalMethod: string;
    approvedByName: string;
    approvedByContact?: string | null;
    approvedAt: string | null;
    evidenceMediaUrl?: string | null;
    internalNotes?: string | null;
  }>;
}

export async function fetchWorkOrderPricing(workOrderId: string): Promise<WorkOrderPricingSummary> {
  const res = await apiClient.request<any>(`/admin/work-orders/${workOrderId}/pricing`);
  return res.data;
}

export async function saveWorkOrderPricing(
  workOrderId: string,
  data: {
    charges: any[];
    materials: any[];
    discountTotal?: number;
    taxRatePercent?: number;
    notes?: string;
  },
): Promise<any> {
  return apiClient.request<any>(`/admin/work-orders/${workOrderId}/pricing`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function createWorkOrderChargeApproval(
  workOrderId: string,
  data: {
    proposedTotal: number;
    approvedTotal?: number;
    approvalMethod: string;
    approvedByName: string;
    approvedByContact?: string;
    approvalEvidenceMediaId?: string;
    internalNotes?: string;
  },
): Promise<any> {
  return apiClient.request<any>(`/admin/work-orders/${workOrderId}/approvals`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Invoices
export async function fetchInvoices(query: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ items: any[]; pagination: any }> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.status) params.set('status', query.status);
  if (query.search) params.set('search', query.search);
  if (query.startDate) params.set('startDate', query.startDate);
  if (query.endDate) params.set('endDate', query.endDate);

  const qs = params.toString();
  const res = await apiClient.request<any>(`/admin/invoices${qs ? `?${qs}` : ''}`);
  return {
    items: res?.items || res?.data || (Array.isArray(res) ? res : []),
    pagination: res?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
}

export async function createDraftInvoice(data: {
  workOrderId: string;
  discountTotal?: number;
  taxTotal?: number;
  dueDays?: number;
}): Promise<any> {
  const res = await apiClient.request<any>('/admin/invoices/drafts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function fetchInvoiceDetail(invoiceId: string): Promise<any> {
  const res = await apiClient.request<any>(`/admin/invoices/${invoiceId}`);
  return res.data;
}

export async function issueInvoice(invoiceId: string): Promise<any> {
  const res = await apiClient.request<any>(`/admin/invoices/${invoiceId}/issue`, {
    method: 'POST',
  });
  return res.data;
}

export async function voidInvoice(invoiceId: string, reason: string): Promise<any> {
  const res = await apiClient.request<any>(`/admin/invoices/${invoiceId}/void`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return res.data;
}

// Payments
export async function fetchPayments(query: {
  page?: number;
  limit?: number;
  status?: string;
  method?: string;
  search?: string;
}): Promise<{ items: any[]; pagination: any }> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.status) params.set('status', query.status);
  if (query.method) params.set('method', query.method);
  if (query.search) params.set('search', query.search);

  const qs = params.toString();
  const res = await apiClient.request<any>(`/admin/payments${qs ? `?${qs}` : ''}`);
  return {
    items: res?.items || res?.data || (Array.isArray(res) ? res : []),
    pagination: res?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
}

export async function recordInvoicePayment(
  invoiceId: string,
  data: {
    method: string;
    amount: number;
    paidAtClaimed?: string;
    notes?: string;
    proofMediaId?: string;
    idempotencyKey?: string;
  },
): Promise<any> {
  const res = await apiClient.request<any>(`/admin/invoices/${invoiceId}/payments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function verifyPayment(paymentId: string, notes?: string): Promise<any> {
  const res = await apiClient.request<any>(`/admin/payments/${paymentId}/verify`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
  return res.data;
}

export async function rejectPayment(paymentId: string, rejectionReason: string): Promise<any> {
  const res = await apiClient.request<any>(`/admin/payments/${paymentId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ rejectionReason }),
  });
  return res.data;
}

// Operational & Financial Reports
export async function fetchOperationalReports(query: {
  startDate?: string;
  endDate?: string;
  technicianId?: string;
  serviceId?: string;
}): Promise<any> {
  const params = new URLSearchParams();
  if (query.startDate) params.set('startDate', query.startDate);
  if (query.endDate) params.set('endDate', query.endDate);
  if (query.technicianId) params.set('technicianId', query.technicianId);
  if (query.serviceId) params.set('serviceId', query.serviceId);

  const qs = params.toString();
  const res = await apiClient.request<any>(`/admin/reports/overview${qs ? `?${qs}` : ''}`);
  return res.data;
}

// Technician APIs
export async function technicianFetchPricing(workOrderId: string): Promise<any> {
  const res = await apiClient.request<any>(`/technician/work-orders/${workOrderId}/pricing`);
  return res.data;
}

export async function technicianSavePricing(workOrderId: string, data: any): Promise<any> {
  return apiClient.request<any>(`/technician/work-orders/${workOrderId}/pricing`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function technicianRecordApproval(workOrderId: string, data: any): Promise<any> {
  return apiClient.request<any>(`/technician/work-orders/${workOrderId}/approvals`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function technicianRecordPayment(workOrderId: string, data: any): Promise<any> {
  const res = await apiClient.request<any>(`/technician/work-orders/${workOrderId}/payments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}
