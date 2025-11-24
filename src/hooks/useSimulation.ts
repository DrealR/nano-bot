/**
 * useSimulation Hook
 *
 * Custom React hook that manages the NanoBot simulation loop.
 * Updates all bots each frame, handles AI thinking intervals,
 * manages energy regeneration, and triggers auto-replication.
 */

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../store/useStore';
import type { NanoBotState } from '@core/types';

interface SimulationConfig {
  thinkInterval?: number; // How often bots should think (ms)
  energyRegenerationRate?: number; // Energy per second when idle
  autoReplicationThreshold?: number; // Energy threshold for auto-replication
  enableAutoReplication?: boolean;
}

export const useSimulation = (config: SimulationConfig = {}) => {
  const {
    thinkInterval = 2000, // Think every 2 seconds
    energyRegenerationRate = 5, // 5 energy per second
    autoReplicationThreshold = 800, // Auto-replicate at 80% energy
    enableAutoReplication = false,
  } = config;

  const isPaused = useStore((state) => state.isPaused);
  const simulationSpeed = useStore((state) => state.simulationSpeed);
  const bots = useStore((state) => state.bots);
  const updateBot = useStore((state) => state.updateBot);
  const updateTotalEnergy = useStore((state) => state.updateTotalEnergy);
  const updateFPS = useStore((state) => state.updateFPS);
  const triggerReplication = useStore((state) => state.triggerReplication);

  const lastThinkTimeRef = useRef<Map<string, number>>(new Map());
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const frameCountRef = useRef<number>(0);
  const lastFPSUpdateRef = useRef<number>(Date.now());

  // Main simulation loop (runs every frame in React Three Fiber)
  useFrame((state, delta) => {
    if (isPaused) return;

    const now = Date.now();
    const adjustedDelta = delta * simulationSpeed;

    // Update frame count for FPS calculation
    frameCountRef.current++;
    if (now - lastFPSUpdateRef.current >= 1000) {
      updateFPS(frameCountRef.current);
      frameCountRef.current = 0;
      lastFPSUpdateRef.current = now;
    }

    // Update each bot
    bots.forEach((botData, botId) => {
      const bot = botData.instance;
      if (!bot) return;

      // Update bot physics and state
      try {
        bot.update(adjustedDelta);

        // Energy regeneration for idle bots
        if (bot.state === 'idle' && bot.energy < 1000) {
          const energyGain = energyRegenerationRate * adjustedDelta;
          bot.energy = Math.min(1000, bot.energy + energyGain);
        }

        // Energy drain for working bots
        if (bot.state === 'working') {
          const energyDrain = 2 * adjustedDelta;
          bot.energy = Math.max(0, bot.energy - energyDrain);
        }

        // Update store with bot changes
        updateBot(botId, {
          position: bot.position,
          velocity: bot.velocity,
          state: bot.state,
          energy: bot.energy,
          health: bot.health,
        });

        // AI thinking interval
        const lastThink = lastThinkTimeRef.current.get(botId) || 0;
        if (now - lastThink >= thinkInterval) {
          lastThinkTimeRef.current.set(botId, now);

          // Trigger bot thinking (async)
          bot.think()
            .catch((error) => {
              console.error(`Bot ${botId} thinking error:`, error);
            });
        }

        // Auto-replication check
        if (
          enableAutoReplication &&
          bot.energy >= autoReplicationThreshold &&
          bot.state === 'idle' &&
          bot.generation < 5 // Limit generation depth
        ) {
          // Random chance to replicate (10% per check)
          if (Math.random() < 0.1) {
            triggerReplication(botId);
          }
        }

        // Health regeneration when idle
        if (bot.state === 'idle' && bot.health < 100) {
          bot.health = Math.min(100, bot.health + 2 * adjustedDelta);
        }

        // Low energy behavior
        if (bot.energy < 100 && bot.state !== 'idle') {
          bot.state = 'idle'; // Force idle when low on energy
        }

      } catch (error) {
        console.error(`Error updating bot ${botId}:`, error);
      }
    });

    // Update total energy
    updateTotalEnergy();

    lastUpdateTimeRef.current = now;
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      lastThinkTimeRef.current.clear();
    };
  }, []);

  return {
    isRunning: !isPaused,
    botCount: bots.size,
    simulationSpeed,
  };
};

/**
 * Hook for getting simulation statistics
 */
export const useSimulationStats = () => {
  const bots = useStore((state) => state.bots);
  const totalEnergy = useStore((state) => state.totalEnergy);
  const fps = useStore((state) => state.fps);

  // Calculate state distribution
  const stateDistribution = {
    idle: 0,
    working: 0,
    learning: 0,
    replicating: 0,
    merging: 0,
    exploring: 0,
  };

  let totalHealth = 0;
  let generationSum = 0;
  let maxGeneration = 0;

  bots.forEach((bot) => {
    stateDistribution[bot.state as keyof typeof stateDistribution]++;
    totalHealth += bot.health;
    generationSum += bot.generation;
    maxGeneration = Math.max(maxGeneration, bot.generation);
  });

  const botCount = bots.size;

  return {
    botCount,
    totalEnergy,
    averageEnergy: botCount > 0 ? totalEnergy / botCount : 0,
    averageHealth: botCount > 0 ? totalHealth / botCount : 0,
    averageGeneration: botCount > 0 ? generationSum / botCount : 0,
    maxGeneration,
    stateDistribution,
    fps,
    activeTasks: stateDistribution.working + stateDistribution.learning,
  };
};

/**
 * Hook for keyboard controls
 */
export const useKeyboardControls = () => {
  const togglePause = useStore((state) => state.togglePause);
  const setSimulationSpeed = useStore((state) => state.setSimulationSpeed);
  const simulationSpeed = useStore((state) => state.simulationSpeed);
  const selectedBotId = useStore((state) => state.selectedBotId);
  const triggerReplication = useStore((state) => state.triggerReplication);
  const toggleGrid = useStore((state) => state.toggleGrid);
  const toggleFog = useStore((state) => state.toggleFog);
  const toggleParticles = useStore((state) => state.toggleParticles);
  const toggleConnections = useStore((state) => state.toggleConnections);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case ' ':
          event.preventDefault();
          togglePause();
          break;

        case 'r':
          if (selectedBotId) {
            event.preventDefault();
            triggerReplication(selectedBotId);
          }
          break;

        case '+':
        case '=':
          event.preventDefault();
          setSimulationSpeed(simulationSpeed + 0.1);
          break;

        case '-':
        case '_':
          event.preventDefault();
          setSimulationSpeed(simulationSpeed - 0.1);
          break;

        case 'g':
          event.preventDefault();
          toggleGrid();
          break;

        case 'f':
          event.preventDefault();
          toggleFog();
          break;

        case 'p':
          event.preventDefault();
          toggleParticles();
          break;

        case 'c':
          event.preventDefault();
          toggleConnections();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    togglePause,
    setSimulationSpeed,
    simulationSpeed,
    selectedBotId,
    triggerReplication,
    toggleGrid,
    toggleFog,
    toggleParticles,
    toggleConnections,
  ]);
};
