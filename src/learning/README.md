# NanoBot Learning System

A comprehensive visual and reinforcement learning system for the NanoBot framework that enables bots to learn from screenshots, analyze their environment, and optimize their decision-making through experience.

## Overview

The learning system consists of three main components:

1. **VisualLearner** - Screenshot capture and AI-powered image analysis
2. **EnvironmentAnalyzer** - Direct analysis of world data and spatial reasoning
3. **ReinforcementLearner** - Q-learning based action optimization

## Components

### VisualLearner

Captures screenshots from the 3D canvas and uses Gemini Vision API to analyze visual content.

**Features:**
- Screenshot capture from HTML Canvas or Three.js renderer
- AI-powered image analysis using Gemini Vision
- Object detection and classification
- Pattern recognition
- Text extraction
- Color analysis
- Layout structure detection
- Scheduled automatic captures
- Learning history tracking

**Usage:**

```typescript
import { VisualLearner } from './learning/VisualLearner';

const visualLearner = new VisualLearner({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-1.5-flash',
  confidenceThreshold: 0.6,
  analyzeColors: true,
  analyzePatterns: true,
  extractText: true,
});

// Capture screenshot from canvas
const screenshot = visualLearner.captureScreenshot(canvas, {
  quality: 0.95,
  format: 'png',
  scale: 1,
});

// Analyze the screenshot
const analysis = await visualLearner.analyzeScreenshot(screenshot);

// Update bot knowledge
const learningData = await visualLearner.updateBotKnowledge(
  botId,
  analysis,
  (data) => {
    console.log(`Detected ${data.detectedElements.length} objects`);
    console.log(`Found ${data.patterns.length} patterns`);
  }
);

// Schedule automatic captures every 5 seconds
visualLearner.scheduleCapture(5000, canvas, botId, (data) => {
  // Handle learning data
});
```

### EnvironmentAnalyzer

Analyzes the voxel world data directly to help bots understand their surroundings.

**Features:**
- World state analysis
- Resource location and prioritization
- Threat detection and assessment
- Exploration suggestions
- Internal world mapping
- Safe/danger zone identification
- Accessibility calculations
- Spatial reasoning

**Usage:**

```typescript
import { EnvironmentAnalyzer } from './learning/EnvironmentAnalyzer';

const analyzer = new EnvironmentAnalyzer(botPosition, sightRange);

// Analyze world data
const insights = analyzer.analyzeWorld(worldData);
console.log(`Total blocks: ${insights.totalBlocks}`);
console.log(`Exploration: ${insights.explorationProgress * 100}%`);

// Find nearby resources
const resources = analyzer.findResources(worldData, 10);
resources.forEach(resource => {
  console.log(`Resource: ${resource.type}, Distance: ${resource.distance}`);
});

// Identify threats
const threats = analyzer.identifyThreats(worldData);
threats.forEach(threat => {
  console.log(`Threat: ${threat.type}, Severity: ${threat.severity}`);
});

// Get exploration suggestions
const suggestions = analyzer.suggestExploration(worldData, 5);
suggestions.forEach(suggestion => {
  console.log(`Explore: (${suggestion.position.x}, ${suggestion.position.y})`);
  console.log(`Priority: ${suggestion.priority}/10`);
});

// Build internal world map
const worldMap = analyzer.buildWorldMap(worldData);
console.log(`Visited: ${worldMap.visited.size} locations`);
```

### ReinforcementLearner

Implements Q-learning for action optimization based on experience.

**Features:**
- Q-learning algorithm
- Experience replay buffer
- Epsilon-greedy exploration
- Policy optimization
- Action value estimation
- State value calculation
- Action sequence planning
- Q-table import/export
- Learning statistics tracking

**Usage:**

```typescript
import { ReinforcementLearner } from './learning/ReinforcementLearner';

const rlLearner = new ReinforcementLearner(
  ['move', 'gather', 'scan', 'build', 'replicate', 'idle'],
  10000 // buffer size
);

// Define current state
const state = {
  energy: bot.energy,
  health: bot.health,
  position: bot.position,
  nearbyResources: 3,
  nearbyThreats: 1,
};

// Get best action
const action = rlLearner.getBestAction(state, true);

// Execute action and get reward
const reward = executeAction(action);
const nextState = getNextState();

// Record the transition
rlLearner.recordAction(state, action, reward, nextState, false);

// Update policy periodically
if (stepCount % 10 === 0) {
  rlLearner.updatePolicy(32);
}

// Get statistics
const stats = rlLearner.getStats();
console.log(`Average reward: ${stats.averageReward}`);
console.log(`Q-table size: ${stats.qTableSize}`);

// Plan action sequence
const plan = rlLearner.planActionSequence(state, 5);
console.log('Planned actions:', plan.map(a => a.type));
```

## Integration with NanoBot

The learning system integrates seamlessly with the NanoBot core:

