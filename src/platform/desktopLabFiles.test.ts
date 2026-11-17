/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';
import type {DesktopRuntime} from './desktop-contract';
import {createDesktopLabFiles} from './desktopLabFiles';

test('desktop lab export forwards exact content and reports system-dialog cancellation', async () => {
  const calls: Array<{command: string; args?: Record<string, unknown>}> = [];
  const runtime: DesktopRuntime = {
    isDesktop: () => true,
    invoke: async <T>(command: string, args?: Record<string, unknown>) => {
      calls.push({command, args});
      return false as T;
    },
  };

  const saved = await createDesktopLabFiles(runtime).save('# Exact\nmarkdown ', 'md');
  assert.equal(saved, false);
  assert.deepEqual(calls, [{
    command: 'export_lab_file',
    args: {content: '# Exact\nmarkdown ', extension: 'md'},
  }]);
});

test('desktop lab import preserves cancellation and rejects decoded content over five million bytes', async () => {
  let result: string | null = null;
  const runtime: DesktopRuntime = {
    isDesktop: () => true,
    invoke: async <T>(command: string, args?: Record<string, unknown>) => {
      assert.equal(command, 'import_lab_file');
      assert.equal(args, undefined);
      return result as T;
    },
  };
  const files = createDesktopLabFiles(runtime);

  assert.equal(await files.read(), null);
  result = '你'.repeat(1_666_667);
  await assert.rejects(files.read(), /file-too-large/);
});

test('desktop lab bridge failures stay visible to the caller', async () => {
  const files = createDesktopLabFiles({
    isDesktop: () => true,
    invoke: async () => { throw new Error('dialog-host-failed'); },
  });

  await assert.rejects(files.read(), /dialog-host-failed/);
  await assert.rejects(files.save('{}', 'json'), /dialog-host-failed/);
});

test('full backup dialogs transfer more than 5 MB while lab dialogs retain their smaller limit', async () => {
  const content = JSON.stringify({notes: 'x'.repeat(5_000_000)});
  const calls: Array<{command: string; args?: Record<string, unknown>}> = [];
  const runtime: DesktopRuntime = {
    isDesktop: () => true,
    invoke: async <T>(command: string, args?: Record<string, unknown>) => {
      calls.push({command, args});
      return (command === 'import_lab_file' ? content : true) as T;
    },
  };
  const backup = createDesktopLabFiles(runtime, 'backup');
  assert.equal(await backup.read(), content);
  assert.equal(await backup.save(content, 'json'), true);
  assert.deepEqual(calls, [
    {command: 'import_lab_file', args: {kind: 'backup'}},
    {command: 'export_lab_file', args: {content, extension: 'json', kind: 'backup'}},
  ]);
  await assert.rejects(createDesktopLabFiles(runtime).save(content, 'json'), /file-too-large/);
  assert.equal(calls.length, 2);
});
