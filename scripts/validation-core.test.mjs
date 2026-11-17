import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  atomicWriteJson,
  sourceSnapshot,
  validationStatus,
} from './validation-core.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'glass-notes-validation-core-'));
  t.after(async () => {
    await rm(root, { recursive: true, force: true });
  });
  return root;
}

async function put(root, relativePath, content = '') {
  const target = path.join(root, ...relativePath.split('/'));
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content);
}

function snapshot(overrides = {}) {
  return {
    schemaVersion: 1,
    profile: 'app-validation-v4',
    algorithm: 'sha256',
    digest: 'a'.repeat(64),
    fileCount: 8,
    capturedAt: '2026-09-15T12:00:00.000Z',
    ...overrides,
  };
}

function passingReport(boundSnapshot = snapshot(), overrides = {}) {
  return {
    schemaVersion: 2,
    status: 'passed',
    pid: 1234,
    startedAt: '2026-09-15T12:00:00.000Z',
    steps: [
      { name: 'typecheck', exitCode: 0 },
      { name: 'test', exitCode: 0 },
      { name: 'web', exitCode: 0 },
      { name: 'browser', exitCode: 0 },
    ],
    passed: true,
    finishedAt: '2026-09-15T12:10:00.000Z',
    source: boundSnapshot,
    sourceAfter: { ...boundSnapshot, capturedAt: '2026-09-15T12:10:00.000Z' },
    ...overrides,
  };
}

test('sourceSnapshot is stable and covers source, raw research, root config, additions, and deletions', async (t) => {
  const root = await fixture(t);
  await Promise.all([
    put(root, 'src/index.ts', 'export const value = 1;\n'),
    put(root, 'scripts/tool.mjs', 'export {};\n'),
    put(root, 'assets/image.bin', Buffer.from([0, 1, 2, 3])),
    put(root, 'public/index.html', '<main>Glass Notes</main>'),
    put(root, 'research/raw/reference.jpg', Buffer.from([255, 216, 255, 217])),
    put(root, 'package.json', '{"private":true}\n'),
    put(root, 'babel.config.js', 'export default {};\n'),
  ]);

  const first = await sourceSnapshot(root);
  const repeat = await sourceSnapshot(root);
  assert.equal(first.schemaVersion, 1);
  assert.equal(first.profile, 'app-validation-v4');
  assert.equal(first.algorithm, 'sha256');
  assert.match(first.digest, /^[a-f0-9]{64}$/);
  assert.equal(first.digest, repeat.digest);
  assert.equal(first.fileCount, repeat.fileCount);

  await put(root, 'research/raw/reference.jpg', Buffer.from([255, 216, 0, 255, 217]));
  const researchChanged = await sourceSnapshot(root);
  assert.notEqual(researchChanged.digest, first.digest);

  await put(root, 'research/new-untracked.json', '{"source":"new"}\n');
  const untrackedAdded = await sourceSnapshot(root);
  assert.notEqual(untrackedAdded.digest, researchChanged.digest);
  assert.equal(untrackedAdded.fileCount, researchChanged.fileCount + 1);

  await unlink(path.join(root, 'research', 'new-untracked.json'));
  const untrackedDeleted = await sourceSnapshot(root);
  assert.equal(untrackedDeleted.digest, researchChanged.digest);

  await put(root, 'babel.config.js', 'export default { presets: [] };\n');
  const configChanged = await sourceSnapshot(root);
  assert.notEqual(configChanged.digest, researchChanged.digest);
});

test('sourceSnapshot excludes well-defined caches and planning output', async (t) => {
  const root = await fixture(t);
  await Promise.all(
    ['src', 'scripts', 'assets', 'public', 'research'].map((directory) =>
      mkdir(path.join(root, directory), { recursive: true }),
    ),
  );
  await put(root, 'src/index.ts', 'source\n');
  const before = await sourceSnapshot(root);
  await Promise.all([
    put(root, 'src/.cache/bundle.js', 'cached\n'),
    put(root, 'research/.cache/download.bin', 'cached\n'),
    put(root, 'assets/.cache/asset.bin', 'cached\n'),
    put(root, 'planning/CURRENT-STATE.md', 'generated status\n'),
  ]);
  const after = await sourceSnapshot(root);
  assert.equal(after.digest, before.digest);
  assert.equal(after.fileCount, before.fileCount);
});

