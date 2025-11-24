/**
 * EnvironmentAnalyzer - Direct analysis of world data
 *
 * Analyzes the environment data (not visual) to help bots understand
 * their surroundings, locate resources, identify threats, and suggest
 * exploration strategies.
 */

import { Vector3 } from '../core/types';
import { BlockType, ChunkData, VoxelData } from '../world/WorldGenerator';

export interface WorldData {
  chunks: ChunkData[];
  botPositions: Map<string, Vector3>;
  timeOfDay?: number;
  weatherConditions?: string;
}

export interface ResourceLocation {
  type: BlockType;
  position: Vector3;
  distance: number;
  value: number;
  accessibility: number; // 0-1, how easy to reach
}

export interface ThreatLocation {
  type: string;
  position: Vector3;
  distance: number;
  severity: number; // 0-1
  description: string;
}

export interface ExplorationSuggestion {
  position: Vector3;
  priority: number; // 0-10
  reasoning: string;
  estimatedReward: number;
  estimatedRisk: number;
}

export interface WorldInsights {
  totalBlocks: number;
  blockDistribution: Map<BlockType, number>;
  averageHeight: number;
  densityMap: Map<string, number>; // Position key -> density
  explorationProgress: number; // 0-1
  knownArea: number; // in cubic units
}

export interface WorldMap {
  visited: Set<string>; // Serialized positions
  resources: Map<string, ResourceLocation>;
  threats: Map<string, ThreatLocation>;
  safeZones: Set<string>;
  dangerZones: Set<string>;
  lastUpdate: number;
}

/**
 * EnvironmentAnalyzer for analyzing world data
 */
export class EnvironmentAnalyzer {
  private worldMap: WorldMap;
  private botPosition: Vector3;
  private sightRange: number;
  private resourceValueMap: Map<BlockType, number>;

  constructor(initialPosition: Vector3, sightRange: number = 32) {
    this.botPosition = initialPosition;
    this.sightRange = sightRange;

    this.worldMap = {
      visited: new Set(),
      resources: new Map(),
      threats: new Map(),
      safeZones: new Set(),
      dangerZones: new Set(),
      lastUpdate: Date.now(),
    };

    // Define resource values
    this.resourceValueMap = new Map([
      [BlockType.ENERGY_CRYSTAL, 10],
      [BlockType.DATA_NODE, 8],
      [BlockType.PLATFORM, 2],
      [BlockType.GRID_FLOOR, 1],
      [BlockType.VOID_BLOCK, 3],
      [BlockType.FOUNDATION, 1],
      [BlockType.BARRIER, 0],
      [BlockType.AIR, 0],
    ]);
  }

  /**
   * Analyze the world data and return insights
   * @param worldData - Current world data including chunks and bot positions
   * @returns Comprehensive world insights
   */
  public analyzeWorld(worldData: WorldData): WorldInsights {
    const blockDistribution = new Map<BlockType, number>();
    const densityMap = new Map<string, number>();
    let totalBlocks = 0;
    let totalHeight = 0;
    let blockCount = 0;

    // Analyze all chunks
    for (const chunk of worldData.chunks) {
      const chunkSize = chunk.voxels.length;

      for (let x = 0; x < chunkSize; x++) {
        for (let y = 0; y < chunkSize; y++) {
          for (let z = 0; z < chunkSize; z++) {
            const voxel = chunk.voxels[x][y][z];

            if (voxel.type !== BlockType.AIR) {
              // Update distribution
              const count = blockDistribution.get(voxel.type) || 0;
              blockDistribution.set(voxel.type, count + 1);
              totalBlocks++;

              // Track height
              totalHeight += voxel.position[1];
              blockCount++;

              // Calculate local density
              const posKey = this.positionToKey(voxel.position);
              const density = this.calculateLocalDensity(chunk.voxels, x, y, z);
              densityMap.set(posKey, density);

              // Mark as visited
              this.worldMap.visited.add(posKey);
            }
          }
        }
      }
    }

    const averageHeight = blockCount > 0 ? totalHeight / blockCount : 0;
    const explorationProgress = this.calculateExplorationProgress(worldData);
    const knownArea = this.worldMap.visited.size;

    return {
      totalBlocks,
      blockDistribution,
      averageHeight,
      densityMap,
      explorationProgress,
      knownArea,
    };
  }

