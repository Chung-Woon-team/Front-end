import type { ApiResponse } from '../types/api';

// Vite 는 빌드 시점에 이 값을 번들 문자열로 박는다. Cloud Run 런타임 환경변수로는 못 바꾼다.
// 배포 이미지의 값은 Dockerfile 의 `ARG VITE_API_BASE_URL` 기본값에서 온다.
// (.env 는 이 저장소에 없다 — .gitignore 가 막고 있어 커밋 자체가 안 된다.)
// 로컬 dev 는 값이 없으니 아래 폴백이 걸려 로컬 백엔드를 본다. 다른 주소를 쓰려면
// frontend/.env.local 을 만들거나 --build-arg VITE_API_BASE_URL=... 로 덮어쓴다.
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
  // 판 하위 리소스. 계약은 docs/FRONTEND_CONTRACT.md:84(KPI) · :115(브리핑).
  planKpi: (planVersion: string) => `/api/plans/${planVersion}/kpi`,
  planBriefing: (planVersion: string) => `/api/plans/${planVersion}/briefing`,
  // ping-controller
  ping: () => '/api/ping',
} as const;

// Unwraps the { success, data } / { success: false, error } envelope every endpoint uses.
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: isFormData ? init?.headers : { 'Content-Type': 'application/json', ...init?.headers },
  });
  // 응답이 JSON 이 아닐 수 있다 — 백엔드 5xx/502, 연결 실패, nginx 가 try_files 로 돌려준 index.html 등.
  // 확인 없이 .json() 을 부르면 "Unexpected token '<'" 로 터져서 진짜 원인(주소·상태코드)이 가려진다.
  let body: ApiResponse<T>;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error(
      `${response.status} ${response.statusText} — 응답이 JSON 이 아니다 (${API_BASE_URL}${path})`,
    );
  }
  if (!body.success) {
    throw new Error(`${body.error.code}: ${body.error.message}`);
  }
  return body.data;
}
