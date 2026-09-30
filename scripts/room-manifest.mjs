import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, 'assets/room/.vite/manifest.json'), 'utf8'));
const entry = Object.values(manifest).find(item => item.isEntry);
if (!entry?.file) throw new Error('Vite did not produce a room entry.');
const entryCode = await readFile(path.join(root, 'assets/room', entry.file), 'utf8');
if (!entryCode.includes('mountRoom')) throw new Error('Room entry export was removed by the bundler.');
const styles = [...new Set(Object.values(manifest).flatMap(item => [ ...(item.css || []), ...(item.file.endsWith('.css') ? [item.file] : []) ]))];
for (const file of [entry.file, ...styles]) {
  if (file.includes('..') || path.isAbsolute(file)) throw new Error('Invalid manifest path');
  await access(path.join(root, 'assets/room', file));
}
await mkdir(path.join(root, '_data'), { recursive: true });
await writeFile(path.join(root, '_data/room_assets.json'), JSON.stringify({
  js: `/assets/room/${entry.file}`, css: styles.map(file => `/assets/room/${file}`)
}, null, 2) + '\n');
console.log('Room asset manifest written.');