```typescript
import { NanoBot } from '../core/NanoBot';
import { VisualLearner, EnvironmentAnalyzer, ReinforcementLearner } from '../learning';

// Create bot
const bot = new NanoBot({
  position: { x: 0, y: 0, z: 0 },
  aiProvider: 'gemini',
  apiKey: process.env.GEMINI_API_KEY,
});

// Create learning systems
const visualLearner = new VisualLearner({ apiKey: process.env.GEMINI_API_KEY });
const envAnalyzer = new EnvironmentAnalyzer(bot.position, 32);
const rlLearner = new ReinforcementLearner();

// Learning cycle
async function learnAndAct(worldData, canvas) {
  // 1. Visual learning
  const screenshot = visualLearner.captureScreenshot(canvas);
  const visualAnalysis = await visualLearner.analyzeScreenshot(screenshot);
  await visualLearner.updateBotKnowledge(bot.id, visualAnalysis);

  // 2. Environment analysis
  const resources = envAnalyzer.findResources(worldData);
  const threats = envAnalyzer.identifyThreats(worldData);
  const suggestions = envAnalyzer.suggestExploration(worldData);

  // 3. RL decision making
  const state = {
    energy: bot.energy,
    health: bot.health,
    position: bot.position,
    nearbyResources: resources.length,
    nearbyThreats: threats.length,
  };

  const action = rlLearner.getBestAction(state);

  // 4. Execute and learn
  const reward = calculateReward(action, resources, threats);
  const nextState = simulateNextState(state, action);

  rlLearner.recordAction(state, action, reward, nextState);

  // 5. Update bot memory
  bot.learn({
    type: 'task',
    description: `Executed ${action.type}`,
    outcome: reward > 0 ? 'positive' : 'negative',
    importance: Math.abs(reward) / 10,
    context: { action, visualAnalysis, resources, threats },
  });

  return action;
}
```

## Data Structures

### VisualLearningData

```typescript
interface VisualLearningData {
  id: string;
  botId: string;
  timestamp: number;
  screenshotPath: string;
  detectedElements: DetectedObject[];
  patterns: Pattern[];
  textContent: string[];
  colorAnalysis: {
    dominant: string[];
    palette: string[];
    contrast: number;
  };
  layoutStructure: {
    type: 'grid' | 'flex' | 'float' | 'absolute' | 'unknown';
    regions: Array<{ name: string; bounds: BoundingBox }>;
  };
  insights: string[];
  overallConfidence: number;
  modelUsed: string;
  processingTime: number;
}
```

### WorldMap

```typescript
interface WorldMap {
  visited: Set<string>;
  resources: Map<string, ResourceLocation>;
  threats: Map<string, ThreatLocation>;
  safeZones: Set<string>;
  dangerZones: Set<string>;
  lastUpdate: number;
}
```

### QTable

```typescript
interface QTable {
  [stateActionKey: string]: number;
}
```

## Configuration

### Visual Learner Config

```typescript
interface VisualLearnerConfig {
  apiKey: string;
  model?: string;
  customPrompt?: string;
  confidenceThreshold?: number;
  analyzeColors?: boolean;
  analyzePatterns?: boolean;
  extractText?: boolean;
}
```

### Policy Config

```typescript
interface Policy {
  explorationRate: number;
  learningRate: number;
  discountFactor: number;
  minExplorationRate: number;
  explorationDecay: number;
}
```

## Examples

See the `/examples/visual-learning-demo.ts` file for comprehensive examples of:

1. Visual learning from screenshots
2. Environment analysis and spatial reasoning
3. Reinforcement learning with Q-learning
4. Integrated learning with all systems

Run the demo:

```bash
ts-node examples/visual-learning-demo.ts
```

## Performance Considerations

- **Visual Learning**: Screenshot analysis is async and can take 1-3 seconds per image
- **Environment Analysis**: Fast, typically < 100ms for chunk analysis
- **RL Updates**: Q-table updates are very fast (< 1ms), policy updates depend on batch size
- **Memory**: Experience buffer is bounded, Q-table grows with state-action space

## Best Practices

1. **Visual Learning**:
   - Schedule captures at reasonable intervals (5-10 seconds)
   - Use appropriate confidence thresholds to filter noise
   - Clear history periodically to manage memory

2. **Environment Analysis**:
   - Update bot position regularly
   - Adjust sight range based on computational resources
   - Build world map incrementally as bot explores

3. **Reinforcement Learning**:
   - Start with high exploration rate, decay gradually
   - Update policy regularly (every 10-50 steps)
   - Save/load Q-table for persistent learning
   - Monitor learning stats to tune hyperparameters

4. **Integration**:
   - Combine insights from all systems for robust decision making
   - Store learning data in bot memory for long-term learning
   - Use visual and environment analysis to inform RL state representation

## API Reference

See TypeScript definitions in source files for complete API documentation.

## License

Part of the NanoBot framework.
