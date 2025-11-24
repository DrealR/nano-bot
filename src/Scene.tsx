/**
 * Scene Component
 *
 * Main 3D scene component that contains all visual elements:
 * - VoxelWorld
 * - NanoBotSwarm
 * - Environment (skybox, fog, particles)
 * - ReplicationEffects
 * - Lighting setup
 * - Post-processing effects
 */

import React, { Suspense, useMemo } from 'react';
import { OrbitControls, PerspectiveCamera, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import { EffectComposer, Bloom, SSAO } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// Import world components
import { VoxelWorld, NanoBotSwarm, Environment, ReplicationEffect } from '@world';
import type { BotData } from '@world/NanoBotSwarm';

// Import store
import { useStore } from './store/useStore';
import { useSimulation } from './hooks/useSimulation';

// Loading fallback
const LoadingBox: React.FC = () => {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#00ffff" wireframe />
    </mesh>
  );
};

/**
 * Main Scene Component
 */
export const Scene: React.FC = () => {
  // Get state from store
  const bots = useStore((state) => state.bots);
  const selectedBotId = useStore((state) => state.selectedBotId);
  const worldTheme = useStore((state) => state.worldTheme);
  const showGrid = useStore((state) => state.showGrid);
  const enableFog = useStore((state) => state.enableFog);
  const enableParticles = useStore((state) => state.enableParticles);
  const showConnections = useStore((state) => state.showConnections);
  const activeReplicationEvents = useStore((state) => state.activeReplicationEvents);
  const selectBot = useStore((state) => state.selectBot);

  // Initialize simulation
  useSimulation({
    thinkInterval: 3000,
    energyRegenerationRate: 5,
    autoReplicationThreshold: 850,
    enableAutoReplication: false,
  });

  // Convert bots to BotData format for rendering
  const botDataList: BotData[] = useMemo(() => {
    return Array.from(bots.values()).map((bot) => ({
      id: bot.id,
      position: [bot.position.x, bot.position.y, bot.position.z] as [number, number, number],
      state: bot.state as any,
      energy: bot.energy,
      isSelected: bot.id === selectedBotId,
      velocity: [bot.velocity.x, bot.velocity.y, bot.velocity.z] as [number, number, number],
    }));
  }, [bots, selectedBotId]);

  // Handle bot click
  const handleBotClick = (botId: string) => {
    selectBot(selectedBotId === botId ? null : botId);
  };

  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[20, 15, 20]} fov={60} />

      {/* Camera Controls */}
      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        minDistance={5}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2 - 0.1}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        panSpeed={0.5}
        zoomSpeed={0.8}
      />

      {/* Adaptive Performance */}
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      {/* Lighting */}
      <ambientLight intensity={0.3} color={new THREE.Color(...worldTheme.fogColor)} />

      {/* Main directional light */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.0}
        color={new THREE.Color(...worldTheme.primaryColor)}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Secondary fill light */}
      <directionalLight
        position={[-10, 15, -10]}
        intensity={0.5}
        color={new THREE.Color(...worldTheme.secondaryColor)}
      />

      {/* Accent light from below */}
      <pointLight
        position={[0, -5, 0]}
        intensity={0.8}
        distance={50}
        color={new THREE.Color(...worldTheme.accentColor)}
        decay={2}
      />

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
          chunkSize={16}
          renderDistance={3}
          theme={worldTheme}
          seed={12345}
          enableShadows={true}
        />
      </Suspense>

      {/* NanoBot Swarm */}
      <Suspense fallback={null}>
        <NanoBotSwarm
          bots={botDataList}
          showConnections={showConnections}
          connectionDistance={5}
          maxConnections={3}
        />
      </Suspense>

      {/* Replication Effects */}
      {activeReplicationEvents.map((event) => (
        <ReplicationEffect
          key={event.timestamp}
          parentPosition={event.parentPosition}
          childPosition={event.childPosition}
          color={`#${worldTheme.primaryColor.map(c => Math.floor(c * 255).toString(16).padStart(2, '0')).join('')}`}
          duration={3.0}
          onComplete={() => {
            // Event cleanup is handled in store
          }}
        />
      ))}

      {/* Post Processing Effects */}
      <EffectComposer>
        {/* Bloom for glowing effects */}
        <Bloom
          intensity={0.5}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          height={300}
          blendFunction={BlendFunction.SCREEN}
        />

        {/* SSAO for depth and ambient occlusion */}
        <SSAO
          intensity={20}
          radius={0.1}
          luminanceInfluence={0.5}
          blendFunction={BlendFunction.MULTIPLY}
        />
      </EffectComposer>
    </>
  );
};

export default Scene;
