import assert from 'node:assert/strict';
import test from 'node:test';

import {parsePrivateRecipeBook} from '.';
import type {PrivateRecipeContent} from './types';
import {PrivateRecipeMutationError, PrivateRecipeStore} from '../../platform/privateRecipeStore';
import type {LocalKeyValueStorage} from '../../platform/desktop-contract';

function content(title: string): PrivateRecipeContent {
  return {title, description: '', servings: 1, ingredients: [{id: 'row', name: 'Gin', amount: '2', unit: 'oz'}], steps: ['Stir'], method: '', glass: '', garnish: '', notes: ''};
}

function memoryStorage(initial: string | null = null) {
  let value = initial;
  let failRead = false;
  let failWrite = false;
  const storage: LocalKeyValueStorage = {
    getItem: async () => { if (failRead) throw new Error('read'); return value; },
    setItem: async (_key, next) => { if (failWrite) throw new Error('write'); value = next; },
  };
  return {storage, value: () => value, setFailRead: (next: boolean) => { failRead = next; }, setFailWrite: (next: boolean) => { failWrite = next; }};
}

function storeFor(storage: LocalKeyValueStorage) {
  let id = 0;
  let minute = 0;
  return new PrivateRecipeStore(storage, {
    id: kind => `${kind}-${++id}`,
    now: () => `2026-09-10T12:${String(minute++).padStart(2, '0')}:00Z`,
  });
}

test('private recipe store requires hydration, appends revisions, and deletes only after explicit mutation', async () => {
  const memory = memoryStorage();
  const store = storeFor(memory.storage);
  assert.throws(() => store.createOriginal(content('First')), (error: unknown) => error instanceof PrivateRecipeMutationError && error.code === 'not-ready');
  await store.load();
  const recipeId = store.createOriginal(content('First'));
  await store.whenSaved();
  const revisionId = store.saveRevision(recipeId, content('Second'));
  await store.whenSaved();
  const recipe = store.getSnapshot().recipes[0]!;
  assert.equal(recipe.revisions.length, 2);
  assert.equal(recipe.activeRevisionId, revisionId);
  assert.equal(recipe.revisions[1]?.derivedFromRevisionId, recipe.revisions[0]?.id);
  assert.throws(() => store.saveRevision(recipeId, content('Second')), (error: unknown) => error instanceof PrivateRecipeMutationError && error.code === 'no-change');
  store.delete(recipeId);
  await store.whenSaved();
  assert.deepEqual(parsePrivateRecipeBook(memory.value()).recipes, []);
});

test('read failures remain unhydrated and can retry without claiming an empty collection', async () => {
  const memory = memoryStorage();
  memory.setFailRead(true);
  const store = storeFor(memory.storage);
  await store.load();
  assert.deepEqual(store.getSnapshot(), {recipes: [], hydrated: false, storageAvailable: false, saving: false, error: 'read'});
  memory.setFailRead(false);
  assert.equal(await store.retry(), true);
  assert.equal(store.getSnapshot().hydrated, true);
});

test('failed writes retain session revisions and retry the exact current book', async () => {
  const memory = memoryStorage();
  const store = storeFor(memory.storage);
  await store.load();
  memory.setFailWrite(true);
  store.createOriginal(content('Session recipe'));
  assert.equal(await store.whenSaved(), false);
  assert.equal(store.getSnapshot().recipes.length, 1);
  assert.equal(store.getSnapshot().storageAvailable, false);
  memory.setFailWrite(false);
  assert.equal(await store.retry(), true);
  assert.equal(parsePrivateRecipeBook(memory.value()).recipes[0]?.revisions[0]?.content.title, 'Session recipe');
});

test('failed edits and deletions retry the current mutation without duplicating revisions', async () => {
  const memory = memoryStorage();
  const store = storeFor(memory.storage);
  await store.load();
  const recipeId = store.createOriginal(content('First'));
  assert.equal(await store.whenSaved(), true);

  memory.setFailWrite(true);
  const firstRevisionId = store.getSnapshot().recipes[0]!.activeRevisionId;
  const editedRevisionId = store.saveRevision(recipeId, content('Edited'), firstRevisionId);
  assert.equal(await store.whenSaved(), false);
  assert.equal(store.getSnapshot().recipes[0]!.revisions.length, 2);
  memory.setFailWrite(false);
  assert.equal(await store.retry(), true);
  const persistedEdit = parsePrivateRecipeBook(memory.value()).recipes[0]!;
  assert.equal(persistedEdit.revisions.length, 2);
  assert.equal(persistedEdit.activeRevisionId, editedRevisionId);
  assert.equal(persistedEdit.revisions[1]!.derivedFromRevisionId, firstRevisionId);

  memory.setFailWrite(true);
  store.delete(recipeId);
  assert.equal(await store.whenSaved(), false);
  assert.deepEqual(store.getSnapshot().recipes, []);
  memory.setFailWrite(false);
  assert.equal(await store.retry(), true);
  assert.deepEqual(parsePrivateRecipeBook(memory.value()).recipes, []);
});

test('saving from an older revision appends history with that revision as its parent', async () => {
  const memory = memoryStorage();
  const store = storeFor(memory.storage);
  await store.load();
  const recipeId = store.createOriginal(content('First'));
  await store.whenSaved();
  const firstRevisionId = store.getSnapshot().recipes[0]!.activeRevisionId;
  store.saveRevision(recipeId, content('Second'));
  await store.whenSaved();
  const derivedId = store.saveRevision(recipeId, content('First, revisited'), firstRevisionId);
  assert.equal(await store.whenSaved(), true);
  const recipe = store.getSnapshot().recipes[0]!;
  assert.equal(recipe.revisions.length, 3);
  assert.equal(recipe.activeRevisionId, derivedId);
  assert.equal(recipe.revisions[2]!.derivedFromRevisionId, firstRevisionId);
  assert.equal(recipe.revisions[0]!.content.title, 'First');
});
