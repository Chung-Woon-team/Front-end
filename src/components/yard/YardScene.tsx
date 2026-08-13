import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Line, OrbitControls } from '@react-three/drei';
import type { VehicleMove, YardView } from '../../types/yard';
import { BlockMesh } from './BlockMesh';
import { VehicleMesh } from './VehicleMesh';
import { cellToWorld, CELL_SIZE } from './coordinates';
import { buildRouteWorldPoints } from './path';

interface YardSceneProps {
  yardView: YardView;
  moves?: VehicleMove[];
}

export function YardScene({ yardView, moves = [] }: YardSceneProps) {
  const { rows, cols } = yardView.grid;

  const vehicles = useMemo(() => yardView.cells.filter((c) => c.vehicle_id), [yardView.cells]);
  const moveByVehicleId = useMemo(() => new Map(moves.map((m) => [m.vehicle_id, m])), [moves]);
  const vehicleRenders = useMemo(
    () =>
      vehicles.map((cell) => {
        const move = cell.vehicle_id ? moveByVehicleId.get(cell.vehicle_id) : undefined;
        let path: [number, number, number][];
        if (move) {
          path = buildRouteWorldPoints(move.from, move.to, rows, cols);
        } else {
          const [x, z] = cellToWorld(cell.row, cell.col, rows, cols);
          path = [[x, 0.2, z]];
        }
        return {
          id: cell.vehicle_id as string,
          path,
          color: cell.state === 'MOVED' ? '#f97316' : '#3b82f6',
        };
      }),
    [vehicles, moveByVehicleId, rows, cols],
  );
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

      {yardView.blocks.map((block) => (
        <BlockMesh key={block.block_id} block={block} gridRows={rows} gridCols={cols} />
      ))}

      {/* 이번에 이동한 차량들이 실제로 지나간 도로 경로 — 대각선으로 블록을 가로지르지 않는다. */}
      {moves.map((move) => (
        <Line
          key={move.vehicle_id}
          points={buildRouteWorldPoints(move.from, move.to, rows, cols, 0.05)}
          color="#f97316"
          lineWidth={1.5}
          transparent
          opacity={0.55}
          dashed
          dashSize={0.3}
          gapSize={0.2}
        />
      ))}

      {vehicleRenders.map((v) => (
        <VehicleMesh key={v.id} path={v.path} color={v.color} />
      ))}

      <OrbitControls
        enablePan
        minDistance={span * 0.15}
        maxDistance={span * 2.5}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  );
}
