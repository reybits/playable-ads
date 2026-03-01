import type { Scene } from '../types.js';

export interface SceneManager {
  add(name: string, scene: Scene): void;
  go(name: string): void;
  current: Scene | null;
  currentName: string;
  update(dt: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

export function createSceneManager(): SceneManager {
  const scenes = new Map<string, Scene>();
  let current: Scene | null = null;
  let currentName = '';

  return {
    get current() {
      return current;
    },

    get currentName() {
      return currentName;
    },

    add(name: string, scene: Scene) {
      scenes.set(name, scene);
    },

    go(name: string) {
      const next = scenes.get(name);
      if (!next) return;
      current?.exit?.();
      current = next;
      currentName = name;
      current.enter?.();
    },

    update(dt: number) {
      current?.update(dt);
    },

    draw(ctx: CanvasRenderingContext2D) {
      current?.draw(ctx);
    },
  };
}
