import { spawnSync } from 'node:child_process';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const baseIndex = args.indexOf('--baseurl');
const base = baseIndex < 0 ? '' : args[baseIndex + 1];
if (base === undefined || (base !== '' && !/^\/[a-zA-Z0-9_/-]+$/.test(base))) throw new Error('Use --baseurl /repository-name, or omit it for a user homepage.');
const normalizedBase = base.replace(/\/$/, '');
function run(command, argv, cwd = root, shell = false) {
  const result = spawnSync(command, argv, { cwd, stdio: 'inherit', shell });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
await access(path.join(root, 'Gemfile')).catch(() => { throw new Error('Gemfile is missing; see room-app/README.md for the Ruby setup.'); });
await access(path.join(root, 'room-app/node_modules/vite/bin/vite.js')).catch(() => { throw new Error('First run npm ci inside room-app on the build machine.'); });
const app = path.join(root, 'room-app');
run(process.execPath, [path.join(app, 'node_modules/typescript/bin/tsc'), '--noEmit'], app);
run(process.execPath, [path.join(app, 'node_modules/vite/bin/vite.js'), 'build'], app);
run(process.execPath, [path.join(root, 'scripts/room-manifest.mjs')]);
const windows = process.platform === 'win32';
const wslIndex = args.indexOf('--wsl');
if (windows && wslIndex >= 0) {
  const distro = args[wslIndex + 1] || 'Ubuntu-24.04';
  const linuxRoot = '/mnt/' + root[0].toLowerCase() + root.slice(2).replaceAll('\\', '/');
  run('wsl.exe', ['-d', distro, '--cd', linuxRoot, '--exec', 'bash', '-lc',
    'export GEM_HOME="${GEM_HOME:-$HOME/gems}"; export PATH="$GEM_HOME/bin:$PATH"; bundle exec jekyll build "$@"',
    'study-build', `--baseurl=${normalizedBase}`]);
} else {
  run(windows ? 'bundle.bat' : 'bundle', ['exec', 'jekyll', 'build', `--baseurl=${normalizedBase}`], root, windows);
}
run(process.execPath, [path.join(root, 'scripts/verify-built.mjs'), normalizedBase]);
