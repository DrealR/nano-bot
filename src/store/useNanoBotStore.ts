/**
 * Central Zustand State Store for NanoBot Framework
 *
 * This store manages all application state including:
 * - Bot data and lifecycle
 * - Swarm statistics
 * - World configuration
 * - Simulation controls
 * - Visual effects
 * - Camera and UI settings
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type {
  NanoBotConfig,
  Vector3,
  NanoBotState,
  ColorTheme,
  AIProviderType,
  Memory,
  Statistics,
} from '../core/types';

/**
 * Extended bot data for rendering with additional UI state
 */
export interface NanoBotData extends NanoBotConfig {
  /** Current velocity vector for animations */
  velocity?: Vector3;
  /** Target position for movement animations */
  targetPosition?: Vector3;
  /** Current task description */
  currentTask?: string;
  /** Memory state for the bot */
  memory?: Memory;
  /** Visual scale factor for animations */
  scale?: number;
  /** Rotation angles for visual representation */
  rotation?: Vector3;
  /** Glow intensity for energy/state indication */
  glowIntensity?: number;
  /** Connection strength to other bots (0-1) */
  connectionStrength?: Record<string, number>;
}

/**
 * Swarm statistics for monitoring collective behavior
 */
export interface SwarmStats {
  /** Total energy across all bots */
  totalEnergy: number;
  /** Number of active (non-idle) bots */
  activeCount: number;
  /** Average energy level */
  averageEnergy: number;
  /** Total number of bots */
  totalBots: number;
  /** Generation distribution */
  generationDistribution: Record<number, number>;
  /** State distribution */
  stateDistribution: Record<NanoBotState, number>;
  /** Total task completion count */
  tasksCompleted: number;
  /** Total replications performed */
  totalReplications: number;
  /** Total merges performed */
  totalMerges: number;
  /** Hive mind message count */
  messagesExchanged: number;
}

/**
 * World configuration for environment settings
 */
export interface WorldConfig {
  /** Visual theme for the world */
  theme: ColorTheme;
  /** Random seed for world generation */
  seed: number;
  /** World size (grid dimensions) */
  size: Vector3;
  /** Enable fog effect */
  fogEnabled: boolean;
  /** Fog density */
  fogDensity: number;
  /** Ambient light intensity */
  ambientLightIntensity: number;
  /** Enable shadows */
  shadowsEnabled: boolean;
  /** Enable post-processing effects */
  postProcessingEnabled: boolean;
}

/**
 * Replication effect data for visual feedback
 */
export interface ReplicationEffect {
  /** Unique effect identifier */
  id: string;
  /** Parent bot position */
  parentPos: Vector3;
  /** Child bot position */
  childPos: Vector3;
  /** Effect start timestamp */
  startTime: number;
  /** Effect duration in milliseconds */
  duration: number;
  /** Effect color */
  color?: string;
}

/**
 * Camera preset options
 */
export type CameraPreset = 'overview' | 'follow' | 'cinematic' | 'orbit' | 'top-down' | 'first-person';

/**
 * Store state interface
 */
interface NanoBotStoreState {
  // Core bot data
  bots: NanoBotData[];
  selectedBotId: string | null;

  // Swarm and world state
  swarmStats: SwarmStats;
  worldConfig: WorldConfig;

  // Simulation controls
  simulationSpeed: number;
  isPaused: boolean;

  // Visual settings
  showConnections: boolean;
  cameraPreset: CameraPreset;

  // Visual effects
  replicationEffects: ReplicationEffect[];
  hiveMindActivity: number;

  // UI state
  showStats: boolean;
  showDebugInfo: boolean;

  // Actions
  addBot: (position: Vector3, config?: Partial<NanoBotConfig>) => string;
  removeBot: (id: string) => void;
  updateBot: (id: string, data: Partial<NanoBotData>) => void;
  selectBot: (id: string | null) => void;
  replicateBot: (id: string, position?: Vector3) => string | null;
  mergeBots: (id1: string, id2: string) => void;

  setTheme: (theme: ColorTheme) => void;
  setWorldConfig: (config: Partial<WorldConfig>) => void;
  setSimulationSpeed: (speed: number) => void;
  togglePause: () => void;
  toggleConnections: () => void;
  toggleStats: () => void;
  toggleDebugInfo: () => void;
  setCameraPreset: (preset: CameraPreset) => void;

