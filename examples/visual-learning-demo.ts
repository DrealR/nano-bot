/**
 * Visual Learning Demo
 *
 * Demonstrates the visual learning capabilities of NanoBots, including:
 * - Screenshot capture and analysis
 * - Environment analysis from world data
 * - Reinforcement learning for action optimization
 * - Integration with bot memory and decision making
 */

import { NanoBot } from '../src/core/NanoBot';
import { VisualLearner } from '../src/learning/VisualLearner';
import { EnvironmentAnalyzer } from '../src/learning/EnvironmentAnalyzer';
import { ReinforcementLearner, State } from '../src/learning/ReinforcementLearner';
import { WorldGenerator } from '../src/world/WorldGenerator';
import { VisualLearningData } from '../src/core/types';

/**
 * Example 1: Visual Learning from Screenshots
 */
async function visualLearningExample() {
  console.log('\n=== Visual Learning Example ===\n');

  // Create a visual learner with Gemini
  const visualLearner = new VisualLearner({
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-1.5-flash',
    confidenceThreshold: 0.6,
    analyzeColors: true,
    analyzePatterns: true,
    extractText: true,
  });

  // Create a bot
  const bot = new NanoBot({
    position: { x: 0, y: 0, z: 0 },
    aiProvider: 'gemini',
    apiKey: process.env.GEMINI_API_KEY || '',
  });

  // Simulate capturing a screenshot (in real use, you'd pass an actual canvas)
  // For this example, we'll use a placeholder
  console.log('Capturing screenshot...');

  // In a real application with a canvas:
  // const canvas = renderer.domElement;
  // const screenshot = visualLearner.captureScreenshot(canvas, {
  //   quality: 0.95,
  //   format: 'png',
  //   scale: 1,
  // });

  // For demo purposes, let's simulate analyzing a screenshot
  console.log('Analyzing screenshot with Gemini Vision...');

  // This would be the base64 data from a real screenshot
  // const analysis = await visualLearner.analyzeScreenshot(screenshot);

  // Update bot knowledge with visual learning
  // const learningData = await visualLearner.updateBotKnowledge(
  //   bot.id,
  //   analysis,
  //   (data: VisualLearningData) => {
  //     console.log('\nVisual Learning Results:');
  //     console.log(`- Detected ${data.detectedElements.length} objects`);
  //     console.log(`- Found ${data.patterns.length} patterns`);
  //     console.log(`- Extracted ${data.textContent.length} text elements`);
  //     console.log(`- Overall confidence: ${(data.overallConfidence * 100).toFixed(1)}%`);
  //     console.log(`- Processing time: ${data.processingTime}ms`);
  //
  //     // Add to bot memory
  //     bot.learn({
  //       type: 'learning',
  //       description: `Visual analysis: ${data.insights.join(', ')}`,
  //       outcome: 'positive',
  //       importance: data.overallConfidence,
  //       context: { visualData: data },
  //     });
  //   }
  // );

  // Schedule automatic captures every 5 seconds
  // visualLearner.scheduleCapture(
  //   5000,
  //   canvas,
  //   bot.id,
  //   (data) => {
  //     console.log(`Auto-capture completed: ${data.detectedElements.length} objects detected`);
  //   }
  // );

  console.log('\nVisual learner configured for bot:', bot.id);
  console.log('Note: Connect to actual canvas to enable screenshot capture');

  // Clean up
  visualLearner.destroy();
}

/**
 * Example 2: Environment Analysis
 */
