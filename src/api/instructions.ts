import { apiFetch, ENDPOINTS } from './client';
import type { ConstraintStatus, ConstraintSummary, InstructionSummary, ParseOutcome } from '../types/instruction';

export async function createInstruction(payload: {
  raw_text: string;
  author?: string;
}): Promise<InstructionSummary> {
  return apiFetch<InstructionSummary>(ENDPOINTS.instructions(), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function parseConstraints(instructionId: string): Promise<ParseOutcome> {
  return apiFetch<ParseOutcome>(ENDPOINTS.instructionConstraints(instructionId), {
    method: 'POST',
  });
}

// GET /api/constraints only filters by status, not instruction — filter by instructionId client-side.
export async function fetchConstraints(status?: ConstraintStatus): Promise<ConstraintSummary[]> {
  const query = status ? `?status=${status}` : '';
  return apiFetch<ConstraintSummary[]>(`${ENDPOINTS.constraintsList()}${query}`);
}

export async function approveConstraint(constraintId: string, reviewer: string): Promise<ConstraintSummary> {
  return apiFetch<ConstraintSummary>(ENDPOINTS.approveConstraint(constraintId), {
    method: 'PATCH',
    body: JSON.stringify({ reviewer }),
  });
}

export async function rejectConstraint(
  constraintId: string,
  reviewer: string,
  reason: string,
): Promise<ConstraintSummary> {
  return apiFetch<ConstraintSummary>(ENDPOINTS.rejectConstraint(constraintId), {
    method: 'PATCH',
    body: JSON.stringify({ reviewer, reason }),
  });
}
