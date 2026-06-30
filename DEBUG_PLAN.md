# NanoBot Framework - Upgraded v2.0

## New Features Added

### Visual Upgrades
1. **Enhanced NanoBot3D Component**
   - Personality-based color schemes (aggressive=red, defensive=blue, explorer=green, builder=yellow, social=purple)
   - Inner glowing core with pulsing animation
   - Orbiting energy particles around each bot
   - Outer aura that breathes and pulses
   - Energy trails when bots move fast (using @react-three/drei Trail)
   - Generation-based scaling (newer bots slightly smaller)

2. **Environment Enhancements**
   - Starfield background
   - Floating energy orbs throughout the world
   - Enhanced lighting with rim lights for depth
   - Chromatic aberration post-processing effect
   - Vignette effect for cinematic feel

### Swarm Intelligence
1. **Formation Patterns** (Press 1-7 to change)
   - `1` - Free: Natural flocking behavior
   - `2` - Circle: Bots orbit in a circle
   - `3` - Spiral: Rising spiral formation
   - `4` - DNA Helix: Double helix pattern
   - `5` - Sphere: Spherical distribution
   - `6` - Vortex: Tornado-like vortex
   - `7` - Grid: Organized grid formation

2. **Flocking Behaviors** (Boids algorithm)
   - Separation: Avoid crowding neighbors
   - Alignment: Steer towards average heading
   - Cohesion: Move toward center of neighbors

### Interactivity
1. **Click to Spawn**
   - Click anywhere on the ground plane to spawn a new bot
   - New bots get random personalities
   - Random energy levels (300-700)

2. **Auto-Replication**
   - Bots with high energy (>900) can auto-replicate
   - Creates child bots with inherited traits

### Enhanced HUD
1. **New Stats Display**
   - Swarm status indicator (Nascent/Growing/Thriving/Swarming)
   - Energy bar visualization
   - Current formation display
   - Pause state indicator
   - FPS with color-coded performance

2. **Formation Selector Panel** (Right side)
   - Visual list of all formations
   - Highlights current selection

3. **Help Overlay** (Press H)
   - Full keyboard shortcuts reference

## Keyboard Controls

| Key | Action |
|-----|--------|
| SPACE | Pause/Resume simulation |
| R | Replicate selected bot |
| +/- | Adjust simulation speed |
| G | Toggle grid |
| F | Toggle fog |
| P | Toggle particles |
| C | Toggle connections |
| H | Toggle help overlay |
| 1-7 | Formation patterns |

## Files Modified/Added

### New Files
- `src/hooks/useSwarmBehavior.ts` - Flocking algorithm and formation patterns

### Modified Files
- `src/world/NanoBot3D.tsx` - Complete visual overhaul with particles, trails, auras
- `src/Scene.tsx` - Added click-to-spawn, energy orbs, enhanced post-processing
- `src/ui/HUD.tsx` - Formation selector, help overlay, animated stats
- `src/App.tsx` - Added personality system, isPaused prop

## Dev Server

The app is running at: **http://localhost:4200/**

## Quick Test

1. Open http://localhost:4200/
2. You should see:
   - Voxel terrain with starfield background
   - 3 initial bots with different colors (based on personality)
   - Glowing, animated bots with orbiting rings and particles
   - HUD showing swarm stats and formation panel on right

3. Try:
   - Click the ground to spawn new bots
   - Press 2-7 to see formation changes
   - Press H for help
   - Press SPACE to pause
   - Watch bots flock together naturally in "Free" mode

## Troubleshooting

If bots don't appear:
1. Check browser console for errors
2. Look for "Scene: X bots rendering" messages
3. Ensure the store has bots: `📊 Bots created: 3`

If formations don't work:
1. Make sure flocking is enabled in useSwarmBehavior
2. Check that formation state is updating (press 1-7)
3. Formations need multiple bots to be visible

## Performance Tips

- If FPS drops below 30, try:
  - Press P to disable particles
  - Press C to disable connections
  - Reduce bot count (don't spawn too many)
