// Real backend yard endpoints (GET /api/yard/state, /api/yard/occupancy, /api/vehicles,
// POST /api/yard/occupancy/check + /confirm). Deliberately separate from types/yard.ts,
// which is the shape the 3D relocation demo (YardScene/BlockMesh/VehicleMesh) consumes —
// src/api/yardLive.ts adapts this real shape into that one.
// snake_case. Re-curl-verified 2026-08-13 — the occupancy shape changed since the morning
// check (grid.size/block_size and a bare `occupied: ParkedVehicle[]` list are gone; the
// grid is now non-square (22 rows × 46 cols) and occupancy returns every slot, empty or not).

export interface BlockPayload {
  block_id: string;
  closed: boolean;
}

export interface SlotPayload {
  slot_id: string;
  block_id: string;
  status: string;
}

export interface YardState {
  blocks: BlockPayload[];
  slots: SlotPayload[];
  placements: Record<string, string>;
}

export interface Grid {
  rows: number;
  cols: number;
  road_width: number;
  block_rows: number;
  block_cols: number;
  total_slots: number;
  road_cells: number;
}

export interface OccupancySummary {
  total: number;
  occupied: number;
  available: number;
  occupancy_pct: number;
}

export interface BlockState {
  block_id: string;
  zone_id: number;
  zone_code: string;
  origin_row: number;
  origin_col: number;
  block_rows: number;
  block_cols: number;
  capacity: number;
  occupied: number;
  closed: boolean;
  closure_reason?: string;
}

export type SlotStatus = 'EMPTY' | 'OCCUPIED' | 'BLOCKED';
export type NextMode = 'TRUCK' | 'RAIL' | 'SHIP';

export interface SlotState {
  slot_id: string;
  block_id: string;
  row: number;
  col: number;
  lane: number;
  depth: number;
  access_side: 'NORTH' | 'SOUTH';
  status: SlotStatus;
  vehicle_id?: string;
  next_mode?: NextMode;
  departure_cutoff_at?: string;
}

export interface YardOccupancyResponse {
  grid: Grid;
  // false면 slots[].status가 실제 상태가 아니라 전부 EMPTY 더미다 — 반드시 확인할 것.
  grid_seeded: boolean;
  summary: OccupancySummary;
  blocks: BlockState[];
  slots: SlotState[];
  generated_at: string;
}

export interface VehiclePayload {
  vehicle_id: string;
  status: string;
  priority: string;
  next_mode?: string;
  departure_cutoff_at?: string;
  brand?: string;
  discharge_sequence?: number;
}

export type OccupancySourceType = 'FIXED_CAMERA' | 'DRONE' | 'MANUAL';

export interface OccupancyCheckResponse {
  batch_id: string;
  diff_count: number;
  captured_at: string;
  confidence: number;
  requires_confirmation: boolean;
}

export type OccupancyConfirmChoice = 'PHOTO' | 'KEEP';

export interface OccupancyConfirmRequest {
  choice: OccupancyConfirmChoice;
}

export interface OccupancyConfirmResponse {
  batch_id: string;
  choice: OccupancyConfirmChoice;
  applied_count: number;
}
