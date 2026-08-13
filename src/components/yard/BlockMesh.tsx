import { Html } from '@react-three/drei';
import type { YardBlock } from '../../types/yard';
import { cellToWorld, CELL_SIZE } from './coordinates';

interface BlockMeshProps {
  block: YardBlock;
  gridRows: number;
  gridCols: number;
}

export function BlockMesh({ block, gridRows, gridCols }: BlockMeshProps) {
  const { row0, col0, row1, col1 } = block.bounds;
  const width = (col1 - col0 + 1) * CELL_SIZE;
  const depth = (row1 - row0 + 1) * CELL_SIZE;
  const [x, z] = cellToWorld((row0 + row1) / 2, (col0 + col1) / 2, gridRows, gridCols);

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width - 0.08, depth - 0.08]} />
        <meshStandardMaterial
          color={block.closed ? '#ef4444' : '#1e293b'}
          transparent
          opacity={block.closed ? 0.4 : 0.55}
        />
      </mesh>
      <Html position={[0, 0.3, -depth / 2 - 0.2]} center distanceFactor={9}>
        <div
          style={{
            color: block.closed ? '#fca5a5' : '#cbd5e1',
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {block.block_id}
          {block.closed ? ' (CLOSED)' : ''}
        </div>
      </Html>
    </group>
  );
}
