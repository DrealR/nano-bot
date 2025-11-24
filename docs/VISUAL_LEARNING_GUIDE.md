# Visual Learning System Integration Guide

This guide explains how to integrate and use the NanoBot visual learning system in your application.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Component Details](#component-details)
5. [Integration Examples](#integration-examples)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Overview

The NanoBot Visual Learning System provides three powerful components:

- **VisualLearner**: Captures and analyzes screenshots using Gemini Vision AI
- **EnvironmentAnalyzer**: Analyzes world data for spatial reasoning and planning
- **ReinforcementLearner**: Q-learning system for optimizing bot actions

### Key Features

- AI-powered image analysis with object detection
- Real-time environment analysis and threat detection
- Q-learning for action optimization
- Integration with NanoBot memory system
- Export/import for persistent learning

## Installation

The learning system is included in the NanoBot framework. Ensure you have the required dependencies:

```bash
npm install @google/generative-ai
```

Set up your Gemini API key:

```bash
export GEMINI_API_KEY="your-api-key-here"
```

## Quick Start

### 1. Basic Visual Learning

```typescript
import { VisualLearner } from './src/learning';

const visualLearner = new VisualLearner({
  apiKey: process.env.GEMINI_API_KEY,
  confidenceThreshold: 0.6,
});

// Capture and analyze
const screenshot = visualLearner.captureScreenshot(canvas);
const analysis = await visualLearner.analyzeScreenshot(screenshot);

console.log('Detected objects:', analysis.detectedObjects);
console.log('Insights:', analysis.insights);
```

### 2. Basic Environment Analysis

```typescript
import { EnvironmentAnalyzer } from './src/learning';

const analyzer = new EnvironmentAnalyzer(botPosition, 32);

// Analyze world
const insights = analyzer.analyzeWorld(worldData);
const resources = analyzer.findResources(worldData);
const threats = analyzer.identifyThreats(worldData);

console.log(`Found ${resources.length} resources`);
console.log(`Detected ${threats.length} threats`);
```

### 3. Basic Reinforcement Learning

```typescript
import { ReinforcementLearner } from './src/learning';

const rlLearner = new ReinforcementLearner();

// Record experience
const state = { energy: 500, health: 100, position, nearbyResources: 3 };
const action = rlLearner.getBestAction(state);
const reward = executeAction(action);

rlLearner.recordAction(state, action, reward, nextState);

// Update policy
rlLearner.updatePolicy(32);
```

## Component Details

### VisualLearner

**Purpose**: Capture screenshots and analyze visual content using AI.

**Key Methods**:

- `captureScreenshot(canvas, options)`: Capture from canvas
- `analyzeScreenshot(imageData, prompt?)`: Analyze with Gemini
- `extractObjects(analysis)`: Parse detected objects
- `extractPatterns(analysis)`: Identify visual patterns
- `updateBotKnowledge(botId, analysis, callback?)`: Update bot memory
- `scheduleCapture(interval, canvas, botId, callback?)`: Auto-capture

**Configuration**:

```typescript
const config: VisualLearnerConfig = {
  apiKey: string,              // Required: Gemini API key
  model: 'gemini-1.5-flash',   // Optional: Model to use
  confidenceThreshold: 0.6,    // Optional: Min confidence (0-1)
  analyzeColors: true,         // Optional: Enable color analysis
  analyzePatterns: true,       // Optional: Enable pattern detection
  extractText: true,           // Optional: Enable text extraction
};
```

**Return Data**:

```typescript
interface VisualLearningData {
  detectedElements: DetectedObject[];
  patterns: Pattern[];
  textContent: string[];
  colorAnalysis: ColorAnalysis;
  layoutStructure: LayoutStructure;
  insights: string[];
  overallConfidence: number;
  processingTime: number;
}
```

### EnvironmentAnalyzer

**Purpose**: Analyze voxel world data for spatial reasoning.

**Key Methods**:

- `analyzeWorld(worldData)`: Get comprehensive world insights
- `findResources(worldData, maxResults?)`: Locate valuable resources
- `identifyThreats(worldData)`: Find dangers and obstacles
- `suggestExploration(worldData, numSuggestions?)`: Recommend areas
- `buildWorldMap(worldData)`: Create internal representation
- `updatePosition(position)`: Update bot position
- `setSightRange(range)`: Set analysis radius

**World Data Structure**:

```typescript
interface WorldData {
  chunks: ChunkData[];
  botPositions: Map<string, Vector3>;
  timeOfDay?: number;
  weatherConditions?: string;
}
```

**Return Data**:

```typescript
interface WorldInsights {
  totalBlocks: number;
  blockDistribution: Map<BlockType, number>;
  averageHeight: number;
  densityMap: Map<string, number>;
  explorationProgress: number;
  knownArea: number;
}

interface ResourceLocation {
  type: BlockType;
  position: Vector3;
  distance: number;
  value: number;
  accessibility: number;
}
```

### ReinforcementLearner

**Purpose**: Learn optimal actions through Q-learning.

**Key Methods**:

- `recordAction(state, action, reward, nextState, done?)`: Store transition
- `updatePolicy(batchSize?)`: Improve decision making
- `getBestAction(state, explore?)`: Get optimal action
- `getActionValue(state, action)`: Get Q-value
- `getStateValue(state)`: Get state value
- `planActionSequence(state, maxSteps)`: Plan ahead
- `exportQTable()` / `importQTable(json)`: Persist learning

**State Representation**:

```typescript
interface State {
  energy: number;
  health: number;
  position: Vector3;
  nearbyResources: number;
  nearbyThreats: number;
  [key: string]: any;
}
```

**Policy Configuration**:

```typescript
interface Policy {
  explorationRate: number;      // Epsilon for ε-greedy (0-1)
  learningRate: number;          // Alpha for Q-learning (0-1)
  discountFactor: number;        // Gamma for future rewards (0-1)
  minExplorationRate: number;    // Min exploration rate
  explorationDecay: number;      // Decay factor per update
}
```

## Integration Examples

### Example 1: Single Bot Learning

```typescript
import { NanoBot } from './src/core/NanoBot';
import { VisualLearner, EnvironmentAnalyzer, ReinforcementLearner } from './src/learning';

// Create bot
const bot = new NanoBot({
  aiProvider: 'gemini',
  apiKey: process.env.GEMINI_API_KEY,
});

// Initialize learning systems
const visualLearner = new VisualLearner({ apiKey: process.env.GEMINI_API_KEY });
const envAnalyzer = new EnvironmentAnalyzer(bot.position, 32);
const rlLearner = new ReinforcementLearner();

// Learning cycle
async function updateLoop(worldData, canvas) {
  // Visual learning (every 5 seconds)
  if (shouldCaptureVisual()) {
    const screenshot = visualLearner.captureScreenshot(canvas);
    const analysis = await visualLearner.analyzeScreenshot(screenshot);
    await visualLearner.updateBotKnowledge(bot.id, analysis, (data) => {
      bot.learn({
        type: 'learning',
        description: `Visual analysis: ${data.insights.join(', ')}`,
        outcome: 'positive',
        importance: data.overallConfidence,
      });
    });
  }

  // Environment analysis (every frame)
  envAnalyzer.updatePosition(bot.position);
  const resources = envAnalyzer.findResources(worldData);
  const threats = envAnalyzer.identifyThreats(worldData);

  // RL decision
  const state = {
    energy: bot.energy,
    health: bot.health,
    position: bot.position,
    nearbyResources: resources.length,
    nearbyThreats: threats.length,
  };

  const action = rlLearner.getBestAction(state);

  // Execute action
  bot.executeAction({
    type: action.type,
    parameters: action.parameters || {},
    energyCost: 10,
    duration: 1000,
  });

  // Get reward and update
  const reward = calculateReward(bot, resources, threats);
  const nextState = getCurrentState(bot, worldData);
  rlLearner.recordAction(state, action, reward, nextState);

  // Update policy periodically
  if (frameCount % 50 === 0) {
    rlLearner.updatePolicy(32);
  }
}
```

### Example 2: Multi-Bot Swarm Learning

```typescript
import { BotSwarm } from './src/core/BotSwarm';
import { EnvironmentAnalyzer, ReinforcementLearner } from './src/learning';

const swarm = new BotSwarm({ maxBots: 10 });

// Shared learning systems
const sharedRL = new ReinforcementLearner();
const analyzers = new Map();

// Create analyzer for each bot
swarm.getBots().forEach(bot => {
  analyzers.set(bot.id, new EnvironmentAnalyzer(bot.position, 32));
});

// Collective learning update
function swarmUpdate(worldData) {
  const experiences = [];

  swarm.getBots().forEach(bot => {
    const analyzer = analyzers.get(bot.id);
    analyzer.updatePosition(bot.position);

    const resources = analyzer.findResources(worldData);
    const state = {
      energy: bot.energy,
      health: bot.health,
      position: bot.position,
      nearbyResources: resources.length,
      nearbyThreats: 0,
    };

    const action = sharedRL.getBestAction(state);
    // Execute and collect experience
    experiences.push({ state, action });
  });

  // Share learning across swarm
  if (experiences.length > 0) {
    sharedRL.updatePolicy(experiences.length);
  }
}
```

### Example 3: Persistent Learning

```typescript
import { ReinforcementLearner } from './src/learning';
import fs from 'fs';

const rlLearner = new ReinforcementLearner();

// Load previous learning
if (fs.existsSync('bot-learning.json')) {
  const savedData = fs.readFileSync('bot-learning.json', 'utf8');
  rlLearner.importQTable(savedData);
  console.log('Loaded previous learning');
}

// ... training loop ...

// Save learning periodically
setInterval(() => {
  const data = rlLearner.exportQTable();
  fs.writeFileSync('bot-learning.json', data);
  console.log('Saved learning progress');
}, 60000); // Every minute
```

## Best Practices

### Visual Learning

1. **Capture Frequency**: Don't capture too frequently (5-10 seconds minimum)
2. **Confidence Threshold**: Use 0.6-0.7 for production, 0.5 for testing
3. **Batch Processing**: Queue analyses and process in batches
4. **Memory Management**: Clear history periodically

```typescript
// Good practice
visualLearner.scheduleCapture(10000, canvas, bot.id, (data) => {
  if (data.overallConfidence > 0.7) {
    processHighConfidenceData(data);
  }
});

// Clear old history every hour
setInterval(() => {
  visualLearner.clearHistory();
}, 3600000);
```

### Environment Analysis

1. **Sight Range**: Balance between coverage and performance (16-64 units)
2. **Update Frequency**: Update position every frame, analyze every few frames
3. **World Map**: Build incrementally, don't rebuild entirely each frame
4. **Resource Prioritization**: Consider value, distance, and accessibility

```typescript
// Good practice
const analyzer = new EnvironmentAnalyzer(botPosition, 32);

// Update frequently
function update() {
  analyzer.updatePosition(bot.position);

  // Heavy analysis less frequently
  if (frameCount % 30 === 0) {
    const resources = analyzer.findResources(worldData, 10);
    const threats = analyzer.identifyThreats(worldData);
  }
}
```

### Reinforcement Learning

1. **Exploration vs Exploitation**: Start high (0.9-1.0), decay to low (0.01-0.1)
2. **Learning Rate**: 0.1-0.3 is typical
3. **Discount Factor**: 0.9-0.99 for long-term planning
4. **Policy Updates**: Update every 10-50 steps
5. **Batch Size**: 16-64 for experience replay

```typescript
// Good practice
const rlLearner = new ReinforcementLearner(actionSpace, 10000);

rlLearner.setPolicy({
  explorationRate: 1.0,
  learningRate: 0.1,
  discountFactor: 0.95,
  minExplorationRate: 0.05,
  explorationDecay: 0.995,
});

// Update periodically
let stepCount = 0;
function step(state, action, reward, nextState) {
  rlLearner.recordAction(state, action, reward, nextState);
  stepCount++;

  if (stepCount % 20 === 0) {
    rlLearner.updatePolicy(32);
  }
}
```

## Troubleshooting

### Visual Learning Issues

**Problem**: Low confidence scores
- **Solution**: Improve screenshot quality, use better prompts, adjust threshold

**Problem**: API rate limits
- **Solution**: Reduce capture frequency, implement queuing system

**Problem**: Memory growth
- **Solution**: Clear history more frequently, reduce maxHistorySize

### Environment Analysis Issues

**Problem**: Missing resources
- **Solution**: Increase sight range, check world data is complete

**Problem**: Performance issues
- **Solution**: Reduce sight range, update less frequently, optimize chunk access

**Problem**: Incorrect accessibility
- **Solution**: Review path-blocking logic, tune accessibility calculations

### Reinforcement Learning Issues

**Problem**: Exploration stuck
- **Solution**: Increase exploration rate, check action space

**Problem**: Not learning
- **Solution**: Verify rewards are meaningful, check learning rate

**Problem**: Q-table too large
- **Solution**: Improve state discretization, use fewer bins

**Problem**: Overfitting
- **Solution**: Maintain higher exploration rate, use experience replay

## Advanced Topics

### Custom State Representation

```typescript
// Override state encoding for better discretization
class CustomRLLearner extends ReinforcementLearner {
  protected encodeState(state: State): string {
    // Custom encoding logic
    return `custom_${state.energy}_${state.health}`;
  }
}
```

### Custom Reward Functions

```typescript
function calculateReward(bot: NanoBot, action: Action, outcome: any): number {
  let reward = 0;

  // Reward for successful resource gathering
  if (action.type === 'gather' && outcome.success) {
    reward += 20;
  }

  // Penalty for energy depletion
  if (bot.energy < 100) {
    reward -= 10;
  }

  // Bonus for exploration
  if (action.type === 'move' && outcome.newAreaDiscovered) {
    reward += 5;
  }

  return reward;
}
```

### Hierarchical Learning

```typescript
// High-level planner
const strategicRL = new ReinforcementLearner(['explore', 'gather', 'build', 'defend']);

// Low-level executors
const movementRL = new ReinforcementLearner(['move_north', 'move_south', 'move_east', 'move_west']);
const gatheringRL = new ReinforcementLearner(['scan', 'collect', 'store']);

// Coordinate both levels
const strategicAction = strategicRL.getBestAction(highLevelState);
const tacticalAction = getTacticalRL(strategicAction.type).getBestAction(lowLevelState);
```

## Additional Resources

- See `/examples/visual-learning-demo.ts` for comprehensive examples
- Run tests with `/src/learning/test-suite.ts`
- Read component documentation in `/src/learning/README.md`
- Check NanoBot core documentation for memory integration

## Support

For issues or questions:
1. Check TypeScript type definitions
2. Review example code
3. Run test suite to verify setup
4. Check console for error messages
