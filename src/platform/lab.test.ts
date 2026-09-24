import assert from 'node:assert/strict';
import test from 'node:test';
import {
  exportLabBackup,
  exportLabMarkdown,
  LAB_STORAGE_KEY,
  LabBackupError,
  LabMutationError,
  LabStore,
  parseLabBackup,
  utf8ByteLength,
  type LabBackup,
  type LabIngredient,
} from '../domain/lab';

const ingredient = (id = 'ingredient-1', name = 'Gin'): LabIngredient => ({id, name, amount: '30', unit: 'ml'});

function backup(projects: LabBackup['projects']): LabBackup {
  return {format: 'glass-notes-lab', schemaVersion: 1, exportedAt: '2026-09-08T12:00:00.000Z', projects};
}

async function loadedStore(initial: string | null = null) {
  let raw = initial;
  const writes: string[] = [];
  const store = new LabStore({
    getItem: async key => { assert.equal(key, LAB_STORAGE_KEY); return raw; },
    setItem: async (key, value) => { assert.equal(key, LAB_STORAGE_KEY); writes.push(value); raw = value; },
  });
  await store.load();
  return {store, writes, raw: () => raw};
}

test('a slow load blocks edits and cannot overwrite unread local data', async () => {
  let finish!: (value: string | null) => void;
  const writes: string[] = [];
  const store = new LabStore({
    getItem: () => new Promise(resolve => { finish = resolve; }),
    setItem: async (_key, value) => { writes.push(value); },
  });
  const loading = store.load();
  assert.throws(() => store.createProject({name: 'Too soon'}), (error: unknown) =>
    error instanceof LabMutationError && error.code === 'not-ready');
  finish(null);
  await loading;
  assert.equal(store.getSnapshot().hydrated, true);
  assert.deepEqual(writes, []);
});

test('read and corrupt-data failures keep hydration blocked and never write', async () => {
  for (const scenario of [
    {read: async () => { throw new Error('device unavailable'); }, error: 'read', available: false},
    {read: async () => '{broken', error: 'invalid-data', available: true},
  ] as const) {
    const writes: string[] = [];
    const store = new LabStore({getItem: scenario.read, setItem: async (_key, value) => { writes.push(value); }});
    await store.load();
    assert.deepEqual(store.getSnapshot(), {projects: [], hydrated: false, storageAvailable: scenario.available,
      error: scenario.error, saving: false});
    assert.throws(() => store.createProject({name: 'Must not save'}), (error: unknown) =>
      error instanceof LabMutationError && error.code === 'not-ready');
    await store.whenSaved();
    assert.deepEqual(writes, []);
  }
});

test('a failed read can be retried without losing the stored projects', async () => {
  let attempts = 0;
  const persisted = exportLabBackup([]);
  const store = new LabStore({
    getItem: async () => { if (++attempts === 1) throw new Error('temporarily locked'); return persisted; },
    setItem: async () => undefined,
  });
  await store.load();
  assert.equal(store.getSnapshot().error, 'read');
  await store.load();
  assert.deepEqual(store.getSnapshot(), {projects: [], hydrated: true, storageAvailable: true, saving: false});
});

test('project versions are independent and batches retain immutable recipe snapshots', async () => {
  const {store} = await loadedStore();
  const projectId = store.createProject({
    name: 'Martini study', goal: 'Compare dilution',
    source: {cocktailId: 'martini', versionId: 'martini-source', title: 'Martini', sourceTitle: 'Public recipe',
      url: 'https://example.test/martini', ingredients: [ingredient()], method: 'Stir.'},
  });
  const project = store.getSnapshot().projects[0]!;
  const firstId = project.versions[0]!.id;
  const secondId = store.addVersion(projectId, firstId);
  store.updateVersion(projectId, secondId, {name: 'Dry trial', ingredients: [ingredient('new-row', 'Dry gin')], method: 'Stir longer.'});
  const batchId = store.addBatch(projectId, secondId);
  store.updateVersion(projectId, secondId, {method: 'Stir briefly.', ingredients: [ingredient('third-row', 'Navy gin')]});
  const current = store.getSnapshot().projects[0]!;
  assert.equal(current.versions[0]!.method, 'Stir.');
  assert.equal(current.versions[1]!.method, 'Stir briefly.');
  assert.equal(current.batches.find(item => item.id === batchId)!.versionSnapshot.method, 'Stir longer.');
  assert.equal(current.batches.find(item => item.id === batchId)!.versionSnapshot.ingredients[0]!.name, 'Dry gin');
  assert.equal(Object.isFrozen(current.batches[0]!.versionSnapshot), true);
  assert.throws(() => store.deleteVersion(projectId, secondId), (error: unknown) =>
    error instanceof LabMutationError && error.code === 'version-in-use');
  store.deleteBatch(projectId, batchId);
  store.deleteVersion(projectId, secondId);
  assert.throws(() => store.deleteVersion(projectId, firstId), (error: unknown) =>
    error instanceof LabMutationError && error.code === 'last-version');
});

