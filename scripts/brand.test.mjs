import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {brandFileHash, checkBrand, generatedBrandFiles} from './check-brand.mjs';
import {prepareBrand} from './prepare-brand.mjs';
import {sourceSnapshot} from './validation-core.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
async function freshBrand(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'glass-notes-brand-test-'));
  t.after(() => fs.rm(directory, {recursive:true, force:true}));
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'assets/brand/manifest.json'), 'utf8'));
  for (const file of ['assets/brand/manifest.json', ...manifest.files.map(record => record.file)]) {
    const target = path.join(directory, file);
    await fs.mkdir(path.dirname(target), {recursive:true});
    await fs.copyFile(path.join(root, file), target);
  }
  return directory;
}

test('a checkout with only maintained brand assets regenerates fixed Web URLs and desktop icons', async t => {
  const directory = await freshBrand(t);
  await assert.rejects(checkBrand({directory}), /missing or stale/);
  const sourceBefore = await sourceSnapshot(directory);
  await prepareBrand({directory});
  assert.equal((await sourceSnapshot(directory)).digest, sourceBefore.digest);
  assert.equal(await checkBrand({directory}), JSON.parse(await fs.readFile(path.join(directory, 'assets/brand/manifest.json'), 'utf8')).files.length + generatedBrandFiles.length);
  assert.deepEqual((await fs.readdir(path.join(directory, 'src-tauri/icons'))).sort(), ['128x128.png', '128x128@2x.png', '32x32.png', 'icon.icns', 'icon.ico', 'icon.png']);
  assert.deepEqual(await fs.readFile(path.join(directory, 'public/brand/favicon.ico')), await fs.readFile(path.join(directory, 'src-tauri/icons/icon.ico')));
  const manifestBefore = await fs.readFile(path.join(directory, 'assets/brand/manifest.json'));
  await fs.writeFile(path.join(directory, 'public/brand/favicon.svg'), 'corrupt generated icon');
  await prepareBrand({directory});
  await checkBrand({directory});
  assert.deepEqual(await fs.readFile(path.join(directory, 'assets/brand/manifest.json')), manifestBefore);
});

test('stale maintained assets block preparation rather than silently rewriting their hash', async t => {
  const directory = await freshBrand(t);
  await fs.appendFile(path.join(directory, 'assets/brand/icon.svg'), '\n');
  await assert.rejects(prepareBrand({directory}), /assets\/brand\/icon.svg/);
  await assert.rejects(fs.stat(path.join(directory, 'public/brand/favicon.svg')), {code:'ENOENT'});
});

test('ICNS consistency ignores chunk order but detects changed or truncated image payloads', () => {
  const chunk = (type, data) => {
    const bytes = Buffer.alloc(8 + data.length);
    bytes.write(type, 0, 'ascii'); bytes.writeUInt32BE(bytes.length, 4); bytes.write(data, 8);
    return bytes;
  };
  const image = chunks => {
    const bytes = Buffer.concat([Buffer.alloc(8), ...chunks]);
    bytes.write('icns', 0, 'ascii'); bytes.writeUInt32BE(bytes.length, 4);
    return bytes;
  };
  const a = chunk('ic07', 'small image'); const b = chunk('ic08', 'large image');
  assert.equal(brandFileHash('icon.icns', image([a,b])), brandFileHash('icon.icns', image([b,a])));
  assert.notEqual(brandFileHash('icon.icns', image([a,b])), brandFileHash('icon.icns', image([a,chunk('ic08','changed image')])));
  assert.throws(() => brandFileHash('icon.icns', image([a,b]).subarray(0,-1)), /Invalid ICNS/);
});
