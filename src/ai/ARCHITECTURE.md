# NanoBot AI Architecture

## System Overview

The NanoBot AI system is a multi-provider abstraction layer that enables autonomous bot intelligence through a unified interface. It supports multiple AI providers (Groq, OpenRouter, Gemini) and provides high-level cognitive functions for bot decision-making.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        NanoBot Application                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        NanoBotBrain                              │
│  ┌──────────────┬───────────────┬──────────────┬──────────────┐ │
│  │   think()    │   decide()    │  analyze()   │   planAction()│ │
│  └──────────────┴───────────────┴──────────────┴──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Provider Factory                             │
│                   createProvider(type)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ GroqProvider │  │OpenRouter    │  │GeminiProvider│
    │              │  │Provider      │  │              │
    │ llama-3.3    │  │ llama-3.3    │  │ gemini-1.5   │
    │ -70b-        │  │ -70b-        │  │ -flash       │
    │ versatile    │  │ instruct     │  │              │
    │              │  │              │  │ + Vision     │
    └──────────────┘  └──────────────┘  └──────────────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              ▼
                    ┌──────────────────┐
                    │  BaseProvider    │
                    │  (Abstract)      │
                    └──────────────────┘
```

## Component Details

### 1. Base Provider Layer (`providers/base.ts`)

Abstract class defining the common interface for all AI providers.

**Key Methods:**
- `chat(messages, options)` - Chat completion
- `analyze(prompt, data)` - Structured data analysis
- `getModel()` - Get current model name

**Key Types:**
- `ChatMessage` - Message format
- `ChatResponse` - Response format
- `AnalysisResult` - Analysis output
- `ProviderConfig` - Configuration options

### 2. Provider Implementations

#### GroqProvider (`providers/groq.ts`)
- **Purpose**: Fast inference for real-time bot decisions
- **Model**: llama-3.3-70b-versatile
- **SDK**: groq-sdk
- **Best For**: Quick decisions, low latency requirements
- **Features**: Fast response times, cost-effective

#### OpenRouterProvider (`providers/openrouter.ts`)
- **Purpose**: Access to multiple AI models
- **Default Model**: meta-llama/llama-3.3-70b-instruct
- **SDK**: OpenAI SDK with custom base URL
- **Best For**: Model flexibility, fallback options
- **Features**: Model selection, unified API

#### GeminiProvider (`providers/gemini.ts`)
- **Purpose**: Vision and multimodal capabilities
- **Default Model**: gemini-1.5-flash
- **SDK**: @google/generative-ai
- **Best For**: Image analysis, vision tasks
- **Features**: 
  - `analyzeImage()` - Vision analysis
  - `generateEmbedding()` - Text embeddings
  - Long context support

### 3. Provider Factory (`providers/index.ts`)

Centralized provider creation with automatic API key management.

**Functions:**
- `createProvider(options)` - Generic factory
- `createGroqProvider()` - Groq shorthand
- `createOpenRouterProvider()` - OpenRouter shorthand
- `createGeminiProvider()` - Gemini shorthand

**Features:**
- Automatic environment variable reading
- Type-safe provider selection
- Configuration validation

### 4. NanoBot Brain (`brain.ts`)

High-level cognitive engine for bot intelligence.

**Core Methods:**

```typescript
// Generate thoughts about situation
think(context: ThinkingContext): Promise<string>

// Make tactical decision
decide(context: ThinkingContext): Promise<Decision>

// Analyze environment
analyzeEnvironment(context: ThinkingContext): Promise<EnvironmentAnalysis>

// Create action plan
planAction(goal: string, context: ThinkingContext): Promise<ActionPlan>
```

**Personality System:**

Each bot can have a personality that affects decision-making:

- **Aggressive**: Expansion, dominance, risk-taking
- **Defensive**: Safety, conservation, fortification
- **Explorer**: Discovery, mapping, exploration
- **Builder**: Construction, optimization, infrastructure
- **Social**: Cooperation, coordination, communication

**System Prompts:**

Built-in prompts define bot behavior and goals:
1. SURVIVE - Energy and health management
2. GATHER - Resource collection
3. BUILD - Construction and terraforming
4. REPLICATE - Bot reproduction
5. COOPERATE - Swarm coordination
6. EXPLORE - Discovery and mapping

### 5. Type System (`types.ts`)

Comprehensive type definitions for:
- Bot states and actions
- World environment data
- Resources and threats
- Swarm statistics
- AI performance metrics

## Data Flow

### Decision Making Flow

```
Bot State → ThinkingContext → NanoBotBrain.decide()
                                     │
                                     ▼
                              Provider.chat()
                                     │
                                     ▼
                              AI Model Response
                                     │
                                     ▼
                            Parse → Decision
                                     │
                                     ▼
                            Execute Action
