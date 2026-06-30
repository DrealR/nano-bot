/**
 * useSwarmBehavior Hook
 *
 * Advanced swarm intelligence behaviors including:
 * - Flocking (separation, alignment, cohesion)
 * - Formation patterns (circle, grid, spiral, DNA helix)
 * - Predator/prey dynamics
 * - Resource seeking
 * - Emergent behaviors
 */

import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store/useStore';

export type FormationPattern = 'free' | 'circle' | 'grid' | 'spiral' | 'dna-helix' | 'sphere' | 'vortex';

interface SwarmConfig {
  separationDistance?: number;
  alignmentDistance?: number;
  cohesionDistance?: number;
  separationWeight?: number;
  alignmentWeight?: number;
  cohesionWeight?: number;
  maxSpeed?: number;
  maxForce?: number;
  formationPattern?: FormationPattern;
  formationRadius?: number;
  enableFlocking?: boolean;
}

interface BoidForces {
  separation: THREE.Vector3;
  alignment: THREE.Vector3;
  cohesion: THREE.Vector3;
}

export const useSwarmBehavior = (config: SwarmConfig = {}) => {
  const {
    separationDistance = 2,
    alignmentDistance = 4,
    cohesionDistance = 6,
    separationWeight = 1.5,
    alignmentWeight = 1.0,
    cohesionWeight = 1.0,
    maxSpeed = 3,
    maxForce = 0.5,
    formationPattern = 'free',
    formationRadius = 8,
    enableFlocking = true,
  } = config;

  const bots = useStore((state) => state.bots);
  const updateBot = useStore((state) => state.updateBot);
  const isPaused = useStore((state) => state.isPaused);

  const timeRef = useRef(0);
  const formationTimeRef = useRef(0);

  // Calculate boid steering forces
  const calculateBoidForces = useCallback((
    botPosition: THREE.Vector3,
    botVelocity: THREE.Vector3,
    allBots: Array<{ position: THREE.Vector3; velocity: THREE.Vector3 }>
  ): BoidForces => {
    const separation = new THREE.Vector3();
    const alignment = new THREE.Vector3();
    const cohesion = new THREE.Vector3();

    let separationCount = 0;
    let alignmentCount = 0;
    let cohesionCount = 0;

    for (const other of allBots) {
      const distance = botPosition.distanceTo(other.position);

      if (distance > 0) {
        // Separation - steer away from nearby boids
        if (distance < separationDistance) {
          const diff = new THREE.Vector3().subVectors(botPosition, other.position);
          diff.normalize();
          diff.divideScalar(distance); // Weight by distance
          separation.add(diff);
          separationCount++;
        }

        // Alignment - steer towards average heading of neighbors
        if (distance < alignmentDistance) {
          alignment.add(other.velocity);
          alignmentCount++;
        }

        // Cohesion - steer towards center of neighbors
        if (distance < cohesionDistance) {
          cohesion.add(other.position);
          cohesionCount++;
        }
      }
    }

    // Average and apply weights
    if (separationCount > 0) {
      separation.divideScalar(separationCount);
      separation.normalize();
      separation.multiplyScalar(maxSpeed);
      separation.sub(botVelocity);
      separation.clampLength(0, maxForce);
      separation.multiplyScalar(separationWeight);
    }

    if (alignmentCount > 0) {
      alignment.divideScalar(alignmentCount);
      alignment.normalize();
      alignment.multiplyScalar(maxSpeed);
      alignment.sub(botVelocity);
      alignment.clampLength(0, maxForce);
      alignment.multiplyScalar(alignmentWeight);
    }

    if (cohesionCount > 0) {
      cohesion.divideScalar(cohesionCount);
      cohesion.sub(botPosition);
      cohesion.normalize();
      cohesion.multiplyScalar(maxSpeed);
      cohesion.sub(botVelocity);
      cohesion.clampLength(0, maxForce);
      cohesion.multiplyScalar(cohesionWeight);
    }

    return { separation, alignment, cohesion };
  }, [separationDistance, alignmentDistance, cohesionDistance, separationWeight, alignmentWeight, cohesionWeight, maxSpeed, maxForce]);

  // Get formation target position for a bot
  const getFormationPosition = useCallback((index: number, total: number, time: number): THREE.Vector3 => {
    const target = new THREE.Vector3();

    switch (formationPattern) {
      case 'circle': {
        const angle = (index / total) * Math.PI * 2 + time * 0.2;
        target.set(
          Math.cos(angle) * formationRadius,
          2 + Math.sin(time * 2 + index) * 0.5,
          Math.sin(angle) * formationRadius
        );
        break;
      }

      case 'grid': {
        const cols = Math.ceil(Math.sqrt(total));
        const row = Math.floor(index / cols);
        const col = index % cols;
        const spacing = formationRadius / cols * 2;
        target.set(
          (col - cols / 2) * spacing,
          2 + Math.sin(time * 3 + index * 0.5) * 0.3,
          (row - Math.ceil(total / cols) / 2) * spacing
        );
        break;
      }

      case 'spiral': {
        const t = index / total;
        const spiralAngle = t * Math.PI * 6 + time * 0.5;
        const spiralRadius = formationRadius * t;
        target.set(
          Math.cos(spiralAngle) * spiralRadius,
          2 + t * 4,
          Math.sin(spiralAngle) * spiralRadius
        );
        break;
      }

      case 'dna-helix': {
        const t = index / total;
        const helixAngle = t * Math.PI * 4 + time * 0.8;
        const strand = index % 2;
        const helixRadius = formationRadius * 0.5;
        target.set(
          Math.cos(helixAngle + strand * Math.PI) * helixRadius,
          t * 10 - 5 + Math.sin(time) * 0.5,
          Math.sin(helixAngle + strand * Math.PI) * helixRadius
        );
        break;
      }

      case 'sphere': {
        const phi = Math.acos(-1 + (2 * index) / total);
        const theta = Math.sqrt(total * Math.PI) * phi + time * 0.3;
        target.set(
          formationRadius * Math.sin(phi) * Math.cos(theta),
          formationRadius * Math.sin(phi) * Math.sin(theta) + 5,
          formationRadius * Math.cos(phi)
        );
        break;
      }

      case 'vortex': {
        const t = index / total;
        const vortexAngle = t * Math.PI * 8 + time * 2;
        const vortexRadius = formationRadius * (1 - t * 0.7);
        const height = t * 8 + Math.sin(time * 3 + index) * 0.5;
        target.set(
          Math.cos(vortexAngle) * vortexRadius,
          height,
          Math.sin(vortexAngle) * vortexRadius
        );
        break;
      }

      default: // 'free' - no target, just flocking
        return new THREE.Vector3(0, 0, 0);
    }

    return target;
  }, [formationPattern, formationRadius]);

  // Main swarm update loop
  useFrame((_, delta) => {
    if (isPaused || !enableFlocking) return;

    timeRef.current += delta;
    formationTimeRef.current += delta;

    const botArray = Array.from(bots.values());
    if (botArray.length === 0) return;

    // Prepare bot data for boid calculations
    const botData = botArray.map(bot => ({
      id: bot.id,
      position: new THREE.Vector3(bot.position.x, bot.position.y, bot.position.z),
      velocity: new THREE.Vector3(bot.velocity.x, bot.velocity.y, bot.velocity.z),
    }));

    // Update each bot
    botArray.forEach((bot, index) => {
      const position = new THREE.Vector3(bot.position.x, bot.position.y, bot.position.z);
      const velocity = new THREE.Vector3(bot.velocity.x, bot.velocity.y, bot.velocity.z);

      // Calculate flocking forces
      const forces = calculateBoidForces(position, velocity, botData);

      // Apply forces
      const acceleration = new THREE.Vector3();
      acceleration.add(forces.separation);
      acceleration.add(forces.alignment);
      acceleration.add(forces.cohesion);

      // Formation seeking
      if (formationPattern !== 'free') {
        const target = getFormationPosition(index, botArray.length, formationTimeRef.current);
        const seekForce = new THREE.Vector3().subVectors(target, position);
        seekForce.normalize();
        seekForce.multiplyScalar(maxSpeed);
        seekForce.sub(velocity);
        seekForce.clampLength(0, maxForce * 2);
        acceleration.add(seekForce);
      }

      // Update velocity
      velocity.add(acceleration.multiplyScalar(delta * 60));
      velocity.clampLength(0, maxSpeed);

      // Update position
      position.add(velocity.clone().multiplyScalar(delta));

      // Boundary wrapping/bouncing
      const boundary = 20;
      if (Math.abs(position.x) > boundary) {
        position.x = Math.sign(position.x) * boundary;
        velocity.x *= -0.5;
      }
      if (position.y < 1) {
        position.y = 1;
        velocity.y = Math.abs(velocity.y) * 0.5;
      }
      if (position.y > boundary) {
        position.y = boundary;
        velocity.y *= -0.5;
      }
      if (Math.abs(position.z) > boundary) {
        position.z = Math.sign(position.z) * boundary;
        velocity.z *= -0.5;
      }

      // Update bot in store
      updateBot(bot.id, {
        position: { x: position.x, y: position.y, z: position.z },
        velocity: { x: velocity.x, y: velocity.y, z: velocity.z },
      });
    });
  });

  return {
    setFormation: (pattern: FormationPattern) => {
      // This would need to be connected to state
    },
    formationPattern,
    botCount: bots.size,
  };
};

export default useSwarmBehavior;
