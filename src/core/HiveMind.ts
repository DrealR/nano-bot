/**
 * HiveMind - Shared memory system for NanoBot collective intelligence
 *
 * Like Shadow Clone Jutsu, when a bot replicates, all clones share the same
 * memories and any learning by one is immediately known by all connected bots.
 */

import {
  HiveMindMessage,
  Knowledge,
  Experience,
  Memory,
  HiveMindMessageType,
} from './types';

/**
 * Represents a node in the knowledge graph showing relationships
 * between concepts
 */
export interface KnowledgeGraphNode {
  id: string;
  topic: string;
  connections: string[]; // IDs of related knowledge nodes
  strength: number; // Connection strength (0-1)
  cluster?: string; // Optional cluster/category grouping
}

/**
 * Entry in the shared knowledge pool
 */
export interface SharedKnowledgeEntry {
  knowledge: Knowledge;
  contributingBots: Set<string>; // Bots that have contributed to this knowledge
  consensusScore: number; // Agreement level across bots (0-1)
  lastUpdated: number;
  version: number; // Version number for tracking updates
}

/**
 * Statistics about the collective intelligence
 */
export interface CollectiveIntelligence {
  totalKnowledge: number;
  totalExperiences: number;
  connectedBots: number;
  averageConfidence: number;
  knowledgeDiversity: number; // Measure of topic variety
  consensusLevel: number; // Average consensus across all knowledge
  networkStrength: number; // Connectivity between knowledge nodes
  generationalDepth: number; // Deepest clone generation
}

/**
 * Singleton class managing shared knowledge across all bots
 * Implements the "Shadow Clone Jutsu" memory sharing paradigm
 */
export class HiveMind {
  private static instance: HiveMind | null = null;

  // Shared knowledge pool accessible to all connected bots
  private sharedMemory: Map<string, SharedKnowledgeEntry>;

  // Set of bot IDs currently connected to the hive mind
  private connectedBots: Set<string>;

  // Message queue for inter-bot communication
  private messageQueue: HiveMindMessage[];

  // Knowledge graph mapping relationships between concepts
  private knowledgeGraph: Map<string, KnowledgeGraphNode>;

  // Parent-child relationships for clone hierarchies
  private cloneHierarchy: Map<string, Set<string>>; // parentId -> Set of childIds

  // Reverse lookup for finding parent of any bot
  private parentLookup: Map<string, string>; // childId -> parentId

  // Generation tracking for each bot
  private botGenerations: Map<string, number>;

  // Message handlers for different message types
  private messageHandlers: Map<HiveMindMessageType, ((msg: HiveMindMessage) => void)[]>;

  // Statistics tracking
  private stats: {
    messagesProcessed: number;
    knowledgeShared: number;
    replicationsHandled: number;
    mergesHandled: number;
  };

  private constructor() {
    this.sharedMemory = new Map();
    this.connectedBots = new Set();
    this.messageQueue = [];
    this.knowledgeGraph = new Map();
    this.cloneHierarchy = new Map();
    this.parentLookup = new Map();
    this.botGenerations = new Map();
    this.messageHandlers = new Map();
    this.stats = {
      messagesProcessed: 0,
      knowledgeShared: 0,
      replicationsHandled: 0,
      mergesHandled: 0,
    };
  }

