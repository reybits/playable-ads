import { context } from 'esbuild';
import { mkdirSync, copyFileSync } from 'fs';
import { resolve } from 'path';
import { getBuildOptions } from '../esbuild.config.js';

const args = process.argv.slice(2);
const gameIdx = args.indexOf('--game');
const gameName = gameIdx >= 0 ? args[gameIdx + 1] : 'worm-hunt';
const entryPoint = `ads/${gameName}/game.ts`;
const devDir = `dist/${gameName}/dev`;

async function main() {
  mkdirSync(devDir, { recursive: true });

  const opts = getBuildOptions('google', entryPoint, devDir);
  opts.minify = false;
  opts.sourcemap = true;
  opts.define = { AD_NETWORK: JSON.stringify('google') };

  copyFileSync(resolve('templates/google.html'), resolve(devDir, 'index.html'));

  const ctx = await context(opts);
  const { host, port } = await ctx.serve({
    servedir: devDir,
    port: 8080,
  });

  console.log(`\n  Dev server running at http://localhost:${port} (${gameName})`);
  console.log('  Press Ctrl+C to stop\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
