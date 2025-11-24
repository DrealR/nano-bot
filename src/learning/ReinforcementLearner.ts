/**
 * ReinforcementLearner - Simple Q-learning system for bots
 *
 * Implements a basic reinforcement learning system that allows bots
 * to learn from actions and their outcomes. Uses experience replay
 * and Q-learning to improve decision making over time.
 */

import { ExperienceBuffer } from '../core/ExperienceBuffer';
import { Experience } from '../core/types';

export interface State {
  energy: number;
  health: number;
  position: { x: number; y: number; z: number };
  nearbyResources: number;
  nearbyThreats: number;
  [key: string]: any;
}

export interface Action {
  type: string;
  parameters?: Record<string, any>;
}

export interface Transition {
  state: State;
  action: Action;
  reward: number;
  nextState: State;
  done: boolean;
  timestamp: number;
}

export interface QTable {
  [stateActionKey: string]: number;
}

export interface Policy {
  explorationRate: number;
  learningRate: number;
  discountFactor: number;
  minExplorationRate: number;
  explorationDecay: number;
}

export interface LearningStats {
  totalTransitions: number;
  totalReward: number;
  averageReward: number;
  bestReward: number;
  worstReward: number;
  explorationRate: number;
  qTableSize: number;
  lastUpdate: number;
}

/**
 * ReinforcementLearner for bot action optimization
 */
export class ReinforcementLearner {
  private experienceBuffer: ExperienceBuffer;
  private qTable: QTable;
  private policy: Policy;
  private stats: LearningStats;
  private actionSpace: string[];
  private stateDiscretization: number;

  constructor(
    actionSpace: string[] = ['move', 'gather', 'build', 'scan', 'replicate', 'idle'],
    bufferSize: number = 10000
  ) {
    this.actionSpace = actionSpace;
    this.stateDiscretization = 10; // Number of bins for continuous state values

    this.experienceBuffer = new ExperienceBuffer({
      maxSize: bufferSize,
      prioritized: true,
      priorityAlpha: 0.6,
      priorityBeta: 0.4,
    });

    this.qTable = {};

    this.policy = {
      explorationRate: 1.0, // Start with full exploration
      learningRate: 0.1,
      discountFactor: 0.95,
      minExplorationRate: 0.01,
      explorationDecay: 0.995,
    };

    this.stats = {
      totalTransitions: 0,
      totalReward: 0,
      averageReward: 0,
      bestReward: -Infinity,
      worstReward: Infinity,
      explorationRate: this.policy.explorationRate,
      qTableSize: 0,
      lastUpdate: Date.now(),
    };
  }

  /**
   * Record an action transition
   * @param state - Current state
   * @param action - Action taken
   * @param reward - Reward received
   * @param nextState - Resulting state
   * @param done - Whether episode is done
   */
  public recordAction(
    state: State,
    action: Action,
    reward: number,
    nextState: State,
    done: boolean = false
  ): void {
    const transition: Transition = {
      state,
      action,
      reward,
      nextState,
      done,
      timestamp: Date.now(),
    };

    // Store in experience buffer as Experience type
    const experience: Experience = {
      id: `${Date.now()}_${Math.random()}`,
      timestamp: transition.timestamp,
      type: 'task',
      description: `Action: ${action.type}, Reward: ${reward.toFixed(2)}`,
      context: {
        state,
        action,
        nextState,
        reward,
        done,
      },
      outcome: reward > 0 ? 'positive' : reward < 0 ? 'negative' : 'neutral',
      importance: Math.abs(reward),
    };

    this.experienceBuffer.add(experience);

    // Update Q-value immediately
    this.updateQValue(state, action, reward, nextState, done);

    // Update statistics
    this.updateStats(reward);
  }

  /**
   * Update Q-value for a state-action pair
   */
  private updateQValue(
    state: State,
    action: Action,
    reward: number,
    nextState: State,
    done: boolean
  ): void {
    const stateKey = this.encodeState(state);
    const actionKey = action.type;
    const key = `${stateKey}_${actionKey}`;

    // Get current Q-value
    const currentQ = this.qTable[key] || 0;

    // Get max Q-value for next state
    let maxNextQ = 0;
    if (!done) {
      maxNextQ = this.getMaxQValue(nextState);
    }

    // Q-learning update rule: Q(s,a) = Q(s,a) + α[r + γ*maxQ(s',a') - Q(s,a)]
    const newQ = currentQ + this.policy.learningRate * (
      reward + this.policy.discountFactor * maxNextQ - currentQ
    );

    this.qTable[key] = newQ;
    this.stats.qTableSize = Object.keys(this.qTable).length;
  }

