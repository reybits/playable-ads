import type { Atlas } from '../../src/engine/index.js';

const SEGMENT_SPACING = 12;
const TURN_SPEED = 5; // radians/sec

export interface Worm {
  path: { x: number; y: number }[];
  dir: number;
  speed: number;
  segmentCount: number;
  headFrame: string;
  bodyFrame: string;
  phase: number;
}

export function createWorm(opts: {
  x: number;
  y: number;
  dir: number;
  speed: number;
  segmentCount: number;
  headFrame: string;
  bodyFrame: string;
}): Worm {
  const path: { x: number; y: number }[] = [];
  // Initialize path behind the head along the opposite direction
  for (let i = 0; i < opts.segmentCount + 10; i++) {
    path.push({
      x: opts.x - Math.cos(opts.dir) * i * SEGMENT_SPACING,
      y: opts.y - Math.sin(opts.dir) * i * SEGMENT_SPACING,
    });
  }
  return {
    path,
    dir: opts.dir,
    speed: opts.speed,
    segmentCount: opts.segmentCount,
    headFrame: opts.headFrame,
    bodyFrame: opts.bodyFrame,
    phase: Math.random() * Math.PI * 2,
  };
}

export function updateWorm(worm: Worm, dt: number, targetDir?: number): void {
  // Smooth rotation toward target direction
  if (targetDir !== undefined) {
    let diff = targetDir - worm.dir;
    // Normalize to [-PI, PI]
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const maxTurn = TURN_SPEED * dt;
    if (Math.abs(diff) < maxTurn) {
      worm.dir = targetDir;
    } else {
      worm.dir += Math.sign(diff) * maxTurn;
    }
  }

  // Move head forward
  const dx = Math.cos(worm.dir) * worm.speed * dt;
  const dy = Math.sin(worm.dir) * worm.speed * dt;
  const head = worm.path[0];
  worm.path.unshift({ x: head.x + dx, y: head.y + dy });

  // Keep path long enough for all segments
  const needed = worm.segmentCount * SEGMENT_SPACING + SEGMENT_SPACING;
  while (worm.path.length > Math.ceil(needed / 2) + worm.segmentCount + 5) {
    worm.path.pop();
  }

  // Advance phase for pulsing
  worm.phase += dt * 3;
}

/** Get position along the path at a given distance from head */
function getPathPosition(path: { x: number; y: number }[], distance: number): { x: number; y: number } {
  let remaining = distance;
  for (let i = 0; i < path.length - 1; i++) {
    const ax = path[i].x, ay = path[i].y;
    const bx = path[i + 1].x, by = path[i + 1].y;
    const segDx = bx - ax, segDy = by - ay;
    const segLen = Math.sqrt(segDx * segDx + segDy * segDy);
    if (segLen < 0.001) continue;
    if (remaining <= segLen) {
      const t = remaining / segLen;
      return { x: ax + segDx * t, y: ay + segDy * t };
    }
    remaining -= segLen;
  }
  // Past end of path — return last point
  return path[path.length - 1];
}

export function drawWorm(
  worm: Worm,
  atlas: Atlas,
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  cameraY: number,
): void {
  // Collect segment positions (back-to-front draw order)
  const segments: { x: number; y: number; scale: number; isHead: boolean }[] = [];

  for (let i = worm.segmentCount - 1; i >= 0; i--) {
    const dist = i * SEGMENT_SPACING;
    const pos = getPathPosition(worm.path, dist);
    const pulse = 0.95 + 0.08 * Math.sin(worm.phase + i * Math.PI / 8);
    segments.push({ x: pos.x, y: pos.y, scale: pulse, isHead: i === 0 });
  }

  // Draw body segments then head
  for (const seg of segments) {
    const sx = seg.x - cameraX;
    const sy = seg.y - cameraY;

    if (seg.isHead) {
      atlas.draw(ctx, worm.headFrame, sx, sy, {
        scaleX: seg.scale,
        scaleY: seg.scale,
        rotation: worm.dir,
      });
    } else {
      atlas.draw(ctx, worm.bodyFrame, sx, sy, {
        scaleX: seg.scale,
        scaleY: seg.scale,
      });
    }
  }
}

/** Get world-space head position */
export function getHeadPos(worm: Worm): { x: number; y: number } {
  return worm.path[0];
}

/** Get world-space positions of all body segments (index 1+) */
export function getBodySegments(worm: Worm): { x: number; y: number }[] {
  const result: { x: number; y: number }[] = [];
  for (let i = 1; i < worm.segmentCount; i++) {
    result.push(getPathPosition(worm.path, i * SEGMENT_SPACING));
  }
  return result;
}
