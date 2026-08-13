import { useEffect, useState } from 'react';
import { Check, CircleAlert, Copy, FileText, Info, Loader2, OctagonAlert, RefreshCw, TriangleAlert } from 'lucide-react';
import { fetchPlanBriefing } from '../api/briefing';
import { usePlanVersion } from '../hooks/usePlanVersion';
import type { BriefingConfirmation, BriefingResponse, ConfirmationSeverity } from '../types/briefing';

// GET /api/plans/{planVersion}/briefing — 계약은 docs/FRONTEND_CONTRACT.md:115.
//
// 두 가지 도메인 규칙이 이 화면의 뼈대다.
//  1) briefing 은 서버가 완성한 통짜 문자열이다. 프론트는 줄바꿈만 살려서 그대로 보여준다
//     (재조립·재가공 금지, dangerouslySetInnerHTML 금지).
//  2) "확인이 필요한 지점"(confirmations)은 본문에 묻히면 안 되므로 맨 위 별도 영역에 그린다
//     (FRONTEND_CONTRACT.md:129, 장표 5절).
//
// 그리고 code → 한글 매핑 테이블은 만들지 않는다 (FRONTEND_CONTRACT.md:162). 화면에 읽히는
// 문장은 항상 서버가 준 message 다. code 는 작은 모노스페이스 태그로만 곁들인다.

const SEVERITY_ORDER: Record<ConfirmationSeverity, number> = { INFO: 0, WARN: 1, ERROR: 2 };

const SEVERITY_STYLE: Record<
  ConfirmationSeverity,
  { icon: typeof Info; iconWrap: string; card: string; codeTag: string }
> = {
  ERROR: {
    icon: OctagonAlert,
    iconWrap: 'bg-red-100 text-red-600',
    card: 'border-red-200 bg-white',
    codeTag: 'bg-red-50 text-red-700',
  },
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
  ERROR: {
    box: 'border-red-200 bg-red-50',
    badge: 'bg-red-100 text-red-700',
    title: 'text-red-800',
  },
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

type BriefingState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; data: BriefingResponse }
  /** 실패지만 "아직 준비 안 됨"이라 차분하게 안내해야 하는 정상 시나리오. */
  | { kind: 'notice'; code: string; title: string; detail: string; serverMessage: string }
  | { kind: 'error'; message: string };

// apiFetch 는 실패를 `"{code}: {message}"` 문자열 한 줄로 던진다 (api/client.ts:60).
// 파이썬 /internal/brief 가 아직 501 스텁이라 AI001(503)은 지금 시점의 정상 경로이고,
// 브리핑 엔드포인트가 아직 배포 전이면 C003(404)이 온다. 둘 다 빨간 배너감이 아니다.
function calmNoticeFor(code: string): { title: string; detail: string } | null {
  switch (code) {
    case 'AI001':
    case 'AI002':
      return {
        title: '브리핑을 아직 생성할 수 없습니다.',
        detail: 'AI 브리핑 서비스가 아직 응답하지 않습니다. 판과 KPI 는 그대로 있으니 잠시 뒤 새로고침해 주세요.',
      };
    case 'C003':
      return {
        title: '브리핑을 찾을 수 없습니다.',
        detail: '브리핑 API 가 아직 준비되지 않았거나, 선택한 판에 저장된 브리핑이 없습니다.',
      };
    default:
      return null;
  }
}

function toBriefingState(err: unknown): BriefingState {
  const raw = err instanceof Error ? err.message : '브리핑을 불러오지 못했습니다.';
  const matched = /^([A-Za-z]+\d+):\s*([\s\S]*)$/.exec(raw);
  const code = matched ? matched[1] : '';
  const serverMessage = matched ? matched[2].trim() : '';
  const calm = code ? calmNoticeFor(code) : null;
  if (calm) {
    return { kind: 'notice', code, title: calm.title, detail: calm.detail, serverMessage };
  }
  return { kind: 'error', message: raw };
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
              key={`${confirmation.code}-${index}`}
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

function NoticeCard({ title, detail, code, serverMessage }: { title: string; detail: string; code: string; serverMessage: string }) {
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
  const [result, setResult] = useState<{ key: string; state: BriefingState } | null>(null);
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
        if (!cancelled) setResult({ key, state: toBriefingState(err) });
      });

    return () => {
      cancelled = true;
    };
  }, [planVersion, reloadToken]);

  const state: BriefingState = !planVersion
    ? { kind: 'idle' }
    : result && result.key === requestKey
      ? result.state
      : { kind: 'loading' };

  const copied = copiedKey !== null && copiedKey === requestKey;
  const briefing = state.kind === 'ready' ? state.data.briefing : '';
  const confirmations = state.kind === 'ready' ? (state.data.confirmations ?? []) : [];

  const handleRefresh = () => {
    reload();
    setReloadToken((token) => token + 1);
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
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
          >
            <RefreshCw className="h-4 w-4" />
            새로고침
          </button>
        </div>
      </div>

      {plansError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{plansError}</div>
      )}

      {state.kind === 'error' && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.message}</div>
      )}

      {confirmations.length > 0 && <ConfirmationList confirmations={confirmations} />}

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-neutral-300" />
            <h2 className="text-base font-bold text-neutral-900">브리핑 본문</h2>
            {planVersion && (
              <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] text-neutral-500">
                {planVersion}
              </span>
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
          <NoticeCard
            title={state.title}
            detail={state.detail}
            code={state.code}
            serverMessage={state.serverMessage}
          />
        ) : state.kind === 'error' ? (
          <div className="flex min-h-[220px] items-center justify-center text-sm text-neutral-400">
            브리핑을 불러오지 못했습니다. 새로고침을 눌러 다시 시도해 주세요.
          </div>
        ) : briefing.trim() === '' ? (
          <div className="flex min-h-[220px] items-center justify-center text-sm text-neutral-400">
            이 판에는 아직 브리핑이 없습니다.
          </div>
        ) : (
          <BriefingBody text={briefing} />
        )}
      </div>
    </div>
  );
}
