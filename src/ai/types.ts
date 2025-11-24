/**
 * Shared Type Definitions for NanoBot AI System
 * Central location for common types used across the AI module
 */

// Re-export from providers
export type {
  ChatMessage,
  ChatResponse,
  AnalysisResult,
  ProviderConfig,
} from './providers/base';

export type {
  ProviderType,
  CreateProviderOptions,
  OpenRouterConfig,
  ImageAnalysisResult,
} from './providers';

// Re-export from brain
export type {
  ThinkingContext,
  Decision,
  EnvironmentAnalysis,
  ActionPlan,
  BrainConfig,
} from './brain';

/**
 * Bot action types that can be executed
 */
export type BotAction =
  | 'idle'
  | 'move'
  | 'gather'
  | 'collect'
  | 'build'
  | 'construct'
  | 'attack'
  | 'defend'
  | 'explore'
  | 'scan'
  | 'analyze'
  | 'replicate'
  | 'communicate'
  | 'wait'
  | 'execute';

/**
 * Bot personality types
 */
export type BotPersonality =
  | 'aggressive'
  | 'defensive'
  | 'explorer'
  | 'builder'
  | 'social';

/**
 * Resource types in the voxel world
 */
export type ResourceType =
  | 'energy_crystal'
  | 'metal_ore'
  | 'rare_mineral'
  | 'biomass'
  | 'water'
  | 'fuel';

/**
 * Threat types
 */
export type ThreatType =
  | 'hostile_bot'
  | 'environmental_hazard'
  | 'energy_drain'
  | 'structural_collapse'
  | 'toxic_zone';

/**
 * Bot type classifications
 */
export type BotType = 'worker' | 'scout' | 'builder' | 'defender' | 'harvester';

/**
 * Vector3D position
 */
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Bot state information
 */
export interface BotState {
  id: string;
  position: Vector3D;
  velocity?: Vector3D;
  energy: number;
  health: number;
  type: BotType;
  personality: BotPersonality;
  currentAction?: BotAction;
  currentGoal?: string;
}

/**
 * Resource information
 */
export interface Resource {
  type: ResourceType;
  position: Vector3D;
  distance: number;
  value: number;
  depleted?: boolean;
}

/**
 * Threat information
 */
export interface Threat {
  type: ThreatType;
  position: Vector3D;
  distance: number;
  severity: number; // 0-1
  active: boolean;
}

/**
 * Nearby bot information
 */
export interface NearbyBot {
  id: string;
  type: BotType;
  position: Vector3D;
  distance: number;
  friendly: boolean;
  energy?: number;
}

/**
 * World environment data
 */
export interface WorldEnvironment {
  temperature: number;
  radiation: number;
  atmosphericPressure: number;
  gravity: number;
  lightLevel: number;
  timeOfDay: number; // 0-24
}

/**
 * Swarm statistics
 */
export interface SwarmStats {
  totalBots: number;
  activeBots: number;
  averageEnergy: number;
  totalResources: number;
  structuresBuilt: number;
  explorationProgress: number; // 0-1
  threatLevel: number; // 0-1
}

/**
 * AI provider statistics
 */
export interface ProviderStats {
  totalRequests: number;
  totalTokens: number;
  averageLatency: number; // ms
  successRate: number; // 0-1
  errors: number;
}

/**
 * Decision result with execution metadata
 */
export interface DecisionResult {
  decision: BotAction;
  priority: number;
  reasoning: string;
  confidence: number;
  timestamp: number;
  parameters?: Record<string, unknown>;
}

/**
 * AI memory entry
 */
export interface MemoryEntry {
  timestamp: number;
  event: string;
  importance: number; // 0-1
  details?: Record<string, unknown>;
}

/**
 * Communication message between bots
 */
export interface BotMessage {
  from: string;
  to: string | 'broadcast';
  type: 'request' | 'response' | 'alert' | 'coordination';
  content: string;
  priority: number;
  timestamp: number;
}

/**
 * Goal with progress tracking
 */
export interface Goal {
  id: string;
  description: string;
  priority: number;
  progress: number; // 0-1
  startTime: number;
  deadline?: number;
  completed: boolean;
  subgoals?: Goal[];
}

/**
 * Performance metrics for AI decisions
 */
export interface PerformanceMetrics {
  decisionTime: number; // ms
  actionSuccessRate: number;
  resourceEfficiency: number;
  survivalRate: number;
  goalCompletionRate: number;
}
