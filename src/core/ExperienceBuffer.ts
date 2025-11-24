/**
 * ExperienceBuffer - Replay memory for learning from past experiences
 *
 * Stores experiences for reinforcement learning and allows sampling
 * for training purposes. Supports both random and prioritized sampling.
 */

import { Experience } from './types';

/**
 * Configuration for the experience buffer
 */
export interface ExperienceBufferConfig {
  /** Maximum number of experiences to store */
  maxSize: number;
  /** Whether to use prioritized experience replay */
  prioritized: boolean;
  /** Alpha parameter for prioritized sampling (0-1) */
  priorityAlpha: number;
  /** Beta parameter for importance sampling correction (0-1) */
  priorityBeta: number;
  /** Small constant to prevent zero priorities */
  priorityEpsilon: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ExperienceBufferConfig = {
  maxSize: 10000,
  prioritized: true,
  priorityAlpha: 0.6,
  priorityBeta: 0.4,
  priorityEpsilon: 0.01,
};

/**
 * Experience entry with priority information
 */
interface PrioritizedExperience {
  experience: Experience;
  priority: number;
  addedAt: number;
}

/**
 * Replay buffer for storing and sampling experiences
 */
export class ExperienceBuffer {
  // Configuration
  private config: ExperienceBufferConfig;

  // Storage for experiences
  private buffer: PrioritizedExperience[];

  // Current index for circular buffer
  private currentIndex: number;

  // Statistics
  private stats: {
    totalAdded: number;
    totalSampled: number;
    positiveExperiences: number;
    negativeExperiences: number;
    neutralExperiences: number;
  };

  constructor(config: Partial<ExperienceBufferConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.buffer = [];
    this.currentIndex = 0;
    this.stats = {
      totalAdded: 0,
      totalSampled: 0,
      positiveExperiences: 0,
      negativeExperiences: 0,
      neutralExperiences: 0,
    };
  }

  /**
   * Add an experience to the buffer
   * @param experience - Experience to store
   */
  public add(experience: Experience): void {
    // Calculate initial priority based on importance
    const priority = this.calculatePriority(experience);

    const entry: PrioritizedExperience = {
      experience,
      priority,
      addedAt: Date.now(),
    };

    if (this.buffer.length < this.config.maxSize) {
      // Buffer not full, just push
      this.buffer.push(entry);
    } else {
      // Buffer full, replace oldest (circular buffer)
      this.buffer[this.currentIndex] = entry;
      this.currentIndex = (this.currentIndex + 1) % this.config.maxSize;
    }

    // Update statistics
    this.stats.totalAdded++;
    switch (experience.outcome) {
      case 'positive':
        this.stats.positiveExperiences++;
        break;
      case 'negative':
        this.stats.negativeExperiences++;
        break;
      case 'neutral':
        this.stats.neutralExperiences++;
        break;
    }
  }

  /**
   * Sample random experiences from the buffer
   * @param count - Number of experiences to sample
   * @returns Array of sampled experiences
   */
  public sample(count: number): Experience[] {
    if (this.buffer.length === 0) {
      return [];
    }

    const actualCount = Math.min(count, this.buffer.length);
    const sampled: Experience[] = [];
    const indices = new Set<number>();

    // Random sampling without replacement
    while (indices.size < actualCount) {
      const index = Math.floor(Math.random() * this.buffer.length);
      indices.add(index);
    }

    for (const index of indices) {
      sampled.push(this.buffer[index].experience);
    }

    this.stats.totalSampled += sampled.length;
    return sampled;
  }

  /**
   * Sample experiences using prioritized experience replay
   * @param count - Number of experiences to sample
   * @returns Array of sampled experiences with importance weights
   */
  public prioritizedSample(count: number): Array<{
    experience: Experience;
    weight: number;
    index: number;
  }> {
    if (this.buffer.length === 0) {
      return [];
    }

    const actualCount = Math.min(count, this.buffer.length);
    const sampled: Array<{ experience: Experience; weight: number; index: number }> = [];

    if (!this.config.prioritized) {
      // Fall back to uniform sampling
      const uniformSamples = this.sample(actualCount);
      return uniformSamples.map((exp, i) => ({
        experience: exp,
        weight: 1.0,
        index: i,
      }));
    }

    // Calculate sampling probabilities based on priorities
    const priorities = this.buffer.map(entry =>
      Math.pow(entry.priority, this.config.priorityAlpha)
    );
    const totalPriority = priorities.reduce((sum, p) => sum + p, 0);
    const probabilities = priorities.map(p => p / totalPriority);

    // Calculate importance sampling weights
    const minProbability = Math.min(...probabilities);
    const maxWeight = Math.pow(this.buffer.length * minProbability, -this.config.priorityBeta);

    // Sample using the probability distribution
    const indices = this.sampleWithProbabilities(probabilities, actualCount);

    for (const index of indices) {
      const probability = probabilities[index];
      const weight = Math.pow(this.buffer.length * probability, -this.config.priorityBeta) / maxWeight;

      sampled.push({
        experience: this.buffer[index].experience,
        weight,
        index,
      });
    }

    this.stats.totalSampled += sampled.length;
    return sampled;
  }

