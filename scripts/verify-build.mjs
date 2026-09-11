import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, resolve, relative, isAbsolute } from 'node:path';
import assert from 'node:assert/strict';

import { CHARACTER_ASSETS } from '../app/game/characters.js';
const root = resolve('dist');
let checked = 0;
async function checkReference(file, reference) {
  if (/^(data:|https?:|#)/.test(reference)) return;
  assert.ok(!reference.startsWith('/'), `Root-relative URL breaks repository Pages: ${reference}`);
  const target = resolve(dirname(file), reference.split(/[?#]/)[0]);
  const offset = relative(root, target);
  assert.ok(!offset.startsWith('..') && !isAbsolute(offset), `Asset escapes build: ${reference}`);
  assert.ok((await stat(target)).isFile(), `Missing asset: ${target}`);
  checked++;
}
const html = await readFile(resolve(root, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  await checkReference(resolve(root, 'index.html'), match[1]);
}
for (const name of await readdir(resolve(root, 'assets'))) {
  if (!name.endsWith('.css')) continue;
  const file = resolve(root, 'assets', name);
  const css = await readFile(file, 'utf8');
  for (const match of css.matchAll(/url\(["']?([^\s"')]+)["']?\)/g)) await checkReference(file, match[1]);
}
for (const path of Object.values(CHARACTER_ASSETS)) await checkReference(resolve(root, 'index.html'), path);
for (const path of ['art/operators-v15.png', 'art/asphalt-v15.png', 'art/seoul-v15.png']) await checkReference(resolve(root, 'index.html'), path);
await checkReference(resolve(root, 'index.html'), 'models/LICENSE-Kenney.txt');
console.log(`Static build verified: ${checked} relative asset references; GitHub Pages subpaths supported.`);
