import type { AtlasData, AtlasFrame } from '../types.js';

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Ensure the image is fully decoded before resolving
      if (typeof img.decode === 'function') {
        img.decode().then(() => resolve(img), () => resolve(img));
      } else {
        resolve(img);
      }
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export interface Atlas {
  image: HTMLImageElement;
  frames: Map<string, AtlasFrame>;
  draw(
    ctx: CanvasRenderingContext2D,
    name: string,
    x: number,
    y: number,
    opts?: DrawOpts,
  ): void;
}

export interface DrawOpts {
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  anchorX?: number;
  anchorY?: number;
  alpha?: number;
}

export function createAtlas(
  image: HTMLImageElement,
  data: AtlasData,
): Atlas {
  const frames = new Map<string, AtlasFrame>();
  for (const [name, frame] of Object.entries(data.frames)) {
    frames.set(name, frame);
  }

  return {
    image,
    frames,

    draw(
      ctx: CanvasRenderingContext2D,
      name: string,
      x: number,
      y: number,
      opts: DrawOpts = {},
    ) {
      const frame = frames.get(name);
      if (!frame) return;

      const sx = opts.scaleX ?? 1;
      const sy = opts.scaleY ?? 1;
      const ax = opts.anchorX ?? frame.anchorX ?? 0.5;
      const ay = opts.anchorY ?? frame.anchorY ?? 0.5;

      ctx.save();
      if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
      ctx.translate(x, y);
      if (opts.rotation) ctx.rotate(opts.rotation);
      ctx.scale(sx, sy);
      ctx.drawImage(
        image,
        frame.x,
        frame.y,
        frame.w,
        frame.h,
        -frame.w * ax,
        -frame.h * ay,
        frame.w,
        frame.h,
      );
      ctx.restore();
    },
  };
}
