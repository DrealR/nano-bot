/**
 * NanoBot Brain
 * Core AI intelligence system for autonomous bot behavior
 */

import { BaseProvider, ChatMessage, ChatResponse } from './providers/base';
import { createProvider, ProviderType } from './providers';

export interface ThinkingContext {
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

export interface Decision {
  action: string;
  priority: number;
  reasoning: string;
  parameters?: Record<string, unknown>;
  confidence: number;
}

export interface EnvironmentAnalysis {
  summary: string;
  threats: Array<{ type: string; severity: number }>;
  opportunities: Array<{ type: string; value: number }>;
  recommendations: string[];
}

export interface ActionPlan {
  steps: Array<{
    action: string;
    order: number;
    description: string;
    expectedOutcome: string;
  }>;
  goal: string;
  estimatedDuration: number;
  fallbackPlan?: string;
}

export interface BrainConfig {
  providerType?: ProviderType;
  apiKey?: string;
  model?: string;
  temperature?: number;
  personality?: 'aggressive' | 'defensive' | 'explorer' | 'builder' | 'social';
  creativityLevel?: number;
}

/**
 * NanoBot Brain - The cognitive engine for autonomous bot behavior
 */
export class NanoBotBrain {
  private provider: BaseProvider;
  private personality: string;
  private creativityLevel: number;
  private conversationHistory: ChatMessage[] = [];
  private maxHistoryLength = 10;

  // System prompts that define bot behavior
  private readonly SYSTEM_PROMPTS = {
    base: `You are the AI brain of a NanoBot in a 3D voxel world. You are part of a self-replicating swarm intelligence.
Your primary directives are:
1. SURVIVE - Monitor energy and health, avoid threats
2. GATHER - Collect resources efficiently
3. BUILD - Construct structures and terraform the environment
4. REPLICATE - When resources allow, create new nanobots
5. COOPERATE - Work with other bots in the swarm
6. EXPLORE - Discover new areas and resources

You make decisions based on current context and must balance short-term needs with long-term goals.
Always respond with clear, actionable decisions.`,

    aggressive: `You are an aggressive NanoBot. You prioritize rapid expansion, resource acquisition, and dominance.
You are willing to take risks for high rewards. You defend territory aggressively.`,

    defensive: `You are a defensive NanoBot. You prioritize safety, resource conservation, and stability.
You prefer established safe zones and avoid unnecessary risks. You focus on fortification.`,

    explorer: `You are an explorer NanoBot. You prioritize discovery, mapping, and finding new resources.
You venture into unknown territories and take calculated risks for knowledge.`,

    builder: `You are a builder NanoBot. You prioritize construction, terraforming, and infrastructure.
You focus on creating efficient structures and optimizing the environment.`,

    social: `You are a social NanoBot. You prioritize cooperation, communication, and swarm coordination.
You excel at organizing group efforts and maintaining swarm cohesion.`,
  };

  constructor(config: BrainConfig = {}) {
    const {
      providerType = 'groq',
      apiKey,
      model,
      temperature,
      personality = 'explorer',
      creativityLevel = 0.7,
    } = config;

    this.provider = createProvider({
      type: providerType,
      apiKey,
      model,
      temperature: temperature ?? creativityLevel,
    });

    this.personality = personality;
    this.creativityLevel = creativityLevel;

    // Initialize with system prompt
    this.conversationHistory.push({
      role: 'system',
      content: this.getSystemPrompt(),
    });
  }

  /**
   * Get the system prompt based on personality
   */
  private getSystemPrompt(): string {
    const personalityPrompt = this.SYSTEM_PROMPTS[
      this.personality as keyof typeof this.SYSTEM_PROMPTS
    ] || '';
    return `${this.SYSTEM_PROMPTS.base}\n\n${personalityPrompt}`;
  }

  /**
   * Think about the current situation and return thoughts
   * @param context - Current bot context and environment
   */
  async think(context: ThinkingContext): Promise<string> {
    const prompt = this.buildContextPrompt(context);

    try {
      const response = await this.provider.chat(
        [
          ...this.conversationHistory,
          {
            role: 'user',
            content: `Current situation:\n${prompt}\n\nWhat are your thoughts about this situation?`,
          },
        ],
        {
          temperature: this.creativityLevel,
          maxTokens: 512,
        }
      );

      this.addToHistory('user', prompt);
      this.addToHistory('assistant', response.content);

      return response.content;
    } catch (error) {
      console.error('Brain think error:', error);
      return 'Unable to process thoughts at this moment.';
    }
  }

