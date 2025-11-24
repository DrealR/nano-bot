# NanoBot GLSL Shaders

Beautiful, production-quality GLSL shaders for the NanoBot framework with stunning visual effects.

## Shader Files

### NanoBot Shaders
- **nanobot.vert** / **nanobot.frag** - Main bot mesh shaders
  - Vertex displacement with organic pulsing
  - Fresnel/rim lighting for edge glow
  - Holographic shimmer effects
  - Circuit pattern overlays
  - State-based color transitions (idle → active → alert → hivemind)
  - HDR output for bloom post-processing

### Connection Shaders
- **connection.vert** / **connection.frag** - Hive-mind connection lines
  - Animated data flow particles
  - Camera-facing billboards
  - Pulsing glow effects
  - Distance-based fade
  - Multi-particle system along lines

### Voxel Shaders
- **voxel.vert** / **voxel.frag** - Voxel world rendering
  - Per-vertex ambient occlusion
  - Soft shadows with configurable softness
  - Hemisphere sky lighting
  - Emissive material support
  - Distance fog with smooth transitions
  - Subtle texture variation

### Particle Shaders
- **particle.vert** / **particle.frag** - GPU particle system
  - Three particle types: sparkles, trails, energy orbs
  - Physics-based motion (gravity, drag)
  - Life-based alpha fade
  - Billboard rotation
  - Color interpolation over lifetime
  - Shape-based rendering (stars, trails, orbs)

## Usage

Import shaders from the index file:

```typescript
import {
  nanobotVertexShader,
  nanobotFragmentShader,
  nanobotDefaultUniforms,
  connectionVertexShader,
  connectionFragmentShader,
  connectionDefaultUniforms,
  voxelVertexShader,
  voxelFragmentShader,
  voxelDefaultUniforms,
  particleVertexShader,
  particleFragmentShader,
  particleDefaultUniforms,
} from './shaders';
```

### NanoBot Material Example

```typescript
import * as THREE from 'three';
import { nanobotVertexShader, nanobotFragmentShader, nanobotDefaultUniforms } from './shaders';

const material = new THREE.ShaderMaterial({
  vertexShader: nanobotVertexShader,
  fragmentShader: nanobotFragmentShader,
  uniforms: {
    ...nanobotDefaultUniforms,
    cameraPosition: { value: camera.position },
  },
});

// In animation loop
material.uniforms.time.value = clock.getElapsedTime();
material.uniforms.botState.value = botState; // 0-3
```

### Connection Line Example

```typescript
const connectionMaterial = new THREE.ShaderMaterial({
  vertexShader: connectionVertexShader,
  fragmentShader: connectionFragmentShader,
  uniforms: {
    ...connectionDefaultUniforms,
    cameraPosition: { value: camera.position },
  },
  transparent: true,
  blending: THREE.AdditiveBlending,
});
```

### Voxel World Example

```typescript
const voxelMaterial = new THREE.ShaderMaterial({
  vertexShader: voxelVertexShader,
  fragmentShader: voxelFragmentShader,
  uniforms: {
    ...voxelDefaultUniforms,
    cameraPosition: { value: camera.position },
  },
});
```

### Particle System Example

```typescript
const particleMaterial = new THREE.ShaderMaterial({
  vertexShader: particleVertexShader,
  fragmentShader: particleFragmentShader,
  uniforms: {
    ...particleDefaultUniforms,
    cameraPosition: { value: camera.position },
  },
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
```

## Color Scheme

The shaders use a cyberpunk-inspired color palette:

- **Primary**: `#00FF41` (Matrix green) - RGB: `[0.0, 1.0, 0.255]`
- **Secondary**: `#00D9FF` (Cyan) - RGB: `[0.0, 0.851, 1.0]`
- **Accent**: `#FF006E` (Hot pink) - RGB: `[1.0, 0.0, 0.431]`

## Bot States

NanoBot shaders support 4 states via the `botState` uniform:

0. **Idle** - Gentle pulse with primary color
1. **Active** - Faster pulse, blend primary/secondary
2. **Alert** - Intense pulse with accent color
3. **Hivemind** - Multi-color pulsing with all colors

## Features

### Visual Effects
- Fresnel/rim lighting
- Holographic shimmer
- Procedural noise patterns
- Circuit overlays
- Pulsing emissive
- Energy flow animations
- Soft shadows
- Ambient occlusion
- Distance fog
- HDR bloom support

### Performance
- Optimized noise functions
- LOD-friendly (distance fade)
- GPU-accelerated particles
- Efficient billboard rendering
- Minimal uniform updates

## Post-Processing

These shaders output HDR values (> 1.0) for beautiful bloom effects. Use with:

- Three.js UnrealBloomPass
- Custom bloom compositor
- Tone mapping for final output

## Customization

All shaders include extensive uniform controls:

- Animation speeds and intensities
- Color customization
- Effect strengths
- Distance parameters
- Lighting properties

See the `*DefaultUniforms` objects in `index.ts` for all available parameters.
