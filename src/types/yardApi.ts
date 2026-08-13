// Real backend yard endpoints (GET /api/yard/state, /api/yard/occupancy, /api/vehicles).
// Deliberately separate from types/yard.ts, which is the self-contained mock model
// driving the 3D relocation demo (YardScene/BlockMesh/VehicleMesh) — don't merge them
// without also rewiring that demo, since the shapes don't match one-to-one.
// snake_case, curl-verified 2026-08-13.

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
  size: number;
  road_width: number;
  block_size: number;
  total_slots: number;
}

export interface BlockState {
  block_id: string;
  zone_id: number;
  origin_row: number;
  origin_col: number;
  size: number;
  closed: boolean;
  closure_reason?: string;
}

export interface ParkedVehicle {
  vehicle_id: string;
  slot_id: string;
  block_id: string;
  row: number;
  col: number;
  next_mode?: string;
  departure_cutoff_at?: string;
}

export interface YardOccupancyResponse {
  grid: Grid;
  blocks: BlockState[];
  occupied: ParkedVehicle[];
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
