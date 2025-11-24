# NanoBot 3D Components

Stunning 3D visualizations for the NanoBot framework with cyberpunk aesthetics, built with React Three Fiber.

## Components Overview

### 1. NanoBot3D
The core 3D representation of a single nanobot with beautiful visual effects.

**Features:**
- Icosahedron core geometry with high subdivision
- 3 orbital rings rotating at different speeds
- Crystalline spike protrusions positioned at icosahedron vertices
- Custom shader material with glow effects and energy patterns
- 4 animated states: idle, working, learning, replicating
- GPU particle trail when moving
- Point light for environmental glow
- Selection highlight effect

**Props:**
```typescript
interface NanoBot3DProps {
  position: [number, number, number];  // 3D position
  state: 'idle' | 'working' | 'learning' | 'replicating';
  color?: string;           // Hex color (default: '#00ffff')
  energy?: number;          // 0-1 range (default: 1.0)
  isSelected?: boolean;     // Shows selection glow
  velocity?: [number, number, number];  // For particle trail
}
```

**State Behaviors:**
- **idle**: Gentle bob animation, slow rotation
- **working**: Fast pulse, rapid rotation
- **learning**: Breathing scale effect, moderate rotation with tilt
- **replicating**: Intense pulse, very rapid rotation with wobble

### 2. NanoBotSwarm
Renders multiple nanobots with hive-mind connection visualization.

**Features:**
- Renders multiple NanoBot3D instances efficiently
- Dynamic connection lines between nearby bots
- Animated data flow particles along connections
- Bezier curved connection paths
- Distance-based connection filtering
- Maximum connections per bot limit

**Props:**
```typescript
interface NanoBotSwarmProps {
  bots: BotData[];              // Array of bot configurations
  showConnections?: boolean;     // Enable/disable connections (default: true)
  connectionDistance?: number;   // Max distance for connections (default: 3)
  maxConnections?: number;       // Max connections per bot (default: 3)
}

interface BotData {
  id: string;
  position: [number, number, number];
  state: BotState;
  color?: string;
  energy?: number;
  isSelected?: boolean;
  velocity?: [number, number, number];
}
```

### 3. ReplicationEffect
Stunning visual effect for bot replication events (Shadow Clone style).

**Features:**
- **Phase 1 (Extraction)**: Spiral helix particles extracting energy from parent
- Energy beam flowing from parent to child location
- **Phase 2 (Materialization)**: Crystallization effect at child location
- Bloom wave expansion
- Temporary connection line between parent and child
- Point lights for dramatic lighting
- Sound-ready timing markers

**Props:**
```typescript
interface ReplicationEffectProps {
  parentPosition: [number, number, number];
  childPosition: [number, number, number];
  color?: string;          // Effect color (default: '#00ffff')
  duration?: number;       // Total duration in seconds (default: 3.0)
  onComplete?: () => void; // Callback when effect finishes
}
```

**Timeline:**
- 0.0s: Extraction starts
- 0.3s: Helix peak intensity
- 1.0s: Materialization begins
- 1.5s: Crystal peak, bloom wave starts
- 2.0s: Bloom expansion
- 3.0s: Complete

### 4. ParticleSystem
GPU-accelerated particle system with instanced rendering.

**Features:**
- Instanced rendering for high performance
- 4 particle types: trail, sparkle, energy, data
- Custom behaviors per type
- Physics simulation (velocity, gravity, damping)
- Color and size animation over lifetime
- Alpha blending with glow effects
- Automatic particle cleanup

**Props:**
```typescript
interface ParticleSystemProps {
  maxParticles?: number;        // Maximum particles (default: 1000)
  particles?: Particle[];       // External particle array (optional)
  emitRate?: number;           // Particles per second (default: 0)
  emitPosition?: [number, number, number];
  emitVelocity?: [number, number, number];
  emitSpread?: number;         // Random spread (default: 1)
  particleType?: 'trail' | 'sparkle' | 'energy' | 'data';
  particleColor?: string;      // Hex color
  particleSize?: number;       // Base size (default: 0.1)
  particleLifetime?: number;   // Seconds (default: 2)
  gravity?: [number, number, number];  // Gravity vector
  damping?: number;            // Velocity damping 0-1 (default: 0.98)
}
```

