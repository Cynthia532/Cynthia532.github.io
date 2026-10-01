import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url));
const base = process.argv[2] || '';
const html = await readFile(path.join(root, '_site/room/index.html'), 'utf8');
assert(!html.includes('{%') && !html.includes('{{'), 'Unrendered Liquid in room page');
for (const [lang, name] of [['en', 'Zhixin Zhu'], ['zh', '朱祉昕']]) {
  const content = html.match(new RegExp(`<template id="resume-${lang}">([\\s\\S]*?)</template>`))?.[1];
  assert(content?.includes(name), `Missing ${lang} resume content`);
  assert(!/<(?:html|head|body)(?:\s|>)/i.test(content), 'Resume template contains a complete layout');
}
const config = JSON.parse(html.match(/<script id="room-config" type="application\/json">([\s\S]*?)<\/script>/)[1]);
assert(typeof config.js === 'string' && config.js, 'Room JS is missing: build the room before running Jekyll.');
assert(config.css.length > 0, 'Room styles are missing');
assert(config.js.startsWith(`${base}/assets/room/`), 'Incorrect room base URL');
assert.equal(config.homeEntry, false, 'The room must not redirect back to itself');
for (const url of [config.js, ...config.css, config.pdf]) {
  const relative = url.slice(base.length).replace(/^\//, '');
  await access(path.join(root, '_site', relative));
}
const entry = await readFile(path.join(root, '_site/index.html'), 'utf8');
const entryConfig = JSON.parse(entry.match(/<script id="room-config" type="application\/json">([\s\S]*?)<\/script>/)[1]);
assert.equal(entryConfig.homeEntry, true, 'Homepage must route visitors to the room or classic pages');
assert.equal(entryConfig.room, `${base}/room/`);
assert.equal(entryConfig.js, config.js);
assert.deepEqual(entryConfig.classic, config.classic);
for (const lang of ['en', 'zh']) {
  assert.equal(config.classic[lang], `${base}/classic/${lang}/`, 'Classic links must not point back to the room entry');
  const classic = await readFile(path.join(root, `_site/classic/${lang}/index.html`), 'utf8');
  assert(classic.includes(`data-lang="${lang}"`), `Wrong ${lang} classic language`);
  assert(classic.includes('id="particle-canvas"'), 'Classic page lost its particle layout');
  assert(classic.includes(`data-home-en="${base}/classic/en/"`) && classic.includes(`data-home-zh="${base}/classic/zh/"`), 'Classic language switch must stay in classic pages');
  assert(!classic.includes('id="room-config"'), 'Classic page must not initialize the room');
}
const legacy = await readFile(path.join(root, '_site/index_zh.html'), 'utf8');
assert(legacy.includes(`url=${base}/classic/zh/`), 'Old Chinese URL lost its redirect');
for (const name of ['index.html', 'index_zh.html', 'assets/js/room-device.js']) await access(path.join(root, '_site', name));
for (const name of ['room-app', 'scripts', '_design', 'node_modules']) {
  const exists = await access(path.join(root, '_site', name)).then(() => true, () => false);
  assert(!exists, `Development files leaked into _site/${name}`);
}
console.log('Built site verified: homepage routing, bilingual classics, room assets, legacy URL and development-file exclusions.');
