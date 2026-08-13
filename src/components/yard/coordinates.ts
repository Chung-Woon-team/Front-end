export const CELL_SIZE = 1;

export function cellToWorld(row: number, col: number, rows: number, cols: number): [number, number] {
  const x = (col - (cols - 1) / 2) * CELL_SIZE;
  const z = (row - (rows - 1) / 2) * CELL_SIZE;
  return [x, z];
}