  updateSwarmStats: () => void;
  addReplicationEffect: (effect: Omit<ReplicationEffect, 'id'>) => void;
  removeReplicationEffect: (id: string) => void;
  clearOldReplicationEffects: () => void;
  setHiveMindActivity: (activity: number) => void;

  reset: () => void;
}

/**
 * Default world configuration
 */
const defaultWorldConfig: WorldConfig = {
  theme: 'cyberpunk',
  seed: Math.floor(Math.random() * 10000),
  size: { x: 100, y: 50, z: 100 },
  fogEnabled: true,
  fogDensity: 0.02,
  ambientLightIntensity: 0.4,
  shadowsEnabled: true,
  postProcessingEnabled: true,
};

/**
 * Default swarm statistics
 */
const defaultSwarmStats: SwarmStats = {
  totalEnergy: 0,
  activeCount: 0,
  averageEnergy: 0,
  totalBots: 0,
  generationDistribution: {},
  stateDistribution: {
    [NanoBotState.IDLE]: 0,
    [NanoBotState.WORKING]: 0,
    [NanoBotState.LEARNING]: 0,
    [NanoBotState.REPLICATING]: 0,
    [NanoBotState.MERGING]: 0,
    [NanoBotState.EXPLORING]: 0,
  },
  tasksCompleted: 0,
  totalReplications: 0,
  totalMerges: 0,
  messagesExchanged: 0,
};

/**
 * Create a default bot configuration
 */
const createDefaultBot = (
  id: string,
  position: Vector3,
  config?: Partial<NanoBotConfig>
): NanoBotData => {
  const now = Date.now();
  return {
    id,
    position,
    energy: 100,
    generation: 0,
    parentId: null,
    state: NanoBotState.IDLE,
    aiProvider: 'groq' as AIProviderType,
    apiKey: '',
    model: 'llama-3.1-8b-instant',
    maxClones: 3,
    activeClones: 0,
    theme: 'cyberpunk',
    createdAt: now,
    lastActiveAt: now,
    maxTaskQueueSize: 10,
    energyConsumptionRate: 0.1,
    energyRegenerationRate: 0.05,
    velocity: { x: 0, y: 0, z: 0 },
    scale: 1,
    rotation: { x: 0, y: 0, z: 0 },
    glowIntensity: 0.5,
    connectionStrength: {},
    ...config,
  };
};

/**
 * Main Zustand store with immer middleware for immutable updates
 */
