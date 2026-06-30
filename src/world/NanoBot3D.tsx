import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Trail } from '@react-three/drei';
import * as THREE from 'three';

export type BotState = 'idle' | 'working' | 'learning' | 'replicating' | 'merging' | 'exploring' | string;

// Color schemes for different bot personalities
const PERSONALITY_COLORS = {
  aggressive: { primary: '#ff3366', secondary: '#ff6b6b', accent: '#ffd93d' },
  defensive: { primary: '#4dabf7', secondary: '#74c0fc', accent: '#a5d8ff' },
  explorer: { primary: '#51cf66', secondary: '#8ce99a', accent: '#b2f2bb' },
  builder: { primary: '#fcc419', secondary: '#ffe066', accent: '#fff3bf' },
  social: { primary: '#cc5de8', secondary: '#e599f7', accent: '#f3d9fa' },
  default: { primary: '#00ffff', secondary: '#00d9ff', accent: '#00ff88' },
};

export interface NanoBot3DProps {
  position: [number, number, number];
  state: BotState;
  color?: string;
  energy?: number;
  isSelected?: boolean;
  velocity?: [number, number, number];
  personality?: keyof typeof PERSONALITY_COLORS;
  generation?: number;
  id?: string;
}

export const NanoBot3D: React.FC<NanoBot3DProps> = ({
  position,
  state,
  color,
  energy = 1.0,
  isSelected = false,
  velocity = [0, 0, 0],
  personality = 'default',
  generation = 0,
  id,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const innerCoreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const spikesRef = useRef<THREE.Group>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  const trailTargetRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(Math.random() * 100); // Random start offset for variation

  // Get colors based on personality or custom color
  const colors = useMemo(() => {
    if (color) {
      return {
        primary: color,
        secondary: new THREE.Color(color).offsetHSL(0, 0, 0.2).getHexString(),
        accent: new THREE.Color(color).offsetHSL(0.1, 0, 0.3).getHexString(),
      };
    }
    return PERSONALITY_COLORS[personality] || PERSONALITY_COLORS.default;
  }, [color, personality]);

  const primaryColor = useMemo(() => new THREE.Color(colors.primary), [colors.primary]);
  const secondaryColor = useMemo(() => new THREE.Color(colors.secondary), [colors.secondary]);
  const accentColor = useMemo(() => new THREE.Color(colors.accent), [colors.accent]);

  // Scale based on generation (newer generations slightly smaller)
  const baseScale = useMemo(() => 1 - generation * 0.05, [generation]);

  // Core material with energy-based emission
  const coreMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: primaryColor,
        emissive: primaryColor,
        emissiveIntensity: Math.max(0.5, energy * 1.5) * (isSelected ? 2 : 1),
        metalness: 0.9,
        roughness: 0.1,
        envMapIntensity: 1.5,
      }),
    [primaryColor, energy, isSelected]
  );

  // Inner core (glowing heart)
  const innerCoreMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: accentColor,
        transparent: true,
        opacity: 0.8,
      }),
    [accentColor]
  );

  // Orbital ring materials with different speeds/opacities
  const ringMaterials = useMemo(() => [
    new THREE.MeshBasicMaterial({
      color: primaryColor,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    }),
    new THREE.MeshBasicMaterial({
      color: secondaryColor,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    }),
    new THREE.MeshBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    }),
  ], [primaryColor, secondaryColor, accentColor]);

  // Crystalline spikes
  const spikesGeometry = useMemo(() => new THREE.ConeGeometry(0.06, 0.35, 4), []);
  const spikeMaterial = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: secondaryColor,
        emissive: primaryColor,
        emissiveIntensity: 0.6,
        shininess: 150,
        transparent: true,
        opacity: 0.9,
        flatShading: true,
      }),
    [primaryColor, secondaryColor]
  );

  // Aura material (pulsing outer glow)
  const auraMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: primaryColor,
        transparent: true,
        opacity: 0.05,
        side: THREE.BackSide,
      }),
    [primaryColor]
  );

  // Spike positions (icosahedron vertices)
  const spikePositions = useMemo(() => {
    const phi = (1 + Math.sqrt(5)) / 2;
    const positions: [number, number, number][] = [
      [0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi],
      [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0],
      [phi, 0, 1], [-phi, 0, 1], [phi, 0, -1], [-phi, 0, -1],
    ];
    return positions.map((p) => {
      const length = Math.sqrt(p[0] ** 2 + p[1] ** 2 + p[2] ** 2);
      return [p[0] / length, p[1] / length, p[2] / length] as [number, number, number];
    });
  }, []);

  // Particle system for energy particles
  const particleGeometry = useMemo(() => {
    const count = 30;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const angles = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 0.5 + Math.random() * 0.3;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      sizes[i] = 0.02 + Math.random() * 0.03;
      angles[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('angle', new THREE.BufferAttribute(angles, 1));

    return geometry;
  }, []);

  const particleMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: accentColor,
        size: 0.05,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    [accentColor]
  );

  // Animation loop
  useFrame((_, delta) => {
    timeRef.current += delta;
    const time = timeRef.current;

    // Core animations based on state
    if (coreRef.current) {
      const speedMultiplier = state === 'replicating' ? 3 : state === 'working' ? 2 : state === 'learning' ? 1.5 : 1;

      switch (state) {
        case 'idle':
          coreRef.current.position.y = Math.sin(time * 2) * 0.08;
          coreRef.current.rotation.y += delta * 0.5;
          coreRef.current.scale.setScalar(baseScale * (1 + Math.sin(time * 1.5) * 0.03));
          break;
        case 'working':
          coreRef.current.position.y = Math.sin(time * 4) * 0.05;
          coreRef.current.rotation.y += delta * 2;
          coreRef.current.rotation.x = Math.sin(time * 3) * 0.1;
          coreRef.current.scale.setScalar(baseScale * (1 + Math.sin(time * 8) * 0.05));
          break;
        case 'learning':
          const breathe = Math.sin(time * 1.2) * 0.12 + 1;
          coreRef.current.scale.setScalar(baseScale * breathe);
          coreRef.current.rotation.y += delta * 1;
          coreRef.current.rotation.x = Math.sin(time * 0.5) * 0.3;
          coreRef.current.rotation.z = Math.cos(time * 0.7) * 0.2;
          break;
        case 'replicating':
          const pulse = Math.sin(time * 12) * 0.2 + 1;
          coreRef.current.scale.setScalar(baseScale * pulse);
          coreRef.current.rotation.y += delta * 5;
          coreRef.current.rotation.z = Math.sin(time * 4) * 0.4;
          coreRef.current.position.y = Math.sin(time * 6) * 0.15;
          break;
        default:
          coreRef.current.rotation.y += delta * 0.5;
      }

      // Update emissive based on energy
      if (coreMaterial.emissiveIntensity !== undefined) {
        coreMaterial.emissiveIntensity = Math.max(0.3, energy) * (isSelected ? 2.5 : 1.2) * speedMultiplier;
      }
    }

    // Inner core pulse
    if (innerCoreRef.current) {
      const innerPulse = Math.sin(time * 4) * 0.3 + 0.7;
      innerCoreRef.current.scale.setScalar(innerPulse);
    }

    // Orbital rings with different speeds and wobbles
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 1.8;
      ring1Ref.current.rotation.x = Math.sin(time * 0.5) * 0.4 + 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * 1.4;
      ring2Ref.current.rotation.y = Math.cos(time * 0.7) * 0.3 + 0.2;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z += delta * 1.0;
      ring3Ref.current.rotation.x = Math.sin(time * 0.3) * 0.5 - 0.3;
    }

    // Spikes pulsing
    if (spikesRef.current) {
      spikesRef.current.rotation.y += delta * 0.2;
      spikesRef.current.children.forEach((spike, i) => {
        const offset = i * 0.4;
        const pulse = Math.sin(time * 2.5 + offset) * 0.15 + 0.95;
        spike.scale.setScalar(pulse);
      });
    }

    // Aura breathing
    if (auraRef.current) {
      const auraScale = 1 + Math.sin(time * 1.5) * 0.15;
      auraRef.current.scale.setScalar(auraScale);
      (auraRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.03 + Math.sin(time * 2) * 0.02 + (isSelected ? 0.05 : 0);
    }

    // Particle orbit animation
    if (particlesRef.current && particleGeometry) {
      const positions = particleGeometry.attributes.position.array as Float32Array;
      const angles = particleGeometry.attributes.angle.array as Float32Array;
      const count = positions.length / 3;

      for (let i = 0; i < count; i++) {
        angles[i] += delta * (1 + i * 0.1);
        const radius = 0.5 + Math.sin(time * 2 + i) * 0.1;
        const theta = angles[i];
        const phi = (i / count) * Math.PI;

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) + Math.sin(time * 3 + i) * 0.1;
        positions[i * 3 + 2] = radius * Math.cos(phi);
      }

      particleGeometry.attributes.position.needsUpdate = true;
    }

    // Update trail target position
    if (trailTargetRef.current) {
      trailTargetRef.current.position.set(0, Math.sin(time * 3) * 0.1, 0);
    }
  });

  // Calculate velocity magnitude for trail intensity
  const velocityMagnitude = Math.sqrt(velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2);
  const showTrail = velocityMagnitude > 0.5;

  return (
    <group ref={groupRef} position={position} scale={baseScale}>
      {/* Energy Trail - shows when moving fast */}
      {showTrail && (
        <Trail
          width={0.5}
          length={8}
          color={primaryColor}
          attenuation={(t) => t * t}
          decay={1}
        >
          <mesh ref={trailTargetRef} visible={false}>
            <sphereGeometry args={[0.01, 4, 4]} />
            <meshBasicMaterial color={primaryColor} />
          </mesh>
        </Trail>
      )}

      {/* Outer Aura */}
      <mesh ref={auraRef}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <primitive object={auraMaterial} attach="material" />
      </mesh>

      {/* Energy Particles */}
      <points ref={particlesRef} geometry={particleGeometry} material={particleMaterial} />

      {/* Core - Icosahedron */}
      <mesh ref={coreRef} material={coreMaterial}>
        <icosahedronGeometry args={[0.35, 3]} />
      </mesh>

      {/* Inner Core (glowing heart) */}
      <mesh ref={innerCoreRef} material={innerCoreMaterial}>
        <icosahedronGeometry args={[0.15, 2]} />
      </mesh>

      {/* Orbital Rings */}
      <mesh ref={ring1Ref} material={ringMaterials[0]}>
        <torusGeometry args={[0.65, 0.025, 8, 48]} />
      </mesh>
      <mesh ref={ring2Ref} material={ringMaterials[1]}>
        <torusGeometry args={[0.55, 0.02, 8, 48]} />
      </mesh>
      <mesh ref={ring3Ref} material={ringMaterials[2]}>
        <torusGeometry args={[0.75, 0.018, 8, 48]} />
      </mesh>

      {/* Crystalline Spikes */}
      <group ref={spikesRef}>
        {spikePositions.map((pos, i) => {
          const direction = new THREE.Vector3(pos[0], pos[1], pos[2]);
          const quaternion = new THREE.Quaternion();
          quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());

          return (
            <mesh
              key={i}
              geometry={spikesGeometry}
              material={spikeMaterial}
              position={[pos[0] * 0.4, pos[1] * 0.4, pos[2] * 0.4]}
              quaternion={quaternion}
            />
          );
        })}
      </group>

      {/* Selection Glow */}
      {isSelected && (
        <>
          <Sphere args={[0.9, 24, 24]}>
            <meshBasicMaterial
              color={primaryColor}
              transparent
              opacity={0.15}
              side={THREE.BackSide}
            />
          </Sphere>
          <Sphere args={[1.1, 16, 16]}>
            <meshBasicMaterial
              color={accentColor}
              transparent
              opacity={0.08}
              side={THREE.BackSide}
            />
          </Sphere>
        </>
      )}

      {/* Dynamic Point Light */}
      <pointLight
        color={primaryColor}
        intensity={Math.max(0.5, energy * 2) * (isSelected ? 3 : 1)}
        distance={4}
        decay={2}
      />

      {/* Secondary colored light for atmosphere */}
      <pointLight
        color={accentColor}
        intensity={0.3}
        distance={2}
        decay={2}
        position={[0, 0.5, 0]}
      />
    </group>
  );
};

export default NanoBot3D;
