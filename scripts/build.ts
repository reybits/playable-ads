import { build } from 'esbuild';
import { mkdirSync, copyFileSync, rmSync } from 'fs';
import { resolve } from 'path';
import { getBuildOptions } from '../esbuild.config.js';
import { inlineHtml } from './inline-html.js';
import { createZip } from './zip.js';

type Network = 'google' | 'mraid' | 'facebook';
const NETWORKS: Network[] = ['google', 'mraid', 'facebook'];

const args = process.argv.slice(2);
const allFlag = args.includes('--all');
const networkIdx = args.indexOf('--network');
const selectedNetwork = networkIdx >= 0 ? (args[networkIdx + 1] as Network) : null;
const gameIdx = args.indexOf('--game');
const gameName = gameIdx >= 0 ? args[gameIdx + 1] : 'worm-hunt';
const entryPoint = `ads/${gameName}/game.ts`;
const gameDir = resolve(`dist/${gameName}`);

const targets: Network[] = allFlag
  ? NETWORKS
  : selectedNetwork
    ? [selectedNetwork]
    : ['google'];

async function buildNetwork(network: Network) {
  console.log(`\n  Building for ${network}...`);

  if (network === 'google') {
    // Build into a temp dir, then zip
    const googleDir = resolve(gameDir, '_google');
    mkdirSync(googleDir, { recursive: true });

    const opts = getBuildOptions(network, entryPoint, googleDir);
    await build(opts);

    copyFileSync(
      resolve('templates/google.html'),
      resolve(googleDir, 'index.html'),
    );

    const zipName = `${gameName}-google.zip`;
    const zipPath = resolve(gameDir, zipName);
    await createZip(googleDir, zipPath);
    rmSync(googleDir, { recursive: true });
    console.log(`  -> dist/${gameName}/${zipName}`);
  } else {
    // MRAID / Facebook: build into dist/{game}/{network}/
    const networkDir = resolve(gameDir, network);
    mkdirSync(networkDir, { recursive: true });

    const opts = getBuildOptions(network, entryPoint, networkDir);
    await build(opts);

    const templateFile = network === 'mraid' ? 'mraid.html' : 'facebook.html';
    const jsPath = resolve(networkDir, 'game.js');
    inlineHtml(
      resolve(`templates/${templateFile}`),
      jsPath,
      resolve(networkDir, 'index.html'),
    );
    rmSync(jsPath);
    console.log(`  -> dist/${gameName}/${network}/index.html`);
  }
}

async function main() {
  console.log('Playable Ads Build');
  mkdirSync(gameDir, { recursive: true });
  for (const network of targets) {
    await buildNetwork(network);
  }
  console.log('\nDone!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
