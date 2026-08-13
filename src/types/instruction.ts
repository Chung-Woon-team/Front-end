export type ConstraintType = 'BLOCK_CLOSURE' | 'VEHICLE_GROUPING' | 'OUTBOUND_PRIORITY';
export type ConstraintPriority = 'HARD' | 'SOFT';
export type ConstraintStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
export type ConstraintAction = 'APPROVE' | 'REJECT';

export interface Constraint {
  constraint_id: string;
  type: ConstraintType;
  type_label: string;
  summary: string;
  priority: ConstraintPriority;
  priority_label: string;
  confidence: number;
  status: ConstraintStatus;
  status_label: string;
  targets: string[];
  actions: ConstraintAction[];
}

export interface Instruction {
  instruction_id: string;
  raw_text: string;
  author: string;
  created_at: string;
}

export interface InstructionResult {
  instruction: Instruction;
  constraints: Constraint[];
  unresolved: string[];
  requires_confirmation: boolean;
}
