/**
 * Core TypeScript types for the NanoBot Framework
 *
 * This file defines all the fundamental interfaces, types, and enums
 * used throughout the NanoBot system for state management, configuration,
 * communication, and visual representation.
 */

/**
 * 3D Vector type for spatial positioning
 */
export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

/**
 * Possible states a NanoBot can be in during its lifecycle
 */
export enum NanoBotState {
  /** Bot is idle and waiting for tasks */
  IDLE = 'idle',
  /** Bot is actively working on a task */
  WORKING = 'working',
  /** Bot is learning from experiences or data */
  LEARNING = 'learning',
  /** Bot is creating shadow clones */
  REPLICATING = 'replicating',
  /** Bot is merging with another bot or absorbing knowledge */
  MERGING = 'merging',
  /** Bot is exploring the environment or searching for tasks */
  EXPLORING = 'exploring'
}

/**
 * AI provider types supported by the framework
 */
export type AIProviderType = 'groq' | 'openrouter' | 'gemini';

/**
 * Color theme options for visual representation
 */
export type ColorTheme = 'default' | 'neon' | 'pastel' | 'monochrome' | 'rainbow' | 'cyberpunk';

/**
 * Theme color configuration for bot visualization
 */
export interface ThemeColors {
  /** Primary color for the bot */
  primary: string;
  /** Secondary color for accents */
  secondary: string;
  /** Color used for energy indicators */
  energy: string;
  /** Color used for communication/network lines */
  communication: string;
  /** Background color */
  background: string;
  /** Text color for labels */
  text: string;
  /** Color for highlighting active states */
  highlight: string;
  /** Color for warning indicators */
  warning: string;
  /** Color for error indicators */
  error: string;
  /** Color for success indicators */
  success: string;
}

/**
 * Configuration for an individual NanoBot instance
 */
export interface NanoBotConfig {
  /** Unique identifier for the bot */
  id: string;
  /** Bot's position in 3D space */
  position: Vector3;
  /** Current energy level (0-100) */
  energy: number;
  /** Generation number (0 = original, 1+ = clones) */
  generation: number;
  /** ID of the parent bot (null for original bots) */
  parentId: string | null;
  /** Current state of the bot */
  state: NanoBotState;
  /** AI provider used by this bot */
  aiProvider: AIProviderType;
  /** API key for the AI provider */
  apiKey: string;
  /** Model name/identifier for the AI provider */
  model: string;
  /** Maximum number of shadow clones this bot can create */
  maxClones: number;
  /** Current number of active clones */
  activeClones: number;
  /** Visual theme for this bot */
  theme: ColorTheme;
  /** Custom name for the bot */
  name?: string;
  /** Tags or labels for categorization */
  tags?: string[];
  /** Timestamp when the bot was created */
  createdAt: number;
  /** Timestamp of last activity */
  lastActiveAt: number;
  /** Maximum task queue size */
  maxTaskQueueSize?: number;
  /** Energy consumption rate per action */
  energyConsumptionRate?: number;
  /** Energy regeneration rate when idle */
  energyRegenerationRate?: number;
}

/**
 * Experience entry stored in bot memory
 */
export interface Experience {
  /** Unique identifier for the experience */
  id: string;
  /** Timestamp when the experience occurred */
  timestamp: number;
  /** Type of experience (task, interaction, learning, etc.) */
  type: 'task' | 'interaction' | 'learning' | 'error' | 'success' | 'observation';
  /** Description of the experience */
  description: string;
  /** Context data associated with the experience */
  context: Record<string, any>;
  /** Outcome or result of the experience */
  outcome: 'positive' | 'negative' | 'neutral';
  /** Importance score (0-1) for memory retention */
  importance: number;
  /** Related bot IDs involved in this experience */
  relatedBots?: string[];
  /** Tags for categorization */
  tags?: string[];
}

/**
 * Knowledge entry in bot memory
 */
export interface Knowledge {
  /** Unique identifier for the knowledge */
  id: string;
  /** Topic or category of the knowledge */
  topic: string;
  /** The knowledge content */
  content: string;
  /** Source of the knowledge */
  source: 'learned' | 'inherited' | 'shared' | 'observed';
  /** Confidence level (0-1) */
  confidence: number;
  /** Number of times this knowledge has been used */
  useCount: number;
  /** Timestamp when knowledge was acquired */
  acquiredAt: number;
  /** Timestamp of last use */
  lastUsedAt: number;
  /** Related knowledge IDs */
  relatedKnowledge?: string[];
}

/**
 * Memory structure for NanoBot cognitive storage
 */
