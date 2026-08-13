import type { ApiResponse } from '../types/api';

// Vite 는 빌드 시점에 이 값을 번들에 박는다. Cloud Run 런타임 환경변수로는 못 바꾸므로
// 이미지를 빌드할 때 --build-arg VITE_API_BASE_URL=... 로 넣는다 (Dockerfile 참고).
// 없으면 로컬 개발 기준으로 떨어진다.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Every endpoint from the backend team's contract (docs/FRONTEND_CONTRACT.md), in one place.
export const ENDPOINTS = {
  instructions: () => '/api/instructions',
  instruction: (instructionId: string) => `/api/instructions/${instructionId}`,
  approveConstraint: (constraintId: string) => `/api/constraints/${constraintId}/approve`,
  rejectConstraint: (constraintId: string) => `/api/constraints/${constraintId}/reject`,
  yardView: (planVersion: string) => `/api/plans/${planVersion}/yard-view`,
  kpi: (planVersion: string) => `/api/plans/${planVersion}/kpi`,
  briefing: (planVersion: string) => `/api/plans/${planVersion}/briefing`,
  plans: () => '/api/plans',
} as const;

// Unwraps the { success, data } / { success: false, error } envelope every endpoint uses.
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = (await response.json()) as ApiResponse<T>;
  if (!body.success) {
    throw new Error(`${body.error.code}: ${body.error.message}`);
  }
  return body.data;
}