test('editable drafts can contain temporarily blank names and ingredient rows', async () => {
  const {store} = await loadedStore();
  const projectId = store.createProject({name: 'Draft'});
  const versionId = store.getSnapshot().projects[0]!.versions[0]!.id;
  store.updateProject(projectId, {name: ''});
  store.updateVersion(projectId, versionId, {name: '', ingredients: [{id: 'new-row', name: '', amount: '', unit: 'ml'}]});
  const batchId = store.addBatch(projectId, versionId);
  store.updateBatch(projectId, batchId, {name: ''});
  assert.equal(store.getSnapshot().projects[0]!.name, '');
  assert.equal(store.getSnapshot().projects[0]!.versions[0]!.ingredients[0]!.name, '');
});

test('deleting a project removes its versions and batches from persisted storage and a fresh load', async () => {
  const {store, raw} = await loadedStore();
  const keepId = store.createProject({name: 'Keep this'});
  const removeId = store.createProject({name: 'Delete this'});
  const removeVersionId = store.getSnapshot().projects.find(project => project.id === removeId)!.versions[0]!.id;
  store.addBatch(removeId, removeVersionId);
  await store.whenSaved();

  store.deleteProject(removeId);
  assert.deepEqual(store.getSnapshot().projects.map(project => project.id), [keepId]);
  await store.whenSaved();
  assert.deepEqual(parseLabBackup(raw()!).projects.map(project => project.id), [keepId]);

  const reloaded = new LabStore({getItem: async () => raw(), setItem: async () => undefined});
  await reloaded.load();
  assert.deepEqual(reloaded.getSnapshot().projects.map(project => project.id), [keepId]);
});

test('deletion queued during an in-flight save persists the final project list', async () => {
  let releaseFirst!: () => void;
  const firstBlocked = new Promise<void>(resolve => { releaseFirst = resolve; });
  const writes: string[] = [];
  const store = new LabStore({
    getItem: async () => null,
    setItem: async (_key, value) => { writes.push(value); if(writes.length === 1)await firstBlocked; },
  });
  await store.load();
  const removeId = store.createProject({name: 'Transient project'});
  store.deleteProject(removeId);
  assert.equal(store.getSnapshot().saving, true);
  releaseFirst();
  await store.whenSaved();
  assert.equal(store.saveStatus(), true);
  assert.deepEqual(parseLabBackup(writes.at(-1)!).projects, []);
});

test('a failed deletion save is visible and retry persists the session deletion', async () => {
  let fail = false;
  let persisted: string | null = null;
  const store = new LabStore({
    getItem: async () => null,
    setItem: async (_key, value) => { if(fail)throw new Error('storage unavailable'); persisted = value; },
  });
  await store.load();
  const removeId = store.createProject({name: 'Delete after first save'});
  await store.whenSaved();
  fail = true;
  store.deleteProject(removeId);
  await store.whenSaved();
  assert.deepEqual(store.getSnapshot().projects, []);
  assert.equal(store.getSnapshot().error, 'write');
  assert.equal(store.getSnapshot().storageAvailable, false);
  assert.equal(store.saveStatus(), false);
  assert.equal(parseLabBackup(persisted!).projects.length, 1);
  fail = false;
  assert.equal(await store.retrySave(), true);
  assert.deepEqual(parseLabBackup(persisted!).projects, []);
});

test('a stale deletion target cannot remove a different project', async () => {
  const {store} = await loadedStore();
  const staleId = store.createProject({name: 'First'});
  const keepId = store.createProject({name: 'Second'});
  store.deleteProject(staleId);
  const afterFirstDelete = store.getSnapshot().projects;
  assert.throws(() => store.deleteProject(staleId), (error: unknown) =>
    error instanceof LabMutationError && error.code === 'not-found');
  assert.equal(store.getSnapshot().projects, afterFirstDelete);
  assert.deepEqual(store.getSnapshot().projects.map(project => project.id), [keepId]);
});

