import { useState, type ChangeEvent, type FormEvent } from 'react';
import { AlertTriangle, FileText, ImagePlus, Loader2, Send, X } from 'lucide-react';
import { ConstraintCard } from '../components/instructions/ConstraintCard';
import { extractBillOfLading } from '../api/billOfLading';
import {
  approveConstraint,
  createInstruction,
  fetchConstraints,
  parseConstraints,
  rejectConstraint,
} from '../api/instructions';
import type { BillOfLadingResult } from '../types/billOfLading';
import type { ConstraintSummary } from '../types/instruction';

const DEFAULT_AUTHOR = '야드관리자A';

export function InstructionsPage() {
  const [rawText, setRawText] = useState('');
  const [author, setAuthor] = useState(DEFAULT_AUTHOR);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [instructionId, setInstructionId] = useState<string | null>(null);
  const [constraints, setConstraints] = useState<ConstraintSummary[]>([]);
  const [unresolved, setUnresolved] = useState<string[]>([]);
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteImage, setSiteImage] = useState<File | null>(null);
  const [siteImagePreview, setSiteImagePreview] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [showMismatchConfirm, setShowMismatchConfirm] = useState(false);
  const [dataSyncNote, setDataSyncNote] = useState<'synced' | 'kept' | null>(null);
  const [blFile, setBlFile] = useState<File | null>(null);
  const [blPreview, setBlPreview] = useState<string | null>(null);
  const [blResult, setBlResult] = useState<BillOfLadingResult | null>(null);
  const [isExtractingBl, setIsExtractingBl] = useState(false);
  const [blError, setBlError] = useState<string | null>(null);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (siteImagePreview) URL.revokeObjectURL(siteImagePreview);
    setSiteImage(file);
    setSiteImagePreview(URL.createObjectURL(file));
    setDataSyncNote(null);
    setShowMismatchConfirm(false);
    setIsComparing(true);
    // No comparison backend yet — simulates checking the photo against the current yard data.
    window.setTimeout(() => {
      setIsComparing(false);
      setShowMismatchConfirm(true);
    }, 900);
  };

  const handleImageRemove = () => {
    if (siteImagePreview) URL.revokeObjectURL(siteImagePreview);
    setSiteImage(null);
    setSiteImagePreview(null);
    setIsComparing(false);
    setShowMismatchConfirm(false);
    setDataSyncNote(null);
  };

  const handleConfirmSync = () => {
    setShowMismatchConfirm(false);
    setDataSyncNote('synced');
  };

  const handleCancelSync = () => {
    setShowMismatchConfirm(false);
    setDataSyncNote('kept');
  };

  const handleBlChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (blPreview) URL.revokeObjectURL(blPreview);
    setBlFile(file);
    setBlPreview(URL.createObjectURL(file));
    setBlResult(null);
    setBlError(null);
    setIsExtractingBl(true);
    try {
      const result = await extractBillOfLading(file);
      setBlResult(result);
    } catch (err) {
      setBlError(err instanceof Error ? err.message : '선하증권 인식에 실패했습니다.');
    } finally {
      setIsExtractingBl(false);
    }
  };

  const handleBlRemove = () => {
    if (blPreview) URL.revokeObjectURL(blPreview);
    setBlFile(null);
    setBlPreview(null);
    setBlResult(null);
    setBlError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!rawText.trim() || !siteImage || !blResult || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const instruction = await createInstruction({ raw_text: rawText.trim(), author });
      const outcome = await parseConstraints(instruction.instruction_id);
      const allConstraints = await fetchConstraints();

      setInstructionId(instruction.instruction_id);
      setConstraints(allConstraints.filter((c) => c.instruction_id === instruction.instruction_id));
      setUnresolved(outcome.unresolved);
      setRequiresConfirmation(outcome.requires_confirmation);
      setRawText('');
      handleImageRemove();
      handleBlRemove();
    } catch (err) {
      setError(err instanceof Error ? err.message : '지시 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const replaceConstraint = (updated: ConstraintSummary) => {
    setConstraints((prev) => prev.map((c) => (c.constraint_id === updated.constraint_id ? updated : c)));
  };

  const handleApprove = async (constraintId: string) => {
    const updated = await approveConstraint(constraintId, author);
    replaceConstraint(updated);
  };

  const handleReject = async (constraintId: string, reason: string) => {
    const updated = await rejectConstraint(constraintId, author, reason);
    replaceConstraint(updated);
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
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            현재 주차 상황 사진 <span className="text-red-500">*</span>
          </label>
          <p className="mt-0.5 text-xs text-neutral-400">지금 야드에 주차된 차량 상황을 촬영해 올려주세요.</p>

          <div className="mt-2 flex items-center gap-3">
            {siteImagePreview ? (
              <div className="relative">
                <img
                  src={siteImagePreview}
                  alt="현재 주차 상황 미리보기"
                  className="h-24 w-24 rounded-lg border border-neutral-200 object-cover"
                />
                {isComparing ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleImageRemove}
                    aria-label="상황사진 제거"
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-neutral-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <label
                htmlFor="site_image"
                className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 text-neutral-400 hover:border-primary-400 hover:text-primary-500"
              >
                <ImagePlus className="h-5 w-5" />
                <span className="text-xs">사진 추가</span>
              </label>
            )}
            {siteImage && <span className="max-w-48 truncate text-xs text-neutral-500">{siteImage.name}</span>}
          </div>

          <input id="site_image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

          {isComparing && <p className="mt-2 text-xs text-neutral-400">현재 데이터와 비교 중…</p>}

          {showMismatchConfirm && (
            <div className="mt-3 flex items-start gap-3 rounded-lg border border-secondary-200 bg-secondary-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-secondary-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-secondary-800">사진 속 주차 현황이 현재 데이터와 다릅니다.</p>
                <p className="mt-0.5 text-xs text-secondary-700">사진에 있는 데이터로 변경하시겠습니까?</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmSync}
                    className="rounded-md bg-secondary-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-secondary-700"
                  >
                    확인
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelSync}
                    className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}

          {dataSyncNote === 'synced' && (
            <p className="mt-2 text-xs font-medium text-emerald-600">사진 데이터로 갱신되었습니다.</p>
          )}
          {dataSyncNote === 'kept' && <p className="mt-2 text-xs text-neutral-400">기존 데이터를 유지했습니다.</p>}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-neutral-700">
            선하증권 <span className="text-red-500">*</span>
          </label>
          <p className="mt-0.5 text-xs text-neutral-400">
            업로드하면 AI가 선하증권 정보를 인식하고 차량을 등록합니다. 지시 전송 전 필수입니다.
          </p>

          <div className="mt-2 flex items-center gap-3">
            {blPreview ? (
              <div className="relative">
                <img
                  src={blPreview}
                  alt="선하증권 미리보기"
                  className="h-24 w-24 rounded-lg border border-neutral-200 object-cover"
                />
                {isExtractingBl ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleBlRemove}
                    aria-label="선하증권 제거"
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-neutral-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <label
                htmlFor="bl_image"
                className={`flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-neutral-400 hover:border-primary-400 hover:text-primary-500 ${
                  blError ? 'border-red-300' : 'border-neutral-300'
                }`}
              >
                <FileText className="h-5 w-5" />
                <span className="text-xs">선하증권 추가</span>
              </label>
            )}

            <div className="text-xs">
              {blFile && <p className="max-w-48 truncate text-neutral-500">{blFile.name}</p>}
              {isExtractingBl && <p className="mt-1 text-neutral-400">인식 중…</p>}
              {blResult && (
                <p className="mt-1 font-medium text-emerald-600">
                  {blResult.bl_number} · 차량 {blResult.vehicle_count}대 등록됨
                </p>
              )}
              {blError && <p className="mt-1 text-red-600">{blError}</p>}
            </div>
          </div>

          <input id="bl_image" type="file" accept="image/*" onChange={handleBlChange} className="hidden" />
        </div>

        <div className="mt-4">
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
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:w-48">
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
            disabled={!rawText.trim() || !siteImage || !blResult || isSubmitting}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40 sm:w-auto"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isSubmitting ? '분석 중…' : '지시 전송'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {instructionId && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-700">
              감지된 제약 조건 <span className="text-neutral-400">({constraints.length})</span>
            </h2>
            <span className="text-xs text-neutral-400">{instructionId}</span>
          </div>

          {requiresConfirmation && unresolved.length > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-secondary-200 bg-secondary-50 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-secondary-600" />
              <div>
                <p className="text-sm font-medium text-secondary-800">확인이 필요한 표현이 있습니다</p>
                <p className="mt-0.5 text-sm text-secondary-700">{unresolved.join(', ')}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {constraints.map((constraint) => (
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
