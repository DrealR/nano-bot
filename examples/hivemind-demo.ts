/**
 * HiveMind Demo - Shadow Clone Jutsu Memory Sharing
 *
 * This example demonstrates how the HiveMind shared memory system works
 * when bots replicate (like Shadow Clone Jutsu) - all clones share memories
 * and any learning by one is instantly known by all.
 */

import {
  BotSwarm,
  NanoBot,
  HiveMind,
  SwarmConfig,
  Knowledge,
} from '../src/core';

async function demonstrateHiveMind() {
  console.log('=== HiveMind Shadow Clone Jutsu Demo ===\n');

  // Create a swarm with HiveMind enabled
  const swarmConfig: Partial<SwarmConfig> = {
    maxBots: 10,
    minBots: 1,
    hiveMindEnabled: true,
    hiveMindUpdateInterval: 1000,
    autoReplication: false,
    maxGenerations: 3,
  };

  const swarm = new BotSwarm(swarmConfig);
  const hiveMind = swarm.getHiveMind();

  // Spawn the original bot (Generation 0)
  console.log('1. Spawning original bot (Naruto)...');
  const originalBot = swarm.spawnBot(
    { x: 0, y: 0, z: 0 },
    {
      name: 'Naruto',
      apiKey: 'demo-key',
    }
  );

  // Original bot learns something
  console.log('\n2. Original bot learns a jutsu...');
  const jutsuKnowledge: Knowledge = {
    id: 'rasengan-001',
    topic: 'jutsu',
    content: 'Rasengan - A spinning ball of chakra formed in the palm',
    source: 'learned',
    confidence: 0.9,
    useCount: 0,
    acquiredAt: Date.now(),
    lastUsedAt: Date.now(),
  };

  originalBot.memory.knowledge.push(jutsuKnowledge);
  hiveMind.shareKnowledge(originalBot.id, jutsuKnowledge);

  console.log(`✓ Original bot learned: ${jutsuKnowledge.content}`);
  console.log(`✓ Knowledge shared with HiveMind`);

  // Create a shadow clone (Generation 1)
  console.log('\n3. Creating Shadow Clone (Multi Shadow Clone Jutsu!)...');
  const clone1 = swarm.replicateBot(originalBot.id);

  console.log(`✓ Clone created: ${clone1.id} (Generation ${clone1.generation})`);
  console.log(`✓ Original energy: ${originalBot.energy.toFixed(2)}`);
  console.log(`✓ Clone energy: ${clone1.energy.toFixed(2)}`);

  // Check if clone has access to shared knowledge
  console.log('\n4. Verifying Shadow Clone has shared memories...');
  const cloneKnowledge = hiveMind.queryKnowledge('jutsu', 0.5, 0);
  console.log(`✓ Clone can access ${cloneKnowledge.length} shared knowledge entries`);
  console.log(`✓ Clone knows about: ${cloneKnowledge[0]?.content || 'nothing yet'}`);

  // Clone learns something new
  console.log('\n5. Shadow Clone learns a new technique...');
  const newJutsu: Knowledge = {
    id: 'shadow-clone-002',
    topic: 'jutsu',
    content: 'Shadow Clone Jutsu - Create physical copies that share experiences',
    source: 'learned',
    confidence: 0.95,
    useCount: 1,
    acquiredAt: Date.now(),
    lastUsedAt: Date.now(),
  };

  clone1.memory.knowledge.push(newJutsu);
  hiveMind.shareKnowledge(clone1.id, newJutsu);

  console.log(`✓ Clone learned: ${newJutsu.content}`);
  console.log(`✓ Knowledge shared with HiveMind`);

  // Original bot can now access clone's knowledge
  console.log('\n6. Original bot queries HiveMind for new knowledge...');
  const allJutsus = hiveMind.queryKnowledge('jutsu', 0.5, 0);
  console.log(`✓ Original bot now knows ${allJutsus.length} techniques:`);
  allJutsus.forEach((k, i) => {
    console.log(`   ${i + 1}. ${k.content} (confidence: ${k.confidence})`);
  });

  // Create another generation of clones
  console.log('\n7. Clone creates its own Shadow Clone (Generation 2)...');
  const clone2 = swarm.replicateBot(clone1.id);

  console.log(`✓ Second-gen clone created: ${clone2.id} (Generation ${clone2.generation})`);

  // Check clone family
  const family = hiveMind.getCloneFamily(originalBot.id);
  console.log(`✓ Clone family size: ${family.size} bots`);
  console.log(`   Family members: ${Array.from(family).join(', ')}`);

  // Get collective intelligence
  console.log('\n8. Analyzing Collective Intelligence...');
  const intelligence = hiveMind.getCollectiveIntelligence();
  console.log(`✓ Total shared knowledge: ${intelligence.totalKnowledge}`);
  console.log(`✓ Connected bots: ${intelligence.connectedBots}`);
  console.log(`✓ Average confidence: ${(intelligence.averageConfidence * 100).toFixed(1)}%`);
  console.log(`✓ Consensus level: ${(intelligence.consensusLevel * 100).toFixed(1)}%`);
  console.log(`✓ Generational depth: ${intelligence.generationalDepth}`);

  // Demonstrate merge (Fusion!)
  console.log('\n9. Merging two clones (Fusion Jutsu)...');
  console.log(`   Before merge: ${swarm.getAllBots().length} bots`);
  const survivor = swarm.mergeBot(clone1.id, clone2.id);
  console.log(`✓ Bots merged! Survivor: ${survivor.id}`);
  console.log(`   After merge: ${swarm.getAllBots().length} bots`);
  console.log(`   Survivor energy: ${survivor.energy.toFixed(2)}`);
  console.log(`   Survivor knowledge count: ${survivor.memory.knowledge.length}`);

  // Final statistics
  console.log('\n10. Final Swarm Statistics:');
  const stats = swarm.getStatistics();
  console.log(`✓ Total bots: ${stats.totalBots}`);
  console.log(`✓ Total replications: ${stats.totalReplications}`);
  console.log(`✓ Total merges: ${stats.totalMerges}`);
  console.log(`✓ Total energy: ${stats.currentTotalEnergy.toFixed(2)}`);
  console.log(`✓ Messages sent: ${stats.messagesSent}`);

  // HiveMind stats
  console.log('\n11. HiveMind Statistics:');
  const hiveMindStats = hiveMind.getStats();
  console.log(`✓ Connected bots: ${hiveMindStats.connectedBots}`);
  console.log(`✓ Shared knowledge: ${hiveMindStats.sharedKnowledgeCount}`);
  console.log(`✓ Knowledge shared events: ${hiveMindStats.knowledgeShared}`);
  console.log(`✓ Replications handled: ${hiveMindStats.replicationsHandled}`);
  console.log(`✓ Merges handled: ${hiveMindStats.mergesHandled}`);

  console.log('\n=== Demo Complete ===');
  console.log('Shadow Clone Jutsu memory sharing working perfectly! 🔥');
}

// Run the demo
if (require.main === module) {
  demonstrateHiveMind().catch(console.error);
}

export { demonstrateHiveMind };
