/**
 * WorldGenerator - Procedural voxel world generation
 * Creates stunning cyberpunk environments with energy crystals, data nodes, and floating platforms
 */

import { createNoise3D } from 'simplex-noise';
import type { Vector3 } from 'three';

// Block types for the voxel world
export enum BlockType {
  AIR = 0,
  PLATFORM = 1,      // Reflective metallic platforms
  ENERGY_CRYSTAL = 2, // Glowing cyan crystals
  DATA_NODE = 3,      // Pulsing purple data nodes
  BARRIER = 4,        // Solid dark barriers
  VOID_BLOCK = 5,     // Transparent shimmer blocks
  FOUNDATION = 6,     // Base foundation blocks
  GRID_FLOOR = 7,     // Grid floor with glow lines
}

// Block material properties
export interface BlockMaterial {
  color: [number, number, number];
  emissive: number;
  metalness?: number;
  roughness?: number;
}

export const BLOCK_MATERIALS: Record<BlockType, BlockMaterial> = {
  [BlockType.AIR]: { color: [0, 0, 0], emissive: 0 },
  [BlockType.PLATFORM]: {
    color: [0.15, 0.18, 0.25],
    emissive: 0,
    metalness: 0.9,
    roughness: 0.2
  },
  [BlockType.ENERGY_CRYSTAL]: {
    color: [0.0, 1.0, 0.9],
    emissive: 1.0
  },
  [BlockType.DATA_NODE]: {
    color: [0.7, 0.0, 1.0],
    emissive: 1.0
  },
  [BlockType.BARRIER]: {
    color: [0.05, 0.05, 0.08],
    emissive: 0,
    metalness: 0.3,
    roughness: 0.9
  },
  [BlockType.VOID_BLOCK]: {
    color: [0.2, 0.3, 0.5],
    emissive: 0.3
  },
  [BlockType.FOUNDATION]: {
    color: [0.1, 0.12, 0.15],
    emissive: 0,
    metalness: 0.5,
    roughness: 0.7
  },
  [BlockType.GRID_FLOOR]: {
    color: [0.05, 0.08, 0.12],
    emissive: 0.2
  },
};

export interface VoxelData {
  type: BlockType;
  ao: number; // Ambient occlusion [0-1]
  position: [number, number, number];
}

export interface ChunkData {
  voxels: VoxelData[][][]; // 3D array [x][y][z]
  position: [number, number, number];
}

export interface WorldTheme {
  name: string;
  primaryColor: [number, number, number];
  secondaryColor: [number, number, number];
  accentColor: [number, number, number];
  fogColor: [number, number, number];
  fogDensity: number;
  structureDensity: number;
}

