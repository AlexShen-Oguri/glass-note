/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';
import type {DesktopRuntime, LocalKeyValueStorage} from './desktop-contract';
import {createPlatformStorage} from './storageFactory';

function runtime(desktop: boolean, invoke: DesktopRuntime['invoke']): DesktopRuntime {
  return {isDesktop: () => desktop, invoke};
}

test('browser dispatch preserves the existing AsyncStorage object', async () => {
  const browser: LocalKeyValueStorage = {
    getItem: async key => `browser:${key}`,
    setItem: async () => undefined,
  };
  const selected = createPlatformStorage(runtime(false, async () => {
    throw new Error('desktop bridge must stay unused');
  }), browser);

  assert.equal(selected, browser);
  assert.equal(await selected.getItem('glass-notes.preferences'), 'browser:glass-notes.preferences');
});

test('desktop dispatch preserves exact host payloads and never touches legacy data when host data exists', async () => {
  const calls: Array<{command: string; args?: Record<string, unknown>}> = [];
  let legacyReads = 0;
  const selected = createPlatformStorage(runtime(true, async <T>(command: string, args?: Record<string, unknown>) => {
    calls.push({command, args});
    return ' {"locale":"zh"}\n' as T;
  }), {
    getItem: async () => { legacyReads += 1; return 'legacy'; },
    setItem: async () => undefined,
  });

  assert.equal(await selected.getItem('glass-notes.preferences'), ' {"locale":"zh"}\n');
  assert.equal(legacyReads, 0);
  assert.deepEqual(calls, [{command: 'read_local_entry', args: {key: 'glass-notes.preferences'}}]);
});

test('desktop writes send the exact key and value and do not fall back after a host failure', async () => {
  let browserWrites = 0;
  const selected = createPlatformStorage(runtime(true, async () => {
    throw new Error('disk-full');
  }), {
    getItem: async () => null,
    setItem: async () => { browserWrites += 1; },
  });

  await assert.rejects(selected.setItem('glass-notes.lab.v1', ' exact\nvalue '), /disk-full/);
  assert.equal(browserWrites, 0);
});

test('a failed desktop read is not converted to empty or legacy data', async () => {
  let legacyReads = 0;
  const selected = createPlatformStorage(runtime(true, async () => {
    throw new Error('host-unreadable');
  }), {
    getItem: async () => { legacyReads += 1; return 'legacy'; },
    setItem: async () => undefined,
  });

  await assert.rejects(selected.getItem('glass-notes.pantry.v1'), /host-unreadable/);
  assert.equal(legacyReads, 0);
});

test('an empty desktop key migrates the same-origin legacy payload before returning it', async () => {
  const calls: Array<{command: string; args?: Record<string, unknown>}> = [];
  let stored: string | null = null;
  let legacy: string | null = '{"version":1,"versionIds":["v-1"]}';
  const selected = createPlatformStorage(runtime(true, async <T>(command: string, args?: Record<string, unknown>) => {
    calls.push({command, args});
    if (command === 'write_local_entry') stored = args!.value as string;
    return (command === 'read_local_entry' ? stored : undefined) as T;
  }), {
    getItem: async key => key === 'glass-notes.favorites.v1' ? legacy : null,
    setItem: async () => { throw new Error('migration must use host storage'); },
    removeItem: async () => { legacy = null; },
  });

  const value = await selected.getItem('glass-notes.favorites.v1');
  assert.equal(value, '{"version":1,"versionIds":["v-1"]}');
  assert.deepEqual(calls, [
    {command: 'read_local_entry', args: {key: 'glass-notes.favorites.v1'}},
    {command: 'write_local_entry', args: {key: 'glass-notes.favorites.v1', value}},
    {command: 'read_local_entry', args: {key: 'glass-notes.favorites.v1'}},
  ]);
  assert.equal(legacy, null);
});

test('legacy data is not returned unless its desktop migration succeeds', async () => {
  const selected = createPlatformStorage(runtime(true, async <T>(command: string) => {
    if (command === 'read_local_entry') return null as T;
    throw new Error('migration-write-failed');
  }), {
    getItem: async () => 'preserve-me',
    setItem: async () => undefined,
  });

  await assert.rejects(selected.getItem('glass-notes.owned-bottles.v1'), /migration-write-failed/);
});

test('removing a migrated key cannot resurrect its legacy value after restart', async () => {
  const host = new Map<string, string>(), legacy = new Map([['glass-notes.lab.v1', '{"old":true}']]);
  const bridge = runtime(true, async <T>(command: string, args?: Record<string, unknown>) => {
    const key = args!.key as string;
    if (command === 'read_local_entry') return (host.get(key) ?? null) as T;
    if (command === 'write_local_entry') host.set(key, args!.value as string);
    if (command === 'remove_local_entry') host.delete(key);
    return undefined as T;
  });
  const browser = {getItem: async (key: string) => legacy.get(key) ?? null,
    setItem: async (key: string, value: string) => { legacy.set(key, value); },
    removeItem: async (key: string) => { legacy.delete(key); }};
  const store = createPlatformStorage(bridge, browser);
  assert.equal(await store.getItem('glass-notes.lab.v1'), '{"old":true}');
  await store.removeItem!('glass-notes.lab.v1');
  assert.equal(await createPlatformStorage(bridge, browser).getItem('glass-notes.lab.v1'), null);
  assert.equal(legacy.has('glass-notes.lab.v1'), false);
});
