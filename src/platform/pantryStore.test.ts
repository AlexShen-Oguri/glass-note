/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';
import type {Pantry} from '../domain/ingredients';
import {PantryStore} from './pantryStore';

const key = 'glass-notes.pantry.v1';
const parse = (raw: string | null): Pantry => {
  if (raw === null) return {ingredientIds: [], brandsByIngredient: {}};
  const value = JSON.parse(raw) as Partial<Pantry>;
  return {ingredientIds: value.ingredientIds ?? [], brandsByIngredient: value.brandsByIngredient ?? {}};
};

test('failed pantry reads stay unhydrated and retry merges pending intent over stored data', async () => {
  let reads = 0;
  let raw = JSON.stringify({ingredientIds: ['gin'], brandsByIngredient: {gin: ['brand-a']}});
  const writes: string[] = [];
  const store = new PantryStore({
    getItem: async actualKey => {
      assert.equal(actualKey, key);
      if (++reads === 1) throw new Error('temporarily-unreadable');
      return raw;
    },
    setItem: async (actualKey, value) => {
      assert.equal(actualKey, key);
      writes.push(value);
      raw = value;
    },
  }, key, parse);

  const firstLoad = store.load();
  store.change(value => ({...value, ingredientIds: [...value.ingredientIds, 'lime']}));
  await firstLoad;
  assert.deepEqual(store.getSnapshot(), {
    pantry: {ingredientIds: ['lime'], brandsByIngredient: {}},
    hydrated: false,
    storageAvailable: false,
    error: 'read',
  });
  assert.deepEqual(writes, []);

  assert.equal(await store.retry(), true);
  await store.whenSaved();
  assert.deepEqual(store.getSnapshot(), {
    pantry: {ingredientIds: ['gin', 'lime'], brandsByIngredient: {gin: ['brand-a']}},
    hydrated: true,
    storageAvailable: true,
  });
  assert.deepEqual(JSON.parse(writes[0]!), store.getSnapshot().pantry);
});

test('failed pantry writes retain the full session snapshot and explicit retry persists it', async () => {
  let fail = true;
  let raw: string | null = null;
  const store = new PantryStore({
    getItem: async () => raw,
    setItem: async (_key, value) => {
      if (fail) throw new Error('disk-full');
      raw = value;
    },
  }, key, parse);

  await store.load();
  store.change(() => ({ingredientIds: ['rum'], brandsByIngredient: {rum: ['brand-b']}}));
  await store.whenSaved();
  assert.deepEqual(store.getSnapshot(), {
    pantry: {ingredientIds: ['rum'], brandsByIngredient: {rum: ['brand-b']}},
    hydrated: true,
    storageAvailable: false,
    error: 'write',
  });
  assert.equal(raw, null);

  fail = false;
  assert.equal(await store.retry(), true);
  assert.deepEqual(JSON.parse(raw!), {ingredientIds: ['rum'], brandsByIngredient: {rum: ['brand-b']}});
  assert.equal(store.getSnapshot().error, undefined);
});

test('malformed pantry envelopes remain unread and are never replaced by pending edits', async () => {
  for (const raw of [
    'null', '{}', '[]', '{"ingredientIds":{}}', '{"ingredientIds":[null]}',
    '{"ingredientIds":["gin"],"brandsByIngredient":[]}',
    '{"ingredientIds":["gin"],"brandsByIngredient":{"gin":"brand-a"}}',
  ]) {
    const writes: string[] = [];
    const store = new PantryStore({
      getItem: async () => raw,
      setItem: async (_key, value) => { writes.push(value); },
    }, key, parse);
    await store.load();
    store.change(value => ({...value, ingredientIds: ['lime']}));
    await store.whenSaved();
    assert.equal(store.getSnapshot().hydrated, false, raw);
    assert.equal(store.getSnapshot().error, 'read', raw);
    assert.deepEqual(writes, [], raw);
  }
});

test('the legacy pantry envelope without a brand map remains compatible', async () => {
  const store = new PantryStore({
    getItem: async () => '{"ingredientIds":["gin"]}',
    setItem: async () => undefined,
  }, key, parse);
  await store.load();
  assert.deepEqual(store.getSnapshot(), {
    pantry: {ingredientIds: ['gin'], brandsByIngredient: {}},
    hydrated: true,
    storageAvailable: true,
  });
});
