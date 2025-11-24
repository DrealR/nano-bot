/**
 * NanoBot Core Class
 * Represents a single autonomous nanobot entity with AI capabilities,
 * memory, replication, and swarm intelligence features.
 */

// Browser-compatible UUID generation
const randomUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Simple EventEmitter implementation for browser
class EventEmitter {
  private events: Map<string, Function[]> = new Map();

  on(event: string, listener: Function): this {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach((listener) => listener(...args));
      return true;
    }
    return false;
  }

  removeListener(event: string, listener: Function): this {
    const listeners = this.events.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
    return this;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }
}
import {
  Vector3,
  NanoBotState,
  Memory,
  Experience,
  Knowledge,
  Task,
  NanoBotConfig,
  AIProviderType,
} from './types';
import { NanoBotBrain, ThinkingContext, Decision } from '../ai/brain';

/**
 * Skill represents a learned ability of the nanobot
 */
export interface Skill {
  id: string;
  name: string;
  level: number; // 0-100
  description: string;
  energyCost: number;
  cooldown: number;
  lastUsed: number;
  timesUsed: number;
  successRate: number;
}

/**
 * Action that can be executed by the bot
 */
export interface BotAction {
  type: string;
  parameters: Record<string, any>;
  energyCost: number;
  duration: number;
}

/**
 * Serialized state for saving/loading
 */
export interface SerializedNanoBot {
  id: string;
  position: Vector3;
  velocity: Vector3;
  state: NanoBotState;
  energy: number;
  health: number;
  generation: number;
  parentId: string | null;
  childIds: string[];
  memory: Memory;
  skills: Array<{ id: string; skill: Skill }>;
  createdAt: number;
  config: NanoBotConfig;
}

/**
 * NanoBot - Core class representing a single autonomous nanobot
 */
export class NanoBot extends EventEmitter {
  // Core Properties
  public readonly id: string;
  public position: Vector3;
  public velocity: Vector3;
  public state: NanoBotState;
  public energy: number;
  public health: number;
  public generation: number;
  public parentId: string | null;
  public childIds: string[];
  public readonly createdAt: number;

  // AI & Cognition
  public brain: NanoBotBrain;
  public memory: Memory;
  public skills: Map<string, Skill>;

  // Configuration
  private config: NanoBotConfig;
  private lastUpdate: number;
  private lastThinkTime: number;
  private thinkInterval: number = 1000; // Think once per second
  private currentTask: Task | null = null;
  private actionQueue: BotAction[] = [];

  // Constants
  private readonly MAX_ENERGY = 1000;
  private readonly MAX_HEALTH = 100;
  private readonly REPLICATION_ENERGY_COST = 300;
  private readonly REPLICATION_COOLDOWN = 5000; // 5 seconds
  private lastReplicationTime: number = 0;

