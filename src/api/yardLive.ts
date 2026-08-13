import { fetchYardOccupancy } from './yardApi';
import { createPlan, fetchPlan } from './plan';
import { LEGEND } from './yard';
import type { GridPoint, PathPoint, VehicleMove, YardBlock, YardCell, YardView } from '../types/yard';

/** 슬롯 ID 는 서버 규칙과 같다: 블록-절대행-절대열. 예) B01-R04-C07 */
function parseSlotId(slotId: string): GridPoint | null {
  const match = /-R(\d+)-C(\d+)$/.exec(slotId);
  if (!match) return null;
  return { row: Number(match[1]), col: Number(match[2]) };
}

// GET /api/yard/occupancy는 340개 슬롯 전부를 (비어있어도) 내려준다 — 블록 범위를
// 직접 순회해서 채울 필요가 없다. grid_seeded가 false면 slots의 status가 전부
// EMPTY 더미이니, 그 경우도 그대로 보여준다 (실제로 비어있는 것과 구분은 안 되지만
// 최소한 화면이 깨지지는 않는다).
export async function fetchLiveYardView(): Promise<YardView> {
  const occupancy = await fetchYardOccupancy();
  const { grid, blocks: blockStates, slots } = occupancy;

  const blockByCode = new Map(blockStates.map((b) => [b.block_id, b]));
  const blocks: YardBlock[] = blockStates.map((b) => ({
    block_id: b.block_id,
    closed: b.closed,
    closure_reason: b.closure_reason ?? null,
    bounds: {
      row0: b.origin_row,
      col0: b.origin_col,
      row1: b.origin_row + b.block_rows - 1,
      col1: b.origin_col + b.block_cols - 1,
    },
  }));

  const cells: YardCell[] = slots.map((slot) => {
    const block = blockByCode.get(slot.block_id);
    if (slot.status === 'OCCUPIED' && slot.vehicle_id) {
      return {
        row: slot.row,
        col: slot.col,
        slot_id: slot.slot_id,
        state: 'KEPT',
        vehicle_id: slot.vehicle_id,
        next_mode: slot.next_mode,
        departure_cutoff_at: slot.departure_cutoff_at,
      };
    }
    return {
      row: slot.row,
      col: slot.col,
      slot_id: slot.slot_id,
      state: block?.closed ? 'CLOSED' : 'EMPTY',
    };
  });

  return {
    plan_version: `LIVE-${occupancy.generated_at}`,
    based_on_version: 'LIVE',
    grid: { rows: grid.rows, cols: grid.cols },
    blocks,
    cells,
    legend: LEGEND,
  };
}

export interface LiveRelocationResult {
  yardView: YardView;
  moves: VehicleMove[];
  movedVehicleCount: number;
  planRetentionRate: number;
  hardViolations: number;
  calcMs: number;
}

// 실제 알고리즘 실행: POST /api/plans 가 현재 백엔드 상태(승인된 제약 등) 기준으로
// 재배치를 계산해서 돌려준다. 이동 경로(path)는 백엔드가 계산한 실제 좌표라서
// 프론트에서 경로를 만들어낼 필요가 없다.
export async function runLiveRelocation(yardView: YardView): Promise<LiveRelocationResult> {
  const execution = await createPlan({});
  const detail = await fetchPlan(execution.plan_version).catch(() => null);

  const cellByPos = new Map(yardView.cells.map((c) => [`${c.row}-${c.col}`, { ...c }]));
  // 실제로 받아보니 이미 주차된 차량의 재배치인데도 move.from_slot이 비어서
  // "신규 배치"로 오는 경우가 있다 — from_slot만 믿으면 같은 차량이 옛 칸과 새 칸에
  // 동시에 찍혀서 React key가 중복된다. 차량ID → 현재 위치 역인덱스로 항상 옛 칸부터 비운다.
  const posByVehicle = new Map<string, string>();
  // MoveDto에는 next_mode/departure_cutoff_at이 없다 — 재배치 전 셀에 이미 실려있던
  // 값을 차량ID 기준으로 미리 뽑아뒀다가 도착 칸으로 옮겨줘야 클릭 상세 패널이
  // (목적지 칸이 원래 비어 있어서 값이 없는) 도착 칸이 아니라 그 차량 고유의 값을 보여준다.
  const vehicleMetaById = new Map<string, { next_mode?: string; departure_cutoff_at?: string }>();
  for (const [pos, cell] of cellByPos) {
    if (cell.vehicle_id) {
      posByVehicle.set(cell.vehicle_id, pos);
      vehicleMetaById.set(cell.vehicle_id, { next_mode: cell.next_mode, departure_cutoff_at: cell.departure_cutoff_at });
    }
  }

  const moves: VehicleMove[] = [];

  for (const move of execution.moves) {
    const toPos = parseSlotId(move.to_slot);
    if (!toPos) continue;
    const fromPos = move.from_slot ? parseSlotId(move.from_slot) : null;
    const isNewPlacement = !fromPos && !posByVehicle.has(move.vehicle_id);

    for (const staleKey of [fromPos ? `${fromPos.row}-${fromPos.col}` : null, posByVehicle.get(move.vehicle_id)]) {
      if (!staleKey) continue;
      const staleCell = cellByPos.get(staleKey);
      if (staleCell) {
        cellByPos.set(staleKey, {
          ...staleCell,
          state: 'EMPTY',
          vehicle_id: undefined,
          next_mode: undefined,
          departure_cutoff_at: undefined,
        });
      }
    }

    const toKey = `${toPos.row}-${toPos.col}`;
    const toCell = cellByPos.get(toKey);
    if (toCell) {
      cellByPos.set(toKey, {
        ...toCell,
        state: isNewPlacement ? 'NEW' : 'MOVED',
        vehicle_id: move.vehicle_id,
        ...vehicleMetaById.get(move.vehicle_id),
      });
    }
    posByVehicle.set(move.vehicle_id, toKey);

    // path[].t는 백엔드가 계산한 공용 타임라인(틱)이다 — 차량마다 시작 t가 달라야
    // 진입 지점에서 한 틱씩 차이를 두고 순서대로 출발한다. path가 비어 있는 경우엔
    // (드문 폴백) 곧바로 t:0→1로 이동하는 2점짜리 경로를 만든다.
    const waypoints: PathPoint[] =
      move.path.length > 0
        ? move.path.map((step) => ({ row: step.row, col: step.col, t: step.t }))
        : [fromPos, toPos]
            .filter((point): point is GridPoint => point !== null)
            .map((point, index) => ({ ...point, t: index }));

    moves.push({ vehicle_id: move.vehicle_id, waypoints });
  }

  return {
    yardView: {
      ...yardView,
      plan_version: execution.plan_version,
      based_on_version: execution.based_on_version ?? yardView.plan_version,
      cells: [...cellByPos.values()],
    },
    moves,
    movedVehicleCount: execution.move_count,
    // plan_retention_rate 는 백엔드가 이미 0~100 스케일로 준다 (curl로 확인, 2026-08-13).
    planRetentionRate: detail?.plan_retention_rate ?? 0,
    hardViolations: detail?.hard_violations ?? 0,
    calcMs: detail?.calc_millis ?? 0,
  };
}