  /**
   * Find nearby resources within sight range
   * @param worldData - Current world data
   * @param maxResources - Maximum number of resources to return
   * @returns Array of resource locations sorted by value
   */
  public findResources(worldData: WorldData, maxResources: number = 10): ResourceLocation[] {
    const resources: ResourceLocation[] = [];

    for (const chunk of worldData.chunks) {
      const chunkSize = chunk.voxels.length;

      for (let x = 0; x < chunkSize; x++) {
        for (let y = 0; y < chunkSize; y++) {
          for (let z = 0; z < chunkSize; z++) {
            const voxel = chunk.voxels[x][y][z];

            // Check if this is a valuable resource
            const value = this.resourceValueMap.get(voxel.type) || 0;
            if (value > 0) {
              const position: Vector3 = {
                x: voxel.position[0],
                y: voxel.position[1],
                z: voxel.position[2],
              };

              const distance = this.calculateDistance(this.botPosition, position);

              // Only consider resources within sight range
              if (distance <= this.sightRange) {
                const accessibility = this.calculateAccessibility(worldData, position);

                resources.push({
                  type: voxel.type,
                  position,
                  distance,
                  value,
                  accessibility,
                });

                // Update world map
                const posKey = this.positionToKey([position.x, position.y, position.z]);
                this.worldMap.resources.set(posKey, resources[resources.length - 1]);
              }
            }
          }
        }
      }
    }

    // Sort by value-to-distance ratio
    resources.sort((a, b) => {
      const scoreA = (a.value * a.accessibility) / Math.max(a.distance, 1);
      const scoreB = (b.value * b.accessibility) / Math.max(b.distance, 1);
      return scoreB - scoreA;
    });

    return resources.slice(0, maxResources);
  }

  /**
   * Identify threats in the environment
   * @param worldData - Current world data
   * @returns Array of identified threats
   */
  public identifyThreats(worldData: WorldData): ThreatLocation[] {
    const threats: ThreatLocation[] = [];

    for (const chunk of worldData.chunks) {
      const chunkSize = chunk.voxels.length;

      for (let x = 0; x < chunkSize; x++) {
        for (let y = 0; y < chunkSize; y++) {
          for (let z = 0; z < chunkSize; z++) {
            const voxel = chunk.voxels[x][y][z];

            // Identify dangerous blocks
            if (voxel.type === BlockType.BARRIER) {
              const position: Vector3 = {
                x: voxel.position[0],
                y: voxel.position[1],
                z: voxel.position[2],
              };

              const distance = this.calculateDistance(this.botPosition, position);

              if (distance <= this.sightRange) {
                threats.push({
                  type: 'barrier',
                  position,
                  distance,
                  severity: 0.3, // Static obstacle, moderate severity
                  description: 'Solid barrier blocking path',
                });

                // Mark danger zone
                const posKey = this.positionToKey([position.x, position.y, position.z]);
                this.worldMap.dangerZones.add(posKey);
              }
            }

            // Check for void blocks (potential fall hazards)
            if (voxel.type === BlockType.AIR && y < -5) {
              const position: Vector3 = {
                x: voxel.position[0],
                y: voxel.position[1],
                z: voxel.position[2],
              };

              const distance = this.calculateDistance(this.botPosition, position);

              if (distance <= this.sightRange) {
                threats.push({
                  type: 'void',
                  position,
                  distance,
                  severity: 0.7, // High severity for falling
                  description: 'Dangerous void area',
                });
              }
            }
          }
        }
      }
    }

    // Check for hostile bots (if any)
    worldData.botPositions.forEach((position, botId) => {
      const distance = this.calculateDistance(this.botPosition, position);
      if (distance <= this.sightRange && distance < 10) {
        // Close proximity might be a threat
        threats.push({
          type: 'hostile_bot',
          position,
          distance,
          severity: 0.5,
          description: `Nearby bot ${botId.substring(0, 8)}`,
        });
      }
    });

    // Sort by severity and distance
    threats.sort((a, b) => {
      const scoreA = a.severity / Math.max(a.distance, 1);
      const scoreB = b.severity / Math.max(b.distance, 1);
      return scoreB - scoreA;
    });

    return threats;
  }

