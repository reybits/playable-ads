import type { Engine, Atlas, Scene } from '../../../src/engine/index.js';
import { clamp, rand, dist } from '../../../src/engine/math.js';
import { createWorm, updateWorm, drawWorm, getHeadPos, getBodySegments, type Worm } from '../worm.js';

const FOOD_COUNT = 25;
const FOOD_RADIUS = 300;
const HEAD_RADIUS = 20;
const BODY_RADIUS = 16;
const FOOD_HIT_RADIUS = 18;
const WIN_WEIGHT = 20;
const FOOD_NAMES = ['food_0', 'food_1', 'food_2', 'food_3'];
const AI_RESPAWN_DELAY = 2;
const GRID_SPACING = 60;
const GRID_COLOR = 'rgba(255,255,255,0.06)';

interface Food {
  x: number;
  y: number;
  frame: string;
}

interface AIBot {
  worm: Worm;
  targetX: number;
  targetY: number;
  alive: boolean;
  respawnTimer: number;
}

export function createGameplayScene(engine: Engine, atlas: Atlas): Scene {
  let player: Worm;
  let foods: Food[] = [];
  let bots: AIBot[] = [];
  let weight: number;
  let cameraX: number;
  let cameraY: number;
  let gameOver: boolean;

  function spawnFood(nearX: number, nearY: number): Food {
    const angle = rand(0, Math.PI * 2);
    const r = rand(50, FOOD_RADIUS);
    return {
      x: nearX + Math.cos(angle) * r,
      y: nearY + Math.sin(angle) * r,
      frame: FOOD_NAMES[Math.floor(rand(0, 4))],
    };
  }

  function spawnFoodAt(x: number, y: number): Food {
    return {
      x: x + rand(-20, 20),
      y: y + rand(-20, 20),
      frame: FOOD_NAMES[Math.floor(rand(0, 4))],
    };
  }

  function createBot(headFrame: string, bodyFrame: string): AIBot {
    const head = getHeadPos(player);
    const angle = rand(0, Math.PI * 2);
    const r = rand(200, 400);
    const worm = createWorm({
      x: head.x + Math.cos(angle) * r,
      y: head.y + Math.sin(angle) * r,
      dir: rand(0, Math.PI * 2),
      speed: 55,
      segmentCount: 6,
      headFrame,
      bodyFrame,
    });
    return {
      worm,
      targetX: worm.path[0].x + rand(-200, 200),
      targetY: worm.path[0].y + rand(-200, 200),
      alive: true,
      respawnTimer: 0,
    };
  }

  function resetBot(bot: AIBot) {
    const head = getHeadPos(player);
    const angle = rand(0, Math.PI * 2);
    const r = rand(250, 450);
    const newX = head.x + Math.cos(angle) * r;
    const newY = head.y + Math.sin(angle) * r;
    bot.worm = createWorm({
      x: newX,
      y: newY,
      dir: rand(0, Math.PI * 2),
      speed: 55,
      segmentCount: 6,
      headFrame: bot.worm.headFrame,
      bodyFrame: bot.worm.bodyFrame,
    });
    bot.targetX = newX + rand(-200, 200);
    bot.targetY = newY + rand(-200, 200);
    bot.alive = true;
  }

  return {
    enter() {
      weight = 5;
      gameOver = false;

      player = createWorm({
        x: 0,
        y: 0,
        dir: -Math.PI / 2,
        speed: 70,
        segmentCount: 5,
        headFrame: 'head_happy',
        bodyFrame: 'body_happy',
      });

      // Spawn food around player
      foods = [];
      for (let i = 0; i < FOOD_COUNT; i++) {
        foods.push(spawnFood(0, 0));
      }

      // Create AI bots
      bots = [
        createBot('head_dopey', 'body_dopey'),
        createBot('head_pinkie', 'body_pinkie'),
      ];
    },

    update(dt: number) {
      if (gameOver) return;

      // --- Player input ---
      const w = engine.width, h = engine.height;
      const pointer = engine.input.pointer;
      if (pointer.isDown) {
        const head = getHeadPos(player);
        // Pointer angle from worm head in screen space
        const px = pointer.x - w / 2;
        const py = pointer.y - h / 2;
        const targetDir = Math.atan2(py, px);
        updateWorm(player, dt, targetDir);
      } else {
        updateWorm(player, dt);
      }

      // --- Camera ---
      const head = getHeadPos(player);
      cameraX = head.x - w / 2;
      cameraY = head.y - h / 2;

      // --- Food collision (player) ---
      for (let i = foods.length - 1; i >= 0; i--) {
        const f = foods[i];
        if (dist(head.x, head.y, f.x, f.y) < FOOD_HIT_RADIUS + HEAD_RADIUS) {
          foods.splice(i, 1);
          weight++;
          player.segmentCount++;
          // Respawn food nearby
          foods.push(spawnFood(head.x, head.y));
        }
      }

      // --- AI update ---
      for (const bot of bots) {
        if (!bot.alive) {
          bot.respawnTimer -= dt;
          if (bot.respawnTimer <= 0) {
            resetBot(bot);
          }
          continue;
        }

        // Wander toward target
        const bHead = getHeadPos(bot.worm);
        const distToTarget = dist(bHead.x, bHead.y, bot.targetX, bot.targetY);
        if (distToTarget < 30) {
          // Pick new random target
          bot.targetX = bHead.x + rand(-250, 250);
          bot.targetY = bHead.y + rand(-250, 250);
        }
        const targetDir = Math.atan2(bot.targetY - bHead.y, bot.targetX - bHead.x);
        updateWorm(bot.worm, dt, targetDir);

        // AI eats food
        for (let i = foods.length - 1; i >= 0; i--) {
          const f = foods[i];
          if (dist(bHead.x, bHead.y, f.x, f.y) < FOOD_HIT_RADIUS + HEAD_RADIUS) {
            foods.splice(i, 1);
            bot.worm.segmentCount++;
            foods.push(spawnFood(bHead.x, bHead.y));
          }
        }

        // --- Collision: player head vs AI body ---
        const aiBodySegs = getBodySegments(bot.worm);
        for (const seg of aiBodySegs) {
          if (dist(head.x, head.y, seg.x, seg.y) < HEAD_RADIUS + BODY_RADIUS) {
            // Player dies
            gameOver = true;
            engine.scenes.go('endcard');
            return;
          }
        }

        // --- Collision: AI head vs player body ---
        const playerBodySegs = getBodySegments(player);
        for (const seg of playerBodySegs) {
          if (dist(bHead.x, bHead.y, seg.x, seg.y) < HEAD_RADIUS + BODY_RADIUS) {
            // AI dies, drop food
            bot.alive = false;
            bot.respawnTimer = AI_RESPAWN_DELAY;
            for (let j = 0; j < 5; j++) {
              foods.push(spawnFoodAt(bHead.x, bHead.y));
            }
            break;
          }
        }
      }

      // --- Win condition ---
      if (weight >= WIN_WEIGHT) {
        gameOver = true;
        engine.scenes.go('endcard');
        return;
      }

      // --- Timeout ---
      if (engine.isExpired) {
        gameOver = true;
        engine.scenes.go('endcard');
      }
    },

    draw(ctx: CanvasRenderingContext2D) {
      const w = engine.width, h = engine.height;
      engine.renderer.clear('#2855a0');

      // --- Grid lines ---
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;
      const startX = Math.floor(cameraX / GRID_SPACING) * GRID_SPACING;
      const startY = Math.floor(cameraY / GRID_SPACING) * GRID_SPACING;
      for (let gx = startX; gx < cameraX + w + GRID_SPACING; gx += GRID_SPACING) {
        const sx = gx - cameraX;
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, h);
        ctx.stroke();
      }
      for (let gy = startY; gy < cameraY + h + GRID_SPACING; gy += GRID_SPACING) {
        const sy = gy - cameraY;
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(w, sy);
        ctx.stroke();
      }

      // --- Food ---
      for (const f of foods) {
        const sx = f.x - cameraX;
        const sy = f.y - cameraY;
        if (sx < -30 || sx > w + 30 || sy < -30 || sy > h + 30) continue;
        atlas.draw(ctx, f.frame, sx, sy, { scaleX: 0.6, scaleY: 0.6 });
      }

      // --- AI worms ---
      for (const bot of bots) {
        if (!bot.alive) continue;
        drawWorm(bot.worm, atlas, ctx, cameraX, cameraY);
      }

      // --- Player ---
      drawWorm(player, atlas, ctx, cameraX, cameraY);

      // --- HUD ---
      engine.renderer.drawText(`${weight}g`, w * 0.5, h * 0.06, {
        font: `bold ${Math.round(w * 0.06)}px sans-serif`,
        color: '#FFC70A',
        stroke: '#000',
        strokeWidth: 3,
      });

      const remaining = Math.max(0, Math.ceil(engine.maxDuration - engine.elapsed));
      engine.renderer.drawText(`${remaining}s`, w - 15, h * 0.06, {
        font: `${Math.round(w * 0.04)}px sans-serif`,
        color: remaining <= 5 ? '#ff4444' : '#ffffff',
        align: 'right',
      });
    },
  };
}
