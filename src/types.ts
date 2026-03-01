export type AdNetwork = 'google' | 'mraid' | 'facebook';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AtlasFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  anchorX?: number;
  anchorY?: number;
}

export interface AtlasData {
  frames: Record<string, AtlasFrame>;
}

export interface PointerData {
  x: number;
  y: number;
  isDown: boolean;
  justPressed: boolean;
  justReleased: boolean;
}

export interface Scene {
  enter?(): void;
  exit?(): void;
  update(dt: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

export interface EngineConfig {
  width: number;
  height: number;
  canvas?: HTMLCanvasElement;
  ctaUrl?: string;
  maxDuration?: number;
}
