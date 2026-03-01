import type { Rect } from '../types.js';

export interface Renderer {
  ctx: CanvasRenderingContext2D;
  clear(color?: string): void;
  drawImage(
    img: HTMLImageElement,
    dx: number,
    dy: number,
    dw?: number,
    dh?: number,
    src?: Rect,
  ): void;
  drawText(
    text: string,
    x: number,
    y: number,
    opts?: TextOpts,
  ): void;
  fillRect(x: number, y: number, w: number, h: number, color: string): void;
  fillRoundRect(
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    color: string,
  ): void;
  fillCircle(x: number, y: number, radius: number, color: string): void;
  setAlpha(a: number): void;
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  rotate(rad: number): void;
  scale(sx: number, sy: number): void;
}

export interface TextOpts {
  font?: string;
  color?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  maxWidth?: number;
  stroke?: string;
  strokeWidth?: number;
}

export function createRenderer(
  canvas: HTMLCanvasElement,
): Renderer {
  const ctx = canvas.getContext('2d')!;

  return {
    ctx,

    clear(color?: string) {
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    },

    drawImage(
      img: HTMLImageElement,
      dx: number,
      dy: number,
      dw?: number,
      dh?: number,
      src?: Rect,
    ) {
      if (src) {
        ctx.drawImage(
          img,
          src.x,
          src.y,
          src.w,
          src.h,
          dx,
          dy,
          dw ?? src.w,
          dh ?? src.h,
        );
      } else if (dw !== undefined && dh !== undefined) {
        ctx.drawImage(img, dx, dy, dw, dh);
      } else {
        ctx.drawImage(img, dx, dy);
      }
    },

    drawText(
      text: string,
      x: number,
      y: number,
      opts: TextOpts = {},
    ) {
      ctx.font = opts.font ?? '24px sans-serif';
      ctx.fillStyle = opts.color ?? '#fff';
      ctx.textAlign = opts.align ?? 'center';
      ctx.textBaseline = opts.baseline ?? 'middle';
      if (opts.stroke) {
        ctx.strokeStyle = opts.stroke;
        ctx.lineWidth = opts.strokeWidth ?? 2;
        ctx.strokeText(text, x, y, opts.maxWidth);
      }
      ctx.fillText(text, x, y, opts.maxWidth);
    },

    fillRect(x: number, y: number, w: number, h: number, color: string) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    },

    fillRoundRect(
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
      color: string,
    ) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
    },

    fillCircle(x: number, y: number, radius: number, color: string) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    },

    setAlpha(a: number) {
      ctx.globalAlpha = a;
    },

    save() {
      ctx.save();
    },

    restore() {
      ctx.restore();
    },

    translate(x: number, y: number) {
      ctx.translate(x, y);
    },

    rotate(rad: number) {
      ctx.rotate(rad);
    },

    scale(sx: number, sy: number) {
      ctx.scale(sx, sy);
    },
  };
}
