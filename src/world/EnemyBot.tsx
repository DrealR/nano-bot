/**
 * EnemyBot Component
 *
 * Hostile entities that threaten the player's nanobots.
 * They patrol, chase, and attack nearby friendly bots.
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type EnemyType = 'grunt' | 'speeder' | 'tank';

export interface EnemyBotProps {
  id: string;
  position: [number, number, number];
  health: number;
  maxHealth: number;
  state: 'spawn' | 'advance' | 'attack' | 'retreat' | 'dead' | 'patrol' | 'chase';
  targetPosition?: [number, number, number];
  enemyType?: EnemyType;
  isBoss?: boolean;
  color?: string;
}

export const EnemyBot: React.FC<EnemyBotProps> = ({
  id,
  position,
  health,
  maxHealth,
  state,
  targetPosition,
  enemyType = 'grunt',
  isBoss = false,
  color = '#ff0044',
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const spikesRef = useRef<THREE.Group>(null);
  const eyeRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(Math.random() * 100);

  const healthPercent = health / maxHealth;

  // Scale based on type and boss status
  const baseScale = isBoss ? 2.0 : enemyType === 'tank' ? 1.5 : enemyType === 'speeder' ? 0.7 : 1.0;

  // Color scheme based on type
  const primaryColor = useMemo(() => new THREE.Color(color), [color]);
  const secondaryColor = useMemo(() => {
    const c = new THREE.Color(color);
    c.offsetHSL(0.1, 0, 0.1);
    return c;
  }, [color]);

  const coreMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: primaryColor,
        emissive: primaryColor,
        emissiveIntensity: state === 'attack' ? 1.5 : 0.8,
        metalness: 0.9,
        roughness: 0.3,
      }),
    [primaryColor, state]
  );

  const spikeMaterial = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: secondaryColor,
        emissive: secondaryColor,
        emissiveIntensity: 0.5,
        shininess: 100,
      }),
    [secondaryColor]
  );

  // Spike positions (more aggressive look)
  const spikePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      positions.push([Math.cos(angle), 0, Math.sin(angle)]);
    }
    positions.push([0, 1, 0]);
    positions.push([0, -1, 0]);
    return positions;
  }, []);

  // Animation
  useFrame((_, delta) => {
    if (state === 'dead') return;

    timeRef.current += delta;
    const time = timeRef.current;

    // Apply base scale to group
    if (groupRef.current) {
      groupRef.current.scale.setScalar(baseScale);
    }

    if (coreRef.current) {
      // Aggressive pulsing - handle both old and new state names
      const isAttacking = state === 'attack';
      const isChasing = state === 'chase' || state === 'advance';
      const pulseSpeed = isAttacking ? 8 : isChasing ? 4 : 2;
      const pulseAmount = isAttacking ? 0.15 : 0.08;
      // Speeders spin faster
      const spinSpeed = enemyType === 'speeder' ? 2 : 1;
      coreRef.current.scale.setScalar(1 + Math.sin(time * pulseSpeed) * pulseAmount);
      coreRef.current.rotation.y += delta * (isAttacking ? 3 : 1) * spinSpeed;
    }

    if (spikesRef.current) {
      // Spikes extend during attack
      const spikeScale = state === 'attack' ? 1.5 : 1;
      spikesRef.current.children.forEach((spike, i) => {
        const offset = i * 0.5;
        spike.scale.y = spikeScale * (1 + Math.sin(time * 3 + offset) * 0.2);
      });
      spikesRef.current.rotation.y += delta * 0.5;
    }

    if (eyeRef.current) {
      // Eye follows target direction
      if (targetPosition) {
        const targetDir = new THREE.Vector3(
          targetPosition[0] - position[0],
          targetPosition[1] - position[1],
          targetPosition[2] - position[2]
        ).normalize();
        eyeRef.current.lookAt(
          position[0] + targetDir.x,
          position[1] + targetDir.y,
          position[2] + targetDir.z
        );
      }
      // Angry eye pulse
      (eyeRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.8 + Math.sin(time * 5) * 0.2;
    }
  });

  if (state === 'dead' || health <= 0) return null;

  return (
    <group ref={groupRef} position={position}>
      {/* Core - angular dodecahedron */}
      <mesh ref={coreRef} material={coreMaterial}>
        <dodecahedronGeometry args={[0.4, 0]} />
      </mesh>

      {/* Evil eye */}
      <mesh ref={eyeRef} position={[0, 0, 0.35]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#ffff00" transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.42]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Aggressive spikes */}
      <group ref={spikesRef}>
        {spikePositions.map((pos, i) => (
          <mesh
            key={i}
            position={[pos[0] * 0.5, pos[1] * 0.5, pos[2] * 0.5]}
            rotation={[
              pos[1] === 1 ? 0 : pos[1] === -1 ? Math.PI : Math.PI / 2,
              Math.atan2(pos[2], pos[0]),
              0,
            ]}
          >
            <coneGeometry args={[0.08, 0.4, 4]} />
            <primitive object={spikeMaterial} attach="material" />
          </mesh>
        ))}
      </group>

      {/* Health bar */}
      <group position={[0, 0.9, 0]}>
        <mesh>
          <boxGeometry args={[0.6, 0.06, 0.06]} />
          <meshBasicMaterial color="#330000" transparent opacity={0.8} />
        </mesh>
        <mesh position={[(healthPercent - 1) * 0.3, 0, 0.01]}>
          <boxGeometry args={[0.58 * healthPercent, 0.04, 0.04]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
      </group>

      {/* Danger glow */}
      <pointLight
        color={primaryColor}
        intensity={state === 'attack' ? 3 : 1.5}
        distance={isBoss ? 10 : 6}
        decay={2}
      />

      {/* Boss crown effect */}
      {isBoss && (
        <>
          <mesh position={[0, 0.7, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.35, 0.05, 8, 6]} />
            <meshBasicMaterial color="#ffcc00" />
          </mesh>
          <mesh position={[0, 0.75, 0]}>
            <octahedronGeometry args={[0.12, 0]} />
            <meshBasicMaterial color="#ffcc00" />
          </mesh>
          <pointLight color="#ffcc00" intensity={2} distance={8} decay={2} />
        </>
      )}
    </group>
  );
};

export default EnemyBot;
