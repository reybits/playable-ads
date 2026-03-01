import type { Engine, Atlas, Scene } from '../../../src/engine/index.js';
import { rand } from '../../../src/engine/math.js';
import { createWorm, updateWorm, drawWorm } from '../worm.js';

export function createTutorialScene(engine: Engine, atlas: Atlas): Scene {
  let timer = 0;

  // Decorative food pellets (placed relative to initial size, re-scattered on enter)
  let foods: { x: number; y: number; frame: string }[] = [];

  // Auto-circling preview worm
  let worm = createWorm({
    x: engine.width / 2,
    y: engine.height / 2,
    dir: 0,
    speed: 60,
    segmentCount: 8,
    headFrame: 'head_happy',
    bodyFrame: 'body_happy',
  });

  let circleAngle = 0;

  return {
    enter() {
      timer = 0;
      circleAngle = 0;
      const w = engine.width, h = engine.height;
      foods = [];
      for (let i = 0; i < 15; i++) {
        foods.push({
          x: rand(30, w - 30),
          y: rand(30, h - 30),
          frame: `food_${Math.floor(rand(0, 4))}`,
        });
      }
      worm = createWorm({
        x: w / 2,
        y: h / 2,
        dir: 0,
        speed: 60,
        segmentCount: 8,
        headFrame: 'head_happy',
        bodyFrame: 'body_happy',
      });
    },

    update(dt: number) {
      timer += dt;
      circleAngle += dt * 0.8;
      updateWorm(worm, dt, circleAngle);

      if (timer > 3 || engine.input.pointer.justPressed) {
        engine.scenes.go('gameplay');
      }
    },

    draw(ctx: CanvasRenderingContext2D) {
      const w = engine.width, h = engine.height;
      engine.renderer.clear('#16213e');

      for (const f of foods) {
        atlas.draw(ctx, f.frame, f.x, f.y, { scaleX: 0.6, scaleY: 0.6, alpha: 0.4 });
      }

      drawWorm(worm, atlas, ctx, 0, 0);

      // Dark overlay
      engine.renderer.save();
      engine.renderer.setAlpha(0.5);
      engine.renderer.fillRect(0, 0, w, h, '#000');
      engine.renderer.restore();

      // Title
      engine.renderer.drawText('WORM HUNT', w * 0.5, h * 0.15, {
        font: `bold ${Math.round(w * 0.1)}px sans-serif`,
        color: '#FFC70A',
        stroke: '#000',
        strokeWidth: 4,
      });

      // Swipe instruction
      const alpha = 0.5 + Math.sin(timer * 4) * 0.5;
      engine.renderer.save();
      engine.renderer.setAlpha(alpha);
      engine.renderer.drawText('SWIPE TO MOVE', w * 0.5, h * 0.55, {
        font: `bold ${Math.round(w * 0.065)}px sans-serif`,
        color: '#fff',
      });
      engine.renderer.restore();

      // Animated hand doing swipe motion
      const handX = w * 0.5 + Math.sin(timer * 2.5) * 40;
      const handY = h * 0.68;
      engine.renderer.fillCircle(handX, handY, 16, 'rgba(255,255,255,0.7)');
      engine.renderer.fillCircle(handX, handY, 8, 'rgba(255,255,255,0.9)');
    },
  };
}
