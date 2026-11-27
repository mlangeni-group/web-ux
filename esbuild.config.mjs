import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const rootDir = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(rootDir, 'dist');
const entryPoint = resolve(rootDir, 'index.js');
const shared = {
  entryPoints: [entryPoint],
  bundle: true,
  minify: true,
  platform: 'browser',
  target: ['es2020'],
  legalComments: 'none',
};

await mkdir(outDir, { recursive: true });

await Promise.all([
  build({
    ...shared,
    outfile: resolve(outDir, 'web-ux.mjs'),
    format: 'esm',
    external: ['bootstrap', 'jquery'],
  }),
  build({
    ...shared,
    outfile: resolve(outDir, 'web-ux.cjs'),
    format: 'cjs',
    external: ['bootstrap', 'jquery'],
  }),
  build({
    ...shared,
    outfile: resolve(outDir, 'web-ux.js'),
    format: 'iife',
    globalName: 'webux',
  }),
]);

console.log(`Built ESM, CommonJS, and browser bundles in ${outDir}`);
