import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from '../content/catalogue';
import {FavoritesStore, favoriteVersionIds, parseFavoritesState} from '../domain/favorites';
import {parseFullBackup, planRestore, serializeFullBackup, type RestoreChoice} from '../domain/backup';
import {PersonalStorage, PERSONAL_KEYS, JOURNAL_KEY} from './personalStorage';
import {fullBackupFromRaw, rawAfterRestore} from './backupAdapter';
import type {LocalKeyValueStorage} from './desktop-contract';

const now = '2026-09-17T04:00:00.000Z';
const choice: RestoreChoice = {mode: 'replace', sections: ['favorites'], preferenceFields: []};

async function fixture() {
  const values = new Map<string, string>();
  const raw: LocalKeyValueStorage = {
    getItem: async key => values.get(key) ?? null,
    setItem: async (key, value) => { values.set(key, value); },
    removeItem: async key => { values.delete(key); },
  };
  const recovery = new PersonalStorage(raw);
  await recovery.initialize();
  const favorites = new FavoritesStore(favoriteVersionIds(catalogue), recovery.createSession(), catalogue);
  await favorites.load();
  const version = catalogue.versions[0]!;
  assert.equal((await favorites.createList({id: 'qa-private-list', name: '周末两杯', now, versionId: version.id})).status, 'saved');
  return {values, raw, recovery, favorites, version};
}

test('old favorites replacement through the actual recovery journal preserves saved list snapshots', async () => {
  const {recovery, favorites} = await fixture();
  const before = await recovery.readAll();
  const current = fullBackupFromRaw(before, 'zh', now);
  const legacy = {...current, sections: {...current.sections, favorites: {schemaVersion: 1 as const, versionIds: ['future-unavailable-version']}}};
  const incoming = parseFullBackup(serializeFullBackup(legacy));
  const plan = planRestore({sections: current.sections, references: current.references}, incoming, choice);
  await recovery.restore(before, rawAfterRestore(before, plan, choice));
  const restored = parseFavoritesState((await recovery.readAll()).favorites);
  assert.deepEqual(restored.lists, parseFavoritesState(before.favorites).lists);
  assert.deepEqual(restored.versionIds, ['future-unavailable-version']);
  assert.equal(recovery.getSnapshot().notice, 'restored');
  // A provider mounted before restoration cannot write its old generation back.
  assert.equal((await favorites.renameList('qa-private-list', 'stale edit', now)).status, 'write-failed');
  assert.deepEqual(parseFavoritesState((await recovery.readAll()).favorites), restored);
});

test('a failed reference write rolls back exact v2 bytes; retry restores lists without new keys', async () => {
  const {values, raw, recovery, favorites} = await fixture();
  favorites.set(catalogue.versions[0]!.id, true);
  await favorites.whenSaved();
  const before = await recovery.readAll();
  const current = fullBackupFromRaw(before, 'en', now);
  const incoming = structuredClone(current);
  assert.equal(incoming.sections.favorites.schemaVersion, 2);
  if (incoming.sections.favorites.schemaVersion !== 2) throw new Error('expected favorites v2 export');
  incoming.sections.favorites.lists[0]!.name = 'Restored weekend';
  incoming.sections.favorites.versionIds = [];
  const plan = planRestore({sections: current.sections, references: current.references}, incoming, choice);
  const after = rawAfterRestore(before, plan, choice);
  // Force a later participant write after the favorites payload was applied.
  after.references = JSON.stringify(plan.next.references);
  let injected = false;
  const failing = new PersonalStorage({...raw, setItem: async (key, value) => {
    if (key === PERSONAL_KEYS.references && value === after.references && !injected) {
      injected = true;
      throw new Error('qa-reference-write-failed');
    }
    await raw.setItem(key, value);
  }});
  await failing.initialize();
  await assert.rejects(failing.restore(before, after), /qa-reference-write-failed/);
  assert.equal(injected, true);
  assert.deepEqual(await failing.readAll(), before);
  assert.equal(values.has(JOURNAL_KEY), false);
  await failing.restore(before, after);
  const restored = parseFavoritesState((await failing.readAll()).favorites);
  assert.equal(restored.lists[0]!.name, 'Restored weekend');
  assert.deepEqual(restored.lists[0]!.items, parseFavoritesState(before.favorites).lists[0]!.items);
  assert.deepEqual(restored.versionIds, []);
  assert.equal(values.has(JOURNAL_KEY), false);
  const allowed = new Set<string>([...Object.values(PERSONAL_KEYS), 'glass-notes.storage-generation.v1']);
  assert([...values.keys()].every(key => allowed.has(key)));
});

test('v2 lists explicitly cleared by restore do not remove unselected stored sections', async () => {
  const {raw, recovery} = await fixture();
  await raw.setItem(PERSONAL_KEYS.pantry, '{"ingredientIds":[],"brandsByIngredient":{}}');
  const before = await recovery.readAll();
  const current = fullBackupFromRaw(before, 'en', now);
  const incoming = {...current, sections: {...current.sections, favorites: {schemaVersion: 2 as const, versionIds: [], lists: []}}};
  const plan = planRestore({sections: current.sections, references: current.references}, incoming, choice);
  assert(plan.preview.find(row => row.section === 'favorites')!.removed > 0);
  await recovery.restore(before, rawAfterRestore(before, plan, choice));
  const after = await recovery.readAll();
  assert.deepEqual(parseFavoritesState(after.favorites).lists, []);
  for (const name of Object.keys(before) as Array<keyof typeof before>) {
    if (name !== 'favorites' && name !== 'references') assert.equal(after[name], before[name]);
  }
});
