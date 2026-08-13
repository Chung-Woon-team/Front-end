// plan-controller. GET /api/plans/{planVersion}/briefing
// 계약: docs/FRONTEND_CONTRACT.md:115
//
// briefing 은 \n 로 줄바꿈된 통짜 문자열이다. 하지만 "확인이 필요한 지점"은 구조화해서
// 따로 내려주므로(FRONTEND_CONTRACT.md:129) 프론트가 경고 배지로 눈에 띄게 그려야 한다.
//
// 브리핑 문장에 나오는 숫자는 전부 저장된 PlanKpi 에서만 나온다 — AI 가 수치를 만들지
// 않는다는 도메인 규칙이 서버에서 강제된다 (DOMAIN.md:231).

export type ConfirmationSeverity = 'INFO' | 'WARN' | 'ERROR';

export interface BriefingConfirmation {
  /** 예: 'URGENT_FAR_SLOT', 'OBSERVATION_MISMATCH' */
  code: string;
  /** 화면에 그대로 출력할 한국어 문장. */
  message: string;
  severity: ConfirmationSeverity;
  /** 예: '현장 확인 권장'. 없으면 키가 빠진다. */
  action_hint?: string;
}

export interface BriefingResponse {
  briefing: string;
  confirmations?: BriefingConfirmation[];
}
