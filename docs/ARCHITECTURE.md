# HiveMind System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         BotSwarm                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    HiveMind (Singleton)               │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │ Shared       │  │ Message      │  │ Knowledge   │ │  │
│  │  │ Memory Pool  │  │ Queue        │  │ Graph       │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↕ ↕ ↕                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ NanoBot │  │ NanoBot │  │ NanoBot │  │ NanoBot │  ...   │
│  │  Gen 0  │  │  Gen 1  │  │  Gen 1  │  │  Gen 2  │        │
│  │         │  │ (Clone) │  │ (Clone) │  │ (Clone) │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
│       ↕            ↕            ↕            ↕               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Memory  │  │ Memory  │  │ Memory  │  │ Memory  │        │
│  │ Buffer  │  │ Buffer  │  │ Buffer  │  │ Buffer  │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Component Relationships

### HiveMind (Core Intelligence)
```
HiveMind
├── Shared Memory (Map<string, SharedKnowledgeEntry>)
│   ├── Knowledge entries from all bots
│   ├── Contributing bot tracking
│   ├── Consensus scoring
│   └── Version control
├── Connected Bots (Set<string>)
├── Message Queue (HiveMindMessage[])
├── Knowledge Graph (Map<string, KnowledgeGraphNode>)
├── Clone Hierarchy (Map<string, Set<string>>)
└── Bot Generations (Map<string, number>)
```

### BotSwarm (Coordination Layer)
```
BotSwarm
├── Bot Collection (Map<string, NanoBot>)
├── HiveMind Reference (singleton)
├── Task Queue (Task[])
├── Swarm Configuration
├── Statistics Tracking
└── Coordination Logic
    ├── Spawning
    ├── Replication
    ├── Merging
    ├── Task Distribution
    ├── Formation Control
    └── Energy Management
```

### NanoBot (Individual Agent)
```
NanoBot
├── Core Properties
│   ├── id, position, velocity
│   ├── energy, health, state
│   └── generation, parentId, childIds
├── AI Brain (NanoBotBrain)
├── Memory (Memory)
│   ├── Experiences (Experience[])
│   ├── Knowledge (Knowledge[])
│   ├── Short-term Memory
│   └── Long-term Memory
├── Skills (Map<string, Skill>)
└── Methods
    ├── update(), think(), learn()
    ├── replicate(), merge()
    ├── move(), executeAction()
    └── shareMemory()
```

### ExperienceBuffer (Learning System)
```
ExperienceBuffer
├── Buffer (PrioritizedExperience[])
├── Configuration
│   ├── maxSize
│   ├── prioritized
│   └── priority parameters
├── Statistics
└── Methods
    ├── add(), sample()
    ├── prioritizedSample()
    ├── query methods
    └── import/export
```

## Data Flow Diagrams

### Shadow Clone Jutsu (Replication)
```
┌────────────┐
│ Parent Bot │
│  learns A  │
└─────┬──────┘
      │ shareKnowledge(A)
      ↓
┌─────────────┐
│  HiveMind   │
│  stores A   │
└─────┬───────┘
      │
      ↓
┌────────────┐      replicate()      ┌────────────┐
│ Parent Bot │ ──────────────────→   │ Clone Bot  │
│  energy=X  │                       │ energy=X/2 │
└────────────┘                       └─────┬──────┘
                                           │ syncMemory()
                                           ↓
                                     ┌─────────────┐
                                     │  HiveMind   │
                                     │  returns A  │
                                     └─────────────┘
                                           ↓
                                     ┌────────────┐
                                     │ Clone Bot  │
                                     │  knows A   │
                                     └────────────┘
```

### Knowledge Sharing
```
Bot 1 learns → HiveMind.shareKnowledge() → Shared Memory Pool
                                                    ↓
Bot 2 queries ← HiveMind.queryKnowledge() ← Shared Memory Pool
Bot 3 queries ← HiveMind.queryKnowledge() ← Shared Memory Pool
Bot 4 queries ← HiveMind.queryKnowledge() ← Shared Memory Pool
```

### Fusion Jutsu (Merging)
```
┌───────────┐        ┌───────────┐
│  Bot 1    │        │  Bot 2    │
│ knows A,B │        │ knows C,D │
└─────┬─────┘        └─────┬─────┘
      │                    │
      └────────┬───────────┘
               │ merge()
               ↓
        ┌─────────────┐
        │  HiveMind   │
        │ consolidate │
        └─────┬───────┘
              │ onBotMerge()
              ↓
        ┌───────────┐
        │ Survivor  │
        │knows A,B, │
        │     C,D   │
        └───────────┘
```

### Task Distribution
```
Global Task Queue
       ↓
┌──────────────┐
│  BotSwarm    │
│Load Balancer │
└──────┬───────┘
       ├────────────┬────────────┬────────────┐
       ↓            ↓            ↓            ↓
   ┌───────┐   ┌───────┐   ┌───────┐   ┌───────┐
   │Bot 1  │   │Bot 2  │   │Bot 3  │   │Bot 4  │
   │Task A │   │Task B │   │idle   │   │Task C │
   └───────┘   └───────┘   └───────┘   └───────┘
```

