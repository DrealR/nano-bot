// NanoBot 3D World Components
export { NanoBot3D, type NanoBot3DProps, type BotState } from './NanoBot3D';
export { NanoBotSwarm, type NanoBotSwarmProps, type BotData } from './NanoBotSwarm';
export { ReplicationEffect, type ReplicationEffectProps } from './ReplicationEffect';
export { ParticleSystem, type ParticleSystemProps, type Particle, type ParticleType } from './ParticleSystem';

// Gameplay Components
export { ResourceNode, type ResourceNodeProps, type ResourceType } from './ResourceNode';
export { EnemyBot, type EnemyBotProps } from './EnemyBot';

// Combat Effects
export { DamageNumber, type DamageNumberProps } from './DamageNumber';
export { Projectile, type ProjectileProps } from './Projectile';
export { Explosion, type ExplosionProps } from './Explosion';

// NMS-Style Alien World Components
export { AlienFlora, type AlienFloraProps } from './AlienFlora';

// Voxel World Components
export { VoxelWorld, type VoxelWorldProps } from './VoxelWorld';
export { Chunk, type ChunkProps } from './Chunk';
export { Environment, type EnvironmentProps } from './Environment';
export {
  WorldGenerator,
  BlockType,
  BLOCK_MATERIALS,
  THEMES,
  type VoxelData,
  type ChunkData,
  type BlockMaterial,
  type WorldTheme,
} from './WorldGenerator';