test('rapid mutations save complete states in order and a failed write recovers', async () => {
  let activeWrites = 0;
  let maxActiveWrites = 0;
  let attempt = 0;
  let persisted: string | null = null;
  const store = new LabStore({
    getItem: async () => null,
    setItem: async (_key, value) => {
      activeWrites += 1;
      maxActiveWrites = Math.max(maxActiveWrites, activeWrites);
      await new Promise(resolve => setTimeout(resolve, 4));
      activeWrites -= 1;
      if (++attempt === 1) throw new Error('disk full');
      persisted = value;
    },
  });
  await store.load();
  const id = store.createProject({name: 'First'});
  store.updateProject(id, {name: 'Final'});
  assert.equal(store.saveStatus(), false);
  await store.whenSaved();
  assert.equal(maxActiveWrites, 1);
  assert.equal(store.getSnapshot().storageAvailable, true);
  assert.equal(store.getSnapshot().error, undefined);
  assert.equal(parseLabBackup(persisted!).projects[0]!.name, 'Final');
});

test('twenty rapid edits coalesce to the active write and latest complete snapshot', async () => {
  let releaseFirst!: () => void;
  const firstBlocked = new Promise<void>(resolve => { releaseFirst = resolve; });
  const writes: string[] = [];
  const store = new LabStore({
    getItem: async () => null,
    setItem: async (_key, value) => {
      writes.push(value);
      if (writes.length === 1) await firstBlocked;
    },
  });
  await store.load();
  const id = store.createProject({name: 'Draft 0'});
  for (let index = 1; index <= 20; index += 1) store.updateProject(id, {name: `Draft ${index}`});
  assert.equal(store.getSnapshot().saving, true);
  assert.equal(store.saveStatus(), false);
  assert.equal(writes.length, 1);
  releaseFirst();
  await store.whenSaved();
  assert.equal(writes.length <= 2, true);
  assert.equal(parseLabBackup(writes.at(-1)!).projects[0]!.name, 'Draft 20');
  assert.equal(store.getSnapshot().saving, false);
  assert.equal(store.saveStatus(), true);
});

test('a failed save keeps session data and retrySave persists the same memory snapshot', async () => {
  let attempts = 0;
  let persisted: string | null = null;
  const store = new LabStore({
    getItem: async () => null,
    setItem: async (_key, value) => { if (++attempts === 1) throw new Error('quota'); persisted = value; },
  });
  await store.load();
  const id = store.createProject({name: 'Still in memory'});
  await store.whenSaved();
  assert.equal(store.getSnapshot().projects[0]!.id, id);
  assert.equal(store.getSnapshot().error, 'write');
  assert.equal(store.getSnapshot().storageAvailable, false);
  assert.equal(store.saveStatus(), false);
  assert.equal(await store.retrySave(), true);
  assert.equal(store.getSnapshot().error, undefined);
  assert.equal(store.getSnapshot().storageAvailable, true);
  assert.equal(store.saveStatus(), true);
  assert.equal(store.getSnapshot().projects[0]!.name, 'Still in memory');
  assert.equal(parseLabBackup(persisted!).projects[0]!.name, 'Still in memory');
});

test('retrySave cannot bypass unsuccessful hydration', async () => {
  const store = new LabStore({getItem: async () => { throw new Error('unreadable'); }, setItem: async () => undefined});
  await store.load();
  await assert.rejects(store.retrySave(), (error: unknown) => error instanceof LabMutationError && error.code === 'not-ready');
});

test('retrySave waits for a newer queued edit and reports its failure', async () => {
  let attempt = 0;
  let releaseRetry!: () => void;
  const retryBlocked = new Promise<void>(resolve => { releaseRetry = resolve; });
  const store = new LabStore({
    getItem: async () => null,
    setItem: async () => {
      attempt += 1;
      if (attempt === 1) throw new Error('initial failure');
      if (attempt === 2) await retryBlocked;
      if (attempt === 3) throw new Error('newer failure');
    },
  });
  await store.load();
  const id = store.createProject({name: 'Initial'});
  await store.whenSaved();
  const retrying = store.retrySave();
  store.updateProject(id, {name: 'Newer'});
  releaseRetry();
  assert.equal(await retrying, false);
  assert.equal(store.getSnapshot().projects[0]!.name, 'Newer');
  assert.equal(store.getSnapshot().saving, false);
  assert.equal(store.getSnapshot().error, 'write');
});

