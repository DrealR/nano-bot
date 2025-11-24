/**
 * AI System Usage Examples
 * Demonstrates how to use the NanoBot AI abstraction layer
 */

import { NanoBotBrain, createProvider, createGeminiProvider } from './index';
import type { ThinkingContext } from './brain';

/**
 * Example 1: Create and use a NanoBot brain with Groq (default)
 */
export async function example1_BasicBrain() {
  // Create a brain with default settings (Groq provider)
  const brain = new NanoBotBrain({
    providerType: 'groq',
    personality: 'explorer',
    creativityLevel: 0.7,
  });

  // Create a context for the bot
  const context: ThinkingContext = {
    botId: 'nano-001',
    position: { x: 10, y: 5, z: 15 },
    energy: 75,
    health: 90,
    nearbyResources: [
      { type: 'energy_crystal', distance: 5.2, value: 100 },
      { type: 'metal_ore', distance: 8.5, value: 50 },
    ],
    currentGoal: 'Gather resources',
  };

  // Think about the situation
  const thoughts = await brain.think(context);
  console.log('Bot thoughts:', thoughts);

  // Make a decision
  const decision = await brain.decide(context);
  console.log('Bot decision:', decision);

  // Analyze the environment
  const analysis = await brain.analyzeEnvironment(context);
  console.log('Environment analysis:', analysis);

  // Create an action plan
  const plan = await brain.planAction('Build a resource depot', context);
  console.log('Action plan:', plan);
}

/**
 * Example 2: Using different AI providers
 */
export async function example2_MultipleProviders() {
  // Create providers directly
  const groqProvider = createProvider({
    type: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
  });

  const openRouterProvider = createProvider({
    type: 'openrouter',
    model: 'meta-llama/llama-3.3-70b-instruct',
    siteName: 'NanoBot Framework',
    siteUrl: 'https://nanobot.local',
  });

  // Use them for direct chat
  const response1 = await groqProvider.chat([
    { role: 'user', content: 'What should a nanobot do when energy is low?' },
  ]);
  console.log('Groq response:', response1.content);

  const response2 = await openRouterProvider.chat([
    { role: 'user', content: 'What should a nanobot do when energy is low?' },
  ]);
  console.log('OpenRouter response:', response2.content);
}

/**
 * Example 3: Using Gemini with vision capabilities
 */
export async function example3_GeminiVision() {
  // Create Gemini provider
  const geminiProvider = createGeminiProvider();

  // Analyze an image (e.g., screenshot of the 3D environment)
  // In a real scenario, you would get this from a canvas screenshot
  const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='; // Example

  try {
    const imageAnalysis = await geminiProvider.analyzeImage(
      base64Image,
      'Analyze this voxel environment. What structures or resources are visible?'
    );

    console.log('Image analysis:', imageAnalysis);
    console.log('Detected objects:', imageAnalysis.detectedObjects);
    console.log('Colors:', imageAnalysis.colors);
  } catch (error) {
    console.error('Vision analysis error:', error);
  }

  // Generate embeddings for semantic search
  const embedding = await geminiProvider.generateEmbedding(
    'NanoBot exploring voxel world looking for energy crystals'
  );
  console.log('Embedding dimension:', embedding.length);
}

/**
 * Example 4: Different bot personalities
 */
export async function example4_Personalities() {
  const personalities = ['aggressive', 'defensive', 'explorer', 'builder', 'social'] as const;

  const context: ThinkingContext = {
    botId: 'nano-002',
    position: { x: 0, y: 0, z: 0 },
    energy: 50,
    health: 80,
    nearbyBots: [
      { id: 'nano-003', distance: 3.5, type: 'worker' },
      { id: 'nano-004', distance: 7.2, type: 'scout' },
    ],
    threats: [
      { type: 'hostile_bot', distance: 15.0, severity: 0.7 },
    ],
  };

  for (const personality of personalities) {
    const brain = new NanoBotBrain({
      personality,
      creativityLevel: 0.8,
    });

    const decision = await brain.decide(context);
    console.log(`${personality} bot decision:`, decision.action, '-', decision.reasoning);
  }
}

/**
 * Example 5: Advanced brain usage with memory
 */
export async function example5_MemoryAndContext() {
  const brain = new NanoBotBrain({
    personality: 'builder',
    creativityLevel: 0.6,
  });

  // Simulate a sequence of decisions with memory
  const contexts: ThinkingContext[] = [
    {
      botId: 'nano-005',
      position: { x: 0, y: 0, z: 0 },
      energy: 100,
      health: 100,
      currentGoal: 'Start building',
      memorySnapshot: [],
    },
    {
      botId: 'nano-005',
      position: { x: 2, y: 0, z: 1 },
      energy: 90,
      health: 100,
      currentGoal: 'Continue building',
      memorySnapshot: ['Found good building location', 'Started foundation'],
    },
    {
      botId: 'nano-005',
      position: { x: 2, y: 2, z: 1 },
      energy: 70,
      health: 100,
      currentGoal: 'Complete structure',
      memorySnapshot: [
        'Found good building location',
        'Started foundation',
        'Built 3 walls',
      ],
    },
  ];

  for (const context of contexts) {
    const thoughts = await brain.think(context);
    const decision = await brain.decide(context);

    console.log('\n--- Time step ---');
    console.log('Energy:', context.energy);
    console.log('Thoughts:', thoughts);
    console.log('Decision:', decision.action);
  }
}

/**
 * Example 6: Provider analysis capabilities
 */
export async function example6_DataAnalysis() {
  const provider = createProvider({
    type: 'groq',
    temperature: 0.5, // Lower temperature for analytical tasks
  });

  // Analyze bot swarm data
  const swarmData = {
    totalBots: 25,
    activeBuilders: 8,
    scouts: 5,
    workers: 12,
    averageEnergy: 68.5,
    resourcesGathered: 1250,
    structuresBuilt: 15,
    threatsDetected: 3,
    explorationProgress: 0.45,
  };

  const analysis = await provider.analyze(
    'Analyze this nanobot swarm performance and provide optimization recommendations',
    swarmData
  );

  console.log('Swarm Analysis:');
  console.log('Summary:', analysis.summary);
  console.log('Insights:', analysis.insights);
  console.log('Confidence:', analysis.confidence);
}

/**
 * Example 7: Error handling and fallbacks
 */
export async function example7_ErrorHandling() {
  try {
    // Create a brain with invalid config (no API key in env)
    const brain = new NanoBotBrain({
      providerType: 'groq',
      apiKey: '', // Invalid
    });

    // This will fail gracefully
    const decision = await brain.decide({
      botId: 'nano-006',
      position: { x: 0, y: 0, z: 0 },
      energy: 50,
      health: 50,
    });

    console.log('Fallback decision:', decision);
  } catch (error) {
    console.error('Expected error:', error);
  }
}

/**
 * Main example runner
 */
async function runExamples() {
  console.log('=== NanoBot AI System Examples ===\n');

  try {
    console.log('\n1. Basic Brain Usage:');
    await example1_BasicBrain();

    console.log('\n2. Multiple Providers:');
    await example2_MultipleProviders();

    console.log('\n3. Gemini Vision:');
    await example3_GeminiVision();

    console.log('\n4. Different Personalities:');
    await example4_Personalities();

    console.log('\n5. Memory and Context:');
    await example5_MemoryAndContext();

    console.log('\n6. Data Analysis:');
    await example6_DataAnalysis();

    console.log('\n7. Error Handling:');
    await example7_ErrorHandling();
  } catch (error) {
    console.error('Example error:', error);
  }
}

// Uncomment to run examples
// runExamples();
