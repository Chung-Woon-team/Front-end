import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { MoveExecutor } from './moveExecutor';

interface VehicleMeshProps {
  vehicleId: string;
  executor: MoveExecutor;
  initialX: number;
  initialZ: number;
  color: string;
  isSelected: boolean;
  onSelect: (vehicleId: string) => void;
}

export function VehicleMesh({
  vehicleId,
  executor,
  initialX,
  initialZ,
  color,
  isSelected,
  onSelect,
}: VehicleMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const [isHovered, setIsHovered] = useState(false);

  useFrame(() => {
    if (!meshRef.current) return;
    const transform = executor.getTransform(vehicleId);
    const visual = executor.getVisual(vehicleId);

    meshRef.current.position.set(transform?.x ?? initialX, visual.y, transform?.z ?? initialZ);
    meshRef.current.rotation.y = transform?.rotationY ?? 0;
    if (materialRef.current) materialRef.current.opacity = visual.opacity;
  });

  return (
    <mesh
      ref={meshRef}
      castShadow
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onSelect(vehicleId);
      }}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setIsHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setIsHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      <boxGeometry args={[0.6, 0.35, 0.32]} />
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={1}
        emissive={isSelected ? '#facc15' : isHovered ? '#94a3b8' : '#000000'}
        emissiveIntensity={isSelected ? 0.7 : isHovered ? 0.4 : 0}
      />
    </mesh>
  );
}