test('backup parsing rejects malformed, foreign, incomplete, duplicate, oversized, and unsafe data', () => {
  const cases: Array<[string, LabBackupError['code']]> = [
    ['{', 'invalid-json'],
    [JSON.stringify({format: 'someone-else', schemaVersion: 1, exportedAt: '2026-09-08T12:00:00Z', projects: []}), 'invalid-format'],
    [JSON.stringify({format: 'glass-notes-lab', schemaVersion: 2, exportedAt: '2026-09-08T12:00:00Z', projects: []}), 'unsupported-version'],
    [JSON.stringify({format: 'glass-notes-lab', schemaVersion: 1, exportedAt: '2026-09-08T12:00:00Z'}), 'invalid-data'],
    [JSON.stringify({...backup([]), exportedAt: 'September 8, 2026'}), 'invalid-data'],
    [JSON.stringify({...backup([]), projects: Array.from({length: 501}, () => null)}), 'invalid-data'],
    [JSON.stringify({...backup([]), projects: [{id: 'p', name: 'x', goal: '', createdAt: '2026-09-08T12:00:00Z', updatedAt: '2026-09-08T12:00:00Z', versions: [{id: 'v', name: 'v1', createdAt: '2026-09-08T12:00:00Z', updatedAt: '2026-09-08T12:00:00Z', ingredients: [{id: 'i', name: 'Gin', amount: '1e999', unit: 'ml'}], method: '', notes: ''}], batches: []}]}), 'invalid-data'],
    ['{"format":"glass-notes-lab","schemaVersion":1,"exportedAt":"2026-09-08T12:00:00Z","projects":[],"__proto__":{}}', 'unsafe-key'],
  ];
  for (const [raw, code] of cases) assert.throws(() => parseLabBackup(raw), (error: unknown) =>
    error instanceof LabBackupError && error.code === code);

  const duplicate = {
    id: 'project', name: 'Study', goal: '', createdAt: '2026-09-08T12:00:00Z', updatedAt: '2026-09-08T12:00:00Z',
    versions: [{id: 'v1', name: 'v1', createdAt: '2026-09-08T12:00:00Z', updatedAt: '2026-09-08T12:00:00Z', ingredients: [], method: '', notes: ''}], batches: [],
  };
  assert.throws(() => parseLabBackup(JSON.stringify(backup([duplicate, duplicate]))), (error: unknown) =>
    error instanceof LabBackupError && error.code === 'invalid-data');
});

test('UTF-8 backup limits count multibyte and malformed surrogate input portably', () => {
  assert.equal(utf8ByteLength('abc'), 3);
  assert.equal(utf8ByteLength('é'), 2);
  assert.equal(utf8ByteLength('🍸'), 4);
  assert.equal(utf8ByteLength('\ud800'), 3);
  assert.throws(() => parseLabBackup('你'.repeat(1_666_667)), (error: unknown) =>
    error instanceof LabBackupError && error.code === 'invalid-data');
});

test('invalid imports are atomic and valid imports remap every colliding reference', async () => {
  const {store} = await loadedStore();
  const existingId = store.createProject({name: 'Existing'});
  const existing = store.getSnapshot().projects[0]!;
  const version = existing.versions[0]!;
  const batchId = store.addBatch(existingId, version.id);
  await store.whenSaved();
  const source = structuredClone(store.getSnapshot().projects[0]!);
  source.name = 'Imported copy';
  const importedBackup = backup([source]);
  store.importBackup(importedBackup);
  const projects = store.getSnapshot().projects;
  assert.equal(projects.length, 2);
  assert.notEqual(projects[1]!.id, existingId);
  assert.notEqual(projects[1]!.versions[0]!.id, version.id);
  assert.notEqual(projects[1]!.batches[0]!.id, batchId);
  assert.equal(projects[1]!.batches[0]!.versionId, projects[1]!.versions[0]!.id);
  assert.equal(projects[1]!.batches[0]!.versionSnapshot.id, projects[1]!.versions[0]!.id);

  const before = store.getSnapshot();
  const incomplete = structuredClone(importedBackup) as unknown as Record<string, unknown>;
  delete (incomplete.projects as Array<Record<string, unknown>>)[0]!.versions;
  assert.throws(() => store.importBackup(incomplete as unknown as LabBackup), LabBackupError);
  assert.equal(store.getSnapshot(), before);
});

test('JSON and Markdown exports round-trip complete private project data locally', async () => {
  const {store} = await loadedStore();
  const projectId = store.createProject({name: 'Cacao #1\nInjected heading', goal: 'Keep *dry* notes'});
  const versionId = store.getSnapshot().projects[0]!.versions[0]!.id;
  store.updateVersion(projectId, versionId, {ingredients: [ingredient()], method: 'Stir\nthen strain', notes: 'Private [note]'});
  const json = exportLabBackup(store.getSnapshot().projects);
  assert.deepEqual(parseLabBackup(json).projects, store.getSnapshot().projects);
  const markdown = exportLabMarkdown(store.getSnapshot().projects);
  assert.match(markdown, /# Glass Notes Lab/);
  assert.equal(markdown.includes('Cacao \\#1 Injected heading'), true);
  assert.equal(markdown.includes('## Injected heading'), false);
  assert.equal(markdown.includes('Keep \\*dry\\* notes'), true);
  assert.equal(markdown.includes('Private \\[note\\]'), true);
});
