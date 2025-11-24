# Voxel World Quick Start

Get your stunning 3D voxel world running in 60 seconds!

## Installation

The voxel world system is already included in the NanoBot framework. No additional installation needed!

## Basic Usage

### 1. Import Components

```tsx
import { VoxelWorld } from './world';
```

### 2. Add to Your Canvas

```tsx
import { Canvas } from '@react-three/fiber';
import { VoxelWorld } from './world';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas>
        <VoxelWorld />
      </Canvas>
    </div>
  );
}
```

### 3. Done!

That's it! You now have a beautiful cyberpunk voxel world with:
- Procedural terrain generation
- Multiple block types
- Atmospheric fog and particles
- Dynamic lighting
- Animated skybox

## Customization

### Change Theme

```tsx
<VoxelWorld theme="neon" />
// Options: 'cyberpunk', 'neon', 'matrix'
```

### Adjust World Size

```tsx
<VoxelWorld worldSize={6} renderDistance={4} />
```

### Set Seed

```tsx
<VoxelWorld seed={12345} />
// Same seed = same world
```

### Toggle Effects

```tsx
<VoxelWorld
  enableFog={true}
  enableParticles={true}
  showGrid={true}
/>
```

## Full Example

```tsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { VoxelWorld } from './world';

export default function VoxelWorldDemo() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas camera={{ position: [0, 20, 50], fov: 75 }}>
        {/* Camera controls */}
        <OrbitControls enableDamping />

        {/* The voxel world */}
        <VoxelWorld
          worldSize={4}
          theme="cyberpunk"
          seed={Date.now()}
          renderDistance={3}
          enableFog={true}
          enableParticles={true}
          showGrid={true}
        />
      </Canvas>
    </div>
  );
}
```

## With NanoBots

Combine the voxel world with the NanoBot swarm:

```tsx
import { VoxelWorld, NanoBotSwarm } from './world';

<Canvas>
  <VoxelWorld theme="cyberpunk" />
  <NanoBotSwarm botCount={20} swarmRadius={30} />
</Canvas>
```

## Performance Tips

1. **Start Small**: Begin with `worldSize={3}` and increase as needed
2. **Adjust Render Distance**: Lower `renderDistance` for better FPS
3. **Disable Particles**: Set `enableParticles={false}` on slower devices
4. **Use Theme Wisely**: Each theme has different particle densities

## Common Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `worldSize` | number | 4 | Chunks in each direction |
| `seed` | number | random | Procedural generation seed |
| `theme` | string | 'cyberpunk' | Visual theme |
| `renderDistance` | number | 3 | Chunks to render |
| `enableFog` | boolean | true | Atmospheric fog |
| `enableParticles` | boolean | true | Ambient particles |
| `showGrid` | boolean | true | Grid floor |

## Themes

### Cyberpunk (Default)
Cyan and purple neon colors with dark fog.

### Neon Dreams
Vibrant pink and blue with higher particle density.

### Matrix
Classic Matrix green aesthetic.

## Troubleshooting

### World Not Rendering
- Check Canvas is properly mounted
- Ensure camera is positioned correctly
- Verify theme name is valid

### Low FPS
- Reduce `worldSize` and `renderDistance`
- Disable particles: `enableParticles={false}`
- Lower fog density in theme settings

### Chunks Loading Slowly
- Check CPU usage (chunk generation is CPU-bound)
- Reduce world size
- Consider using a static seed

## Next Steps

- Read the full [VOXEL_WORLD_README.md](./VOXEL_WORLD_README.md)
- Check out [VoxelWorldExample.tsx](./VoxelWorldExample.tsx) for advanced usage
- Explore the [WorldGenerator.ts](./WorldGenerator.ts) API for custom structures

## Support

For issues, questions, or contributions, please refer to the main NanoBot framework documentation.

---

Built with React Three Fiber, Three.js, and procedural generation magic!
