# Visual Learning System - Quick Reference

## File Locations

```
src/learning/
├── VisualLearner.ts          # Screenshot capture & AI analysis
├── EnvironmentAnalyzer.ts    # World data analysis
├── ReinforcementLearner.ts   # Q-learning system
├── index.ts                  # Module exports
├── test-suite.ts             # Test suite
└── README.md                 # Component docs

examples/visual-learning-demo.ts    # Working examples
docs/VISUAL_LEARNING_GUIDE.md       # Integration guide
```

## Quick Import

```typescript
import {
  VisualLearner,
  EnvironmentAnalyzer,
  ReinforcementLearner,
  type VisualLearningData,
  type WorldInsights,
  type State,
  type Action,
} from './src/learning';
```

## Visual Learner Cheat Sheet

```typescript
// Initialize
const vl = new VisualLearner({
  apiKey: process.env.GEMINI_API_KEY,
  confidenceThreshold: 0.6
});

// Capture
const img = vl.captureScreenshot(canvas);

// Analyze
const analysis = await vl.analyzeScreenshot(img);

// Update bot
await vl.updateBotKnowledge(botId, analysis);

// Auto-capture every 10s
vl.scheduleCapture(10000, canvas, botId);

// Stop
vl.stopScheduledCapture();

// Cleanup
vl.destroy();
```

## Environment Analyzer Cheat Sheet

```typescript
// Initialize
const ea = new EnvironmentAnalyzer(botPos, 32);

// Analyze
const insights = ea.analyzeWorld(worldData);
const resources = ea.findResources(worldData, 10);
const threats = ea.identifyThreats(worldData);
const explore = ea.suggestExploration(worldData, 5);

// Update
ea.updatePosition(newPos);
ea.setSightRange(64);

// Map
const map = ea.buildWorldMap(worldData);
const exported = ea.exportWorldMap();

// Cleanup
ea.destroy();
```

## Reinforcement Learner Cheat Sheet

```typescript
// Initialize
const rl = new ReinforcementLearner(
  ['move', 'gather', 'scan', 'idle'],
  10000
);

// Record experience
rl.recordAction(state, action, reward, nextState);

// Get action
const action = rl.getBestAction(state, true);

// Update
rl.updatePolicy(32);

// Query
const qValue = rl.getActionValue(state, action);
const stateValue = rl.getStateValue(state);

// Plan
const plan = rl.planActionSequence(state, 5);

// Stats
const stats = rl.getStats();

// Policy
rl.setPolicy({ learningRate: 0.2 });

// Persist
const exported = rl.exportQTable();
rl.importQTable(json);

// Reset
rl.reset();

// Cleanup
rl.destroy();
```

## Common Patterns

### Full Learning Loop

```typescript
const vl = new VisualLearner({ apiKey: KEY });
const ea = new EnvironmentAnalyzer(bot.position, 32);
const rl = new ReinforcementLearner();

async function update(worldData, canvas) {
  // Visual (periodic)
  if (shouldCapture()) {
    const img = vl.captureScreenshot(canvas);
    const vis = await vl.analyzeScreenshot(img);
  }

  // Environment (frequent)
  ea.updatePosition(bot.position);
  const res = ea.findResources(worldData);
  const threats = ea.identifyThreats(worldData);

  // RL decision
  const state = { energy: bot.energy, health: bot.health, ... };
  const action = rl.getBestAction(state);

  // Execute
  const reward = execute(action);
  const nextState = getState();

  // Learn
  rl.recordAction(state, action, reward, nextState);

  // Update policy
  if (steps % 20 === 0) rl.updatePolicy(32);
}
```

### Persistent Learning

```typescript
// Load
if (fs.existsSync('learning.json')) {
  rl.importQTable(fs.readFileSync('learning.json', 'utf8'));
}

// Save (periodic)
setInterval(() => {
  fs.writeFileSync('learning.json', rl.exportQTable());
}, 60000);
```

### Swarm Learning

```typescript
const sharedRL = new ReinforcementLearner();
const analyzers = new Map();

bots.forEach(bot => {
  analyzers.set(bot.id, new EnvironmentAnalyzer(bot.position, 32));
});

// Each bot uses shared RL
bots.forEach(bot => {
  const ea = analyzers.get(bot.id);
  const state = getState(bot, ea);
  const action = sharedRL.getBestAction(state);
  // execute...
});

// Update shared policy
sharedRL.updatePolicy(bots.length * 2);
```

## Configuration Defaults

### VisualLearner
- model: 'gemini-1.5-flash'
- confidenceThreshold: 0.5
- analyzeColors: true
- analyzePatterns: true
- extractText: true

### EnvironmentAnalyzer
- sightRange: 32
- resourceValueMap: { ENERGY_CRYSTAL: 10, DATA_NODE: 8, ... }

### ReinforcementLearner
- bufferSize: 10000
- explorationRate: 1.0
- learningRate: 0.1
- discountFactor: 0.95
- minExplorationRate: 0.01
- explorationDecay: 0.995

## Performance Tips

1. **Visual**: Capture every 5-10s, not every frame
2. **Environment**: Update position every frame, analyze every 30 frames
3. **RL**: Update policy every 10-50 steps
4. **Memory**: Clear history periodically
5. **Sight Range**: 16-64 units balances performance/coverage

## Common Issues

### Visual Learning
- **Low confidence**: Adjust threshold, improve prompt
- **Rate limits**: Reduce capture frequency
- **Memory**: Call `clearHistory()` periodically

### Environment Analysis
- **Missing resources**: Increase sight range
- **Performance**: Reduce sight range, update less
- **Bad paths**: Tune accessibility logic

### Reinforcement Learning
- **Not exploring**: Increase exploration rate
- **Not learning**: Check rewards, verify learning rate
- **Large Q-table**: Better state discretization
- **Overfitting**: Maintain exploration, use replay

## Testing

```bash
# Run full test suite
ts-node src/learning/test-suite.ts

# Run examples
ts-node examples/visual-learning-demo.ts
```

## Data Types Quick Reference

```typescript
// Visual
interface VisualLearningData {
  detectedElements: DetectedObject[];
  patterns: Pattern[];
  insights: string[];
  overallConfidence: number;
}

// Environment
interface WorldInsights {
  totalBlocks: number;
  explorationProgress: number;
  knownArea: number;
}

interface ResourceLocation {
  type: BlockType;
  position: Vector3;
  value: number;
  accessibility: number;
}

// RL
interface State {
  energy: number;
  health: number;
  position: Vector3;
  nearbyResources: number;
  nearbyThreats: number;
}

interface Action {
  type: string;
  parameters?: Record<string, any>;
}

interface LearningStats {
  totalTransitions: number;
  averageReward: number;
  explorationRate: number;
  qTableSize: number;
}
```

## Environment Variables

```bash
export GEMINI_API_KEY="your-api-key-here"
```

## Resources

- Full docs: `docs/VISUAL_LEARNING_GUIDE.md`
- Component docs: `src/learning/README.md`
- Examples: `examples/visual-learning-demo.ts`
- Tests: `src/learning/test-suite.ts`
