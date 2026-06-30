/**
 * DamageNumber Component
 *
 * Floating damage text that rises and fades out.
 * Shows damage dealt, heals, combos, etc.
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export interface DamageNumberProps {
  position: [number, number, number];
  damage: number;
  isHeal?: boolean;
  isCrit?: boolean;
  createdAt: number;
  duration?: number;
}

export const DamageNumber: React.FC<DamageNumberProps> = ({
  position,
  damage,
  isHeal = false,
  isCrit = false,
  createdAt,
  duration = 1000,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const startY = position[1];

  // Calculate colors
  const color = useMemo(() => {
    if (isHeal) return '#51cf66';
    if (isCrit) return '#ffd700';
    return '#ff3366';
  }, [isHeal, isCrit]);

  // Animate
  useFrame(() => {
    if (!groupRef.current) return;

    const elapsed = Date.now() - createdAt;
    const progress = Math.min(elapsed / duration, 1);

    // Rise up
    groupRef.current.position.y = startY + progress * 2;

    // Fade out
    const opacity = 1 - progress;
    groupRef.current.children.forEach((child) => {
      if ((child as THREE.Mesh).material) {
        ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = opacity;
      }
    });

    // Scale pop at start
    const scale = progress < 0.1 ? 0.5 + progress * 5 : 1;
    groupRef.current.scale.setScalar(scale);
  });

  const text = isHeal ? `+${damage}` : `-${damage}`;
  const fontSize = isCrit ? 0.8 : 0.5;

  return (
    <group ref={groupRef} position={position}>
      <Text
        fontSize={fontSize}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.03}
        outlineColor="#000000"
        font={undefined}
      >
        {text}
        {isCrit && ' CRIT!'}
      </Text>
    </group>
  );
};

export default DamageNumber;
