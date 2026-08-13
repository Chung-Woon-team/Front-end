export type CellState = 'EMPTY' | 'KEPT' | 'MOVED' | 'NEW' | 'CLOSED';

export interface YardBlockBounds {
  row0: number;
  col0: number;
  row1: number;
  col1: number;
}

export interface YardBlock {
  block_id: string;
  closed: boolean;
  closure_reason: string | null;
  bounds: YardBlockBounds;
}

export interface YardCell {
  row: number;
  col: number;
  slot_id: string;
  state: CellState;
  vehicle_id?: string;
  brand?: string;
  // GET /api/yard/occupancy의 slot에 이미 실려오는 값 — 클릭 상세 패널에 그대로 쓴다.
  next_mode?: string;
  departure_cutoff_at?: string;
}

export interface YardLegendEntry {
  label: string;
  color: string;
}

export interface YardView {
  plan_version: string;
  based_on_version: string;
  grid: { rows: number; cols: number };
  blocks: YardBlock[];
  cells: YardCell[];
  legend: Record<CellState, YardLegendEntry>;
}

export interface GridPoint {
  row: number;
  col: number;
}

// t는 백엔드가 계산한 공용 타임라인(틱)이다 — 차량마다 첫 waypoint의 t가 달라서
// (예: 0, 1, 2, 3…) 같은 진입 지점을 한 틱씩 차이를 두고 통과하게 되어 있다.
// 3D 씬은 이 t를 그대로 따라가야 차량들이 동시에 출발하지 않고 순서대로 출발한다.
export interface PathPoint extends GridPoint {
  t: number;
}

// waypoints는 실제 이동 경로 전체(출발~도착, 중간 경유점 포함)다. 지금은 mock이
// api/yard.ts에서 만들어 내려주지만, 실제로는 백엔드(경로 계산 엔진)가 채워준다 —
// 3D 씬은 이 배열을 그대로 따라가기만 하면 된다(직접 경로를 계산하지 않는다).
export interface VehicleMove {
  vehicle_id: string;
  waypoints: PathPoint[];
}
