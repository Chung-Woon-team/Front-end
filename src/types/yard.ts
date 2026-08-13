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

export interface VehicleMove {
  vehicle_id: string;
  from: { row: number; col: number };
  to: { row: number; col: number };
}
