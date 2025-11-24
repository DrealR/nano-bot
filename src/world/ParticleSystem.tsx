import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type ParticleType = 'trail' | 'sparkle' | 'energy' | 'data';

export interface Particle {
  position: [number, number, number];
  velocity: [number, number, number];
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: ParticleType;
}

export interface ParticleSystemProps {
  maxParticles?: number;
  particles?: Particle[];
  emitRate?: number;
  emitPosition?: [number, number, number];
  emitVelocity?: [number, number, number];
  emitSpread?: number;
  particleType?: ParticleType;
  particleColor?: string;
  particleSize?: number;
  particleLifetime?: number;
  gravity?: [number, number, number];
  damping?: number;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  maxParticles = 1000,
  particles: externalParticles,
  emitRate = 0,
  emitPosition = [0, 0, 0],
  emitVelocity = [0, 0, 0],
  emitSpread = 1,
  particleType = 'sparkle',
  particleColor = '#00ffff',
  particleSize = 0.1,
  particleLifetime = 2,
  gravity = [0, -1, 0],
  damping = 0.98,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const internalParticlesRef = useRef<Particle[]>([]);
  const emitAccumulatorRef = useRef(0);

  // Create geometry with instanced attributes
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();

    const positions = new Float32Array(maxParticles * 3);
    const sizes = new Float32Array(maxParticles);
    const colors = new Float32Array(maxParticles * 3);
    const alphas = new Float32Array(maxParticles);

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    return geo;
  }, [maxParticles]);

  // Particle shader material
  const material = useMemo(() => {
    const vertexShader = `
      attribute float size;
      attribute vec3 customColor;
      attribute float alpha;

      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vColor = customColor;
        vAlpha = alpha;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);

        if (dist > 0.5) discard;

        float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
        float glow = 1.0 - smoothstep(0.0, 0.5, dist);
        vec3 color = vColor * (0.8 + glow * 0.5);

        gl_FragColor = vec4(color, alpha);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  // Particle type-specific behaviors
  const getParticleBehavior = (type: ParticleType) => {
    switch (type) {
      case 'trail':
        return {
          sizeMultiplier: 0.8,
          colorIntensity: 0.7,
          fadeSpeed: 1.0,
        };
      case 'sparkle':
        return {
          sizeMultiplier: 1.2,
          colorIntensity: 1.5,
          fadeSpeed: 2.0,
        };
      case 'energy':
        return {
          sizeMultiplier: 1.0,
          colorIntensity: 1.2,
          fadeSpeed: 0.8,
        };
      case 'data':
        return {
          sizeMultiplier: 0.6,
          colorIntensity: 1.0,
          fadeSpeed: 0.5,
        };
      default:
        return {
          sizeMultiplier: 1.0,
          colorIntensity: 1.0,
          fadeSpeed: 1.0,
        };
    }
  };

  // Emit new particles
  const emitParticle = () => {
    const color = new THREE.Color(particleColor);
    const behavior = getParticleBehavior(particleType);

    const particle: Particle = {
      position: [
        emitPosition[0] + (Math.random() - 0.5) * emitSpread,
        emitPosition[1] + (Math.random() - 0.5) * emitSpread,
        emitPosition[2] + (Math.random() - 0.5) * emitSpread,
      ],
      velocity: [
        emitVelocity[0] + (Math.random() - 0.5) * emitSpread,
        emitVelocity[1] + (Math.random() - 0.5) * emitSpread,
        emitVelocity[2] + (Math.random() - 0.5) * emitSpread,
      ],
      life: particleLifetime,
      maxLife: particleLifetime,
      size: particleSize * behavior.sizeMultiplier * (0.8 + Math.random() * 0.4),
      color: particleColor,
      type: particleType,
    };

    internalParticlesRef.current.push(particle);

    // Remove oldest particle if exceeding max
    if (internalParticlesRef.current.length > maxParticles) {
      internalParticlesRef.current.shift();
    }
  };

  // Update particles
  useFrame((state, delta) => {
    const particles = externalParticles || internalParticlesRef.current;

    // Emit particles
    if (emitRate > 0) {
      emitAccumulatorRef.current += delta * emitRate;
      while (emitAccumulatorRef.current >= 1) {
        emitParticle();
        emitAccumulatorRef.current -= 1;
      }
    }

    // Update particle physics
    const positions = geometry.attributes.position.array as Float32Array;
    const sizes = geometry.attributes.size.array as Float32Array;
    const colors = geometry.attributes.customColor.array as Float32Array;
    const alphas = geometry.attributes.alpha.array as Float32Array;

    let activeParticles = 0;

    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];

      // Update life
      particle.life -= delta;

      if (particle.life <= 0) {
        // Remove dead particles
        if (!externalParticles) {
          particles.splice(i, 1);
        }
        continue;
      }

      // Apply physics
      particle.velocity[0] += gravity[0] * delta;
      particle.velocity[1] += gravity[1] * delta;
      particle.velocity[2] += gravity[2] * delta;

      particle.velocity[0] *= damping;
      particle.velocity[1] *= damping;
      particle.velocity[2] *= damping;

      particle.position[0] += particle.velocity[0] * delta;
      particle.position[1] += particle.velocity[1] * delta;
      particle.position[2] += particle.velocity[2] * delta;

      // Update geometry attributes
      const idx = activeParticles * 3;
      positions[idx] = particle.position[0];
      positions[idx + 1] = particle.position[1];
      positions[idx + 2] = particle.position[2];

      // Size animation
      const lifeRatio = particle.life / particle.maxLife;
      const behavior = getParticleBehavior(particle.type);

      switch (particle.type) {
        case 'trail':
          sizes[activeParticles] = particle.size * lifeRatio;
          break;
        case 'sparkle':
          sizes[activeParticles] =
            particle.size * Math.sin(lifeRatio * Math.PI) * (1 + Math.sin(state.clock.elapsedTime * 10) * 0.2);
          break;
        case 'energy':
          sizes[activeParticles] =
            particle.size * (0.5 + Math.sin(lifeRatio * Math.PI * 2) * 0.5);
          break;
        case 'data':
          sizes[activeParticles] = particle.size;
          break;
      }

      // Color and alpha
      const color = new THREE.Color(particle.color);
      colors[idx] = color.r * behavior.colorIntensity;
      colors[idx + 1] = color.g * behavior.colorIntensity;
      colors[idx + 2] = color.b * behavior.colorIntensity;

      // Alpha based on lifetime and type
      let alpha = lifeRatio;

      switch (particle.type) {
        case 'trail':
          alpha = Math.pow(lifeRatio, 0.5);
          break;
        case 'sparkle':
          alpha = Math.sin(lifeRatio * Math.PI);
          break;
        case 'energy':
          alpha = lifeRatio * (0.7 + Math.sin(state.clock.elapsedTime * 5 + i) * 0.3);
          break;
        case 'data':
          alpha = lifeRatio * 0.9;
          break;
      }

      alphas[activeParticles] = alpha;

      activeParticles++;
    }

    // Zero out unused particles
    for (let i = activeParticles; i < maxParticles; i++) {
      alphas[i] = 0;
      sizes[i] = 0;
    }

    // Mark attributes for update
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;
    geometry.attributes.customColor.needsUpdate = true;
    geometry.attributes.alpha.needsUpdate = true;

    // Update draw range for performance
    geometry.setDrawRange(0, activeParticles);
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
};

export default ParticleSystem;
