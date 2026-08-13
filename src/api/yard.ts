import type { YardBlock, YardCell, YardView } from '../types/yard';

const GRID = { rows: 10, cols: 12 };

const BLOCK_DEFS: { block_id: string; bounds: YardBlock['bounds'] }[] = [
  { block_id: 'B01', bounds: { row0: 0, col0: 0, row1: 3, col1: 4 } },
  { block_id: 'B02', bounds: { row0: 0, col0: 7, row1: 3, col1: 11 } },
  { block_id: 'B03', bounds: { row0: 6, col0: 0, row1: 9, col1: 4 } },
  { block_id: 'B04', bounds: { row0: 6, col0: 7, row1: 9, col1: 11 } },
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

export function generateYardView(vehicleCount = 50): YardView {
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
    const slotId = `${s.blockId}-${String(s.row).padStart(2, '0')}${String(s.col).padStart(2, '0')}`;
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

  let movedVehicleCount = 0;
  for (const vehicleCell of stuckVehicles) {
    const target = emptyOpenSlots.shift();
    if (!target) break;
    target.state = 'MOVED';
    target.vehicle_id = vehicleCell.vehicle_id;
    vehicleCell.state = 'CLOSED';
    vehicleCell.vehicle_id = undefined;
    movedVehicleCount += 1;
  }

  const totalVehicles = yardView.cells.filter((c) => c.vehicle_id).length;
  const planRetentionRate = totalVehicles === 0 ? 1 : (totalVehicles - movedVehicleCount) / totalVehicles;

  return {
    yardView: { ...yardView, plan_version: 'B0-r1', based_on_version: yardView.plan_version, cells },
    movedVehicleCount,
    planRetentionRate,
    hardViolations: 0,
    calcMs: Math.max(1, Math.round(performance.now() - start)),
  };
}
