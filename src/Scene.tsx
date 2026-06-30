/**
 * Scene Component
 *
 * Main 3D scene with full gameplay:
 * - NanoBot swarm with AI behaviors
 * - Resource nodes to gather
 * - Enemy bots to fight
 * - Wave-based survival
 */

import React, { Suspense, useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, AdaptiveDpr, AdaptiveEvents, Stars, Float, Text } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// Import world components
import { VoxelWorld, NanoBotSwarm, Environment, ReplicationEffect, ResourceNode, EnemyBot, DamageNumber, Projectile, Explosion } from '@world';
import type { BotData } from '@world/NanoBotSwarm';

// Import store and hooks
import { useStore } from './store/useStore';
import { useSimulation } from './hooks/useSimulation';
import { useGameplay, getGameState } from './hooks/useGameplay';
import type { DamageNumber as DamageNumberType, Projectile as ProjectileType, Explosion as ExplosionType } from './hooks/useGameplay';
import { NanoBot, NanoBotState } from '@core';

// Loading fallback
const LoadingBox: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });
  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#00ffff" wireframe emissive="#00ffff" emissiveIntensity={0.5} />
    </mesh>
  );
};

// Click plane for spawning and rally points
const ClickPlane: React.FC<{
  onSpawn: (position: THREE.Vector3) => void;
  onRallyPoint: (position: [number, number, number]) => void;
  shiftHeld: boolean;
}> = ({ onSpawn, onRallyPoint, shiftHeld }) => {
  const handleClick = useCallback((event: any) => {
    event.stopPropagation();
    if (event.point) {
      if (shiftHeld) {
        // Set rally point
        onRallyPoint([event.point.x, 1.5, event.point.z]);
      } else {
        // Spawn bot
        const spawnPos = new THREE.Vector3(event.point.x, Math.max(2, event.point.y + 1), event.point.z);
        onSpawn(spawnPos);
      }
    }
  }, [onSpawn, onRallyPoint, shiftHeld]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} onClick={handleClick} visible={false}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
};

// Rally Point Marker
const RallyPointMarker: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const markerRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (markerRef.current) {
      markerRef.current.rotation.y += delta * 2;
      markerRef.current.position.y = position[1] + Math.sin(timeRef.current * 3) * 0.2;
    }
  });

  return (
    <group ref={markerRef} position={position}>
      {/* Beacon */}
      <mesh>
        <coneGeometry args={[0.5, 1.5, 4]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.7} />
      </mesh>
      {/* Inner glow */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
      {/* Ground ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
        <ringGeometry args={[1, 1.3, 32]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* Light */}
      <pointLight color="#00ffff" intensity={3} distance={10} decay={2} />
    </group>
  );
};

// Base/Nexus at center
const Nexus: React.FC<{ health: number; maxHealth: number }> = ({ health, maxHealth }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  const healthPercent = health / maxHealth;

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.position.y = 1.5 + Math.sin(timeRef.current) * 0.1;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.5;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Base platform */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[3, 3.5, 0.2, 32]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Core */}
      <mesh ref={meshRef} position={[0, 1.5, 0]}>
        <dodecahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={healthPercent}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Energy ring */}
      <mesh ref={ringRef} position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.05, 8, 32]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.6 * healthPercent} />
      </mesh>

      {/* Health indicator */}
      <mesh position={[0, 3, 0]}>
        <boxGeometry args={[2, 0.15, 0.15]} />
        <meshBasicMaterial color="#333" transparent opacity={0.7} />
      </mesh>
      <mesh position={[(healthPercent - 1), 3, 0.01]}>
        <boxGeometry args={[1.95 * healthPercent, 0.12, 0.12]} />
        <meshBasicMaterial color={healthPercent > 0.5 ? '#00ff88' : healthPercent > 0.25 ? '#ffaa00' : '#ff0044'} />
      </mesh>

      {/* Glow */}
      <pointLight color="#00ffff" intensity={2 * healthPercent} distance={15} />
    </group>
  );
};

