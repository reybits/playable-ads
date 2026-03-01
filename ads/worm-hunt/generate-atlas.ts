// Run with: npx tsx ads/worm-hunt/generate-atlas.ts
// Loads Worm Hunt source PNGs, downscales, packs into a single atlas

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPRITES_DIR = resolve(__dirname, 'sprites');

interface SpriteEntry {
  name: string;
  src: string;
  w: number;
  h: number;
}

const sprites: SpriteEntry[] = [
  { name: 'head_happy', src: 'heads/happy.png', w: 48, h: 48 },
  { name: 'body_happy', src: 'bodies/happy.png', w: 40, h: 40 },
  { name: 'head_dopey', src: 'heads/dopey.png', w: 48, h: 48 },
  { name: 'body_dopey', src: 'bodies/dopey.png', w: 40, h: 40 },
  { name: 'head_pinkie', src: 'heads/pinkie.png', w: 48, h: 48 },
  { name: 'body_pinkie', src: 'bodies/pinkie.png', w: 40, h: 40 },
  { name: 'food_0', src: 'food/00.png', w: 28, h: 28 },
  { name: 'food_1', src: 'food/01.png', w: 28, h: 28 },
  { name: 'food_2', src: 'food/02.png', w: 28, h: 28 },
  { name: 'food_3', src: 'food/03.png', w: 28, h: 28 },
  { name: 'icon', src: 'icon-512.png', w: 80, h: 80 },
];

async function main() {
  // Load and resize all sprites
  const buffers: { name: string; buf: Buffer; w: number; h: number }[] = [];
  for (const sprite of sprites) {
    const srcPath = resolve(SPRITES_DIR, sprite.src);
    const buf = await sharp(srcPath)
      .resize(sprite.w, sprite.h, { fit: 'fill' })
      .png()
      .toBuffer();
    buffers.push({ name: sprite.name, buf, w: sprite.w, h: sprite.h });
  }

  // Simple row packing: place sprites left-to-right, wrap to next row
  const MAX_WIDTH = 256;
  let curX = 0;
  let curY = 0;
  let rowHeight = 0;
  const placements: { name: string; x: number; y: number; w: number; h: number; buf: Buffer }[] = [];

  for (const item of buffers) {
    if (curX + item.w > MAX_WIDTH) {
      curX = 0;
      curY += rowHeight;
      rowHeight = 0;
    }
    placements.push({ name: item.name, x: curX, y: curY, w: item.w, h: item.h, buf: item.buf });
    curX += item.w;
    rowHeight = Math.max(rowHeight, item.h);
  }

  const atlasWidth = MAX_WIDTH;
  const atlasHeight = curY + rowHeight;

  // Composite all sprites onto the atlas
  const composites = placements.map((p) => ({
    input: p.buf,
    left: p.x,
    top: p.y,
  }));

  const atlasPng = await sharp({
    create: {
      width: atlasWidth,
      height: atlasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();

  // Build atlas JSON
  const frames: Record<string, { x: number; y: number; w: number; h: number }> = {};
  for (const p of placements) {
    frames[p.name] = { x: p.x, y: p.y, w: p.w, h: p.h };
  }

  const outDir = resolve('ads/worm-hunt/assets');
  writeFileSync(resolve(outDir, 'atlas.png'), atlasPng);
  writeFileSync(resolve(outDir, 'atlas.json'), JSON.stringify({ frames }, null, 2));

  console.log(`Atlas generated: ${atlasWidth}x${atlasHeight} (${atlasPng.length} bytes)`);
  console.log(`Frames: ${Object.keys(frames).join(', ')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
