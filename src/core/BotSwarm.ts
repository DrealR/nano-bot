/**
 * BotSwarm - Manages a collection of NanoBots working together
 *
 * Coordinates multiple bots, handles spawning, replication, merging,
 * and task distribution across the swarm.
 */

import { HiveMind, CollectiveIntelligence } from './HiveMind';
import { NanoBot } from './NanoBot';
import {
  Vector3,
  NanoBotConfig,
  SwarmConfig,
  Task,
  Statistics,
  NanoBotState,
  AIProviderType,
  ColorTheme,
  Memory,
} from './types';

/**
 * Formation types for organizing bots spatially
 */
export type FormationType =
  | 'grid'
  | 'circle'
  | 'line'
  | 'triangle'
  | 'sphere'
  | 'random'
  | 'cluster';

/**
 * Default swarm configuration
 */
const DEFAULT_SWARM_CONFIG: SwarmConfig = {
  maxBots: 100,
  minBots: 1,
  maxTotalEnergy: 10000,
  energyDistribution: 'equal',
  communicationRange: 100,
  autoReplication: false,
  replicationThreshold: 0.8,
  autoMerge: false,
  mergeThreshold: 0.3,
  globalTaskQueueSize: 1000,
  loadBalancing: 'least-loaded',
  hiveMindEnabled: true,
  hiveMindUpdateInterval: 1000,
  visualLearningEnabled: false,
  maxGenerations: 5,
  coordinationMode: 'distributed',
};

/**
 * Class managing a collection of NanoBots as a coordinated swarm
 */
export class BotSwarm {
  // Map of bot IDs to bot instances
  private bots: Map<string, NanoBot>;

  // HiveMind instance for shared intelligence
  private hiveMind: HiveMind;

  // Swarm configuration
  private config: SwarmConfig;

  // Global task queue
  private taskQueue: Task[];

  // Swarm statistics
  private stats: {
    startTime: number;
    totalReplications: number;
    totalMerges: number;
    totalTasksCompleted: number;
    totalTasksFailed: number;
    totalEnergyConsumed: number;
    botStats: Map<string, {
      tasksCompleted: number;
      energyConsumed: number;
      clones: number;
      taskTimes: number[];
    }>;
  };

  // Last update timestamp
  private lastUpdateTime: number;

  // Next bot ID counter
  private nextBotId: number;

  constructor(config: Partial<SwarmConfig> = {}) {
    this.bots = new Map();
    this.hiveMind = HiveMind.getInstance();
    this.config = { ...DEFAULT_SWARM_CONFIG, ...config };
    this.taskQueue = [];
    this.stats = {
      startTime: Date.now(),
      totalReplications: 0,
      totalMerges: 0,
      totalTasksCompleted: 0,
      totalTasksFailed: 0,
      totalEnergyConsumed: 0,
      botStats: new Map(),
    };
    this.lastUpdateTime = Date.now();
    this.nextBotId = 1;

    // Set up HiveMind message handlers if enabled
    if (this.config.hiveMindEnabled) {
      this.setupHiveMindHandlers();
    }
  }

  /**
   * Add a bot to the swarm
   * @param bot - Bot instance to add
   */
  public addBot(bot: NanoBot): void {
    if (this.bots.size >= this.config.maxBots) {
      throw new Error(`Swarm has reached maximum capacity of ${this.config.maxBots} bots`);
    }

    if (this.bots.has(bot.id)) {
      throw new Error(`Bot with ID ${bot.id} already exists in swarm`);
    }

    this.bots.set(bot.id, bot);

    // Connect to HiveMind if enabled
    if (this.config.hiveMindEnabled) {
      this.hiveMind.connect(bot.id, bot.generation, bot.parentId);

      // Sync bot's memory with hive mind
      const syncedMemory = this.hiveMind.syncMemory(bot.id, bot.memory);
      bot.memory = syncedMemory;
    }

    // Initialize bot stats
    this.stats.botStats.set(bot.id, {
      tasksCompleted: 0,
      energyConsumed: 0,
      clones: 0,
      taskTimes: [],
    });
  }