**Particle Types:**
- **trail**: Fades smoothly, good for motion trails
- **sparkle**: Pulsing size, high brightness
- **energy**: Sine wave size animation, persistent
- **data**: Small, consistent, good for info flow

## Shaders

All shaders are located in `/src/shaders/index.ts`:

- `nanoBotVertexShader` / `nanoBotFragmentShader`: Core bot material
- `orbitalRingVertexShader` / `orbitalRingFragmentShader`: Orbital rings
- `connectionLineVertexShader` / `connectionLineFragmentShader`: Swarm connections
- `particleVertexShader` / `particleFragmentShader`: Particle rendering
- `replicationVertexShader` / `replicationFragmentShader`: Replication effect

## Usage Examples

### Basic Single Bot
```tsx
import { Canvas } from '@react-three/fiber';
import { NanoBot3D } from '@world/index';

<Canvas>
  <NanoBot3D
    position={[0, 0, 0]}
    state="working"
    color="#00ffff"
    energy={0.8}
  />
</Canvas>
```

### Swarm with Connections
```tsx
import { NanoBotSwarm } from '@world/index';

const bots = [
  { id: '1', position: [0, 0, 0], state: 'idle', color: '#00ffff' },
  { id: '2', position: [2, 0, 0], state: 'working', color: '#ff00ff' },
  // ... more bots
];

<Canvas>
  <NanoBotSwarm
    bots={bots}
    showConnections={true}
    connectionDistance={3}
  />
</Canvas>
```

### Replication Effect
```tsx
import { ReplicationEffect } from '@world/index';

<Canvas>
  <ReplicationEffect
    parentPosition={[-2, 0, 0]}
    childPosition={[2, 0, 0]}
    color="#ff00ff"
    duration={3}
    onComplete={() => console.log('Replication complete!')}
  />
</Canvas>
```

### Particle System
```tsx
import { ParticleSystem } from '@world/index';

<Canvas>
  <ParticleSystem
    maxParticles={500}
    emitRate={30}
    emitPosition={[0, 0, 0]}
    particleType="energy"
    particleColor="#00ffff"
    particleLifetime={2}
    gravity={[0, -1, 0]}
  />
</Canvas>
```

## Performance Tips

1. **Limit particle counts**: Start with lower maxParticles and increase as needed
2. **Use connectionDistance wisely**: Smaller distances = fewer connections = better performance
3. **Limit maxConnections**: 3-5 connections per bot is usually optimal
4. **Enable frustum culling**: Bots outside camera view won't render
5. **Use LOD**: Consider simpler geometry for distant bots
6. **Batch state updates**: Update multiple bot states in a single frame
7. **Debounce replication effects**: Don't trigger too many simultaneously

## Cyberpunk Aesthetic Setup

For best visual results, use with:

```tsx
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Environment } from '@react-three/drei';

<Canvas>
  <color attach="background" args={['#000510']} />
  <fog attach="fog" args={['#000510', 5, 20]} />

  {/* Your NanoBot components */}

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
```

## Color Palette Recommendations

Cyberpunk neon colors:
- Cyan: `#00ffff`, `#00d4ff`
- Magenta: `#ff00ff`, `#ff006f`
- Purple: `#8b00ff`, `#d100ff`
- Blue: `#0080ff`, `#00a0ff`
- Pink: `#ff007f`, `#ff1493`
- Green: `#00ff7f`, `#00ff00`

## Animation Timing

All animations use `useFrame` from React Three Fiber:
- Updates run at 60 FPS (or monitor refresh rate)
- Delta time is provided for frame-independent animation
- Shader uniforms updated every frame for smooth effects

## Future Enhancements

Potential additions:
- Sound integration at timing markers
- More particle types (explosion, teleport, etc.)
- LOD system for distant bots
- Custom formation patterns for swarms
- Interaction system (click, hover effects)
- Energy transfer visualization
- Death/destruction effects
- Portal/teleportation effects

## Dependencies

- `@react-three/fiber`: ^8.15.12
- `@react-three/drei`: ^9.92.7
- `@react-three/postprocessing`: ^2.15.11
- `three`: ^0.160.0
- `react`: ^18.2.0

## License

MIT
