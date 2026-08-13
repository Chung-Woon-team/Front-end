import type { ApiResponse } from '../types/api';

// Vite 는 빌드 시점에 이 값을 번들에 박는다. Cloud Run 런타임 환경변수로는 못 바꾼다.
// .env (커밋됨) 에 배포된 백엔드 주소가 들어있어 dev/build 모두 그 값을 쓴다.
// 다른 백엔드를 써야 할 때만 --build-arg VITE_API_BASE_URL=... 로 덮어쓴다 (Dockerfile 참고).
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Swagger 문서 스키마는 snake_case 로 적혀 있지만, 실서버 응답은 camelCase 다
// (직접 curl 로 확인, 2026-08-13). 여기 경로들은 실제 응답 기준으로 맞췄다.
export const ENDPOINTS = {
  instructions: () => '/api/instructions',
  instructionConstraints: (instructionId: string) => `/api/instructions/${instructionId}/constraints`,
  constraintsList: () => '/api/constraints',
  approveConstraint: (constraintId: string) => `/api/constraints/${constraintId}/approve`,
  rejectConstraint: (constraintId: string) => `/api/constraints/${constraintId}/reject`,
  billOfLadingExtract: () => '/api/bill-of-ladings/extract',
  ping: () => '/api/ping',
  // 아직 백엔드에 없는 엔드포인트 (문서상으로만 존재, 야드/KPI/브리핑/리비전 화면은 계속 mock 사용).
  yardView: (planVersion: string) => `/api/plans/${planVersion}/yard-view`,
  kpi: (planVersion: string) => `/api/plans/${planVersion}/kpi`,
  briefing: (planVersion: string) => `/api/plans/${planVersion}/briefing`,
  plans: () => '/api/plans',
} as const;

// Unwraps the { success, data } / { success: false, error } envelope every endpoint uses.
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: isFormData ? init?.headers : { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = (await response.json()) as ApiResponse<T>;
  if (!body.success) {
    throw new Error(`${body.error.code}: ${body.error.message}`);
  }
  return body.data;
}
