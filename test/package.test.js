import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('package entry points are generated and the package has no self-dependency', async () => {
  const manifest = JSON.parse(await readFile(resolve(packageRoot, 'package.json'), 'utf8'));
  assert.equal(manifest.dependencies?.[manifest.name], undefined);
  assert.equal(manifest.exports['.'].types, './lib/types.d.ts');

  for (const entry of [
    manifest.exports['.'].import,
    manifest.exports['.'].require,
    manifest.exports['.'].browser,
    manifest.exports['./browser'],
    manifest.exports['.'].types,
  ]) {
    await access(resolve(packageRoot, entry));
  }
});
