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
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string | null) => void;
}

function SimulationTicker({ executor }: { executor: MoveExecutor }) {
  useFrame((_, delta) => executor.tick(delta));
  return null;
}

export function YardScene({ yardView, moves = [], selectedVehicleId, onSelectVehicle }: YardSceneProps) {
  const { rows, cols } = yardView.grid;
  const executor = useMemo(() => new MoveExecutor(), []);

  const vehicles = useMemo(() => yardView.cells.filter((c) => c.vehicle_id), [yardView.cells]);
  const moveByVehicleId = useMemo(() => new Map(moves.map((m) => [m.vehicle_id, m])), [moves]);

  // 경로(waypoints)는 여기서 만들지 않는다 — moves가 이미 들고 온 것을 그대로
  // executor에 넘겨서 "따라가기"만 시킨다. 움직임이 없는 차량은 현재 칸 한 점만 넘긴다.
  // 매 배치(재배치 실행 결과)마다 시계를 0으로 되돌려야 차량별 t가 이번 배치 기준으로
  // 다시 맞춰지고, 출발 순서가 새로 계산한 대로 재생된다.
  useEffect(() => {
    executor.resetClock();
    // 이번 배치에서 움직이지 않는(=이미 주차돼 있는, 파란색) 차량의 고정 위치들 —
    // 백엔드 경로가 가끔 이 칸들이나 다른 이동 중인 차량의 칸을 그대로 통과하도록
    // 계산돼 있어서(백엔드 라우팅 이슈, 우리가 우회 경로를 만들지는 않는다) executor가
    // 근접도를 계산해 살짝 띄우고 반투명하게 만드는 시각적 완화에 쓴다.
    const staticPoints = vehicles
      .filter((cell) => !moveByVehicleId.has(cell.vehicle_id!))
      .map((cell) => {
        const [x, z] = cellToWorld(cell.row, cell.col, rows, cols);
        return { x, z };
      });
    executor.setStaticPoints(staticPoints);

    for (const cell of vehicles) {
      const vehicleId = cell.vehicle_id!;
      const move = moveByVehicleId.get(vehicleId);
      const routeCells = move ? move.waypoints : [{ row: cell.row, col: cell.col, t: 0 }];
      const worldWaypoints = routeCells.map(({ row, col, t }) => {
        const [x, z] = cellToWorld(row, col, rows, cols);
        return { x, z, t };
      });
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
      <color attach="background" args={['#131c2e']} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[6, 10, 4]} intensity={1.5} castShadow />
      <directionalLight position={[-8, 6, -6]} intensity={0.5} />
      <gridHelper args={[gridExtent, Math.max(rows, cols) + 2, '#475569', '#293548']} />
      {/* 도로 바닥. 블록이 이 위에 얹히고, 블록 사이 빈 곳이 통로로 보인다. */}
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={() => onSelectVehicle(null)}
      >
        <planeGeometry args={[cols * CELL_SIZE, rows * CELL_SIZE]} />
        <meshStandardMaterial color="#1e293b" />
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
            isSelected={cell.vehicle_id === selectedVehicleId}
            onSelect={onSelectVehicle}
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