```

### Environment Analysis Flow

```
World Data → ThinkingContext → NanoBotBrain.analyzeEnvironment()
                                         │
                                         ▼
                                  Provider.analyze()
                                         │
                                         ▼
                                  AI Analysis
                                         │
                                         ▼
                              EnvironmentAnalysis
                              ├─ threats[]
                              ├─ opportunities[]
                              └─ recommendations[]
```

## Configuration

### Environment Variables (Vite)

```env
VITE_GROQ_API_KEY=gsk_...
VITE_OPENROUTER_API_KEY=sk-or-...
VITE_GEMINI_API_KEY=...
VITE_DEFAULT_AI_PROVIDER=groq
```

### Brain Configuration

```typescript
interface BrainConfig {
  providerType?: 'groq' | 'openrouter' | 'gemini';
  apiKey?: string;
  model?: string;
  temperature?: number;
  personality?: 'aggressive' | 'defensive' | 'explorer' | 'builder' | 'social';
  creativityLevel?: number;
}
```

## Performance Characteristics

### Provider Comparison

| Provider    | Speed    | Cost     | Models  | Vision | Context |
|-------------|----------|----------|---------|--------|---------|
| Groq        | Very Fast| Low      | Limited | No     | Medium  |
| OpenRouter  | Fast     | Variable | Many    | No     | High    |
| Gemini      | Medium   | Low      | Few     | Yes    | Very High|

### Optimization Strategies

1. **Use Groq for real-time decisions** (< 500ms response)
2. **Use Gemini for vision tasks** (environment screenshots)
3. **Use OpenRouter for complex reasoning** (action planning)
4. **Lower temperature** (0.3-0.5) for consistent decisions
5. **Higher temperature** (0.7-0.9) for creative exploration
6. **Cache common queries** to reduce API calls
7. **Batch requests** when possible

## Error Handling

### Provider Fallback Chain

```typescript
try {
  // Try primary provider (Groq)
  decision = await groqBrain.decide(context);
} catch (error) {
  try {
    // Fallback to OpenRouter
    decision = await openRouterBrain.decide(context);
  } catch (error) {
    // Ultimate fallback - safe action
    decision = { action: 'idle', priority: 1, confidence: 0.1 };
  }
}
```

### Error Types

- **API Key Missing**: Throws on provider creation
- **Rate Limit**: Implement retry with backoff
- **Network Error**: Fallback to safe action
- **Invalid Response**: Parse with defaults

## Security Considerations

1. **API Keys**: Never commit to repository
2. **Environment Variables**: Use Vite's `VITE_` prefix
3. **Input Validation**: Sanitize bot context data
4. **Rate Limiting**: Implement request throttling
5. **Error Messages**: Don't expose API keys in logs

## Testing Strategy

### Unit Tests
- Provider initialization
- Message formatting
- Response parsing
- Error handling

### Integration Tests
- Full decision-making flow
- Provider switching
- Conversation history
- Personality behaviors

### Performance Tests
- Response latency
- Token usage
- Memory consumption
- Concurrent requests

## Future Enhancements

### Planned Features
- [ ] Claude provider support
- [ ] Memory persistence (localStorage/IndexedDB)
- [ ] Reinforcement learning integration
- [ ] Multi-bot communication protocol
- [ ] Swarm intelligence optimization
- [ ] Decision replay and debugging
- [ ] Performance monitoring dashboard

### Research Areas
- Emergent swarm behaviors
- Self-modifying prompts
- Adaptive personality systems
- Collective intelligence patterns
- Vision-guided navigation

## Integration Points

### With Bot System
```typescript
class Bot {
  brain: NanoBotBrain;
  
  async update() {
    const context = this.getContext();
    const decision = await this.brain.decide(context);
    this.execute(decision);
  }
}
```

### With World System
```typescript
class World {
  async analyzeEnvironment(position: Vector3D) {
    const context = this.getEnvironmentContext(position);
    const analysis = await brain.analyzeEnvironment(context);
    return analysis;
  }
}
```

### With Swarm Manager
```typescript
class SwarmManager {
  async coordinateBots() {
    const plans = await Promise.all(
      this.bots.map(bot => bot.brain.planAction(bot.goal, bot.context))
    );
    this.optimizeSwarmActions(plans);
  }
}
```

## Conclusion

The NanoBot AI system provides a flexible, extensible foundation for autonomous bot intelligence. Its multi-provider architecture ensures reliability, performance, and adaptability while maintaining a simple, consistent API for bot decision-making.
