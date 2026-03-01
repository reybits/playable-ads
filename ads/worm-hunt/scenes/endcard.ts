import type { Engine, Atlas, Scene } from '../../../src/engine/index.js';
import { triggerCta } from '../../../src/engine/cta.js';
import { Ease } from '../../../src/engine/tween.js';

export function createEndcardScene(engine: Engine, atlas: Atlas): Scene {
  let timer = 0;
  const anim = { iconScale: 0, buttonAlpha: 0, buttonScale: 1 };

  return {
    enter() {
      timer = 0;
      anim.iconScale = 0;
      anim.buttonAlpha = 0;
      anim.buttonScale = 1;

      engine.tweens.add(anim, { iconScale: 1 }, 0.5, {
        easing: Ease.outBack,
      });

      engine.tweens.add(anim, { buttonAlpha: 1 }, 0.4, {
        delay: 0.4,
        easing: Ease.outQuad,
      });
    },

    update(dt: number) {
      timer += dt;
      anim.buttonScale = 1 + Math.sin(timer * 3) * 0.05;

      if (engine.input.pointer.justPressed) {
        triggerCta();
      }
    },

    draw(ctx: CanvasRenderingContext2D) {
      const w = engine.width, h = engine.height;
      engine.renderer.clear('#0f3460');

      // App icon
      atlas.draw(ctx, 'icon', w * 0.5, h * 0.3, {
        scaleX: 1.5 * anim.iconScale,
        scaleY: 1.5 * anim.iconScale,
      });

      // Title
      engine.renderer.drawText('WORM HUNT', w * 0.5, h * 0.48, {
        font: `bold ${Math.round(w * 0.08)}px sans-serif`,
        color: '#FFC70A',
        stroke: '#000',
        strokeWidth: 3,
      });

      // Subtitle
      engine.renderer.drawText('Become the biggest worm!', w * 0.5, h * 0.55, {
        font: `${Math.round(w * 0.04)}px sans-serif`,
        color: '#aaa',
      });

      // Download button
      engine.renderer.save();
      engine.renderer.setAlpha(anim.buttonAlpha);
      engine.renderer.translate(w * 0.5, h * 0.7);
      engine.renderer.scale(anim.buttonScale, anim.buttonScale);
      const btnW = w * 0.55;
      const btnH = h * 0.08;
      engine.renderer.fillRoundRect(-btnW / 2, -btnH / 2, btnW, btnH, btnH / 2, '#4CAF50');
      engine.renderer.drawText('DOWNLOAD', 0, 0, {
        font: `bold ${Math.round(w * 0.055)}px sans-serif`,
        color: '#fff',
      });
      engine.renderer.restore();

      // FREE label
      engine.renderer.drawText('FREE', w * 0.5, h * 0.7 + btnH / 2 + 18, {
        font: `${Math.round(w * 0.035)}px sans-serif`,
        color: '#888',
      });
    },
  };
}
