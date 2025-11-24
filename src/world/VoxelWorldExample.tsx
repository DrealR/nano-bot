/**
 * VoxelWorldExample - Demo of the stunning voxel world
 * Shows how to use the VoxelWorld component with different themes
 */

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { VoxelWorld } from './VoxelWorld';
import { NanoBotSwarm } from './NanoBotSwarm';

export const VoxelWorldExample: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas>
        <Suspense fallback={null}>
          {/* Camera */}
          <PerspectiveCamera makeDefault position={[0, 20, 50]} fov={75} />

          {/* Camera controls */}
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            rotateSpeed={0.5}
            zoomSpeed={0.8}
            minDistance={10}
            maxDistance={200}
            maxPolarAngle={Math.PI / 2}
          />

          {/* Stunning Voxel World */}
          <VoxelWorld
            worldSize={4}
            seed={12345}
            theme="cyberpunk"
            renderDistance={3}
            enableFog={true}
            enableParticles={true}
            showGrid={true}
            onChunkLoad={(chunk) => {
              console.log(`Loaded chunk at ${chunk.position.join(', ')}`);
            }}
          />

          {/* Optional: Add NanoBots flying around the world */}
          <NanoBotSwarm
            botCount={20}
            swarmRadius={30}
            connectionDistance={15}
            moveSpeed={2}
          />
        </Suspense>
      </Canvas>

      {/* UI Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          color: '#00FF41',
          fontFamily: 'monospace',
          fontSize: '14px',
          pointerEvents: 'none',
          textShadow: '0 0 10px rgba(0, 255, 65, 0.8)',
        }}
      >
        <div>NanoBot Framework - Voxel World</div>
        <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.8 }}>
          WASD + Mouse: Navigate
        </div>
      </div>
    </div>
  );
};

/**
 * Example with theme switcher
 */
export const VoxelWorldThemeExample: React.FC = () => {
  const [theme, setTheme] = React.useState<string>('cyberpunk');
  const [seed, setSeed] = React.useState<number>(Date.now());

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 20, 50]} fov={75} />

          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            rotateSpeed={0.5}
            zoomSpeed={0.8}
            minDistance={10}
            maxDistance={200}
          />

          <VoxelWorld
            worldSize={4}
            seed={seed}
            theme={theme}
            renderDistance={3}
            enableFog={true}
            enableParticles={true}
            showGrid={true}
          />
        </Suspense>
      </Canvas>

      {/* Theme Switcher UI */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          color: '#00FF41',
          fontFamily: 'monospace',
          fontSize: '14px',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '20px',
          borderRadius: '5px',
          border: '1px solid #00FF41',
          boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)',
        }}
      >
        <div style={{ marginBottom: '15px', fontWeight: 'bold' }}>Theme</div>
        <button
          onClick={() => setTheme('cyberpunk')}
          style={{
            display: 'block',
            width: '100%',
            marginBottom: '8px',
            padding: '8px',
            background: theme === 'cyberpunk' ? '#00FF41' : 'transparent',
            color: theme === 'cyberpunk' ? '#000' : '#00FF41',
            border: '1px solid #00FF41',
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
        >
          Cyberpunk
        </button>
        <button
          onClick={() => setTheme('neon')}
          style={{
            display: 'block',
            width: '100%',
            marginBottom: '8px',
            padding: '8px',
            background: theme === 'neon' ? '#FF0080' : 'transparent',
            color: theme === 'neon' ? '#000' : '#FF0080',
            border: '1px solid #FF0080',
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
        >
          Neon Dreams
        </button>
        <button
          onClick={() => setTheme('matrix')}
          style={{
            display: 'block',
            width: '100%',
            marginBottom: '15px',
            padding: '8px',
            background: theme === 'matrix' ? '#00FF41' : 'transparent',
            color: theme === 'matrix' ? '#000' : '#00FF41',
            border: '1px solid #00FF41',
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
        >
          Matrix
        </button>
        <button
          onClick={() => setSeed(Date.now())}
          style={{
            display: 'block',
            width: '100%',
            padding: '8px',
            background: 'transparent',
            color: '#FFF',
            border: '1px solid #FFF',
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
        >
          Regenerate World
        </button>
      </div>
    </div>
  );
};

export default VoxelWorldExample;
