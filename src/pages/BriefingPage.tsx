import { useEffect, useState } from 'react';
import { Check, CircleAlert, Copy, FileText, Info, Loader2, RefreshCw, Sparkles, TriangleAlert } from 'lucide-react';
import { fetchPlanBriefing, generatePlanBriefing } from '../api/briefing';
import { usePlanVersion } from '../hooks/usePlanVersion';
import type { BriefingConfirmation, BriefingResponse, ConfirmationSeverity } from '../types/briefing';

// 화면 3 — 브리핑. GET / POST /api/plans/{planVersion}/briefing
//
// 이 화면의 뼈대가 되는 규칙 넷.
//  1) GET 은 "저장된 것만" 읽는다. 파이썬이 죽어 있어도 200 이고, 아직 만들기 전이어도
//     404 가 아니라 200 + state='NOT_GENERATED' 다. 즉 조회는 AI 상태와 무관하다.
//  2) 브리핑을 만드는 건 POST 하나뿐이다. POST 응답은 GET 과 형태가 완전히 같아서 그대로
//     화면에 반영하면 되고 재조회가 필요 없다. AI001/AI002 는 이 POST 에서만 난다.
//  3) briefing 은 서버가 완성한 통짜 문자열이다. 줄바꿈만 살려서 그대로 보여준다
//     (재조립·재가공 금지, dangerouslySetInnerHTML 금지).
//  4) confirmations 는 본문에 묻히면 안 되므로 맨 위 별도 영역에 그린다.
//
// state_label·source_label 은 서버가 만든 표시용 문자열이라 그대로 찍는다. state/source
// enum 은 "무슨 색 배지냐" 를 고르는 데만 쓴다. confirmation code → 한글 매핑 테이블도
// 만들지 않는다 — 화면에 읽히는 문장은 언제나 서버가 준 message 다.
//
// ⚠️ 서버가 non_null 직렬화라 값이 없으면 키가 통째로 빠진다. 생성 전이면 briefing·source·
//    source_label·generated_at 이 아예 안 온다. 전부 옵셔널로 다뤄야 한다.

/** 조회는 최대 몇 초, 생성은 파이썬 + Gemini 를 타므로 최대 1분까지 걸릴 수 있다. */
const GENERATING_HINT = 'AI 가 문장을 만드는 중입니다… 최대 1분 정도 걸릴 수 있습니다.';

// severity 는 계약상 WARN | INFO 둘뿐이다 (ERROR 는 없어졌다).
// 계약 밖 값이 와도 화면이 깨지지 않도록 조회 시점의 기본값 분기만 남겨둔다.
const SEVERITY_ORDER: Record<ConfirmationSeverity, number> = { INFO: 0, WARN: 1 };

const SEVERITY_STYLE: Record<
  ConfirmationSeverity,
  { icon: typeof Info; iconWrap: string; card: string; codeTag: string }
> = {
  WARN: {
    icon: TriangleAlert,
    iconWrap: 'bg-secondary-100 text-secondary-600',
    card: 'border-secondary-200 bg-white',
    codeTag: 'bg-secondary-50 text-secondary-700',
  },
  INFO: {
    icon: Info,
    iconWrap: 'bg-primary-50 text-primary-600',
    card: 'border-neutral-200 bg-white',
    codeTag: 'bg-neutral-100 text-neutral-600',
  },
};

const SECTION_STYLE: Record<ConfirmationSeverity, { box: string; badge: string; title: string }> = {
  WARN: {
    box: 'border-secondary-200 bg-secondary-50',
    badge: 'bg-secondary-100 text-secondary-700',
    title: 'text-secondary-800',
  },
  INFO: {
    box: 'border-neutral-200 bg-neutral-50',
    badge: 'bg-neutral-100 text-neutral-600',
    title: 'text-neutral-800',
  },
};

type LoadState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; data: BriefingResponse }
  /** 실패지만 "아직 준비 안 됨"이라 차분하게 안내해야 하는 정상 시나리오. */
  | { kind: 'notice'; code: string; title: string; detail: string; serverMessage: string }
  | { kind: 'error'; message: string };

/** apiFetch 는 실패를 `"{code}: {message}"` 문자열 한 줄로 던진다 (api/client.ts:62). */
function splitApiError(err: unknown, fallback: string): { code: string; message: string } {
  const raw = err instanceof Error ? err.message : fallback;
  const matched = /^([A-Za-z]+\d+):\s*([\s\S]*)$/.exec(raw);
  if (!matched) return { code: '', message: raw };
  return { code: matched[1], message: matched[2].trim() };
}

