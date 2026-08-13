import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface VehicleMeshProps {
  path: [number, number, number][];
  color: string;
}

const ARRIVE_EPSILON = 0.05;

export function VehicleMesh({ path, color }: VehicleMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const waypoints = useRef<THREE.Vector3[]>([]);
  const waypointIndex = useRef(0);
  const isMounted = useRef(false);

  useEffect(() => {
    waypoints.current = path.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    waypointIndex.current = waypoints.current.length > 1 ? 1 : 0;
    if (!isMounted.current && meshRef.current && waypoints.current[0]) {
      meshRef.current.position.copy(waypoints.current[0]);
      isMounted.current = true;
    }
  }, [path]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const target = waypoints.current[waypointIndex.current];
    if (!target) return;
    meshRef.current.position.lerp(target, Math.min(1, delta * 3));
    if (
      meshRef.current.position.distanceTo(target) < ARRIVE_EPSILON &&
      waypointIndex.current < waypoints.current.length - 1
    ) {
      waypointIndex.current += 1;
    }
  });

  return (
    <mesh ref={meshRef} castShadow>
      <boxGeometry args={[0.6, 0.35, 0.32]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
