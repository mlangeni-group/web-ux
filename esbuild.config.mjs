import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const rootDir = dirname(fileURLToPath(import.meta.url));
const outfile = resolve(rootDir, 'dist/web-ux.js');

await mkdir(dirname(outfile), { recursive: true });

await build({
  entryPoints: [resolve(rootDir, 'index.js')],
  outfile,
  bundle: true,
  minify: true,
  format: 'iife',
  globalName: 'webux',
  platform: 'browser',
  target: ['es2020'],
  external: ['jsonwebtoken'],
  legalComments: 'none',
});

console.log(`Built ${outfile}`);