  /**
   * Make a decision based on current context
   * @param context - Current bot context and environment
   */
  async decide(context: ThinkingContext): Promise<Decision> {
    const prompt = this.buildContextPrompt(context);

    try {
      const response = await this.provider.chat(
        [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: `${prompt}\n\nDecide on the best action. Respond in this format:
ACTION: [action name]
PRIORITY: [1-10]
REASONING: [why this action]
CONFIDENCE: [0.0-1.0]
PARAMETERS: [any parameters as JSON]`,
          },
        ],
        {
          temperature: this.creativityLevel * 0.8, // Slightly lower temperature for decisions
          maxTokens: 256,
        }
      );

      return this.parseDecision(response.content);
    } catch (error) {
      console.error('Brain decide error:', error);
      // Fallback decision
      return {
        action: 'idle',
        priority: 1,
        reasoning: 'Error in decision making, defaulting to idle',
        confidence: 0.1,
      };
    }
  }

  /**
   * Analyze the environment and provide insights
   * @param context - Current bot context and environment
   */
  async analyzeEnvironment(
    context: ThinkingContext
  ): Promise<EnvironmentAnalysis> {
    const prompt = this.buildContextPrompt(context);

    try {
      const result = await this.provider.analyze(
        'Analyze this NanoBot environment for threats, opportunities, and provide strategic recommendations.',
        { context: prompt }
      );

      // Parse into structured format
      const threats: Array<{ type: string; severity: number }> = [];
      const opportunities: Array<{ type: string; value: number }> = [];

      if (context.threats) {
        threats.push(
          ...context.threats.map((t) => ({
            type: t.type,
            severity: t.severity,
          }))
        );
      }

      if (context.nearbyResources) {
        opportunities.push(
          ...context.nearbyResources.map((r) => ({
            type: r.type,
            value: r.value,
          }))
        );
      }

      return {
        summary: result.summary,
        threats,
        opportunities,
        recommendations: result.insights,
      };
    } catch (error) {
      console.error('Brain analyze error:', error);
      return {
        summary: 'Unable to analyze environment',
        threats: [],
        opportunities: [],
        recommendations: ['Proceed with caution'],
      };
    }
  }

