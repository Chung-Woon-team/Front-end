import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface VehicleMeshProps {
  position: [number, number, number];
  color: string;
}

export function VehicleMesh({ position, color }: VehicleMeshProps) {
  const [x, y, z] = position;
  const meshRef = useRef<THREE.Mesh>(null);
  const target = useRef(new THREE.Vector3(x, y, z));
  const isMounted = useRef(false);

  useEffect(() => {
    target.current.set(x, y, z);
    if (!isMounted.current && meshRef.current) {
      meshRef.current.position.copy(target.current);
      isMounted.current = true;
    }
  }, [x, y, z]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.position.lerp(target.current, Math.min(1, delta * 3));
  });

  return (
    <mesh ref={meshRef} castShadow>
      <boxGeometry args={[0.6, 0.35, 0.32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
