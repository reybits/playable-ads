# Playable Ads Engine

A lightweight (~11KB minified) TypeScript engine for building interactive HTML5 playable ads. Targets Google Ads, MRAID, and Facebook Audience Network with a single codebase.

## Features

- **Canvas 2D rendering** — no WebGL, guaranteed compatibility with Google validation
- **Multi-network builds** — one codebase produces Google ZIP, MRAID single-HTML, and Facebook single-HTML
- **Scene system** — state machine for tutorial → gameplay → end card flows
- **Tween animations** — property animation with 10 easing functions
- **Sprite atlas** — efficient spritesheet rendering with anchor/rotation/scale
- **Unified input** — pointer events mapped to logical design coordinates
- **Web Audio** — sound playback gated on first user interaction
- **CTA handling** — ExitApi / mraid.open / FbPlayableAd abstracted behind one call
- **30-second timer** — built-in expiry tracking per Google requirements
- **Responsive scaling** — dynamically adapts canvas to fill the entire viewport on resize/rotation

## Quick Start

```bash
npm install
npm run dev                        # http://localhost:8080 (defaults to "worm-hunt")
npm run dev -- --game worm-hunt    # run a specific game
```

## Build

```bash
npm run build                              # all networks (default game)
npm run build:google -- --game worm-hunt   # specific game for Google
npm run build:mraid -- --game worm-hunt    # specific game for MRAID
npm run build:facebook -- --game worm-hunt # specific game for Facebook
```

All output goes to `dist/{game}/`:

| Command | Output | Format |
|---------|--------|--------|
| `build:google` | `dist/{game}/{game}-google.zip` | ZIP with `index.html` + `game.js` |
| `build:mraid` | `dist/{game}/mraid/index.html` | Single HTML file with inlined JS |
| `build:facebook` | `dist/{game}/facebook/index.html` | Single HTML file with inlined JS |

Other scripts:

```bash
npm run typecheck          # tsc --noEmit
npm run clean              # rm -rf dist
```

## Creating a New Playable Ad

Each ad lives in its own directory under `ads/`. No existing files need to be changed.

### 1. Create the directory structure

```
ads/my-game/
├── game.ts              # Entry point
├── scenes/
│   ├── tutorial.ts
│   ├── gameplay.ts
│   └── endcard.ts
├── generate-atlas.ts    # Optional: atlas generation script
└── assets/
    ├── atlas.png
    └── atlas.json
```

### 2. Create the engine

```ts
import { createEngine } from '../../src/engine/core.js';

const engine = createEngine({
  width: 360,        // design resolution (short side)
  height: 640,       // design resolution (long side)
  ctaUrl: 'https://play.google.com/store/apps/details?id=com.example',
  maxDuration: 30,   // seconds until engine.isExpired becomes true
});
```

The engine creates a canvas, injects fullscreen CSS, and dynamically adapts the canvas resolution to fill the viewport on every resize. The short side stays fixed while the long side stretches to match the screen aspect ratio — no letterboxing on any device.

### 3. Prepare assets

The asset pipeline has two stages:

**Stage 1: Atlas generation** (manual, run once)

Place your source sprites in `sprites/`, then write a `generate-atlas.ts` script that downscales and packs them into a single spritesheet:

```bash
npx tsx ads/my-game/generate-atlas.ts
```

This produces `assets/atlas.png` (spritesheet) and `assets/atlas.json` (frame coordinates). These are generated files — add them to `.gitignore`.

**Stage 2: Bundle** (automatic, on dev/build)

When you run `npm run dev` or `npm run build`, esbuild processes the imports:

```ts
import atlasUrl from './assets/atlas.png';   // → base64 data URL
import atlasData from './assets/atlas.json';  // → inlined JSON object
```

Both are baked directly into the JS bundle. No external files at runtime.

At runtime, load them into the engine's atlas system:

```ts
import { loadImage, createAtlas } from '../../src/engine/sprite.js';

const image = await loadImage(atlasUrl);
const atlas = createAtlas(image, atlasData);
```

Then `atlas.draw(ctx, 'player', x, y)` draws the correct region of the spritesheet.

The full flow: `sprites/` (source PNGs) → `assets/` (generated atlas) → JS bundle (inlined base64) → single HTML file.

Atlas JSON format:

