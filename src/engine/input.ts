import type { PointerData, Rect } from '../types.js';
import { pointInRect } from './math.js';

export interface Input {
  pointer: PointerData;
  hasInteracted: boolean;
  hitTest(r: Rect): boolean;
  update(): void;
  destroy(): void;
}

export function createInput(
  canvas: HTMLCanvasElement,
): Input {
  let rawX = 0;
  let rawY = 0;
  let isDown = false;
  let wasDown = false;
  let hasInteracted = false;

  const pointer: PointerData = {
    x: 0,
    y: 0,
    isDown: false,
    justPressed: false,
    justReleased: false,
  };

  function toLogical(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    rawX = (clientX - rect.left) * scaleX;
    rawY = (clientY - rect.top) * scaleY;
  }

  function onPointerDown(e: PointerEvent) {
    e.preventDefault();
    isDown = true;
    hasInteracted = true;
    toLogical(e.clientX, e.clientY);
  }

  function onPointerMove(e: PointerEvent) {
    e.preventDefault();
    toLogical(e.clientX, e.clientY);
  }

  function onPointerUp(e: PointerEvent) {
    e.preventDefault();
    isDown = false;
    toLogical(e.clientX, e.clientY);
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  // Prevent context menu on long press
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  return {
    pointer,

    get hasInteracted() {
      return hasInteracted;
    },

    hitTest(r: Rect): boolean {
      return pointer.justPressed && pointInRect(pointer.x, pointer.y, r);
    },

    update() {
      pointer.x = rawX;
      pointer.y = rawY;
      pointer.justPressed = isDown && !wasDown;
      pointer.justReleased = !isDown && wasDown;
      pointer.isDown = isDown;
      wasDown = isDown;
    },

    destroy() {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    },
  };
}