async function environmentAnalysisExample() {
  console.log('\n=== Environment Analysis Example ===\n');

  // Create a world generator
  const worldGen = new WorldGenerator(12345, 16, 'cyberpunk');

  // Generate some chunks
  const chunks = [
    worldGen.generateChunk(0, 0, 0),
    worldGen.generateChunk(1, 0, 0),
    worldGen.generateChunk(0, 0, 1),
  ];

  // Create environment analyzer
  const botPosition = { x: 8, y: 0, z: 8 };
  const analyzer = new EnvironmentAnalyzer(botPosition, 32);

  // Create world data
  const worldData = {
    chunks,
    botPositions: new Map([
      ['bot1', { x: 10, y: 0, z: 10 }],
      ['bot2', { x: -5, y: 2, z: 15 }],
    ]),
  };

  // Analyze the world
  console.log('Analyzing world environment...');
  const insights = analyzer.analyzeWorld(worldData);

  console.log('\nWorld Insights:');
  console.log(`- Total blocks: ${insights.totalBlocks}`);
  console.log(`- Average height: ${insights.averageHeight.toFixed(2)}`);
  console.log(`- Exploration progress: ${(insights.explorationProgress * 100).toFixed(1)}%`);
  console.log(`- Known area: ${insights.knownArea} blocks`);

  console.log('\nBlock Distribution:');
  insights.blockDistribution.forEach((count, type) => {
    console.log(`  - Type ${type}: ${count} blocks`);
  });

  // Find resources
  console.log('\nFinding resources...');
  const resources = analyzer.findResources(worldData, 5);

  console.log(`Found ${resources.length} resources:`);
  resources.forEach((resource, index) => {
    console.log(`  ${index + 1}. Type: ${resource.type}, Distance: ${resource.distance.toFixed(1)}m, Value: ${resource.value}, Accessibility: ${(resource.accessibility * 100).toFixed(1)}%`);
  });

  // Identify threats
  console.log('\nIdentifying threats...');
  const threats = analyzer.identifyThreats(worldData);

  console.log(`Found ${threats.length} threats:`);
  threats.forEach((threat, index) => {
    console.log(`  ${index + 1}. ${threat.type}: ${threat.description} (Severity: ${(threat.severity * 100).toFixed(1)}%, Distance: ${threat.distance.toFixed(1)}m)`);
  });

  // Suggest exploration
  console.log('\nGenerating exploration suggestions...');
  const suggestions = analyzer.suggestExploration(worldData, 3);

  console.log(`Top ${suggestions.length} exploration targets:`);
  suggestions.forEach((suggestion, index) => {
    console.log(`  ${index + 1}. Priority: ${suggestion.priority.toFixed(1)}/10`);
    console.log(`     Position: (${suggestion.position.x.toFixed(1)}, ${suggestion.position.y.toFixed(1)}, ${suggestion.position.z.toFixed(1)})`);
    console.log(`     Reasoning: ${suggestion.reasoning}`);
    console.log(`     Reward: ${(suggestion.estimatedReward * 100).toFixed(1)}%, Risk: ${(suggestion.estimatedRisk * 100).toFixed(1)}%`);
  });

  // Build world map
  console.log('\nBuilding internal world map...');
  const worldMap = analyzer.buildWorldMap(worldData);

  console.log(`World map updated:`);
  console.log(`  - Visited locations: ${worldMap.visited.size}`);
  console.log(`  - Known resources: ${worldMap.resources.size}`);
  console.log(`  - Known threats: ${worldMap.threats.size}`);
  console.log(`  - Safe zones: ${worldMap.safeZones.size}`);
  console.log(`  - Danger zones: ${worldMap.dangerZones.size}`);

  // Clean up
  analyzer.destroy();
}

/**
 * Example 3: Reinforcement Learning
 */
