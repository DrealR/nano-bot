/**
 * VoxelWorld - Main voxel world component with chunk-based loading
 * Stunning cyberpunk 3D environment with procedural generation
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Chunk } from './Chunk';
import { WorldGenerator, type ChunkData, type WorldTheme } from './WorldGenerator';
import { Environment } from './Environment';

export interface VoxelWorldProps {
  worldSize?: number;        // Number of chunks to render in each direction
  seed?: number;              // Seed for procedural generation
  theme?: string;             // Theme name: 'cyberpunk', 'neon', 'matrix'
  renderDistance?: number;    // How far to render chunks
  enableFog?: boolean;        // Enable atmospheric fog
  enableParticles?: boolean;  // Enable ambient particles
  showGrid?: boolean;         // Show grid floor
  onChunkLoad?: (chunk: ChunkData) => void;
}

interface ChunkKey {
  x: number;
  y: number;
  z: number;
}

function chunkKeyToString(key: ChunkKey): string {
  return `${key.x},${key.y},${key.z}`;
}

function stringToChunkKey(str: string): ChunkKey {
  const [x, y, z] = str.split(',').map(Number);
  return { x, y, z };
}

/**
 * VoxelWorld - Beautiful cyberpunk voxel environment
 */
export const VoxelWorld: React.FC<VoxelWorldProps> = ({
  worldSize = 4,
  seed = Date.now(),
  theme = 'cyberpunk',
  renderDistance = 3,
  enableFog = true,
  enableParticles = true,
  showGrid = true,
  onChunkLoad,
}) => {
  const { camera } = useThree();

  // World generator instance
  const generator = useMemo(() => {
    return new WorldGenerator(seed, 16, theme);
  }, [seed, theme]);

  // Loaded chunks
  const [chunks, setChunks] = useState<Map<string, ChunkData>>(new Map());
  const [visibleChunks, setVisibleChunks] = useState<Set<string>>(new Set());

  // World theme
  const worldTheme = useMemo(() => generator.getTheme(), [generator]);

  // Get camera chunk position
  const getCameraChunkPosition = useCallback((): ChunkKey => {
    const chunkSize = generator.getChunkSize();
    return {
      x: Math.floor(camera.position.x / chunkSize),
      y: Math.floor(camera.position.y / chunkSize),
      z: Math.floor(camera.position.z / chunkSize),
    };
  }, [camera, generator]);

  // Load chunk at position
  const loadChunk = useCallback((chunkKey: ChunkKey) => {
    const key = chunkKeyToString(chunkKey);

    setChunks((prev) => {
      if (prev.has(key)) return prev;

      const chunkData = generator.generateChunk(chunkKey.x, chunkKey.y, chunkKey.z);

      if (onChunkLoad) {
        onChunkLoad(chunkData);
      }

      const newChunks = new Map(prev);
      newChunks.set(key, chunkData);
      return newChunks;
    });
  }, [generator, onChunkLoad]);

  // Unload chunk at position
  const unloadChunk = useCallback((key: string) => {
    setChunks((prev) => {
      const newChunks = new Map(prev);
      newChunks.delete(key);
      return newChunks;
    });
  }, []);

  // Update visible chunks based on camera position
  const updateVisibleChunks = useCallback(() => {
    const cameraChunk = getCameraChunkPosition();
    const newVisibleChunks = new Set<string>();
    const chunksToLoad: ChunkKey[] = [];

    // Calculate which chunks should be visible
    for (let x = cameraChunk.x - renderDistance; x <= cameraChunk.x + renderDistance; x++) {
      for (let z = cameraChunk.z - renderDistance; z <= cameraChunk.z + renderDistance; z++) {
        for (let y = cameraChunk.y - 2; y <= cameraChunk.y + 2; y++) {
          // Limit world size
          if (Math.abs(x) <= worldSize && Math.abs(z) <= worldSize && y >= -2 && y <= 3) {
            const chunkKey = { x, y, z };
            const key = chunkKeyToString(chunkKey);

            // Calculate distance for frustum culling
            const chunkSize = generator.getChunkSize();
            const chunkWorldPos = new THREE.Vector3(
              x * chunkSize + chunkSize / 2,
              y * chunkSize + chunkSize / 2,
              z * chunkSize + chunkSize / 2
            );
            const distance = camera.position.distanceTo(chunkWorldPos);

            // Only include chunks within render distance
            if (distance < renderDistance * chunkSize) {
              newVisibleChunks.add(key);

              // Queue chunk for loading if not already loaded
              if (!chunks.has(key)) {
                chunksToLoad.push(chunkKey);
              }
            }
          }
        }
      }
    }

    // Load new chunks
    chunksToLoad.forEach(loadChunk);

    // Unload far chunks
    const chunksToUnload: string[] = [];
    chunks.forEach((_, key) => {
      if (!newVisibleChunks.has(key)) {
        const chunkKey = stringToChunkKey(key);
        const chunkSize = generator.getChunkSize();
        const chunkWorldPos = new THREE.Vector3(
          chunkKey.x * chunkSize,
          chunkKey.y * chunkSize,
          chunkKey.z * chunkSize
        );
        const distance = camera.position.distanceTo(chunkWorldPos);

        // Unload if very far away
        if (distance > (renderDistance + 2) * chunkSize) {
          chunksToUnload.push(key);
        }
      }
    });

    chunksToUnload.forEach(unloadChunk);

    setVisibleChunks(newVisibleChunks);
  }, [camera, renderDistance, worldSize, generator, chunks, getCameraChunkPosition, loadChunk, unloadChunk]);

  // Initial chunk loading
  useEffect(() => {
    updateVisibleChunks();
  }, [updateVisibleChunks]);

  // Update visible chunks periodically
  useFrame((_, delta) => {
    // Update every 0.5 seconds
    const updateInterval = 0.5;
    if (!VoxelWorld.lastUpdate) VoxelWorld.lastUpdate = 0;
    VoxelWorld.lastUpdate += delta;

    if (VoxelWorld.lastUpdate >= updateInterval) {
      updateVisibleChunks();
      VoxelWorld.lastUpdate = 0;
    }
  });

  // Render chunks
  const chunkElements = useMemo(() => {
    const elements: JSX.Element[] = [];

    chunks.forEach((chunkData, key) => {
      const visible = visibleChunks.has(key);

      elements.push(
        <Chunk
          key={key}
          position={chunkData.position}
          voxelData={chunkData}
          visible={visible}
          theme={{
            primaryColor: worldTheme.primaryColor,
            secondaryColor: worldTheme.secondaryColor,
            fogColor: worldTheme.fogColor,
          }}
        />
      );
    });

    return elements;
  }, [chunks, visibleChunks, worldTheme]);

  return (
    <>
      {/* Environment effects */}
      <Environment
        theme={worldTheme}
        enableFog={enableFog}
        enableParticles={enableParticles}
        showGrid={showGrid}
      />

      {/* Chunks */}
      <group name="voxel-world">
        {chunkElements}
      </group>

      {/* Ambient lighting */}
      <ambientLight intensity={0.3} color={new THREE.Color(...worldTheme.primaryColor)} />

      {/* Directional sun light */}
      <directionalLight
        position={[50, 100, 50]}
        intensity={0.8}
        color={new THREE.Color(1.0, 0.95, 0.8)}
        castShadow={false}
      />

      {/* Fill light from below (cyberpunk aesthetic) */}
      <directionalLight
        position={[0, -50, 0]}
        intensity={0.3}
        color={new THREE.Color(...worldTheme.secondaryColor)}
        castShadow={false}
      />

      {/* Accent rim light */}
      <directionalLight
        position={[-50, 20, -50]}
        intensity={0.4}
        color={new THREE.Color(...worldTheme.accentColor)}
        castShadow={false}
      />

      {/* Hemisphere light for ambient color variation */}
      <hemisphereLight
        color={new THREE.Color(...worldTheme.primaryColor)}
        groundColor={new THREE.Color(...worldTheme.fogColor)}
        intensity={0.5}
      />

      {/* Point lights for dramatic effect */}
      <pointLight
        position={[0, 20, 0]}
        intensity={1.5}
        distance={100}
        color={new THREE.Color(...worldTheme.primaryColor)}
        decay={2}
      />

      <pointLight
        position={[30, 10, 30]}
        intensity={1.0}
        distance={80}
        color={new THREE.Color(...worldTheme.secondaryColor)}
        decay={2}
      />

      <pointLight
        position={[-30, 10, -30]}
        intensity={1.0}
        distance={80}
        color={new THREE.Color(...worldTheme.accentColor)}
        decay={2}
      />
    </>
  );
};

// Static property to track last update time
VoxelWorld.lastUpdate = 0 as number;

declare module 'react' {
  interface FunctionComponent {
    lastUpdate?: number;
  }
}

export default VoxelWorld;