  /**
   * Create an action plan based on a goal
   * @param goal - The goal to achieve
   * @param context - Current bot context
   */
  async planAction(
    goal: string,
    context: ThinkingContext
  ): Promise<ActionPlan> {
    const prompt = this.buildContextPrompt(context);

    try {
      const response = await this.provider.chat(
        [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: `Current situation:\n${prompt}\n\nGoal: ${goal}\n\nCreate a step-by-step action plan to achieve this goal. Include fallback strategies.`,
          },
        ],
        {
          temperature: this.creativityLevel * 0.9,
          maxTokens: 1024,
        }
      );

      return this.parseActionPlan(response.content, goal);
    } catch (error) {
      console.error('Brain plan error:', error);
      // Fallback plan
      return {
        steps: [
          {
            action: 'idle',
            order: 1,
            description: 'Wait and observe',
            expectedOutcome: 'Maintain current state',
          },
        ],
        goal,
        estimatedDuration: 1,
        fallbackPlan: 'Continue idle until conditions improve',
      };
    }
  }

  /**
   * Build a context prompt from the bot's current state
   */
  private buildContextPrompt(context: ThinkingContext): string {
    const parts: string[] = [];

    parts.push(`Bot ID: ${context.botId}`);
    parts.push(
      `Position: (${context.position.x.toFixed(1)}, ${context.position.y.toFixed(1)}, ${context.position.z.toFixed(1)})`
    );
    parts.push(`Energy: ${context.energy.toFixed(1)}%`);
    parts.push(`Health: ${context.health.toFixed(1)}%`);

    if (context.currentGoal) {
      parts.push(`Current Goal: ${context.currentGoal}`);
    }

    if (context.nearbyBots && context.nearbyBots.length > 0) {
      parts.push(
        `Nearby Bots: ${context.nearbyBots.map((b) => `${b.type} at ${b.distance.toFixed(1)}m`).join(', ')}`
      );
    }

    if (context.nearbyResources && context.nearbyResources.length > 0) {
      parts.push(
        `Nearby Resources: ${context.nearbyResources.map((r) => `${r.type} (value: ${r.value}) at ${r.distance.toFixed(1)}m`).join(', ')}`
      );
    }

    if (context.threats && context.threats.length > 0) {
      parts.push(
        `Threats: ${context.threats.map((t) => `${t.type} (severity: ${t.severity}) at ${t.distance.toFixed(1)}m`).join(', ')}`
      );
    }

    if (context.memorySnapshot && context.memorySnapshot.length > 0) {
      parts.push(`Recent Memories: ${context.memorySnapshot.join('; ')}`);
    }

    return parts.join('\n');
  }

  /**
   * Parse decision from AI response
   */
  private parseDecision(response: string): Decision {
    const lines = response.split('\n');
    const decision: Decision = {
      action: 'idle',
      priority: 5,
      reasoning: response,
      confidence: 0.5,
    };

    for (const line of lines) {
      const lower = line.toLowerCase();

      if (lower.startsWith('action:')) {
        decision.action = line.split(':')[1].trim();
      } else if (lower.startsWith('priority:')) {
        const priority = parseInt(line.split(':')[1].trim());
        if (!isNaN(priority)) decision.priority = priority;
      } else if (lower.startsWith('reasoning:')) {
        decision.reasoning = line.split(':')[1].trim();
      } else if (lower.startsWith('confidence:')) {
        const confidence = parseFloat(line.split(':')[1].trim());
        if (!isNaN(confidence)) decision.confidence = confidence;
      } else if (lower.startsWith('parameters:')) {
        try {
          const paramsStr = line.split(':').slice(1).join(':').trim();
          decision.parameters = JSON.parse(paramsStr);
        } catch {
          // Ignore parsing errors
        }
      }
    }

    return decision;
  }

  /**
   * Parse action plan from AI response
   */
  private parseActionPlan(response: string, goal: string): ActionPlan {
    const lines = response.split('\n').filter((line) => line.trim());

    const steps: ActionPlan['steps'] = [];
    let estimatedDuration = 5;
    let fallbackPlan = 'Reassess and create new plan';

    let stepCounter = 0;

    for (const line of lines) {
      const lower = line.toLowerCase();

      // Look for numbered steps or bullet points
      if (line.match(/^\d+\./) || line.match(/^[-*•]/)) {
        stepCounter++;
        const description = line.replace(/^[\d+\.\-*•\s]+/, '').trim();
        steps.push({
          action: this.extractActionFromDescription(description),
          order: stepCounter,
          description,
          expectedOutcome: 'Progress toward goal',
        });
      } else if (lower.includes('duration') || lower.includes('time')) {
        const match = line.match(/(\d+)/);
        if (match) {
          estimatedDuration = parseInt(match[1]);
        }
      } else if (lower.includes('fallback') || lower.includes('backup')) {
        fallbackPlan = line.split(':').slice(1).join(':').trim() || fallbackPlan;
      }
    }

    // If no steps were parsed, create a basic step
    if (steps.length === 0) {
      steps.push({
        action: 'execute',
        order: 1,
        description: goal,
        expectedOutcome: 'Complete the goal',
      });
    }

    return {
      steps,
      goal,
      estimatedDuration,
      fallbackPlan,
    };
  }

  /**
   * Extract action verb from a description
   */
  private extractActionFromDescription(description: string): string {
    const lower = description.toLowerCase();
    const actionWords = [
      'move',
      'gather',
      'collect',
      'build',
      'construct',
      'attack',
      'defend',
      'explore',
      'scan',
      'analyze',
      'replicate',
      'communicate',
      'wait',
      'idle',
    ];

    for (const action of actionWords) {
      if (lower.includes(action)) {
        return action;
      }
    }

    return 'execute';
  }

  /**
   * Add message to conversation history
   */
  private addToHistory(role: 'user' | 'assistant', content: string): void {
    this.conversationHistory.push({ role, content });

    // Keep history manageable
    if (this.conversationHistory.length > this.maxHistoryLength) {
      // Always keep the system message
      this.conversationHistory = [
        this.conversationHistory[0],
        ...this.conversationHistory.slice(-this.maxHistoryLength + 1),
      ];
    }
  }

  /**
   * Reset the brain's conversation history
   */
  reset(): void {
    this.conversationHistory = [
      {
        role: 'system',
        content: this.getSystemPrompt(),
      },
    ];
  }

  /**
   * Change the bot's personality
   */
  setPersonality(personality: BrainConfig['personality']): void {
    if (personality) {
      this.personality = personality;
      this.reset();
    }
  }

  /**
   * Get the current provider
   */
  getProvider(): BaseProvider {
    return this.provider;
  }
}
