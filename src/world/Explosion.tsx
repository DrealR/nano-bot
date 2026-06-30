/**
 * Explosion Component
 *
 * Particle explosion effect for enemy deaths.
 * Creates satisfying visual feedback on kills.
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface ExplosionProps {
  position: [number, number, number];
  color?: string;
  size?: number;
  particleCount?: number;
  duration?: number;
  createdAt: number;
  isBoss?: boolean;
}

export const Explosion: React.FC<ExplosionProps> = ({
  position,
  color = '#ff3366',
  size = 1,
  particleCount = 30,
  duration = 800,
  createdAt,
  isBoss = false,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  const [expired, setExpired] = useState(false);

  // Particle system
  const { geometry, velocities } = useMemo(() => {
    const count = isBoss ? particleCount * 3 : particleCount;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const vels: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      // Start at center
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      // Random outward velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 2 + Math.random() * 4;

      vels.push(
        new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.sin(phi) * Math.sin(theta) * speed,
          Math.cos(phi) * speed
        )
      );

      sizes[i] = 0.1 + Math.random() * 0.15;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    return { geometry: geo, velocities: vels };
  }, [particleCount, isBoss]);

  const particleMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: new THREE.Color(color),
        size: 0.2 * size,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [color, size]
  );

  const explosionColor = useMemo(() => new THREE.Color(color), [color]);

  useFrame((_, delta) => {
    const elapsed = Date.now() - createdAt;
    const progress = elapsed / duration;

    if (progress >= 1) {
      setExpired(true);
      return;
    }

    // Update particles
    if (pointsRef.current && geometry) {
      const positions = geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < velocities.length; i++) {
        positions[i * 3] += velocities[i].x * delta * (1 - progress);
        positions[i * 3 + 1] += velocities[i].y * delta * (1 - progress) - delta * 2; // gravity
        positions[i * 3 + 2] += velocities[i].z * delta * (1 - progress);
      }

      geometry.attributes.position.needsUpdate = true;

      // Fade out
      (pointsRef.current.material as THREE.PointsMaterial).opacity = 1 - progress;
    }

    // Expand ring
    if (ringRef.current) {
      const ringScale = progress * 3 * size;
      ringRef.current.scale.setScalar(ringScale);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - progress) * 0.5;
    }

    // Flash effect
    if (flashRef.current) {
      const flashScale = progress < 0.2 ? progress * 5 : 1 - (progress - 0.2) / 0.8;
      flashRef.current.scale.setScalar(flashScale * size * 2);
      (flashRef.current.material as THREE.MeshBasicMaterial).opacity = flashScale * 0.8;
    }
  });

  if (expired) return null;

  return (
    <group position={position}>
      {/* Particles */}
      <points ref={pointsRef} geometry={geometry} material={particleMaterial} />

      {/* Expanding ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1, 32]} />
        <meshBasicMaterial
          color={explosionColor}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Central flash */}
      <mesh ref={flashRef}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>

      {/* Light flash */}
      <pointLight
        color={explosionColor}
        intensity={isBoss ? 10 : 5}
        distance={isBoss ? 15 : 8}
        decay={2}
      />
    </group>
  );
};

export default Explosion;
