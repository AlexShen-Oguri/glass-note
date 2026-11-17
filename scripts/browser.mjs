import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const mode = process.argv[2];
if (!['install', 'test'].includes(mode)) throw Error('Use browser.mjs install or test');
const args = mode === 'install' ? ['install', 'chromium'] : ['test'];
const child = spawn(process.execPath, [path.join(root, 'node_modules/playwright/cli.js'), ...args, ...process.argv.slice(3)], {
  cwd: root, stdio: 'inherit', windowsHide: true,
  env: {...process.env, PLAYWRIGHT_BROWSERS_PATH: path.resolve(root, process.env.PLAYWRIGHT_BROWSERS_PATH ?? '.cache/ms-playwright')},
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => child.kill(signal));