  /**
   * Get the singleton HiveMind instance
   */
  public static getInstance(): HiveMind {
    if (!HiveMind.instance) {
      HiveMind.instance = new HiveMind();
    }
    return HiveMind.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  public static resetInstance(): void {
    HiveMind.instance = null;
  }

  /**
   * Connect a bot to the hive mind
   * @param botId - Unique identifier of the bot
   * @param generation - Generation number of the bot (0 for original)
   * @param parentId - Optional parent bot ID for clones
   */
  public connect(botId: string, generation: number = 0, parentId: string | null = null): void {
    if (this.connectedBots.has(botId)) {
      console.warn(`Bot ${botId} is already connected to the hive mind`);
      return;
    }

    this.connectedBots.add(botId);
    this.botGenerations.set(botId, generation);

    if (parentId) {
      this.parentLookup.set(botId, parentId);

      if (!this.cloneHierarchy.has(parentId)) {
        this.cloneHierarchy.set(parentId, new Set());
      }
      this.cloneHierarchy.get(parentId)!.add(botId);
    }

    // Broadcast connection event
    this.broadcast({
      id: this.generateId(),
      senderId: 'hivemind',
      recipientId: null,
      type: 'status_update',
      payload: {
        event: 'bot_connected',
        botId,
        generation,
        parentId,
        totalConnected: this.connectedBots.size,
      },
      priority: 5,
      timestamp: Date.now(),
      requiresAck: false,
    });
  }

  /**
   * Disconnect a bot from the hive mind
   * @param botId - Unique identifier of the bot
   * @param preserveKnowledge - Whether to keep the bot's contributions in shared memory
   */
  public disconnect(botId: string, preserveKnowledge: boolean = true): void {
    if (!this.connectedBots.has(botId)) {
      console.warn(`Bot ${botId} is not connected to the hive mind`);
      return;
    }

    this.connectedBots.delete(botId);
    this.botGenerations.delete(botId);

    // Clean up hierarchy
    const parentId = this.parentLookup.get(botId);
    if (parentId) {
      const siblings = this.cloneHierarchy.get(parentId);
      if (siblings) {
        siblings.delete(botId);
        if (siblings.size === 0) {
          this.cloneHierarchy.delete(parentId);
        }
      }
      this.parentLookup.delete(botId);
    }

    // Clean up children references
    this.cloneHierarchy.delete(botId);

    // Optionally remove bot's contributions from shared memory
    if (!preserveKnowledge) {
      for (const [key, entry] of this.sharedMemory.entries()) {
        entry.contributingBots.delete(botId);
        if (entry.contributingBots.size === 0) {
          this.sharedMemory.delete(key);
          this.knowledgeGraph.delete(key);
        }
      }
    }

    // Broadcast disconnection event
    this.broadcast({
      id: this.generateId(),
      senderId: 'hivemind',
      recipientId: null,
      type: 'status_update',
      payload: {
        event: 'bot_disconnected',
        botId,
        totalConnected: this.connectedBots.size,
      },
      priority: 5,
      timestamp: Date.now(),
      requiresAck: false,
    });
  }

  /**
   * Broadcast a message to all connected bots
   * @param message - Message to broadcast
   */
  public broadcast(message: HiveMindMessage): void {
    message.recipientId = null; // Ensure it's a broadcast
    this.messageQueue.push(message);
    this.stats.messagesProcessed++;

    // Process handlers for this message type
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }

  /**
   * Send a message to specific bot(s)
   * @param message - Message to send
   */
  public sendMessage(message: HiveMindMessage): void {
    if (!message.recipientId) {
      throw new Error('Message must have a recipient ID (use broadcast() for broadcasts)');
    }

    const recipients = Array.isArray(message.recipientId)
      ? message.recipientId
      : [message.recipientId];

    // Validate recipients are connected
    for (const recipientId of recipients) {
      if (!this.connectedBots.has(recipientId)) {
        console.warn(`Recipient ${recipientId} is not connected to the hive mind`);
      }
    }

    this.messageQueue.push(message);
    this.stats.messagesProcessed++;

    // Process handlers for this message type
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }

  /**
   * Register a handler for a specific message type
   * @param type - Message type to handle
   * @param handler - Handler function
   */
  public onMessage(type: HiveMindMessageType, handler: (msg: HiveMindMessage) => void): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  /**
   * Share knowledge with the collective
   * @param botId - ID of the bot sharing knowledge
   * @param knowledge - Knowledge to share
   */
  public shareKnowledge(botId: string, knowledge: Knowledge): void {
    if (!this.connectedBots.has(botId)) {
      throw new Error(`Bot ${botId} is not connected to the hive mind`);
    }

    const key = `${knowledge.topic}:${knowledge.id}`;

    if (this.sharedMemory.has(key)) {
      // Update existing knowledge
      const entry = this.sharedMemory.get(key)!;
      entry.contributingBots.add(botId);
      entry.lastUpdated = Date.now();
      entry.version++;

      // Update consensus score based on number of bots agreeing
      entry.consensusScore = entry.contributingBots.size / this.connectedBots.size;

      // Merge confidence (take weighted average)
      const oldWeight = entry.contributingBots.size - 1;
      const newWeight = 1;
      entry.knowledge.confidence =
        (entry.knowledge.confidence * oldWeight + knowledge.confidence * newWeight) /
        (oldWeight + newWeight);

      // Update use count
      entry.knowledge.useCount = Math.max(entry.knowledge.useCount, knowledge.useCount);
      entry.knowledge.lastUsedAt = Math.max(entry.knowledge.lastUsedAt, knowledge.lastUsedAt);
    } else {
      // Add new knowledge
      const entry: SharedKnowledgeEntry = {
        knowledge: { ...knowledge },
        contributingBots: new Set([botId]),
        consensusScore: 1 / this.connectedBots.size,
        lastUpdated: Date.now(),
        version: 1,
      };
      this.sharedMemory.set(key, entry);

      // Add to knowledge graph
      this.addToKnowledgeGraph(knowledge);
    }

    this.stats.knowledgeShared++;

    // Broadcast knowledge share event
    this.broadcast({
      id: this.generateId(),
      senderId: botId,
      recipientId: null,
      type: 'knowledge_share',
      payload: {
        topic: knowledge.topic,
        knowledgeId: knowledge.id,
        confidence: knowledge.confidence,
      },
      priority: 6,
      timestamp: Date.now(),
      requiresAck: false,
    });
  }

  /**
   * Query the shared knowledge base
   * @param query - Search query (topic or content keyword)
   * @param minConfidence - Minimum confidence threshold (0-1)
   * @param minConsensus - Minimum consensus threshold (0-1)
   * @returns Array of matching knowledge entries
   */
  public queryKnowledge(
    query: string,
    minConfidence: number = 0.5,
    minConsensus: number = 0.3
  ): Knowledge[] {
    const results: Knowledge[] = [];
    const queryLower = query.toLowerCase();

    for (const [key, entry] of this.sharedMemory.entries()) {
      // Filter by confidence and consensus
      if (entry.knowledge.confidence < minConfidence || entry.consensusScore < minConsensus) {
        continue;
      }

      // Search in topic and content
      if (
        entry.knowledge.topic.toLowerCase().includes(queryLower) ||
        entry.knowledge.content.toLowerCase().includes(queryLower)
      ) {
        results.push(entry.knowledge);
      }
    }

    // Sort by confidence * consensus (relevance score)
    results.sort((a, b) => {
      const scoreA = a.confidence * (this.sharedMemory.get(`${a.topic}:${a.id}`)?.consensusScore || 0);
      const scoreB = b.confidence * (this.sharedMemory.get(`${b.topic}:${b.id}`)?.consensusScore || 0);
      return scoreB - scoreA;
    });

    return results;
  }

  /**
   * Synchronize a bot's local memory with the hive mind
   * @param botId - ID of the bot to sync
   * @param localMemory - Bot's local memory to sync from
   * @returns Updated memory with shared knowledge incorporated
   */
  public syncMemory(botId: string, localMemory: Memory): Memory {
    if (!this.connectedBots.has(botId)) {
      throw new Error(`Bot ${botId} is not connected to the hive mind`);
    }

    // Share bot's local knowledge with the collective
    for (const knowledge of localMemory.knowledge) {
      this.shareKnowledge(botId, knowledge);
    }

    // Pull all shared knowledge into bot's memory
    const updatedKnowledge = new Map<string, Knowledge>();

    // Start with bot's existing knowledge
    for (const k of localMemory.knowledge) {
      updatedKnowledge.set(k.id, k);
    }

    // Add/update with shared knowledge
    for (const [key, entry] of this.sharedMemory.entries()) {
      const k = entry.knowledge;
      const existing = updatedKnowledge.get(k.id);

      if (!existing || entry.lastUpdated > existing.lastUsedAt) {
        // Mark as shared and update
        updatedKnowledge.set(k.id, {
          ...k,
          source: 'shared',
        });
      }
    }

    return {
      ...localMemory,
      knowledge: Array.from(updatedKnowledge.values()),
      lastConsolidation: Date.now(),
    };
  }

  /**
   * Handle bot replication (Shadow Clone Jutsu)
   * The clone inherits ALL memories from the parent instantly
   * @param parentId - ID of the parent bot
   * @param childId - ID of the newly created clone
   * @param generation - Generation of the clone
   */
  public onBotReplicate(parentId: string, childId: string, generation: number): void {
    if (!this.connectedBots.has(parentId)) {
      throw new Error(`Parent bot ${parentId} is not connected to the hive mind`);
    }

    // Connect the child to the hive mind
    this.connect(childId, generation, parentId);

    // ALL shared knowledge is instantly available to the clone
    // No explicit copy needed - the clone has access to the same shared memory

    // Copy parent's contribution records to child
    for (const [key, entry] of this.sharedMemory.entries()) {
      if (entry.contributingBots.has(parentId)) {
        entry.contributingBots.add(childId);
        entry.lastUpdated = Date.now();
      }
    }

    this.stats.replicationsHandled++;

    // Broadcast replication event
    this.broadcast({
      id: this.generateId(),
      senderId: parentId,
      recipientId: null,
      type: 'clone_notification',
      payload: {
        parentId,
        childId,
        generation,
        sharedKnowledgeCount: this.sharedMemory.size,
        timestamp: Date.now(),
      },
      priority: 7,
      timestamp: Date.now(),
      requiresAck: false,
    });
  }

  /**
   * Handle bot merge (Fusion Jutsu)
   * Consolidate memories from both bots, survivor gains all knowledge
   * @param survivorId - ID of the bot that survives the merge
   * @param absorbedId - ID of the bot being absorbed
   */
  public onBotMerge(survivorId: string, absorbedId: string): void {
    if (!this.connectedBots.has(survivorId)) {
      throw new Error(`Survivor bot ${survivorId} is not connected to the hive mind`);
    }

    if (!this.connectedBots.has(absorbedId)) {
      throw new Error(`Absorbed bot ${absorbedId} is not connected to the hive mind`);
    }

    // Transfer all contributions from absorbed bot to survivor
    for (const [key, entry] of this.sharedMemory.entries()) {
      if (entry.contributingBots.has(absorbedId)) {
        entry.contributingBots.delete(absorbedId);
        entry.contributingBots.add(survivorId);
        entry.lastUpdated = Date.now();
        entry.version++;
      }
    }

    // Transfer children from absorbed bot to survivor
    const absorbedChildren = this.cloneHierarchy.get(absorbedId);
    if (absorbedChildren) {
      const survivorChildren = this.cloneHierarchy.get(survivorId) || new Set();
      absorbedChildren.forEach(childId => {
        survivorChildren.add(childId);
        this.parentLookup.set(childId, survivorId);
      });
      this.cloneHierarchy.set(survivorId, survivorChildren);
      this.cloneHierarchy.delete(absorbedId);
    }

    this.stats.mergesHandled++;

    // Broadcast merge event BEFORE disconnecting
    this.broadcast({
      id: this.generateId(),
      senderId: survivorId,
      recipientId: null,
      type: 'status_update',
      payload: {
        event: 'bot_merged',
        survivorId,
        absorbedId,
        timestamp: Date.now(),
      },
      priority: 8,
      timestamp: Date.now(),
      requiresAck: false,
    });

    // Disconnect the absorbed bot (preserve knowledge)
    this.disconnect(absorbedId, true);
  }

  /**
   * Get the current collective intelligence metrics
   * @returns Aggregate statistics about the hive mind
   */
  public getCollectiveIntelligence(): CollectiveIntelligence {
    let totalConfidence = 0;
    let totalConsensus = 0;
    const topics = new Set<string>();
    let maxGeneration = 0;

    for (const [key, entry] of this.sharedMemory.entries()) {
      totalConfidence += entry.knowledge.confidence;
      totalConsensus += entry.consensusScore;
      topics.add(entry.knowledge.topic);
    }

    for (const generation of this.botGenerations.values()) {
      maxGeneration = Math.max(maxGeneration, generation);
    }

    const knowledgeCount = this.sharedMemory.size;

    // Calculate network strength (connectivity in knowledge graph)
    let totalConnections = 0;
    for (const node of this.knowledgeGraph.values()) {
      totalConnections += node.connections.length;
    }
    const networkStrength = this.knowledgeGraph.size > 0
      ? totalConnections / this.knowledgeGraph.size / 10 // Normalize to 0-1
      : 0;

    return {
      totalKnowledge: knowledgeCount,
      totalExperiences: this.stats.messagesProcessed, // Using messages as proxy
      connectedBots: this.connectedBots.size,
      averageConfidence: knowledgeCount > 0 ? totalConfidence / knowledgeCount : 0,
      knowledgeDiversity: topics.size / Math.max(knowledgeCount, 1),
      consensusLevel: knowledgeCount > 0 ? totalConsensus / knowledgeCount : 0,
      networkStrength: Math.min(networkStrength, 1),
      generationalDepth: maxGeneration,
    };
  }

  /**
   * Get all messages for a specific bot from the queue
   * @param botId - ID of the bot
   * @param consume - Whether to remove messages from queue after reading
   * @returns Array of messages for the bot
   */
  public getMessagesForBot(botId: string, consume: boolean = true): HiveMindMessage[] {
    const messages = this.messageQueue.filter(msg =>
      msg.recipientId === null || // Broadcast
      msg.recipientId === botId || // Direct message
      (Array.isArray(msg.recipientId) && msg.recipientId.includes(botId)) // Group message
    );

    if (consume) {
      this.messageQueue = this.messageQueue.filter(msg => !messages.includes(msg));
    }

    return messages;
  }

  /**
   * Get all bots in the same clone family
   * @param botId - ID of any bot in the family
   * @returns Set of bot IDs in the same family tree
   */
  public getCloneFamily(botId: string): Set<string> {
    const family = new Set<string>();

    // Find the root ancestor
    let currentId = botId;
    while (this.parentLookup.has(currentId)) {
      currentId = this.parentLookup.get(currentId)!;
    }

    // Root found, now traverse down to get all descendants
    const traverse = (id: string) => {
      family.add(id);
      const children = this.cloneHierarchy.get(id);
      if (children) {
        children.forEach(childId => traverse(childId));
      }
    };

    traverse(currentId);
    return family;
  }

  /**
   * Get statistics about the hive mind
   */
  public getStats() {
    return {
      ...this.stats,
      connectedBots: this.connectedBots.size,
      sharedKnowledgeCount: this.sharedMemory.size,
      queuedMessages: this.messageQueue.length,
      knowledgeGraphNodes: this.knowledgeGraph.size,
    };
  }

  /**
   * Add knowledge to the knowledge graph
   */
  private addToKnowledgeGraph(knowledge: Knowledge): void {
    const node: KnowledgeGraphNode = {
      id: knowledge.id,
      topic: knowledge.topic,
      connections: knowledge.relatedKnowledge || [],
      strength: knowledge.confidence,
    };

    this.knowledgeGraph.set(knowledge.id, node);

    // Update bidirectional connections
    if (knowledge.relatedKnowledge) {
      for (const relatedId of knowledge.relatedKnowledge) {
        const relatedNode = this.knowledgeGraph.get(relatedId);
        if (relatedNode && !relatedNode.connections.includes(knowledge.id)) {
          relatedNode.connections.push(knowledge.id);
        }
      }
    }
  }

  /**
   * Generate a unique ID for messages
   */
  private generateId(): string {
    return `hm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all data (useful for testing or reset)
   */
  public clear(): void {
    this.sharedMemory.clear();
    this.connectedBots.clear();
    this.messageQueue = [];
    this.knowledgeGraph.clear();
    this.cloneHierarchy.clear();
    this.parentLookup.clear();
    this.botGenerations.clear();
    this.messageHandlers.clear();
    this.stats = {
      messagesProcessed: 0,
      knowledgeShared: 0,
      replicationsHandled: 0,
      mergesHandled: 0,
    };
  }
}
