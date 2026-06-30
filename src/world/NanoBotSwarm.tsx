import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import NanoBot3D, { BotState } from './NanoBot3D';
import {
  connectionLineVertexShader,
  connectionLineFragmentShader,
} from '@shaders/index';

export interface BotData {
  id: string;
  position: [number, number, number];
  state: BotState;
  color?: string;
  energy?: number;
  isSelected?: boolean;
  velocity?: [number, number, number];
}

export interface NanoBotSwarmProps {
  bots: BotData[];
  showConnections?: boolean;
  connectionDistance?: number;
  maxConnections?: number;
}

interface Connection {
  fromIndex: number;
  toIndex: number;
  distance: number;
}

export const NanoBotSwarm: React.FC<NanoBotSwarmProps> = ({
  bots,
  showConnections = true,
  connectionDistance = 3,
  maxConnections = 3,
}) => {
  const connectionsRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  // Calculate connections between nearby bots
  const connections = useMemo(() => {
    const conns: Connection[] = [];

    for (let i = 0; i < bots.length; i++) {
      const bot1 = bots[i];
      const pos1 = new THREE.Vector3(...bot1.position);
      const botConnections: Connection[] = [];

      for (let j = i + 1; j < bots.length; j++) {
        const bot2 = bots[j];
        const pos2 = new THREE.Vector3(...bot2.position);
        const distance = pos1.distanceTo(pos2);

        if (distance < connectionDistance) {
          botConnections.push({
            fromIndex: i,
            toIndex: j,
            distance,
          });
        }
      }

      // Sort by distance and take only the closest maxConnections
      botConnections.sort((a, b) => a.distance - b.distance);
      conns.push(...botConnections.slice(0, maxConnections));
    }

    return conns;
  }, [bots, connectionDistance, maxConnections]);

  // Create connection line geometries and materials
  const connectionElements = useMemo(() => {
    return connections.map((conn, index) => {
      const bot1 = bots[conn.fromIndex];
      const bot2 = bots[conn.toIndex];

      const start = new THREE.Vector3(...bot1.position);
      const end = new THREE.Vector3(...bot2.position);

      // Create curve for the connection line
      const midPoint = new THREE.Vector3().lerpVectors(start, end, 0.5);
      const direction = new THREE.Vector3().subVectors(end, start);
      const perpendicular = new THREE.Vector3(-direction.y, direction.x, 0).normalize();
      const curve = new THREE.QuadraticBezierCurve3(
        start,
        midPoint.add(perpendicular.multiplyScalar(conn.distance * 0.1)),
        end
      );

      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      // Add progress attribute for shader animation
      const progresses = new Float32Array(points.length);
      for (let i = 0; i < points.length; i++) {
        progresses[i] = i / (points.length - 1);
      }
      geometry.setAttribute('progress', new THREE.BufferAttribute(progresses, 1));

      // Color based on bot states
      const color1 = new THREE.Color(bot1.color || '#00ffff');
      const color2 = new THREE.Color(bot2.color || '#00ffff');
      const avgColor = new THREE.Color().lerpColors(color1, color2, 0.5);

      const material = new THREE.ShaderMaterial({
        vertexShader: connectionLineVertexShader,
        fragmentShader: connectionLineFragmentShader,
        uniforms: {
          time: { value: 0 },
          color: { value: avgColor },
          opacity: { value: 0.4 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      return { geometry, material, key: `${conn.fromIndex}-${conn.toIndex}` };
    });
  }, [connections, bots]);

  // Data flow particles along connections
  const dataFlowParticles = useMemo(() => {
    const particlesPerConnection = 5;
    const totalParticles = connections.length * particlesPerConnection;

    if (totalParticles === 0) return null;

    const positions = new Float32Array(totalParticles * 3);
    const sizes = new Float32Array(totalParticles);
    const colors = new Float32Array(totalParticles * 3);
    const alphas = new Float32Array(totalParticles);
    const progresses = new Float32Array(totalParticles);

    let particleIndex = 0;

    connections.forEach((conn) => {
      const bot1 = bots[conn.fromIndex];
      const bot2 = bots[conn.toIndex];
      const color = new THREE.Color(bot1.color || '#00ffff');

      for (let i = 0; i < particlesPerConnection; i++) {
        const idx = particleIndex * 3;
        const progress = i / particlesPerConnection;

        // Initial position along the line
        const start = new THREE.Vector3(...bot1.position);
        const end = new THREE.Vector3(...bot2.position);
        const pos = new THREE.Vector3().lerpVectors(start, end, progress);

        positions[idx] = pos.x;
        positions[idx + 1] = pos.y;
        positions[idx + 2] = pos.z;

        sizes[particleIndex] = 0.08;
        colors[idx] = color.r;
        colors[idx + 1] = color.g;
        colors[idx + 2] = color.b;
        alphas[particleIndex] = 0.8;
        progresses[particleIndex] = progress;

        particleIndex++;
      }
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    geometry.setAttribute('progress', new THREE.BufferAttribute(progresses, 1));

    return geometry;
  }, [connections, bots]);

  const dataFlowMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `
          attribute float size;
          attribute vec3 customColor;
          attribute float alpha;
          attribute float progress;

          varying vec3 vColor;
          varying float vAlpha;

          void main() {
            vColor = customColor;
            vAlpha = alpha;

            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying float vAlpha;

          void main() {
            vec2 center = gl_PointCoord - vec2(0.5);
            float dist = length(center);

            if (dist > 0.5) discard;

            float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
            float glow = 1.0 - smoothstep(0.0, 0.5, dist);
            vec3 color = vColor * (1.0 + glow);

            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  const dataFlowRef = useRef<THREE.Points>(null);

  // Animation loop
  useFrame((state, delta) => {
    timeRef.current += delta;

    // Update connection materials
    if (connectionsRef.current) {
      connectionsRef.current.children.forEach((child) => {
        if (child instanceof THREE.Line) {
          const material = child.material as THREE.ShaderMaterial;
          if (material.uniforms && material.uniforms.time) {
            material.uniforms.time.value = timeRef.current;
          }
        }
      });
    }

    // Animate data flow particles
    if (dataFlowRef.current && dataFlowParticles) {
      const positions = dataFlowParticles.attributes.position.array as Float32Array;
      const progresses = dataFlowParticles.attributes.progress.array as Float32Array;
      const alphas = dataFlowParticles.attributes.alpha.array as Float32Array;

      const particlesPerConnection = 5;
      let particleIndex = 0;

      connections.forEach((conn) => {
        const bot1 = bots[conn.fromIndex];
        const bot2 = bots[conn.toIndex];
        const start = new THREE.Vector3(...bot1.position);
        const end = new THREE.Vector3(...bot2.position);

        for (let i = 0; i < particlesPerConnection; i++) {
          const idx = particleIndex * 3;

          // Update progress
          progresses[particleIndex] = (progresses[particleIndex] + delta * 0.3) % 1.0;
          const progress = progresses[particleIndex];

          // Create curved path
          const midPoint = new THREE.Vector3().lerpVectors(start, end, 0.5);
          const direction = new THREE.Vector3().subVectors(end, start);
          const perpendicular = new THREE.Vector3(-direction.y, direction.x, 0)
            .normalize()
            .multiplyScalar(conn.distance * 0.1);

          // Quadratic bezier interpolation
          const p1 = start;
          const p2 = midPoint.add(perpendicular);
          const p3 = end;

          const t = progress;
          const mt = 1 - t;
          const mt2 = mt * mt;
          const t2 = t * t;

          const pos = new THREE.Vector3(
            mt2 * p1.x + 2 * mt * t * p2.x + t2 * p3.x,
            mt2 * p1.y + 2 * mt * t * p2.y + t2 * p3.y,
            mt2 * p1.z + 2 * mt * t * p2.z + t2 * p3.z
          );

          positions[idx] = pos.x;
          positions[idx + 1] = pos.y;
          positions[idx + 2] = pos.z;

          // Pulse alpha
          alphas[particleIndex] = 0.5 + Math.sin(timeRef.current * 5 + progress * 10) * 0.3;

          particleIndex++;
        }
      });

      dataFlowParticles.attributes.position.needsUpdate = true;
      dataFlowParticles.attributes.progress.needsUpdate = true;
      dataFlowParticles.attributes.alpha.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Render all bots */}
      {bots.map((bot) => (
        <NanoBot3D
          key={bot.id}
          position={bot.position}
          state={bot.state}
          color={bot.color}
          energy={bot.energy}
          isSelected={bot.isSelected}
          velocity={bot.velocity}
        />
      ))}

      {/* Render connections */}
      {showConnections && (
        <group ref={connectionsRef}>
          {connectionElements.map(({ geometry, material, key }) => (
            <primitive key={key} object={new THREE.Line(geometry, material)} />
          ))}
        </group>
      )}

      {/* Data flow particles */}
      {showConnections && dataFlowParticles && (
        <points
          ref={dataFlowRef}
          geometry={dataFlowParticles}
          material={dataFlowMaterial}
        />
      )}
    </group>
  );
};

export default NanoBotSwarm;
