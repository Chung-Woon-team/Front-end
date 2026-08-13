import type { ApiResponse } from '../types/api';

// Vite 는 빌드 시점에 이 값을 번들에 박는다. Cloud Run 런타임 환경변수로는 못 바꾼다.
// .env (커밋됨) 에 배포된 백엔드 주소가 들어있어 dev/build 모두 그 값을 쓴다.
// 다른 백엔드를 써야 할 때만 --build-arg VITE_API_BASE_URL=... 로 덮어쓴다 (Dockerfile 참고).
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// 실서버 응답/요청 바디 케이싱은 컨트롤러마다 다르다 (직접 curl 로 확인, 2026-08-13):
// instructions/constraints 는 snake_case, plans 요청 바디는 camelCase 로 받는다.
// Swagger 문서의 스키마 케이싱을 그대로 믿지 말고, 새 엔드포인트를 쓰기 전엔 항상 curl 로 재확인할 것.
// 전체 목록은 /v3/api-docs (Swagger UI: /swagger-ui/index.html) 기준.
export const ENDPOINTS = {
  // instruction-controller
  instructions: () => '/api/instructions',
  instructionConstraints: (instructionId: string) => `/api/instructions/${instructionId}/constraints`,
  // constraint-controller
  constraintsList: () => '/api/constraints',
  approveConstraint: (constraintId: string) => `/api/constraints/${constraintId}/approve`,
  rejectConstraint: (constraintId: string) => `/api/constraints/${constraintId}/reject`,
  // bill-of-lading-controller
  billOfLadingExtract: () => '/api/bill-of-ladings/extract',
  // dashboard-controller
  dashboard: () => '/api/dashboard',
  // yard-controller / yard-occupancy-controller
  yardState: () => '/api/yard/state',
  yardOccupancy: () => '/api/yard/occupancy',
  vehicles: () => '/api/vehicles',
  // plan-controller
  plans: () => '/api/plans',
  plan: (planVersion: string) => `/api/plans/${planVersion}`,
  approvePlan: (planVersion: string) => `/api/plans/${planVersion}/approve`,
  rejectPlan: (planVersion: string) => `/api/plans/${planVersion}/reject`,
  // ping-controller
  ping: () => '/api/ping',
  // KPI/브리핑은 아직 백엔드에 없다 (2026-08-13 /v3/api-docs 기준) — 해당 화면은 계속 PlaceholderPage.
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
