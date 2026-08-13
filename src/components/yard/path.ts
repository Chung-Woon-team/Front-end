import { cellToWorld } from './coordinates';

interface Cell {
  row: number;
  col: number;
}

// 차량은 블록을 대각선으로 가로지르지 않는다 — 자기 열(row) 통로를 타고 나가서
// 격자 중앙의 십자 통로(세로축)를 따라 이동한 뒤, 도착 열 통로로 들어간다.
export function buildRouteCells(origin: Cell, dest: Cell, gridCols: number): Cell[] {
  const aisleCol = (gridCols - 1) / 2;
  return [
    origin,
    { row: origin.row, col: aisleCol },
    { row: dest.row, col: aisleCol },
    dest,
  ];
}

export function buildRouteWorldPoints(
  origin: Cell,
  dest: Cell,
  gridRows: number,
  gridCols: number,
  y = 0.2,
): [number, number, number][] {
  return buildRouteCells(origin, dest, gridCols).map(({ row, col }) => {
    const [x, z] = cellToWorld(row, col, gridRows, gridCols);
    return [x, y, z];
  });
}
