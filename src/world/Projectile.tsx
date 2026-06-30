/**
 * Projectile Component
 *
 * Laser/energy projectile that travels from attacker to target.
 * Creates visible combat feedback.
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface ProjectileProps {
  id: string;
  from: [number, number, number];
  to: [number, number, number];
  color?: string;
  speed?: number;
  createdAt: number;
  isBotAttack?: boolean; // true = friendly, false = enemy
  onComplete?: () => void;
}

export const Projectile: React.FC<ProjectileProps> = ({
  id,
  from,
  to,
  color = '#00ffff',
  speed = 30,
  createdAt,
  isBotAttack = true,
  onComplete,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Mesh>(null);
  const completed = useRef(false);

  // Calculate direction and distance
  const { direction, distance, midpoint, rotation } = useMemo(() => {
    const fromVec = new THREE.Vector3(...from);
    const toVec = new THREE.Vector3(...to);
    const dir = toVec.clone().sub(fromVec).normalize();
    const dist = fromVec.distanceTo(toVec);
    const mid = fromVec.clone().add(toVec).multiplyScalar(0.5);

    // Calculate rotation to point at target
    const rot = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    rot.setFromQuaternion(quaternion);

    return { direction: dir, distance: dist, midpoint: mid, rotation: rot };
  }, [from, to]);

  const projectileColor = useMemo(() => new THREE.Color(isBotAttack ? '#00ffff' : '#ff0044'), [isBotAttack]);

  useFrame((_, delta) => {
    if (!meshRef.current || completed.current) return;

    const elapsed = (Date.now() - createdAt) / 1000;
    const progress = Math.min((elapsed * speed) / distance, 1);

    // Move projectile along path
    const currentPos = new THREE.Vector3(...from).lerp(new THREE.Vector3(...to), progress);
    meshRef.current.position.copy(currentPos);

    // Update trail
    if (trailRef.current) {
      const trailProgress = Math.max(0, progress - 0.2);
      const trailStart = new THREE.Vector3(...from).lerp(new THREE.Vector3(...to), trailProgress);
      const trailMid = trailStart.clone().add(currentPos).multiplyScalar(0.5);
      trailRef.current.position.copy(trailMid);
      trailRef.current.scale.y = currentPos.distanceTo(trailStart);
    }

    // Complete when reached target
    if (progress >= 1 && !completed.current) {
      completed.current = true;
      onComplete?.();
    }
  });

  if (completed.current) return null;

  return (
    <group>
      {/* Main projectile */}
      <mesh ref={meshRef} position={from}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color={projectileColor} transparent opacity={0.9} />
      </mesh>

      {/* Glow around projectile */}
      <mesh ref={meshRef} position={from}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshBasicMaterial color={projectileColor} transparent opacity={0.3} />
      </mesh>

      {/* Trail effect */}
      <mesh ref={trailRef} position={midpoint} rotation={rotation}>
        <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
        <meshBasicMaterial color={projectileColor} transparent opacity={0.5} />
      </mesh>

      {/* Point light for glow */}
      <pointLight
        color={projectileColor}
        intensity={2}
        distance={3}
        decay={2}
      />
    </group>
  );
};

export default Projectile;
