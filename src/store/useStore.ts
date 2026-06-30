/**
 * Zustand Store - Global State Management for NanoBot Framework
 *
 * Manages all application state including bots, simulation settings,
 * UI state, and world configuration.
 */

import { create } from 'zustand';
import { NanoBot, HiveMind, BotSwarm } from '@core';
import type { Vector3 } from '@core/types';
import { NanoBotState } from '@core/types';
import type { WorldTheme } from '@world/WorldGenerator';
import { THEMES } from '@world/WorldGenerator';

export interface ReplicationEvent {
  parentId: string;
  parentPosition: [number, number, number];
  childPosition: [number, number, number];
  timestamp: number;
}

export interface BotStoreData {
  id: string;
  position: Vector3;
  velocity: Vector3;
  state: NanoBotState;
  energy: number;
  health: number;
  generation: number;
  parentId: string | null;
  instance: NanoBot;
}

interface AppStore {
  // Bot Management
  bots: Map<string, BotStoreData>;
  selectedBotId: string | null;
  hiveMind: HiveMind | null;
  botSwarm: BotSwarm | null;

  // Simulation State
  isPaused: boolean;
  simulationSpeed: number;
  totalEnergy: number;
  activeReplicationEvents: ReplicationEvent[];

  // World Configuration
  worldTheme: WorldTheme;
  showGrid: boolean;
  enableFog: boolean;
  enableParticles: boolean;
  showConnections: boolean;

  // UI State
  showBotStatusPanel: boolean;
  showSwarmStats: boolean;
  showControlPanel: boolean;
  showMinimap: boolean;

  // Performance
  fps: number;
  lastUpdateTime: number;

  // Actions - Bot Management
  addBot: (bot: NanoBot) => void;
  removeBot: (id: string) => void;
  updateBot: (id: string, updates: Partial<BotStoreData>) => void;
  selectBot: (id: string | null) => void;
  getBotById: (id: string) => BotStoreData | undefined;

  // Actions - Simulation Control
  togglePause: () => void;
  setPause: (paused: boolean) => void;
  setSimulationSpeed: (speed: number) => void;
  resetSimulation: () => void;

  // Actions - Replication
  triggerReplication: (parentId: string) => void;
  addReplicationEvent: (event: ReplicationEvent) => void;
  removeReplicationEvent: (timestamp: number) => void;

  // Actions - World Configuration
  setWorldTheme: (theme: WorldTheme) => void;
  toggleGrid: () => void;
  toggleFog: () => void;
  toggleParticles: () => void;
  toggleConnections: () => void;

  // Actions - UI State
  toggleBotStatusPanel: () => void;
  toggleSwarmStats: () => void;
  toggleControlPanel: () => void;
  toggleMinimap: () => void;

  // Actions - System
  updateFPS: (fps: number) => void;
  updateTotalEnergy: () => void;
  initializeHiveMind: () => void;
  initializeBotSwarm: () => void;
}

