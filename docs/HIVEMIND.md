# HiveMind - Shared Memory System

The HiveMind is the collective intelligence system for the NanoBot framework, inspired by Shadow Clone Jutsu from Naruto. When a bot replicates, **BOTH copies share the same memories** and any learning by one is instantly known by all connected bots.

## Core Concept: Shadow Clone Jutsu Memory Sharing

Just like in Naruto where shadow clones share experiences when they disperse, NanoBots in the same hive mind share knowledge in real-time:

- When a bot replicates, the clone immediately has access to all shared knowledge
- When any bot learns something new, it can share it with the HiveMind
- All connected bots can query the shared memory pool
- When bots merge, their knowledge is consolidated

## Architecture

### HiveMind (Singleton)

The central coordination system managing shared knowledge across all bots.

**Key Features:**
- Singleton pattern - one HiveMind instance per swarm
- Shared memory pool accessible to all connected bots
- Message queue for inter-bot communication
- Knowledge graph for concept relationships
- Clone hierarchy tracking (parent-child relationships)

**Main Methods:**
```typescript
// Connection management
connect(botId: string, generation: number, parentId: string | null): void
disconnect(botId: string, preserveKnowledge: boolean): void

// Communication
broadcast(message: HiveMindMessage): void
sendMessage(message: HiveMindMessage): void

// Knowledge sharing
shareKnowledge(botId: string, knowledge: Knowledge): void
queryKnowledge(query: string, minConfidence: number, minConsensus: number): Knowledge[]
syncMemory(botId: string, localMemory: Memory): Memory

// Lifecycle events
onBotReplicate(parentId: string, childId: string, generation: number): void
onBotMerge(survivorId: string, absorbedId: string): void

// Analytics
getCollectiveIntelligence(): CollectiveIntelligence
getCloneFamily(botId: string): Set<string>
```

### BotSwarm

Manages a collection of NanoBots working together as a coordinated swarm.

**Key Features:**
- Bot lifecycle management (spawn, replicate, merge, remove)
- Task distribution and load balancing
- Spatial formations for coordinated movement
- Automatic replication when workload is high
- Automatic merging when efficiency is low
- Integration with HiveMind for collective intelligence

**Main Methods:**
```typescript
// Bot management
addBot(bot: NanoBot): void
removeBot(id: string, preserveKnowledge: boolean): void
spawnBot(position: Vector3, config?: Partial<NanoBotConfig>): NanoBot

// Replication and merging
replicateBot(id: string): NanoBot  // Shadow Clone Jutsu
mergeBot(id1: string, id2: string): NanoBot  // Fusion Jutsu

// Task management
assignTask(botId: string, task: Task): void
update(deltaTime: number): void

// Spatial queries
getBotsInRadius(position: Vector3, radius: number): NanoBot[]
formFormation(type: FormationType, center?: Vector3, spacing?: number): void

// Analytics
getStatistics(): Statistics
getCollectiveIntelligence(): CollectiveIntelligence
```

### ExperienceBuffer

Replay memory for reinforcement learning from past experiences.

**Key Features:**
- Prioritized experience replay
- Random sampling for training
- Experience filtering by type, outcome, importance
- Import/export capabilities
- Configurable buffer size

**Main Methods:**
```typescript
// Storage
add(experience: Experience): void
clear(): void

// Sampling
sample(count: number): Experience[]
prioritizedSample(count: number): Array<{experience, weight, index}>
updatePriorities(indices: number[], priorities: number[]): void

// Querying
getRecentExperiences(count: number): Experience[]
getByType(type: Experience['type'], limit?: number): Experience[]
getByOutcome(outcome: Experience['outcome'], limit?: number): Experience[]
getImportantExperiences(minImportance: number, limit?: number): Experience[]
searchByTags(tags: string[], matchAll: boolean, limit?: number): Experience[]

// Persistence
export(limit?: number): string
import(json: string, append: boolean): void
```

## Usage Examples

### Basic HiveMind Setup

