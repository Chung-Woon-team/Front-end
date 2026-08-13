export type ConstraintType = 'BLOCK_CLOSURE' | 'VEHICLE_GROUPING' | 'OUTBOUND_PRIORITY';
export type ConstraintPriority = 'HARD' | 'SOFT';
export type ConstraintStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

// Server DTOs — field names and shape verified against the live backend response,
// not just the OpenAPI doc (the doc's schema is snake_case, the real JSON is camelCase).
export interface InstructionSummary {
  instructionId: string;
}

export interface ParseOutcome {
  instructionId: string;
  constraintIds: string[];
  unresolved: string[];
  requiresConfirmation: boolean;
}

export interface ConstraintSummary {
  constraintId: string;
  instructionId: string;
  type: ConstraintType;
  priority: ConstraintPriority;
  targetJson?: string;
  valueJson?: string;
  windowStart?: string;
  windowEnd?: string;
  confidence: number;
  status: ConstraintStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}