## Memory Synchronization

### Pull Model (Bot-initiated)
```
Bot.update() → needs sync?
    ↓ YES
HiveMind.syncMemory(botId, localMemory)
    ↓
1. Share bot's knowledge → Shared Memory
2. Pull shared knowledge ← Shared Memory
3. Merge into local memory
    ↓
Bot has updated memory
```

### Push Model (Event-driven)
```
Bot.learn(experience)
    ↓
Bot.memory.knowledge.push(newKnowledge)
    ↓
HiveMind.shareKnowledge(botId, newKnowledge)
    ↓
Shared Memory updated
    ↓
Broadcast message to all bots
    ↓
Other bots notified of new knowledge
```

## Clone Hierarchy Example

```
Generation 0 (Original)
    │
    ├── Bot-1 (Naruto)
    │   │
    │   ├── Generation 1 (Clones)
    │   │   │
    │   │   ├── Bot-2 (Clone 1)
    │   │   │   │
    │   │   │   └── Generation 2
    │   │   │       │
    │   │   │       └── Bot-4 (Clone of Clone)
    │   │   │
    │   │   └── Bot-3 (Clone 2)
    │   │       │
    │   │       └── Generation 2
    │   │           │
    │   │           └── Bot-5 (Clone of Clone)
```

## Consensus Mechanism

```
Knowledge Entry
├── Topic: "navigation"
├── Content: "Avoid obstacles"
├── Contributing Bots: {bot-1, bot-2, bot-3}
├── Consensus Score: 3/10 = 0.3
└── Confidence: weighted average of all contributions
```

Higher consensus = more bots agree = more trustworthy knowledge

## Message Types Flow

```
Bot A                HiveMind              Bot B
  │                      │                   │
  │─task_request────────→│                   │
  │                      │──broadcast──────→ │
  │                      │                   │
  │                      │←─task_offer───────│
  │←──────forward────────│                   │
  │                      │                   │
  │─task_acceptance─────→│──forward────────→ │
  │                      │                   │
  │      [work happens]                      │
  │                      │                   │
  │                      │←task_completion───│
  │←──────notify─────────│                   │
```

## Energy Management

```
Swarm Total Energy = 10,000
         │
         ├── Distribution Strategy: "equal"
         │   └── Each bot gets: 10,000 / bot_count
         │
         ├── Distribution Strategy: "merit-based"
         │   └── High performers get more energy
         │
         └── Distribution Strategy: "task-based"
             └── Bots with tasks get priority
```

## Formation Patterns

### Grid Formation
```
○ ○ ○ ○
○ ○ ○ ○
○ ○ ○ ○
```

### Circle Formation
```
    ○ ○ ○
  ○       ○
 ○         ○
  ○       ○
    ○ ○ ○
```

### Cluster Formation (by family)
```
Family 1     Family 2
○ ○ ○        ● ● ●
○ ○          ● ●
  ○            ●
```

## Performance Optimization

### Indexing Strategy
```
Shared Memory (Map)
  ├── Primary Index: "topic:id"
  ├── Secondary Index (future): topic → [ids]
  └── Tertiary Index (future): botId → [contributed_ids]
```

### Caching Strategy
```
Bot Local Cache
  ├── Recently queried knowledge (TTL: 60s)
  ├── Frequently accessed knowledge
  └── Clone family members
```

## Extension Points

### Custom Load Balancers
```typescript
interface LoadBalancer {
  selectBot(task: Task, bots: NanoBot[]): NanoBot;
}

class MLBasedLoadBalancer implements LoadBalancer {
  // Use machine learning to predict best bot
}
```

### Custom Consensus Algorithms
```typescript
interface ConsensusAlgorithm {
  calculateScore(knowledge: Knowledge, contributors: Set<string>): number;
}
```

### Custom Formation Patterns
```typescript
interface FormationStrategy {
  arrange(bots: NanoBot[], center: Vector3, spacing: number): void;
}
```

## Security Considerations (Future)

```
┌─────────────┐
│   Bot A     │ ─── authenticated? ──→ HiveMind
└─────────────┘           │
                          ↓
                    ┌──────────┐
                    │ Auth     │
                    │ Check    │
                    └──────────┘
                          │
                          ↓
                    [authorized actions only]
```

## Scaling Strategy (Future)

### Horizontal Scaling
```
Swarm 1 ←──→ Distributed HiveMind ←──→ Swarm 2
                     ↕
                 Redis/DB
                     ↕
Swarm 3 ←──→ Distributed HiveMind ←──→ Swarm 4
```

---

This architecture provides a solid foundation for collective intelligence with room for growth and optimization.