  /**
   * Update priorities for sampled experiences (used after learning)
   * @param indices - Indices of experiences to update
   * @param priorities - New priority values (e.g., TD errors)
   */
  public updatePriorities(indices: number[], priorities: number[]): void {
    if (indices.length !== priorities.length) {
      throw new Error('Indices and priorities arrays must have the same length');
    }

    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];
      if (index >= 0 && index < this.buffer.length) {
        this.buffer[index].priority = Math.abs(priorities[i]) + this.config.priorityEpsilon;
      }
    }
  }

  /**
   * Get the most recent experiences
   * @param count - Number of recent experiences to retrieve
   * @returns Array of recent experiences
   */
  public getRecentExperiences(count: number): Experience[] {
    if (this.buffer.length === 0) {
      return [];
    }

    const actualCount = Math.min(count, this.buffer.length);
    const experiences: Experience[] = [];

    // Sort by timestamp and get most recent
    const sorted = [...this.buffer].sort((a, b) => b.addedAt - a.addedAt);

    for (let i = 0; i < actualCount; i++) {
      experiences.push(sorted[i].experience);
    }

    return experiences;
  }

  /**
   * Get experiences by type
   * @param type - Type of experience to filter
   * @param limit - Maximum number of experiences to return
   * @returns Array of experiences matching the type
   */
  public getByType(type: Experience['type'], limit?: number): Experience[] {
    const filtered = this.buffer
      .filter(entry => entry.experience.type === type)
      .map(entry => entry.experience);

    if (limit && limit < filtered.length) {
      return filtered.slice(0, limit);
    }

    return filtered;
  }

  /**
   * Get experiences by outcome
   * @param outcome - Outcome to filter
   * @param limit - Maximum number of experiences to return
   * @returns Array of experiences matching the outcome
   */
  public getByOutcome(outcome: Experience['outcome'], limit?: number): Experience[] {
    const filtered = this.buffer
      .filter(entry => entry.experience.outcome === outcome)
      .map(entry => entry.experience);

    if (limit && limit < filtered.length) {
      return filtered.slice(0, limit);
    }

    return filtered;
  }

  /**
   * Get experiences with importance above a threshold
   * @param minImportance - Minimum importance score (0-1)
   * @param limit - Maximum number of experiences to return
   * @returns Array of important experiences
   */
  public getImportantExperiences(minImportance: number, limit?: number): Experience[] {
    const filtered = this.buffer
      .filter(entry => entry.experience.importance >= minImportance)
      .sort((a, b) => b.experience.importance - a.experience.importance)
      .map(entry => entry.experience);

    if (limit && limit < filtered.length) {
      return filtered.slice(0, limit);
    }

    return filtered;
  }

  /**
   * Search experiences by tags
   * @param tags - Tags to search for
   * @param matchAll - Whether to match all tags or any tag
   * @param limit - Maximum number of experiences to return
   * @returns Array of matching experiences
   */
  public searchByTags(tags: string[], matchAll: boolean = false, limit?: number): Experience[] {
    const filtered = this.buffer
      .filter(entry => {
        const expTags = entry.experience.tags || [];
        if (matchAll) {
          return tags.every(tag => expTags.includes(tag));
        } else {
          return tags.some(tag => expTags.includes(tag));
        }
      })
      .map(entry => entry.experience);

    if (limit && limit < filtered.length) {
      return filtered.slice(0, limit);
    }

    return filtered;
  }

  /**
   * Search experiences by related bot IDs
   * @param botIds - Bot IDs to search for
   * @param limit - Maximum number of experiences to return
   * @returns Array of matching experiences
   */
  public searchByBots(botIds: string[], limit?: number): Experience[] {
    const filtered = this.buffer
      .filter(entry => {
        const relatedBots = entry.experience.relatedBots || [];
        return botIds.some(id => relatedBots.includes(id));
      })
      .map(entry => entry.experience);

    if (limit && limit < filtered.length) {
      return filtered.slice(0, limit);
    }

    return filtered;
  }

  /**
   * Clear all experiences from the buffer
   */
  public clear(): void {
    this.buffer = [];
    this.currentIndex = 0;
    this.stats = {
      totalAdded: 0,
      totalSampled: 0,
      positiveExperiences: 0,
      negativeExperiences: 0,
      neutralExperiences: 0,
    };
  }

  /**
   * Get the current size of the buffer
   */
  public size(): number {
    return this.buffer.length;
  }

  /**
   * Check if the buffer is empty
   */
  public isEmpty(): boolean {
    return this.buffer.length === 0;
  }

  /**
   * Check if the buffer is full
   */
  public isFull(): boolean {
    return this.buffer.length >= this.config.maxSize;
  }

  /**
   * Get buffer statistics
   */
  public getStats() {
    return {
      ...this.stats,
      currentSize: this.buffer.length,
      maxSize: this.config.maxSize,
      utilizationRate: this.buffer.length / this.config.maxSize,
      averagePriority: this.calculateAveragePriority(),
    };
  }

  /**
   * Get buffer configuration
   */
  public getConfig(): ExperienceBufferConfig {
    return { ...this.config };
  }

  /**
   * Update buffer configuration
   * @param config - Partial configuration to update
   */
  public updateConfig(config: Partial<ExperienceBufferConfig>): void {
    this.config = { ...this.config, ...config };

    // If max size decreased, trim buffer
    if (config.maxSize && config.maxSize < this.buffer.length) {
      // Keep most recent experiences
      const sorted = [...this.buffer].sort((a, b) => b.addedAt - a.addedAt);
      this.buffer = sorted.slice(0, config.maxSize);
      this.currentIndex = 0;
    }
  }

  /**
   * Export experiences as JSON
   * @param limit - Optional limit on number of experiences to export
   * @returns JSON string of experiences
   */
  public export(limit?: number): string {
    const experiences = limit
      ? this.buffer.slice(0, limit).map(e => e.experience)
      : this.buffer.map(e => e.experience);

    return JSON.stringify({
      experiences,
      stats: this.stats,
      config: this.config,
      exportedAt: Date.now(),
    }, null, 2);
  }

  /**
   * Import experiences from JSON
   * @param json - JSON string to import
   * @param append - Whether to append to existing buffer or replace
   */
  public import(json: string, append: boolean = false): void {
    try {
      const data = JSON.parse(json);

      if (!data.experiences || !Array.isArray(data.experiences)) {
        throw new Error('Invalid import format: missing experiences array');
      }

      if (!append) {
        this.clear();
      }

      for (const experience of data.experiences) {
        this.add(experience);
      }
    } catch (error) {
      throw new Error(`Failed to import experiences: ${error}`);
    }
  }

  // Private helper methods

  /**
   * Calculate initial priority for an experience
   */
  private calculatePriority(experience: Experience): number {
    // Base priority on importance and outcome
    let priority = experience.importance;

    // Boost priority for certain outcomes
    switch (experience.outcome) {
      case 'positive':
        priority *= 1.2;
        break;
      case 'negative':
        priority *= 1.5; // Learn more from failures
        break;
    }

    // Boost priority for certain types
    if (experience.type === 'error') {
      priority *= 1.5;
    }

    return priority + this.config.priorityEpsilon;
  }

  /**
   * Sample indices with given probabilities
   */
  private sampleWithProbabilities(probabilities: number[], count: number): number[] {
    const indices: number[] = [];
    const cumulativeProbabilities: number[] = [];

    // Build cumulative probability distribution
    let sum = 0;
    for (const p of probabilities) {
      sum += p;
      cumulativeProbabilities.push(sum);
    }

    // Sample using binary search
    for (let i = 0; i < count; i++) {
      const random = Math.random();
      let index = this.binarySearch(cumulativeProbabilities, random);
      indices.push(index);
    }

    return indices;
  }

  /**
   * Binary search in cumulative probabilities
   */
  private binarySearch(cumulative: number[], value: number): number {
    let left = 0;
    let right = cumulative.length - 1;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (cumulative[mid] < value) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    return left;
  }

  /**
   * Calculate average priority in buffer
   */
  private calculateAveragePriority(): number {
    if (this.buffer.length === 0) {
      return 0;
    }

    const sum = this.buffer.reduce((acc, entry) => acc + entry.priority, 0);
    return sum / this.buffer.length;
  }
}
