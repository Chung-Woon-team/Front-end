import type { Constraint, InstructionResult } from '../types/instruction';

// Backend controllers aren't live yet (only GET /api/ping responds) — this mocks the
// exact payload shape from the backend team's contract so it's a drop-in swap for
// real apiFetch(ENDPOINTS.xxx(), {...}) calls (see ./client.ts) once the endpoints exist.

const store = new Map<string, InstructionResult>();

// "반려 사유는 이력에 남는다" — mock audit trail for approve/reject actions.
const reviewLog: { constraint_id: string; action: 'APPROVE' | 'REJECT'; reviewer: string; reason?: string }[] = [];

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function nowIso(): string {
  return new Date().toISOString().slice(0, 19);
}

function nextInstructionId(): string {
  return `INS-${String(store.size + 1).padStart(3, '0')}`;
}

function mockConstraints(instructionId: string): Constraint[] {
  return [
    {
      constraint_id: `${instructionId}-C1`,
      type: 'BLOCK_CLOSURE',
      type_label: '블록 폐쇄',
      summary: 'B02 블록을 8/13 14:00부터 폐쇄',
      priority: 'HARD',
      priority_label: '필수',
      confidence: 0.99,
      status: 'PENDING_REVIEW',
      status_label: '승인 대기',
      targets: ['B02'],
      actions: ['APPROVE', 'REJECT'],
    },
    {
      constraint_id: `${instructionId}-C2`,
      type: 'OUTBOUND_PRIORITY',
      type_label: '출고 우선순위',
      summary: '8/13 09:00 이전 컷오프 차량을 게이트 가까이 배치',
      priority: 'SOFT',
      priority_label: '권장',
      confidence: 0.9,
      status: 'PENDING_REVIEW',
      status_label: '승인 대기',
      targets: [],
      actions: ['APPROVE', 'REJECT'],
    },
    {
      constraint_id: `${instructionId}-C3`,
      type: 'VEHICLE_GROUPING',
      type_label: '묶음 배치',
      summary: '철도 출고 차량을 동쪽 구역으로 모음',
      priority: 'SOFT',
      priority_label: '권장',
      confidence: 0.9,
      status: 'PENDING_REVIEW',
      status_label: '승인 대기',
      targets: [],
      actions: ['APPROVE', 'REJECT'],
    },
  ];
}

export async function submitInstruction(payload: {
  raw_text: string;
  author: string;
}): Promise<InstructionResult> {
  const instructionId = nextInstructionId();
  const result: InstructionResult = {
    instruction: {
      instruction_id: instructionId,
      raw_text: payload.raw_text,
      author: payload.author,
      created_at: nowIso(),
    },
    constraints: mockConstraints(instructionId),
    unresolved: ['가까이'],
    requires_confirmation: true,
  };
  store.set(instructionId, result);
  return delay(result, 2200);
}

export async function fetchInstruction(instructionId: string): Promise<InstructionResult> {
  const result = store.get(instructionId);
  if (!result) {
    throw new Error(`Instruction ${instructionId} not found`);
  }
  // Clone so callers always get a fresh reference, matching a real fetch response
  // (React state setters no-op on an identical object reference).
  return delay(structuredClone(result), 300);
}

export async function approveConstraint(constraintId: string, reviewer: string): Promise<void> {
  for (const result of store.values()) {
    const constraint = result.constraints.find((c) => c.constraint_id === constraintId);
    if (constraint) {
      constraint.status = 'APPROVED';
      constraint.status_label = '승인됨';
      constraint.actions = [];
      reviewLog.push({ constraint_id: constraintId, action: 'APPROVE', reviewer });
      break;
    }
  }
  return delay(undefined, 300);
}

export async function rejectConstraint(
  constraintId: string,
  reviewer: string,
  reason: string,
): Promise<void> {
  for (const result of store.values()) {
    const constraint = result.constraints.find((c) => c.constraint_id === constraintId);
    if (constraint) {
      constraint.status = 'REJECTED';
      constraint.status_label = '반려됨';
      constraint.actions = [];
      reviewLog.push({ constraint_id: constraintId, action: 'REJECT', reviewer, reason });
      break;
    }
  }
  return delay(undefined, 300);
}