test('sourceSnapshot includes potentially imported generated and cache-named source directories', async (t) => {
  const root = await fixture(t);
  await put(root, 'src/index.ts', 'source\n');
  const before = await sourceSnapshot(root);
  await put(root, 'src/generated/routes.ts', 'export const routes = [];\n');
  const generated = await sourceSnapshot(root);
  assert.notEqual(generated.digest, before.digest);
  await put(root, 'research/cache/reference.json', '{"raw":true}\n');
  const cacheNamed = await sourceSnapshot(root);
  assert.notEqual(cacheNamed.digest, generated.digest);
});

test('sourceSnapshot records missing included directories', async (t) => {
  const root = await fixture(t);
  const missing = await sourceSnapshot(root);
  await mkdir(path.join(root, 'src'));
  const presentButEmpty = await sourceSnapshot(root);
  assert.notEqual(presentButEmpty.digest, missing.digest);
  assert.equal(presentButEmpty.fileCount, missing.fileCount);
});

test('browser specifications and runner configuration invalidate an earlier source snapshot', async t => {
  const root = await fixture(t);
  await put(root, 'tests/e2e/core.spec.ts', 'test("persistence", acceptance);\n');
  await put(root, 'playwright.config.ts', 'export default {retries: 0};\n');
  const before = await sourceSnapshot(root);
  await put(root, 'tests/e2e/core.spec.ts', 'test("restore", acceptance);\n');
  const changedTest = await sourceSnapshot(root);
  assert.notEqual(changedTest.digest, before.digest);
  await put(root, 'playwright.config.ts', 'export default {retries: 1};\n');
  assert.notEqual((await sourceSnapshot(root)).digest, changedTest.digest);
});

test('sourceSnapshot fails closed when an included tree contains a symbolic link', async (t) => {
  const root = await fixture(t);
  const outside = await fixture(t);
  await mkdir(path.join(root, 'src'), { recursive: true });
  let linkCreated = false;
  try {
    await symlink(outside, path.join(root, 'src', 'linked'), 'junction');
    linkCreated = true;
  } catch (error) {
    if (error?.code !== 'EPERM') throw error;
  }
  if (!linkCreated) {
    t.skip('This Windows environment does not permit test junction creation.');
    return;
  }
  await assert.rejects(sourceSnapshot(root), /symbolic link/);
});

test('validationStatus requires browser acceptance as well as the original source-bound checks', () => {
  const current = snapshot();
  assert.deepEqual(validationStatus(passingReport(current), current), {
    status: 'current',
    reason: 'Validation passed for the current source snapshot.',
  });

  const partial = passingReport(current);
  partial.steps = partial.steps.filter((step) => step.name !== 'web');
  assert.equal(validationStatus(partial, current).status, 'invalid');

  const noBrowser = passingReport(current);
  noBrowser.steps = noBrowser.steps.filter(step => step.name !== 'browser');
  assert.equal(validationStatus(noBrowser, current).status, 'invalid');
  assert.equal(validationStatus(passingReport(snapshot({profile: 'app-validation-v1'})), current).status, 'invalid');
  assert.equal(validationStatus(passingReport(snapshot({profile: 'app-validation-v3'})), current).status, 'invalid');

  const failedStep = passingReport(current);
  failedStep.steps[1].exitCode = 1;
  assert.equal(validationStatus(failedStep, current).status, 'failed');

  const extraFailedStep = passingReport(current);
  extraFailedStep.steps.push({ name: 'extra-check', exitCode: 2 });
  assert.equal(validationStatus(extraFailedStep, current).status, 'failed');

  const falsePass = passingReport(current, { passed: false });
  assert.equal(validationStatus(falsePass, current).status, 'invalid');
});

test('validationStatus distinguishes missing, legacy, running, failed, stale, and malformed reports', () => {
  const current = snapshot();
  assert.equal(validationStatus(null, current).status, 'missing');
  assert.equal(validationStatus({}, current).status, 'invalid');
  assert.equal(
    validationStatus(
      {
        startedAt: '2026-09-15T12:00:00.000Z',
        finishedAt: '2026-09-15T12:10:00.000Z',
        steps: [],
        passed: true,
      },
      current,
    ).status,
    'unbound',
  );

  const running = passingReport(current, {
    status: 'running',
    passed: false,
    finishedAt: null,
    sourceAfter: null,
    steps: [{ name: 'typecheck', exitCode: 0 }, { name: 'test', exitCode: null }],
  });
  assert.equal(validationStatus(running, current).status, 'running');
  assert.equal(validationStatus({ ...running, passed: true }, current).status, 'invalid');

  const failed = passingReport(current, { status: 'failed', passed: false });
  assert.equal(validationStatus(failed, current).status, 'failed');
  assert.equal(
    validationStatus({ ...failed, finishedAt: null, sourceAfter: null }, current).status,
    'failed',
  );

  const changed = snapshot({ digest: 'b'.repeat(64) });
  assert.equal(validationStatus(passingReport(current), changed).status, 'stale');
  assert.equal(
    validationStatus(passingReport(current, { status: 'source-changed' }), current).status,
    'stale',
  );
  assert.equal(validationStatus(passingReport(current), { ...current, digest: 'bad' }).status, 'invalid');
});