export const useNanoBotStore = create<NanoBotStoreState>()(
  immer((set, get) => ({
    // Initial state
    bots: [],
    selectedBotId: null,
    swarmStats: { ...defaultSwarmStats },
    worldConfig: { ...defaultWorldConfig },
    simulationSpeed: 1,
    isPaused: false,
    showConnections: true,
    cameraPreset: 'overview',
    replicationEffects: [],
    hiveMindActivity: 0,
    showStats: true,
    showDebugInfo: false,

    // Bot management actions
    addBot: (position: Vector3, config?: Partial<NanoBotConfig>) => {
      const id = uuidv4();
      set((state) => {
        const newBot = createDefaultBot(id, position, config);
        state.bots.push(newBot);
      });
      get().updateSwarmStats();
      return id;
    },

    removeBot: (id: string) => {
      set((state) => {
        const index = state.bots.findIndex((bot) => bot.id === id);
        if (index !== -1) {
          state.bots.splice(index, 1);
        }
        if (state.selectedBotId === id) {
          state.selectedBotId = null;
        }
      });
      get().updateSwarmStats();
    },

    updateBot: (id: string, data: Partial<NanoBotData>) => {
      set((state) => {
        const bot = state.bots.find((b) => b.id === id);
        if (bot) {
          Object.assign(bot, data);
          bot.lastActiveAt = Date.now();
        }
      });
    },

    selectBot: (id: string | null) => {
      set((state) => {
        state.selectedBotId = id;
      });
    },

    replicateBot: (id: string, position?: Vector3) => {
      const state = get();
      const parentBot = state.bots.find((b) => b.id === id);

      if (!parentBot) {
        console.warn(`Cannot replicate: Bot ${id} not found`);
        return null;
      }

      if (parentBot.activeClones >= parentBot.maxClones) {
        console.warn(`Cannot replicate: Bot ${id} has reached max clones (${parentBot.maxClones})`);
        return null;
      }

      if (parentBot.energy < 30) {
        console.warn(`Cannot replicate: Bot ${id} has insufficient energy (${parentBot.energy})`);
        return null;
      }

      // Calculate clone position
      const clonePosition = position || {
        x: parentBot.position.x + (Math.random() - 0.5) * 10,
        y: parentBot.position.y + (Math.random() - 0.5) * 5,
        z: parentBot.position.z + (Math.random() - 0.5) * 10,
      };

      // Create clone with inherited properties
      const cloneId = uuidv4();
      const cloneConfig: Partial<NanoBotConfig> = {
        generation: parentBot.generation + 1,
        parentId: parentBot.id,
        energy: 50, // Clones start with reduced energy
        aiProvider: parentBot.aiProvider,
        apiKey: parentBot.apiKey,
        model: parentBot.model,
        theme: parentBot.theme,
        maxClones: Math.max(1, parentBot.maxClones - 1), // Clones have reduced replication capacity
        state: NanoBotState.IDLE,
      };

      // Add the clone
      get().addBot(clonePosition, cloneConfig);

      // Update parent bot
      set((state) => {
        const parent = state.bots.find((b) => b.id === id);
        if (parent) {
          parent.activeClones += 1;
          parent.energy = Math.max(0, parent.energy - 30); // Replication costs energy
          parent.state = NanoBotState.REPLICATING;
        }
        state.swarmStats.totalReplications += 1;
      });

      // Add visual effect
      get().addReplicationEffect({
        parentPos: parentBot.position,
        childPos: clonePosition,
        startTime: Date.now(),
        duration: 2000,
        color: '#00ffff',
      });

      return cloneId;
    },

    mergeBots: (id1: string, id2: string) => {
      set((state) => {
        const bot1 = state.bots.find((b) => b.id === id1);
        const bot2 = state.bots.find((b) => b.id === id2);

        if (!bot1 || !bot2) {
          console.warn(`Cannot merge: One or both bots not found`);
          return;
        }

        // Merge properties into bot1
        bot1.energy = Math.min(100, bot1.energy + bot2.energy * 0.8);
        bot1.maxClones = Math.max(bot1.maxClones, bot2.maxClones);
        bot1.state = NanoBotState.MERGING;

        // Merge memory if available
        if (bot1.memory && bot2.memory) {
          bot1.memory.experiences = [
            ...bot1.memory.experiences,
            ...bot2.memory.experiences,
          ].slice(-bot1.memory.maxExperiences);

          bot1.memory.knowledge = [
            ...bot1.memory.knowledge,
            ...bot2.memory.knowledge,
          ].slice(-bot1.memory.maxKnowledge);
        }

        // Remove bot2
        const index = state.bots.findIndex((b) => b.id === id2);
        if (index !== -1) {
          state.bots.splice(index, 1);
        }

        if (state.selectedBotId === id2) {
          state.selectedBotId = id1;
        }

        state.swarmStats.totalMerges += 1;
      });

      get().updateSwarmStats();
    },

    // World and theme actions
    setTheme: (theme: ColorTheme) => {
      set((state) => {
        state.worldConfig.theme = theme;
      });
    },

    setWorldConfig: (config: Partial<WorldConfig>) => {
      set((state) => {
        Object.assign(state.worldConfig, config);
      });
    },

    // Simulation control actions
    setSimulationSpeed: (speed: number) => {
      set((state) => {
        state.simulationSpeed = Math.max(0.25, Math.min(4, speed));
      });
    },

    togglePause: () => {
      set((state) => {
        state.isPaused = !state.isPaused;
      });
    },

    // Visual settings actions
    toggleConnections: () => {
      set((state) => {
        state.showConnections = !state.showConnections;
      });
    },

    toggleStats: () => {
      set((state) => {
        state.showStats = !state.showStats;
      });
    },

    toggleDebugInfo: () => {
      set((state) => {
        state.showDebugInfo = !state.showDebugInfo;
      });
    },

    setCameraPreset: (preset: CameraPreset) => {
      set((state) => {
        state.cameraPreset = preset;
      });
    },

    // Statistics actions
    updateSwarmStats: () => {
      set((state) => {
        const bots = state.bots;
        const stats: SwarmStats = {
          totalEnergy: 0,
          activeCount: 0,
          averageEnergy: 0,
          totalBots: bots.length,
          generationDistribution: {},
          stateDistribution: {
            [NanoBotState.IDLE]: 0,
            [NanoBotState.WORKING]: 0,
            [NanoBotState.LEARNING]: 0,
            [NanoBotState.REPLICATING]: 0,
            [NanoBotState.MERGING]: 0,
            [NanoBotState.EXPLORING]: 0,
          },
          tasksCompleted: state.swarmStats.tasksCompleted,
          totalReplications: state.swarmStats.totalReplications,
          totalMerges: state.swarmStats.totalMerges,
          messagesExchanged: state.swarmStats.messagesExchanged,
        };

        bots.forEach((bot) => {
          stats.totalEnergy += bot.energy;

          if (bot.state !== NanoBotState.IDLE) {
            stats.activeCount += 1;
          }

          // Generation distribution
          stats.generationDistribution[bot.generation] =
            (stats.generationDistribution[bot.generation] || 0) + 1;

          // State distribution
          stats.stateDistribution[bot.state] += 1;
        });

        stats.averageEnergy = bots.length > 0 ? stats.totalEnergy / bots.length : 0;

        state.swarmStats = stats;
      });
    },

    // Visual effects actions
    addReplicationEffect: (effect: Omit<ReplicationEffect, 'id'>) => {
      set((state) => {
        state.replicationEffects.push({
          ...effect,
          id: uuidv4(),
        });
      });
    },

    removeReplicationEffect: (id: string) => {
      set((state) => {
        const index = state.replicationEffects.findIndex((e) => e.id === id);
        if (index !== -1) {
          state.replicationEffects.splice(index, 1);
        }
      });
    },

    clearOldReplicationEffects: () => {
      const now = Date.now();
      set((state) => {
        state.replicationEffects = state.replicationEffects.filter(
          (effect) => now - effect.startTime < effect.duration
        );
      });
    },

    setHiveMindActivity: (activity: number) => {
      set((state) => {
        state.hiveMindActivity = Math.max(0, Math.min(1, activity));
      });
    },

    // Reset action
    reset: () => {
      set((state) => {
        state.bots = [];
        state.selectedBotId = null;
        state.swarmStats = { ...defaultSwarmStats };
        state.worldConfig = { ...defaultWorldConfig };
        state.simulationSpeed = 1;
        state.isPaused = false;
        state.showConnections = true;
        state.cameraPreset = 'overview';
        state.replicationEffects = [];
        state.hiveMindActivity = 0;
        state.showStats = true;
        state.showDebugInfo = false;
      });
    },
  }))
);

