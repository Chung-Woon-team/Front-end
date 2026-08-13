import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, RefreshCw, X, Zap } from 'lucide-react';
import { YardScene } from '../components/yard/YardScene';
import { LEGEND } from '../api/yard';
import { fetchLiveYardView, runLiveRelocation } from '../api/yardLive';
import type { VehicleMove, YardView } from '../types/yard';
import { getVehicleType, VEHICLE_TYPE_LABEL } from '../utils/vehicleType';

interface RelocationStats {
  movedVehicleCount: number;
  planRetentionRate: number;
  hardViolations: number;
  calcMs: number;
}

const NEXT_MODE_LABEL: Record<string, string> = {
  TRUCK: '트럭',
  RAIL: '철도',
  SHIP: '선박',
};

function formatDepartureDate(iso?: string): string {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
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

export function YardPage() {
  const [yardView, setYardView] = useState<YardView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRelocating, setIsRelocating] = useState(false);
  const [relocateError, setRelocateError] = useState<string | null>(null);
  const [stats, setStats] = useState<RelocationStats | null>(null);
  const [moves, setMoves] = useState<VehicleMove[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const loadYard = () => {
    fetchLiveYardView()
      .then((view) => {
        setYardView(view);
        setStats(null);
        setMoves([]);
        setSelectedVehicleId(null);
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
    setIsLoading(true);
    setLoadError(null);
    loadYard();
  };

  const totalVehicles = yardView?.cells.filter((c) => c.vehicle_id).length ?? 0;
  const totalSlots = yardView?.cells.length ?? 0;
  const selectedCell = yardView?.cells.find((c) => c.vehicle_id === selectedVehicleId) ?? null;

  const handleRelocate = async () => {
    if (!yardView || isRelocating) return;
    setIsRelocating(true);
    setRelocateError(null);
    setSelectedVehicleId(null);
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
    } catch (err) {
      setRelocateError(err instanceof Error ? err.message : '재배치 계산에 실패했습니다.');
    } finally {
      setIsRelocating(false);
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
          disabled={!yardView || isRelocating}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40"
        >
          {isRelocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {isRelocating ? '재배치 계산 중…' : '재배치 실행'}
        </button>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
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

      <div className="relative mt-4 h-[320px] overflow-hidden rounded-xl border border-neutral-200 bg-neutral-950 sm:h-[420px] lg:h-[500px]">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-neutral-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : yardView ? (
          <YardScene
            yardView={yardView}
            moves={moves}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={setSelectedVehicleId}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            표시할 야드 데이터가 없습니다.
          </div>
        )}

        {selectedCell && (
          <div className="absolute right-3 top-3 z-10 w-64 rounded-xl border border-white/10 bg-neutral-900/95 p-4 text-white shadow-lg backdrop-blur">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold">{selectedCell.vehicle_id}</p>
              <button
                type="button"
                onClick={() => setSelectedVehicleId(null)}
                aria-label="차량 정보 닫기"
                className="text-white/50 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-white/50">슬롯</dt>
                <dd className="font-medium">{selectedCell.slot_id}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-white/50">차종</dt>
                <dd className="font-medium">{VEHICLE_TYPE_LABEL[getVehicleType(selectedCell.vehicle_id!)]}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-white/50">이동방식</dt>
                <dd className="font-medium">
                  {selectedCell.next_mode ? NEXT_MODE_LABEL[selectedCell.next_mode] ?? selectedCell.next_mode : '-'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-white/50">출차 예정</dt>
                <dd className="font-medium">{formatDepartureDate(selectedCell.departure_cutoff_at)}</dd>
              </div>
            </dl>
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