test('atomicWriteJson replaces content atomically and leaves no temporary files', async (t) => {
  const root = await fixture(t);
  const target = path.join(root, 'state.json');
  await writeFile(target, '{"old":true}\n');
  await atomicWriteJson(target, { current: true, nested: { count: 2 } });
  assert.equal(
    await readFile(target, 'utf8'),
    '{\n  "current": true,\n  "nested": {\n    "count": 2\n  }\n}\n',
  );
  assert.deepEqual((await readdir(root)).filter((name) => name.endsWith('.tmp')), []);
});

test('atomicWriteJson uses unique temporary files under concurrency and cleans failed renames', async (t) => {
  const root = await fixture(t);
  const target = path.join(root, 'concurrent.json');
  await Promise.all(Array.from({ length: 8 }, (_, index) => atomicWriteJson(target, { index })));
  const written = JSON.parse(await readFile(target, 'utf8'));
  assert.ok(Number.isInteger(written.index) && written.index >= 0 && written.index < 8);
  assert.deepEqual((await readdir(root)).filter((name) => name.endsWith('.tmp')), []);

  const directoryTarget = path.join(root, 'cannot-replace');
  await mkdir(directoryTarget);
  await assert.rejects(atomicWriteJson(directoryTarget, { value: true }));
  assert.deepEqual((await readdir(root)).filter((name) => name.endsWith('.tmp')), []);
});

test('sourceSnapshot excludes reproducible brand outputs but includes their maintained inputs', async t => {
  const root = await fixture(t);
  await put(root, 'assets/brand/icon.svg', '<svg/>');
  await put(root, 'public/brand/favicon.ico', 'first output');
  const before = await sourceSnapshot(root);
  await put(root, 'public/brand/favicon.ico', 'regenerated');
  assert.equal((await sourceSnapshot(root)).digest, before.digest);
  await put(root, 'assets/brand/icon.svg', '<svg>changed input</svg>');
  assert.notEqual((await sourceSnapshot(root)).digest, before.digest);
});

test('creating or removing a generated-only public root does not change maintained sources', async t => {
  const root = await fixture(t);
  await put(root, 'assets/brand/icon.svg', '<svg/>');
  const missing = await sourceSnapshot(root);
  await mkdir(path.join(root, 'public'));
  assert.equal((await sourceSnapshot(root)).digest, missing.digest);
  await put(root, 'public/brand/favicon.ico', 'generated output');
  assert.equal((await sourceSnapshot(root)).digest, missing.digest);
  await rm(path.join(root, 'public'), {recursive: true});
  assert.equal((await sourceSnapshot(root)).digest, missing.digest);
});

test('maintained public files still invalidate snapshots on additions, edits and deletion', async t => {
  const root = await fixture(t);
  const missing = await sourceSnapshot(root);
  await put(root, 'public/robots.txt', 'User-agent: *\n');
  const added = await sourceSnapshot(root);
  assert.notEqual(added.digest, missing.digest);
  assert.equal(added.fileCount, missing.fileCount + 1);
  await put(root, 'public/robots.txt', 'User-agent: *\nDisallow: /\n');
  assert.notEqual((await sourceSnapshot(root)).digest, added.digest);
  await unlink(path.join(root, 'public/robots.txt'));
  assert.equal((await sourceSnapshot(root)).digest, missing.digest);
});

test('an optional public root still rejects symlinks and non-directory paths', async t => {
  const root = await fixture(t);
  await put(root, 'public', 'not a directory');
  await assert.rejects(sourceSnapshot(root), /not a directory: public/);
  await unlink(path.join(root, 'public'));
  const outside = await fixture(t);
  await symlink(outside, path.join(root, 'public'), 'junction');
  await assert.rejects(sourceSnapshot(root), /symbolic link: public/);
});
