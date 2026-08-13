import type { VehicleMove, YardBlock, YardCell, YardView } from '../types/yard';

/**
 * 야드 격자는 팀 도면 그대로 56×56 이다. 가로·세로 모두 4 + 22 + 4 + 22 + 4.
 * 블록 사이와 바깥의 빈 칸이 도로(외곽 폭 4 + 십자 통로 폭 4)다.
 *
 * 주차칸 22×22×4 = 1,936 / 도로칸 1,200.
 * 서버 정본은 backend 의 YardGrid.java, 문서는 docs/DOMAIN.md 의 "야드 격자" 절.
 */
const GRID = { rows: 56, cols: 56 };

const BLOCK_DEFS: { block_id: string; bounds: YardBlock['bounds'] }[] = [
  { block_id: 'B01', bounds: { row0: 4, col0: 4, row1: 25, col1: 25 } },
  { block_id: 'B02', bounds: { row0: 4, col0: 30, row1: 25, col1: 51 } },
  { block_id: 'B03', bounds: { row0: 30, col0: 4, row1: 51, col1: 25 } },
  { block_id: 'B04', bounds: { row0: 30, col0: 30, row1: 51, col1: 51 } },
];

export const LEGEND: YardView['legend'] = {
  EMPTY: { label: '빈자리', color: '#E5E7EB' },
  KEPT: { label: '유지', color: '#3B82F6' },
  MOVED: { label: '이동', color: '#F97316' },
  NEW: { label: '신규 입고', color: '#22C55E' },
  CLOSED: { label: '폐쇄 구역', color: '#EF4444' },
};

function inBlock(row: number, col: number, bounds: YardBlock['bounds']): boolean {
  return row >= bounds.row0 && row <= bounds.row1 && col >= bounds.col0 && col <= bounds.col1;
}

/** 슬롯 ID 는 서버 규칙과 같다: 블록-절대행-절대열. 예) B01-R04-C07 */
function toSlotId(blockId: string, row: number, col: number): string {
  return `${blockId}-R${String(row).padStart(2, '0')}-C${String(col).padStart(2, '0')}`;
}

// 슬롯이 1,936칸이라 예전 기본값(50대)은 거의 빈 야드로 보인다. 3분의 1쯤 채운다.
export function generateYardView(vehicleCount = 640): YardView {
  const blocks: YardBlock[] = BLOCK_DEFS.map((b) => ({
    block_id: b.block_id,
    closed: false,
    closure_reason: null,
    bounds: b.bounds,
  }));

  const slots: { row: number; col: number; blockId: string }[] = [];
  for (const block of blocks) {
    for (let row = block.bounds.row0; row <= block.bounds.row1; row++) {
      for (let col = block.bounds.col0; col <= block.bounds.col1; col++) {
        slots.push({ row, col, blockId: block.block_id });
      }
    }
  }

  const shuffled = [...slots].sort(() => Math.random() - 0.5);
  const occupiedKeys = new Set(
    shuffled.slice(0, Math.min(vehicleCount, slots.length)).map((s) => `${s.row}-${s.col}`),
  );

  let vehicleSeq = 1;
  const cells: YardCell[] = slots.map((s) => {
    const slotId = toSlotId(s.blockId, s.row, s.col);
    if (occupiedKeys.has(`${s.row}-${s.col}`)) {
      const vehicleId = `V-${String(vehicleSeq).padStart(4, '0')}`;
      vehicleSeq += 1;
      return { row: s.row, col: s.col, slot_id: slotId, state: 'KEPT', vehicle_id: vehicleId };
    }
    return { row: s.row, col: s.col, slot_id: slotId, state: 'EMPTY' };
  });

  return { plan_version: 'B0', based_on_version: 'B0', grid: GRID, blocks, cells, legend: LEGEND };
}

export function closeBlock(yardView: YardView, blockId: string): YardView {
  const blocks = yardView.blocks.map((b) =>
    b.block_id === blockId ? { ...b, closed: true, closure_reason: '현장 이벤트' } : b,
  );
  const closedBlock = blocks.find((b) => b.block_id === blockId);
  const cells = yardView.cells.map((c) => {
    if (closedBlock && inBlock(c.row, c.col, closedBlock.bounds) && !c.vehicle_id) {
      return { ...c, state: 'CLOSED' as const };
    }
    return c;
  });
  return { ...yardView, blocks, cells };
}

export interface RelocationResult {
  yardView: YardView;
  moves: VehicleMove[];
  movedVehicleCount: number;
  planRetentionRate: number;
  hardViolations: number;
  calcMs: number;
}

export function relocateClosedBlocks(yardView: YardView): RelocationResult {
  const start = performance.now();
  const closedBlocks = yardView.blocks.filter((b) => b.closed);
  const openBlocks = yardView.blocks.filter((b) => !b.closed);

  const cells = yardView.cells.map((c) => ({ ...c }));
  const emptyOpenSlots = cells.filter(
    (c) => c.state === 'EMPTY' && openBlocks.some((b) => inBlock(c.row, c.col, b.bounds)),
  );
  const stuckVehicles = cells.filter(
    (c) => c.vehicle_id && closedBlocks.some((b) => inBlock(c.row, c.col, b.bounds)),
  );

  const moves: VehicleMove[] = [];
  for (const vehicleCell of stuckVehicles) {
    const target = emptyOpenSlots.shift();
    if (!target) break;
    const vehicleId = vehicleCell.vehicle_id!;
    moves.push({
      vehicle_id: vehicleId,
      from: { row: vehicleCell.row, col: vehicleCell.col },
      to: { row: target.row, col: target.col },
    });
    target.state = 'MOVED';
    target.vehicle_id = vehicleId;
    vehicleCell.state = 'CLOSED';
    vehicleCell.vehicle_id = undefined;
  }

  const totalVehicles = yardView.cells.filter((c) => c.vehicle_id).length;
  const planRetentionRate = totalVehicles === 0 ? 1 : (totalVehicles - moves.length) / totalVehicles;

  return {
    yardView: { ...yardView, plan_version: 'B0-r1', based_on_version: yardView.plan_version, cells },
    moves,
    movedVehicleCount: moves.length,
    planRetentionRate,
    hardViolations: 0,
    calcMs: Math.max(1, Math.round(performance.now() - start)),
  };
}
