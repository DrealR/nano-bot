# NanoBot Framework

A stunning 3D visualization framework for autonomous AI nanobots with swarm intelligence, self-replication, and hive mind capabilities.

## Features

- **3D Voxel World**: Beautiful voxel-based environment with procedural generation
- **Autonomous NanoBots**: AI-powered bots with memory, learning, and decision-making
- **Self-Replication**: Bots can create clones when they have sufficient energy
- **Hive Mind**: Shared knowledge and collective intelligence across the swarm
- **Real-time Visualization**: Stunning visual effects powered by Three.js and React Three Fiber
- **Post-Processing**: Bloom, SSAO, and other effects for a cinematic look

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- An AI API key (Groq, OpenRouter, or Gemini)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd nano-bot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your API key(s):
```env
VITE_GROQ_API_KEY=your_actual_api_key_here
```

### Running the App

Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Building for Production

```bash
npm run build
npm run preview
```

## Controls

### Keyboard Shortcuts

- **SPACE** - Pause/Resume simulation
- **R** - Replicate selected bot
- **+/-** - Increase/Decrease simulation speed
- **G** - Toggle grid
- **F** - Toggle fog
- **P** - Toggle particles
- **C** - Toggle connections

### Mouse Controls

- **Left Click + Drag** - Rotate camera
- **Right Click + Drag** - Pan camera
- **Scroll** - Zoom in/out
- **Click Bot** - Select bot (shows status panel)

## Architecture

```
src/
├── core/          # Core NanoBot classes and logic
│   ├── NanoBot.ts       # Main bot class
│   ├── HiveMind.ts      # Shared knowledge system
│   ├── BotSwarm.ts      # Swarm coordination
│   └── types.ts         # Type definitions
├── ai/            # AI brain and decision-making
│   ├── brain.ts         # AI brain implementation
│   └── types.ts         # AI types
├── world/         # 3D world and visualization
│   ├── VoxelWorld.tsx   # Voxel terrain
│   ├── NanoBotSwarm.tsx # Bot rendering
│   └── Environment.tsx  # Skybox, fog, particles
├── ui/            # 2D UI overlays
│   ├── HUD.tsx          # Main HUD
│   ├── BotStatusPanel.tsx
│   ├── SwarmStats.tsx
│   ├── ControlPanel.tsx
│   └── Minimap.tsx
├── store/         # State management
│   └── useStore.ts      # Zustand store
├── hooks/         # Custom React hooks
│   └── useSimulation.ts # Simulation loop
├── App.tsx        # Main app component
├── Scene.tsx      # 3D scene setup
└── main.tsx       # Entry point
```

## Configuration

### AI Providers

The framework supports multiple AI providers:

1. **Groq** (Recommended)
   - Fast inference with Mixtral and Llama models
   - Get key: https://console.groq.com/keys

2. **OpenRouter**
   - Access to many different models
   - Get key: https://openrouter.ai/keys

3. **Gemini**
   - Google's Gemini models
   - Get key: https://makersuite.google.com/app/apikey

### World Themes

Available themes:
- `cyberpunk` (default)
- `neon`
- `forest`
- `desert`
- `ocean`

Change theme in `src/store/useStore.ts`:
```typescript
worldTheme: THEMES.cyberpunk
```

## API

### Creating a New Bot

```typescript
import { NanoBot } from '@core';

const bot = new NanoBot({
  position: { x: 0, y: 2, z: 0 },
  energy: 500,
  aiProvider: 'groq',
  apiKey: 'your-api-key',
  model: 'mixtral-8x7b-32768',
});
```

### Bot Methods

```typescript
// Update bot (called each frame)
bot.update(deltaTime);

// Think and make decisions
const decision = await bot.think();

// Replicate
const childBot = bot.replicate();

// Learn from experience
bot.learn({
  context: 'exploration',
  action: 'move',
  outcome: 'success',
});
```

## Performance

### Optimization Tips

1. Reduce render distance for voxel chunks
2. Lower simulation speed for complex swarms
3. Disable post-processing effects on low-end devices
4. Limit maximum number of bots

### System Requirements

- **Minimum**: 4GB RAM, integrated graphics, modern browser with WebGL 2.0
- **Recommended**: 8GB+ RAM, dedicated GPU, Chrome/Firefox/Edge

## Troubleshooting

### WebGL Not Supported
Upgrade to a modern browser that supports WebGL 2.0.

### Low FPS
1. Reduce render distance
2. Disable post-processing effects
3. Reduce number of bots
4. Lower simulation speed

### Bots Not Thinking
Check that you've set a valid API key in `.env`.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.

## Credits

Built with:
- React Three Fiber
- Three.js
- Zustand
- Groq SDK / OpenRouter / Gemini
- React
- Vite

---

Made with ❤️ by the NanoBot team