  /**
   * Remove a bot from the swarm
   * @param id - ID of the bot to remove
   * @param preserveKnowledge - Whether to keep bot's knowledge in hive mind
   */
  public removeBot(id: string, preserveKnowledge: boolean = true): void {
    const bot = this.bots.get(id);
    if (!bot) {
      throw new Error(`Bot with ID ${id} not found in swarm`);
    }

    // Disconnect from HiveMind
    if (this.config.hiveMindEnabled) {
      this.hiveMind.disconnect(id, preserveKnowledge);
    }

    // Reassign bot's current task to queue if it has one
    const currentTask = bot.memory.shortTerm['currentTask'];
    if (currentTask) {
      this.taskQueue.push(currentTask);
    }

    this.bots.delete(id);
  }

  /**
   * Spawn a new bot at a specific position
   * @param position - 3D position for the new bot
   * @param config - Optional configuration overrides
   * @returns The newly created bot
   */
  public spawnBot(position: Vector3, config: Partial<NanoBotConfig> = {}): NanoBot {
    if (this.bots.size >= this.config.maxBots) {
      throw new Error(`Cannot spawn bot: swarm at maximum capacity (${this.config.maxBots})`);
    }

    // Create bot configuration
    const botConfig: Partial<NanoBotConfig> = {
      id: `bot-${this.nextBotId++}`,
      position,
      energy: 100,
      generation: 0,
      parentId: null,
      state: NanoBotState.IDLE,
      aiProvider: 'groq' as AIProviderType,
      apiKey: '',
      model: 'llama-3.1-8b-instant',
      maxClones: 3,
      theme: 'default' as ColorTheme,
      ...config,
    };

    // Create actual NanoBot instance
    const bot = new NanoBot(botConfig);

    this.addBot(bot);
    return bot;
  }

  /**
   * Replicate a bot (Shadow Clone Jutsu)
   * @param id - ID of the bot to replicate
   * @returns The newly created clone
   */
  public replicateBot(id: string): NanoBot {
    const parent = this.bots.get(id);
    if (!parent) {
      throw new Error(`Bot with ID ${id} not found in swarm`);
    }

    if (parent.generation >= this.config.maxGenerations) {
      throw new Error(`Bot ${id} has reached maximum generation depth (${this.config.maxGenerations})`);
    }

    // Use NanoBot's built-in replication method
    const clone = parent.replicate();

    if (!clone) {
      throw new Error(`Bot ${id} failed to replicate`);
    }

    // Add clone to swarm
    this.addBot(clone);

    // Notify HiveMind of replication (Shadow Clone Jutsu - share ALL memories)
    if (this.config.hiveMindEnabled) {
      this.hiveMind.onBotReplicate(parent.id, clone.id, clone.generation);

      // Sync clone's memory with hive mind immediately
      const syncedMemory = this.hiveMind.syncMemory(clone.id, clone.memory);
      clone.memory = syncedMemory;
    }

    // Update stats
    this.stats.totalReplications++;
    const parentStats = this.stats.botStats.get(parent.id);
    if (parentStats) {
      parentStats.clones++;
    }

    return clone;
  }

  /**
   * Merge two bots (Fusion Jutsu)
   * @param id1 - ID of the first bot
   * @param id2 - ID of the second bot
   * @returns The surviving bot
   */
  public mergeBot(id1: string, id2: string): NanoBot {
    const bot1 = this.bots.get(id1);
    const bot2 = this.bots.get(id2);

    if (!bot1 || !bot2) {
      throw new Error(`One or both bots not found: ${id1}, ${id2}`);
    }

    // Determine survivor (higher energy wins)
    const [survivor, absorbed] = bot1.energy >= bot2.energy
      ? [bot1, bot2]
      : [bot2, bot1];

    // Use NanoBot's built-in merge method
    survivor.merge(absorbed);

    // Move to midpoint position
    survivor.position = {
      x: (bot1.position.x + bot2.position.x) / 2,
      y: (bot1.position.y + bot2.position.y) / 2,
      z: (bot1.position.z + bot2.position.z) / 2,
    };

    // Notify HiveMind of merge
    if (this.config.hiveMindEnabled) {
      this.hiveMind.onBotMerge(survivor.id, absorbed.id);

      // Sync survivor's memory with hive mind after merge
      const syncedMemory = this.hiveMind.syncMemory(survivor.id, survivor.memory);
      survivor.memory = syncedMemory;
    }

    // Remove absorbed bot
    this.removeBot(absorbed.id, true);

    // Update stats
    this.stats.totalMerges++;

    return survivor;
  }

