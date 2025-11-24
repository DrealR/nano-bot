/**
 * Learning System Test Suite
 *
 * Comprehensive tests for VisualLearner, EnvironmentAnalyzer,
 * and ReinforcementLearner components.
 */

import { VisualLearner } from './VisualLearner';
import { EnvironmentAnalyzer } from './EnvironmentAnalyzer';
import { ReinforcementLearner, State, Action } from './ReinforcementLearner';
import { WorldGenerator, BlockType } from '../world/WorldGenerator';

// Test utilities
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEquals<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

function assertGreaterThan(actual: number, threshold: number, message: string): void {
  if (actual <= threshold) {
    throw new Error(`${message}\nExpected > ${threshold}, got ${actual}`);
  }
}

function assertLessThan(actual: number, threshold: number, message: string): void {
  if (actual >= threshold) {
    throw new Error(`${message}\nExpected < ${threshold}, got ${actual}`);
  }
}

/**
 * Test VisualLearner
 */
function testVisualLearner(): void {
  console.log('\nTesting VisualLearner...');

  const learner = new VisualLearner({
    apiKey: 'test-key',
    confidenceThreshold: 0.5,
  });

  // Test initialization
  assert(learner !== null, 'VisualLearner should be created');
  console.log('  ✓ Initialization');

  // Test history
  assertEquals(learner.getCaptureHistory().length, 0, 'Initial history should be empty');
  console.log('  ✓ Empty history on init');

  // Test clear history
  learner.clearHistory();
  assertEquals(learner.getCaptureHistory().length, 0, 'History should be empty after clear');
  console.log('  ✓ Clear history');

  // Test last capture time
  const lastCaptureTime = learner.getLastCaptureTime();
  assertEquals(lastCaptureTime, 0, 'Last capture time should be 0 initially');
  console.log('  ✓ Last capture time');

  // Test export
  const exported = learner.exportLearningData();
  assert(exported.includes('learningData'), 'Export should contain learningData');
  assert(exported.includes('totalCaptures'), 'Export should contain totalCaptures');
  console.log('  ✓ Export learning data');

  learner.destroy();
  console.log('  ✓ Cleanup');
}

/**
 * Test EnvironmentAnalyzer
 */
function testEnvironmentAnalyzer(): void {
  console.log('\nTesting EnvironmentAnalyzer...');

  const botPosition = { x: 0, y: 0, z: 0 };
  const analyzer = new EnvironmentAnalyzer(botPosition, 32);

  // Test initialization
  assert(analyzer !== null, 'EnvironmentAnalyzer should be created');
  console.log('  ✓ Initialization');

  // Create test world data
  const worldGen = new WorldGenerator(12345, 16, 'cyberpunk');
  const chunks = [worldGen.generateChunk(0, 0, 0)];
  const worldData = {
    chunks,
    botPositions: new Map([['bot1', { x: 5, y: 0, z: 5 }]]),
  };

  // Test world analysis
  const insights = analyzer.analyzeWorld(worldData);
  assertGreaterThan(insights.totalBlocks, 0, 'Should have analyzed blocks');
  assert(insights.blockDistribution.size > 0, 'Should have block distribution');
  console.log('  ✓ World analysis');
  console.log(`    - Total blocks: ${insights.totalBlocks}`);
  console.log(`    - Known area: ${insights.knownArea}`);

  // Test resource finding
  const resources = analyzer.findResources(worldData, 5);
  assert(Array.isArray(resources), 'Resources should be an array');
  console.log('  ✓ Resource finding');
  console.log(`    - Found ${resources.length} resources`);

  // Test threat identification
  const threats = analyzer.identifyThreats(worldData);
  assert(Array.isArray(threats), 'Threats should be an array');
  console.log('  ✓ Threat identification');
  console.log(`    - Found ${threats.length} threats`);

  // Test exploration suggestions
  const suggestions = analyzer.suggestExploration(worldData, 3);
  assert(Array.isArray(suggestions), 'Suggestions should be an array');
  assertLessThan(suggestions.length, 4, 'Should not exceed requested count');
  console.log('  ✓ Exploration suggestions');
  console.log(`    - Generated ${suggestions.length} suggestions`);

  // Test world map building
  const worldMap = analyzer.buildWorldMap(worldData);
  assert(worldMap.visited.size > 0, 'Should have visited locations');
  assert(worldMap.lastUpdate > 0, 'Should have update timestamp');
  console.log('  ✓ World map building');
  console.log(`    - Visited: ${worldMap.visited.size} locations`);
  console.log(`    - Resources: ${worldMap.resources.size}`);
  console.log(`    - Safe zones: ${worldMap.safeZones.size}`);

  // Test position update
  analyzer.updatePosition({ x: 10, y: 5, z: 10 });
  console.log('  ✓ Position update');

  // Test sight range update
  analyzer.setSightRange(64);
  console.log('  ✓ Sight range update');

  // Test export
  const exported = analyzer.exportWorldMap();
  assert(exported.includes('visited'), 'Export should contain visited');
  assert(exported.includes('resources'), 'Export should contain resources');
  console.log('  ✓ Export world map');

  analyzer.destroy();
  console.log('  ✓ Cleanup');
}