export interface Memory {
  /** Bot's accumulated experiences */
  experiences: Experience[];
  /** Bot's knowledge base */
  knowledge: Knowledge[];
  /** Short-term memory (recent events) */
  shortTerm: Record<string, any>;
  /** Long-term memory (persistent data) */
  longTerm: Record<string, any>;
  /** Maximum number of experiences to retain */
  maxExperiences: number;
  /** Maximum number of knowledge entries to retain */
  maxKnowledge: number;
  /** Timestamp of last memory consolidation */
  lastConsolidation: number;
  /** Memory usage statistics */
  stats: {
    totalExperiences: number;
    totalKnowledge: number;
    positiveOutcomes: number;
    negativeOutcomes: number;
    averageImportance: number;
  };
}

/**
 * Message types for hive mind communication
 */
export type HiveMindMessageType =
  | 'task_request'
  | 'task_offer'
  | 'task_acceptance'
  | 'task_completion'
  | 'knowledge_share'
  | 'help_request'
  | 'status_update'
  | 'clone_notification'
  | 'merge_request'
  | 'query'
  | 'response'
  | 'broadcast';

/**
 * Message structure for hive mind communication between bots
 */
export interface HiveMindMessage {
  /** Unique message identifier */
  id: string;
  /** ID of the sending bot */
  senderId: string;
  /** ID of the receiving bot(s) - null for broadcast */
  recipientId: string | string[] | null;
  /** Type of message */
  type: HiveMindMessageType;
  /** Message payload */
  payload: Record<string, any>;
  /** Message priority (0-10, higher is more urgent) */
  priority: number;
  /** Timestamp when message was sent */
  timestamp: number;
  /** Whether the message requires acknowledgment */
  requiresAck: boolean;
  /** ID of the message this is replying to */
  replyToId?: string;
  /** Time-to-live for the message (milliseconds) */
  ttl?: number;
  /** Thread ID for grouped conversations */
  threadId?: string;
}

/**
 * Configuration for the swarm collective
 */
export interface SwarmConfig {
  /** Maximum number of bots in the swarm */
  maxBots: number;
  /** Minimum number of bots to maintain */
  minBots: number;
  /** Maximum total energy for the swarm */
  maxTotalEnergy: number;
  /** Energy distribution strategy */
  energyDistribution: 'equal' | 'merit-based' | 'need-based' | 'task-based';
  /** Communication range for direct bot-to-bot communication */
  communicationRange: number;
  /** Whether bots can replicate automatically */
  autoReplication: boolean;
  /** Threshold for automatic replication (based on workload) */
  replicationThreshold: number;
  /** Whether bots can merge automatically */
  autoMerge: boolean;
  /** Threshold for automatic merging (based on efficiency) */
  mergeThreshold: number;
  /** Global task queue capacity */
  globalTaskQueueSize: number;
  /** Load balancing strategy */
  loadBalancing: 'round-robin' | 'least-loaded' | 'capability-based' | 'random';
  /** Enable hive mind collective intelligence */
  hiveMindEnabled: boolean;
  /** Hive mind update frequency (milliseconds) */
  hiveMindUpdateInterval: number;
  /** Enable visual learning from screenshots */
  visualLearningEnabled: boolean;
  /** Maximum generations allowed for clones */
  maxGenerations: number;
  /** Swarm coordination mode */
  coordinationMode: 'centralized' | 'distributed' | 'hierarchical';
}

/**
 * Event data for shadow clone replication
 */
export interface ReplicationEvent {
  /** Unique event identifier */
  id: string;
  /** ID of the parent bot */
  parentId: string;
  /** ID of the newly created clone */
  cloneId: string;
  /** Generation of the clone */
  generation: number;
  /** Timestamp of replication */
  timestamp: number;
  /** Reason for replication */
  reason: string;
  /** Configuration inherited by the clone */
  inheritedConfig: Partial<NanoBotConfig>;
  /** Memory inherited by the clone */
  inheritedMemory: Partial<Memory>;
  /** Energy cost of replication */
  energyCost: number;
  /** Success status of replication */
  success: boolean;
  /** Error message if replication failed */
  error?: string;
  /** Custom metadata */
  metadata?: Record<string, any>;
}

/**
 * Results from visual learning (screenshot analysis)
 */
export interface VisualLearningData {
  /** Unique identifier for the learning session */
  id: string;
  /** ID of the bot that performed the analysis */
  botId: string;
  /** Timestamp of analysis */
  timestamp: number;
  /** Path to the screenshot file */
  screenshotPath: string;
  /** Detected UI elements */
  detectedElements: Array<{
    type: string;
    label: string;
    position: { x: number; y: number; width: number; height: number };
    confidence: number;
    properties?: Record<string, any>;
  }>;
  /** Identified patterns */
  patterns: Array<{
    name: string;
    description: string;
    confidence: number;
    occurrences: number;
  }>;
  /** Extracted text content */
  textContent: string[];
  /** Detected colors and their distribution */
  colorAnalysis: {
    dominant: string[];
    palette: string[];
    contrast: number;
  };
  /** Detected layout structure */
  layoutStructure: {
    type: 'grid' | 'flex' | 'float' | 'absolute' | 'unknown';
    regions: Array<{
      name: string;
      bounds: { x: number; y: number; width: number; height: number };
    }>;
  };
  /** Actionable insights derived from the screenshot */
  insights: string[];
  /** Confidence score for the overall analysis (0-1) */
  overallConfidence: number;
  /** AI model used for analysis */
  modelUsed: string;
  /** Processing time in milliseconds */
  processingTime: number;
  /** Any errors encountered during analysis */
  errors?: string[];
}