export const THEMES: Record<string, WorldTheme> = {
  cyberpunk: {
    name: 'Cyberpunk',
    primaryColor: [0.0, 1.0, 0.9],
    secondaryColor: [0.7, 0.0, 1.0],
    accentColor: [1.0, 0.0, 0.431],
    fogColor: [0.05, 0.05, 0.15],
    fogDensity: 0.5,
    structureDensity: 0.3,
  },
  neon: {
    name: 'Neon Dreams',
    primaryColor: [1.0, 0.0, 0.5],
    secondaryColor: [0.0, 0.5, 1.0],
    accentColor: [0.0, 1.0, 0.5],
    fogColor: [0.1, 0.0, 0.2],
    fogDensity: 0.6,
    structureDensity: 0.4,
  },
  matrix: {
    name: 'Matrix',
    primaryColor: [0.0, 1.0, 0.255],
    secondaryColor: [0.0, 0.7, 0.2],
    accentColor: [0.0, 1.0, 0.0],
    fogColor: [0.0, 0.05, 0.0],
    fogDensity: 0.4,
    structureDensity: 0.25,
  },
  // No Man's Sky inspired themes
  nms_lush: {
    name: 'Lush Paradise',
    primaryColor: [0.3, 0.9, 0.5],   // Vibrant green
    secondaryColor: [1.0, 0.4, 0.7], // Pink flora
    accentColor: [0.2, 0.8, 1.0],    // Cyan highlights
    fogColor: [0.6, 0.75, 0.85],     // Hazy atmosphere
    fogDensity: 0.3,
    structureDensity: 0.5,
  },
  nms_toxic: {
    name: 'Toxic World',
    primaryColor: [0.7, 1.0, 0.0],   // Acid green
    secondaryColor: [0.9, 0.5, 0.0], // Orange warning
    accentColor: [0.4, 0.2, 0.6],    // Purple gas
    fogColor: [0.3, 0.35, 0.15],     // Murky atmosphere
    fogDensity: 0.7,
    structureDensity: 0.4,
  },
  nms_frozen: {
    name: 'Frozen Moon',
    primaryColor: [0.7, 0.9, 1.0],   // Ice blue
    secondaryColor: [0.9, 0.95, 1.0], // Snow white
    accentColor: [0.4, 0.6, 0.9],    // Deep blue
    fogColor: [0.8, 0.85, 0.95],     // Icy fog
    fogDensity: 0.4,
    structureDensity: 0.2,
  },
  nms_scorched: {
    name: 'Scorched Planet',
    primaryColor: [1.0, 0.4, 0.1],   // Molten orange
    secondaryColor: [1.0, 0.8, 0.2], // Golden yellow
    accentColor: [0.8, 0.1, 0.1],    // Crimson red
    fogColor: [0.4, 0.2, 0.1],       // Dusty atmosphere
    fogDensity: 0.5,
    structureDensity: 0.3,
  },
  nms_exotic: {
    name: 'Exotic Anomaly',
    primaryColor: [1.0, 0.2, 0.6],   // Hot pink
    secondaryColor: [0.3, 1.0, 0.9], // Teal
    accentColor: [1.0, 0.9, 0.3],    // Gold
    fogColor: [0.15, 0.1, 0.2],      // Deep purple haze
    fogDensity: 0.4,
    structureDensity: 0.6,
  },
  nms_crimson: {
    name: 'Crimson World',
    primaryColor: [0.9, 0.2, 0.3],   // Blood red
    secondaryColor: [0.6, 0.1, 0.4], // Maroon
    accentColor: [1.0, 0.6, 0.2],    // Amber
    fogColor: [0.25, 0.08, 0.1],     // Red haze
    fogDensity: 0.5,
    structureDensity: 0.35,
  },
};

export class WorldGenerator {
  private noise3D: ReturnType<typeof createNoise3D>;
  private chunkSize: number;
  private seed: number;
  private theme: WorldTheme;

  constructor(seed: number = Date.now(), chunkSize: number = 16, themeName: string = 'cyberpunk') {
    this.seed = seed;
    this.chunkSize = chunkSize;
    this.theme = THEMES[themeName] || THEMES.cyberpunk;

    // Create noise generator with seed
    this.noise3D = createNoise3D(() => this.mulberry32(seed)());
  }