```json
{
  "frames": {
    "player": { "x": 0, "y": 0, "w": 64, "h": 64 },
    "enemy":  { "x": 64, "y": 0, "w": 32, "h": 32, "anchorX": 0.5, "anchorY": 1.0 }
  }
}
```

### 4. Create scenes

Each scene implements the `Scene` interface:

```ts
import type { Engine, Atlas, Scene } from '../../src/engine/index.js';

function createGameplayScene(engine: Engine, atlas: Atlas): Scene {
  return {
    enter() { /* reset state */ },
    exit() { /* cleanup */ },

    update(dt: number) {
      // Read engine.width / engine.height each frame (they adapt on resize)
      const w = engine.width, h = engine.height;

      if (engine.input.pointer.isDown) {
        // handle input
      }

      if (engine.isExpired) {
        engine.scenes.go('endcard');
      }
    },

    draw(ctx: CanvasRenderingContext2D) {
      const w = engine.width, h = engine.height;
      engine.renderer.clear('#1a1a2e');
      atlas.draw(ctx, 'player', w / 2, h * 0.8, { scaleX: 2, scaleY: 2 });
    },
  };
}
```

### 5. Register scenes and start

```ts
engine.addScene('tutorial', createTutorialScene(engine, atlas));
engine.addScene('gameplay', createGameplayScene(engine, atlas));
engine.addScene('endcard', createEndcardScene(engine, atlas));

engine.start('tutorial');
```

### 6. Run and build

```bash
npm run dev -- --game my-game
npm run build:google -- --game my-game
```

## Included Ads

| Game | Directory | Description |
|------|-----------|-------------|
| **worm-hunt** (default) | `ads/worm-hunt/` | Slither.io-style worm arena — steer, eat, grow, avoid enemies |

## API Reference

### Engine

Created by `createEngine(config)`. This is the central object you pass to your scenes.

| Property | Type | Description |
|----------|------|-------------|
| `canvas` | `HTMLCanvasElement` | The DOM canvas element |
| `renderer` | `Renderer` | Drawing API |
| `input` | `Input` | Pointer/touch state |
| `tweens` | `TweenManager` | Animation system |
| `scenes` | `SceneManager` | Scene state machine |
| `sound` | `SoundManager` | Audio playback |
| `width` | `number` | Current canvas width (updates on resize) |
| `height` | `number` | Current canvas height (updates on resize) |
| `elapsed` | `number` | Seconds since `start()` was called |
| `maxDuration` | `number` | Time limit in seconds (default 30) |
| `isExpired` | `boolean` | `true` once `elapsed >= maxDuration` |

| Method | Description |
|--------|-------------|
| `addScene(name, scene)` | Register a named scene |
| `start(sceneName)` | Begin the game loop and enter the initial scene |

The game loop runs at display refresh rate with delta time capped at 50ms. Each frame: `input.update()` → `tweens.update(dt)` → `scenes.update(dt)` → `scenes.draw(ctx)`.

### Renderer

```ts
renderer.clear('#1a1a2e');                              // fill background
renderer.clear();                                       // transparent clear

renderer.drawImage(img, x, y);                          // natural size
renderer.drawImage(img, x, y, w, h);                    // scaled
renderer.drawImage(img, x, y, w, h, { x, y, w, h });   // source rect crop

renderer.drawText('Hello', 160, 240, {
  font: 'bold 32px sans-serif',
  color: '#FFD700',
  align: 'center',        // 'left' | 'right' | 'center'
  baseline: 'middle',     // 'top' | 'middle' | 'bottom'
  stroke: '#000',          // optional text outline color
  strokeWidth: 3,          // outline width (default 2)
  maxWidth: 300,           // optional max width
});

renderer.fillRect(x, y, w, h, '#ff0000');
renderer.fillRoundRect(x, y, w, h, radius, '#4CAF50');
renderer.fillCircle(x, y, radius, '#FFD700');

renderer.save();
renderer.setAlpha(0.5);
renderer.translate(x, y);
renderer.rotate(radians);
renderer.scale(sx, sy);
renderer.restore();
```

The raw context is available as `renderer.ctx` for anything not covered by the API.

### Input

```ts
const { pointer } = engine.input;

pointer.x              // logical X in design coordinates
pointer.y              // logical Y in design coordinates
pointer.isDown         // currently held
pointer.justPressed    // true only on the press frame
pointer.justReleased   // true only on the release frame

engine.input.hitTest({ x: 100, y: 200, w: 120, h: 50 });
// true if justPressed AND pointer is inside the rect

engine.input.hasInteracted  // true after first touch/click
```

