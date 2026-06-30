/**
 * Environment - No Man's Sky inspired atmospheric effects
 * Alien skybox with planets, procedural terrain, and vibrant atmospherics
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Sparkles, Sky } from '@react-three/drei';
import * as THREE from 'three';
import type { WorldTheme } from './WorldGenerator';
import { AlienFlora } from './AlienFlora';

export interface EnvironmentProps {
  theme: WorldTheme;
  enableFog?: boolean;
  enableParticles?: boolean;
  showGrid?: boolean;
  nmsStyle?: boolean;
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
 * NMS-Style Planet in the sky
 */
const AlienPlanet: React.FC<{ theme: WorldTheme; position?: [number, number, number]; size?: number }> = ({
  theme,
  position = [200, 100, -300],
  size = 80,
}) => {
  const planetRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += 0.0002;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.0001;
    }
  });

  const planetColor = useMemo(() => new THREE.Color(...theme.secondaryColor), [theme]);
  const atmosphereColor = useMemo(() => new THREE.Color(...theme.primaryColor), [theme]);

  return (
    <group ref={planetRef} position={position}>
      {/* Planet surface */}
      <mesh>
        <sphereGeometry args={[size, 64, 64]} />
        <meshStandardMaterial
          color={planetColor}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[size * 1.05, 64, 64]} />
        <meshBasicMaterial
          color={atmosphereColor}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Outer atmosphere */}
      <mesh>
        <sphereGeometry args={[size * 1.15, 32, 32]} />
        <meshBasicMaterial
          color={atmosphereColor}
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Optional rings */}
      <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
        <ringGeometry args={[size * 1.4, size * 2, 64]} />
        <meshBasicMaterial
          color={theme.accentColor ? new THREE.Color(...theme.accentColor) : planetColor}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

/**
 * NMS-Style Alien Sky Gradient
 */