// Wave announcement
const WaveAnnouncement: React.FC<{ wave: number }> = ({ wave }) => {
  const [visible, setVisible] = useState(false);
  const [lastWave, setLastWave] = useState(wave);

  useEffect(() => {
    if (wave !== lastWave) {
      setVisible(true);
      setLastWave(wave);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [wave, lastWave]);

  if (!visible) return null;

  return (
    <Float speed={2} floatIntensity={0.5}>
      <Text
        position={[0, 8, 0]}
        fontSize={1.5}
        color="#ff0044"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {`WAVE ${wave}`}
      </Text>
    </Float>
  );
};

/**
 * Main Scene Component
 */
export const Scene: React.FC = () => {
  // Store state
  const bots = useStore((state) => state.bots);
  const selectedBotId = useStore((state) => state.selectedBotId);
  const worldTheme = useStore((state) => state.worldTheme);
  const showGrid = useStore((state) => state.showGrid);
  const enableFog = useStore((state) => state.enableFog);
  const enableParticles = useStore((state) => state.enableParticles);
  const showConnections = useStore((state) => state.showConnections);
  const activeReplicationEvents = useStore((state) => state.activeReplicationEvents);
  const addBot = useStore((state) => state.addBot);

  // Gameplay state
  const { resources, enemies, damageNumbers, projectiles, explosions, score, wave, baseHealth, screenShake, rallyPoint, setRallyPoint } = useGameplay();
  const [resourcesArray, setResourcesArray] = useState<any[]>([]);
  const [enemiesArray, setEnemiesArray] = useState<any[]>([]);
  const [damageNumbersArray, setDamageNumbersArray] = useState<DamageNumberType[]>([]);
  const [projectilesArray, setProjectilesArray] = useState<ProjectileType[]>([]);
  const [explosionsArray, setExplosionsArray] = useState<ExplosionType[]>([]);

  // Camera shake ref
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const baseCameraPos = useRef(new THREE.Vector3(30, 22, 30));

  // Track shift key for rally point placement
  const [shiftHeld, setShiftHeld] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftHeld(true);
      if (e.key === 'Escape') setRallyPoint(null); // Clear rally point with Escape
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftHeld(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setRallyPoint]);

  // Update arrays for rendering and camera shake
  useFrame(() => {
    const gameState = getGameState();
    setResourcesArray(Array.from(gameState.resources.values()));
    setEnemiesArray(Array.from(gameState.enemies.values()));
    setDamageNumbersArray([...gameState.damageNumbers]);
    setProjectilesArray([...gameState.projectiles]);
    setExplosionsArray([...gameState.explosions]);

    // Camera shake effect
    if (cameraRef.current && gameState.screenShake > 0) {
      const shake = gameState.screenShake;
      cameraRef.current.position.x = baseCameraPos.current.x + (Math.random() - 0.5) * shake * 0.5;
      cameraRef.current.position.y = baseCameraPos.current.y + (Math.random() - 0.5) * shake * 0.3;
      cameraRef.current.position.z = baseCameraPos.current.z + (Math.random() - 0.5) * shake * 0.5;
    } else if (cameraRef.current) {
      cameraRef.current.position.copy(baseCameraPos.current);
    }
  });

  // Initialize simulation
  useSimulation({
    thinkInterval: 2000,
    energyRegenerationRate: 3,
    autoReplicationThreshold: 950,
    enableAutoReplication: true,
  });

  // Personality options
  const personalities = ['aggressive', 'defensive', 'explorer', 'builder', 'social'] as const;

  // Spawn new bot
  const spawnBot = useCallback((position: THREE.Vector3) => {
    const personality = personalities[Math.floor(Math.random() * personalities.length)];
    const apiKey = import.meta.env.VITE_GROQ_API_KEY ||
                   import.meta.env.VITE_OPENROUTER_API_KEY ||
                   import.meta.env.VITE_GEMINI_API_KEY || '';

    try {
      const bot = new NanoBot({
        id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        position: { x: position.x, y: position.y, z: position.z },
        energy: 400 + Math.random() * 300,
        generation: 0,
        parentId: null,
        state: NanoBotState.IDLE,
        aiProvider: 'groq',
        apiKey,
        model: 'mixtral-8x7b-32768',
        maxClones: 5,
        activeClones: 0,
        theme: 'cyberpunk',
        name: `NanoBot-${personality}-${Date.now()}`,
        personality: personality,
      });

      addBot(bot);
      console.log(`Spawned ${personality} bot at`, position);
    } catch (error) {
      console.error('Failed to spawn bot:', error);
    }
  }, [addBot]);

  // Convert bots to render format
  const botDataList: BotData[] = useMemo(() => {
    return Array.from(bots.values()).map((bot) => ({
      id: bot.id,
      position: [bot.position.x, bot.position.y, bot.position.z] as [number, number, number],
      state: bot.state,
      energy: bot.energy / 1000,
      isSelected: bot.id === selectedBotId,
      velocity: [bot.velocity.x, bot.velocity.y, bot.velocity.z] as [number, number, number],
      personality: (bot as any).personality,
      generation: bot.generation,
    }));
  }, [bots, selectedBotId]);

  // Theme colors
  const primaryColor = useMemo(() => new THREE.Color(...worldTheme.primaryColor), [worldTheme]);
  const secondaryColor = useMemo(() => new THREE.Color(...worldTheme.secondaryColor), [worldTheme]);
  const accentColor = useMemo(() => new THREE.Color(...worldTheme.accentColor), [worldTheme]);

  return (
    <>
      {/* Camera */}
      <PerspectiveCamera ref={cameraRef} makeDefault position={[30, 22, 30]} fov={55} />

      {/* Controls */}
      <OrbitControls
        makeDefault
        target={[0, 3, 0]}
        minDistance={10}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2 - 0.05}
        enableDamping
        dampingFactor={0.05}
      />

      {/* Performance */}
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      {/* Starfield */}
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0.5} fade speed={0.3} />

      {/* Lighting */}
      <ambientLight intensity={0.35} color="#ffffff" />
      <directionalLight
        position={[20, 30, 20]}
        intensity={1.0}
        color={primaryColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-15, 20, -15]} intensity={0.5} color={secondaryColor} />
      <pointLight position={[0, -3, 0]} intensity={0.8} distance={40} color={accentColor} decay={2} />

      {/* Click to spawn or set rally point (Shift+Click) */}
      <ClickPlane onSpawn={spawnBot} onRallyPoint={setRallyPoint} shiftHeld={shiftHeld} />

      {/* Rally Point Marker */}
      {rallyPoint && <RallyPointMarker position={rallyPoint} />}

      {/* Central Nexus/Base */}
      <Nexus health={baseHealth} maxHealth={1000} />

      {/* Wave Announcement */}
      <WaveAnnouncement wave={wave} />

      {/* Resource Nodes */}
      {resourcesArray.map((resource) => (
        <ResourceNode
          key={resource.id}
          id={resource.id}
          position={resource.position}
          type={resource.type}
          amount={resource.amount}
          maxAmount={resource.maxAmount}
        />
      ))}

      {/* Enemy Bots */}
      {enemiesArray.map((enemy) => (
        <EnemyBot
          key={enemy.id}
          id={enemy.id}
          position={enemy.position}
          health={enemy.health}
          maxHealth={enemy.maxHealth}
          state={enemy.state}
          targetPosition={enemy.targetBotId ? undefined : enemy.patrolTarget}
          enemyType={enemy.type}
          isBoss={enemy.isBoss}
          color={enemy.color}
        />
      ))}

      {/* Combat Effects - Damage Numbers */}
      {damageNumbersArray.map((dmg) => (
        <DamageNumber
          key={dmg.id}
          position={dmg.position}
          damage={dmg.damage}
          isHeal={dmg.isHeal}
          isCrit={dmg.isCrit}
          createdAt={dmg.createdAt}
        />
      ))}

      {/* Combat Effects - Projectiles */}
      {projectilesArray.map((proj) => (
        <Projectile
          key={proj.id}
          id={proj.id}
          from={proj.from}
          to={proj.to}
          createdAt={proj.createdAt}
          isBotAttack={proj.isBotAttack}
        />
      ))}

      {/* Combat Effects - Explosions */}
      {explosionsArray.map((exp) => (
        <Explosion
          key={exp.id}
          position={exp.position}
          createdAt={exp.createdAt}
          isBoss={exp.isBoss}
          color={exp.color}
        />
      ))}

      {/* Environment */}
      <Suspense fallback={null}>
        <Environment
          theme={worldTheme}
          enableFog={enableFog}
          enableParticles={enableParticles}
          showGrid={showGrid}
        />
      </Suspense>

      {/* Voxel World */}
      <Suspense fallback={<LoadingBox />}>
        <VoxelWorld
          renderDistance={2}
          theme={worldTheme.name || 'cyberpunk'}
          seed={12345}
          enableFog={enableFog}
          enableParticles={enableParticles}
          showGrid={showGrid}
        />
      </Suspense>

      {/* NanoBot Swarm */}
      <Suspense fallback={null}>
        <NanoBotSwarm
          bots={botDataList}
          showConnections={showConnections}
          connectionDistance={6}
          maxConnections={4}
        />
      </Suspense>

      {/* Replication Effects */}
      {activeReplicationEvents.map((event) => (
        <ReplicationEffect
          key={event.timestamp}
          parentPosition={event.parentPosition}
          childPosition={event.childPosition}
          color={`#${worldTheme.primaryColor.map(c => Math.floor(c * 255).toString(16).padStart(2, '0')).join('')}`}
          duration={2.5}
          onComplete={() => {}}
        />
      ))}

      {/* Post Processing */}
      <EffectComposer>
        <Bloom
          intensity={0.7}
          luminanceThreshold={0.4}
          luminanceSmoothing={0.9}
          height={400}
          blendFunction={BlendFunction.SCREEN}
        />
        <ChromaticAberration
          offset={new THREE.Vector2(0.0003, 0.0003)}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0.0}
        />
        <Vignette offset={0.3} darkness={0.5} blendFunction={BlendFunction.NORMAL} />
      </EffectComposer>
    </>
  );
};

export default Scene;
