# Quick Start Guide - NanoBot 3D Components

## Installation Complete!

All 4 stunning 3D NanoBot components have been created:

1. **NanoBot3D.tsx** - Single nanobot with animations (363 lines)
2. **NanoBotSwarm.tsx** - Multiple bots with hive-mind connections (339 lines)
3. **ReplicationEffect.tsx** - Shadow Clone style replication effect (375 lines)
4. **ParticleSystem.tsx** - GPU-accelerated particles (304 lines)

## Fastest Way to Get Started

```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, EffectComposer, Bloom } from '@react-three/drei';
import { NanoBot3D } from '@world/index';

function App() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <color attach="background" args={['#000510']} />
      <ambientLight intensity={0.1} />

      <NanoBot3D
        position={[0, 0, 0]}
        state="working"
        color="#00ffff"
        energy={1}
      />

      <OrbitControls />

      <EffectComposer>
        <Bloom intensity={2} luminanceThreshold={0.1} />
      </EffectComposer>

      <Environment preset="night" />
    </Canvas>
  );
}
```

## Component Imports

```tsx
// Import all at once
import {
  NanoBot3D,
  NanoBotSwarm,
  ReplicationEffect,
  ParticleSystem,
  type BotState,
  type BotData,
  type Particle,
  type ParticleType
} from '@world/index';

// Or individually
import { NanoBot3D } from '@world/NanoBot3D';
import { NanoBotSwarm } from '@world/NanoBotSwarm';
import { ReplicationEffect } from '@world/ReplicationEffect';
import { ParticleSystem } from '@world/ParticleSystem';
```

## Key Features by Component

### NanoBot3D
- ✨ Icosahedron core (high subdivision)
- 🔮 3 orbital rings at different angles
- 💎 12 crystalline spike protrusions
- 🌟 Custom shader with glow & energy patterns
- 🎭 4 states: idle, working, learning, replicating
- 💫 Particle trail when moving
- 💡 Point light for environment glow

### NanoBotSwarm
- 👥 Renders multiple NanoBot3D instances
- 🔗 Connection lines between nearby bots
- 📡 Animated data flow particles
- 🎯 Distance-based filtering
- ⚡ Bezier curved connections
- 🎨 Per-bot color customization

### ReplicationEffect
- 🌀 Phase 1: Energy extraction with helix spiral
- ⚡ Energy beam from parent to child
- 💎 Phase 2: Crystallization at child location
- 💥 Bloom wave expansion
- 🔗 Temporary connection line
- 🎬 3-second default duration with timing markers

### ParticleSystem
- 🚀 GPU-accelerated instanced rendering
- 🎨 4 types: trail, sparkle, energy, data
- 🎯 Physics simulation (gravity, damping)
- ✨ Color/size animation over lifetime
- 💫 Additive blending with glow
- ♻️ Automatic cleanup

## States Explained

```tsx
// Idle - gentle floating
<NanoBot3D state="idle" />

// Working - fast pulsing
<NanoBot3D state="working" />

// Learning - breathing animation
<NanoBot3D state="learning" />

// Replicating - intense animation
<NanoBot3D state="replicating" />
```

## Color Palette (Cyberpunk)

```tsx
const colors = {
  cyan: '#00ffff',
  magenta: '#ff00ff',
  purple: '#8b00ff',
  blue: '#0080ff',
  pink: '#ff007f',
  green: '#00ff7f'
};
```

## Performance Tips

1. Start with 5-10 bots in a swarm
2. Keep maxParticles under 1000
3. Use connectionDistance wisely (3-4 units)
4. Limit maxConnections to 3-5 per bot
5. Enable bloom carefully (intensity ~2.0)

## Files Structure

```
src/world/
├── NanoBot3D.tsx          # Single bot component
├── NanoBotSwarm.tsx       # Swarm component
├── ReplicationEffect.tsx  # Replication effect
├── ParticleSystem.tsx     # Particle system
├── index.ts              # Barrel exports
├── Example.tsx           # 5 usage examples
├── README.md             # Full documentation
└── QUICK_START.md        # This file

src/shaders/
└── index.ts              # All GLSL shaders
```

## Example Files

Check `Example.tsx` for 5 complete examples:
1. Single NanoBot
2. Swarm with connections
3. Replication effect demo
4. Particle system demo
5. Complete scene with all features

## Next Steps

1. Try running the examples in `Example.tsx`
2. Read the full `README.md` for detailed props
3. Customize colors and animations
4. Add your own bot behaviors
5. Integrate with your AI/game logic

## Common Issues

**No bloom effect?**
- Add `@react-three/postprocessing` to dependencies
- Wrap with EffectComposer

**Performance issues?**
- Reduce particle counts
- Decrease connection distance
- Lower bot count

**Shaders not working?**
- Check Three.js version (^0.160.0)
- Verify shader imports from `@shaders/index`

## Dependencies Required

```json
{
  "@react-three/fiber": "^8.15.12",
  "@react-three/drei": "^9.92.7",
  "@react-three/postprocessing": "^2.15.11",
  "three": "^0.160.0",
  "react": "^18.2.0"
}
```

## Support

- Full documentation: `README.md`
- Examples: `Example.tsx`
- Shaders: `src/shaders/index.ts`

---

**Enjoy creating stunning NanoBot visualizations!** 🚀✨
