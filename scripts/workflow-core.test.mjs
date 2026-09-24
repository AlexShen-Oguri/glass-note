import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  assessFailures,
  atomicWriteJson,
  ownershipConflicts,
  sourceSnapshot,
  validateState,
  validationStatus,
} from './workflow-core.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'glass-notes-workflow-core-'));
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
    profile: 'app-validation-v1',
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
      { name: 'ios', exitCode: 0 },
    ],
    passed: true,
    finishedAt: '2026-09-15T12:10:00.000Z',
    source: boundSnapshot,
    sourceAfter: { ...boundSnapshot, capturedAt: '2026-09-15T12:10:00.000Z' },
    ...overrides,
  };
}

function validState() {
  return {
    schemaVersion: 1,
    updatedAt: '2026-09-15T12:00:00.000Z',
    product: { phase: 'P02 B', status: 'awaiting-user-review', nextPhase: 'P02 C' },
    task: {
      id: 'agent-workflow',
      title: 'Status and runbook',
      status: 'in-progress',
      nextAction: 'Validate and hand off',
    },
    gates: {
      productAcceptance: 'pending',
      mainMerge: 'blocked-until-user-acceptance',
      commit: 'workflow-uncommitted; product-candidate-uncommitted',
      deployment: 'no-deploy-this-task',
    },
    assignments: [
      {
        id: 'workflow-core',
        agent: '/root/workflow-core',
        model: 'gpt-5.6-luna',
        effort: 'max',
        status: 'active',
        writes: ['scripts/workflow-core.mjs'],
        deliverable: 'planning/handoffs/workflow-core.md',
      },
    ],
    validation: { reportPath: 'artifacts/validation-latest.json' },
    failureEvents: [],
    unverified: ['iPhone device'],
    references: ['PROJECT-PLAN.md'],
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
  assert.equal(first.profile, 'app-validation-v1');
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

test('validationStatus only marks a complete, source-bound four-step report current', () => {
  const current = snapshot();
  assert.deepEqual(validationStatus(passingReport(current), current), {
    status: 'current',
    reason: 'Validation passed for the current source snapshot.',
  });

  const partial = passingReport(current);
  partial.steps = partial.steps.filter((step) => step.name !== 'ios');
  assert.equal(validationStatus(partial, current).status, 'invalid');

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

test('validateState accepts the contract structure and reports missing or unsafe values', () => {
  assert.deepEqual(validateState(validState()), []);

  const invalid = validState();
  invalid.updatedAt = 'yesterday';
  delete invalid.gates.productAcceptance;
  invalid.assignments[0].writes = ['../outside', 'C:\\absolute\\file.mjs'];
  invalid.failureEvents = [
    {
      type: 'guessed-failure',
      taskId: '',
      operation: 'test',
      cause: 'unknown',
      at: 'not-a-date',
      evidence: '',
    },
  ];
  const errors = validateState(invalid);
  assert.ok(errors.some((error) => error.includes('updatedAt')));
  assert.ok(errors.some((error) => error.includes('gates.productAcceptance')));
  assert.ok(errors.some((error) => error.includes('traverse')));
  assert.ok(errors.some((error) => error.includes('must be relative')));
  assert.ok(errors.some((error) => error.includes('failureEvents[0].type')));
  assert.ok(errors.some((error) => error.includes('failureEvents[0].evidence')));
});

test('ownershipConflicts uses case-insensitive Windows paths and directory boundaries', () => {
  const conflicts = ownershipConflicts([
    { id: 'one', status: 'active', writes: ['src/Feature', 'scripts/exact.mjs'] },
    { id: 'two', status: 'active', writes: ['SRC\\feature\\child.ts'] },
    { id: 'three', status: 'active', writes: ['src/Featured'] },
    { id: 'four', status: 'complete', writes: ['src'] },
    { id: 'five', status: 'active', writes: ['SCRIPTS/exact.mjs'] },
  ]);
  assert.deepEqual(conflicts, [
    { taskIds: ['five', 'one'], path: 'scripts/exact.mjs' },
    { taskIds: ['one', 'two'], path: 'src/feature/child.ts' },
  ]);
});

test('ownershipConflicts rejects absolute, traversing, and glob write scopes', () => {
  for (const writePath of ['C:\\work\\file.ts', '/root/file.ts', '../file.ts', 'src/*.ts']) {
    assert.throws(
      () => ownershipConflicts([{ id: 'task', status: 'active', writes: [writePath] }]),
      TypeError,
    );
  }
});

test('ownershipConflicts accepts literal Expo bracket route filenames', () => {
  assert.deepEqual(
    ownershipConflicts([
      { id: 'route', status: 'active', writes: ['src/app/cocktails/[id].tsx'] },
      { id: 'screen', status: 'active', writes: ['src/app/cocktails'] },
    ]),
    [{ taskIds: ['route', 'screen'], path: 'src/app/cocktails/[id].tsx' }],
  );
});

test('assessFailures stops on the third consecutive matching explicit failure', () => {
  const failure = {
    type: 'failure',
    taskId: 'workflow-core',
    operation: 'node-test',
    cause: 'assertion',
  };
  assert.deepEqual(assessFailures([]), { consecutive: 0, action: 'continue', key: null });
  const twice = assessFailures([failure, failure]);
  assert.equal(twice.consecutive, 2);
  assert.equal(twice.action, 'continue');
  assert.equal(twice.key, '["workflow-core","node-test","assertion"]');
  assert.equal(assessFailures([failure, failure, failure]).action, 'stop-and-investigate');

  const changedCause = { ...failure, cause: 'timeout' };
  assert.equal(assessFailures([failure, failure, changedCause]).consecutive, 1);
  assert.deepEqual(
    assessFailures([failure, failure, { type: 'approach-change' }, failure]),
    { consecutive: 1, action: 'continue', key: twice.key },
  );
  assert.throws(() => assessFailures([{ type: 'failure' }]), TypeError);
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
