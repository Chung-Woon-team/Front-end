import { useMemo, useState } from 'react';
import { RotateCcw, Zap } from 'lucide-react';
import { YardScene } from '../components/yard/YardScene';
import { closeBlock, generateYardView, LEGEND, relocateClosedBlocks } from '../api/yard';
import type { VehicleMove, YardView } from '../types/yard';

interface RelocationStats {
  movedVehicleCount: number;
  planRetentionRate: number;
  hardViolations: number;
  calcMs: number;
}

export function YardPage() {
  const [yardView, setYardView] = useState<YardView>(() => generateYardView(50));
  const [selectedBlockId, setSelectedBlockId] = useState(yardView.blocks[0]?.block_id ?? '');
  const [stats, setStats] = useState<RelocationStats | null>(null);
  const [moves, setMoves] = useState<VehicleMove[]>([]);

  const totalVehicles = useMemo(() => yardView.cells.filter((c) => c.vehicle_id).length, [yardView.cells]);
  const hasClosedBlockWithVehicles = yardView.blocks.some(
    (block) =>
      block.closed &&
      yardView.cells.some(
        (c) =>
          c.vehicle_id &&
          c.row >= block.bounds.row0 &&
          c.row <= block.bounds.row1 &&
          c.col >= block.bounds.col0 &&
          c.col <= block.bounds.col1,
      ),
  );

  const handleReset = () => {
    const fresh = generateYardView(50);
    setYardView(fresh);
    setSelectedBlockId(fresh.blocks[0]?.block_id ?? '');
    setStats(null);
    setMoves([]);
  };

  const handleCloseBlock = () => {
    setYardView((prev) => closeBlock(prev, selectedBlockId));
    setMoves([]);
  };

  const handleRelocate = () => {
    const result = relocateClosedBlocks(yardView);
    setYardView(result.yardView);
    setMoves(result.moves);
    setStats({
      movedVehicleCount: result.movedVehicleCount,
      planRetentionRate: result.planRetentionRate,
      hardViolations: result.hardViolations,
      calcMs: result.calcMs,
    });
  };

  const selectedBlock = yardView.blocks.find((b) => b.block_id === selectedBlockId);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-bold text-neutral-900">야드 배치</h1>
        <p className="mt-1 text-sm text-neutral-500">
          블록 폐쇄와 차량 재배치를 3D로 시뮬레이션합니다. ({yardView.plan_version} · 차량 {totalVehicles}/50 ·
          슬롯 {yardView.cells.length})
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
        <select
          value={selectedBlockId}
          onChange={(event) => setSelectedBlockId(event.target.value)}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          {yardView.blocks.map((block) => (
            <option key={block.block_id} value={block.block_id}>
              {block.block_id}
              {block.closed ? ' (폐쇄됨)' : ''}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleCloseBlock}
          disabled={!selectedBlock || selectedBlock.closed}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
        >
          {selectedBlockId} 블록 폐쇄
        </button>

        <button
          type="button"
          onClick={handleRelocate}
          disabled={!hasClosedBlockWithVehicles}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40"
        >
          <Zap className="h-4 w-4" />
          부분 재배치 실행
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
        >
          <RotateCcw className="h-4 w-4" />
          시나리오 재생성
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="변경 차량 수" value={stats ? `${stats.movedVehicleCount}` : '-'} />
        <StatCard label="계획 유지율" value={stats ? `${(stats.planRetentionRate * 100).toFixed(1)}%` : '100.0%'} />
        <StatCard label="HARD CONSTRAINT 위반" value={stats ? `${stats.hardViolations}` : '0'} tone="good" />
        <StatCard label="계산시간" value={stats ? `${stats.calcMs}ms` : '-'} />
      </div>

      <div className="mt-4 h-[320px] overflow-hidden rounded-xl border border-neutral-200 sm:h-[420px] lg:h-[500px]">
        <YardScene yardView={yardView} moves={moves} />
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
