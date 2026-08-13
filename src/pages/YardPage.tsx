import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, RefreshCw, Zap } from 'lucide-react';
import { YardScene } from '../components/yard/YardScene';
import { LEGEND } from '../api/yard';
import { fetchLiveYardView, runLiveRelocation } from '../api/yardLive';
import { approvePlan } from '../api/plan';
import type { VehicleMove, YardView } from '../types/yard';

interface RelocationStats {
  movedVehicleCount: number;
  planRetentionRate: number;
  hardViolations: number;
  calcMs: number;
}

export function YardPage() {
  const [yardView, setYardView] = useState<YardView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRelocating, setIsRelocating] = useState(false);
  const [relocateError, setRelocateError] = useState<string | null>(null);
  const [stats, setStats] = useState<RelocationStats | null>(null);
  const [moves, setMoves] = useState<VehicleMove[]>([]);
  const [pendingPlanVersion, setPendingPlanVersion] = useState<string | null>(null);
  const [approvedPlanVersion, setApprovedPlanVersion] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  const loadYard = () => {
    fetchLiveYardView()
      .then((view) => {
        setYardView(view);
        setStats(null);
        setMoves([]);
        setPendingPlanVersion(null);
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : '야드 데이터를 불러오지 못했습니다.');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadYard();
  }, []);

  const handleRefresh = () => {
    if (pendingPlanVersion) return;
    setIsLoading(true);
    setLoadError(null);
    loadYard();
  };

  const totalVehicles = yardView?.cells.filter((c) => c.vehicle_id).length ?? 0;
  const totalSlots = yardView?.cells.length ?? 0;

  const handleRelocate = async () => {
    if (!yardView || isRelocating || pendingPlanVersion) return;
    setIsRelocating(true);
    setRelocateError(null);
    try {
      const result = await runLiveRelocation(yardView);
      setYardView(result.yardView);
      setMoves(result.moves);
      setStats({
        movedVehicleCount: result.movedVehicleCount,
        planRetentionRate: result.planRetentionRate,
        hardViolations: result.hardViolations,
        calcMs: result.calcMs,
      });
      setPendingPlanVersion(result.yardView.plan_version);
      setApprovedPlanVersion(null);
    } catch (err) {
      setRelocateError(err instanceof Error ? err.message : '재배치 계산에 실패했습니다.');
    } finally {
      setIsRelocating(false);
    }
  };

  const handleApprovePlan = async () => {
    if (!pendingPlanVersion || isApproving) return;
    setIsApproving(true);
    setRelocateError(null);
    try {
      const approved = await approvePlan(pendingPlanVersion, { reviewer: '야드관리자A' });
      const confirmedYard = await fetchLiveYardView();
      setYardView(confirmedYard);
      setMoves([]);
      setApprovedPlanVersion(approved.plan_version);
      setPendingPlanVersion(null);
    } catch (err) {
      setRelocateError(err instanceof Error ? err.message : '알고리즘 결과 승인에 실패했습니다.');
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-bold text-neutral-900">야드 배치</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {yardView
            ? `실시간 야드 상태와 재배치 결과를 3D로 표시합니다. (차량 ${totalVehicles}/${totalSlots})`
            : '실시간 야드 상태와 재배치 결과를 3D로 표시합니다.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
        <p className="text-sm text-neutral-500">
          블록 폐쇄는{' '}
          <Link to="/instructions" className="font-medium text-primary-600 underline hover:text-primary-700">
            지시 관리
          </Link>
          에서 제약 조건을 승인하면 여기에 반영됩니다.
        </p>

        <button
          type="button"
          onClick={handleRelocate}
          disabled={!yardView || isRelocating || Boolean(pendingPlanVersion)}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40"
        >
          {isRelocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {isRelocating ? '재배치 계산 중…' : '재배치 실행'}
        </button>

        {pendingPlanVersion && (
          <button
            type="button"
            onClick={handleApprovePlan}
            disabled={isApproving}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
          >
            {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isApproving ? '승인 반영 중…' : '알고리즘 승인'}
          </button>
        )}

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading || Boolean(pendingPlanVersion)}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
        >
          <RefreshCw className="h-4 w-4" />
          새로고침
        </button>
      </div>

      {loadError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loadError}</div>
      )}
      {relocateError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {relocateError}
        </div>
      )}
      {approvedPlanVersion && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          플랜 {approvedPlanVersion}이(가) 승인되어 야드 상태에 반영됐습니다.
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="변경 차량 수" value={stats ? `${stats.movedVehicleCount}` : '-'} />
        <StatCard label="계획 유지율" value={stats ? `${stats.planRetentionRate.toFixed(1)}%` : '-'} />
        <StatCard
          label="HARD CONSTRAINT 위반"
          value={stats ? `${stats.hardViolations}` : '-'}
          tone={stats && stats.hardViolations === 0 ? 'good' : undefined}
        />
        <StatCard label="계산시간" value={stats ? `${stats.calcMs}ms` : '-'} />
      </div>

      <div className="mt-4 h-[320px] overflow-hidden rounded-xl border border-neutral-200 bg-neutral-950 sm:h-[420px] lg:h-[500px]">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-neutral-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : yardView ? (
          <YardScene yardView={yardView} moves={moves} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            표시할 야드 데이터가 없습니다.
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-neutral-200 bg-white px-4 py-3">
        {Object.entries(LEGEND).map(([state, entry]) => (
          <span key={state} className="flex items-center gap-1.5 text-xs text-neutral-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-xs text-neutral-600">
          <span className="inline-block h-0 w-4 border-t-2 border-dashed border-secondary-600" />
          이동 경로
        </span>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: 'good' }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${tone === 'good' ? 'text-emerald-600' : 'text-neutral-900'}`}>
        {value}
      </p>
    </div>
  );
}
