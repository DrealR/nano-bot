/**
 * App Component - ENHANCED GAME VERSION
 *
 * Main application with:
 * - Game over/victory screens
 * - Player command controls
 * - Base health display
 * - Restart functionality
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

// Import components
import { Scene } from './Scene';
import { HUD } from '@ui';

// Import hooks and store
import { useStore } from './store/useStore';
import { useKeyboardControls, useSimulationStats } from './hooks/useSimulation';
import { getGameState, resetGame, setPlayerCommand } from './hooks/useGameplay';
import { NanoBot, NanoBotState } from '@core';

// Personalities for bots
const PERSONALITIES = ['aggressive', 'defensive', 'builder', 'defensive', 'aggressive'] as const;

// Import styles
import './App.css';

export const App: React.FC = () => {
  // Get state from store
  const addBot = useStore((state) => state.addBot);
  const resetSimulation = useStore((state) => state.resetSimulation);
  const initializeHiveMind = useStore((state) => state.initializeHiveMind);
  const initializeBotSwarm = useStore((state) => state.initializeBotSwarm);

  // Get simulation stats
  const stats = useSimulationStats();
  const isPaused = useStore((state) => state.isPaused);

  // Gameplay state (polled from game state)
  const [gameplayStats, setGameplayStats] = useState({
    score: 0,
    wave: 1,
    enemyCount: 0,
    resourceCount: 0,
    baseHealth: 1000,
    maxBaseHealth: 1000,
    gameStatus: 'playing' as 'playing' | 'paused' | 'won' | 'lost',
    comboMultiplier: 1,
    waveEnemiesRemaining: 0,
    waveCountdown: 0,
  });

  const [playerCommand, setPlayerCommandState] = useState<'defend' | 'gather' | 'attack' | null>(null);

  // Poll game state for HUD updates
  useEffect(() => {
    const interval = setInterval(() => {
      const gameState = getGameState();
      setGameplayStats({
        score: Math.floor(gameState.score),
        wave: gameState.wave,
        enemyCount: gameState.enemies.size,
        resourceCount: gameState.resources.size,
        baseHealth: gameState.baseHealth,
        maxBaseHealth: gameState.maxBaseHealth,
        gameStatus: gameState.gameStatus,
        comboMultiplier: gameState.comboMultiplier,
        waveEnemiesRemaining: gameState.waveEnemiesRemaining,
        waveCountdown: gameState.waveCountdown,
      });
    }, 50); // Update 20 times per second for smoother feedback

    return () => clearInterval(interval);
  }, []);

  // Setup keyboard controls
  useKeyboardControls();

  // Create initial bots
  const createInitialBots = useCallback(() => {
    // Check if API key is available
    const apiKey = import.meta.env.VITE_GROQ_API_KEY ||
                   import.meta.env.VITE_OPENROUTER_API_KEY ||
                   import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('⚠️  No API key found. Bots will have limited AI capabilities.');
    }

    // Create 5 initial bots - more defenders to start
    const positions = [
      { x: 0, y: 2, z: 2 },
      { x: 2, y: 2, z: 0 },
      { x: -2, y: 2, z: 0 },
      { x: 0, y: 2, z: -2 },
      { x: 3, y: 2, z: 3 },
    ];

    positions.forEach((pos, index) => {
      try {
        const bot = new NanoBot({
          id: `bot-${Date.now()}-${index}`,
          position: pos,
          energy: 600 + Math.random() * 200,
          generation: 0,
          parentId: null,
          state: NanoBotState.IDLE,
          aiProvider: 'groq',
          apiKey: apiKey || '',
          model: 'mixtral-8x7b-32768',
          maxClones: 3,
          activeClones: 0,
          theme: 'cyberpunk',
          name: `NanoBot-${PERSONALITIES[index]}-${index + 1}`,
          personality: PERSONALITIES[index],
        });

        addBot(bot);
      } catch (error) {
        console.error(`Failed to create bot ${index}:`, error);
      }
    });
  }, [addBot]);

  // Handle player command changes
  const handleCommandChange = useCallback((command: 'defend' | 'gather' | 'attack' | null) => {
    setPlayerCommandState(command);
    setPlayerCommand(command);
  }, []);

  // Handle game restart
  const handleRestart = useCallback(() => {
    resetSimulation();
    resetGame();
    setTimeout(() => {
      createInitialBots();
    }, 100);
  }, [resetSimulation, createInitialBots]);

  // Initialize the application
  useEffect(() => {
    initializeHiveMind();
    initializeBotSwarm();
    createInitialBots();

    console.log('🤖 NanoBot Defense initialized');
    console.log('Controls:');
    console.log('  SPACE - Pause/Resume');
    console.log('  1 - Defend command');
    console.log('  2 - Gather command');
    console.log('  3 - Attack command');
    console.log('  R - Replicate selected bot');
    console.log('  Click - Spawn new bot');
  }, []);

  // Add command keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case '1':
          handleCommandChange(playerCommand === 'defend' ? null : 'defend');
          break;
        case '2':
          handleCommandChange(playerCommand === 'gather' ? null : 'gather');
          break;
        case '3':
          handleCommandChange(playerCommand === 'attack' ? null : 'attack');
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerCommand, handleCommandChange]);

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
        <HUD
          swarmCount={stats.botCount}
          totalEnergy={stats.totalEnergy}
          activeTasks={stats.activeTasks}
          fps={stats.fps}
          timestamp={Date.now()}
          isPaused={isPaused}
          score={gameplayStats.score}
          wave={gameplayStats.wave}
          enemyCount={gameplayStats.enemyCount}
          resourceCount={gameplayStats.resourceCount}
          baseHealth={gameplayStats.baseHealth}
          maxBaseHealth={gameplayStats.maxBaseHealth}
          comboMultiplier={gameplayStats.comboMultiplier}
          waveEnemiesRemaining={gameplayStats.waveEnemiesRemaining}
          waveCountdown={gameplayStats.waveCountdown}
        />

        {/* Command Buttons */}
        <div style={styles.commandPanel}>
          <div style={styles.commandTitle}>COMMANDS (1-2-3)</div>
          <button
            style={{
              ...styles.commandButton,
              ...(playerCommand === 'defend' ? styles.commandActive : {}),
              borderColor: '#4dabf7',
            }}
            onClick={() => handleCommandChange(playerCommand === 'defend' ? null : 'defend')}
          >
            <span style={styles.commandKey}>1</span>
            <span>DEFEND</span>
          </button>
          <button
            style={{
              ...styles.commandButton,
              ...(playerCommand === 'gather' ? styles.commandActive : {}),
              borderColor: '#51cf66',
            }}
            onClick={() => handleCommandChange(playerCommand === 'gather' ? null : 'gather')}
          >
            <span style={styles.commandKey}>2</span>
            <span>GATHER</span>
          </button>
          <button
            style={{
              ...styles.commandButton,
              ...(playerCommand === 'attack' ? styles.commandActive : {}),
              borderColor: '#ff6b6b',
            }}
            onClick={() => handleCommandChange(playerCommand === 'attack' ? null : 'attack')}
          >
            <span style={styles.commandKey}>3</span>
            <span>ATTACK</span>
          </button>
        </div>

        {/* Game Over Screen */}
        {gameplayStats.gameStatus === 'lost' && (
          <div style={styles.gameOverOverlay}>
            <div style={styles.gameOverPanel}>
              <div style={styles.gameOverTitle}>GAME OVER</div>
              <div style={styles.gameOverSubtitle}>Base Destroyed</div>
              <div style={styles.gameOverStats}>
                <div>Wave Reached: <span style={styles.statValue}>{gameplayStats.wave}</span></div>
                <div>Final Score: <span style={styles.statValue}>{gameplayStats.score.toLocaleString()}</span></div>
              </div>
              <button style={styles.restartButton} onClick={handleRestart}>
                RESTART
              </button>
            </div>
          </div>
        )}

        {/* Victory Screen */}
        {gameplayStats.gameStatus === 'won' && (
          <div style={styles.victoryOverlay}>
            <div style={styles.victoryPanel}>
              <div style={styles.victoryTitle}>VICTORY!</div>
              <div style={styles.victorySubtitle}>All Waves Survived</div>
              <div style={styles.gameOverStats}>
                <div>Final Score: <span style={styles.statValue}>{gameplayStats.score.toLocaleString()}</span></div>
                <div>Base Health: <span style={styles.statValue}>{Math.floor(gameplayStats.baseHealth)}</span></div>
              </div>
              <button style={styles.restartButton} onClick={handleRestart}>
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  commandPanel: {
    position: 'absolute',
    left: 20,
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 12,
    background: 'rgba(0, 0, 0, 0.7)',
    border: '1px solid rgba(0, 255, 255, 0.3)',
    borderRadius: 8,
  },
  commandTitle: {
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: 4,
  },
  commandButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: 'rgba(0, 0, 0, 0.5)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    color: 'white',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    transition: 'all 0.2s',
  },
  commandActive: {
    background: 'rgba(0, 255, 255, 0.2)',
    boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)',
  },
  commandKey: {
    display: 'inline-block',
    width: 20,
    height: 20,
    lineHeight: '20px',
    textAlign: 'center',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    fontSize: 11,
  },
  gameOverOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  gameOverPanel: {
    padding: 40,
    background: 'linear-gradient(135deg, rgba(255, 0, 0, 0.1), rgba(0, 0, 0, 0.9))',
    border: '2px solid #ff3366',
    borderRadius: 12,
    textAlign: 'center',
    boxShadow: '0 0 50px rgba(255, 51, 102, 0.3)',
  },
  gameOverTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ff3366',
    letterSpacing: 8,
    textShadow: '0 0 30px rgba(255, 51, 102, 0.8)',
    marginBottom: 10,
  },
  gameOverSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 30,
  },
  gameOverStats: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 30,
    lineHeight: 2,
  },
  statValue: {
    color: '#00ffff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  restartButton: {
    padding: '15px 40px',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 3,
    color: 'white',
    background: 'linear-gradient(135deg, #ff3366, #ff6b6b)',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 0 20px rgba(255, 51, 102, 0.5)',
  },
  victoryOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  victoryPanel: {
    padding: 40,
    background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(0, 0, 0, 0.9))',
    border: '2px solid #00ffff',
    borderRadius: 12,
    textAlign: 'center',
    boxShadow: '0 0 50px rgba(0, 255, 255, 0.3)',
  },
  victoryTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00ffff',
    letterSpacing: 8,
    textShadow: '0 0 30px rgba(0, 255, 255, 0.8)',
    marginBottom: 10,
  },
  victorySubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 30,
  },
};

export default App;