  // Simple seeded random number generator
  private mulberry32(seed: number) {
    return function() {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /**
   * Generate a chunk at the given position
   */
  generateChunk(chunkX: number, chunkY: number, chunkZ: number): ChunkData {
    const voxels: VoxelData[][][] = [];

    // Initialize 3D array
    for (let x = 0; x < this.chunkSize; x++) {
      voxels[x] = [];
      for (let y = 0; y < this.chunkSize; y++) {
        voxels[x][y] = [];
        for (let z = 0; z < this.chunkSize; z++) {
          const worldX = chunkX * this.chunkSize + x;
          const worldY = chunkY * this.chunkSize + y;
          const worldZ = chunkZ * this.chunkSize + z;

          const type = this.generateTerrain(worldX, worldY, worldZ);
          const ao = this.calculateAO(voxels, x, y, z);

          voxels[x][y][z] = {
            type,
            ao,
            position: [worldX, worldY, worldZ],
          };
        }
      }
    }

    // Place structures
    this.placeStructures(voxels, chunkX, chunkY, chunkZ);

    return {
      voxels,
      position: [chunkX, chunkY, chunkZ],
    };
  }

  /**
   * Generate terrain height and density at a world position
   */
  private generateTerrain(x: number, y: number, z: number): BlockType {
    const scale = 0.05;
    const scale2 = 0.1;
    const scale3 = 0.02;

    // Base terrain height using multiple octaves
    const noise1 = this.noise3D(x * scale, y * scale, z * scale);
    const noise2 = this.noise3D(x * scale2, y * scale2, z * scale2) * 0.5;
    const noise3 = this.noise3D(x * scale3, y * scale3, z * scale3) * 2;

    const density = noise1 + noise2 + noise3;

    // Calculate height threshold
    const heightValue = y / this.chunkSize;
    const threshold = -0.3 + heightValue * 0.8;

    // Air
    if (density < threshold) {
      return BlockType.AIR;
    }

    // Foundation layer (bottom)
    if (y < -8) {
      return BlockType.FOUNDATION;
    }

    // Grid floor layer
    if (y === -8 || y === -7) {
      // Create grid pattern
      const gridSize = 4;
      const isGridLineX = x % gridSize === 0;
      const isGridLineZ = z % gridSize === 0;

      if (isGridLineX || isGridLineZ) {
        return BlockType.GRID_FLOOR;
      }
      return BlockType.PLATFORM;
    }

    // Random special blocks based on noise
    const specialNoise = this.noise3D(x * 0.2, y * 0.2, z * 0.2);

    // Energy crystals (high peaks)
    if (density > 1.0 && specialNoise > 0.5) {
      return BlockType.ENERGY_CRYSTAL;
    }

    // Data nodes (medium density + pattern)
    if (density > 0.3 && Math.abs(specialNoise) < 0.2) {
      return BlockType.DATA_NODE;
    }

    // Void blocks (low density areas, floating)
    if (density < threshold + 0.3 && density > threshold && specialNoise < -0.4) {
      return BlockType.VOID_BLOCK;
    }

    // Barriers (high density walls)
    if (density > 1.5) {
      return BlockType.BARRIER;
    }

    // Default platforms
    return BlockType.PLATFORM;
  }

  /**
   * Calculate ambient occlusion for a voxel
   */
  private calculateAO(voxels: VoxelData[][][], x: number, y: number, z: number): number {
    let solidNeighbors = 0;
    const checkRadius = 1;

    for (let dx = -checkRadius; dx <= checkRadius; dx++) {
      for (let dy = -checkRadius; dy <= checkRadius; dy++) {
        for (let dz = -checkRadius; dz <= checkRadius; dz++) {
          if (dx === 0 && dy === 0 && dz === 0) continue;

          const nx = x + dx;
          const ny = y + dy;
          const nz = z + dz;

          if (nx >= 0 && nx < this.chunkSize &&
              ny >= 0 && ny < this.chunkSize &&
              nz >= 0 && nz < this.chunkSize &&
              voxels[nx] && voxels[nx][ny] && voxels[nx][ny][nz]) {
            if (voxels[nx][ny][nz].type !== BlockType.AIR) {
              solidNeighbors++;
            }
          }
        }
      }
    }

    // Return AO value [0.3 - 1.0]
    const maxNeighbors = 26; // 3x3x3 - 1
    return 1.0 - (solidNeighbors / maxNeighbors) * 0.7;
  }

  /**
   * Place special structures in the chunk
   */
  private placeStructures(voxels: VoxelData[][][], chunkX: number, chunkY: number, chunkZ: number): void {
    const rng = this.mulberry32(this.seed + chunkX * 1000 + chunkY * 100 + chunkZ * 10);

    // Chance to place portal
    if (rng() < this.theme.structureDensity * 0.1) {
      const portalX = Math.floor(rng() * (this.chunkSize - 5)) + 2;
      const portalY = Math.floor(rng() * (this.chunkSize - 5)) + 2;
      const portalZ = Math.floor(rng() * (this.chunkSize - 5)) + 2;

      this.createPortal(voxels, portalX, portalY, portalZ);
    }

    // Chance to place energy pillar
    if (rng() < this.theme.structureDensity * 0.3) {
      const pillarX = Math.floor(rng() * (this.chunkSize - 2)) + 1;
      const pillarZ = Math.floor(rng() * (this.chunkSize - 2)) + 1;

      this.createEnergyPillar(voxels, pillarX, pillarZ);
    }

    // Chance to place floating platform
    if (rng() < this.theme.structureDensity * 0.4) {
      const platformX = Math.floor(rng() * (this.chunkSize - 4)) + 2;
      const platformY = Math.floor(rng() * (this.chunkSize - 2)) + 8;
      const platformZ = Math.floor(rng() * (this.chunkSize - 4)) + 2;

      this.createFloatingPlatform(voxels, platformX, platformY, platformZ);
    }
  }

  /**
   * Create a portal structure
   */
  createPortal(voxels: VoxelData[][][], x: number, y: number, z: number): void {
    // Portal frame (5x5 hollow)
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const px = x + dx;
        const py = y + dy;

        if (px >= 0 && px < this.chunkSize && py >= 0 && py < this.chunkSize && z >= 0 && z < this.chunkSize) {
          // Frame
          if (Math.abs(dx) === 2 || Math.abs(dy) === 2) {
            voxels[px][py][z].type = BlockType.ENERGY_CRYSTAL;
            voxels[px][py][z].ao = 1.0;
          }
          // Interior void
          else {
            voxels[px][py][z].type = BlockType.VOID_BLOCK;
            voxels[px][py][z].ao = 1.0;
          }
        }
      }
    }
  }

