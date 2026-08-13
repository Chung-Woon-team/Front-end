import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, BarChart3, Loader2, Minus, RefreshCw } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchPlanKpi } from '../api/kpi';
import { usePlanVersion } from '../hooks/usePlanVersion';
import type { HighlightTone, KpiMetric, KpiResponse } from '../types/kpi';

// 화면 2 — KPI 전후 비교 (docs/FRONTEND_CONTRACT.md:82, 장표 6·9쪽)
//
// 이 화면은 아무것도 계산하지 않고 문자열도 조립하지 않는다. label·delta_label·unit 은
// 서버가 만들어 보낸 표시용 값이라 그대로 찍고, better·tone 은 "무슨 색이냐 / 화살표가
// 어느 쪽이냐" 를 고르는 데만 쓴다 (FRONTEND_CONTRACT.md:162 — enum→한글 매핑 금지).
//
// ⚠️ 서버가 non_null 직렬화라 값이 없으면 키가 통째로 빠진다. 기준판(baseline)이면
//    before·index_before·delta_label 이 아예 안 온다. 전부 옵셔널로 다루고 화면에는
//    '비교할 이전 판 없음' 으로 대체한다 — undefined 가 찍히면 안 된다.

/** 서버의 better 와 실제 증감을 합쳐 낸 판정. 색을 고르는 데만 쓴다. */
type Trend = 'IMPROVED' | 'WORSENED' | 'FLAT' | 'NO_BASELINE';

/** 값이 어느 쪽으로 움직였나. 화살표 모양만 정한다. */
type Direction = 'UP' | 'DOWN' | 'FLAT' | 'NONE';

interface MetricRow {
  key: string;
  label: string;
  before?: number;
  after: number;
  index_before?: number;
  index_after: number;
  delta_label?: string;
  trend: Trend;
  direction: Direction;
}

/** 어느 판/어느 새로고침 요청의 응답인지까지 같이 들고 있어야 이전 판 데이터가 남아 보이지 않는다. */
interface LoadedKpi {
  planVersion: string;
  token: number;
  data: KpiResponse | null;
  error: string | null;
}

const BEFORE_BAR_COLOR = '#B0B2B3'; // neutral-400 — 비교 기준이라 늘 중립 회색

const AFTER_BAR_COLOR: Record<Trend, string> = {
  IMPROVED: '#10B981', // emerald-500
  WORSENED: '#EF4444', // red-500
  FLAT: '#8E8F90', // neutral-500
  NO_BASELINE: '#26267A', // primary-500 — 좋다/나쁘다를 말할 근거가 없는 단독 값
};

const TREND_TEXT_CLASS: Record<Trend, string> = {
  IMPROVED: 'text-emerald-600',
  WORSENED: 'text-red-600',
  FLAT: 'text-neutral-500',
  NO_BASELINE: 'text-neutral-400',
};

const TONE_DOT_CLASS: Record<HighlightTone, string> = {
  GOOD: 'bg-emerald-500',
  WARN: 'bg-secondary-500',
  BAD: 'bg-red-500',
  NEUTRAL: 'bg-neutral-300',
};

const TONE_VALUE_CLASS: Record<HighlightTone, string> = {
  GOOD: 'text-emerald-600',
  WARN: 'text-secondary-700',
  BAD: 'text-red-600',
  NEUTRAL: 'text-neutral-900',
};

const NUMBER_FORMAT = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 });

function readTrend(metric: KpiMetric): { trend: Trend; direction: Direction } {
  // 실측값이 있으면 실측값으로, 없으면 지수로 증감 방향을 본다.
  // 둘 다 없으면 비교 대상이 없는 기준판이다.
  const pair =
    metric.before !== undefined
      ? { before: metric.before, after: metric.after }
      : metric.index_before !== undefined
        ? { before: metric.index_before, after: metric.index_after }
        : null;

  if (pair === null) return { trend: 'NO_BASELINE', direction: 'NONE' };
  if (pair.after === pair.before) return { trend: 'FLAT', direction: 'FLAT' };

  const decreased = pair.after < pair.before;
  // "줄어든 게 좋은 지표인가" 는 우리가 판단하지 않는다. 서버의 better 만 본다.
  const improved = metric.better === 'LOWER' ? decreased : !decreased;
  return { trend: improved ? 'IMPROVED' : 'WORSENED', direction: decreased ? 'DOWN' : 'UP' };
}

function TrendIcon({ direction }: { direction: Direction }) {
  if (direction === 'DOWN') return <ArrowDown className="h-3.5 w-3.5 shrink-0" />;
  if (direction === 'UP') return <ArrowUp className="h-3.5 w-3.5 shrink-0" />;
  if (direction === 'FLAT') return <Minus className="h-3.5 w-3.5 shrink-0" />;
  return null;
}

