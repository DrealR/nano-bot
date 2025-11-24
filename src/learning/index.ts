/**
 * Learning Module Exports
 *
 * Provides visual learning, environment analysis, and reinforcement learning
 * capabilities for NanoBot agents to improve their decision-making and
 * understanding of their environment.
 */

// Visual Learning
export { VisualLearner } from './VisualLearner';
export type {
  VisualLearnerConfig,
  ScreenshotOptions,
  DetectedObject,
  Pattern,
} from './VisualLearner';

// Environment Analysis
export { EnvironmentAnalyzer } from './EnvironmentAnalyzer';
export type {
  WorldData,
  ResourceLocation,
  ThreatLocation,
  ExplorationSuggestion,
  WorldInsights,
  WorldMap,
} from './EnvironmentAnalyzer';

// Reinforcement Learning
export { ReinforcementLearner } from './ReinforcementLearner';
export type {
  State,
  Action,
  Transition,
  QTable,
  Policy,
  LearningStats,
} from './ReinforcementLearner';
