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
export { NanoBot } from './NanoBot';
export type { Skill, BotAction, SerializedNanoBot } from './NanoBot';

// Export HiveMind and related types
export { HiveMind } from './HiveMind';
export type { KnowledgeGraphNode, SharedKnowledgeEntry, CollectiveIntelligence } from './HiveMind';

// Export BotSwarm and related types
export { BotSwarm } from './BotSwarm';
export type { FormationType } from './BotSwarm';

// Export ExperienceBuffer and related types
export { ExperienceBuffer } from './ExperienceBuffer';
export type { ExperienceBufferConfig } from './ExperienceBuffer';