function Spinner({ minHeight }: { minHeight: string }) {
  return (
    <div className={`flex ${minHeight} items-center justify-center text-neutral-300`}>
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}

export function KpiPage() {
  const {
    plans,
    planVersion,
    setPlanVersion,
    isLoading: isPlansLoading,
    error: plansError,
    reload,
  } = usePlanVersion();

  // 로딩 여부는 따로 들고 있지 않고 "무엇을 다 받았나" 에서 파생시킨다.
  // effect 안에서 setState 를 동기로 부르면 react-hooks/set-state-in-effect 에 걸린다.
  const [loadedKpi, setLoadedKpi] = useState<LoadedKpi | null>(null);
  const [kpiReloadToken, setKpiReloadToken] = useState(0);

  useEffect(() => {
    if (!planVersion) return;

    let cancelled = false;
    const requestedVersion = planVersion;
    const requestedToken = kpiReloadToken;

    fetchPlanKpi(requestedVersion)
      .then((response) => {
        if (!cancelled)
          setLoadedKpi({ planVersion: requestedVersion, token: requestedToken, data: response, error: null });
      })
      .catch((err: unknown) => {
        // 엔드포인트가 아직 없으면 404/503 이 온다. 배너만 띄우고 화면은 그대로 둔다.
        if (!cancelled)
          setLoadedKpi({
            planVersion: requestedVersion,
            token: requestedToken,
            data: null,
            error: err instanceof Error ? err.message : 'KPI 를 불러오지 못했습니다.',
          });
      });

    return () => {
      cancelled = true;
    };
  }, [planVersion, kpiReloadToken]);

  // 지금 화면이 요구하는 판/토큰의 응답이 아직 안 왔으면 로딩이다.
  const isKpiLoading =
    planVersion !== null &&
    (loadedKpi === null || loadedKpi.planVersion !== planVersion || loadedKpi.token !== kpiReloadToken);
  const isKpiCurrent = !isKpiLoading && loadedKpi !== null && loadedKpi.planVersion === planVersion;
  const kpi = isKpiCurrent && loadedKpi !== null ? loadedKpi.data : null;
  const kpiError = isKpiCurrent && loadedKpi !== null ? loadedKpi.error : null;

  const metrics = useMemo(() => kpi?.metrics ?? [], [kpi]);
  const highlights = kpi?.highlights ?? [];
  const unit = kpi?.unit ?? '';

  const rows = useMemo<MetricRow[]>(
    () =>
      metrics.map((metric) => {
        const { trend, direction } = readTrend(metric);
        return {
          key: metric.key,
          label: metric.label,
          before: metric.before,
          after: metric.after,
          index_before: metric.index_before,
          index_after: metric.index_after,
          delta_label: metric.delta_label,
          trend,
          direction,
        };
      }),
    [metrics],
  );

  const hasBaseline = rows.some((row) => row.index_before !== undefined);
  const isBusy = isPlansLoading || isKpiLoading;

  const handleRefresh = () => {
    reload();
    setKpiReloadToken((token) => token + 1);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">KPI</h1>
          <p className="mt-1 text-sm text-neutral-500">재배치 전후를 기준판 100 지수로 비교합니다.</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={planVersion ?? ''}
            onChange={(event) => setPlanVersion(event.target.value)}
            disabled={plans.length === 0}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:text-neutral-400"
          >
            {plans.length === 0 ? (
              <option value="">판 없음</option>
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
            disabled={isBusy}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isBusy ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>
      </div>

      {plansError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{plansError}</div>
      )}
      {kpiError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{kpiError}</div>
      )}

      {isPlansLoading && !planVersion ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <Spinner minHeight="min-h-[200px]" />
        </div>
      ) : !planVersion ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-400">
          생성된 판이 없습니다.
        </div>
      ) : (
        <>
          {isKpiLoading ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <Spinner minHeight="min-h-[72px]" />
            </div>
          ) : highlights.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {highlights.map((highlight) => (
                <div key={highlight.key} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT_CLASS[highlight.tone] ?? TONE_DOT_CLASS.NEUTRAL}`}
                    />
                    <p className="text-sm text-neutral-500">{highlight.label}</p>
                  </div>
                  <p className="mt-2 flex items-baseline gap-1">
                    <span
                      className={`text-xl font-bold ${TONE_VALUE_CLASS[highlight.tone] ?? TONE_VALUE_CLASS.NEUTRAL}`}
                    >
                      {NUMBER_FORMAT.format(highlight.value)}
                    </span>
                    <span className="text-sm text-neutral-500">{highlight.unit}</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-400">
              표시할 하이라이트가 없습니다.
            </div>
          )}

          <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900">전후 비교 지수</h2>
                <p className="text-sm text-neutral-500">
                  기준판을 100 으로 놓은 상대 지수입니다. 거리 지표 실측 단위: {unit || '–'}
                </p>
              </div>
              <BarChart3 className="h-5 w-5 shrink-0 text-neutral-300" />
            </div>

            {isKpiLoading ? (
              <Spinner minHeight="min-h-[320px]" />
            ) : rows.length > 0 ? (
              <>
                <div className="mt-4 h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rows} margin={{ top: 24, right: 8, bottom: 8, left: 8 }} barGap={8}>
                      <CartesianGrid stroke="#EEF0F2" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: '#676869', fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#E1E3E5' }}
                      />
                      <YAxis
                        tick={{ fill: '#8E8F90', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        width={72}
                        label={{
                          value: '지수 (기준 100)',
                          angle: -90,
                          position: 'insideLeft',
                          fill: '#8E8F90',
                          fontSize: 12,
                        }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
                        content={({ active, label }) => {
                          if (!active) return null;
                          const row = rows.find((item) => item.label === label);
                          if (!row) return null;
                          return (
                            <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-sm">
                              <p className="font-semibold text-neutral-900">{row.label}</p>
                              <div className="mt-1.5 space-y-1">
                                <p className="flex items-center gap-1.5 text-neutral-600">
                                  <span
                                    className="h-2 w-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: BEFORE_BAR_COLOR }}
                                  />
                                  이전 판{' '}
                                  {row.index_before !== undefined ? (
                                    <span className="text-neutral-900">
                                      지수 {row.index_before}
                                      {row.before !== undefined && (
                                        <span className="text-neutral-400"> · 실측 {NUMBER_FORMAT.format(row.before)}</span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="text-neutral-400">비교할 이전 판 없음</span>
                                  )}
                                </p>
                                <p className="flex items-center gap-1.5 text-neutral-600">
                                  <span
                                    className="h-2 w-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: AFTER_BAR_COLOR[row.trend] }}
                                  />
                                  현재 판{' '}
                                  <span className="text-neutral-900">
                                    지수 {row.index_after}
                                    <span className="text-neutral-400"> · 실측 {NUMBER_FORMAT.format(row.after)}</span>
                                  </span>
                                </p>
                              </div>
                              {row.delta_label && (
                                <p className={`mt-1.5 flex items-center gap-1 font-medium ${TREND_TEXT_CLASS[row.trend]}`}>
                                  <TrendIcon direction={row.direction} />
                                  {row.delta_label}
                                </p>
                              )}
                            </div>
                          );
                        }}
                      />
                      <Bar
                        dataKey="index_before"
                        name="이전 판"
                        fill={BEFORE_BAR_COLOR}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={56}
                      >
                        <LabelList dataKey="index_before" position="top" fill="#8E8F90" fontSize={11} />
                      </Bar>
                      <Bar dataKey="index_after" name="현재 판" radius={[4, 4, 0, 0]} maxBarSize={56}>
                        {rows.map((row) => (
                          <Cell key={row.key} fill={AFTER_BAR_COLOR[row.trend]} />
                        ))}
                        <LabelList dataKey="index_after" position="top" fill="#454546" fontSize={11} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: BEFORE_BAR_COLOR }} />
                    이전 판
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: AFTER_BAR_COLOR.IMPROVED }} />
                    현재 판 (개선)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: AFTER_BAR_COLOR.WORSENED }} />
                    현재 판 (악화)
                  </span>
                </div>

                {!hasBaseline && (
                  <p className="mt-2 text-xs text-neutral-400">비교할 이전 판이 없어 현재 판 지수만 표시합니다.</p>
                )}
              </>
            ) : (
              <div className="flex min-h-[320px] items-center justify-center text-sm text-neutral-400">
                표시할 지표가 없습니다.
              </div>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="text-base font-bold text-neutral-900">지표 상세</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-xs text-neutral-400">
                    <th className="pb-2 font-medium">지표</th>
                    <th className="pb-2 font-medium">이전 판</th>
                    <th className="pb-2 font-medium">현재 판</th>
                    <th className="pb-2 font-medium">지수</th>
                    <th className="pb-2 font-medium">변화</th>
                  </tr>
                </thead>
                <tbody>
                  {isKpiLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-neutral-300">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                      </td>
                    </tr>
                  ) : rows.length > 0 ? (
                    rows.map((row) => (
                      <tr key={row.key} className="border-b border-neutral-100 last:border-0">
                        <td className="py-2.5 font-medium text-neutral-900">{row.label}</td>
                        <td className="py-2.5 text-neutral-600">
                          {row.before !== undefined ? (
                            NUMBER_FORMAT.format(row.before)
                          ) : (
                            <span className="text-neutral-400">비교할 이전 판 없음</span>
                          )}
                        </td>
                        <td className="py-2.5 text-neutral-900">{NUMBER_FORMAT.format(row.after)}</td>
                        <td className="py-2.5 text-neutral-500">
                          {row.index_before !== undefined ? (
                            <>
                              {row.index_before} → {row.index_after}
                            </>
                          ) : (
                            row.index_after
                          )}
                        </td>
                        <td className="py-2.5">
                          {row.delta_label ? (
                            <span className={`flex items-center gap-1 font-medium ${TREND_TEXT_CLASS[row.trend]}`}>
                              <TrendIcon direction={row.direction} />
                              {row.delta_label}
                            </span>
                          ) : (
                            <span className="text-neutral-400">–</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-neutral-400">
                        표시할 지표가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
