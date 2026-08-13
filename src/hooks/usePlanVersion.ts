import { useCallback, useEffect, useState } from 'react';
import { fetchPlans } from '../api/plan';
import type { PlanSummary } from '../types/plan';

// KPI 화면과 브리핑 화면은 둘 다 "어느 판(revision)을 볼 것인가" 를 먼저 정해야 한다.
// 두 화면이 같은 선택 로직을 복사하지 않도록 여기 모아둔다.
//
// GET /api/plans 는 최신순(findAllByOrderByIdDesc)이라 첫 원소가 가장 최근 판이다.
// 기본 선택은 승인된 판이 있으면 그중 최신, 없으면 그냥 최신 판이다 — 현장에 실제로
// 반영된 판을 먼저 보여주는 게 맞기 때문이다.
export interface UsePlanVersionResult {
  plans: PlanSummary[];
  planVersion: string | null;
  setPlanVersion: (planVersion: string) => void;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

function pickDefault(plans: PlanSummary[]): string | null {
  if (plans.length === 0) return null;
  const approved = plans.find((plan) => plan.status === 'APPROVED');
  return (approved ?? plans[0]).plan_version;
}

export function usePlanVersion(): UsePlanVersionResult {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [planVersion, setPlanVersion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // 로딩·에러 초기화를 effect 본문이 아니라 여기서 한다.
  // eslint-plugin-react-hooks v7 의 set-state-in-effect 가 effect 본문의 동기 setState 를
  // error 로 잡기 때문이다. 이벤트 핸들러 안의 setState 는 규칙에 걸리지 않는다.
  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchPlans()
      .then((response) => {
        if (cancelled) return;
        setPlans(response);
        // 이미 고른 판이 목록에 남아 있으면 그대로 두고, 없으면 기본값으로 되돌린다.
        setPlanVersion((current) =>
          current && response.some((plan) => plan.plan_version === current) ? current : pickDefault(response),
        );
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '판 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return { plans, planVersion, setPlanVersion, isLoading, error, reload };
}