export const useStore = create<AppStore>((set, get) => ({
  // Initial State - Bot Management
  bots: new Map(),
  selectedBotId: null,
  hiveMind: null,
  botSwarm: null,

  // Initial State - Simulation
  isPaused: false,
  simulationSpeed: 1.0,
  totalEnergy: 0,
  activeReplicationEvents: [],

  // Initial State - World Configuration (Default to NMS Exotic theme)
  worldTheme: THEMES.nms_exotic || THEMES.cyberpunk,
  showGrid: false, // Hide grid for NMS style
  enableFog: true,
  enableParticles: true,
  showConnections: true,

  // Initial State - UI State
  showBotStatusPanel: false,
  showSwarmStats: true,
  showControlPanel: true,
  showMinimap: true,

  // Initial State - Performance
  fps: 60,
  lastUpdateTime: Date.now(),

  // Actions - Bot Management
  addBot: (bot: NanoBot) => {
    set((state) => {
      const newBots = new Map(state.bots);
      newBots.set(bot.id, {
        id: bot.id,
        position: bot.position,
        velocity: bot.velocity,
        state: bot.state,
        energy: bot.energy,
        health: bot.health,
        generation: bot.generation,
        parentId: bot.parentId,
        instance: bot,
      });
      return { bots: newBots };
    });
    get().updateTotalEnergy();
  },

  removeBot: (id: string) => {
    set((state) => {
      const newBots = new Map(state.bots);
      newBots.delete(id);
      return {
        bots: newBots,
        selectedBotId: state.selectedBotId === id ? null : state.selectedBotId,
      };
    });
    get().updateTotalEnergy();
  },

  updateBot: (id: string, updates: Partial<BotStoreData>) => {
    set((state) => {
      const bot = state.bots.get(id);
      if (!bot) return state;

      const newBots = new Map(state.bots);
      newBots.set(id, { ...bot, ...updates });
      return { bots: newBots };
    });
  },

  selectBot: (id: string | null) => {
    set({
      selectedBotId: id,
      showBotStatusPanel: id !== null,
    });
  },

  getBotById: (id: string) => {
    return get().bots.get(id);
  },

  // Actions - Simulation Control
  togglePause: () => {
    set((state) => ({ isPaused: !state.isPaused }));
  },

  setPause: (paused: boolean) => {
    set({ isPaused: paused });
  },

  setSimulationSpeed: (speed: number) => {
    set({ simulationSpeed: Math.max(0.1, Math.min(5.0, speed)) });
  },

  resetSimulation: () => {
    set({
      bots: new Map(),
      selectedBotId: null,
      isPaused: false,
      simulationSpeed: 1.0,
      totalEnergy: 0,
      activeReplicationEvents: [],
    });
  },

  // Actions - Replication
  triggerReplication: (parentId: string) => {
    const bot = get().bots.get(parentId);
    if (!bot || !bot.instance) return;

    // Check if bot can replicate
    if (bot.energy < 300) {
      console.warn(`Bot ${parentId} does not have enough energy to replicate`);
      return;
    }

    if (bot.state === NanoBotState.REPLICATING) {
      console.warn(`Bot ${parentId} is already replicating`);
      return;
    }

    // Trigger replication on the bot instance
    const childBot = bot.instance.replicate();

    if (childBot) {
      // Add the child bot to the store
      get().addBot(childBot);

      // Create replication event
      const event: ReplicationEvent = {
        parentId: bot.id,
        parentPosition: [bot.position.x, bot.position.y, bot.position.z],
        childPosition: [childBot.position.x, childBot.position.y, childBot.position.z],
        timestamp: Date.now(),
      };

      get().addReplicationEvent(event);

      // Remove event after 3 seconds (duration of effect)
      setTimeout(() => {
        get().removeReplicationEvent(event.timestamp);
      }, 3000);
    }
  },

  addReplicationEvent: (event: ReplicationEvent) => {
    set((state) => ({
      activeReplicationEvents: [...state.activeReplicationEvents, event],
    }));
  },

  removeReplicationEvent: (timestamp: number) => {
    set((state) => ({
      activeReplicationEvents: state.activeReplicationEvents.filter(
        (e) => e.timestamp !== timestamp
      ),
    }));
  },

  // Actions - World Configuration
  setWorldTheme: (theme: WorldTheme) => {
    set({ worldTheme: theme });
  },

  toggleGrid: () => {
    set((state) => ({ showGrid: !state.showGrid }));
  },

  toggleFog: () => {
    set((state) => ({ enableFog: !state.enableFog }));
  },

  toggleParticles: () => {
    set((state) => ({ enableParticles: !state.enableParticles }));
  },

  toggleConnections: () => {
    set((state) => ({ showConnections: !state.showConnections }));
  },

  // Actions - UI State
  toggleBotStatusPanel: () => {
    set((state) => ({ showBotStatusPanel: !state.showBotStatusPanel }));
  },

  toggleSwarmStats: () => {
    set((state) => ({ showSwarmStats: !state.showSwarmStats }));
  },

  toggleControlPanel: () => {
    set((state) => ({ showControlPanel: !state.showControlPanel }));
  },

  toggleMinimap: () => {
    set((state) => ({ showMinimap: !state.showMinimap }));
  },

  // Actions - System
  updateFPS: (fps: number) => {
    set({ fps });
  },

  updateTotalEnergy: () => {
    const bots = get().bots;
    let total = 0;
    bots.forEach((bot) => {
      total += bot.energy;
    });
    set({ totalEnergy: total });
  },

  initializeHiveMind: () => {
    const hiveMind = HiveMind.getInstance();
    set({ hiveMind });
  },

  initializeBotSwarm: () => {
    const botSwarm = new BotSwarm({});
    set({ botSwarm });
  },
}));
