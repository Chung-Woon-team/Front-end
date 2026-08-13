// plan-controller. Response bodies snake_case (curl-verified 2026-08-13).
// Request bodies (CreatePlanRequest/ReviewRequest/RejectPlanRequest) are camelCase
// per the OpenAPI schema and accepted without a validation error when tested live,
// but — unlike the response side — that's not a full confirmation the optional
// fields actually bind correctly. Re-check with curl before relying on them.
export type PlanStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface PlanSummary {
  plan_version: string;
  based_on_version?: string;
  status: PlanStatus;
  avg_move_distance: number;
  changed_vehicles: number;
  hard_violations: number;
  approved_by?: string;
  approved_at?: string;
}

export interface MoveDto {
  vehicle_id: string;
  from_slot: string;
  to_slot: string;
  sequence: number;
  reason?: string;
  distance_meters: number;
}

export interface PathStep {
  row: number;
  col: number;
  t: number;
}

export interface MoveWithPath extends MoveDto {
  path: PathStep[];
}

export interface PlanDetail {
  plan_version: string;
  based_on_version?: string;
  status: PlanStatus;
  placements: Record<string, string>;
  moves: MoveDto[];
  avg_move_distance: number;
  rehandle_proxy: number;
  hard_violations: number;
  changed_vehicles: number;
  plan_retention_rate: number;
  calc_millis: number;
}

export interface ExecutionResult {
  plan_version: string;
  based_on_version?: string;
  status: PlanStatus;
  placement_count: number;
  move_count: number;
  unplaced: string[];
  moves: MoveWithPath[];
}

export interface CreatePlanRequest {
  basePlanVersion?: string;
  triggeredByInstructionId?: string;
}

export interface ReviewRequest {
  reviewer?: string;
}

export interface RejectPlanRequest {
  reviewer?: string;
  reason?: string;
}
