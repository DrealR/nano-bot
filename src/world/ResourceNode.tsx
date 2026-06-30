/**
 * ResourceNode Component
 *
 * Collectible resources that bots can harvest for energy.
 * Different types: Energy Crystals, Data Cores, Nano Materials
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type ResourceType = 'energy' | 'data' | 'material';

export interface ResourceNodeProps {
  id: string;
  position: [number, number, number];
  type: ResourceType;
  amount: number;
  maxAmount: number;
  onDepleted?: (id: string) => void;
}

const RESOURCE_COLORS = {
  energy: { primary: '#00ff88', secondary: '#00ffcc', glow: '#00ff88' },
  data: { primary: '#00aaff', secondary: '#0066ff', glow: '#00aaff' },
  material: { primary: '#ffaa00', secondary: '#ff6600', glow: '#ffaa00' },
};

export const ResourceNode: React.FC<ResourceNodeProps> = ({
  id,
  position,
  type,
  amount,
  maxAmount,
  onDepleted,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(Math.random() * 100);

  const colors = RESOURCE_COLORS[type];
  const primaryColor = useMemo(() => new THREE.Color(colors.primary), [colors]);
  const secondaryColor = useMemo(() => new THREE.Color(colors.secondary), [colors]);

  // Scale based on remaining amount
  const scale = useMemo(() => 0.3 + (amount / maxAmount) * 0.7, [amount, maxAmount]);
  const intensity = amount / maxAmount;

  // Core geometry varies by type
  const coreGeometry = useMemo(() => {
    switch (type) {
      case 'energy':
        return new THREE.OctahedronGeometry(0.5, 0);
      case 'data':
        return new THREE.IcosahedronGeometry(0.4, 0);
      case 'material':
        return new THREE.BoxGeometry(0.6, 0.6, 0.6);
    }
  }, [type]);

  const coreMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: primaryColor,
        emissive: primaryColor,
        emissiveIntensity: 0.5 + intensity * 0.5,
        metalness: 0.8,
        roughness: 0.2,
        transparent: true,
        opacity: 0.9,
      }),
    [primaryColor, intensity]
  );

  // Floating particles
  const particleGeometry = useMemo(() => {
    const count = 20;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 0.8 + Math.random() * 0.4;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const particleMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: secondaryColor,
        size: 0.08,
        transparent: true,
        opacity: 0.8 * intensity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [secondaryColor, intensity]
  );

  // Animation
  useFrame((_, delta) => {
    timeRef.current += delta;
    const time = timeRef.current;

    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.5;
      coreRef.current.rotation.x = Math.sin(time * 0.5) * 0.2;
      coreRef.current.position.y = Math.sin(time * 2) * 0.1;
    }

    if (ringsRef.current) {
      ringsRef.current.rotation.y += delta * 0.3;
      ringsRef.current.rotation.z = Math.sin(time * 0.3) * 0.2;
    }

    if (particlesRef.current && particleGeometry) {
      const positions = particleGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length / 3; i++) {
        const idx = i * 3;
        const angle = time * 0.5 + i * 0.3;
        const baseRadius = 0.8 + Math.sin(time + i) * 0.2;
        positions[idx] = baseRadius * Math.cos(angle + i);
        positions[idx + 1] = Math.sin(time * 2 + i) * 0.3;
        positions[idx + 2] = baseRadius * Math.sin(angle + i);
      }
      particleGeometry.attributes.position.needsUpdate = true;
    }
  });

  if (amount <= 0) return null;

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Core crystal */}
      <mesh ref={coreRef} geometry={coreGeometry} material={coreMaterial} />

      {/* Orbiting rings */}
      <group ref={ringsRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.7, 0.02, 8, 32]} />
          <meshBasicMaterial color={primaryColor} transparent opacity={0.5 * intensity} />
        </mesh>
        <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
          <torusGeometry args={[0.9, 0.015, 8, 32]} />
          <meshBasicMaterial color={secondaryColor} transparent opacity={0.3 * intensity} />
        </mesh>
      </group>

      {/* Particles */}
      <points ref={particlesRef} geometry={particleGeometry} material={particleMaterial} />

      {/* Glow light */}
      <pointLight
        color={primaryColor}
        intensity={intensity * 2}
        distance={5}
        decay={2}
      />

      {/* Amount indicator (small bar above) */}
      <group position={[0, 1.2, 0]}>
        <mesh>
          <boxGeometry args={[0.8, 0.08, 0.08]} />
          <meshBasicMaterial color="#333" transparent opacity={0.5} />
        </mesh>
        <mesh position={[(intensity - 1) * 0.4, 0, 0.01]}>
          <boxGeometry args={[0.78 * intensity, 0.06, 0.06]} />
          <meshBasicMaterial color={primaryColor} />
        </mesh>
      </group>
    </group>
  );
};

export default ResourceNode;