  /**
   * Update policy based on experience replay
   * @param batchSize - Number of experiences to sample
   */
  public updatePolicy(batchSize: number = 32): void {
    if (this.experienceBuffer.size() < batchSize) {
      return; // Not enough experiences yet
    }

    // Sample batch from experience buffer
    const batch = this.experienceBuffer.prioritizedSample(batchSize);

    // Update Q-values for each experience in batch
    batch.forEach((item) => {
      const experience = item.experience;
      const context = experience.context as {
        state: State;
        action: Action;
        nextState: State;
        reward: number;
        done: boolean;
      };

      if (context && context.state && context.action && context.nextState !== undefined) {
        this.updateQValue(
          context.state,
          context.action,
          context.reward,
          context.nextState,
          context.done || false
        );
      }
    });

    // Decay exploration rate
    this.policy.explorationRate = Math.max(
      this.policy.minExplorationRate,
      this.policy.explorationRate * this.policy.explorationDecay
    );

    this.stats.explorationRate = this.policy.explorationRate;
    this.stats.lastUpdate = Date.now();
  }

  /**
   * Get Q-value for a state-action pair
   * @param state - Current state
   * @param action - Action to evaluate
   * @returns Q-value
   */
  public getActionValue(state: State, action: Action): number {
    const stateKey = this.encodeState(state);
    const actionKey = action.type;
    const key = `${stateKey}_${actionKey}`;
    return this.qTable[key] || 0;
  }

  /**
   * Get the best action for a given state
   * @param state - Current state
   * @param explore - Whether to use epsilon-greedy exploration
   * @returns Best action
   */
  public getBestAction(state: State, explore: boolean = true): Action {
    // Epsilon-greedy exploration
    if (explore && Math.random() < this.policy.explorationRate) {
      // Random action
      const randomActionType = this.actionSpace[
        Math.floor(Math.random() * this.actionSpace.length)
      ];
      return { type: randomActionType };
    }

    // Greedy action selection
    let bestAction: Action = { type: this.actionSpace[0] };
    let bestValue = -Infinity;

    for (const actionType of this.actionSpace) {
      const action: Action = { type: actionType };
      const qValue = this.getActionValue(state, action);

      if (qValue > bestValue) {
        bestValue = qValue;
        bestAction = action;
      }
    }

    return bestAction;
  }

  /**
   * Get max Q-value for a state across all actions
   */
  private getMaxQValue(state: State): number {
    let maxQ = 0;

    for (const actionType of this.actionSpace) {
      const action: Action = { type: actionType };
      const qValue = this.getActionValue(state, action);
      maxQ = Math.max(maxQ, qValue);
    }

    return maxQ;
  }

  /**
   * Encode state into a discrete string key
   */
  private encodeState(state: State): string {
    const discretize = (value: number, min: number, max: number): number => {
      const normalized = (value - min) / (max - min);
      const clamped = Math.max(0, Math.min(1, normalized));
      return Math.floor(clamped * this.stateDiscretization);
    };

    // Discretize continuous state values
    const energyBin = discretize(state.energy, 0, 1000);
    const healthBin = discretize(state.health, 0, 100);
    const resourcesBin = discretize(state.nearbyResources || 0, 0, 10);
    const threatsBin = discretize(state.nearbyThreats || 0, 0, 10);

    // Simple spatial discretization (grid-based)
    const posX = Math.floor((state.position?.x || 0) / 10);
    const posY = Math.floor((state.position?.y || 0) / 10);
    const posZ = Math.floor((state.position?.z || 0) / 10);

    return `e${energyBin}_h${healthBin}_r${resourcesBin}_t${threatsBin}_p${posX}_${posY}_${posZ}`;
  }

  /**
   * Update learning statistics
   */
  private updateStats(reward: number): void {
    this.stats.totalTransitions++;
    this.stats.totalReward += reward;
    this.stats.averageReward = this.stats.totalReward / this.stats.totalTransitions;
    this.stats.bestReward = Math.max(this.stats.bestReward, reward);
    this.stats.worstReward = Math.min(this.stats.worstReward, reward);
  }

  /**
   * Get learning statistics
   */
  public getStats(): LearningStats {
    return { ...this.stats };
  }

  /**
   * Get the current policy
   */
  public getPolicy(): Policy {
    return { ...this.policy };
  }

