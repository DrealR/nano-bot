/**
 * AlienFlora - No Man's Sky style procedural alien plants and crystals
 * Creates diverse, colorful alien vegetation
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WorldTheme } from './WorldGenerator';

export interface AlienFloraProps {
  theme: WorldTheme;
  count?: number;
  radius?: number;
}

// Individual alien plant types
const BubblePlant: React.FC<{
  position: [number, number, number];
  color: THREE.Color;
  scale: number;
}> = ({ position, color, scale }) => {
  const groupRef = useRef<THREE.Group>(null);
  const timeOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.scale.setScalar(scale * (1 + Math.sin(state.clock.elapsedTime * 2 + timeOffset) * 0.05));
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Main bubble */}
      <mesh>
        <sphereGeometry args={[0.5 * scale, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.8}
          roughness={0.1}
          metalness={0.3}
        />
      </mesh>
      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[0.3 * scale, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
      </mesh>
      {/* Stem */}
      <mesh position={[0, -0.4 * scale, 0]}>
        <cylinderGeometry args={[0.05 * scale, 0.08 * scale, 0.5 * scale, 6]} />
        <meshStandardMaterial color={color.clone().multiplyScalar(0.5)} />
      </mesh>
    </group>
  );
};

const CrystalCluster: React.FC<{
  position: [number, number, number];
  color: THREE.Color;
  scale: number;
}> = ({ position, color, scale }) => {
  const groupRef = useRef<THREE.Group>(null);
  const timeOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (groupRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 1.5 + timeOffset) * 0.1 + 1;
      groupRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.emissiveIntensity = 0.5 + pulse * 0.3;
        }
      });
    }
  });

  const crystals = useMemo(() => {
    const count = 3 + Math.floor(Math.random() * 4);
    return Array.from({ length: count }, (_, i) => ({
      height: (0.5 + Math.random() * 1.5) * scale,
      radius: (0.1 + Math.random() * 0.15) * scale,
      rotation: [
        (Math.random() - 0.5) * 0.4,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.4,
      ] as [number, number, number],
      offset: [
        (Math.random() - 0.5) * 0.3 * scale,
        0,
        (Math.random() - 0.5) * 0.3 * scale,
      ] as [number, number, number],
    }));
  }, [scale]);

  return (
    <group ref={groupRef} position={position}>
      {crystals.map((crystal, i) => (
        <mesh
          key={i}
          position={[crystal.offset[0], crystal.height / 2, crystal.offset[2]]}
          rotation={crystal.rotation}
        >
          <coneGeometry args={[crystal.radius, crystal.height, 6]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            transparent
            opacity={0.9}
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>
      ))}
      <pointLight color={color} intensity={1} distance={5 * scale} decay={2} />
    </group>
  );
};

const TallGrass: React.FC<{
  position: [number, number, number];
  color: THREE.Color;
  scale: number;
}> = ({ position, color, scale }) => {
  const groupRef = useRef<THREE.Group>(null);
  const timeOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (groupRef.current) {
      const sway = Math.sin(state.clock.elapsedTime * 2 + timeOffset) * 0.1;
      groupRef.current.rotation.z = sway;
    }
  });

  const blades = useMemo(() => {
    return Array.from({ length: 5 + Math.floor(Math.random() * 5) }, () => ({
      height: (1 + Math.random() * 2) * scale,
      rotation: Math.random() * Math.PI * 2,
      lean: (Math.random() - 0.5) * 0.3,
    }));
  }, [scale]);

  return (
    <group ref={groupRef} position={position}>
      {blades.map((blade, i) => (
        <mesh
          key={i}
          position={[Math.cos(blade.rotation) * 0.1, blade.height / 2, Math.sin(blade.rotation) * 0.1]}
          rotation={[blade.lean, blade.rotation, 0]}
        >
          <boxGeometry args={[0.02 * scale, blade.height, 0.1 * scale]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

const MushroomTree: React.FC<{
  position: [number, number, number];
  color: THREE.Color;
  scale: number;
}> = ({ position, color, scale }) => {
  const groupRef = useRef<THREE.Group>(null);
  const timeOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (groupRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime + timeOffset) * 0.02;
      groupRef.current.position.y = position[1] + pulse;
    }
  });

  const trunkHeight = (2 + Math.random() * 3) * scale;

  return (
    <group ref={groupRef} position={position}>
      {/* Trunk */}
      <mesh position={[0, trunkHeight / 2, 0]}>
        <cylinderGeometry args={[0.15 * scale, 0.25 * scale, trunkHeight, 8]} />
        <meshStandardMaterial
          color={color.clone().multiplyScalar(0.4)}
          roughness={0.8}
        />
      </mesh>
      {/* Cap */}
      <mesh position={[0, trunkHeight, 0]}>
        <sphereGeometry args={[0.8 * scale, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Spots on cap */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos(i * Math.PI * 0.4) * 0.5 * scale,
            trunkHeight + 0.3 * scale,
            Math.sin(i * Math.PI * 0.4) * 0.5 * scale,
          ]}
        >
          <sphereGeometry args={[0.1 * scale, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
      ))}
      <pointLight color={color} intensity={0.5} distance={4 * scale} decay={2} />
    </group>
  );
};

const FloatingRock: React.FC<{
  position: [number, number, number];
  color: THREE.Color;
  scale: number;
}> = ({ position, color, scale }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + timeOffset) * 0.3;
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <dodecahedronGeometry args={[0.5 * scale, 0]} />
      <meshStandardMaterial
        color={color.clone().multiplyScalar(0.6)}
        roughness={0.7}
        metalness={0.2}
      />
    </mesh>
  );
};

export const AlienFlora: React.FC<AlienFloraProps> = ({
  theme,
  count = 80,
  radius = 50,
}) => {
  const flora = useMemo(() => {
    const items: Array<{
      type: 'bubble' | 'crystal' | 'grass' | 'mushroom' | 'rock';
      position: [number, number, number];
      color: THREE.Color;
      scale: number;
    }> = [];

    const primaryColor = new THREE.Color(...theme.primaryColor);
    const secondaryColor = new THREE.Color(...theme.secondaryColor);
    const accentColor = new THREE.Color(...theme.accentColor);
    const colors = [primaryColor, secondaryColor, accentColor];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * radius;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const type = (['bubble', 'crystal', 'grass', 'mushroom', 'rock'] as const)[
        Math.floor(Math.random() * 5)
      ];

      items.push({
        type,
        position: [x, type === 'rock' ? 3 + Math.random() * 5 : 0, z],
        color: colors[Math.floor(Math.random() * colors.length)].clone(),
        scale: 0.5 + Math.random() * 1.5,
      });
    }

    return items;
  }, [theme, count, radius]);

  return (
    <group name="alien-flora">
      {flora.map((item, i) => {
        switch (item.type) {
          case 'bubble':
            return <BubblePlant key={i} position={item.position} color={item.color} scale={item.scale} />;
          case 'crystal':
            return <CrystalCluster key={i} position={item.position} color={item.color} scale={item.scale} />;
          case 'grass':
            return <TallGrass key={i} position={item.position} color={item.color} scale={item.scale} />;
          case 'mushroom':
            return <MushroomTree key={i} position={item.position} color={item.color} scale={item.scale} />;
          case 'rock':
            return <FloatingRock key={i} position={item.position} color={item.color} scale={item.scale} />;
          default:
            return null;
        }
      })}
    </group>
  );
};

export default AlienFlora;
