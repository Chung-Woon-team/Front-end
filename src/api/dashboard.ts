import { apiFetch, ENDPOINTS } from './client';
import type { DashboardResponse } from '../types/dashboard';

export async function fetchDashboard(): Promise<DashboardResponse> {
  return apiFetch<DashboardResponse>(ENDPOINTS.dashboard());
}
