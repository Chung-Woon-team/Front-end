// plan-controller. GET /api/plans/{planVersion}/kpi
// 계약: docs/FRONTEND_CONTRACT.md:84 "화면 2 — KPI 전후 비교 (장표 6·9쪽)"
//
// 프론트는 계산하지 않고 문자열도 조립하지 않는다. label·delta_label·better·tone 은
// 전부 서버가 만들어서 내려주는 표시용 값이므로 그대로 출력한다 (FRONTEND_CONTRACT.md:162).
//
// ⚠️ 서버가 default-property-inclusion: non_null 이라 값이 없으면 키가 통째로 빠진다.
//    '값이 null' 이 아니라 '키 없음' 으로 다뤄야 해서 옵셔널(?) 로 잡고 ?. 로 접근한다.

/** 낮을수록 좋은 지표인지 높을수록 좋은 지표인지. 화살표 방향·색을 정하라고 서버가 주는 값. */
export type BetterDirection = 'LOWER' | 'HIGHER';

/** 하이라이트 카드의 색조. 프론트가 좋고 나쁨을 판단하지 않는다. */
export type HighlightTone = 'GOOD' | 'WARN' | 'BAD' | 'NEUTRAL';

export interface KpiMetric {
  /** 원본 PlanKpi 필드명. 예: 'avg_move_distance' */
  key: string;
  /** 화면에 그대로 출력할 한국어 지표명. 예: '평균 이동거리' */
  label: string;
  /** 이전 판의 값. 비교할 판이 없으면(baseline) 키가 빠진다. */
  before?: number;
  after: number;
  /** 기준판을 100 으로 잡은 지수. 장표 9쪽 막대그래프가 이 두 값을 그린다. */
  index_before?: number;
  index_after: number;
  better: BetterDirection;
  /** 예: '38% 감소'. 비교 대상이 없으면 키가 빠진다. */
  delta_label?: string;
}

export interface KpiHighlight {
  key: string;
  label: string;
  value: number;
  /** 예: '건', '대', 'ms' */
  unit: string;
  tone: HighlightTone;
}

export interface KpiResponse {
  /**
   * 거리 축의 단위. 격자 1칸이 몇 m 인지 아직 확정 전이라 'CELL' 로 내려올 수 있고,
   * 상수가 정해지면 'METER' 가 된다. 축 라벨에 이 값을 그대로 쓴다.
   */
  unit: string;
  metrics?: KpiMetric[];
  highlights?: KpiHighlight[];
}
