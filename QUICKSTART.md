# Quick Start Guide

Get the NanoBot Framework up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and add your API key:
```bash
# For Groq (recommended)
VITE_GROQ_API_KEY=gsk_your_actual_api_key_here

# OR for OpenRouter
VITE_OPENROUTER_API_KEY=sk-or-your_actual_api_key_here

# OR for Gemini
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

### Getting API Keys

- **Groq**: https://console.groq.com/keys (fastest, recommended)
- **OpenRouter**: https://openrouter.ai/keys (most models)
- **Gemini**: https://makersuite.google.com/app/apikey (Google's AI)

## Step 3: Start the Development Server

```bash
npm run dev
```

The app will automatically open at http://localhost:3000

## Step 4: Explore!

### Controls
- **Mouse**: Click and drag to rotate camera, scroll to zoom
- **SPACE**: Pause/resume simulation
- **R**: Replicate selected bot
- **Click a bot**: Select it to see detailed stats

### What You'll See

1. **3D Voxel World**: A beautiful procedurally generated terrain
2. **NanoBots**: Three autonomous bots exploring and learning
3. **HUD**: Real-time stats showing swarm size, energy, and tasks
4. **Visual Effects**: Glowing connections between nearby bots

### Next Steps

1. Watch the bots explore autonomously
2. Select a bot and press **R** to make it replicate
3. Open the **Control Panel** (right side) to:
   - Adjust simulation speed
   - Add more bots
   - Toggle visual effects
4. Explore the **Minimap** (bottom right) for a bird's eye view

## Troubleshooting

### "No API key found" warning
Make sure you created `.env` and added a valid API key.

### Bots not moving
Check the browser console for errors. Make sure your API key is valid.

### Low FPS
- Reduce the number of bots
- Toggle off fog or particles
- Lower simulation speed

### WebGL not supported
Upgrade to Chrome, Firefox, Safari, or Edge (latest version).

## What's Next?

- Read the full [README.md](README.md) for detailed documentation
- Explore the code in `src/` to customize behavior
- Modify bot AI in `src/ai/brain.ts`
- Create new bot skills in `src/core/NanoBot.ts`
- Design custom themes in `src/world/WorldGenerator.ts`

## Need Help?

Check the console logs for helpful information about what's happening under the hood.

Happy bot watching! 🤖✨
