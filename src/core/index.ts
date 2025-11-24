/**
 * NanoBot Core Module
 *
 * Central export point for all core functionality including:
 * - Type definitions
 * - NanoBot main class
 * - HiveMind shared memory system
 * - BotSwarm collective coordination
 * - ExperienceBuffer for learning
 */

// Export all types
export * from './types';

// Export NanoBot class and related types
export {
  NanoBot,
  Skill,
  BotAction,
  SerializedNanoBot,
} from './NanoBot';

// Export HiveMind and related types
export {
  HiveMind,
  KnowledgeGraphNode,
  SharedKnowledgeEntry,
  CollectiveIntelligence,
} from './HiveMind';

// Export BotSwarm and related types
export {
  BotSwarm,
  FormationType,
} from './BotSwarm';

// Export ExperienceBuffer and related types
export {
  ExperienceBuffer,
  ExperienceBufferConfig,
} from './ExperienceBuffer';
