export type ConstraintType = 'BLOCK_CLOSURE' | 'VEHICLE_GROUPING' | 'OUTBOUND_PRIORITY';
export type ConstraintPriority = 'HARD' | 'SOFT';
export type ConstraintStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

// Server DTOs — field names and shape verified against the live backend response,
// not just the OpenAPI doc. The live backend serializes snake_case for these
// endpoints (checked via curl, 2026-08-13) — don't trust the doc's casing blindly.
export interface InstructionSummary {
  instruction_id: string;
}

export interface ParseOutcome {
  instruction_id: string;
  constraint_ids: string[];
  unresolved: string[];
  requires_confirmation: boolean;
}

export interface ConstraintSummary {
  constraint_id: string;
  instruction_id: string;
  type: ConstraintType;
  priority: ConstraintPriority;
  target_json?: string;
  value_json?: string;
  window_start?: string;
  window_end?: string;
  confidence: number;
  status: ConstraintStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
}