```typescript
import { BotSwarm, HiveMind } from '@nanobot/core';

// Create swarm with HiveMind enabled
const swarm = new BotSwarm({
  maxBots: 100,
  hiveMindEnabled: true,
  hiveMindUpdateInterval: 1000,
  autoReplication: true,
  replicationThreshold: 0.8,
});

const hiveMind = swarm.getHiveMind();
```

### Shadow Clone Jutsu (Replication)

```typescript
// Spawn original bot
const naruto = swarm.spawnBot({ x: 0, y: 0, z: 0 }, {
  name: 'Naruto',
  apiKey: 'your-key',
});

// Original bot learns something
const jutsuKnowledge = {
  id: 'rasengan-001',
  topic: 'jutsu',
  content: 'Rasengan technique',
  source: 'learned',
  confidence: 0.9,
  useCount: 0,
  acquiredAt: Date.now(),
  lastUsedAt: Date.now(),
};

naruto.memory.knowledge.push(jutsuKnowledge);
hiveMind.shareKnowledge(naruto.id, jutsuKnowledge);

// Create shadow clone - clone immediately knows everything!
const clone = swarm.replicateBot(naruto.id);

// Query knowledge from HiveMind
const jutsus = hiveMind.queryKnowledge('jutsu', 0.5, 0);
console.log(`Clone knows ${jutsus.length} techniques`);
```

### Real-time Learning Across Clones

```typescript
// Clone learns something new
const newKnowledge = {
  id: 'shadow-clone-002',
  topic: 'jutsu',
  content: 'Shadow Clone Jutsu',
  source: 'learned',
  confidence: 0.95,
  useCount: 1,
  acquiredAt: Date.now(),
  lastUsedAt: Date.now(),
};

clone.memory.knowledge.push(newKnowledge);
hiveMind.shareKnowledge(clone.id, newKnowledge);

// Original bot can now access this knowledge instantly
const allKnowledge = hiveMind.queryKnowledge('jutsu', 0.5, 0);
// Returns both Rasengan and Shadow Clone Jutsu
```

### Fusion Jutsu (Merging)

```typescript
// Create two clones
const clone1 = swarm.replicateBot(naruto.id);
const clone2 = swarm.replicateBot(naruto.id);

// Each learns different things
hiveMind.shareKnowledge(clone1.id, knowledgeA);
hiveMind.shareKnowledge(clone2.id, knowledgeB);

// Merge them - survivor gets all knowledge
const fusion = swarm.mergeBot(clone1.id, clone2.id);
// fusion now has knowledgeA + knowledgeB + original knowledge
```

### Experience Buffer for Learning

```typescript
import { ExperienceBuffer } from '@nanobot/core';

const buffer = new ExperienceBuffer({
  maxSize: 10000,
  prioritized: true,
  priorityAlpha: 0.6,
  priorityBeta: 0.4,
});

// Store experiences
buffer.add({
  id: 'exp-001',
  timestamp: Date.now(),
  type: 'task',
  description: 'Successfully completed mission',
  context: { taskId: 'mission-1' },
  outcome: 'positive',
  importance: 0.9,
});

// Sample for learning
const batch = buffer.prioritizedSample(32);
// Use batch for reinforcement learning

// Update priorities after learning
const tdErrors = [0.5, 0.3, 0.8, ...]; // From learning algorithm
buffer.updatePriorities(
  batch.map(b => b.index),
  tdErrors
);
```

### Collective Intelligence Metrics

```typescript
const intelligence = hiveMind.getCollectiveIntelligence();

console.log(`Total Knowledge: ${intelligence.totalKnowledge}`);
console.log(`Connected Bots: ${intelligence.connectedBots}`);
console.log(`Average Confidence: ${intelligence.averageConfidence}`);
console.log(`Consensus Level: ${intelligence.consensusLevel}`);
console.log(`Network Strength: ${intelligence.networkStrength}`);
console.log(`Generational Depth: ${intelligence.generationalDepth}`);
```

### Clone Family Tracking

