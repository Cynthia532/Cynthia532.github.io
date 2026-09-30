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
assert(config.js.startsWith(`${base}/assets/room/`), 'Incorrect room base URL');
for (const url of [config.js, ...config.css, config.classic.zh, config.pdf]) {
  const relative = url.slice(base.length).replace(/^\//, '');
  await access(path.join(root, '_site', relative));
}
for (const name of ['index.html', 'index_zh.html', 'assets/js/room-device.js']) await access(path.join(root, '_site', name));
for (const name of ['room-app', 'scripts', '_design', 'node_modules']) {
  const exists = await access(path.join(root, '_site', name)).then(() => true, () => false);
  assert(!exists, `Development files leaked into _site/${name}`);
}
console.log('Built site verified: bilingual resumes, asset paths, classic pages and development-file exclusions.');