  /**
   * Suggest areas to explore
   * @param worldData - Current world data
   * @param numSuggestions - Number of suggestions to return
   * @returns Array of exploration suggestions
   */
  public suggestExploration(
    worldData: WorldData,
    numSuggestions: number = 5
  ): ExplorationSuggestion[] {
    const suggestions: ExplorationSuggestion[] = [];
    const searchRadius = this.sightRange * 2;

    // Generate candidate positions in a sphere around the bot
    const candidates: Vector3[] = [];
    const step = 8; // Sample every 8 units

    for (let dx = -searchRadius; dx <= searchRadius; dx += step) {
      for (let dy = -searchRadius / 2; dy <= searchRadius / 2; dy += step) {
        for (let dz = -searchRadius; dz <= searchRadius; dz += step) {
          const position: Vector3 = {
            x: this.botPosition.x + dx,
            y: this.botPosition.y + dy,
            z: this.botPosition.z + dz,
          };

          const distance = this.calculateDistance(this.botPosition, position);
          if (distance <= searchRadius && distance > this.sightRange / 2) {
            candidates.push(position);
          }
        }
      }
    }

    // Evaluate each candidate
    for (const position of candidates) {
      const posKey = this.positionToKey([position.x, position.y, position.z]);

      // Skip if already visited
      if (this.worldMap.visited.has(posKey)) continue;

      // Check if in danger zone
      const inDangerZone = this.worldMap.dangerZones.has(posKey);

      // Estimate reward based on nearby known resources
      const estimatedReward = this.estimateRewardAtPosition(position);

      // Estimate risk
      const estimatedRisk = inDangerZone ? 0.8 : this.estimateRiskAtPosition(worldData, position);

      // Calculate priority
      const distance = this.calculateDistance(this.botPosition, position);
      const priority = Math.max(0, Math.min(10,
        (estimatedReward * 5) - (estimatedRisk * 3) - (distance / searchRadius) * 2
      ));

      if (priority > 3) {
        suggestions.push({
          position,
          priority,
          reasoning: this.generateExplorationReasoning(estimatedReward, estimatedRisk, distance),
          estimatedReward,
          estimatedRisk,
        });
      }
    }

    // Sort by priority
    suggestions.sort((a, b) => b.priority - a.priority);

    return suggestions.slice(0, numSuggestions);
  }

  /**
   * Build an internal representation of the world map
   * @param worldData - Current world data
   * @returns Updated world map
   */
  public buildWorldMap(worldData: WorldData): WorldMap {
    // Update world map with current data
    for (const chunk of worldData.chunks) {
      const chunkSize = chunk.voxels.length;

      for (let x = 0; x < chunkSize; x++) {
        for (let y = 0; y < chunkSize; y++) {
          for (let z = 0; z < chunkSize; z++) {
            const voxel = chunk.voxels[x][y][z];
            const position: Vector3 = {
              x: voxel.position[0],
              y: voxel.position[1],
              z: voxel.position[2],
            };
            const posKey = this.positionToKey(voxel.position);

            // Mark as visited
            this.worldMap.visited.add(posKey);

            // Identify safe zones (platforms, foundations)
            if (voxel.type === BlockType.PLATFORM ||
                voxel.type === BlockType.FOUNDATION ||
                voxel.type === BlockType.GRID_FLOOR) {
              this.worldMap.safeZones.add(posKey);
            }

            // Identify resources
            const value = this.resourceValueMap.get(voxel.type) || 0;
            if (value > 0) {
              const distance = this.calculateDistance(this.botPosition, position);
              const accessibility = this.calculateAccessibility(worldData, position);

              this.worldMap.resources.set(posKey, {
                type: voxel.type,
                position,
                distance,
                value,
                accessibility,
              });
            }
          }
        }
      }
    }

    this.worldMap.lastUpdate = Date.now();
    return this.worldMap;
  }

  /**
   * Get the current world map
   */
  public getWorldMap(): WorldMap {
    return this.worldMap;
  }

  /**
   * Update bot position
   */
  public updatePosition(position: Vector3): void {
    this.botPosition = position;
  }

  /**
   * Set sight range
   */
  public setSightRange(range: number): void {
    this.sightRange = range;
  }

  // Helper methods

  /**
   * Calculate distance between two positions
   */
  private calculateDistance(pos1: Vector3, pos2: Vector3): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Convert position to string key
   */
  private positionToKey(position: [number, number, number] | number[]): string {
    return `${Math.floor(position[0])},${Math.floor(position[1])},${Math.floor(position[2])}`;
  }

  /**
   * Calculate local density around a voxel
   */
  private calculateLocalDensity(voxels: VoxelData[][][], x: number, y: number, z: number): number {
    let solidCount = 0;
    let totalChecked = 0;
    const checkRadius = 2;

    for (let dx = -checkRadius; dx <= checkRadius; dx++) {
      for (let dy = -checkRadius; dy <= checkRadius; dy++) {
        for (let dz = -checkRadius; dz <= checkRadius; dz++) {
          const nx = x + dx;
          const ny = y + dy;
          const nz = z + dz;

          if (nx >= 0 && nx < voxels.length &&
              ny >= 0 && ny < voxels[0].length &&
              nz >= 0 && nz < voxels[0][0].length) {
            if (voxels[nx][ny][nz].type !== BlockType.AIR) {
              solidCount++;
            }
            totalChecked++;
          }
        }
      }
    }

    return totalChecked > 0 ? solidCount / totalChecked : 0;
  }

