// plan-controller. GET / POST /api/plans/{planVersion}/briefing
// 계약: KPI·브리핑 API 단일 계약서 v1.0 3.2 · 3.3
//
// GET 은 저장된 것만 읽는다 — 파이썬이 죽어 있어도 200 이다.
// POST 는 파이썬을 태워 브리핑을 생성(재생성)하고 저장한 뒤 GET 과 똑같은 형태를 돌려준다.
// 아직 생성 전이어도 GET 은 404 가 아니라 200 + state='NOT_GENERATED' 다.
//
// briefing 문장에 나오는 숫자는 전부 저장된 PlanKpi 에서만 나온다. LLM 은 숫자가 없는
// 첫 문장과 부연 한 줄만 만들고, 숫자 불릿은 파이썬 코드가 조립한다.

export type BriefingState = 'GENERATED' | 'NOT_GENERATED';

/** 'AI' = Gemini 가 문장을 다듬음 / 'FALLBACK' = 수치만으로 자동 조립됨 */
export type BriefingSource = 'AI' | 'FALLBACK';

export type ConfirmationSeverity = 'WARN' | 'INFO';

export interface BriefingConfirmation {
  /** 'HARD_VIOLATION' | 'RETENTION_DROP' | 'LONG_MOVE' | 'NO_BASELINE' | 'OBSERVATION_MISMATCH' */
  code: string;
  severity: ConfirmationSeverity;
  /** 화면에 그대로 출력할 한국어 문장. */
  message: string;
  /** 담당자가 할 일. 없으면 키가 빠진다. */
  action_hint?: string;
  /** 관련 슬롯. 예: 'B03-R15-C04'. 없으면 키가 빠진다. */
  slot_id?: string;
}

export interface BriefingResponse {
  plan_version: string;
  state: BriefingState;
  /** '생성됨' | '생성 전' */
  state_label: string;
  /** state='NOT_GENERATED' 면 키가 빠진다. */
  source?: BriefingSource;
  /** 'AI 생성' | '수치 기반 자동 작성' */
  source_label?: string;
  /** ISO-8601 로컬시각(초까지). 예: '2026-08-13T14:32:07' */
  generated_at?: string;
  /** \n 로 줄바꿈된 통짜 문자열. 생성 전이면 키가 빠진다. */
  briefing?: string;
  confirmations: BriefingConfirmation[];
}