  /**
   * Create an energy pillar
   */
  private createEnergyPillar(voxels: VoxelData[][][], x: number, z: number): void {
    const height = Math.floor(Math.random() * 6) + 4;

    for (let y = 0; y < this.chunkSize && y < height; y++) {
      if (x >= 0 && x < this.chunkSize && z >= 0 && z < this.chunkSize) {
        // Alternate between energy crystals and data nodes
        voxels[x][y][z].type = y % 2 === 0 ? BlockType.ENERGY_CRYSTAL : BlockType.DATA_NODE;
        voxels[x][y][z].ao = 1.0;
      }
    }
  }

  /**
   * Create a floating platform
   */
  private createFloatingPlatform(voxels: VoxelData[][][], x: number, y: number, z: number): void {
    const width = 3;
    const depth = 3;

    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < depth; dz++) {
        const px = x + dx;
        const pz = z + dz;

        if (px >= 0 && px < this.chunkSize &&
            y >= 0 && y < this.chunkSize &&
            pz >= 0 && pz < this.chunkSize) {
          // Platform edge with data nodes
          if (dx === 0 || dx === width - 1 || dz === 0 || dz === depth - 1) {
            voxels[px][y][pz].type = BlockType.DATA_NODE;
          } else {
            voxels[px][y][pz].type = BlockType.PLATFORM;
          }
          voxels[px][y][pz].ao = 1.0;
        }
      }
    }
  }

  /**
   * Get the current theme
   */
  getTheme(): WorldTheme {
    return this.theme;
  }

  /**
   * Change the world theme
   */
  setTheme(themeName: string): void {
    this.theme = THEMES[themeName] || THEMES.cyberpunk;
  }

  /**
   * Get chunk size
   */
  getChunkSize(): number {
    return this.chunkSize;
  }
}

export default WorldGenerator;