/**
 * Selector hooks for optimized subscriptions
 */

// Get all bots
export const useBots = () => useNanoBotStore((state) => state.bots);

// Get selected bot
export const useSelectedBot = () => {
  const bots = useNanoBotStore((state) => state.bots);
  const selectedBotId = useNanoBotStore((state) => state.selectedBotId);
  return bots.find((bot) => bot.id === selectedBotId) || null;
};

// Get swarm stats
export const useSwarmStats = () => useNanoBotStore((state) => state.swarmStats);

// Get world config
export const useWorldConfig = () => useNanoBotStore((state) => state.worldConfig);

// Get simulation controls
export const useSimulationControls = () => useNanoBotStore((state) => ({
  speed: state.simulationSpeed,
  isPaused: state.isPaused,
  setSpeed: state.setSimulationSpeed,
  togglePause: state.togglePause,
}));

// Get visual settings
export const useVisualSettings = () => useNanoBotStore((state) => ({
  showConnections: state.showConnections,
  cameraPreset: state.cameraPreset,
  showStats: state.showStats,
  showDebugInfo: state.showDebugInfo,
  toggleConnections: state.toggleConnections,
  setCameraPreset: state.setCameraPreset,
  toggleStats: state.toggleStats,
  toggleDebugInfo: state.toggleDebugInfo,
}));

// Get replication effects
export const useReplicationEffects = () =>
  useNanoBotStore((state) => state.replicationEffects);

// Get hive mind activity
export const useHiveMindActivity = () =>
  useNanoBotStore((state) => state.hiveMindActivity);
