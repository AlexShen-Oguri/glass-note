import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {inspectExport} from './package-web.mjs';

test('web bundle inventory hashes runtime files and rejects private or debugging files', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'glass-notes-package-'));
  try {
    await assert.rejects(inspectExport(root), /index.html/);
    await writeFile(path.join(root, 'index.html'), '<html>Glass Notes</html>');
    const files = await inspectExport(root);
    assert.equal(files.length, 1);
    assert.match(files[0].sha256, /^[a-f0-9]{64}$/);
    await mkdir(path.join(root, '_expo'));
    await writeFile(path.join(root, '_expo', '.routes.json'), '{"htmlRoutes":[]}');
    assert.ok((await inspectExport(root)).some(file => file.path === '_expo/.routes.json'));
    await writeFile(path.join(root, '.routes.json'), '{}');
    await assert.rejects(inspectExport(root), /Unexpected export/);
    await rm(path.join(root, '.routes.json'));
    await rm(path.join(root, '_expo', '.routes.json'));
    await mkdir(path.join(root, '_expo', '.routes.json'));
    await assert.rejects(inspectExport(root), /regular file/);
    await rm(path.join(root, '_expo', '.routes.json'), {recursive:true});
    const routerAssets = path.join(root, 'assets', 'node_modules', 'expo-router', 'assets');
    await mkdir(routerAssets, {recursive:true});
    await writeFile(path.join(routerAssets, 'back-icon.png'), 'test-image');
    assert.ok((await inspectExport(root)).some(file => file.path.endsWith('back-icon.png')));
    await writeFile(path.join(routerAssets, 'source.js'), 'module.exports={}');
    await assert.rejects(inspectExport(root), /Non-asset dependency/);
    await rm(path.join(routerAssets, 'source.js'));
    await mkdir(path.join(root, 'node_modules'));
    await assert.rejects(inspectExport(root), /Unexpected export/);
    await rm(path.join(root, 'node_modules'), {recursive:true});
    await writeFile(path.join(root, '.env'), 'EXAMPLE_ONLY=1');
    await assert.rejects(inspectExport(root), /Unexpected export/);
    await rm(path.join(root, '.env'));
    await writeFile(path.join(root, 'entry.js.map'), '{}');
    await assert.rejects(inspectExport(root), /Non-runtime/);
  } finally {
    const relative = path.relative(os.tmpdir(), root);
    assert.ok(relative.startsWith('glass-notes-package-') && !relative.includes(path.sep));
    await rm(root, {recursive:true, force:true});
  }
});
