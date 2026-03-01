import type { EngineConfig, Scene } from '../types.js';
import { createRenderer, type Renderer } from './renderer.js';
import { createInput, type Input } from './input.js';
import { createTweenManager, type TweenManager } from './tween.js';
import { createSceneManager, type SceneManager } from './scene.js';
import { createSoundManager, type SoundManager } from './sound.js';
import { setCtaUrl } from './cta.js';

export interface Engine {
  canvas: HTMLCanvasElement;
  renderer: Renderer;
  input: Input;
  tweens: TweenManager;
  scenes: SceneManager;
  sound: SoundManager;
  width: number;
  height: number;
  elapsed: number;
  maxDuration: number;
  isExpired: boolean;
  start(initialScene: string): void;
  addScene(name: string, scene: Scene): void;
}

export function createEngine(config: EngineConfig): Engine {
  const shortSide = Math.min(config.width, config.height);
  const maxDuration = config.maxDuration ?? 30;

  if (config.ctaUrl) setCtaUrl(config.ctaUrl);

  // Create or use existing canvas
  const canvas = config.canvas ?? document.createElement('canvas');
  canvas.width = config.width;
  canvas.height = config.height;
  if (!config.canvas) {
    document.body.appendChild(canvas);
  }

  // Style for fullscreen responsive layout
  const style = document.createElement('style');
  style.textContent = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    canvas {
      display: block;
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      touch-action: none;
    }
  `;
  document.head.appendChild(style);

  // Resize immediately so engine.width/height are correct before scenes are added
  function resize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isPortrait = vh > vw;
    const aspect = isPortrait ? vh / vw : vw / vh;
    const w = isPortrait ? shortSide : Math.round(shortSide * aspect);
    const h = isPortrait ? Math.round(shortSide * aspect) : shortSide;
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${vw}px`;
    canvas.style.height = `${vh}px`;
  }
  resize();

  const renderer = createRenderer(canvas);
  const input = createInput(canvas);
  const tweens = createTweenManager();
  const scenes = createSceneManager();
  const sound = createSoundManager();

  let elapsed = 0;
  let isExpired = false;
  let running = false;
  let lastTime = 0;

  function loop(time: number) {
    if (!running) return;

    const dt = Math.min((time - lastTime) / 1000, 0.05); // cap at 50ms
    lastTime = time;

    // Unlock audio on first interaction
    if (input.hasInteracted) {
      sound.unlock();
    }

    // Update expiry
    elapsed += dt;
    if (elapsed >= maxDuration && !isExpired) {
      isExpired = true;
    }

    input.update();
    tweens.update(dt);
    scenes.update(dt);
    scenes.draw(renderer.ctx);

    requestAnimationFrame(loop);
  }

  const engine: Engine = {
    canvas,
    renderer,
    input,
    tweens,
    scenes,
    sound,
    get width() { return canvas.width; },
    get height() { return canvas.height; },
    get elapsed() {
      return elapsed;
    },
    maxDuration,
    get isExpired() {
      return isExpired;
    },

    addScene(name: string, scene: Scene) {
      scenes.add(name, scene);
    },

    start(initialScene: string) {
      resize();
      window.addEventListener('resize', resize);
      scenes.go(initialScene);
      running = true;
      lastTime = performance.now();
      requestAnimationFrame(loop);
    },
  };

  return engine;
}