// 조회(GET)에서 나올 수 있는 "차분히 안내할" 실패는 판 자체가 없는 C003 뿐이다.
// AI001/AI002 를 여기서 기대하던 분기는 없앴다 — 파이썬이 죽어도 GET 은 200 이다.
function toLoadState(err: unknown): LoadState {
  const { code, message } = splitApiError(err, '브리핑을 불러오지 못했습니다.');
  if (code === 'C003') {
    return {
      kind: 'notice',
      code,
      title: '판을 찾을 수 없습니다.',
      detail: '선택한 판이 삭제되었거나 아직 만들어지지 않았습니다. 판 목록을 새로고침해 주세요.',
      serverMessage: message,
    };
  }
  return { kind: 'error', message: code ? `${code}: ${message}` : message };
}

/** 생성(POST)에서만 나는 실패들. 여기서 실패해도 보고 있던 브리핑은 그대로 둔다. */
function toGenerateMessage(err: unknown): string {
  const { code, message } = splitApiError(err, '브리핑을 생성하지 못했습니다.');
  switch (code) {
    case 'AI001':
    case 'AI002':
      return 'AI 서비스가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요.';
    case 'C001':
      return 'KPI 가 없는 판은 브리핑을 만들 수 없습니다.';
    case 'C003':
      return '판을 찾을 수 없습니다. 판 목록을 새로고침해 주세요.';
    default:
      return code ? `${code}: ${message}` : message;
  }
}

/**
 * generated_at 은 오프셋 없는 Asia/Seoul 로컬시각이다 ('2026-08-13T14:32:07').
 * 그대로 Date 에 넣으면 브라우저 타임존으로 해석돼 시각이 밀리므로 +09:00 을 붙여
 * 순간을 확정한 뒤, 다른 화면과 같은 Asia/Seoul 포맷으로 찍는다 (DashboardPage 패턴).
 */