  /**
   * Set policy parameters
   */
  public setPolicy(policy: Partial<Policy>): void {
    this.policy = { ...this.policy, ...policy };
    this.stats.explorationRate = this.policy.explorationRate;
  }

  /**
   * Get the action space
   */
  public getActionSpace(): string[] {
    return [...this.actionSpace];
  }

  /**
   * Add new action to action space
   */
  public addAction(actionType: string): void {
    if (!this.actionSpace.includes(actionType)) {
      this.actionSpace.push(actionType);
    }
  }

  /**
   * Remove action from action space
   */
  public removeAction(actionType: string): void {
    const index = this.actionSpace.indexOf(actionType);
    if (index > -1) {
      this.actionSpace.splice(index, 1);
    }
  }

  /**
   * Get experience buffer
   */
  public getExperienceBuffer(): ExperienceBuffer {
    return this.experienceBuffer;
  }

  /**
   * Get top N state-action pairs by Q-value
   */
  public getTopActions(n: number = 10): Array<{ stateAction: string; qValue: number }> {
    const entries = Object.entries(this.qTable)
      .map(([stateAction, qValue]) => ({ stateAction, qValue }))
      .sort((a, b) => b.qValue - a.qValue);

    return entries.slice(0, n);
  }

  /**
   * Get Q-table size
   */
  public getQTableSize(): number {
    return Object.keys(this.qTable).length;
  }

  /**
   * Calculate the value of a state (max Q-value across actions)
   */
  public getStateValue(state: State): number {
    return this.getMaxQValue(state);
  }

  /**
   * Predict best action sequence for a goal
   * @param initialState - Starting state
   * @param maxSteps - Maximum planning steps
   * @returns Sequence of predicted best actions
   */
  public planActionSequence(initialState: State, maxSteps: number = 5): Action[] {
    const sequence: Action[] = [];
    let currentState = initialState;

    for (let step = 0; step < maxSteps; step++) {
      const action = this.getBestAction(currentState, false); // No exploration
      sequence.push(action);

      // Simulate state transition (simplified)
      currentState = this.simulateStateTransition(currentState, action);
    }

    return sequence;
  }

  /**
   * Simplified state transition simulation
   */
  private simulateStateTransition(state: State, action: Action): State {
    // Simple heuristic-based state prediction
    const newState: State = { ...state };

    switch (action.type) {
      case 'move':
        // Moving consumes energy
        newState.energy = Math.max(0, state.energy - 5);
        break;
      case 'gather':
        // Gathering consumes energy but increases resources
        newState.energy = Math.max(0, state.energy - 10);
        newState.nearbyResources = Math.max(0, (state.nearbyResources || 0) - 1);
        break;
      case 'scan':
        // Scanning consumes less energy
        newState.energy = Math.max(0, state.energy - 2);
        break;
      case 'replicate':
        // Replication consumes significant energy
        newState.energy = Math.max(0, state.energy - 300);
        break;
      case 'idle':
        // Idling regenerates energy slowly
        newState.energy = Math.min(1000, state.energy + 5);
        break;
    }

    return newState;
  }

  /**
   * Export Q-table as JSON
   */
  public exportQTable(): string {
    return JSON.stringify({
      qTable: this.qTable,
      policy: this.policy,
      stats: this.stats,
      actionSpace: this.actionSpace,
      exportedAt: Date.now(),
    }, null, 2);
  }

  /**
   * Import Q-table from JSON
   */
  public importQTable(json: string): void {
    try {
      const data = JSON.parse(json);

      if (data.qTable) {
        this.qTable = data.qTable;
      }

      if (data.policy) {
        this.policy = { ...this.policy, ...data.policy };
      }

      if (data.actionSpace) {
        this.actionSpace = data.actionSpace;
      }

      this.stats.qTableSize = Object.keys(this.qTable).length;
    } catch (error) {
      throw new Error(`Failed to import Q-table: ${error}`);
    }
  }

  /**
   * Reset the learner (clear Q-table and experiences)
   */
  public reset(): void {
    this.qTable = {};
    this.experienceBuffer.clear();
    this.policy.explorationRate = 1.0;

    this.stats = {
      totalTransitions: 0,
      totalReward: 0,
      averageReward: 0,
      bestReward: -Infinity,
      worstReward: Infinity,
      explorationRate: 1.0,
      qTableSize: 0,
      lastUpdate: Date.now(),
    };
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.qTable = {};
    this.experienceBuffer.clear();
  }
}
