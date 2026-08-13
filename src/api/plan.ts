import { apiFetch, ENDPOINTS } from './client';
import type {
  CreatePlanRequest,
  ExecutionResult,
  PlanDetail,
  PlanSummary,
  RejectPlanRequest,
  ReviewRequest,
} from '../types/plan';

export async function fetchPlans(): Promise<PlanSummary[]> {
  return apiFetch<PlanSummary[]>(ENDPOINTS.plans());
}

export async function fetchPlan(planVersion: string): Promise<PlanDetail> {
  return apiFetch<PlanDetail>(ENDPOINTS.plan(planVersion));
}

export async function createPlan(payload: CreatePlanRequest): Promise<ExecutionResult> {
  return apiFetch<ExecutionResult>(ENDPOINTS.plans(), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function approvePlan(planVersion: string, payload: ReviewRequest = {}): Promise<PlanSummary> {
  return apiFetch<PlanSummary>(ENDPOINTS.approvePlan(planVersion), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function rejectPlan(planVersion: string, payload: RejectPlanRequest = {}): Promise<PlanSummary> {
  return apiFetch<PlanSummary>(ENDPOINTS.rejectPlan(planVersion), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