function formatGeneratedAt(iso: string): string {
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(iso);
  const date = new Date(hasZone ? iso : `${iso}+09:00`);
  if (Number.isNaN(date.getTime())) return iso;
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`;
}

function worstSeverity(confirmations: BriefingConfirmation[]): ConfirmationSeverity {
  return confirmations.reduce<ConfirmationSeverity>(
    (worst, item) => ((SEVERITY_ORDER[item.severity] ?? 0) > (SEVERITY_ORDER[worst] ?? 0) ? item.severity : worst),
    'INFO',
  );
}

/**
 * 서버가 만든 문장이므로 내용은 손대지 않는다. 줄바꿈만 살리고, `- ` 로 시작하는 줄만
 * 불릿처럼 보이게 다듬는다 (마커만 점으로 대체, 문장은 그대로).
 */
function BriefingBody({ text }: { text: string }) {
  const bulletMarker = /^\s*[-•*]\s+/;
  return (
    <div className="mt-4 space-y-1.5 text-[15px] leading-relaxed text-neutral-800">
      {text.split('\n').map((line, index) => {
        if (line.trim() === '') return <div key={index} className="h-2.5" />;
        if (bulletMarker.test(line)) {
          return (
            <div key={index} className="flex gap-2.5 pl-1">
              <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
              <span className="whitespace-pre-wrap">{line.replace(bulletMarker, '')}</span>
            </div>
          );
        }
        return (
          <p key={index} className="whitespace-pre-wrap">
            {line}
          </p>
        );
      })}
    </div>
  );
}

function ConfirmationList({ confirmations }: { confirmations: BriefingConfirmation[] }) {
  const section = SECTION_STYLE[worstSeverity(confirmations)] ?? SECTION_STYLE.INFO;

  return (
    <section className={`mb-4 rounded-xl border p-5 ${section.box}`}>
      <div className="flex items-center gap-2">
        <TriangleAlert className={`h-4 w-4 ${section.title}`} />
        <h2 className={`text-base font-bold ${section.title}`}>확인이 필요한 지점</h2>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${section.badge}`}>
          {confirmations.length}건
        </span>
      </div>
      <p className="mt-1 text-xs text-neutral-500">브리핑을 공유하기 전에 아래 항목을 먼저 확인하세요.</p>

      <div className="mt-4 space-y-2.5">
        {confirmations.map((confirmation, index) => {
          const style = SEVERITY_STYLE[confirmation.severity] ?? SEVERITY_STYLE.INFO;
          const SeverityIcon = style.icon;
          return (
            <div
              key={`${confirmation.code}-${confirmation.slot_id ?? ''}-${index}`}
              className={`flex items-start gap-3 rounded-lg border p-3.5 ${style.card}`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.iconWrap}`}>
                <SeverityIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-neutral-900">{confirmation.message}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${style.codeTag}`}>
                    {confirmation.code}
                  </span>
                  {confirmation.slot_id && (
                    <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] text-neutral-500">
                      {confirmation.slot_id}
                    </span>
                  )}
                  {confirmation.action_hint && (
                    <span className="text-xs text-neutral-500">→ {confirmation.action_hint}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function NoticeCard({
  title,
  detail,
  code,
  serverMessage,
}: {
  title: string;
  detail: string;
  code: string;
  serverMessage: string;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
        <CircleAlert className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-semibold text-neutral-700">{title}</p>
      <p className="mt-1 max-w-md text-sm text-neutral-500">{detail}</p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-400">
        {code && <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] text-neutral-500">{code}</span>}
        {serverMessage && <span>{serverMessage}</span>}
      </div>
    </div>
  );
}

export function BriefingPage() {
  const { plans, planVersion, setPlanVersion, isLoading: isPlansLoading, error: plansError, reload } = usePlanVersion();
  const [reloadToken, setReloadToken] = useState(0);
  // 응답은 "어느 요청의 결과인지"(판 + 새로고침 횟수)와 함께 들고 있는다. 그래야 effect 본문에서
  // 로딩 상태를 setState 하지 않고도(react-hooks/set-state-in-effect) 렌더 시점에 유도할 수 있고,
  // 판을 바꾸는 순간 이전 판의 브리핑이 잠깐 남아 보이는 일도 없다.
  const [result, setResult] = useState<{ key: string; state: LoadState } | null>(null);
  // 생성 진행/실패도 같은 키로 묶어둔다. 판을 바꾸면 자동으로 안 보이게 된다.
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<{ key: string; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const requestKey = planVersion ? `${planVersion}#${reloadToken}` : '';

  useEffect(() => {
    if (!planVersion) return;

    const key = `${planVersion}#${reloadToken}`;
    let cancelled = false;

    fetchPlanBriefing(planVersion)
      .then((response) => {
        if (!cancelled) setResult({ key, state: { kind: 'ready', data: response } });
      })
      .catch((err: unknown) => {
        if (!cancelled) setResult({ key, state: toLoadState(err) });
      });

    return () => {
      cancelled = true;
    };
  }, [planVersion, reloadToken]);

  const state: LoadState = !planVersion
    ? { kind: 'idle' }
    : result && result.key === requestKey
      ? result.state
      : { kind: 'loading' };

  const data = state.kind === 'ready' ? state.data : null;
  const briefing = data?.briefing ?? '';
  const confirmations = data?.confirmations ?? [];
  const generatedAt = data?.generated_at ? formatGeneratedAt(data.generated_at) : '';
  const isGenerated = data?.state === 'GENERATED';

  const isGenerating = generatingKey !== null && generatingKey === requestKey;
  const generateErrorMessage = generateError && generateError.key === requestKey ? generateError.message : '';
  const copied = copiedKey !== null && copiedKey === requestKey;
  const canGenerate = planVersion !== null && data !== null && !isGenerating;

  const handleRefresh = () => {
    reload();
    setReloadToken((token) => token + 1);
  };

  // 이벤트 핸들러라 setState 를 자유롭게 부를 수 있다 (set-state-in-effect 는 effect 본문만 본다).
  const handleGenerate = () => {
    if (!planVersion || isGenerating) return;

    const key = requestKey;
    setGeneratingKey(key);
    setGenerateError(null);

    generatePlanBriefing(planVersion)
      .then((response) => {
        // POST 응답은 GET 과 형태가 같으므로 그대로 반영한다 — 재조회하지 않는다.
        // 그사이 다른 판의 응답이 이미 자리를 잡았으면 덮어쓰지 않는다.
        setResult((current) =>
          current !== null && current.key !== key ? current : { key, state: { kind: 'ready', data: response } },
        );
      })
      .catch((err: unknown) => {
        // 생성이 실패해도 보고 있던 브리핑은 그대로 둔다 (화면을 비우지 않는다).
        setGenerateError({ key, message: toGenerateMessage(err) });
      })
      .finally(() => {
        setGeneratingKey((current) => (current === key ? null : current));
      });
  };

  const handleCopy = () => {
    if (!briefing) return;
    navigator.clipboard
      ?.writeText(briefing)
      .then(() => {
        setCopiedKey(requestKey);
        window.setTimeout(() => setCopiedKey(null), 1500);
      })
      .catch(() => setCopiedKey(null));
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">브리핑</h1>
          <p className="mt-1 text-sm text-neutral-500">이 판이 왜 이렇게 바뀌었는지, 담당자가 읽을 문장으로 정리합니다.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="판 선택"
            value={planVersion ?? ''}
            onChange={(event) => setPlanVersion(event.target.value)}
            disabled={plans.length === 0}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:text-neutral-400"
          >
            {plans.length === 0 ? (
              <option value="">{isPlansLoading ? '판 불러오는 중…' : '판 없음'}</option>
            ) : (
              plans.map((plan) => (
                <option key={plan.plan_version} value={plan.plan_version}>
                  {plan.plan_version} · {plan.status}
                </option>
              ))
            )}
          </select>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isGenerating}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            새로고침
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            aria-busy={isGenerating}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isGenerating ? '생성 중…' : isGenerated ? '다시 생성' : '브리핑 생성'}
          </button>
        </div>
      </div>

      {plansError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{plansError}</div>
      )}

      {state.kind === 'error' && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.message}</div>
      )}

      {generateErrorMessage && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{generateErrorMessage}</span>
        </div>
      )}

      {confirmations.length > 0 && <ConfirmationList confirmations={confirmations} />}

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <FileText className="h-4 w-4 text-neutral-300" />
              <h2 className="text-base font-bold text-neutral-900">브리핑 본문</h2>
              {planVersion && (
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] text-neutral-500">
                  {planVersion}
                </span>
              )}
            </div>

            {data && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    isGenerated ? 'bg-primary-50 text-primary-600' : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {data.state_label}
                </span>
                {data.source_label && (
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${
                      data.source === 'FALLBACK' ? 'bg-neutral-100 text-neutral-600' : 'bg-primary-50 text-primary-600'
                    }`}
                  >
                    {data.source_label}
                  </span>
                )}
                {generatedAt && <span className="text-neutral-400">{generatedAt} 생성</span>}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!briefing}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? '복사됨' : '복사'}
          </button>
        </div>

        {state.kind === 'loading' || (state.kind === 'idle' && isPlansLoading) ? (
          <div className="flex min-h-[220px] items-center justify-center text-neutral-300">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : state.kind === 'idle' ? (
          <div className="flex min-h-[220px] items-center justify-center text-sm text-neutral-400">
            생성된 판이 없습니다.
          </div>
        ) : state.kind === 'notice' ? (
          <NoticeCard title={state.title} detail={state.detail} code={state.code} serverMessage={state.serverMessage} />
        ) : state.kind === 'error' ? (
          <div className="flex min-h-[220px] items-center justify-center text-sm text-neutral-400">
            브리핑을 불러오지 못했습니다. 새로고침을 눌러 다시 시도해 주세요.
          </div>
        ) : briefing.trim() === '' ? (
          // state='NOT_GENERATED' — 아직 만들기 전. 실패가 아니라 정상 상태다.
          <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
            {isGenerating ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-primary-400" />
                <p className="mt-3 text-sm font-semibold text-neutral-700">{GENERATING_HINT}</p>
                <p className="mt-1 text-sm text-neutral-500">창을 닫지 말고 잠시만 기다려 주세요.</p>
              </>
            ) : (
              <>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-semibold text-neutral-700">아직 브리핑이 없습니다.</p>
                <p className="mt-1 max-w-md text-sm text-neutral-500">
                  이 판의 KPI 를 바탕으로 담당자가 읽을 문장을 만듭니다. 생성에는 최대 1분 정도 걸립니다.
                </p>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="mt-4 flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40"
                >
                  <Sparkles className="h-4 w-4" />
                  브리핑 생성
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {isGenerating && (
              // 재생성 중에도 기존 브리핑은 그대로 두고, 위에 진행 표시만 얹는다.
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-primary-100 bg-primary-50 px-3 py-2 text-sm text-primary-700">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                <span>{GENERATING_HINT}</span>
              </div>
            )}
            <BriefingBody text={briefing} />
          </>
        )}
      </div>
    </div>
  );
}
