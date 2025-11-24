import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import {
  nanoBotVertexShader,
  nanoBotFragmentShader,
  orbitalRingFragmentShader,
  orbitalRingVertexShader,
  particleVertexShader,
  particleFragmentShader,
} from '@shaders/index';

export type BotState = 'idle' | 'working' | 'learning' | 'replicating';

export interface NanoBot3DProps {
  position: [number, number, number];
  state: BotState;
  color?: string;
  energy?: number;
  isSelected?: boolean;
  velocity?: [number, number, number];
}

const stateToNumber = (state: BotState): number => {
  switch (state) {
    case 'idle':
      return 0;
    case 'working':
      return 1;
    case 'learning':
      return 2;
    case 'replicating':
      return 3;
    default:
      return 0;
  }
};

export const NanoBot3D: React.FC<NanoBot3DProps> = ({
  position,
  state,
  color = '#00ffff',
  energy = 1.0,
  isSelected = false,
  velocity = [0, 0, 0],
}) => {
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const spikesRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  // Parse color to THREE.Color
  const colorObj = useMemo(() => new THREE.Color(color), [color]);
  const colorArray = useMemo(() => [colorObj.r, colorObj.g, colorObj.b], [colorObj]);

  // Core shader material
  const coreShaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: nanoBotVertexShader,
        fragmentShader: nanoBotFragmentShader,
        uniforms: {
          time: { value: 0 },
          color: { value: colorObj },
          energy: { value: energy },
          glowIntensity: { value: isSelected ? 2.0 : 1.0 },
          pulseIntensity: { value: 1.0 },
          state: { value: stateToNumber(state) },
        },
      }),
    [colorObj, energy, isSelected, state]
  );

  // Orbital ring materials
  const ringMaterial1 = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: orbitalRingVertexShader,
        fragmentShader: orbitalRingFragmentShader,
        uniforms: {
          time: { value: 0 },
          color: { value: colorObj },
          opacity: { value: 0.6 },
          energy: { value: energy },
          rotation: { value: 0 },
        },
        transparent: true,
        side: THREE.DoubleSide,
      }),
    [colorObj, energy]
  );

  const ringMaterial2 = useMemo(() => ringMaterial1.clone(), [ringMaterial1]);
  const ringMaterial3 = useMemo(() => ringMaterial1.clone(), [ringMaterial1]);

  // Crystalline spikes geometry
  const spikesGeometry = useMemo(() => {
    const geometry = new THREE.ConeGeometry(0.05, 0.3, 4);
    return geometry;
  }, []);

  const spikeMaterial = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: colorObj,
        emissive: colorObj,
        emissiveIntensity: 0.5,
        shininess: 100,
        transparent: true,
        opacity: 0.8,
      }),
    [colorObj]
  );

  // Spike positions (icosahedron vertices)
  const spikePositions = useMemo(() => {
    const phi = (1 + Math.sqrt(5)) / 2;
    const positions: [number, number, number][] = [
      [0, 1, phi],
      [0, -1, phi],
      [0, 1, -phi],
      [0, -1, -phi],
      [1, phi, 0],
      [-1, phi, 0],
      [1, -phi, 0],
      [-1, -phi, 0],
      [phi, 0, 1],
      [-phi, 0, 1],
      [phi, 0, -1],
      [-phi, 0, -1],
    ];

    return positions.map((p) => {
      const length = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]);
      return [p[0] / length, p[1] / length, p[2] / length] as [number, number, number];
    });
  }, []);

  // Particle trail system
  const particleCount = 50;
  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const alphas = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      sizes[i] = Math.random() * 0.1 + 0.05;
      colors[i * 3] = colorObj.r;
      colors[i * 3 + 1] = colorObj.g;
      colors[i * 3 + 2] = colorObj.b;
      alphas[i] = 0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    return geometry;
  }, [colorObj]);

  const particleMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  // Store trail positions
  const trailPositions = useRef<THREE.Vector3[]>([]);

  // Animation loop
  useFrame((state, delta) => {
    timeRef.current += delta;

    // Update shader uniforms
    coreShaderMaterial.uniforms.time.value = timeRef.current;
    ringMaterial1.uniforms.time.value = timeRef.current;
    ringMaterial2.uniforms.time.value = timeRef.current;
    ringMaterial3.uniforms.time.value = timeRef.current;

    if (coreRef.current) {
      const stateNum = stateToNumber(state);

      switch (state) {
        case 'idle':
          // Gentle bob
          coreRef.current.position.y =
            position[1] + Math.sin(timeRef.current * 2) * 0.05;
          coreRef.current.rotation.y += delta * 0.5;
          coreShaderMaterial.uniforms.pulseIntensity.value = 0.3;
          break;

        case 'working':
          // Fast pulse
          const workPulse = Math.sin(timeRef.current * 10) * 0.02;
          coreRef.current.scale.setScalar(1 + workPulse);
          coreRef.current.rotation.y += delta * 2;
          coreShaderMaterial.uniforms.pulseIntensity.value = 1.0;
          break;

        case 'learning':
          // Breathing
          const breathe = Math.sin(timeRef.current * 1.5) * 0.1 + 1;
          coreRef.current.scale.setScalar(breathe);
          coreRef.current.rotation.y += delta * 1;
          coreRef.current.rotation.x = Math.sin(timeRef.current * 0.5) * 0.2;
          coreShaderMaterial.uniforms.pulseIntensity.value = 0.5;
          break;

        case 'replicating':
          // Intense animation
          const replicatePulse = Math.sin(timeRef.current * 15) * 0.15 + 1;
          coreRef.current.scale.setScalar(replicatePulse);
          coreRef.current.rotation.y += delta * 5;
          coreRef.current.rotation.z = Math.sin(timeRef.current * 3) * 0.3;
          coreShaderMaterial.uniforms.pulseIntensity.value = 2.0;
          break;
      }
    }

    // Rotate orbital rings
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 1.5;
      ring1Ref.current.rotation.x = 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * 1.2;
      ring2Ref.current.rotation.y = 0.3;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z += delta * 0.9;
      ring3Ref.current.rotation.x = -0.3;
    }

    // Animate spikes
    if (spikesRef.current) {
      spikesRef.current.children.forEach((spike, i) => {
        const offset = i * 0.5;
        const pulse = Math.sin(timeRef.current * 3 + offset) * 0.1 + 0.9;
        spike.scale.setScalar(pulse);
      });
    }

    // Update particle trail
    const speed = Math.sqrt(
      velocity[0] * velocity[0] + velocity[1] * velocity[1] + velocity[2] * velocity[2]
    );

    if (speed > 0.01 && particlesRef.current) {
      const currentPos = new THREE.Vector3(position[0], position[1], position[2]);
      trailPositions.current.unshift(currentPos.clone());

      if (trailPositions.current.length > particleCount) {
        trailPositions.current.pop();
      }

      const positions = particleGeometry.attributes.position.array as Float32Array;
      const alphas = particleGeometry.attributes.alpha.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        if (i < trailPositions.current.length) {
          const pos = trailPositions.current[i];
          positions[i * 3] = pos.x - position[0];
          positions[i * 3 + 1] = pos.y - position[1];
          positions[i * 3 + 2] = pos.z - position[2];
          alphas[i] = (1 - i / particleCount) * 0.8;
        } else {
          alphas[i] = 0;
        }
      }

      particleGeometry.attributes.position.needsUpdate = true;
      particleGeometry.attributes.alpha.needsUpdate = true;
    }
  });

  return (
    <group position={position}>
      {/* Core - Icosahedron with high subdivision */}
      <mesh ref={coreRef} material={coreShaderMaterial}>
        <icosahedronGeometry args={[0.3, 3]} />
      </mesh>

      {/* Orbital Rings */}
      <mesh ref={ring1Ref} material={ringMaterial1}>
        <torusGeometry args={[0.6, 0.02, 8, 32]} />
      </mesh>

      <mesh ref={ring2Ref} material={ringMaterial2}>
        <torusGeometry args={[0.5, 0.015, 8, 32]} />
      </mesh>

      <mesh ref={ring3Ref} material={ringMaterial3}>
        <torusGeometry args={[0.7, 0.025, 8, 32]} />
      </mesh>

      {/* Crystalline Spikes */}
      <group ref={spikesRef}>
        {spikePositions.map((pos, i) => {
          const direction = new THREE.Vector3(pos[0], pos[1], pos[2]);
          const quaternion = new THREE.Quaternion();
          quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.normalize()
          );

          return (
            <mesh
              key={i}
              geometry={spikesGeometry}
              material={spikeMaterial}
              position={[pos[0] * 0.35, pos[1] * 0.35, pos[2] * 0.35]}
              quaternion={quaternion}
            />
          );
        })}
      </group>

      {/* Particle Trail */}
      <points
        ref={particlesRef}
        geometry={particleGeometry}
        material={particleMaterial}
      />

      {/* Selection Glow */}
      {isSelected && (
        <Sphere args={[0.8, 16, 16]}>
          <meshBasicMaterial
            color={colorObj}
            transparent
            opacity={0.1}
            side={THREE.BackSide}
          />
        </Sphere>
      )}

      {/* Point light for glow effect */}
      <pointLight
        color={colorObj}
        intensity={energy * (isSelected ? 2 : 1)}
        distance={3}
      />
    </group>
  );
};

export default NanoBot3D;
