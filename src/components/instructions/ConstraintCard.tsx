import { useState } from 'react';
import { ArrowUpRight, Ban, Check, Users, X } from 'lucide-react';
import type { ConstraintSummary, ConstraintType } from '../../types/instruction';

const TYPE_ICON: Record<ConstraintType, typeof Ban> = {
  BLOCK_CLOSURE: Ban,
  VEHICLE_GROUPING: Users,
  OUTBOUND_PRIORITY: ArrowUpRight,
};

const TYPE_LABEL: Record<ConstraintType, string> = {
  BLOCK_CLOSURE: '블록 폐쇄',
  VEHICLE_GROUPING: '묶음 배치',
  OUTBOUND_PRIORITY: '출고 우선순위',
};

const PRIORITY_LABEL: Record<ConstraintSummary['priority'], string> = {
  HARD: '필수',
  SOFT: '권장',
};

const STATUS_LABEL: Record<ConstraintSummary['status'], string> = {
  PENDING_REVIEW: '승인 대기',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
};

// target_json/value_json은 서버가 그냥 JSON 문자열로 내려준다 — 여기서 사람이 읽을 문장으로 바꾼다.
function safeParseJson(json?: string): Record<string, unknown> | null {
  if (!json) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function formatValue(value: unknown): string {
  return Array.isArray(value) ? value.join(', ') : String(value);
}

function describeConstraint(constraint: ConstraintSummary): string {
  const target = safeParseJson(constraint.target_json);
  if (constraint.type === 'BLOCK_CLOSURE' && target?.block_ids) {
    return `${formatValue(target.block_ids)} 블록 폐쇄`;
  }
  const value = safeParseJson(constraint.value_json);
  const parts = [
    ...(target ? Object.entries(target).map(([key, val]) => `${key}: ${formatValue(val)}`) : []),
    ...(value ? Object.entries(value).map(([key, val]) => `${key}: ${formatValue(val)}`) : []),
  ];
  return parts.length > 0 ? parts.join(' · ') : TYPE_LABEL[constraint.type];
}

function PriorityBadge({ constraint }: { constraint: ConstraintSummary }) {
  const isHard = constraint.priority === 'HARD';
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isHard ? 'bg-tertiary-800 text-white' : 'bg-neutral-100 text-neutral-600'
      }`}
    >
      {PRIORITY_LABEL[constraint.priority]}
    </span>
  );
}

function StatusBadge({ constraint }: { constraint: ConstraintSummary }) {
  const styles: Record<ConstraintSummary['status'], string> = {
    PENDING_REVIEW: 'bg-secondary-50 text-secondary-700 border border-secondary-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    REJECTED: 'bg-red-50 text-red-700 border border-red-200',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[constraint.status]}`}>
      {STATUS_LABEL[constraint.status]}
    </span>
  );
}

interface ConstraintCardProps {
  constraint: ConstraintSummary;
  onApprove: (constraintId: string) => void;
  onReject: (constraintId: string, reason: string) => void;
}

export function ConstraintCard({ constraint, onApprove, onReject }: ConstraintCardProps) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const TypeIcon = TYPE_ICON[constraint.type];
  const isPending = constraint.status === 'PENDING_REVIEW';

  const submitReject = () => {
    if (!reason.trim()) return;
    onReject(constraint.constraint_id, reason.trim());
    setIsRejecting(false);
    setReason('');
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-1.5 text-primary-700">
          <TypeIcon className="h-4 w-4" />
          <span className="text-xs font-medium">{TYPE_LABEL[constraint.type]}</span>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge constraint={constraint} />
          <StatusBadge constraint={constraint} />
        </div>
      </div>

      <p className="mt-3 text-sm text-neutral-800">{describeConstraint(constraint)}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400">
        <span>신뢰도 {Math.round(constraint.confidence * 100)}%</span>
        {constraint.rejection_reason && <span>반려 사유: {constraint.rejection_reason}</span>}
      </div>

      {isPending && !isRejecting && (
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onApprove(constraint.constraint_id)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
          >
            <Check className="h-3.5 w-3.5" />
            승인
          </button>
          <button
            type="button"
            onClick={() => setIsRejecting(true)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
          >
            <X className="h-3.5 w-3.5" />
            반려
          </button>
        </div>
      )}

      {isRejecting && (
        <div className="mt-4 space-y-2 rounded-lg bg-neutral-50 p-3">
          <label className="block text-xs font-medium text-neutral-600">반려 사유</label>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={2}
            placeholder="예: 블록 번호가 틀림"
            className="w-full rounded-md border border-neutral-200 bg-white p-2 text-xs text-neutral-800 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsRejecting(false);
                setReason('');
              }}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-100"
            >
              취소
            </button>
            <button
              type="button"
              onClick={submitReject}
              disabled={!reason.trim()}
              className="rounded-md bg-tertiary-800 px-2.5 py-1 text-xs font-semibold text-white hover:bg-tertiary-900 disabled:opacity-40"
            >
              반려 확정
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
