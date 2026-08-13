import { apiFetch, ENDPOINTS } from './client';
import type { KpiResponse } from '../types/kpi';

export async function fetchPlanKpi(planVersion: string): Promise<KpiResponse> {
  return apiFetch<KpiResponse>(ENDPOINTS.planKpi(planVersion));
}
