import { apiClient } from './client';

export interface DashboardMetrics {
  totalBookingsToday: number;
  pendingBookings: number;
  confirmedBookings: number;
  inProgressBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  activeTechnicians: number;
  activeWorkOrders: number;
  estimatedRevenueToday: number;
}

export interface DashboardOverviewData {
  metrics: DashboardMetrics;
  todayAppointments: any[];
  recentBookings: any[];
  recentWorkOrders: any[];
}

export async function fetchDashboardOverview(): Promise<DashboardOverviewData> {
  return apiClient.request<DashboardOverviewData>('/admin/dashboard/overview');
}
