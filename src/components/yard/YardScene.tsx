import { useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, OrbitControls } from '@react-three/drei';
import type { VehicleMove, YardView } from '../../types/yard';
import { BlockMesh } from './BlockMesh';
import { VehicleMesh } from './VehicleMesh';
import { MoveExecutor } from './moveExecutor';
import { cellToWorld, CELL_SIZE } from './coordinates';

interface YardSceneProps {
  yardView: YardView;
  moves?: VehicleMove[];
}

function SimulationTicker({ executor }: { executor: MoveExecutor }) {
  useFrame((_, delta) => executor.tick(delta));
  return null;
}

export function YardScene({ yardView, moves = [] }: YardSceneProps) {
  const { rows, cols } = yardView.grid;
  const executor = useMemo(() => new MoveExecutor(), []);

  const vehicles = useMemo(() => yardView.cells.filter((c) => c.vehicle_id), [yardView.cells]);
  const moveByVehicleId = useMemo(() => new Map(moves.map((m) => [m.vehicle_id, m])), [moves]);

  // 경로(waypoints)는 여기서 만들지 않는다 — moves가 이미 들고 온 것을 그대로
  // executor에 넘겨서 "따라가기"만 시킨다. 움직임이 없는 차량은 현재 칸 한 점만 넘긴다.
  useEffect(() => {
    for (const cell of vehicles) {
      const vehicleId = cell.vehicle_id!;
      const move = moveByVehicleId.get(vehicleId);
      const routeCells = move ? move.waypoints : [{ row: cell.row, col: cell.col }];
      const worldWaypoints: [number, number][] = routeCells.map(({ row, col }) => cellToWorld(row, col, rows, cols));
      executor.setRoute(vehicleId, worldWaypoints);
    }
  }, [vehicles, moveByVehicleId, rows, cols, executor]);

  const gridExtent = Math.max(rows, cols) * CELL_SIZE + 2;

  // 격자가 10×12 에서 56×56 으로 커졌다. 카메라를 격자 크기에 비례시켜야 야드 전체가 화면에 들어온다.
  const span = Math.max(rows, cols) * CELL_SIZE;
  const camera: [number, number, number] = [span * 0.75, span * 0.85, span * 0.95];

  return (
    <Canvas
      shadows
      camera={{ position: camera, fov: 40 }}
      onCreated={(state) => state.gl.render(state.scene, state.camera)}
    >
      <color attach="background" args={['#05070d']} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[6, 10, 4]} intensity={1.1} castShadow />
      <gridHelper args={[gridExtent, Math.max(rows, cols) + 2, '#1f2937', '#111827']} />
      {/* 도로 바닥. 블록이 이 위에 얹히고, 블록 사이 빈 곳이 통로로 보인다. */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[cols * CELL_SIZE, rows * CELL_SIZE]} />
        <meshStandardMaterial color="#0b1120" />
      </mesh>

      <SimulationTicker executor={executor} />

      {yardView.blocks.map((block) => (
        <BlockMesh key={block.block_id} block={block} gridRows={rows} gridCols={cols} />
      ))}

      {/* 이번에 이동한 차량들이 실제로 지나갈 경로 — 백엔드(또는 mock)가 준 waypoints 그대로. */}
      {moves.map((move) => (
        <Line
          key={move.vehicle_id}
          points={move.waypoints.map(({ row, col }) => {
            const [x, z] = cellToWorld(row, col, rows, cols);
            return [x, 0.05, z] as [number, number, number];
          })}
          color="#f97316"
          lineWidth={1.5}
          transparent
          opacity={0.55}
          dashed
          dashSize={0.3}
          gapSize={0.2}
        />
      ))}

      {vehicles.map((cell) => {
        const [x, z] = cellToWorld(cell.row, cell.col, rows, cols);
        const color = cell.state === 'MOVED' ? '#f97316' : '#3b82f6';
        return (
          <VehicleMesh
            key={cell.vehicle_id}
            vehicleId={cell.vehicle_id!}
            executor={executor}
            initialX={x}
            initialZ={z}
            color={color}
          />
        );
      })}

      <OrbitControls
        enablePan
        minDistance={span * 0.15}
        maxDistance={span * 2.5}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  );
}