/**
 * Test ReinforcementLearner
 */
function testReinforcementLearner(): void {
  console.log('\nTesting ReinforcementLearner...');

  const actionSpace = ['move', 'gather', 'scan', 'idle'];
  const learner = new ReinforcementLearner(actionSpace, 1000);

  // Test initialization
  assert(learner !== null, 'ReinforcementLearner should be created');
  console.log('  ✓ Initialization');

  // Test action space
  const actions = learner.getActionSpace();
  assertEquals(actions.length, 4, 'Should have 4 actions');
  assert(actions.includes('move'), 'Should include move action');
  console.log('  ✓ Action space');

  // Test add action
  learner.addAction('build');
  assertEquals(learner.getActionSpace().length, 5, 'Should have 5 actions after adding');
  console.log('  ✓ Add action');

  // Test remove action
  learner.removeAction('build');
  assertEquals(learner.getActionSpace().length, 4, 'Should have 4 actions after removing');
  console.log('  ✓ Remove action');

  // Test record action
  const state: State = {
    energy: 500,
    health: 100,
    position: { x: 0, y: 0, z: 0 },
    nearbyResources: 3,
    nearbyThreats: 1,
  };

  const action: Action = { type: 'gather' };
  const reward = 10;
  const nextState: State = {
    ...state,
    energy: 490,
    nearbyResources: 2,
  };

  learner.recordAction(state, action, reward, nextState, false);

  const stats = learner.getStats();
  assertEquals(stats.totalTransitions, 1, 'Should have 1 transition');
  assertEquals(stats.totalReward, 10, 'Total reward should be 10');
  console.log('  ✓ Record action');

  // Test get action value
  const qValue = learner.getActionValue(state, action);
  assert(typeof qValue === 'number', 'Q-value should be a number');
  console.log('  ✓ Get action value');
  console.log(`    - Q-value: ${qValue.toFixed(2)}`);

  // Test get best action
  const bestAction = learner.getBestAction(state, false);
  assert(bestAction !== null, 'Should return an action');
  assert(typeof bestAction.type === 'string', 'Action type should be a string');
  console.log('  ✓ Get best action');
  console.log(`    - Best action: ${bestAction.type}`);

  // Test state value
  const stateValue = learner.getStateValue(state);
  assert(typeof stateValue === 'number', 'State value should be a number');
  console.log('  ✓ Get state value');

  // Test multiple transitions
  for (let i = 0; i < 10; i++) {
    const testAction = learner.getBestAction(state, true);
    learner.recordAction(state, testAction, Math.random() * 10 - 5, nextState, false);
  }

  const updatedStats = learner.getStats();
  assertEquals(updatedStats.totalTransitions, 11, 'Should have 11 transitions');
  console.log('  ✓ Multiple transitions');

  // Test policy update
  learner.updatePolicy(5);
  const policy = learner.getPolicy();
  assertLessThan(policy.explorationRate, 1.0, 'Exploration rate should have decayed');
  console.log('  ✓ Policy update');
  console.log(`    - Exploration rate: ${(policy.explorationRate * 100).toFixed(1)}%`);

  // Test set policy
  learner.setPolicy({ learningRate: 0.2 });
  assertEquals(learner.getPolicy().learningRate, 0.2, 'Learning rate should be updated');
  console.log('  ✓ Set policy');

  // Test Q-table size
  const qTableSize = learner.getQTableSize();
  assertGreaterThan(qTableSize, 0, 'Q-table should have entries');
  console.log('  ✓ Q-table size');
  console.log(`    - Entries: ${qTableSize}`);

  // Test top actions
  const topActions = learner.getTopActions(3);
  assert(Array.isArray(topActions), 'Top actions should be an array');
  assertLessThan(topActions.length, 4, 'Should not exceed requested count');
  console.log('  ✓ Top actions');

  // Test action sequence planning
  const plan = learner.planActionSequence(state, 5);
  assertEquals(plan.length, 5, 'Should plan 5 actions');
  console.log('  ✓ Action sequence planning');
  console.log(`    - Planned: ${plan.map(a => a.type).join(' -> ')}`);

  // Test export
  const exported = learner.exportQTable();
  assert(exported.includes('qTable'), 'Export should contain qTable');
  assert(exported.includes('policy'), 'Export should contain policy');
  assert(exported.includes('stats'), 'Export should contain stats');
  console.log('  ✓ Export Q-table');

  // Test import
  learner.importQTable(exported);
  console.log('  ✓ Import Q-table');

  // Test reset
  learner.reset();
  const resetStats = learner.getStats();
  assertEquals(resetStats.totalTransitions, 0, 'Transitions should be 0 after reset');
  assertEquals(learner.getQTableSize(), 0, 'Q-table should be empty after reset');
  console.log('  ✓ Reset');

  // Test experience buffer access
  const buffer = learner.getExperienceBuffer();
  assert(buffer !== null, 'Should have access to experience buffer');
  console.log('  ✓ Experience buffer access');

  learner.destroy();
  console.log('  ✓ Cleanup');
}

