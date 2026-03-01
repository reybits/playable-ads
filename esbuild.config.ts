import type { BuildOptions } from 'esbuild';

type Network = 'google' | 'mraid' | 'facebook';

export function getBuildOptions(
  network: Network,
  entryPoint = 'ads/worm-hunt/game.ts',
  outDir = 'dist',
): BuildOptions {
  const common: BuildOptions = {
    entryPoints: [entryPoint],
    bundle: true,
    minify: true,
    target: 'es2020',
    define: {
      AD_NETWORK: JSON.stringify(network),
    },
  };

  if (network === 'google') {
    return {
      ...common,
      outfile: `${outDir}/game.js`,
      format: 'esm',
      loader: {
        '.png': 'dataurl',
        '.jpg': 'dataurl',
        '.mp3': 'dataurl',
        '.ogg': 'dataurl',
      },
    };
  }

  // MRAID and Facebook: inline everything
  return {
    ...common,
    outfile: `${outDir}/game.js`,
    format: 'iife',
    loader: {
      '.png': 'dataurl',
      '.jpg': 'dataurl',
      '.mp3': 'dataurl',
      '.ogg': 'dataurl',
    },
  };
}
