# NanoBot AI System

Comprehensive AI abstraction layer for the NanoBot framework, providing intelligent decision-making, environmental analysis, and autonomous behavior.

## Architecture

```
src/ai/
├── brain.ts                 # NanoBotBrain - Core AI intelligence
├── index.ts                 # Main export point
├── example.ts              # Usage examples
└── providers/
    ├── base.ts             # Abstract BaseProvider class
    ├── groq.ts             # Groq provider (fast inference)
    ├── openrouter.ts       # OpenRouter provider (multiple models)
    ├── gemini.ts           # Gemini provider (vision + multimodal)
    └── index.ts            # Provider factory
```

## Features

### AI Providers

- **Groq**: Fast inference with llama-3.3-70b-versatile
- **OpenRouter**: Access to multiple models including meta-llama/llama-3.3-70b-instruct
- **Gemini**: Advanced multimodal capabilities with vision support

### NanoBot Brain

The brain provides high-level cognitive functions:

- **think()**: Generate thoughts about current situation
- **decide()**: Make decisions based on context
- **analyzeEnvironment()**: Analyze surroundings for threats and opportunities
- **planAction()**: Create multi-step action plans for goals

### Personalities

Bots can have different personalities that affect their behavior:

- **Aggressive**: Rapid expansion, resource dominance, high risk tolerance
- **Defensive**: Safety-focused, resource conservation, fortification
- **Explorer**: Discovery-oriented, mapping, calculated risks
- **Builder**: Construction-focused, infrastructure, optimization
- **Social**: Cooperation-focused, swarm coordination, communication

## Setup

### Environment Variables

Create a `.env` file with your API keys:

```env
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Installation

Dependencies are already included in `package.json`:

```bash
npm install
```

## Usage

### Basic Brain Usage

```typescript
import { NanoBotBrain } from '@ai/brain';

// Create a brain
const brain = new NanoBotBrain({
  providerType: 'groq',
  personality: 'explorer',
  creativityLevel: 0.7,
});

// Create context
const context = {
  botId: 'nano-001',
  position: { x: 10, y: 5, z: 15 },
  energy: 75,
  health: 90,
  nearbyResources: [
    { type: 'energy_crystal', distance: 5.2, value: 100 },
  ],
};

// Make decisions
const decision = await brain.decide(context);
console.log(decision.action, decision.reasoning);
```

### Using Different Providers

```typescript
import { createProvider } from '@ai/providers';

// Groq for fast decisions
const groq = createProvider({
  type: 'groq',
  temperature: 0.7,
});

// OpenRouter for diverse models
const openRouter = createProvider({
  type: 'openrouter',
  model: 'meta-llama/llama-3.3-70b-instruct',
});

// Gemini for vision
const gemini = createProvider({
  type: 'gemini',
});
```

### Vision Analysis with Gemini

```typescript
import { createGeminiProvider } from '@ai/providers';

const gemini = createGeminiProvider();

// Analyze environment screenshot
const analysis = await gemini.analyzeImage(
  base64ImageData,
  'Identify resources and structures in this voxel world'
);

console.log(analysis.detectedObjects);
console.log(analysis.colors);
```

### Creating Action Plans

```typescript
const plan = await brain.planAction('Build a resource depot', context);

// Execute steps
for (const step of plan.steps) {
  console.log(`Step ${step.order}: ${step.description}`);
  // Execute action...
}
```

### Environment Analysis

```typescript
const analysis = await brain.analyzeEnvironment(context);