/**
 * Test integration between components
 */
function testIntegration(): void {
  console.log('\nTesting Component Integration...');

  // Create all components
  const visualLearner = new VisualLearner({ apiKey: 'test-key' });
  const envAnalyzer = new EnvironmentAnalyzer({ x: 0, y: 0, z: 0 }, 32);
  const rlLearner = new ReinforcementLearner();

  // Create test world
  const worldGen = new WorldGenerator(Date.now(), 16, 'cyberpunk');
  const chunks = [worldGen.generateChunk(0, 0, 0)];
  const worldData = {
    chunks,
    botPositions: new Map([['bot1', { x: 0, y: 0, z: 0 }]]),
  };

  // Environment analysis
  const insights = envAnalyzer.analyzeWorld(worldData);
  const resources = envAnalyzer.findResources(worldData, 5);

  console.log('  ✓ Environment analysis completed');

  // RL decision making
  const state: State = {
    energy: 500,
    health: 100,
    position: { x: 0, y: 0, z: 0 },
    nearbyResources: resources.length,
    nearbyThreats: 0,
  };

  const action = rlLearner.getBestAction(state, false);
  const reward = resources.length > 0 ? 10 : -1;

  rlLearner.recordAction(state, action, reward, state, false);

  console.log('  ✓ RL decision making completed');
  console.log(`    - Action: ${action.type}`);
  console.log(`    - Reward: ${reward}`);

  // Visual learning data structure
  const visualData = {
    id: 'test-id',
    botId: 'bot1',
    timestamp: Date.now(),
    screenshotPath: '',
    detectedElements: [],
    patterns: [],
    textContent: [],
    colorAnalysis: {
      dominant: [],
      palette: [],
      contrast: 0.5,
    },
    layoutStructure: {
      type: 'grid' as const,
      regions: [],
    },
    insights: [`Found ${resources.length} resources`, `Energy at ${state.energy}`],
    overallConfidence: 0.8,
    modelUsed: 'gemini-1.5-flash',
    processingTime: 100,
  };

  assert(visualData.insights.length > 0, 'Should have insights');
  console.log('  ✓ Visual learning data structure valid');

  // Cleanup
  visualLearner.destroy();
  envAnalyzer.destroy();
  rlLearner.destroy();

  console.log('  ✓ Integration test passed');
}

/**
 * Run all tests
 */
function runAllTests(): void {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           NanoBot Learning System Test Suite                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  const tests = [
    { name: 'VisualLearner', fn: testVisualLearner },
    { name: 'EnvironmentAnalyzer', fn: testEnvironmentAnalyzer },
    { name: 'ReinforcementLearner', fn: testReinforcementLearner },
    { name: 'Integration', fn: testIntegration },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      test.fn();
      passed++;
      console.log(`\n✅ ${test.name} tests passed`);
    } catch (error) {
      failed++;
      console.error(`\n❌ ${test.name} tests failed:`, error);
    }
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  Test Results: ${passed} passed, ${failed} failed                        ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests();
}

export { runAllTests, testVisualLearner, testEnvironmentAnalyzer, testReinforcementLearner, testIntegration };
