import { useState, type FormEvent } from 'react';
import { AlertTriangle, Loader2, Send } from 'lucide-react';
import { ConstraintCard } from '../components/instructions/ConstraintCard';
import {
  approveConstraint,
  fetchInstruction,
  rejectConstraint,
  submitInstruction,
} from '../api/instructions';
import type { InstructionResult } from '../types/instruction';

const DEFAULT_AUTHOR = '야드관리자A';

export function InstructionsPage() {
  const [rawText, setRawText] = useState('');
  const [author, setAuthor] = useState(DEFAULT_AUTHOR);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<InstructionResult | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!rawText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await submitInstruction({ raw_text: rawText.trim(), author });
      setResult(response);
      setRawText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const refresh = async (instructionId: string) => {
    const response = await fetchInstruction(instructionId);
    setResult(response);
  };

  const handleApprove = async (constraintId: string) => {
    if (!result) return;
    await approveConstraint(constraintId, author);
    await refresh(result.instruction.instruction_id);
  };

  const handleReject = async (constraintId: string, reason: string) => {
    if (!result) return;
    await rejectConstraint(constraintId, author, reason);
    await refresh(result.instruction.instruction_id);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-neutral-900">지시 입력 및 제약 검토</h1>
        <p className="mt-1 text-sm text-neutral-500">
          현장 지시를 입력하면 AI가 제약 조건으로 구조화합니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-200 bg-white p-5">
        <label htmlFor="raw_text" className="block text-sm font-medium text-neutral-700">
          작업 지시
        </label>
        <textarea
          id="raw_text"
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          rows={3}
          placeholder="예: 오늘 14시부터 B02 블록은 도색작업으로 폐쇄해줘."
          className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white p-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />

        <div className="mt-3 flex items-end justify-between gap-4">
          <div className="w-48">
            <label htmlFor="author" className="block text-sm font-medium text-neutral-700">
              작성자
            </label>
            <input
              id="author"
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <button
            type="submit"
            disabled={!rawText.trim() || isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isSubmitting ? '분석 중…' : '지시 전송'}
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-700">
              감지된 제약 조건 <span className="text-neutral-400">({result.constraints.length})</span>
            </h2>
            <span className="text-xs text-neutral-400">{result.instruction.instruction_id}</span>
          </div>

          {result.requires_confirmation && result.unresolved.length > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-secondary-200 bg-secondary-50 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-secondary-600" />
              <div>
                <p className="text-sm font-medium text-secondary-800">확인이 필요한 표현이 있습니다</p>
                <p className="mt-0.5 text-sm text-secondary-700">{result.unresolved.join(', ')}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {result.constraints.map((constraint) => (
              <ConstraintCard
                key={constraint.constraint_id}
                constraint={constraint}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