  constructor(config: Partial<NanoBotConfig> = {}) {
    super();

    // Initialize core properties
    this.id = config.id || randomUUID();
    this.position = config.position || { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.state = config.state || NanoBotState.IDLE;
    this.energy = config.energy !== undefined ? config.energy : this.MAX_ENERGY;
    this.health = this.MAX_HEALTH;
    this.generation = config.generation || 0;
    this.parentId = config.parentId || null;
    this.childIds = [];
    this.createdAt = config.createdAt || Date.now();
    this.lastUpdate = Date.now();
    this.lastThinkTime = Date.now();

    // Initialize brain
    this.brain = new NanoBotBrain({
      providerType: config.aiProvider as any,
      apiKey: config.apiKey,
      model: config.model,
      temperature: 0.7,
      personality: 'explorer',
    });

    // Initialize memory
    this.memory = this.initializeMemory();

    // Initialize skills
    this.skills = new Map();
    this.initializeDefaultSkills();

    // Store config
    this.config = {
      id: this.id,
      position: this.position,
      energy: this.energy,
      generation: this.generation,
      parentId: this.parentId,
      state: this.state,
      aiProvider: config.aiProvider || 'groq',
      apiKey: config.apiKey || '',
      model: config.model || 'llama-3.1-70b-versatile',
      maxClones: config.maxClones || 10,
      activeClones: 0,
      theme: config.theme || 'default',
      name: config.name,
      tags: config.tags,
      createdAt: this.createdAt,
      lastActiveAt: Date.now(),
      maxTaskQueueSize: config.maxTaskQueueSize || 10,
      energyConsumptionRate: config.energyConsumptionRate || 1,
      energyRegenerationRate: config.energyRegenerationRate || 0.5,
    };

    // Emit creation event
    this.emit('created', { botId: this.id, generation: this.generation });
  }

  /**
   * Initialize default memory structure
   */
  private initializeMemory(): Memory {
    return {
      experiences: [],
      knowledge: [],
      shortTerm: {},
      longTerm: {},
      maxExperiences: 1000,
      maxKnowledge: 500,
      lastConsolidation: Date.now(),
      stats: {
        totalExperiences: 0,
        totalKnowledge: 0,
        positiveOutcomes: 0,
        negativeOutcomes: 0,
        averageImportance: 0,
      },
    };
  }

  /**
   * Initialize default skills
   */
  private initializeDefaultSkills(): void {
    const defaultSkills: Skill[] = [
      {
        id: 'move',
        name: 'Movement',
        level: 10,
        description: 'Basic movement capability',
        energyCost: 1,
        cooldown: 100,
        lastUsed: 0,
        timesUsed: 0,
        successRate: 1.0,
      },
      {
        id: 'scan',
        name: 'Environmental Scan',
        level: 5,
        description: 'Scan surroundings for resources and threats',
        energyCost: 5,
        cooldown: 500,
        lastUsed: 0,
        timesUsed: 0,
        successRate: 0.9,
      },
      {
        id: 'gather',
        name: 'Resource Gathering',
        level: 1,
        description: 'Gather resources from environment',
        energyCost: 10,
        cooldown: 1000,
        lastUsed: 0,
        timesUsed: 0,
        successRate: 0.7,
      },
      {
        id: 'build',
        name: 'Construction',
        level: 1,
        description: 'Build structures and modify terrain',
        energyCost: 20,
        cooldown: 2000,
        lastUsed: 0,
        timesUsed: 0,
        successRate: 0.6,
      },
      {
        id: 'communicate',
        name: 'Communication',
        level: 5,
        description: 'Communicate with other nanobots',
        energyCost: 2,
        cooldown: 200,
        lastUsed: 0,
        timesUsed: 0,
        successRate: 0.95,
      },
    ];

    defaultSkills.forEach(skill => this.skills.set(skill.id, skill));
  }

  /**
   * Update bot state each frame
   * @param deltaTime - Time elapsed since last update (in seconds)
   */
  public update(deltaTime: number): void {
    const now = Date.now();

    // Update position based on velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // Passive energy regeneration or consumption
    if (this.state === NanoBotState.IDLE) {
      this.rechargeEnergy((this.config.energyRegenerationRate || 0.5) * deltaTime);
    } else {
      this.consumeEnergy((this.config.energyConsumptionRate || 1) * deltaTime);
    }

    // Process action queue
    if (this.actionQueue.length > 0 && this.state === NanoBotState.IDLE) {
      const action = this.actionQueue.shift();
      if (action) {
        this.executeAction(action);
      }
    }

    // Think periodically
    if (now - this.lastThinkTime > this.thinkInterval) {
      this.think().catch(err => {
        console.error(`Bot ${this.id} think error:`, err);
      });
      this.lastThinkTime = now;
    }

    // Check critical states
    if (this.energy <= 0) {
      this.emit('energy_depleted', { botId: this.id });
      this.state = NanoBotState.IDLE;
    }

    if (this.health <= 0) {
      this.emit('destroyed', { botId: this.id });
    }

    this.lastUpdate = now;
    this.config.lastActiveAt = now;

    this.emit('updated', {
      botId: this.id,
      position: this.position,
      energy: this.energy,
      health: this.health,
      state: this.state,
    });
  }

  /**
   * Move the bot in a direction
   * @param direction - Direction vector (will be normalized)
   */
  public move(direction: Vector3): void {
    if (this.energy <= 0) {
      this.emit('action_failed', { botId: this.id, action: 'move', reason: 'no_energy' });
      return;
    }

    // Normalize direction
    const magnitude = Math.sqrt(
      direction.x ** 2 + direction.y ** 2 + direction.z ** 2
    );

    if (magnitude > 0) {
      const speed = 5.0; // Units per second
      this.velocity = {
        x: (direction.x / magnitude) * speed,
        y: (direction.y / magnitude) * speed,
        z: (direction.z / magnitude) * speed,
      };

      this.emit('moved', { botId: this.id, direction, velocity: this.velocity });
    }
  }

  /**
   * Create a shadow clone (replication)
   * @returns New NanoBot instance or null if replication failed
   */
  public replicate(): NanoBot | null {
    const now = Date.now();

    // Check cooldown
    if (now - this.lastReplicationTime < this.REPLICATION_COOLDOWN) {
      this.emit('replication_failed', {
        botId: this.id,
        reason: 'cooldown',
        timeRemaining: this.REPLICATION_COOLDOWN - (now - this.lastReplicationTime),
      });
      return null;
    }

    // Check energy
    if (this.energy < this.REPLICATION_ENERGY_COST) {
      this.emit('replication_failed', {
        botId: this.id,
        reason: 'insufficient_energy',
        required: this.REPLICATION_ENERGY_COST,
        current: this.energy,
      });
      return null;
    }

    // Check max clones
    if (this.childIds.length >= this.config.maxClones) {
      this.emit('replication_failed', {
        botId: this.id,
        reason: 'max_clones_reached',
        maxClones: this.config.maxClones,
      });
      return null;
    }

    // Create clone
    this.state = NanoBotState.REPLICATING;
    this.consumeEnergy(this.REPLICATION_ENERGY_COST);

    const clone = new NanoBot({
      position: { ...this.position },
      generation: this.generation + 1,
      parentId: this.id,
      aiProvider: this.config.aiProvider,
      apiKey: this.config.apiKey,
      model: this.config.model,
      maxClones: this.config.maxClones,
      theme: this.config.theme,
      energy: this.MAX_ENERGY * 0.5, // Clone starts with 50% energy
    });

    // Share 50% of knowledge with clone
    clone.memory.knowledge = this.memory.knowledge
      .slice()
      .map(k => ({
        ...k,
        id: randomUUID(),
        source: 'inherited' as const,
        confidence: k.confidence * 0.8, // Slightly reduced confidence
        acquiredAt: Date.now(),
        useCount: 0,
        lastUsedAt: Date.now(),
      }));

    // Share some recent experiences
    const recentExperiences = this.memory.experiences.slice(-10);
    clone.memory.experiences = recentExperiences.map(e => ({
      ...e,
      id: randomUUID(),
      timestamp: Date.now(),
    }));

    // Inherit skills with reduced levels
    this.skills.forEach((skill, skillId) => {
      const inheritedSkill: Skill = {
        ...skill,
        id: skillId,
        level: Math.floor(skill.level * 0.7),
        timesUsed: 0,
        lastUsed: 0,
      };
      clone.skills.set(skillId, inheritedSkill);
    });

    this.childIds.push(clone.id);
    this.config.activeClones = this.childIds.length;
    this.lastReplicationTime = now;
    this.state = NanoBotState.IDLE;

    this.emit('replicated', {
      parentId: this.id,
      cloneId: clone.id,
      generation: clone.generation,
      energyCost: this.REPLICATION_ENERGY_COST,
    });

    return clone;
  }

  /**
   * Merge with another bot, absorbing its memories and knowledge
   * @param otherBot - The bot to merge with
   */
  public merge(otherBot: NanoBot): void {
    if (this.id === otherBot.id) {
      return;
    }

    this.state = NanoBotState.MERGING;

    // Merge knowledge
    otherBot.memory.knowledge.forEach(knowledge => {
      const existing = this.memory.knowledge.find(k => k.topic === knowledge.topic);
      if (existing) {
        // Enhance existing knowledge
        existing.confidence = Math.max(existing.confidence, knowledge.confidence);
        existing.useCount += knowledge.useCount;
        existing.content += `\n[Merged: ${knowledge.content}]`;
      } else {
        // Add new knowledge
        this.memory.knowledge.push({
          ...knowledge,
          id: randomUUID(),
          source: 'shared',
          acquiredAt: Date.now(),
        });
      }
    });

    // Merge experiences
    const importantExperiences = otherBot.memory.experiences
      .filter(e => e.importance > 0.7)
      .slice(-20);

    this.memory.experiences.push(...importantExperiences.map(e => ({
      ...e,
      id: randomUUID(),
      timestamp: Date.now(),
    })));

    // Merge skills
    otherBot.skills.forEach((skill, skillId) => {
      const existing = this.skills.get(skillId);
      if (existing) {
        existing.level = Math.min(100, existing.level + Math.floor(skill.level * 0.3));
        existing.successRate = (existing.successRate + skill.successRate) / 2;
      } else {
        this.skills.set(skillId, {
          ...skill,
          level: Math.floor(skill.level * 0.5),
        });
      }
    });

    // Gain some energy from merge
    this.rechargeEnergy(Math.min(100, otherBot.energy * 0.3));

    this.state = NanoBotState.IDLE;

    this.emit('merged', {
      botId: this.id,
      mergedWith: otherBot.id,
      knowledgeGained: otherBot.memory.knowledge.length,
      experiencesGained: importantExperiences.length,
    });
  }

  /**
   * Learn from an experience
   * @param experience - The experience to learn from
   */
  public learn(experience: Partial<Experience>): void {
    const fullExperience: Experience = {
      id: randomUUID(),
      timestamp: Date.now(),
      type: experience.type || 'observation',
      description: experience.description || '',
      context: experience.context || {},
      outcome: experience.outcome || 'neutral',
      importance: experience.importance || 0.5,
      relatedBots: experience.relatedBots,
      tags: experience.tags,
    };

    this.memory.experiences.push(fullExperience);
    this.memory.stats.totalExperiences++;

    if (fullExperience.outcome === 'positive') {
      this.memory.stats.positiveOutcomes++;
    } else if (fullExperience.outcome === 'negative') {
      this.memory.stats.negativeOutcomes++;
    }

    // Update average importance
    const totalImportance = this.memory.experiences.reduce(
      (sum, e) => sum + e.importance,
      0
    );
    this.memory.stats.averageImportance =
      totalImportance / this.memory.experiences.length;

    // Consolidate memory if needed
    if (this.memory.experiences.length > this.memory.maxExperiences) {
      this.consolidateMemory();
    }

    // Improve related skills
    if (fullExperience.outcome === 'positive') {
      const relatedSkills = Array.from(this.skills.values()).filter(
        skill => fullExperience.description.toLowerCase().includes(skill.name.toLowerCase())
      );

      relatedSkills.forEach(skill => {
        skill.level = Math.min(100, skill.level + 1);
        skill.successRate = Math.min(1.0, skill.successRate + 0.01);
      });
    }

    this.emit('learned', {
      botId: this.id,
      experience: fullExperience,
      totalExperiences: this.memory.stats.totalExperiences,
    });
  }

  /**
   * Consolidate memory by removing less important experiences
   */
  private consolidateMemory(): void {
    // Sort by importance and keep the most important ones
    this.memory.experiences.sort((a, b) => b.importance - a.importance);
    this.memory.experiences = this.memory.experiences.slice(
      0,
      Math.floor(this.memory.maxExperiences * 0.8)
    );

    // Convert some experiences into knowledge
    const significantExperiences = this.memory.experiences.filter(
      e => e.importance > 0.8
    );

    significantExperiences.forEach(exp => {
      const knowledge: Knowledge = {
        id: randomUUID(),
        topic: exp.type,
        content: exp.description,
        source: 'learned',
        confidence: exp.importance,
        useCount: 0,
        acquiredAt: exp.timestamp,
        lastUsedAt: Date.now(),
      };

      this.memory.knowledge.push(knowledge);
      this.memory.stats.totalKnowledge++;
    });

    // Limit knowledge as well
    if (this.memory.knowledge.length > this.memory.maxKnowledge) {
      this.memory.knowledge.sort((a, b) => {
        const scoreA = a.confidence * a.useCount;
        const scoreB = b.confidence * b.useCount;
        return scoreB - scoreA;
      });
      this.memory.knowledge = this.memory.knowledge.slice(
        0,
        Math.floor(this.memory.maxKnowledge * 0.8)
      );
    }

    this.memory.lastConsolidation = Date.now();

    this.emit('memory_consolidated', {
      botId: this.id,
      experiencesRetained: this.memory.experiences.length,
      knowledgeEntries: this.memory.knowledge.length,
    });
  }

  /**
   * Use AI brain to decide next action
   */
  public async think(): Promise<Decision> {
    if (this.state === NanoBotState.REPLICATING || this.state === NanoBotState.MERGING) {
      return {
        action: 'wait',
        priority: 1,
        reasoning: 'Currently busy with state transition',
        confidence: 1.0,
      };
    }

    const context: ThinkingContext = {
      botId: this.id,
      position: this.position,
      energy: this.energy,
      health: this.health,
      currentGoal: this.currentTask?.title,
      memorySnapshot: this.memory.experiences
        .slice(-5)
        .map(e => e.description),
    };

    try {
      const decision = await this.brain.decide(context);

      this.emit('thought', {
        botId: this.id,
        decision,
        context,
      });

      return decision;
    } catch (error) {
      console.error(`Bot ${this.id} thinking error:`, error);
      return {
        action: 'idle',
        priority: 1,
        reasoning: 'Error in decision making',
        confidence: 0.1,
      };
    }
  }

  /**
   * Execute an action in the world
   * @param action - The action to execute
   */
  public executeAction(action: BotAction): void {
    if (this.energy < action.energyCost) {
      this.emit('action_failed', {
        botId: this.id,
        action: action.type,
        reason: 'insufficient_energy',
      });
      return;
    }

    this.consumeEnergy(action.energyCost);

    // Find related skill and update it
    const skill = this.skills.get(action.type);
    if (skill) {
      const now = Date.now();
      if (now - skill.lastUsed < skill.cooldown) {
        this.emit('action_failed', {
          botId: this.id,
          action: action.type,
          reason: 'cooldown',
        });
        return;
      }

      skill.lastUsed = now;
      skill.timesUsed++;
    }

    this.emit('action_executed', {
      botId: this.id,
      action: action.type,
      parameters: action.parameters,
      energyCost: action.energyCost,
    });

    // Learn from the action
    this.learn({
      type: 'task',
      description: `Executed ${action.type}`,
      outcome: 'positive',
      importance: 0.5,
      context: action.parameters,
    });
  }

  /**
   * Consume energy
   * @param amount - Amount of energy to consume
   */
  public consumeEnergy(amount: number): void {
    this.energy = Math.max(0, this.energy - amount);

    if (this.energy <= 100) {
      this.emit('energy_low', {
        botId: this.id,
        energy: this.energy,
        percentage: (this.energy / this.MAX_ENERGY) * 100,
      });
    }
  }

  /**
   * Recharge energy
   * @param amount - Amount of energy to add
   */
  public rechargeEnergy(amount: number): void {
    this.energy = Math.min(this.MAX_ENERGY, this.energy + amount);
  }

  /**
   * Take damage
   * @param amount - Amount of damage to take
   */
  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);

