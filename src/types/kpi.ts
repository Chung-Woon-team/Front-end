// plan-controller. GET /api/plans/{planVersion}/kpi
// 계약: KPI·브리핑 API 단일 계약서 v1.0 3.1 (docs/FRONTEND_CONTRACT.md:84 보다 이쪽이 정본)
//
// 프론트는 계산하지 않고 문자열도 조립하지 않는다. label·delta_label·unit_label·status_label 은
// 서버가 만든 표시용 값이라 그대로 출력하고, better·tone 은 색과 화살표 방향을 고르는 데만 쓴다.
//
// ⚠️ 서버가 default-property-inclusion: non_null 이라 값이 없으면 키가 통째로 빠진다.
//    '값이 null' 이 아니라 '키 없음' 으로 다뤄야 해서 옵셔널(?) 로 잡고 ?. 로 접근한다.
//
// ⚠️ unit 과 unit_label 은 다르다. unit 은 'METER'/'COUNT' 같은 **코드값**이고,
//    화면에 찍어야 하는 건 unit_label('m'/'건')이다. 헷갈리면 "COUNT" 가 화면에 나온다.

import type { PlanStatus } from './plan';

/** 낮을수록 좋은 지표인지 높을수록 좋은 지표인지. 화살표 방향·색을 정하라고 서버가 주는 값. */
export type BetterDirection = 'LOWER' | 'HIGHER';

/** 지표·하이라이트의 색조. 프론트가 좋고 나쁨을 판단하지 않는다. */
export type KpiTone = 'GOOD' | 'WARN' | 'NEUTRAL';

export interface KpiMetric {
  /** 'avg_move_distance' | 'rehandle_proxy' | 'plan_retention_rate' */
  key: string;
  /** 화면에 그대로 출력할 한국어 지표명. 예: '평균 이동거리' */
  label: string;
  /** 코드값. 'METER' | 'DEPTH' | 'PERCENT'. 화면에는 unit_label 을 쓴다. */
  unit: string;
  /** 화면에 찍는 단위. 'm' | 'depth' | '%' */
  unit_label: string;
  /** 이전 판 값. comparable=false 면 키가 빠진다. */
  before?: number;
  after: number;
  /** 항상 100.0. comparable=false 면 키가 빠진다. */
  index_before?: number;
  /** after/before*100. 장표 9쪽 막대그래프가 index_before 와 이 값을 그린다. */
  index_after?: number;
  /** after - before */
  delta_abs?: number;
  /** 증감률(%). 부호 있음. */
  delta_pct?: number;
  /** 예: '38% 감소' / '5% 증가' / '변화 없음' */
  delta_label?: string;
  better: BetterDirection;
  tone: KpiTone;
}

export interface KpiHighlight {
  /** 'hard_violations' | 'changed_vehicles' | 'calc_millis' */
  key: string;
  label: string;
  value: number;
  /** 코드값. 'COUNT' | 'VEHICLE' | 'MILLIS'. 화면에 찍지 말 것. */
  unit: string;
  /** 화면에 찍는 단위. '건' | '대' | 'ms' */
  unit_label: string;
  tone: KpiTone;
}

export interface KpiResponse {
  /** 실제로 해석된 판 번호. 'latest' 로 요청해도 여기엔 실제 번호가 온다. */
  plan_version: string;
  /** 비교 기준이 된 이전 판. baseline 이면 키가 빠진다. */
  based_on_version?: string;
  status: PlanStatus;
  /** '검토 전' | '승인 대기' | '승인됨' | '반려됨' */
  status_label: string;
  /** false 면 metrics·highlights 가 빈 배열이다. */
  has_kpi: boolean;
  /** false 면 전후 비교가 불가능해 막대를 하나(after)만 그린다. */
  comparable: boolean;
  /** 거리 축 단위 코드. 항상 'METER'. */
  unit: string;
  /** 거리 축 단위 표기. 항상 'm'. */
  unit_label: string;
  metrics: KpiMetric[];
  highlights: KpiHighlight[];
}