/**
 * Message structure for AI provider communication
 */
export interface AIMessage {
  /** Role of the message sender */
  role: 'system' | 'user' | 'assistant';
  /** Content of the message */
  content: string;
  /** Optional name identifier for the sender */
  name?: string;
  /** Timestamp of the message */
  timestamp?: number;
  /** Optional metadata */
  metadata?: Record<string, any>;
}

/**
 * Configuration for AI provider requests
 */
export interface AIRequestConfig {
  /** AI provider to use */
  provider: AIProviderType;
  /** Model identifier */
  model: string;
  /** API key for authentication */
  apiKey: string;
  /** Messages to send */
  messages: AIMessage[];
  /** Temperature for response randomness (0-1) */
  temperature?: number;
  /** Maximum tokens in response */
  maxTokens?: number;
  /** Top-p sampling parameter */
  topP?: number;
  /** Frequency penalty */
  frequencyPenalty?: number;
  /** Presence penalty */
  presencePenalty?: number;
  /** Stop sequences */
  stop?: string[];
  /** Whether to stream the response */
  stream?: boolean;
  /** Custom request timeout (milliseconds) */
  timeout?: number;
}

/**
 * Response structure from AI providers
 */
export interface AIResponse {
  /** Generated content */
  content: string;
  /** Provider that generated the response */
  provider: AIProviderType;
  /** Model used */
  model: string;
  /** Token usage statistics */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Response timestamp */
  timestamp: number;
  /** Time taken to generate response (milliseconds) */
  latency: number;
  /** Success status */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Raw response data */
  raw?: any;
}

/**
 * Task structure for bot work items
 */
export interface Task {
  /** Unique task identifier */
  id: string;
  /** Task title/summary */
  title: string;
  /** Detailed task description */
  description: string;
  /** Task type/category */
  type: string;
  /** Task priority (0-10) */
  priority: number;
  /** Current task status */
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
  /** ID of bot assigned to this task */
  assignedTo?: string;
  /** Task dependencies (IDs of tasks that must complete first) */
  dependencies?: string[];
  /** Estimated energy cost */
  estimatedEnergy: number;
  /** Actual energy consumed */
  actualEnergy?: number;
  /** Task creation timestamp */
  createdAt: number;
  /** Task start timestamp */
  startedAt?: number;
  /** Task completion timestamp */
  completedAt?: number;
  /** Task result data */
  result?: any;
  /** Error information if failed */
  error?: string;
  /** Custom task metadata */
  metadata?: Record<string, any>;
}

/**
 * Statistics for monitoring bot and swarm performance
 */
export interface Statistics {
  /** Total number of bots */
  totalBots: number;
  /** Active bots count */
  activeBots: number;
  /** Total tasks completed */
  tasksCompleted: number;
  /** Tasks currently in progress */
  tasksInProgress: number;
  /** Tasks pending */
  tasksPending: number;
  /** Tasks failed */
  tasksFailed: number;
  /** Total energy consumed */
  totalEnergyConsumed: number;
  /** Current total energy across all bots */
  currentTotalEnergy: number;
  /** Total replications performed */
  totalReplications: number;
  /** Total merges performed */
  totalMerges: number;
  /** Messages sent in hive mind */
  messagesSent: number;
  /** Average task completion time (milliseconds) */
  avgTaskCompletionTime: number;
  /** Average energy per task */
  avgEnergyPerTask: number;
  /** Uptime (milliseconds) */
  uptime: number;
  /** Start time timestamp */
  startTime: number;
  /** Per-bot statistics */
  botStats: Record<string, {
    tasksCompleted: number;
    energyConsumed: number;
    clones: number;
    avgTaskTime: number;
  }>;
}

/**
 * Event emitted by the NanoBot system
 */
export interface SystemEvent {
  /** Event type */
  type: 'bot_created' | 'bot_destroyed' | 'task_started' | 'task_completed' |
        'replication' | 'merge' | 'energy_low' | 'error' | 'message_sent' |
        'state_changed' | 'swarm_update';
  /** Timestamp of event */
  timestamp: number;
  /** Bot ID related to this event */
  botId?: string;
  /** Event payload data */
  data: Record<string, any>;
  /** Event severity */
  severity: 'info' | 'warning' | 'error' | 'critical';
}