```typescript
// Get all bots in the same clone family
const family = hiveMind.getCloneFamily(clone.id);
console.log(`Family size: ${family.size}`);
console.log(`Members: ${Array.from(family).join(', ')}`);
```

### Formations

```typescript
// Arrange bots in patterns
swarm.formFormation('grid', { x: 0, y: 0, z: 0 }, 10);
swarm.formFormation('circle', { x: 100, y: 0, z: 0 }, 15);
swarm.formFormation('sphere', { x: 200, y: 0, z: 0 }, 20);

// Cluster by clone families
swarm.formFormation('cluster', { x: 0, y: 0, z: 0 }, 10);
```

## Configuration

### SwarmConfig

```typescript
interface SwarmConfig {
  maxBots: number;                    // Maximum bots in swarm
  minBots: number;                    // Minimum bots to maintain
  maxTotalEnergy: number;             // Total energy budget
  energyDistribution: string;         // 'equal' | 'merit-based' | etc.
  communicationRange: number;         // Direct communication range
  autoReplication: boolean;           // Auto-create clones
  replicationThreshold: number;       // When to auto-replicate
  autoMerge: boolean;                 // Auto-merge idle bots
  mergeThreshold: number;             // When to auto-merge
  globalTaskQueueSize: number;        // Max queued tasks
  loadBalancing: string;              // Task distribution strategy
  hiveMindEnabled: boolean;           // Enable shared memory
  hiveMindUpdateInterval: number;     // Sync frequency (ms)
  visualLearningEnabled: boolean;     // Learn from screenshots
  maxGenerations: number;             // Max clone depth
  coordinationMode: string;           // Swarm coordination mode
}
```

### ExperienceBufferConfig

```typescript
interface ExperienceBufferConfig {
  maxSize: number;          // Maximum experiences to store
  prioritized: boolean;     // Use prioritized replay
  priorityAlpha: number;    // Priority exponent (0-1)
  priorityBeta: number;     // Importance sampling (0-1)
  priorityEpsilon: number;  // Small constant for stability
}
```

## Message Types

The HiveMind supports various message types for bot communication:

- `task_request` - Bot requesting a task
- `task_offer` - Bot offering to help
- `task_acceptance` - Bot accepting a task
- `task_completion` - Bot completed a task
- `knowledge_share` - Sharing knowledge with swarm
- `help_request` - Bot needs assistance
- `status_update` - General status broadcast
- `clone_notification` - New clone created
- `merge_request` - Request to merge with another bot
- `query` - Query for information
- `response` - Response to a query
- `broadcast` - General broadcast message

## Best Practices

1. **Enable HiveMind for Coordinated Swarms**: Always enable when you want clones to share knowledge
2. **Regular Sync Intervals**: Set appropriate `hiveMindUpdateInterval` based on your use case
3. **Monitor Collective Intelligence**: Track metrics to understand swarm performance
4. **Use Experience Buffer**: Store important experiences for reinforcement learning
5. **Balance Replication/Merging**: Configure thresholds to maintain optimal swarm size
6. **Prioritize Knowledge**: Use confidence and consensus scores to filter important knowledge
7. **Track Clone Families**: Use `getCloneFamily()` to understand lineage relationships

## Performance Considerations

- HiveMind operations are O(1) for most methods
- Knowledge queries are O(n) where n = number of knowledge entries
- Memory sync is O(k) where k = knowledge entries per bot
- Experience sampling is O(log n) for prioritized replay
- Broadcast messages are O(b) where b = number of bots

## Future Enhancements

- Distributed HiveMind for multi-server swarms
- Knowledge compression for large memory pools
- Advanced consensus algorithms
- Neural network integration for experience replay
- Cross-swarm knowledge sharing
- Persistent HiveMind storage

## Related Documentation

- [NanoBot Core](./NANOBOT.md)
- [AI Brain](./AI_BRAIN.md)
- [Task System](./TASKS.md)
- [Examples](../examples/)

---

*"When you believe in your dreams, and you have the will to never give up... that's when you can achieve anything!" - Naruto Uzumaki*
