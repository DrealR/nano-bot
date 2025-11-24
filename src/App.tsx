/**
 * App Component
 *
 * Main application component that ties everything together.
 * Manages the overall layout with 3D Canvas and 2D UI overlays.
 */

import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

// Import components
import { Scene } from './Scene';
import {
  HUD,
  BotStatusPanel,
  SwarmStats,
  ControlPanel,
  Minimap,
} from '@ui';

// Import hooks and store
import { useStore } from './store/useStore';
import { useKeyboardControls, useSimulationStats } from './hooks/useSimulation';
import { NanoBot } from '@core';

// Import styles
import './App.css';

export const App: React.FC = () => {
  // Get state from store
  const selectedBotId = useStore((state) => state.selectedBotId);
  const selectedBot = useStore((state) =>
    selectedBotId ? state.bots.get(selectedBotId) : undefined
  );
  const showBotStatusPanel = useStore((state) => state.showBotStatusPanel);
  const showSwarmStats = useStore((state) => state.showSwarmStats);
  const showControlPanel = useStore((state) => state.showControlPanel);
  const showMinimap = useStore((state) => state.showMinimap);
  const addBot = useStore((state) => state.addBot);
  const initializeHiveMind = useStore((state) => state.initializeHiveMind);
  const initializeBotSwarm = useStore((state) => state.initializeBotSwarm);

  // Get simulation stats
  const stats = useSimulationStats();

  // Setup keyboard controls
  useKeyboardControls();

  // Initialize the application
  useEffect(() => {
    // Initialize HiveMind and BotSwarm
    initializeHiveMind();
    initializeBotSwarm();

    // Create initial bots
    createInitialBots();

    // Log startup
    console.log('🤖 NanoBot Framework initialized');
    console.log('Controls:');
    console.log('  SPACE - Pause/Resume simulation');
    console.log('  R - Replicate selected bot');
    console.log('  +/- - Adjust simulation speed');
    console.log('  G - Toggle grid');
    console.log('  F - Toggle fog');
    console.log('  P - Toggle particles');
    console.log('  C - Toggle connections');
  }, []);

  // Create initial bots
  const createInitialBots = () => {
    // Check if API key is available
    const apiKey = import.meta.env.VITE_GROQ_API_KEY ||
                   import.meta.env.VITE_OPENROUTER_API_KEY ||
                   import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('⚠️  No API key found. Bots will have limited AI capabilities.');
      console.warn('Set VITE_GROQ_API_KEY, VITE_OPENROUTER_API_KEY, or VITE_GEMINI_API_KEY in .env');
    }

    // Create 3 initial bots in different positions
    const positions = [
      { x: 0, y: 2, z: 0 },
      { x: 3, y: 2, z: 3 },
      { x: -3, y: 2, z: -3 },
    ];

    positions.forEach((pos, index) => {
      try {
        const bot = new NanoBot({
          id: `bot-${Date.now()}-${index}`,
          position: pos,
          energy: 500,
          generation: 0,
          parentId: null,
          state: 'idle',
          aiProvider: 'groq',
          apiKey: apiKey || '',
          model: 'mixtral-8x7b-32768',
          maxClones: 5,
          activeClones: 0,
          theme: 'cyberpunk',
          name: `NanoBot-${index + 1}`,
        });

        addBot(bot);
      } catch (error) {
        console.error(`Failed to create bot ${index}:`, error);
      }
    });
  };

  return (
    <div className="app">
      {/* 3D Canvas */}
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>

      {/* 2D UI Overlays */}
      <div className="ui-overlay">
        {/* HUD - Always visible */}
        <HUD
          swarmCount={stats.botCount}
          totalEnergy={stats.totalEnergy}
          activeTasks={stats.activeTasks}
          fps={stats.fps}
          timestamp={Date.now()}
        />

        {/* Bot Status Panel - Shows when bot is selected */}
        {showBotStatusPanel && selectedBot && (
          <BotStatusPanel
            botId={selectedBot.id}
            position={selectedBot.position}
            velocity={selectedBot.velocity}
            state={selectedBot.state}
            energy={selectedBot.energy}
            health={selectedBot.health}
            generation={selectedBot.generation}
            parentId={selectedBot.parentId}
            skills={Array.from(selectedBot.instance?.skills.values() || [])}
            memory={selectedBot.instance?.memory}
            onClose={() => useStore.getState().selectBot(null)}
          />
        )}

        {/* Swarm Stats */}
        {showSwarmStats && (
          <SwarmStats
            totalBots={stats.botCount}
            totalEnergy={stats.totalEnergy}
            averageEnergy={stats.averageEnergy}
            averageHealth={stats.averageHealth}
            stateDistribution={stats.stateDistribution}
            maxGeneration={stats.maxGeneration}
          />
        )}

        {/* Control Panel */}
        {showControlPanel && (
          <ControlPanel
            isPaused={useStore.getState().isPaused}
            simulationSpeed={useStore.getState().simulationSpeed}
            onTogglePause={() => useStore.getState().togglePause()}
            onSpeedChange={(speed) => useStore.getState().setSimulationSpeed(speed)}
            onReset={() => {
              useStore.getState().resetSimulation();
              createInitialBots();
            }}
            onAddBot={() => {
              const randomPos = {
                x: (Math.random() - 0.5) * 10,
                y: 2,
                z: (Math.random() - 0.5) * 10,
              };
              const apiKey = import.meta.env.VITE_GROQ_API_KEY || '';
              const bot = new NanoBot({
                id: `bot-${Date.now()}`,
                position: randomPos,
                energy: 500,
                generation: 0,
                parentId: null,
                state: 'idle',
                aiProvider: 'groq',
                apiKey,
                model: 'mixtral-8x7b-32768',
                maxClones: 5,
                activeClones: 0,
                theme: 'cyberpunk',
                name: `NanoBot-${stats.botCount + 1}`,
              });
              addBot(bot);
            }}
            worldSettings={{
              showGrid: useStore.getState().showGrid,
              enableFog: useStore.getState().enableFog,
              enableParticles: useStore.getState().enableParticles,
              showConnections: useStore.getState().showConnections,
            }}
            onToggleGrid={() => useStore.getState().toggleGrid()}
            onToggleFog={() => useStore.getState().toggleFog()}
            onToggleParticles={() => useStore.getState().toggleParticles()}
            onToggleConnections={() => useStore.getState().toggleConnections()}
          />
        )}

        {/* Minimap */}
        {showMinimap && (
          <Minimap
            bots={Array.from(useStore.getState().bots.values()).map(bot => ({
              id: bot.id,
              position: bot.position,
              state: bot.state,
              isSelected: bot.id === selectedBotId,
            }))}
            worldSize={64}
            onBotClick={(id) => useStore.getState().selectBot(id)}
          />
        )}
      </div>
    </div>
  );
};

export default App;