console.log('Threats:', analysis.threats);
console.log('Opportunities:', analysis.opportunities);
console.log('Recommendations:', analysis.recommendations);
```

## API Reference

### NanoBotBrain

#### Constructor

```typescript
new NanoBotBrain(config?: BrainConfig)
```

**BrainConfig:**
- `providerType?: 'groq' | 'openrouter' | 'gemini'` - AI provider to use
- `apiKey?: string` - API key (optional, reads from env)
- `model?: string` - Specific model to use
- `temperature?: number` - Creativity level (0-1)
- `personality?: 'aggressive' | 'defensive' | 'explorer' | 'builder' | 'social'`
- `creativityLevel?: number` - Overall creativity (0-1)

#### Methods

**think(context: ThinkingContext): Promise<string>**
- Generate thoughts about the current situation
- Returns natural language thoughts

**decide(context: ThinkingContext): Promise<Decision>**
- Make a decision based on context
- Returns structured decision with action, priority, reasoning, confidence

**analyzeEnvironment(context: ThinkingContext): Promise<EnvironmentAnalysis>**
- Analyze surroundings for threats and opportunities
- Returns structured analysis with recommendations

**planAction(goal: string, context: ThinkingContext): Promise<ActionPlan>**
- Create a multi-step plan to achieve a goal
- Returns ordered steps with expected outcomes

**reset(): void**
- Reset conversation history

**setPersonality(personality: string): void**
- Change bot personality

### ThinkingContext

```typescript
interface ThinkingContext {
  botId: string;
  position: { x: number; y: number; z: number };
  energy: number;
  health: number;
  nearbyBots?: Array<{ id: string; distance: number; type: string }>;
  nearbyResources?: Array<{ type: string; distance: number; value: number }>;
  threats?: Array<{ type: string; distance: number; severity: number }>;
  currentGoal?: string;
  memorySnapshot?: string[];
}
```

### BaseProvider

#### Methods

**chat(messages: ChatMessage[], options?: Partial<ProviderConfig>): Promise<ChatResponse>**
- Send chat completion request
- Returns AI response with content and usage stats

**analyze(prompt: string, data: unknown): Promise<AnalysisResult>**
- Analyze data and return structured insights
- Returns summary, insights, and confidence

**getModel(): string**
- Get current model name

### Factory Functions

**createProvider(options: CreateProviderOptions): BaseProvider**
- Create any provider with unified interface

**createGroqProvider(apiKey?: string, model?: string): GroqProvider**
- Create Groq provider with defaults

**createOpenRouterProvider(apiKey?: string, model?: string): OpenRouterProvider**
- Create OpenRouter provider with defaults

**createGeminiProvider(apiKey?: string, model?: string): GeminiProvider**
- Create Gemini provider with defaults

## Examples

See `example.ts` for comprehensive usage examples including:

1. Basic brain usage
2. Multiple providers
3. Vision analysis
4. Different personalities
5. Memory and context
6. Data analysis
7. Error handling

## Performance Considerations

### Provider Selection

- **Groq**: Use for real-time bot decisions (fastest)
- **OpenRouter**: Use for complex reasoning and varied models
- **Gemini**: Use for vision/image analysis and multimodal tasks

### Optimization Tips

1. **Lower temperature** (0.3-0.5) for consistent decisions
2. **Higher temperature** (0.7-0.9) for creative exploration
3. **Batch decisions** when possible to reduce API calls
4. **Cache common analyses** to avoid redundant requests
5. **Use conversation history** for contextual awareness

### Rate Limits

Each provider has different rate limits. Consider:
- Implementing retry logic with exponential backoff
- Caching frequently used responses
- Using faster models for real-time decisions

## Integration with NanoBot Framework

The AI system integrates with:

- **Bot State Management**: Pass bot state as ThinkingContext
- **Decision System**: Use decisions to trigger bot actions
- **Resource Management**: Analyze resource availability
- **Swarm Coordination**: Enable multi-bot cooperation
- **Environment Perception**: Process visual and spatial data

## Future Enhancements

- [ ] Add Claude provider support
- [ ] Implement memory persistence
- [ ] Add reinforcement learning capabilities
- [ ] Create bot-to-bot communication protocol
- [ ] Implement swarm intelligence optimization
- [ ] Add performance benchmarking tools
- [ ] Create decision replay system for debugging

## License

MIT License - Part of the NanoBot Framework