async function reinforcementLearningExample() {
  console.log('\n=== Reinforcement Learning Example ===\n');

  // Create reinforcement learner
  const rlLearner = new ReinforcementLearner(
    ['move', 'gather', 'scan', 'build', 'replicate', 'idle'],
    10000
  );

  console.log('Training bot with reinforcement learning...\n');

  // Simulate learning episodes
  const numEpisodes = 100;

  for (let episode = 0; episode < numEpisodes; episode++) {
    // Initial state
    let state: State = {
      energy: 1000,
      health: 100,
      position: { x: 0, y: 0, z: 0 },
      nearbyResources: Math.floor(Math.random() * 5),
      nearbyThreats: Math.floor(Math.random() * 3),
    };

    const episodeSteps = 10;

    for (let step = 0; step < episodeSteps; step++) {
      // Choose action using epsilon-greedy
      const action = rlLearner.getBestAction(state, true);

      // Simulate environment response
      const reward = calculateReward(state, action);
      const nextState = simulateNextState(state, action);
      const done = nextState.energy <= 0 || nextState.health <= 0;

      // Record transition
      rlLearner.recordAction(state, action, reward, nextState, done);

      state = nextState;

      if (done) break;
    }

    // Update policy every 10 episodes
    if (episode % 10 === 0) {
      rlLearner.updatePolicy(32);

      if (episode % 20 === 0) {
        const stats = rlLearner.getStats();
        console.log(`Episode ${episode}:`);
        console.log(`  - Avg Reward: ${stats.averageReward.toFixed(2)}`);
        console.log(`  - Exploration Rate: ${(stats.explorationRate * 100).toFixed(1)}%`);
        console.log(`  - Q-Table Size: ${stats.qTableSize}`);
      }
    }
  }

  // Final statistics
  console.log('\nTraining complete!');
  const finalStats = rlLearner.getStats();
  console.log('\nFinal Statistics:');
  console.log(`  - Total Transitions: ${finalStats.totalTransitions}`);
  console.log(`  - Average Reward: ${finalStats.averageReward.toFixed(2)}`);
  console.log(`  - Best Reward: ${finalStats.bestReward.toFixed(2)}`);
  console.log(`  - Worst Reward: ${finalStats.worstReward.toFixed(2)}`);
  console.log(`  - Exploration Rate: ${(finalStats.explorationRate * 100).toFixed(1)}%`);
  console.log(`  - Q-Table Size: ${finalStats.qTableSize}`);

  // Test learned policy
  console.log('\nTesting learned policy:');
  const testState: State = {
    energy: 500,
    health: 80,
    position: { x: 10, y: 5, z: 10 },
    nearbyResources: 3,
    nearbyThreats: 1,
  };

  const bestAction = rlLearner.getBestAction(testState, false);
  const actionValue = rlLearner.getActionValue(testState, bestAction);
  const stateValue = rlLearner.getStateValue(testState);

  console.log(`  - State: Energy=${testState.energy}, Health=${testState.health}, Resources=${testState.nearbyResources}`);
  console.log(`  - Best Action: ${bestAction.type}`);
  console.log(`  - Action Q-Value: ${actionValue.toFixed(2)}`);
  console.log(`  - State Value: ${stateValue.toFixed(2)}`);

  // Plan action sequence
  console.log('\nPlanned action sequence (5 steps):');
  const plan = rlLearner.planActionSequence(testState, 5);
  plan.forEach((action, index) => {
    console.log(`  ${index + 1}. ${action.type}`);
  });

  // Top learned state-action pairs
  console.log('\nTop 5 learned state-action pairs:');
  const topActions = rlLearner.getTopActions(5);
  topActions.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.stateAction}: Q=${item.qValue.toFixed(2)}`);
  });

  // Clean up
  rlLearner.destroy();
}

/**
 * Example 4: Integrated Learning
 */
async function integratedLearningExample() {
  console.log('\n=== Integrated Learning Example ===\n');

  // Create a bot with all learning capabilities
  const bot = new NanoBot({
    position: { x: 0, y: 0, z: 0 },
    aiProvider: 'gemini',
    apiKey: process.env.GEMINI_API_KEY || '',
  });

  // Create learning systems
  const visualLearner = new VisualLearner({
    apiKey: process.env.GEMINI_API_KEY || '',
  });

  const envAnalyzer = new EnvironmentAnalyzer(bot.position, 32);

  const rlLearner = new ReinforcementLearner();

  console.log('Bot created with integrated learning systems');
  console.log(`Bot ID: ${bot.id}`);

  // Simulate a learning cycle
  console.log('\nSimulating learning cycle...');

  // 1. Environment analysis
  const worldGen = new WorldGenerator(Date.now(), 16, 'cyberpunk');
  const chunks = [worldGen.generateChunk(0, 0, 0)];
  const worldData = {
    chunks,
    botPositions: new Map([[bot.id, bot.position]]),
  };

  const resources = envAnalyzer.findResources(worldData, 3);
  console.log(`\n1. Environment Analysis: Found ${resources.length} resources`);

  // 2. RL decision making
  const state: State = {
    energy: bot.energy,
    health: bot.health,
    position: bot.position,
    nearbyResources: resources.length,
    nearbyThreats: 0,
  };

  const action = rlLearner.getBestAction(state, false);
  console.log(`\n2. RL Decision: Suggested action - ${action.type}`);

  // 3. Execute action and learn
  const reward = resources.length > 0 ? 10 : -1;
  const nextState = { ...state, energy: state.energy - 5 };

  rlLearner.recordAction(state, action, reward, nextState, false);
  console.log(`\n3. Learning: Recorded action with reward ${reward}`);

  // 4. Update bot memory
  bot.learn({
    type: 'task',
    description: `Executed ${action.type} action with ${resources.length} nearby resources`,
    outcome: reward > 0 ? 'positive' : 'negative',
    importance: Math.abs(reward) / 10,
    context: { action, state, reward },
  });

  console.log(`\n4. Memory Update: Bot learned from experience`);
  console.log(`   - Total experiences: ${bot.memory.experiences.length}`);
  console.log(`   - Knowledge entries: ${bot.memory.knowledge.length}`);

  // Get bot status
  const status = bot.getStatus();
  console.log('\nBot Status:');
  console.log(`  - Energy: ${status.energy.toFixed(1)}`);
  console.log(`  - Health: ${status.health.toFixed(1)}`);
  console.log(`  - Experiences: ${status.experienceCount}`);
  console.log(`  - Knowledge: ${status.knowledgeCount}`);

  // Clean up
  visualLearner.destroy();
  envAnalyzer.destroy();
  rlLearner.destroy();
  bot.destroy();
}

// Helper functions for RL simulation

function calculateReward(state: State, action: { type: string }): number {
  let reward = 0;

  switch (action.type) {
    case 'gather':
      // Reward for gathering when resources are nearby
      reward = state.nearbyResources > 0 ? 10 : -5;
      break;
    case 'scan':
      // Small reward for scanning
      reward = 2;
      break;
    case 'move':
      // Small cost for moving
      reward = -1;
      break;
    case 'build':
      // Reward for building if energy is sufficient
      reward = state.energy > 200 ? 5 : -10;
      break;
    case 'replicate':
      // Large reward for replicating if energy is high
      reward = state.energy > 500 ? 20 : -20;
      break;
    case 'idle':
      // Small reward for idling when energy is low
      reward = state.energy < 200 ? 3 : -2;
      break;
  }

  // Penalty for low energy
  if (state.energy < 100) {
    reward -= 5;
  }

  // Penalty for threats
  if (state.nearbyThreats > 0) {
    reward -= state.nearbyThreats * 3;
  }

  return reward;
}

function simulateNextState(state: State, action: { type: string }): State {
  const nextState: State = { ...state };

  switch (action.type) {
    case 'gather':
      nextState.energy = Math.max(0, state.energy - 10);
      nextState.nearbyResources = Math.max(0, state.nearbyResources - 1);
      break;
    case 'scan':
      nextState.energy = Math.max(0, state.energy - 5);
      break;
    case 'move':
      nextState.energy = Math.max(0, state.energy - 5);
      nextState.position = {
        x: state.position.x + (Math.random() - 0.5) * 10,
        y: state.position.y,
        z: state.position.z + (Math.random() - 0.5) * 10,
      };
      break;
    case 'build':
      nextState.energy = Math.max(0, state.energy - 20);
      break;
    case 'replicate':
      nextState.energy = Math.max(0, state.energy - 300);
      break;
    case 'idle':
      nextState.energy = Math.min(1000, state.energy + 5);
      break;
  }

  return nextState;
}

// Main execution
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         NanoBot Visual Learning System Demo                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  try {
    // Run examples
    await visualLearningExample();
    await environmentAnalysisExample();
    await reinforcementLearningExample();
    await integratedLearningExample();

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    Demo Complete!                            ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('Demo error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export {
  visualLearningExample,
  environmentAnalysisExample,
  reinforcementLearningExample,
  integratedLearningExample,
};
