import { apiFetch, ENDPOINTS } from './client';
import type { BriefingResponse } from '../types/briefing';

export async function fetchPlanBriefing(planVersion: string): Promise<BriefingResponse> {
  return apiFetch<BriefingResponse>(ENDPOINTS.planBriefing(planVersion));
}