  /**
   * Update all bots in the swarm
   * @param deltaTime - Time elapsed since last update (ms)
   */
  public update(deltaTime: number): void {
    const currentTime = Date.now();
    const actualDelta = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;

    // Update each bot
    for (const bot of this.bots.values()) {
      const energyBefore = bot.energy;
      bot.update(actualDelta);
      const energyConsumed = energyBefore - bot.energy;

      if (energyConsumed > 0) {
        this.stats.totalEnergyConsumed += energyConsumed;
        const botStats = this.stats.botStats.get(bot.id);
        if (botStats) {
          botStats.energyConsumed += energyConsumed;
        }
      }
    }

    // Distribute energy if needed
    this.distributeEnergy();

    // Assign tasks from queue
    this.assignQueuedTasks();

    // Auto-replication check
    if (this.config.autoReplication) {
      this.checkAutoReplication();
    }

    // Auto-merge check
    if (this.config.autoMerge) {
      this.checkAutoMerge();
    }

    // Sync with HiveMind periodically
    if (this.config.hiveMindEnabled &&
        currentTime % this.config.hiveMindUpdateInterval < actualDelta) {
      this.syncAllBotsWithHiveMind();
    }
  }

  /**
   * Get all bots within a certain radius of a position
   * @param position - Center position
   * @param radius - Search radius
   * @returns Array of bots within range
   */
  public getBotsInRadius(position: Vector3, radius: number): NanoBot[] {
    const results: NanoBot[] = [];

    for (const bot of this.bots.values()) {
      const distance = this.calculateDistance(position, bot.position);
      if (distance <= radius) {
        results.push(bot);
      }
    }

    return results;
  }

