import { useState } from 'react';
import { ArrowUpRight, Ban, Check, Users, X } from 'lucide-react';
import type { Constraint, ConstraintType } from '../../types/instruction';

const TYPE_ICON: Record<ConstraintType, typeof Ban> = {
  BLOCK_CLOSURE: Ban,
  VEHICLE_GROUPING: Users,
  OUTBOUND_PRIORITY: ArrowUpRight,
};

function PriorityBadge({ constraint }: { constraint: Constraint }) {
  const isHard = constraint.priority === 'HARD';
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isHard ? 'bg-tertiary-800 text-white' : 'bg-neutral-100 text-neutral-600'
      }`}
    >
      {constraint.priority_label}
    </span>
  );
}

function StatusBadge({ constraint }: { constraint: Constraint }) {
  const styles: Record<Constraint['status'], string> = {
    PENDING_REVIEW: 'bg-secondary-50 text-secondary-700 border border-secondary-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    REJECTED: 'bg-red-50 text-red-700 border border-red-200',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[constraint.status]}`}>
      {constraint.status_label}
    </span>
  );
}

interface ConstraintCardProps {
  constraint: Constraint;
  onApprove: (constraintId: string) => void;
  onReject: (constraintId: string, reason: string) => void;
}

export function ConstraintCard({ constraint, onApprove, onReject }: ConstraintCardProps) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const TypeIcon = TYPE_ICON[constraint.type];
  const canApprove = constraint.actions.includes('APPROVE');
  const canReject = constraint.actions.includes('REJECT');

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
          <span className="text-xs font-medium">{constraint.type_label}</span>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge constraint={constraint} />
          <StatusBadge constraint={constraint} />
        </div>
      </div>

      <p className="mt-3 text-sm text-neutral-800">{constraint.summary}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400">
        <span>신뢰도 {Math.round(constraint.confidence * 100)}%</span>
        {constraint.targets.length > 0 && <span>대상 {constraint.targets.join(', ')}</span>}
      </div>

      {(canApprove || canReject) && !isRejecting && (
        <div className="mt-4 flex items-center gap-2">
          {canApprove && (
            <button
              type="button"
              onClick={() => onApprove(constraint.constraint_id)}
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
            >
              <Check className="h-3.5 w-3.5" />
              승인
            </button>
          )}
          {canReject && (
            <button
              type="button"
              onClick={() => setIsRejecting(true)}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
            >
              <X className="h-3.5 w-3.5" />
              반려
            </button>
          )}
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
