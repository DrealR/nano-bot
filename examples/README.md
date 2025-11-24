# HiveMind Examples

This directory contains examples demonstrating the HiveMind shared memory system.

## Running the Examples

### Prerequisites

```bash
npm install
npm run build
```

### HiveMind Demo (Shadow Clone Jutsu)

Demonstrates the core Shadow Clone Jutsu concept - when bots replicate, they share memories:

```bash
ts-node examples/hivemind-demo.ts
```

**What it demonstrates:**
1. Creating a bot swarm with HiveMind enabled
2. Original bot learning knowledge
3. Creating shadow clones that inherit memories
4. Clones learning new knowledge and sharing back
5. Multi-generational cloning (clones creating clones)
6. Clone family tracking
7. Merging bots (Fusion Jutsu)
8. Collective intelligence metrics

### Expected Output

```
=== HiveMind Shadow Clone Jutsu Demo ===

1. Spawning original bot (Naruto)...

2. Original bot learns a jutsu...
✓ Original bot learned: Rasengan - A spinning ball of chakra formed in the palm
✓ Knowledge shared with HiveMind

3. Creating Shadow Clone (Multi Shadow Clone Jutsu!)...
✓ Clone created: bot-2 (Generation 1)
✓ Original energy: 500.00
✓ Clone energy: 500.00

4. Verifying Shadow Clone has shared memories...
✓ Clone can access 1 shared knowledge entries
✓ Clone knows about: Rasengan - A spinning ball of chakra formed in the palm

5. Shadow Clone learns a new technique...
✓ Clone learned: Shadow Clone Jutsu - Create physical copies that share experiences
✓ Knowledge shared with HiveMind

6. Original bot queries HiveMind for new knowledge...
✓ Original bot now knows 2 techniques:
   1. Shadow Clone Jutsu - Create physical copies that share experiences (confidence: 0.95)
   2. Rasengan - A spinning ball of chakra formed in the palm (confidence: 0.9)

7. Clone creates its own Shadow Clone (Generation 2)...
✓ Second-gen clone created: bot-3 (Generation 2)
✓ Clone family size: 3 bots
   Family members: bot-1, bot-2, bot-3

8. Analyzing Collective Intelligence...
✓ Total shared knowledge: 2
✓ Connected bots: 3
✓ Average confidence: 92.5%
✓ Consensus level: 66.7%
✓ Generational depth: 2

9. Merging two clones (Fusion Jutsu)...
   Before merge: 3 bots
✓ Bots merged! Survivor: bot-2
   After merge: 2 bots
   Survivor energy: XXX
   Survivor knowledge count: X

10. Final Swarm Statistics:
✓ Total bots: 2
✓ Total replications: 2
✓ Total merges: 1
✓ Total energy: XXX
✓ Messages sent: XX

11. HiveMind Statistics:
✓ Connected bots: 2
✓ Shared knowledge: 2
✓ Knowledge shared events: 2
✓ Replications handled: 2
✓ Merges handled: 1

=== Demo Complete ===
Shadow Clone Jutsu memory sharing working perfectly! 🔥
```

## Quick Start Code Snippets

### Basic Setup

```typescript
import { BotSwarm, HiveMind } from '../src/core';

const swarm = new BotSwarm({
  maxBots: 10,
  hiveMindEnabled: true,
  autoReplication: false,
});

const bot = swarm.spawnBot({ x: 0, y: 0, z: 0 });
```

### Knowledge Sharing

```typescript
const knowledge = {
  id: 'k-001',
  topic: 'navigation',
  content: 'Always check obstacles before moving',
  source: 'learned',
  confidence: 0.8,
  useCount: 0,
  acquiredAt: Date.now(),
  lastUsedAt: Date.now(),
};

bot.memory.knowledge.push(knowledge);
hiveMind.shareKnowledge(bot.id, knowledge);
```

### Replication (Shadow Clone)

```typescript
const clone = swarm.replicateBot(bot.id);
console.log(`Clone generation: ${clone.generation}`);
console.log(`Clone knows: ${clone.memory.knowledge.length} things`);
```

### Querying Knowledge

```typescript
const results = hiveMind.queryKnowledge(
  'navigation',  // search term
  0.5,          // min confidence
  0.3           // min consensus
);

console.log(`Found ${results.length} relevant knowledge entries`);
```

### Experience Replay

```typescript
import { ExperienceBuffer } from '../src/core';

const buffer = new ExperienceBuffer({
  maxSize: 1000,
  prioritized: true,
});

buffer.add({
  id: 'exp-1',
  timestamp: Date.now(),
  type: 'task',
  description: 'Completed navigation task',
  context: { distance: 100 },
  outcome: 'positive',
  importance: 0.9,
});

// Sample for learning
const batch = buffer.prioritizedSample(32);
```

## More Examples Coming Soon

- Task distribution across swarm
- Formation coordination
- Visual learning integration
- Multi-swarm coordination
- Persistent memory storage

## Contributing Examples

Feel free to add your own examples! Follow the pattern:

1. Create a new TypeScript file in `examples/`
2. Import from `../src/core`
3. Add clear console output showing what's happening
4. Document in this README

## Need Help?

- Check the [HiveMind Documentation](../docs/HIVEMIND.md)
- Review the [main README](../README.md)
- Look at the type definitions in [src/core/types.ts](../src/core/types.ts)