  /**
   * Assign a task to a specific bot
   * @param botId - ID of the bot
   * @param task - Task to assign
   */
  public assignTask(botId: string, task: Task): void {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot with ID ${botId} not found in swarm`);
    }

    task.assignedTo = botId;
    task.status = 'in-progress';
    task.startedAt = Date.now();

    // Store task in bot's short-term memory
    bot.memory.shortTerm['currentTask'] = task;
    bot.state = NanoBotState.WORKING;
  }

  /**
   * Form a spatial formation with the bots
   * @param type - Type of formation
   * @param center - Center point of the formation
   * @param spacing - Distance between bots
   */
  public formFormation(
    type: FormationType,
    center: Vector3 = { x: 0, y: 0, z: 0 },
    spacing: number = 10
  ): void {
    const botArray = Array.from(this.bots.values());
    const count = botArray.length;

    switch (type) {
      case 'grid':
        this.formGridFormation(botArray, center, spacing);
        break;
      case 'circle':
        this.formCircleFormation(botArray, center, spacing);
        break;
      case 'line':
        this.formLineFormation(botArray, center, spacing);
        break;
      case 'triangle':
        this.formTriangleFormation(botArray, center, spacing);
        break;
      case 'sphere':
        this.formSphereFormation(botArray, center, spacing);
        break;
      case 'cluster':
        this.formClusterFormation(botArray, center, spacing);
        break;
      case 'random':
        this.formRandomFormation(botArray, center, spacing * count);
        break;
    }
  }

  /**
   * Get comprehensive statistics about the swarm
   * @returns Statistics object
   */
  public getStatistics(): Statistics {
    const currentTime = Date.now();
    const uptime = currentTime - this.stats.startTime;

    let activeBots = 0;
    let tasksPending = 0;
    let tasksInProgress = 0;
    let totalEnergy = 0;

    for (const bot of this.bots.values()) {
      if (bot.state !== NanoBotState.IDLE) {
        activeBots++;
      }
      totalEnergy += bot.energy;

      // Check current task
      const currentTask = bot.memory.shortTerm['currentTask'];
      if (currentTask) {
        if (currentTask.status === 'pending') tasksPending++;
        if (currentTask.status === 'in-progress') tasksInProgress++;
      }
    }

    tasksPending += this.taskQueue.filter(t => t.status === 'pending').length;

    // Calculate bot-specific stats
    const botStats: Record<string, any> = {};
    for (const [botId, stats] of this.stats.botStats.entries()) {
      const avgTaskTime = stats.taskTimes.length > 0
        ? stats.taskTimes.reduce((a, b) => a + b, 0) / stats.taskTimes.length
        : 0;

      botStats[botId] = {
        tasksCompleted: stats.tasksCompleted,
        energyConsumed: stats.energyConsumed,
        clones: stats.clones,
        avgTaskTime,
      };
    }

    const avgTaskCompletionTime = this.calculateAverageTaskTime();
    const avgEnergyPerTask = this.stats.totalTasksCompleted > 0
      ? this.stats.totalEnergyConsumed / this.stats.totalTasksCompleted
      : 0;

    return {
      totalBots: this.bots.size,
      activeBots,
      tasksCompleted: this.stats.totalTasksCompleted,
      tasksInProgress,
      tasksPending,
      tasksFailed: this.stats.totalTasksFailed,
      totalEnergyConsumed: this.stats.totalEnergyConsumed,
      currentTotalEnergy: totalEnergy,
      totalReplications: this.stats.totalReplications,
      totalMerges: this.stats.totalMerges,
      messagesSent: this.hiveMind.getStats().messagesProcessed,
      avgTaskCompletionTime,
      avgEnergyPerTask,
      uptime,
      startTime: this.stats.startTime,
      botStats,
    };
  }

  /**
   * Get the HiveMind instance
   */
  public getHiveMind(): HiveMind {
    return this.hiveMind;
  }

  /**
   * Get collective intelligence metrics
   */
  public getCollectiveIntelligence(): CollectiveIntelligence {
    return this.hiveMind.getCollectiveIntelligence();
  }

  /**
   * Get a bot by ID
   */
  public getBot(id: string): NanoBot | undefined {
    return this.bots.get(id);
  }

  /**
   * Get all bots
   */
  public getAllBots(): NanoBot[] {
    return Array.from(this.bots.values());
  }

  /**
   * Get swarm configuration
   */
  public getConfig(): SwarmConfig {
    return { ...this.config };
  }

  // Private helper methods

  private setupHiveMindHandlers(): void {
    // Handle task requests from bots
    this.hiveMind.onMessage('task_request', (msg) => {
      if (this.taskQueue.length > 0) {
        const task = this.taskQueue.shift()!;
        this.assignTask(msg.senderId, task);
      }
    });

    // Handle task completions
    this.hiveMind.onMessage('task_completion', (msg) => {
      this.stats.totalTasksCompleted++;
      const botStats = this.stats.botStats.get(msg.senderId);
      if (botStats) {
        botStats.tasksCompleted++;
        if (msg.payload.duration) {
          botStats.taskTimes.push(msg.payload.duration);
        }
      }
    });
  }

  private distributeEnergy(): void {
    if (this.config.energyDistribution === 'equal') {
      // Equal distribution among all bots
      const totalEnergy = this.calculateTotalEnergy();
      const targetEnergy = totalEnergy / this.bots.size;

      for (const bot of this.bots.values()) {
        bot.energy = targetEnergy;
      }
    }
    // Other distribution strategies can be implemented here
  }

  private assignQueuedTasks(): void {
    while (this.taskQueue.length > 0 && this.hasAvailableBot()) {
      const task = this.taskQueue.shift()!;
      const bot = this.selectBotForTask(task);

      if (bot) {
        this.assignTask(bot.id, task);
      } else {
        // Put task back in queue
        this.taskQueue.unshift(task);
        break;
      }
    }
  }

  private hasAvailableBot(): boolean {
    for (const bot of this.bots.values()) {
      if (bot.state === NanoBotState.IDLE || !bot.memory.shortTerm['currentTask']) {
        return true;
      }
    }
    return false;
  }

  private selectBotForTask(task: Task): NanoBot | null {
    let selectedBot: NanoBot | null = null;

    switch (this.config.loadBalancing) {
      case 'least-loaded':
        let maxEnergy = -1;
        for (const bot of this.bots.values()) {
          // Prefer bots with no current task and higher energy
          const hasTask = bot.memory.shortTerm['currentTask'] ? 1 : 0;
          if (!hasTask && bot.energy > maxEnergy) {
            maxEnergy = bot.energy;
            selectedBot = bot;
          }
        }
        // If no idle bot, pick any with highest energy
        if (!selectedBot) {
          for (const bot of this.bots.values()) {
            if (bot.energy > maxEnergy) {
              maxEnergy = bot.energy;
              selectedBot = bot;
            }
          }
        }
        break;

      case 'round-robin':
        const botsArray = Array.from(this.bots.values());
        selectedBot = botsArray[this.stats.totalTasksCompleted % botsArray.length];
        break;

      case 'random':
        const randomBots = Array.from(this.bots.values());
        selectedBot = randomBots[Math.floor(Math.random() * randomBots.length)];
        break;

      default:
        selectedBot = this.bots.values().next().value;
    }

    return selectedBot;
  }

  private checkAutoReplication(): void {
    // Auto-replicate if task queue is building up
    const queueRatio = this.taskQueue.length / Math.max(this.bots.size, 1);

    if (queueRatio > this.config.replicationThreshold) {
      // Find bot with highest energy that can replicate
      let maxEnergy = 300; // Minimum energy for replication
      let bestBot: NanoBot | null = null;

      for (const bot of this.bots.values()) {
        if (bot.energy > maxEnergy && bot.generation < this.config.maxGenerations) {
          maxEnergy = bot.energy;
          bestBot = bot;
        }
      }

      if (bestBot) {
        try {
          this.replicateBot(bestBot.id);
        } catch (error) {
          // Swarm at capacity or other error
        }
      }
    }
  }

  private checkAutoMerge(): void {
    // Auto-merge if efficiency is low
    const idleBots = Array.from(this.bots.values()).filter(
      bot => bot.state === NanoBotState.IDLE && !bot.memory.shortTerm['currentTask']
    );

    if (idleBots.length >= 2 && this.bots.size > this.config.minBots) {
      // Merge two idle bots
      try {
        this.mergeBot(idleBots[0].id, idleBots[1].id);
      } catch (error) {
        // Merge failed
      }
    }
  }

  private syncAllBotsWithHiveMind(): void {
    for (const bot of this.bots.values()) {
      const syncedMemory = this.hiveMind.syncMemory(bot.id, bot.memory);
      bot.memory = syncedMemory;
    }
  }

  private calculateDistance(pos1: Vector3, pos2: Vector3): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dz = pos2.z - pos1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private calculateTotalEnergy(): number {
    let total = 0;
    for (const bot of this.bots.values()) {
      total += bot.energy;
    }
    return total;
  }

  private calculateAverageTasksPerBot(): number {
    let total = 0;
    for (const bot of this.bots.values()) {
      if (bot.memory.shortTerm['currentTask']) {
        total += 1;
      }
    }
    return this.bots.size > 0 ? total / this.bots.size : 0;
  }

  private calculateAverageTaskTime(): number {
    let totalTime = 0;
    let count = 0;

    for (const stats of this.stats.botStats.values()) {
      totalTime += stats.taskTimes.reduce((a, b) => a + b, 0);
      count += stats.taskTimes.length;
    }

    return count > 0 ? totalTime / count : 0;
  }

  // Formation methods

  private formGridFormation(bots: NanoBot[], center: Vector3, spacing: number): void {
    const gridSize = Math.ceil(Math.sqrt(bots.length));
    let index = 0;

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        if (index >= bots.length) break;

        bots[index].position = {
          x: center.x + (x - gridSize / 2) * spacing,
          y: center.y + (y - gridSize / 2) * spacing,
          z: center.z,
        };
        index++;
      }
    }
  }

  private formCircleFormation(bots: NanoBot[], center: Vector3, spacing: number): void {
    const radius = (bots.length * spacing) / (2 * Math.PI);

    bots.forEach((bot, i) => {
      const angle = (2 * Math.PI * i) / bots.length;
      bot.position = {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
        z: center.z,
      };
    });
  }

  private formLineFormation(bots: NanoBot[], center: Vector3, spacing: number): void {
    bots.forEach((bot, i) => {
      bot.position = {
        x: center.x + (i - bots.length / 2) * spacing,
        y: center.y,
        z: center.z,
      };
    });
  }

  private formTriangleFormation(bots: NanoBot[], center: Vector3, spacing: number): void {
    let index = 0;
    let row = 0;

    while (index < bots.length) {
      const botsInRow = row + 1;
      for (let i = 0; i < botsInRow && index < bots.length; i++) {
        bots[index].position = {
          x: center.x + (i - botsInRow / 2) * spacing,
          y: center.y - row * spacing * 0.866, // sqrt(3)/2 for equilateral
          z: center.z,
        };
        index++;
      }
      row++;
    }
  }

  private formSphereFormation(bots: NanoBot[], center: Vector3, spacing: number): void {
    const radius = (bots.length * spacing) / (4 * Math.PI);

    bots.forEach((bot, i) => {
      const phi = Math.acos(-1 + (2 * i) / bots.length);
      const theta = Math.sqrt(bots.length * Math.PI) * phi;

      bot.position = {
        x: center.x + radius * Math.cos(theta) * Math.sin(phi),
        y: center.y + radius * Math.sin(theta) * Math.sin(phi),
        z: center.z + radius * Math.cos(phi),
      };
    });
  }

  private formClusterFormation(bots: NanoBot[], center: Vector3, spacing: number): void {
    // Group bots by family/generation
    const families = new Map<string, NanoBot[]>();

    for (const bot of bots) {
      const rootId = this.findRootAncestor(bot);
      if (!families.has(rootId)) {
        families.set(rootId, []);
      }
      families.get(rootId)!.push(bot);
    }

    // Position each family in a cluster
    const familyArray = Array.from(families.entries());
    const clusterRadius = spacing * 3;

    familyArray.forEach(([rootId, familyBots], familyIndex) => {
      const angle = (2 * Math.PI * familyIndex) / familyArray.length;
      const clusterCenter = {
        x: center.x + clusterRadius * Math.cos(angle),
        y: center.y + clusterRadius * Math.sin(angle),
        z: center.z,
      };

      // Arrange family members in a tight circle
      this.formCircleFormation(familyBots, clusterCenter, spacing / 2);
    });
  }

  private formRandomFormation(bots: NanoBot[], center: Vector3, maxRadius: number): void {
    bots.forEach(bot => {
      const radius = Math.random() * maxRadius;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.random() * Math.PI;

      bot.position = {
        x: center.x + radius * Math.cos(theta) * Math.sin(phi),
        y: center.y + radius * Math.sin(theta) * Math.sin(phi),
        z: center.z + radius * Math.cos(phi),
      };
    });
  }

  private findRootAncestor(bot: NanoBot): string {
    let current = bot;
    while (current.parentId) {
      const parent = this.bots.get(current.parentId);
      if (!parent) break;
      current = parent;
    }
    return current.id;
  }
}
