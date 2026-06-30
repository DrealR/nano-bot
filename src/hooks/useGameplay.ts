/**
 * useGameplay Hook - ENHANCED COMBAT SYSTEM v2
 *
 * Features:
 * - Visible projectile attacks
 * - Damage numbers and explosions
 * - Enemy variety (Grunt, Speeder, Tank)
 * - Screen shake events
 * - Rally point commands
 */

import { useRef, useCallback, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { NanoBotState } from '@core';

// Types
export interface Resource {
  id: string;
  position: [number, number, number];
  type: 'energy' | 'data' | 'material';
  amount: number;
  maxAmount: number;
}

export type EnemyType = 'grunt' | 'speeder' | 'tank';

export interface Enemy {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  state: 'spawn' | 'advance' | 'attack' | 'retreat' | 'dead';
  type: EnemyType;
  targetBotId?: string;
  isBoss: boolean;
  attackCooldown: number;
  lastAttackTime: number;
  color: string;
}

export interface DamageNumber {
  id: string;
  position: [number, number, number];
  damage: number;
  createdAt: number;
  isHeal?: boolean;
  isCrit?: boolean;
}

export interface Projectile {
  id: string;
  from: [number, number, number];
  to: [number, number, number];
  createdAt: number;
  isBotAttack: boolean;
  damage: number;
}

export interface Explosion {
  id: string;
  position: [number, number, number];
  createdAt: number;
  isBoss: boolean;
  color: string;
}

export interface GameState {
  resources: Map<string, Resource>;
  enemies: Map<string, Enemy>;
  damageNumbers: DamageNumber[];
  projectiles: Projectile[];
  explosions: Explosion[];
  score: number;
  wave: number;
  baseHealth: number;
  maxBaseHealth: number;
  gameStatus: 'playing' | 'paused' | 'won' | 'lost';
  playerCommand: 'defend' | 'gather' | 'attack' | null;
  rallyPoint: [number, number, number] | null;
  waveCountdown: number;
  enemiesKilledThisWave: number;
  totalEnemiesThisWave: number;
  comboMultiplier: number;
  lastKillTime: number;
  screenShake: number;
  waveEnemiesRemaining: number;
}

// Enemy type configurations
const ENEMY_TYPES: Record<EnemyType, { healthMult: number; speedMult: number; damageMult: number; color: string }> = {
  grunt: { healthMult: 1, speedMult: 1, damageMult: 1, color: '#ff0044' },
  speeder: { healthMult: 0.5, speedMult: 2.5, damageMult: 0.5, color: '#ff9900' },
  tank: { healthMult: 3, speedMult: 0.4, damageMult: 2.5, color: '#9900ff' },
};

// Game configuration
const CONFIG = {
  // Resources
  maxResources: 6,
  resourceSpawnInterval: 8000,
  resourceGatherDistance: 2.5,
  resourceGatherRate: 30,
  worldSize: 30,

  // Enemies
  baseEnemyCount: 3,
  enemySpawnDelay: 600,
  baseEnemySpeed: 3,
  baseEnemyDamage: 8,
  baseEnemyHealth: 60,
  enemyAttackRange: 2.5,
  enemyBaseAttackRange: 5,
  enemyAttackCooldown: 1.5,

  // Boss
  bossHealthMultiplier: 5,
  bossDamageMultiplier: 2,
  bossSpeedMultiplier: 0.7,

  // Waves
  waveInterval: 45000,
  waveDifficultyScale: 1.2,
  maxWave: 10,

  // Bots
  botAttackRange: 4,
  botAttackDamage: 25,
  botAttackCooldown: 0.5,
  botMoveSpeed: 4,
  botDefendRadius: 8,
  critChance: 0.15,
  critMultiplier: 2.5,

  // Base
  basePosition: [0, 0, 0] as [number, number, number],
  baseRadius: 3,

  // Scoring
  enemyKillScore: 50,
  bossKillScore: 500,
  waveCompleteBonus: 200,
  resourceGatherScore: 5,
  comboTimeout: 3000,
  maxCombo: 5,

  // Effects
  projectileSpeed: 25,
  damageNumberDuration: 1000,
  explosionDuration: 800,
  screenShakeDecay: 5,
};

// Game state singleton
let gameState: GameState = {
  resources: new Map(),
  enemies: new Map(),
  damageNumbers: [],
  projectiles: [],
  explosions: [],
  score: 0,
  wave: 1,
  baseHealth: 1000,
  maxBaseHealth: 1000,
  gameStatus: 'playing',
  playerCommand: null,
  rallyPoint: null,
  waveCountdown: CONFIG.waveInterval,
  enemiesKilledThisWave: 0,
  totalEnemiesThisWave: 0,
  comboMultiplier: 1,
  lastKillTime: 0,
  screenShake: 0,
  waveEnemiesRemaining: 0,
};

// Helper functions
const randomPosition = (minRadius: number = 5, maxRadius: number = CONFIG.worldSize): [number, number, number] => {
  const angle = Math.random() * Math.PI * 2;
  const dist = minRadius + Math.random() * (maxRadius - minRadius);
  return [Math.cos(angle) * dist, 1.5 + Math.random() * 1.5, Math.sin(angle) * dist];
};

const distance3D = (a: [number, number, number], b: [number, number, number]): number => {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Spawn resource
const spawnResource = (): Resource | null => {
  if (gameState.resources.size >= CONFIG.maxResources) return null;

  const types: Array<'energy' | 'data' | 'material'> = ['energy', 'data', 'material'];
  const type = types[Math.floor(Math.random() * types.length)];
  const maxAmount = 80 + Math.random() * 120;

  const resource: Resource = {
    id: `resource-${generateId()}`,
    position: randomPosition(8, CONFIG.worldSize - 5),
    type,
    amount: maxAmount,
    maxAmount,
  };

  gameState.resources.set(resource.id, resource);
  return resource;
};

// Spawn enemy with type
const spawnEnemy = (isBoss: boolean = false, forceType?: EnemyType): Enemy | null => {
  const waveScale = Math.pow(CONFIG.waveDifficultyScale, gameState.wave - 1);

  // Determine enemy type (weighted random)
  let enemyType: EnemyType;
  if (forceType) {
    enemyType = forceType;
  } else if (isBoss) {
    enemyType = 'grunt'; // Bosses are super grunts
  } else {
    const roll = Math.random();
    if (roll < 0.6) enemyType = 'grunt';
    else if (roll < 0.85) enemyType = 'speeder';
    else enemyType = 'tank';
  }

  const typeConfig = ENEMY_TYPES[enemyType];

  const baseHealth = CONFIG.baseEnemyHealth * waveScale * typeConfig.healthMult * (isBoss ? CONFIG.bossHealthMultiplier : 1);
  const damage = CONFIG.baseEnemyDamage * waveScale * typeConfig.damageMult * (isBoss ? CONFIG.bossDamageMultiplier : 1);
  const speed = CONFIG.baseEnemySpeed * typeConfig.speedMult * (isBoss ? CONFIG.bossSpeedMultiplier : 1);

  const spawnPos = randomPosition(CONFIG.worldSize + 5, CONFIG.worldSize + 10);

  const enemy: Enemy = {
    id: `enemy-${generateId()}`,
    position: spawnPos,
    velocity: [0, 0, 0],
    health: baseHealth,
    maxHealth: baseHealth,
    damage,
    speed,
    state: 'spawn',
    type: enemyType,
    isBoss,
    attackCooldown: CONFIG.enemyAttackCooldown,
    lastAttackTime: 0,
    color: isBoss ? '#ff00ff' : typeConfig.color,
  };

  gameState.enemies.set(enemy.id, enemy);
  gameState.totalEnemiesThisWave++;
  gameState.waveEnemiesRemaining++;
  return enemy;
};

// Add visual effects
const addDamageNumber = (position: [number, number, number], damage: number, isHeal = false, isCrit = false) => {
  gameState.damageNumbers.push({
    id: `dmg-${generateId()}`,
    position: [position[0], position[1] + 1, position[2]],
    damage: Math.round(damage),
    createdAt: Date.now(),
    isHeal,
    isCrit,
  });
};

const addProjectile = (from: [number, number, number], to: [number, number, number], isBotAttack: boolean, damage: number) => {
  gameState.projectiles.push({
    id: `proj-${generateId()}`,
    from,
    to,
    createdAt: Date.now(),
    isBotAttack,
    damage,
  });
};

const addExplosion = (position: [number, number, number], isBoss: boolean, color: string) => {
  gameState.explosions.push({
    id: `exp-${generateId()}`,
    position,
    createdAt: Date.now(),
    isBoss,
    color,
  });
};

const triggerScreenShake = (intensity: number) => {
  gameState.screenShake = Math.max(gameState.screenShake, intensity);
};

// Start wave
const startWave = () => {
  const enemyCount = CONFIG.baseEnemyCount + Math.floor(gameState.wave * 1.5);
  const hasBoss = gameState.wave % 3 === 0;

  gameState.enemiesKilledThisWave = 0;
  gameState.totalEnemiesThisWave = 0;
  gameState.waveEnemiesRemaining = 0;

  console.log(`⚔️ WAVE ${gameState.wave} - ${enemyCount} enemies${hasBoss ? ' + BOSS!' : ''}`);

  for (let i = 0; i < enemyCount; i++) {
    setTimeout(() => {
      if (gameState.gameStatus === 'playing') spawnEnemy(false);
    }, i * CONFIG.enemySpawnDelay);
  }

  if (hasBoss) {
    setTimeout(() => {
      if (gameState.gameStatus === 'playing') {
        spawnEnemy(true);
        console.log('👹 BOSS SPAWNED!');
      }
    }, enemyCount * CONFIG.enemySpawnDelay + 1000);
  }
};

// Reset game
export const resetGame = () => {
  gameState = {
    resources: new Map(),
    enemies: new Map(),
    damageNumbers: [],
    projectiles: [],
    explosions: [],
    score: 0,
    wave: 1,
    baseHealth: 1000,
    maxBaseHealth: 1000,
    gameStatus: 'playing',
    playerCommand: null,
    rallyPoint: null,
    waveCountdown: CONFIG.waveInterval,
    enemiesKilledThisWave: 0,
    totalEnemiesThisWave: 0,
    comboMultiplier: 1,
    lastKillTime: 0,
    screenShake: 0,
    waveEnemiesRemaining: 0,
  };

  for (let i = 0; i < 4; i++) spawnResource();
  setTimeout(() => startWave(), 2000);
};

// Set player command
export const setPlayerCommand = (command: 'defend' | 'gather' | 'attack' | null, target?: [number, number, number]) => {
  gameState.playerCommand = command;
};

// Set rally point
export const setRallyPoint = (position: [number, number, number] | null) => {
  gameState.rallyPoint = position;
};

// Get game state
export const getGameState = () => gameState;

// Main gameplay hook
export const useGameplay = () => {
  const bots = useStore((state) => state.bots);
  const updateBot = useStore((state) => state.updateBot);
  const isPaused = useStore((state) => state.isPaused);

  const lastResourceSpawn = useRef(Date.now());
  const initialized = useRef(false);
  const botAttackCooldowns = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      resetGame();
    }
  }, []);

  useFrame((_, delta) => {
    if (isPaused || gameState.gameStatus !== 'playing') return;

    const now = Date.now();

    // Decay screen shake
    gameState.screenShake = Math.max(0, gameState.screenShake - CONFIG.screenShakeDecay * delta);

    // Resource spawning
    if (now - lastResourceSpawn.current > CONFIG.resourceSpawnInterval) {
      spawnResource();
      lastResourceSpawn.current = now;
    }

    // Wave management
    gameState.waveCountdown = Math.max(0, gameState.waveCountdown - delta * 1000);

    const aliveEnemies = Array.from(gameState.enemies.values()).filter(e => e.state !== 'dead');
    gameState.waveEnemiesRemaining = aliveEnemies.length;

    if (aliveEnemies.length === 0 && gameState.totalEnemiesThisWave > 0 &&
        gameState.enemiesKilledThisWave >= gameState.totalEnemiesThisWave) {
      gameState.score += CONFIG.waveCompleteBonus * gameState.wave;
      gameState.wave++;
      gameState.waveCountdown = CONFIG.waveInterval;

      if (gameState.wave > CONFIG.maxWave) {
        gameState.gameStatus = 'won';
        return;
      }

      gameState.baseHealth = Math.min(gameState.maxBaseHealth, gameState.baseHealth + 100);
      setTimeout(() => startWave(), 3000);
    }

    // Combo decay
    if (now - gameState.lastKillTime > CONFIG.comboTimeout) {
      gameState.comboMultiplier = 1;
    }

    // Bot AI
    bots.forEach((botData, botId) => {
      const botPos: [number, number, number] = [botData.position.x, botData.position.y, botData.position.z];

      let nearestEnemy: Enemy | null = null;
      let nearestEnemyDist = Infinity;
      let nearestResource: Resource | null = null;
      let nearestResourceDist = Infinity;

      gameState.enemies.forEach((enemy) => {
        if (enemy.state === 'dead') return;
        const dist = distance3D(botPos, enemy.position);
        if (dist < nearestEnemyDist) {
          nearestEnemyDist = dist;
          nearestEnemy = enemy;
        }
      });

      gameState.resources.forEach((resource) => {
        if (resource.amount <= 0) return;
        const dist = distance3D(botPos, resource.position);
        if (dist < nearestResourceDist) {
          nearestResourceDist = dist;
          nearestResource = resource;
        }
      });

      const distToBase = distance3D(botPos, CONFIG.basePosition);
      let targetPos: [number, number, number] | null = null;
      let newState = botData.state;
      const personality = (botData as any).personality || 'defensive';

      // Priority 1: Rally point
      if (gameState.rallyPoint) {
        const distToRally = distance3D(botPos, gameState.rallyPoint);
        if (distToRally > 2) {
          targetPos = gameState.rallyPoint;
          newState = NanoBotState.WORKING;
        }
      }
      // Priority 2: Attack nearby enemies
      else {
        const enemyNearBase = nearestEnemy && distance3D(nearestEnemy.position, CONFIG.basePosition) < CONFIG.botDefendRadius;

        if (enemyNearBase || (nearestEnemy && nearestEnemyDist < 6)) {
          targetPos = nearestEnemy!.position;
          newState = NanoBotState.WORKING;

          const cooldown = botAttackCooldowns.current.get(botId) || 0;
          if (nearestEnemyDist < CONFIG.botAttackRange && now > cooldown) {
            // Calculate damage with crit
            const isCrit = Math.random() < CONFIG.critChance;
            const damage = CONFIG.botAttackDamage * (isCrit ? CONFIG.critMultiplier : 1);

            nearestEnemy!.health -= damage;
            botAttackCooldowns.current.set(botId, now + CONFIG.botAttackCooldown * 1000);

            // Visual effects
            addProjectile(botPos, nearestEnemy!.position, true, damage);
            addDamageNumber(nearestEnemy!.position, damage, false, isCrit);

            if (nearestEnemy!.health <= 0) {
              nearestEnemy!.state = 'dead';
              gameState.enemiesKilledThisWave++;
              gameState.waveEnemiesRemaining--;

              // Explosion!
              addExplosion(nearestEnemy!.position, nearestEnemy!.isBoss, nearestEnemy!.color);

              // Combo
              if (now - gameState.lastKillTime < CONFIG.comboTimeout) {
                gameState.comboMultiplier = Math.min(CONFIG.maxCombo, gameState.comboMultiplier + 1);
              }
              gameState.lastKillTime = now;

              const killScore = (nearestEnemy!.isBoss ? CONFIG.bossKillScore : CONFIG.enemyKillScore) * gameState.comboMultiplier;
              gameState.score += killScore;

              const newEnergy = Math.min(1000, botData.energy + 50);
              updateBot(botId, { energy: newEnergy });
            }
          }
        }
        // Priority 3: Player commands
        else if (gameState.playerCommand === 'attack' && nearestEnemy) {
          targetPos = nearestEnemy.position;
          newState = NanoBotState.WORKING;
        } else if (gameState.playerCommand === 'gather' && nearestResource) {
          targetPos = nearestResource.position;
          newState = NanoBotState.WORKING;
        } else if (gameState.playerCommand === 'defend') {
          if (distToBase > CONFIG.botDefendRadius) {
            targetPos = [
              CONFIG.basePosition[0] + (Math.random() - 0.5) * 4,
              2,
              CONFIG.basePosition[2] + (Math.random() - 0.5) * 4,
            ];
          }
          newState = NanoBotState.IDLE;
        }
        // Priority 4: Personality behavior
        else {
          switch (personality) {
            case 'aggressive':
              if (nearestEnemy && nearestEnemyDist < 20) {
                targetPos = nearestEnemy.position;
                newState = NanoBotState.WORKING;
              }
              break;
            case 'builder':
              if (nearestResource && nearestResourceDist < 25) {
                targetPos = nearestResource.position;
                newState = NanoBotState.WORKING;
              }
              break;
            default:
              if (distToBase > CONFIG.botDefendRadius) {
                targetPos = [
                  CONFIG.basePosition[0] + (Math.random() - 0.5) * 6,
                  2,
                  CONFIG.basePosition[2] + (Math.random() - 0.5) * 6,
                ];
              } else if (nearestResource && nearestResourceDist < 10) {
                targetPos = nearestResource.position;
                newState = NanoBotState.WORKING;
              }
              break;
          }
        }
      }

      // Gather resources
      if (nearestResource && nearestResourceDist < CONFIG.resourceGatherDistance) {
        const gathered = CONFIG.resourceGatherRate * delta;
        nearestResource.amount -= gathered;
        const newEnergy = Math.min(1000, botData.energy + gathered);
        updateBot(botId, { energy: newEnergy });
        gameState.score += CONFIG.resourceGatherScore * delta;

        if (nearestResource.amount <= 0) {
          gameState.resources.delete(nearestResource.id);
        }
      }

      // Move towards target
      if (targetPos) {
        const direction = [
          targetPos[0] - botPos[0],
          targetPos[1] - botPos[1],
          targetPos[2] - botPos[2],
        ];
        const dist = Math.sqrt(direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2);

        if (dist > 0.5) {
          const speed = CONFIG.botMoveSpeed * delta;
          const newPos = {
            x: botPos[0] + (direction[0] / dist) * speed,
            y: Math.max(1.5, botPos[1] + (direction[1] / dist) * speed * 0.3),
            z: botPos[2] + (direction[2] / dist) * speed,
          };

          updateBot(botId, {
            position: newPos,
            velocity: { x: direction[0] / dist, y: 0, z: direction[2] / dist },
            state: newState,
          });
        }
      }
    });

    // Enemy AI
    gameState.enemies.forEach((enemy) => {
      if (enemy.state === 'dead') return;

      const enemyPos = enemy.position;
      const distToBase = distance3D(enemyPos, CONFIG.basePosition);

      let nearestBot: { id: string; pos: [number, number, number]; dist: number } | null = null;
      bots.forEach((bot, id) => {
        const botPos: [number, number, number] = [bot.position.x, bot.position.y, bot.position.z];
        const dist = distance3D(enemyPos, botPos);
        if (!nearestBot || dist < nearestBot.dist) {
          nearestBot = { id, pos: botPos, dist };
        }
      });

      let targetPos: [number, number, number];

      // Attack nearby bot
      if (nearestBot && nearestBot.dist < CONFIG.enemyAttackRange) {
        enemy.state = 'attack';
        targetPos = nearestBot.pos;

        if (now - enemy.lastAttackTime > enemy.attackCooldown * 1000) {
          const bot = bots.get(nearestBot.id);
          if (bot) {
            const newEnergy = Math.max(0, bot.energy - enemy.damage);
            const newHealth = Math.max(0, bot.health - enemy.damage * 0.5);
            updateBot(nearestBot.id, { energy: newEnergy, health: newHealth });
            addProjectile(enemyPos, nearestBot.pos, false, enemy.damage);
            addDamageNumber(nearestBot.pos, enemy.damage);
            enemy.lastAttackTime = now;
          }
        }
      }
      // Attack base
      else if (distToBase < CONFIG.enemyBaseAttackRange) {
        enemy.state = 'attack';
        targetPos = CONFIG.basePosition;

        if (now - enemy.lastAttackTime > enemy.attackCooldown * 1000) {
          const damage = enemy.damage * (enemy.isBoss ? 2 : 1);
          gameState.baseHealth = Math.max(0, gameState.baseHealth - damage);
          addProjectile(enemyPos, [0, 1.5, 0], false, damage);
          addDamageNumber([0, 2, 0], damage);
          triggerScreenShake(enemy.isBoss ? 1 : 0.5);
          enemy.lastAttackTime = now;

          if (gameState.baseHealth <= 0) {
            gameState.gameStatus = 'lost';
            return;
          }
        }
      }
      // Advance to base
      else {
        enemy.state = 'advance';
        targetPos = CONFIG.basePosition;
      }

      // Move
      const direction = [targetPos[0] - enemyPos[0], 0, targetPos[2] - enemyPos[2]];
      const dist = Math.sqrt(direction[0] ** 2 + direction[2] ** 2);

      if (dist > 1) {
        const speed = enemy.speed * delta;
        enemy.position = [
          enemyPos[0] + (direction[0] / dist) * speed,
          enemyPos[1],
          enemyPos[2] + (direction[2] / dist) * speed,
        ];
        enemy.velocity = [(direction[0] / dist) * speed, 0, (direction[2] / dist) * speed];
      }
    });

    // Cleanup
    gameState.enemies.forEach((enemy, id) => {
      if (enemy.state === 'dead') {
        setTimeout(() => gameState.enemies.delete(id), 1500);
      }
    });

    gameState.damageNumbers = gameState.damageNumbers.filter(d => now - d.createdAt < CONFIG.damageNumberDuration);
    gameState.projectiles = gameState.projectiles.filter(p => now - p.createdAt < 300);
    gameState.explosions = gameState.explosions.filter(e => now - e.createdAt < CONFIG.explosionDuration);
  });

  return {
    resources: gameState.resources,
    enemies: gameState.enemies,
    damageNumbers: gameState.damageNumbers,
    projectiles: gameState.projectiles,
    explosions: gameState.explosions,
    score: gameState.score,
    wave: gameState.wave,
    baseHealth: gameState.baseHealth,
    maxBaseHealth: gameState.maxBaseHealth,
    gameStatus: gameState.gameStatus,
    waveCountdown: gameState.waveCountdown,
    comboMultiplier: gameState.comboMultiplier,
    screenShake: gameState.screenShake,
    waveEnemiesRemaining: gameState.waveEnemiesRemaining,
    rallyPoint: gameState.rallyPoint,
    spawnResource,
    spawnEnemy,
    setPlayerCommand,
    setRallyPoint,
    resetGame,
  };
};

export default useGameplay;