    this.emit('damaged', {
      botId: this.id,
      damage: amount,
      health: this.health,
    });

    if (this.health <= 0) {
      this.emit('destroyed', { botId: this.id });
    } else if (this.health <= 25) {
      this.emit('health_critical', {
        botId: this.id,
        health: this.health,
      });
    }

    // Learn from taking damage
    this.learn({
      type: 'error',
      description: `Took ${amount} damage`,
      outcome: 'negative',
      importance: 0.7,
      context: { damage: amount, remainingHealth: this.health },
    });
  }

  /**
   * Heal health
   * @param amount - Amount of health to restore
   */
  public heal(amount: number): void {
    const oldHealth = this.health;
    this.health = Math.min(this.MAX_HEALTH, this.health + amount);

    this.emit('healed', {
      botId: this.id,
      amount: this.health - oldHealth,
      health: this.health,
    });
  }

  /**
   * Share memory with another bot
   * @param otherBot - The bot to share memory with
   */
  public shareMemory(otherBot: NanoBot): void {
    // Share recent important knowledge
    const importantKnowledge = this.memory.knowledge
      .filter(k => k.confidence > 0.7)
      .slice(-10);

    importantKnowledge.forEach(knowledge => {
      otherBot.memory.knowledge.push({
        ...knowledge,
        id: randomUUID(),
        source: 'shared',
        acquiredAt: Date.now(),
        confidence: knowledge.confidence * 0.9, // Slightly reduced confidence
      });
    });

    // Share recent successful experiences
    const successfulExperiences = this.memory.experiences
      .filter(e => e.outcome === 'positive' && e.importance > 0.6)
      .slice(-5);

    successfulExperiences.forEach(exp => {
      otherBot.memory.experiences.push({
        ...exp,
        id: randomUUID(),
        timestamp: Date.now(),
        relatedBots: [...(exp.relatedBots || []), this.id],
      });
    });

    this.emit('memory_shared', {
      fromBot: this.id,
      toBot: otherBot.id,
      knowledgeShared: importantKnowledge.length,
      experiencesShared: successfulExperiences.length,
    });

    // Both bots learn from this interaction
    this.learn({
      type: 'interaction',
      description: `Shared memory with bot ${otherBot.id}`,
      outcome: 'positive',
      importance: 0.6,
      relatedBots: [otherBot.id],
    });

    otherBot.learn({
      type: 'interaction',
      description: `Received memory from bot ${this.id}`,
      outcome: 'positive',
      importance: 0.6,
      relatedBots: [this.id],
    });
  }

  /**
   * Serialize bot state for saving
   */
  public serialize(): SerializedNanoBot {
    return {
      id: this.id,
      position: { ...this.position },
      velocity: { ...this.velocity },
      state: this.state,
      energy: this.energy,
      health: this.health,
      generation: this.generation,
      parentId: this.parentId,
      childIds: [...this.childIds],
      memory: {
        ...this.memory,
        experiences: [...this.memory.experiences],
        knowledge: [...this.memory.knowledge],
        shortTerm: { ...this.memory.shortTerm },
        longTerm: { ...this.memory.longTerm },
        stats: { ...this.memory.stats },
      },
      skills: Array.from(this.skills.entries()).map(([id, skill]) => ({
        id,
        skill: { ...skill },
      })),
      createdAt: this.createdAt,
      config: { ...this.config },
    };
  }

  /**
   * Deserialize and recreate a bot from saved state
   * @param data - Serialized bot data
   */
  public static deserialize(data: SerializedNanoBot): NanoBot {
    const bot = new NanoBot({
      id: data.id,
      position: data.position,
      generation: data.generation,
      parentId: data.parentId,
      state: data.state,
      energy: data.energy,
      createdAt: data.createdAt,
      ...data.config,
    });

    // Restore velocity
    bot.velocity = { ...data.velocity };

    // Restore health
    bot.health = data.health;

    // Restore child IDs
    bot.childIds = [...data.childIds];

    // Restore memory
    bot.memory = {
      ...data.memory,
      experiences: data.memory.experiences.map(e => ({ ...e })),
      knowledge: data.memory.knowledge.map(k => ({ ...k })),
      shortTerm: { ...data.memory.shortTerm },
      longTerm: { ...data.memory.longTerm },
      stats: { ...data.memory.stats },
    };

    // Restore skills
    bot.skills.clear();
    data.skills.forEach(({ id, skill }) => {
      bot.skills.set(id, { ...skill });
    });

    return bot;
  }

  /**
   * Get current bot status
   */
  public getStatus(): {
    id: string;
    state: NanoBotState;
    energy: number;
    health: number;
    position: Vector3;
    generation: number;
    childCount: number;
    skillCount: number;
    knowledgeCount: number;
    experienceCount: number;
  } {
    return {
      id: this.id,
      state: this.state,
      energy: this.energy,
      health: this.health,
      position: { ...this.position },
      generation: this.generation,
      childCount: this.childIds.length,
      skillCount: this.skills.size,
      knowledgeCount: this.memory.knowledge.length,
      experienceCount: this.memory.experiences.length,
    };
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.removeAllListeners();
    this.skills.clear();
    this.memory.experiences = [];
    this.memory.knowledge = [];
    this.actionQueue = [];

    this.emit('destroyed', { botId: this.id });
  }
}