Pointer coordinates are automatically converted from screen space to design space.

### Atlas

```ts
const atlas = createAtlas(image, jsonData);

atlas.draw(ctx, 'frameName', x, y);
atlas.draw(ctx, 'frameName', x, y, {
  scaleX: 2,
  scaleY: 2,
  rotation: Math.PI / 4,   // radians
  anchorX: 0.5,             // 0 = left edge, 0.5 = center, 1 = right edge
  anchorY: 0.5,             // 0 = top edge, 0.5 = center, 1 = bottom edge
  alpha: 0.8,
});

atlas.frames.get('frameName');  // AtlasFrame | undefined
```

Sprites are drawn centered at `(x, y)` by default (anchor 0.5, 0.5).

### Tweens

```ts
import { Ease } from '../../src/engine/tween.js';

const obj = { x: 0, y: 100, alpha: 0 };

engine.tweens.add(obj, { x: 200, alpha: 1 }, 0.5, {
  easing: Ease.outBack,
  delay: 0.2,
  onComplete: () => console.log('done'),
});
```

**Available easings:** `linear`, `inQuad`, `outQuad`, `inOutQuad`, `inCubic`, `outCubic`, `inOutCubic`, `inBack`, `outBack`, `outElastic`

### Scene Manager

```ts
engine.scenes.go('gameplay');       // calls current.exit(), then gameplay.enter()
engine.scenes.current;              // the active Scene object
engine.scenes.currentName;          // 'gameplay'
```

### Sound

```ts
await engine.sound.load('bgm', audioArrayBuffer);
engine.sound.play('bgm', { loop: true, volume: 0.5 });
engine.sound.stop('bgm');
```

Audio is gated on user interaction — the `AudioContext` is resumed automatically after the first touch/click.

### Math Utilities

```ts
import { lerp, clamp, rand, randInt, dist, deg2rad, pointInRect } from '../../src/engine/math.js';

lerp(0, 100, 0.5)                  // 50
clamp(150, 0, 100)                 // 100
rand(1, 10)                        // random float in [1, 10)
randInt(1, 6)                      // random integer in [1, 6]
dist(0, 0, 3, 4)                   // 5
deg2rad(90)                        // Math.PI / 2
pointInRect(5, 5, { x: 0, y: 0, w: 10, h: 10 })  // true
```

## Project Structure

```
playable-ads/
├── src/engine/          Engine library
│   ├── index.ts         Barrel export
│   ├── core.ts          Engine creation, game loop, responsive scaling
│   ├── renderer.ts      Canvas 2D drawing API
│   ├── input.ts         Pointer events → design coordinates
│   ├── sprite.ts        Image loading, atlas sprite drawing
│   ├── tween.ts         Property animation + easing functions
│   ├── scene.ts         Scene state machine
│   ├── sound.ts         Web Audio playback
│   ├── cta.ts           Network-specific CTA calls
│   └── math.ts          Math utilities
├── ads/                 Playable ad projects
│   └── worm-hunt/       "Worm Hunt" slither-style game
├── templates/           HTML templates per network
│   ├── google.html
│   ├── mraid.html
│   └── facebook.html
├── scripts/             Build tools
│   ├── build.ts         Production build (--network, --game)
│   ├── dev.ts           Dev server (--game)
│   ├── inline-html.ts   Replace __INLINE_JS__ in templates
│   └── zip.ts           Create Google ZIP
└── dist/                Build output (gitignored)
```

## Typical Ad Flow

```
tutorial ──(tap or timeout)──▸ gameplay ──(win or 30s)──▸ endcard ──(tap)──▸ triggerCta()
```

1. **Tutorial** — show the player what to do. Auto-advance after a few seconds or on tap.
2. **Gameplay** — the interactive game. Keep it simple — 15-25 seconds of play.
3. **End card** — app icon, name, and a prominent CTA button. Any tap calls `triggerCta()`.

## Constraints

| Rule | Limit |
|------|-------|
| Google ZIP size | 5 MB max |
| External resources | Not allowed (everything must be inlined or bundled) |
| Canvas | 2D only (no WebGL) |
| Sound | Only after user interaction |
| Duration | 30 seconds max before showing CTA |
| MRAID / Facebook | Single HTML file, all assets inlined |

## License

MIT
