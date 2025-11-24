# AI System Quick Start Guide

Get started with the NanoBot AI system in 5 minutes.

## 1. Setup Environment Variables

Copy `.env.example` to `.env.local` and add your API keys:

```bash
cp .env.example .env.local
```

Add at least one API key:

```env
VITE_GROQ_API_KEY=gsk_your_api_key_here
```

Get API keys:
- Groq: https://console.groq.com/ (Recommended - Fast & Free)
- OpenRouter: https://openrouter.ai/
- Gemini: https://makersuite.google.com/app/apikey

## 2. Install Dependencies

```bash
npm install
```

## 3. Basic Usage

### Simple Bot Brain

```typescript
import { NanoBotBrain } from '@ai/brain';

// Create a brain
const brain = new NanoBotBrain({
  personality: 'explorer'
});

// Make a decision
const decision = await brain.decide({
  botId: 'nano-001',
  position: { x: 0, y: 0, z: 0 },
  energy: 75,
  health: 90,
});

console.log(`Action: ${decision.action}`);
console.log(`Reasoning: ${decision.reasoning}`);
```

### Using Specific Providers

```typescript
import { createProvider } from '@ai/providers';

// Groq for fast decisions
const groq = createProvider({ type: 'groq' });

// Chat with the AI
const response = await groq.chat([
  { role: 'user', content: 'What should I do with low energy?' }
]);

console.log(response.content);
```

### Vision with Gemini

```typescript
import { createGeminiProvider } from '@ai/providers';

const gemini = createGeminiProvider();

// Analyze a screenshot
const analysis = await gemini.analyzeImage(
  base64ImageData,
  'What do you see in this voxel world?'
);

console.log(analysis.summary);
```

## 4. Common Patterns

### Bot Decision Loop

```typescript
const brain = new NanoBotBrain({ personality: 'builder' });

setInterval(async () => {
  const context = getBotContext(); // Your function to get bot state
  const decision = await brain.decide(context);

  // Execute the decision
  executeBotAction(decision.action, decision.parameters);
}, 1000);
```

### Environment Analysis

```typescript
const brain = new NanoBotBrain();

const analysis = await brain.analyzeEnvironment({
  botId: 'nano-001',
  position: { x: 10, y: 5, z: 15 },
  energy: 60,
  health: 85,
  nearbyResources: [
    { type: 'energy_crystal', distance: 5, value: 100 }
  ],
  threats: [
    { type: 'hostile_bot', distance: 20, severity: 0.6 }
  ]
});

console.log('Threats:', analysis.threats);
console.log('Opportunities:', analysis.opportunities);
console.log('Recommendations:', analysis.recommendations);
```

### Multi-Step Planning

```typescript
const brain = new NanoBotBrain({ personality: 'builder' });

const plan = await brain.planAction(
  'Build a resource storage facility',
  context
);

// Execute each step
for (const step of plan.steps) {
  console.log(`Step ${step.order}: ${step.description}`);
  await executeStep(step);
}
```

## 5. Personality Types

Choose a personality that matches your bot's role:

```typescript
// Aggressive - Fast expansion, high risk
const aggressive = new NanoBotBrain({ personality: 'aggressive' });

// Defensive - Safety first, fortification
const defensive = new NanoBotBrain({ personality: 'defensive' });

// Explorer - Discovery and mapping
const explorer = new NanoBotBrain({ personality: 'explorer' });

// Builder - Construction focused
const builder = new NanoBotBrain({ personality: 'builder' });

// Social - Swarm coordination
const social = new NanoBotBrain({ personality: 'social' });
```

## 6. Error Handling

```typescript
try {
  const decision = await brain.decide(context);
  executeBotAction(decision.action);
} catch (error) {
  console.error('AI error:', error);
  // Fallback to safe action
  executeBotAction('idle');
}
```

## 7. Performance Tips

### Use Groq for Real-Time

```typescript
const fastBrain = new NanoBotBrain({
  providerType: 'groq',
  temperature: 0.5  // Lower = more consistent
});
```

### Batch Decisions

```typescript
// Instead of calling decide() many times
const decisions = await Promise.all(
  bots.map(bot => brain.decide(bot.context))
);
```

### Cache Common Queries

```typescript
const cache = new Map();

async function getCachedDecision(context) {
  const key = `${context.energy}-${context.health}`;

  if (cache.has(key)) {
    return cache.get(key);
  }

  const decision = await brain.decide(context);
  cache.set(key, decision);
  return decision;
}
```

## 8. Integration with React/Three.js

```typescript
import { useRef, useEffect } from 'react';
import { NanoBotBrain } from '@ai/brain';

function BotController({ botState }) {
  const brainRef = useRef(new NanoBotBrain());

  useEffect(() => {
    const interval = setInterval(async () => {
      const decision = await brainRef.current.decide({
        botId: botState.id,
        position: botState.position,
        energy: botState.energy,
        health: botState.health,
      });

      // Update bot based on decision
      updateBot(decision);
    }, 2000);

    return () => clearInterval(interval);
  }, [botState]);

  return null;
}
```

## 9. Testing

```typescript
// Test with mock context
const testContext = {
  botId: 'test-bot',
  position: { x: 0, y: 0, z: 0 },
  energy: 50,
  health: 100,
};

const brain = new NanoBotBrain();
const decision = await brain.decide(testContext);

console.assert(decision.action, 'Should return an action');
console.assert(decision.confidence >= 0, 'Confidence should be non-negative');
```

## 10. Advanced: Custom Providers

```typescript
import { BaseProvider } from '@ai/providers/base';

class CustomProvider extends BaseProvider {
  protected getDefaultModel() {
    return 'custom-model';
  }

  async chat(messages, options) {
    // Your implementation
  }

  async analyze(prompt, data) {
    // Your implementation
  }
}
```

## Resources

- Full Documentation: `./README.md`
- Code Examples: `./example.ts`
- Type Definitions: `./types.ts`
- Provider Details: `./providers/`

## Troubleshooting

### API Key Not Found
```
Error: API key not provided and VITE_GROQ_API_KEY not found
```
Solution: Add your API key to `.env.local`

### Rate Limit Errors
```
Error: Rate limit exceeded
```
Solution: Implement retry logic or switch providers

### Import Errors
```
Cannot find module '@ai/brain'
```
Solution: Check `tsconfig.json` has correct path aliases

## Next Steps

1. Run the examples: Uncomment `runExamples()` in `example.ts`
2. Create your first bot brain
3. Experiment with different personalities
4. Try the vision capabilities with Gemini
5. Build a swarm intelligence system

Happy coding!
