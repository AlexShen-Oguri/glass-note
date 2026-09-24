import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile, rm, access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {runValidation} from './workflow-validation.mjs';
import {setTimeout as delay} from 'node:timers/promises';

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'glass-workflow-run-'));
  t.after(() => rm(root, {recursive: true, force: true}));
  await mkdir(path.join(root, 'src'));
  await writeFile(path.join(root, 'src', 'value.js'), 'initial');
  return root;
}
const loadReport = async root => JSON.parse(await readFile(path.join(root, 'artifacts/validation-latest.json'), 'utf8'));
const successful = ['typecheck', 'test', 'web', 'ios'].map(name => [name, ['-e', 'process.exit(0)']]);

test('validation binds successful checks to unchanged real files and releases lock', async t => {
  const root = await fixture(t);
  const result = await runValidation({root, steps: successful, quiet: true});
  assert.equal(result.status, 'passed');
  assert.equal(result.source.digest, result.sourceAfter.digest);
  assert.equal(result.steps.length, 4);
  assert.deepEqual(await loadReport(root), result);
  await assert.rejects(access(path.join(root, 'artifacts/workflow/validation.lock')), {code: 'ENOENT'});
});

test('first failed step replaces old pass, records failure and skips later steps', async t => {
  const root = await fixture(t);
  await runValidation({root, steps: successful, quiet: true});
  const report = await runValidation({root, steps: [['test', ['-e', 'console.error("deliberate failure"); process.exit(9)']], ['web', ['-e', 'process.exit(0)']]], quiet: true});
  assert.equal(report.passed, false);
  assert.equal(report.status, 'failed');
  assert.equal(report.steps.length, 1);
  assert.equal(report.steps[0].exitCode, 9);
  assert.match(await readFile(path.join(root, 'artifacts/validate-test.log'), 'utf8'), /deliberate failure/);
});

test('source changes during successful commands cannot produce a pass', async t => {
  const root = await fixture(t);
  const report = await runValidation({root, steps: [['test', ['-e', "require('fs').writeFileSync('src/value.js', 'changed')"]]], quiet: true});
  assert.equal(report.status, 'source-changed');
  assert.equal(report.passed, false);
});

test('second runner cannot overwrite report or lock while first is active', async t => {
  const root = await fixture(t);
  let release, ready;
  const gate = new Promise(resolve => {release = resolve;});
  const entered = new Promise(resolve => {ready = resolve;});
  const snapshot = async () => {ready(); await gate; return {digest: 'fixture', profile: 'fixture'};};
  const first = runValidation({root, steps: [], snapshot, quiet: true});
  await entered;
  const before = await loadReport(root);
  try {
    assert.equal(before.status, 'running');
    assert.equal(before.passed, false);
    await assert.rejects(runValidation({root, steps: successful, quiet: true}), /Validation lock exists/);
    assert.deepEqual(await loadReport(root), before);
  } finally {release(); await first;}
});

test('aborted validation records interrupted rather than passed', async t => {
  const root = await fixture(t);
  const controller = new AbortController();
  controller.abort();
  const report = await runValidation({root, steps: successful, signal: controller.signal, quiet: true});
  assert.equal(report.status, 'interrupted');
  assert.equal(report.passed, false);
  assert.equal(report.steps.length, 0);
});

test('snapshot errors overwrite old green result with a finished failure', async t => {
  const root = await fixture(t);
  await runValidation({root, steps: successful, quiet: true});
  const report = await runValidation({root, steps: successful, snapshot: async () => {throw new Error('source unreadable');}, quiet: true});
  assert.equal(report.status, 'failed');
  assert.equal(report.error, 'source unreadable');
  assert.ok(report.finishedAt);
  assert.equal((await loadReport(root)).passed, false);
});

test('live output and running checkpoint survive until an in-flight abort', async t => {
  const root = await fixture(t);
  const controller = new AbortController();
  const running = runValidation({root, steps: [['test', ['-e', 'console.log("ready-to-abort"); setInterval(() => {}, 1000)']]], signal: controller.signal, quiet: true});
  let output = '';
  try {
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline && !output.includes('ready-to-abort')) {
      output = await readFile(path.join(root, 'artifacts/validate-test.log'), 'utf8').catch(() => '');
      if (!output.includes('ready-to-abort')) await delay(20);
    }
    assert.match(output, /ready-to-abort/);
    const checkpoint = await loadReport(root);
    assert.equal(checkpoint.status, 'running');
    assert.equal(checkpoint.passed, false);
  } finally {controller.abort();}
  const result = await running;
  assert.equal(result.status, 'interrupted');
  assert.equal(result.passed, false);
  const retainedLock = JSON.parse(await readFile(path.join(root, 'artifacts/workflow/validation.lock'), 'utf8'));
  assert.equal(retainedLock.runId, result.runId);
});
