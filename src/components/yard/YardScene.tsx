import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { YardView } from '../../types/yard';
import { BlockMesh } from './BlockMesh';
import { VehicleMesh } from './VehicleMesh';
import { cellToWorld, CELL_SIZE } from './coordinates';

interface YardSceneProps {
  yardView: YardView;
}

export function YardScene({ yardView }: YardSceneProps) {
  const { rows, cols } = yardView.grid;

  const vehicles = useMemo(() => yardView.cells.filter((c) => c.vehicle_id), [yardView.cells]);
  const gridExtent = Math.max(rows, cols) * CELL_SIZE + 2;

  return (
    <Canvas
      shadows
      camera={{ position: [9, 10, 11], fov: 40 }}
      onCreated={(state) => state.gl.render(state.scene, state.camera)}
    >
      <color attach="background" args={['#05070d']} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[6, 10, 4]} intensity={1.1} castShadow />
      <gridHelper args={[gridExtent, Math.max(rows, cols) + 2, '#1f2937', '#111827']} />

      {yardView.blocks.map((block) => (
        <BlockMesh key={block.block_id} block={block} gridRows={rows} gridCols={cols} />
      ))}

      {vehicles.map((cell) => {
        const [x, z] = cellToWorld(cell.row, cell.col, rows, cols);
        const color = cell.state === 'MOVED' ? '#f97316' : '#3b82f6';
        return <VehicleMesh key={cell.vehicle_id} position={[x, 0.2, z]} color={color} />;
      })}

      <OrbitControls enablePan minDistance={6} maxDistance={30} maxPolarAngle={Math.PI / 2.1} />
    </Canvas>
  );
}