  /**
   * Calculate accessibility of a position
   */
  private calculateAccessibility(worldData: WorldData, position: Vector3): number {
    // Check if there's a clear path (simplified version)
    const pathBlocked = this.isPathBlocked(this.botPosition, position, worldData);
    if (pathBlocked) return 0.2;

    // Check if position is stable (has ground below)
    const hasGround = this.hasGroundBelow(position, worldData);
    if (!hasGround) return 0.3;

    // Check surrounding area
    const surrounded = this.isSurrounded(position, worldData);
    if (surrounded) return 0.4;

    return 1.0;
  }

  /**
   * Check if path is blocked between two positions
   */
  private isPathBlocked(from: Vector3, to: Vector3, worldData: WorldData): boolean {
    // Simplified ray-casting check
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const checkPos: Vector3 = {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
        z: from.z + (to.z - from.z) * t,
      };

      // Check if this position has a barrier
      const posKey = this.positionToKey([checkPos.x, checkPos.y, checkPos.z]);
      if (this.worldMap.dangerZones.has(posKey)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if position has ground below
   */
  private hasGroundBelow(position: Vector3, worldData: WorldData): boolean {
    const checkPos: Vector3 = { x: position.x, y: position.y - 1, z: position.z };
    const posKey = this.positionToKey([checkPos.x, checkPos.y, checkPos.z]);
    return this.worldMap.safeZones.has(posKey) || this.worldMap.visited.has(posKey);
  }

  /**
   * Check if position is surrounded by blocks
   */
  private isSurrounded(position: Vector3, worldData: WorldData): boolean {
    let surroundedCount = 0;
    const checkPositions = [
      { x: position.x + 1, y: position.y, z: position.z },
      { x: position.x - 1, y: position.y, z: position.z },
      { x: position.x, y: position.y, z: position.z + 1 },
      { x: position.x, y: position.y, z: position.z - 1 },
    ];

    for (const checkPos of checkPositions) {
      const posKey = this.positionToKey([checkPos.x, checkPos.y, checkPos.z]);
      if (this.worldMap.dangerZones.has(posKey) || this.worldMap.visited.has(posKey)) {
        surroundedCount++;
      }
    }

    return surroundedCount >= 3;
  }

  /**
   * Calculate exploration progress
   */
  private calculateExplorationProgress(worldData: WorldData): number {
    let totalPossibleBlocks = 0;

    for (const chunk of worldData.chunks) {
      totalPossibleBlocks += chunk.voxels.length ** 3;
    }

    return totalPossibleBlocks > 0 ? this.worldMap.visited.size / totalPossibleBlocks : 0;
  }

  /**
   * Estimate reward at a position based on nearby resources
   */
  private estimateRewardAtPosition(position: Vector3): number {
    let reward = 0;
    const searchRadius = 16;

    this.worldMap.resources.forEach((resource) => {
      const distance = this.calculateDistance(position, resource.position);
      if (distance <= searchRadius) {
        reward += resource.value / Math.max(distance, 1);
      }
    });

    return Math.min(1, reward / 10);
  }

  /**
   * Estimate risk at a position
   */
  private estimateRiskAtPosition(worldData: WorldData, position: Vector3): number {
    let risk = 0;
    const searchRadius = 16;

    this.worldMap.dangerZones.forEach((dangerKey) => {
      const parts = dangerKey.split(',').map(Number);
      const dangerPos: Vector3 = { x: parts[0], y: parts[1], z: parts[2] };
      const distance = this.calculateDistance(position, dangerPos);

      if (distance <= searchRadius) {
        risk += 1 / Math.max(distance, 1);
      }
    });

    return Math.min(1, risk);
  }

  /**
   * Generate reasoning for exploration suggestion
   */
  private generateExplorationReasoning(reward: number, risk: number, distance: number): string {
    const reasons: string[] = [];

    if (reward > 0.5) reasons.push('High potential for resources');
    else if (reward > 0.2) reasons.push('Moderate resource potential');
    else reasons.push('Unexplored territory');

    if (risk < 0.2) reasons.push('low risk area');
    else if (risk < 0.5) reasons.push('moderate risk');
    else reasons.push('high risk zone');

    if (distance < 20) reasons.push('nearby');
    else if (distance < 40) reasons.push('moderate distance');
    else reasons.push('far exploration');

    return reasons.join(', ');
  }

  /**
   * Export world map as JSON
   */
  public exportWorldMap(): string {
    return JSON.stringify({
      visited: Array.from(this.worldMap.visited),
      resources: Array.from(this.worldMap.resources.entries()),
      threats: Array.from(this.worldMap.threats.entries()),
      safeZones: Array.from(this.worldMap.safeZones),
      dangerZones: Array.from(this.worldMap.dangerZones),
      lastUpdate: this.worldMap.lastUpdate,
    }, null, 2);
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.worldMap.visited.clear();
    this.worldMap.resources.clear();
    this.worldMap.threats.clear();
    this.worldMap.safeZones.clear();
    this.worldMap.dangerZones.clear();
  }
}
