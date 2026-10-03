import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {prepareCloudflarePages} from './prepare-cloudflare-pages.mjs';

async function fixture(run) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'glass-notes-pages-'));
  try {
    await mkdir(path.join(root, 'dist'));
    await writeFile(path.join(root, 'dist', 'index.html'), '<html><script src="/entry.js"></script></html>');
    await run(root);
  } finally {
    await rm(root, {recursive:true, force:true});
  }
}

test('Pages upload preserves bundle bytes, public dependency URLs and the source export', async () => fixture(async root => {
  const assets = path.join(root, 'dist', 'assets', 'node_modules', 'expo-router');
  await mkdir(assets, {recursive:true});
  await writeFile(path.join(assets, 'back-icon.hash.png'), 'image-bytes');
  const entry = 'const icon="/assets/node_modules/expo-router/back-icon.hash.png";';
  await writeFile(path.join(root, 'dist', 'entry.js'), entry);
  await writeFile(path.join(root, 'dist', '_headers'), '/*\n  Cache-Control: no-cache\n');
  await writeFile(path.join(root, 'dist', '_redirects'), '/old /new 301\n');
  const result = await prepareCloudflarePages(root);
  assert.equal(result.dependencyAssetCount, 1);
  assert.equal(await readFile(path.join(result.site, 'entry.js'), 'utf8'), entry);
  assert.equal(await readFile(path.join(result.site, 'assets', 'vendor-dependencies', 'expo-router', 'back-icon.hash.png'), 'utf8'), 'image-bytes');
  assert.equal(await readFile(path.join(result.site, '_redirects'), 'utf8'), '/assets/node_modules/* /assets/vendor-dependencies/:splat 200\n/old /new 301\n');
  assert.equal(await readFile(path.join(result.site, '_headers'), 'utf8'), '/*\n  Cache-Control: no-cache\n');
  assert.equal(await readFile(path.join(assets, 'back-icon.hash.png'), 'utf8'), 'image-bytes');
  assert.equal(await readFile(path.join(root, 'dist', '_redirects'), 'utf8'), '/old /new 301\n');
}));

test('Pages preparation rejects private files and dependency source code', async () => fixture(async root => {
  await writeFile(path.join(root, 'dist', '.env'), 'EXAMPLE_ONLY=1');
  await assert.rejects(prepareCloudflarePages(root), /Unexpected export/);
  await rm(path.join(root, 'dist', '.env'));
  await mkdir(path.join(root, 'dist', 'assets', 'node_modules'), {recursive:true});
  await writeFile(path.join(root, 'dist', 'assets', 'node_modules', 'source.js'), 'source-code');
  await assert.rejects(prepareCloudflarePages(root), /Non-asset dependency/);
  await assert.rejects(prepareCloudflarePages(root, '../outside'), /inside the project/);
}));

test('Exports without dependency assets retain their existing redirect rules', async () => fixture(async root => {
  await writeFile(path.join(root, 'dist', '_redirects'), '/old /new 301\n');
  const result = await prepareCloudflarePages(root);
  assert.equal(result.dependencyAssetCount, 0);
  assert.equal(await readFile(path.join(result.site, '_redirects'), 'utf8'), '/old /new 301\n');
}));
