import assert from 'node:assert/strict';
import test from 'node:test';
import {BOTTLE_STORAGE_KEY, BottleOwnershipStore} from '../domain/bottles/ownership';

const allowed = new Set(['gin-a', 'rum-b']);
const stored = (ids: string[]) => JSON.stringify({schemaVersion: 1, ids});

test('slow bottle hydration blocks toggles instead of replacing unread ownership', async () => {
  let finish!: (raw: string | null) => void;
  const writes: string[] = [];
  const store = new BottleOwnershipStore(allowed, {
    getItem: () => new Promise(resolve => { finish = resolve; }),
    setItem: async (_key, value) => { writes.push(value); },
  });
  const loading = store.load();
  store.toggle('gin-a');
  finish(stored(['rum-b']));
  await loading;
  assert.deepEqual(store.getSnapshot().ids, ['rum-b']);
  assert.deepEqual(writes, []);
});

test('corrupt and unsupported bottle data remains unread and is never overwritten', async () => {
  for (const raw of ['{', JSON.stringify({schemaVersion: 2, ids: ['gin-a']}), JSON.stringify({schemaVersion: 1, ids: [], future: true}), stored(['x'.repeat(201)])]) {
    const writes: string[] = [];
    const store = new BottleOwnershipStore(allowed, {getItem: async () => raw, setItem: async (_key, value) => { writes.push(value); }});
    await store.load();
    assert.deepEqual(store.getSnapshot(), {ids: [], hydrated: false, error: 'read'});
    store.toggle('gin-a');
    assert.equal(await store.retrySave(), false);
    await store.whenSaved();
    assert.deepEqual(writes, []);
  }
});

test('unknown catalogue IDs survive known ownership changes and duplicate IDs normalize', async () => {
  let raw = stored(['retired-bottle', 'gin-a', 'retired-bottle']);
  const store = new BottleOwnershipStore(allowed, {
    getItem: async () => raw,
    setItem: async (key, value) => { assert.equal(key, BOTTLE_STORAGE_KEY); raw = value; },
  });
  await store.load();
  assert.deepEqual(store.getSnapshot().ids, ['gin-a']);
  store.toggle('rum-b');
  await store.whenSaved();
  assert.deepEqual(JSON.parse(raw).ids, ['gin-a', 'rum-b', 'retired-bottle']);
});

test('bottle snapshots cannot be mutated by consumers', async () => {
  const store = new BottleOwnershipStore(allowed, {getItem: async () => stored(['gin-a']), setItem: async () => undefined});
  await store.load();
  const snapshot = store.getSnapshot();
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.ids), true);
  assert.throws(() => (snapshot.ids as string[]).push('rum-b'));
  assert.deepEqual(store.getSnapshot().ids, ['gin-a']);
});

test('serialized bottle writes recover by retrying the same in-memory snapshot', async () => {
  let concurrent = 0;
  let maximum = 0;
  let attempts = 0;
  let raw = stored([]);
  const store = new BottleOwnershipStore(allowed, {
    getItem: async () => raw,
    setItem: async (_key, value) => {
      concurrent += 1; maximum = Math.max(maximum, concurrent);
      await new Promise(resolve => setTimeout(resolve, 4));
      concurrent -= 1;
      if (++attempts === 1) throw new Error('quota');
      raw = value;
    },
  });
  await store.load();
  store.toggle('gin-a');
  await store.whenSaved();
  assert.deepEqual(store.getSnapshot(), {ids: ['gin-a'], hydrated: true, error: 'write'});
  assert.equal(await store.retrySave(), true);
  assert.deepEqual(store.getSnapshot(), {ids: ['gin-a'], hydrated: true});
  assert.deepEqual(JSON.parse(raw).ids, ['gin-a']);
  assert.equal(maximum, 1);
});
