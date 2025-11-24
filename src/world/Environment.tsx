/**
 * Environment - Atmospheric effects for the voxel world
 * Skybox, fog, particles, and dynamic lighting
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import type { WorldTheme } from './WorldGenerator';

export interface EnvironmentProps {
  theme: WorldTheme;
  enableFog?: boolean;
  enableParticles?: boolean;
  showGrid?: boolean;
}

/**
 * Animated skybox with nebula effect
 */
const Skybox: React.FC<{ theme: WorldTheme }> = ({ theme }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => {
    const vertexShader = `
      varying vec3 vWorldPosition;
      varying vec3 vPosition;

      void main() {
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float time;
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform vec3 accentColor;

      varying vec3 vWorldPosition;
      varying vec3 vPosition;

      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);

        float n = i.x + i.y * 57.0 + 113.0 * i.z;
        return mix(
          mix(mix(fract(sin(n) * 43758.5453),
                  fract(sin(n + 1.0) * 43758.5453), f.x),
              mix(fract(sin(n + 57.0) * 43758.5453),
                  fract(sin(n + 58.0) * 43758.5453), f.x), f.y),
          mix(mix(fract(sin(n + 113.0) * 43758.5453),
                  fract(sin(n + 114.0) * 43758.5453), f.x),
              mix(fract(sin(n + 170.0) * 43758.5453),
                  fract(sin(n + 171.0) * 43758.5453), f.x), f.y),
          f.z
        );
      }

      float fbm(vec3 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;

        for(int i = 0; i < 5; i++) {
          value += amplitude * noise(p * frequency);
          frequency *= 2.0;
          amplitude *= 0.5;
        }

        return value;
      }

      void main() {
        vec3 direction = normalize(vWorldPosition);

        // Gradient based on y position
        float gradient = dot(direction, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;

        // Base color gradient
        vec3 color = mix(bottomColor, topColor, gradient);

        // Nebula effect
        vec3 nebulaPos = direction * 0.5 + time * 0.02;
        float nebula = fbm(nebulaPos);
        nebula = smoothstep(0.3, 0.7, nebula);

        // Add nebula accent color
        color = mix(color, accentColor, nebula * 0.3);

        // Add energy streams
        float stream = sin(direction.x * 10.0 + time * 0.5) * sin(direction.z * 10.0 - time * 0.3);
        stream = stream * 0.5 + 0.5;
        stream = pow(stream, 5.0);

        color += accentColor * stream * 0.2;

        // Distance fade
        float dist = length(vPosition);
        float alpha = smoothstep(450.0, 500.0, dist);

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        topColor: { value: new THREE.Color(...theme.primaryColor).multiplyScalar(0.3) },
        bottomColor: { value: new THREE.Color(...theme.fogColor) },
        accentColor: { value: new THREE.Color(...theme.accentColor).multiplyScalar(0.5) },
      },
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, [theme]);

  useFrame((state) => {
    if (meshRef.current) {
      material.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} material={material}>
      <sphereGeometry args={[500, 32, 32]} />
    </mesh>
  );
};

/**
 * Grid floor with animated glow lines
 */
const GridFloor: React.FC<{ theme: WorldTheme }> = ({ theme }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => {
    const vertexShader = `
      varying vec3 vWorldPosition;
      varying vec2 vUv;

      void main() {
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float time;
      uniform vec3 gridColor;
      uniform vec3 glowColor;

      varying vec3 vWorldPosition;
      varying vec2 vUv;

      float grid(vec2 pos, float size, float thickness) {
        vec2 r = abs(fract(pos / size - 0.5) - 0.5);
        float d = min(r.x, r.y);
        return 1.0 - smoothstep(thickness - 0.01, thickness, d);
      }

      void main() {
        float gridSize = 4.0;
        float gridLine = grid(vWorldPosition.xz, gridSize, 0.02);

        // Animated glow along grid lines
        float flow = sin(vWorldPosition.x * 0.5 + time) * sin(vWorldPosition.z * 0.5 - time);
        flow = flow * 0.5 + 0.5;

        vec3 color = mix(gridColor, glowColor, gridLine * (0.5 + flow * 0.5));

        // Distance fade
        float dist = length(vWorldPosition.xz);
        float fade = 1.0 - smoothstep(100.0, 200.0, dist);

        float alpha = gridLine * fade;

        if (alpha < 0.01) discard;

        gl_FragColor = vec4(color, alpha * 0.3);
      }
    `;

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        gridColor: { value: new THREE.Color(...theme.fogColor) },
        glowColor: { value: new THREE.Color(...theme.primaryColor) },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }, [theme]);

  useFrame((state) => {
    if (meshRef.current) {
      material.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh
      ref={meshRef}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -8, 0]}
    >
      <planeGeometry args={[400, 400, 1, 1]} />
    </mesh>
  );
};

/**
 * Ambient particles - dust motes and energy particles
 */
const AmbientParticles: React.FC<{ theme: WorldTheme }> = ({ theme }) => {
  const particlesRef = useRef<THREE.Points>(null);

  const { positions, colors, sizes, velocities } = useMemo(() => {
    const particleCount = 500;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(...theme.primaryColor);
    const color2 = new THREE.Color(...theme.secondaryColor);
    const color3 = new THREE.Color(...theme.accentColor);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Random position in sphere
      const radius = Math.random() * 100 + 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = (Math.random() - 0.5) * 100;
      positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      // Random color from theme
      const rand = Math.random();
      const color = rand < 0.33 ? color1 : rand < 0.66 ? color2 : color3;
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      // Random size
      sizes[i] = Math.random() * 2 + 0.5;

      // Random velocity
      velocities[i3] = (Math.random() - 0.5) * 0.2;
      velocities[i3 + 1] = Math.random() * 0.5 + 0.1;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.2;
    }

    return { positions, colors, sizes, velocities };
  }, [theme]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [positions, colors, sizes]);

  const material = useMemo(() => {
    const vertexShader = `
      attribute float size;
      attribute vec3 color;

      varying vec3 vColor;
      varying float vDistance;

      void main() {
        vColor = color;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vDistance = -mvPosition.z;

        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      varying vec3 vColor;
      varying float vDistance;

      void main() {
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center);

        if (dist > 0.5) discard;

        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
        alpha *= smoothstep(150.0, 50.0, vDistance);

        gl_FragColor = vec4(vColor, alpha * 0.6);
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

  useFrame((state, delta) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < positions.length; i += 3) {
        // Move particles
        positions[i] += velocities[i] * delta * 10;
        positions[i + 1] += velocities[i + 1] * delta * 10;
        positions[i + 2] += velocities[i + 2] * delta * 10;

        // Wrap around if too far
        if (positions[i + 1] > 100) positions[i + 1] = -100;
        if (Math.abs(positions[i]) > 150) positions[i] *= -0.5;
        if (Math.abs(positions[i + 2]) > 150) positions[i + 2] *= -0.5;
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;

      // Slow rotation
      particlesRef.current.rotation.y += delta * 0.05;
    }
  });

  return <points ref={particlesRef} geometry={geometry} material={material} />;
};

/**
 * Volumetric fog effect
 */
const VolumetricFog: React.FC<{ theme: WorldTheme }> = ({ theme }) => {
  return (
    <>
      <fog attach="fog" args={[new THREE.Color(...theme.fogColor), 50, 200]} />
    </>
  );
};

/**
 * Main Environment component
 */
export const Environment: React.FC<EnvironmentProps> = ({
  theme,
  enableFog = true,
  enableParticles = true,
  showGrid = true,
}) => {
  return (
    <group name="environment">
      {/* Skybox with animated nebula */}
      <Skybox theme={theme} />

      {/* Stars in the distance */}
      <Stars
        radius={300}
        depth={50}
        count={5000}
        factor={4}
        saturation={0.5}
        fade
        speed={0.5}
      />

      {/* Sparkles for extra magic */}
      <Sparkles
        count={100}
        size={2}
        speed={0.3}
        opacity={0.4}
        color={new THREE.Color(...theme.primaryColor)}
        scale={[200, 100, 200]}
      />

      <Sparkles
        count={80}
        size={1.5}
        speed={0.4}
        opacity={0.3}
        color={new THREE.Color(...theme.secondaryColor)}
        scale={[180, 90, 180]}
      />

      {/* Grid floor */}
      {showGrid && <GridFloor theme={theme} />}

      {/* Ambient particles */}
      {enableParticles && <AmbientParticles theme={theme} />}

      {/* Volumetric fog */}
      {enableFog && <VolumetricFog theme={theme} />}

      {/* Ambient energy glow at origin */}
      <pointLight
        position={[0, 0, 0]}
        intensity={2}
        distance={50}
        color={new THREE.Color(...theme.primaryColor)}
        decay={2}
      />

      {/* Pulsing accent lights */}
      <PulsingLight
        position={[40, 20, 40]}
        color={theme.secondaryColor}
        speed={1.5}
      />
      <PulsingLight
        position={[-40, 20, -40]}
        color={theme.accentColor}
        speed={2.0}
      />
    </group>
  );
};

/**
 * Pulsing point light
 */
const PulsingLight: React.FC<{
  position: [number, number, number];
  color: [number, number, number];
  speed?: number;
}> = ({ position, color, speed = 1.0 }) => {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (lightRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * speed) * 0.5 + 0.5;
      lightRef.current.intensity = 0.5 + pulse * 1.5;
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={position}
      intensity={1}
      distance={100}
      color={new THREE.Color(...color)}
      decay={2}
    />
  );
};

export default Environment;
