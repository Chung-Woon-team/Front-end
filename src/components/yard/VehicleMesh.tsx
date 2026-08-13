import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MoveExecutor } from './moveExecutor';

interface VehicleMeshProps {
  vehicleId: string;
  executor: MoveExecutor;
  initialX: number;
  initialZ: number;
  color: string;
}

export function VehicleMesh({ vehicleId, executor, initialX, initialZ, color }: VehicleMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const transform = executor.getTransform(vehicleId);
    meshRef.current.position.set(transform?.x ?? initialX, 0.2, transform?.z ?? initialZ);
    meshRef.current.rotation.y = transform?.rotationY ?? 0;
  });

  return (
    <mesh ref={meshRef} castShadow>
      <boxGeometry args={[0.6, 0.35, 0.32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