const NMSSkybox: React.FC<{ theme: WorldTheme }> = ({ theme }) => {
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
      uniform vec3 horizonColor;
      uniform vec3 zenithColor;
      uniform vec3 sunColor;
      uniform vec3 sunDirection;

      varying vec3 vWorldPosition;
      varying vec3 vPosition;

      // Simplex noise for clouds
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);

        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;

        i = mod289(i);
        vec4 p = permute(permute(permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0));

        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);

        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        vec3 direction = normalize(vWorldPosition);

        // Height-based gradient (horizon to zenith)
        float height = direction.y * 0.5 + 0.5;
        height = pow(height, 0.8); // Adjust curve

        // Base sky color
        vec3 skyColor = mix(horizonColor, zenithColor, height);

        // Sun glow
        float sunDot = max(0.0, dot(direction, normalize(sunDirection)));
        float sunGlow = pow(sunDot, 32.0);
        float sunHalo = pow(sunDot, 4.0) * 0.3;
        skyColor += sunColor * (sunGlow + sunHalo);

        // Volumetric clouds
        vec3 cloudPos = direction * 2.0 + vec3(time * 0.01, 0.0, time * 0.005);
        float clouds = snoise(cloudPos * 2.0) * 0.5 + 0.5;
        clouds += snoise(cloudPos * 4.0) * 0.25;
        clouds = smoothstep(0.4, 0.8, clouds);

        // Only show clouds near horizon
        float cloudMask = 1.0 - smoothstep(0.1, 0.6, height);
        clouds *= cloudMask * 0.4;

        skyColor = mix(skyColor, vec3(1.0), clouds);

        // Subtle color banding (NMS style)
        float bands = sin(height * 20.0 + time * 0.1) * 0.02;
        skyColor += bands;

        gl_FragColor = vec4(skyColor, 1.0);
      }
    `;

    // Determine if this is an NMS theme
    const isNMS = theme.name?.includes('Lush') || theme.name?.includes('Toxic') ||
                  theme.name?.includes('Frozen') || theme.name?.includes('Scorched') ||
                  theme.name?.includes('Exotic') || theme.name?.includes('Crimson');

    const horizonColor = isNMS
      ? new THREE.Color(...theme.fogColor)
      : new THREE.Color(...theme.fogColor).multiplyScalar(2);

    const zenithColor = isNMS
      ? new THREE.Color(
          theme.primaryColor[0] * 0.3,
          theme.primaryColor[1] * 0.3,
          theme.primaryColor[2] * 0.5
        )
      : new THREE.Color(...theme.primaryColor).multiplyScalar(0.3);

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        horizonColor: { value: horizonColor },
        zenithColor: { value: zenithColor },
        sunColor: { value: new THREE.Color(...theme.accentColor) },
        sunDirection: { value: new THREE.Vector3(0.5, 0.3, -0.8).normalize() },
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
      <sphereGeometry args={[500, 64, 64]} />
    </mesh>
  );
};

/**
 * Alien Ground/Terrain
 */
const AlienGround: React.FC<{ theme: WorldTheme }> = ({ theme }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => {
    const groundColor = new THREE.Color(...theme.fogColor).multiplyScalar(0.5);
    const accentColor = new THREE.Color(...theme.primaryColor);

    return new THREE.MeshStandardMaterial({
      color: groundColor,
      roughness: 0.9,
      metalness: 0.1,
    });
  }, [theme]);

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <circleGeometry args={[200, 64]} />
      <primitive object={material} attach="material" />
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
  nmsStyle = true, // Default to NMS style now
}) => {
  // Determine if this is an NMS theme
  const isNMSTheme = theme.name?.includes('Lush') || theme.name?.includes('Toxic') ||
                     theme.name?.includes('Frozen') || theme.name?.includes('Scorched') ||
                     theme.name?.includes('Exotic') || theme.name?.includes('Crimson') ||
                     theme.name?.includes('Paradise') || theme.name?.includes('Moon') ||
                     theme.name?.includes('Planet') || theme.name?.includes('Anomaly') ||
                     nmsStyle;

  return (
    <group name="environment">
      {/* NMS-style skybox or original */}
      {isNMSTheme ? <NMSSkybox theme={theme} /> : <Skybox theme={theme} />}

      {/* Planet in the sky for NMS themes */}
      {isNMSTheme && (
        <>
          <AlienPlanet theme={theme} position={[250, 120, -350]} size={100} />
          <AlienPlanet
            theme={{
              ...theme,
              primaryColor: [theme.accentColor[0], theme.accentColor[1], theme.accentColor[2]],
              secondaryColor: theme.primaryColor,
            }}
            position={[-180, 80, -280]}
            size={40}
          />
        </>
      )}

      {/* Stars in the distance - more visible for NMS */}
      <Stars
        radius={300}
        depth={50}
        count={isNMSTheme ? 3000 : 5000}
        factor={isNMSTheme ? 6 : 4}
        saturation={isNMSTheme ? 0.8 : 0.5}
        fade
        speed={0.3}
      />

      {/* Sparkles for extra magic */}
      <Sparkles
        count={isNMSTheme ? 150 : 100}
        size={isNMSTheme ? 3 : 2}
        speed={0.3}
        opacity={0.5}
        color={new THREE.Color(...theme.primaryColor)}
        scale={[200, 100, 200]}
      />

      <Sparkles
        count={isNMSTheme ? 120 : 80}
        size={isNMSTheme ? 2.5 : 1.5}
        speed={0.4}
        opacity={0.4}
        color={new THREE.Color(...theme.secondaryColor)}
        scale={[180, 90, 180]}
      />

      {/* Alien Flora for NMS themes */}
      {isNMSTheme && <AlienFlora theme={theme} count={100} radius={60} />}

      {/* Alien Ground for NMS themes */}
      {isNMSTheme && <AlienGround theme={theme} />}

      {/* Grid floor - hidden for NMS themes */}
      {showGrid && !isNMSTheme && <GridFloor theme={theme} />}

      {/* Ambient particles */}
      {enableParticles && <AmbientParticles theme={theme} />}

      {/* Volumetric fog - adjusted for NMS */}
      {enableFog && <VolumetricFog theme={theme} />}

      {/* Sun light for NMS themes */}
      {isNMSTheme && (
        <directionalLight
          position={[100, 60, -150]}
          intensity={1.5}
          color={new THREE.Color(...theme.accentColor)}
          castShadow
        />
      )}

      {/* Ambient energy glow at origin */}
      <pointLight
        position={[0, 5, 0]}
        intensity={isNMSTheme ? 1 : 2}
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

      {/* Additional ambient for NMS */}
      {isNMSTheme && (
        <>
          <hemisphereLight
            color={new THREE.Color(...theme.primaryColor)}
            groundColor={new THREE.Color(...theme.fogColor)}
            intensity={0.5}
          />
          <ambientLight intensity={0.3} color={new THREE.Color(...theme.fogColor)} />
        </>
      )}
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
