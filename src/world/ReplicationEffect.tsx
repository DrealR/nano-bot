import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  replicationVertexShader,
  replicationFragmentShader,
  particleVertexShader,
  particleFragmentShader,
} from '@shaders/index';

export interface ReplicationEffectProps {
  parentPosition: [number, number, number];
  childPosition: [number, number, number];
  color?: string;
  duration?: number;
  onComplete?: () => void;
}

export const ReplicationEffect: React.FC<ReplicationEffectProps> = ({
  parentPosition,
  childPosition,
  color = '#00ffff',
  duration = 3.0,
  onComplete,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const helixParticlesRef = useRef<THREE.Points>(null);
  const crystalRef = useRef<THREE.Mesh>(null);
  const bloomWaveRef = useRef<THREE.Mesh>(null);
  const connectionLineRef = useRef<THREE.Line>(null);
  const timeRef = useRef(0);
  const phaseRef = useRef(0);

  const colorObj = useMemo(() => new THREE.Color(color), [color]);

  // Energy extraction helix particles
  const helixParticlesGeometry = useMemo(() => {
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const alphas = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      phases[i] = i / particleCount;

      // Spiral helix path
      const angle = (i / particleCount) * Math.PI * 8;
      const radius = 0.3;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = (i / particleCount) * 2 - 1;

      sizes[i] = Math.random() * 0.08 + 0.04;
      colors[i * 3] = colorObj.r;
      colors[i * 3 + 1] = colorObj.g;
      colors[i * 3 + 2] = colorObj.b;
      alphas[i] = 0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    return geometry;
  }, [colorObj]);

  const helixMaterial = useMemo(
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

  // Crystallization effect mesh
  const crystalGeometry = useMemo(() => {
    return new THREE.IcosahedronGeometry(0.4, 2);
  }, []);

  const crystalMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: replicationVertexShader,
        fragmentShader: replicationFragmentShader,
        uniforms: {
          time: { value: 0 },
          phase: { value: 0 },
          color: { value: colorObj },
        },
        transparent: true,
        side: THREE.DoubleSide,
      }),
    [colorObj]
  );

  // Bloom wave expansion
  const bloomWaveGeometry = useMemo(() => {
    return new THREE.SphereGeometry(1, 32, 32);
  }, []);

  const bloomWaveMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: colorObj,
        transparent: true,
        opacity: 0,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
      }),
    [colorObj]
  );

  // Connection line between parent and child
  const connectionGeometry = useMemo(() => {
    const start = new THREE.Vector3(...parentPosition);
    const end = new THREE.Vector3(...childPosition);
    const points = [start, end];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [parentPosition, childPosition]);

  const connectionMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: colorObj,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      }),
    [colorObj]
  );

  // Energy beam particles flowing from parent to child
  const beamParticlesGeometry = useMemo(() => {
    const particleCount = 50;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const alphas = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      sizes[i] = Math.random() * 0.1 + 0.05;
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
      alphas[i] = 0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    return geometry;
  }, []);

  const beamParticlesRef = useRef<THREE.Points>(null);

  // Sound timing markers (for future integration)
  const soundTimings = {
    extractionStart: 0,
    helixPeak: 0.3,
    materializationStart: 1.0,
    crystalPeak: 1.5,
    bloomExpansion: 2.0,
    complete: 3.0,
  };

  // Animation loop
  useFrame((state, delta) => {
    timeRef.current += delta;
    phaseRef.current = Math.min(timeRef.current / duration, 1) * 2; // 0-2 range

    // Phase 1: Energy Extraction (0-1)
    if (phaseRef.current < 1) {
      const extractPhase = phaseRef.current;

      // Animate helix particles
      if (helixParticlesRef.current) {
        const positions = helixParticlesGeometry.attributes.position
          .array as Float32Array;
        const alphas = helixParticlesGeometry.attributes.alpha.array as Float32Array;
        const phases = helixParticlesGeometry.attributes.phase.array as Float32Array;

        for (let i = 0; i < alphas.length; i++) {
          const particlePhase = phases[i];

          // Spiral animation
          const angle = (particlePhase + timeRef.current * 2) * Math.PI * 8;
          const radius = 0.3 * (1 + Math.sin(timeRef.current * 5) * 0.2);
          positions[i * 3] = Math.cos(angle) * radius;
          positions[i * 3 + 1] = Math.sin(angle) * radius;
          positions[i * 3 + 2] = (particlePhase * 2 - 1) * (1 + extractPhase);

          // Alpha based on extraction phase
          if (particlePhase < extractPhase) {
            alphas[i] = Math.sin(particlePhase / extractPhase * Math.PI) * 0.8;
          } else {
            alphas[i] = 0;
          }
        }

        helixParticlesGeometry.attributes.position.needsUpdate = true;
        helixParticlesGeometry.attributes.alpha.needsUpdate = true;

        helixParticlesRef.current.position.set(...parentPosition);
      }

      // Energy beam from parent to child
      if (beamParticlesRef.current) {
        const positions = beamParticlesGeometry.attributes.position
          .array as Float32Array;
        const alphas = beamParticlesGeometry.attributes.alpha.array as Float32Array;

        const start = new THREE.Vector3(...parentPosition);
        const end = new THREE.Vector3(...childPosition);

        for (let i = 0; i < alphas.length; i++) {
          const progress = (i / alphas.length + timeRef.current * 2) % 1;
          const pos = new THREE.Vector3().lerpVectors(start, end, progress);

          positions[i * 3] = pos.x;
          positions[i * 3 + 1] = pos.y;
          positions[i * 3 + 2] = pos.z;

          alphas[i] = Math.sin(progress * Math.PI) * extractPhase * 0.6;
        }

        beamParticlesGeometry.attributes.position.needsUpdate = true;
        beamParticlesGeometry.attributes.alpha.needsUpdate = true;
      }

      // Connection line fade in
      if (connectionLineRef.current) {
        (connectionLineRef.current.material as THREE.LineBasicMaterial).opacity =
          extractPhase * 0.4;
      }
    }

    // Phase 2: Materialization (1-2)
    if (phaseRef.current >= 1 && phaseRef.current < 2) {
      const matPhase = phaseRef.current - 1;

      // Fade out helix
      if (helixParticlesRef.current) {
        const alphas = helixParticlesGeometry.attributes.alpha.array as Float32Array;
        for (let i = 0; i < alphas.length; i++) {
          alphas[i] *= 1 - matPhase;
        }
        helixParticlesGeometry.attributes.alpha.needsUpdate = true;
      }

      // Crystallization effect
      if (crystalRef.current) {
        crystalRef.current.visible = true;
        crystalRef.current.position.set(...childPosition);
        crystalMaterial.uniforms.time.value = timeRef.current;
        crystalMaterial.uniforms.phase.value = phaseRef.current;

        // Scale animation
        const scale = matPhase;
        crystalRef.current.scale.setScalar(scale);

        // Rotation
        crystalRef.current.rotation.y = timeRef.current * 3;
        crystalRef.current.rotation.z = Math.sin(timeRef.current * 2) * 0.5;
      }

      // Fade out connection line
      if (connectionLineRef.current) {
        (connectionLineRef.current.material as THREE.LineBasicMaterial).opacity =
          (1 - matPhase) * 0.4;
      }
    }

    // Bloom wave expansion (starts at phase 1.5)
    if (phaseRef.current >= 1.5) {
      const bloomPhase = Math.min((phaseRef.current - 1.5) * 2, 1);

      if (bloomWaveRef.current) {
        bloomWaveRef.current.visible = true;
        bloomWaveRef.current.position.set(...childPosition);

        // Expand
        const scale = 0.5 + bloomPhase * 3;
        bloomWaveRef.current.scale.setScalar(scale);

        // Fade out
        bloomWaveMaterial.opacity = (1 - bloomPhase) * 0.3;
      }
    }

    // Complete
    if (phaseRef.current >= 2 && onComplete) {
      onComplete();
    }
  });

  useEffect(() => {
    // Reset on mount
    timeRef.current = 0;
    phaseRef.current = 0;
  }, []);

  return (
    <group ref={groupRef}>
      {/* Energy helix particles */}
      <points
        ref={helixParticlesRef}
        geometry={helixParticlesGeometry}
        material={helixMaterial}
      />

      {/* Energy beam particles */}
      <points
        ref={beamParticlesRef}
        geometry={beamParticlesGeometry}
        material={helixMaterial}
      />

      {/* Connection line */}
      <line
        ref={connectionLineRef}
        geometry={connectionGeometry}
        material={connectionMaterial}
      />

      {/* Crystallization mesh */}
      <mesh
        ref={crystalRef}
        geometry={crystalGeometry}
        material={crystalMaterial}
        visible={false}
      />

      {/* Bloom wave */}
      <mesh
        ref={bloomWaveRef}
        geometry={bloomWaveGeometry}
        material={bloomWaveMaterial}
        visible={false}
      />

      {/* Point lights for dramatic effect */}
      <pointLight
        position={parentPosition}
        color={colorObj}
        intensity={2 * (1 - Math.min(phaseRef.current, 1))}
        distance={3}
      />

      <pointLight
        position={childPosition}
        color={colorObj}
        intensity={2 * Math.max(phaseRef.current - 1, 0)}
        distance={3}
      />
    </group>
  );
};

export default ReplicationEffect;
