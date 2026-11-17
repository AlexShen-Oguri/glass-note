import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import sharp from 'sharp';
import {brandFileHash, checkBrand, generatedBrandFiles} from './check-brand.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const desktopNames = generatedBrandFiles.filter(file => file.startsWith('src-tauri/icons/')).map(file => path.basename(file));

async function rejectLinkedDirectory(directory, relative) {
  let current = path.resolve(directory);
  for (const part of ['', ...relative.split('/')]) {
    current = path.join(current, part);
    try {
      if ((await fs.lstat(current)).isSymbolicLink()) throw Error(`Linked brand output directory: ${relative}`);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}

// Fixed public URLs and Tauri's build inputs are local derivatives, not extra sources.
// Only Windows/macOS icons enter the repository's build directories.
export async function generateBrandOutputs(directory = root) {
  await rejectLinkedDirectory(directory, 'public/brand');
  await rejectLinkedDirectory(directory, 'src-tauri/icons');
  const at = relative => path.join(directory, relative);
  const write = async (relative, bytes) => {
    await fs.mkdir(path.dirname(at(relative)), {recursive:true});
    try { if ((await fs.lstat(at(relative))).isSymbolicLink()) throw Error('Linked brand output file'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    await fs.writeFile(at(relative), bytes);
  };
  const desktop = await fs.readFile(at('assets/brand/icon.svg'), 'utf8');
  if (!desktop.includes('rx="102"')) throw Error('Approved icon framing is missing');
  const app = Buffer.from(desktop.replace('rx="102"', 'rx="0"'));
  await write('public/brand/favicon.svg', desktop);
  for (const [file, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
    await write(`public/brand/${file}`, await sharp(app).resize(size).png().toBuffer());
  }
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'glass-notes-brand-icons-'));
  try {
    const result = spawnSync(process.execPath, [path.join(root, 'node_modules/@tauri-apps/cli/tauri.js'), 'icon', at('assets/brand/icon.svg'), '--output', temporary], {cwd:directory, stdio:'pipe', windowsHide:true, encoding:'utf8'});
    if (result.status !== 0) throw Error(`Tauri icon generation failed: ${result.error?.message ?? result.stderr ?? result.status}`);
    for (const name of desktopNames) await write(`src-tauri/icons/${name}`, await fs.readFile(path.join(temporary, name)));
  } finally {
    await fs.rm(temporary, {recursive:true, force:true});
  }
  await write('public/brand/favicon.ico', await fs.readFile(at('src-tauri/icons/icon.ico')));
  await write('public/brand/favicon-32.png', await fs.readFile(at('src-tauri/icons/32x32.png')));
  return Promise.all(generatedBrandFiles.map(async file => ({file, sha256:brandFileHash(file, await fs.readFile(at(file)))})));
}

export async function prepareBrand({directory = root} = {}) {
  await rejectLinkedDirectory(directory, 'public/brand');
  await rejectLinkedDirectory(directory, 'src-tauri/icons');
  await checkBrand({directory, includeGenerated:false});
  try { await checkBrand({directory}); }
  catch {
    await generateBrandOutputs(directory);
    // A differing renderer/dependency remains a failure, not a rewritten manifest.
    await checkBrand({directory});
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await prepareBrand();
  console.log('Web and Windows/macOS brand outputs prepared from assets/brand.');
}
