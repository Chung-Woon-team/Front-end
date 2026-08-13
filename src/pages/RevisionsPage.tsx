import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { BarChart } from '../components/charts';
import { fetchPlans } from '../api/plan';
import { primary, secondary, tertiary } from '../constants/colors';
import type { PlanSummary } from '../types/plan';

// 판(revision)들을 가로로 늘어놓고 비교하는 화면.
//
// KPI 화면(/kpi)과 헷갈리기 쉬운데 성격이 다르다 — KPI 화면은 판 '하나'의 before→after
// 개선폭(GET /api/plans/{planVersion}/kpi)을 보고, 이 화면은 판들 '사이'의 추이를 본다.
// GET /api/plans 는 최신순이라 위에서 아래로 최근 판부터 쌓인다.
export function RevisionsPage() {
  const [plans, setPlans] = useState<PlanSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPlans()
      .then((data) => {
        if (!cancelled) setPlans(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '리비전 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const planList = plans ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">리비전 로그</h1>
        <p className="mt-1 text-sm text-neutral-500">
          판(revision)별 재배치 성과를 나란히 비교합니다. 판 하나의 전후 비교는 KPI 화면에서 볼 수 있습니다.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {isLoading ? (
        <div className="flex min-h-60 items-center justify-center text-neutral-300">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-neutral-700">평균 이동거리</h2>
            <p className="mt-0.5 text-xs text-neutral-400">판별 차량 평균 이동거리 (m)</p>
            <div className="mt-4">
              <BarChart
                rows={planList.map((plan) => ({ label: plan.plan_version, value: plan.avg_move_distance }))}
                color={primary[500]}
                formatValue={(v) => `${v.toFixed(1)}m`}
              />
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-neutral-700">변경 차량 수</h2>
            <p className="mt-0.5 text-xs text-neutral-400">판별 재배치된 차량 대수</p>
            <div className="mt-4">
              <BarChart
                rows={planList.map((plan) => ({ label: plan.plan_version, value: plan.changed_vehicles }))}
                color={secondary[600]}
                formatValue={(v) => `${v}대`}
              />
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-neutral-700">HARD CONSTRAINT 위반</h2>
            <p className="mt-0.5 text-xs text-neutral-400">판별 필수 제약 위반 건수</p>
            <div className="mt-4">
              <BarChart
                rows={planList.map((plan) => ({ label: plan.plan_version, value: plan.hard_violations }))}
                color={tertiary[700]}
                formatValue={(v) => `${v}건`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
