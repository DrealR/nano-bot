/**
 * Example usage of NanoBot 3D components
 *
 * This file demonstrates how to use all the stunning 3D NanoBot components
 * in your React Three Fiber scene.
 */

import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, EffectComposer, Bloom } from '@react-three/drei';
import {
  NanoBot3D,
  NanoBotSwarm,
  ReplicationEffect,
  ParticleSystem,
  type BotData,
  type BotState,
} from './index';

// Example 1: Single NanoBot
export const SingleNanoBotExample = () => {
  const [state, setState] = useState<BotState>('idle');

  useEffect(() => {
    const interval = setInterval(() => {
      const states: BotState[] = ['idle', 'working', 'learning', 'replicating'];
      setState(states[Math.floor(Math.random() * states.length)]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <color attach="background" args={['#000510']} />

      <ambientLight intensity={0.1} />

      <NanoBot3D
        position={[0, 0, 0]}
        state={state}
        color="#00ffff"
        energy={0.8}
        isSelected={false}
        velocity={[0.1, 0, 0]}
      />

      <OrbitControls />

      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
        />
      </EffectComposer>

      <Environment preset="night" />
    </Canvas>
  );
};

// Example 2: Swarm of NanoBots
export const NanoBotSwarmExample = () => {
  const [bots, setBots] = useState<BotData[]>([]);

  useEffect(() => {
    // Create initial swarm
    const initialBots: BotData[] = [];
    for (let i = 0; i < 10; i++) {
      initialBots.push({
        id: `bot-${i}`,
        position: [
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5,
        ],
        state: 'idle',
        color: `hsl(${Math.random() * 60 + 180}, 100%, 50%)`,
        energy: Math.random() * 0.5 + 0.5,
        velocity: [
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
        ],
      });
    }
    setBots(initialBots);

    // Randomly update bot states
    const interval = setInterval(() => {
      setBots((prev) =>
        prev.map((bot) => ({
          ...bot,
          state: ['idle', 'working', 'learning'][
            Math.floor(Math.random() * 3)
          ] as BotState,
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
      <color attach="background" args={['#000510']} />

      <ambientLight intensity={0.1} />
      <fog attach="fog" args={['#000510', 5, 20]} />

      <NanoBotSwarm
        bots={bots}
        showConnections={true}
        connectionDistance={3}
        maxConnections={3}
      />

      <OrbitControls />

      <EffectComposer>
        <Bloom
          intensity={2.0}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
        />
      </EffectComposer>

      <Environment preset="night" />
    </Canvas>
  );
};

// Example 3: Replication Effect
export const ReplicationEffectExample = () => {
  const [showEffect, setShowEffect] = useState(false);
  const [childBot, setChildBot] = useState(false);

  const handleStartReplication = () => {
    setShowEffect(true);
    setChildBot(false);
  };

  const handleReplicationComplete = () => {
    setShowEffect(false);
    setChildBot(true);
  };

  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
      <color attach="background" args={['#000510']} />

      <ambientLight intensity={0.1} />

      {/* Parent Bot */}
      <NanoBot3D
        position={[-2, 0, 0]}
        state={showEffect ? 'replicating' : 'idle'}
        color="#ff00ff"
        energy={1}
      />

      {/* Child Bot (appears after replication) */}
      {childBot && (
        <NanoBot3D
          position={[2, 0, 0]}
          state="idle"
          color="#ff00ff"
          energy={0.8}
        />
      )}

      {/* Replication Effect */}
      {showEffect && (
        <ReplicationEffect
          parentPosition={[-2, 0, 0]}
          childPosition={[2, 0, 0]}
          color="#ff00ff"
          duration={3}
          onComplete={handleReplicationComplete}
        />
      )}

      <OrbitControls />

      <EffectComposer>
        <Bloom
          intensity={2.5}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
        />
      </EffectComposer>

      <Environment preset="night" />

      {/* UI to trigger replication */}
      <group>
        <Html>
          <button
            onClick={handleStartReplication}
            disabled={showEffect}
            style={{
              padding: '10px 20px',
              background: '#ff00ff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: showEffect ? 'not-allowed' : 'pointer',
              opacity: showEffect ? 0.5 : 1,
            }}
          >
            Start Replication
          </button>
        </Html>
      </group>
    </Canvas>
  );
};

// Example 4: Particle System
export const ParticleSystemExample = () => {
  const [emitPosition, setEmitPosition] = useState<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    // Move emission point in a circle
    const interval = setInterval(() => {
      const time = Date.now() / 1000;
      setEmitPosition([
        Math.cos(time) * 2,
        Math.sin(time * 2) * 1,
        Math.sin(time) * 2,
      ]);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
      <color attach="background" args={['#000510']} />

      <ambientLight intensity={0.1} />

      {/* Trail particles */}
      <ParticleSystem
        maxParticles={500}
        emitRate={30}
        emitPosition={emitPosition}
        emitVelocity={[0, 0, 0]}
        emitSpread={0.5}
        particleType="trail"
        particleColor="#00ffff"
        particleSize={0.1}
        particleLifetime={2}
        gravity={[0, -0.5, 0]}
        damping={0.95}
      />

      {/* Energy particles */}
      <ParticleSystem
        maxParticles={300}
        emitRate={20}
        emitPosition={[0, 0, 0]}
        emitVelocity={[0, 1, 0]}
        emitSpread={1}
        particleType="energy"
        particleColor="#ff00ff"
        particleSize={0.15}
        particleLifetime={3}
        gravity={[0, 0, 0]}
        damping={0.98}
      />

      {/* Sparkle particles */}
      <ParticleSystem
        maxParticles={200}
        emitRate={50}
        emitPosition={[2, 0, 0]}
        emitVelocity={[0, 0, 0]}
        emitSpread={0.3}
        particleType="sparkle"
        particleColor="#ffff00"
        particleSize={0.08}
        particleLifetime={1}
        gravity={[0, 0, 0]}
        damping={0.9}
      />

      {/* Data particles */}
      <ParticleSystem
        maxParticles={400}
        emitRate={40}
        emitPosition={[-2, 0, 0]}
        emitVelocity={[1, 0, 0]}
        emitSpread={0.2}
        particleType="data"
        particleColor="#00ff00"
        particleSize={0.05}
        particleLifetime={2.5}
        gravity={[0, 0, 0]}
        damping={0.99}
      />

      <OrbitControls />

      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
        />
      </EffectComposer>
    </Canvas>
  );
};

// Example 5: Complete Scene
export const CompleteSceneExample = () => {
  const [bots, setBots] = useState<BotData[]>([]);
  const [replicating, setReplicating] = useState<{
    parent: [number, number, number];
    child: [number, number, number];
  } | null>(null);

  useEffect(() => {
    // Initialize swarm
    const initialBots: BotData[] = [];
    for (let i = 0; i < 8; i++) {
      initialBots.push({
        id: `bot-${i}`,
        position: [
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6,
        ],
        state: 'idle',
        color: `hsl(${Math.random() * 60 + 180}, 100%, 50%)`,
        energy: Math.random() * 0.5 + 0.5,
        velocity: [
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1,
        ],
      });
    }
    setBots(initialBots);

    // Random replication events
    const replicationInterval = setInterval(() => {
      if (Math.random() > 0.7 && bots.length > 0) {
        const parentBot = bots[Math.floor(Math.random() * bots.length)];
        const childPos: [number, number, number] = [
          parentBot.position[0] + (Math.random() - 0.5) * 2,
          parentBot.position[1] + (Math.random() - 0.5) * 2,
          parentBot.position[2] + (Math.random() - 0.5) * 2,
        ];

        setReplicating({
          parent: parentBot.position,
          child: childPos,
        });

        // Add new bot after replication
        setTimeout(() => {
          setBots((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              position: childPos,
              state: 'idle',
              color: parentBot.color,
              energy: 0.8,
              velocity: [0, 0, 0],
            },
          ]);
          setReplicating(null);
        }, 3000);
      }
    }, 8000);

    return () => clearInterval(replicationInterval);
  }, [bots.length]);

  return (
    <Canvas camera={{ position: [0, 0, 12], fov: 50 }}>
      <color attach="background" args={['#000510']} />

      <ambientLight intensity={0.15} />
      <fog attach="fog" args={['#000510', 8, 25]} />

      {/* Swarm */}
      <NanoBotSwarm
        bots={bots}
        showConnections={true}
        connectionDistance={4}
        maxConnections={3}
      />

      {/* Active replication effect */}
      {replicating && (
        <ReplicationEffect
          parentPosition={replicating.parent}
          childPosition={replicating.child}
          color="#00ffff"
          duration={3}
        />
      )}

      {/* Ambient particles */}
      <ParticleSystem
        maxParticles={1000}
        emitRate={10}
        emitPosition={[0, 0, 0]}
        emitVelocity={[0, 0, 0]}
        emitSpread={10}
        particleType="sparkle"
        particleColor="#ffffff"
        particleSize={0.05}
        particleLifetime={5}
        gravity={[0, 0, 0]}
        damping={0.99}
      />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
      />

      <EffectComposer>
        <Bloom
          intensity={2.0}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>

      <Environment preset="night" />
    </Canvas>
  );
};

// Note: Import Html from '@react-three/drei' for the button example
// import { Html } from '@react-three/drei';
