import assert from 'node:assert/strict';
import test from 'node:test';
import {FavoritesStore, parseFavorites, parseFavoritesState} from '../domain/favorites';

const allowed = new Set(['negroni-iba', 'martini-iba', 'martini-book']);
const encode = (versionIds: string[]) => JSON.stringify({version: 1, versionIds});

test('favorites parse safely, normalize legacy duplicates, and retain distinct versions of one drink', () => {
  assert.deepEqual(parseFavorites(encode(['martini-book', 'gone', 'martini-iba', 'martini-book']), allowed), ['martini-book', 'martini-iba']);
  assert.deepEqual(parseFavoritesState(encode(['martini-book','martini-book','gone'])),{version:2,versionIds:['martini-book','gone'],lists:[]});
  assert.deepEqual(parseFavorites(JSON.stringify({version:2,versionIds:['negroni-iba'],lists:[]}),allowed),['negroni-iba']);
  for (const value of ['{', 'null', '[]', '{"version":2,"versionIds":["negroni-iba"]}', '{"version":1,"versionIds":{}}']) assert.deepEqual(parseFavorites(value, allowed), []);
});

test('slow hydration replays save/remove intent without toggling a stored favorite off', async () => {
  let finish!: (raw: string) => void;
  let raw=encode(['negroni-iba', 'martini-iba', 'martini-book']);
  let reads=0;
  const writes: string[] = [];
  const store = new FavoritesStore(allowed, {
    getItem: () => ++reads===1?new Promise(resolve => {finish = resolve;}):Promise.resolve(raw),
    setItem: async (_key, value) => {writes.push(value);raw=value;},
  });
  const loading = store.load();
  store.toggle('negroni-iba');
  store.toggle('martini-iba');
  store.toggle('martini-iba');
  store.set('unknown', true);
  finish(raw);
  await loading;
  await store.whenSaved();
  assert.deepEqual(store.getSnapshot().versionIds, ['negroni-iba', 'martini-book']);
  assert.equal(store.getSnapshot().saving,false);
  assert.equal(writes.length, 1);
  assert.deepEqual(JSON.parse(writes[0]!),{version:2,versionIds:['negroni-iba','martini-book'],lists:[]});
});

test('rapid changes write in order and reload the final exact version', async () => {
  let raw = encode([]);
  const writes: string[] = [];
  const storage = {getItem: async () => raw, setItem: async (_key: string, value: string) => {await new Promise(resolve => setTimeout(resolve, 4)); writes.push(value); raw = value;}};
  const store = new FavoritesStore(allowed, storage);
  await store.load();
  store.toggle('martini-iba'); store.toggle('martini-book'); store.toggle('martini-iba');
  assert.equal(store.getSnapshot().saving,true);
  await store.whenSaved();
  assert.deepEqual(writes.map(value => JSON.parse(value).versionIds), [['martini-iba'], ['martini-book', 'martini-iba'], ['martini-book']]);
  const reopened = new FavoritesStore(allowed, storage);
  await reopened.load();
  assert.deepEqual(reopened.getSnapshot().versionIds, ['martini-book']);
  assert.equal(reopened.getSnapshot().saving,false);
});

test('failed reads preserve unread favorites and retry before merging local intentions', async () => {
  let failRead!: (error: Error) => void;
  let readCount = 0;
  let raw = encode(['martini-book']);
  const writes: string[] = [];
  const store = new FavoritesStore(allowed, {getItem: async () => ++readCount === 1 ? new Promise<string | null>((_resolve, reject) => {failRead = reject;}) : raw,
    setItem: async (_key, value) => {writes.push(value); raw = value;}});
  const loading = store.load();
  store.toggle('negroni-iba');
  failRead(new Error('transient read failure'));
  await loading; await store.whenSaved();
  assert.deepEqual(writes, []);
  assert.equal(store.getSnapshot().storageAvailable, false);
  assert.equal(store.getSnapshot().hydrated, false);
  assert.equal(store.getSnapshot().error, 'read');
  store.toggle('martini-iba');
  assert.equal(readCount, 1);
  assert.equal(await store.retry(), true); await store.whenSaved();
  assert.deepEqual(store.getSnapshot().versionIds, ['martini-iba', 'negroni-iba', 'martini-book']);
  assert.equal(store.getSnapshot().storageAvailable, true);
  assert.deepEqual(JSON.parse(writes[0]!),{version:2,versionIds:['martini-iba','negroni-iba','martini-book'],lists:[]});
});

test('failed saves retain session favorites and recover through explicit exact-readback retry', async () => {
  let attempts = 0;
  let raw:string|null=null;
  const store = new FavoritesStore(allowed, {getItem: async () => raw, setItem: async (_key,value) => {if (++attempts === 1) throw new Error('quota');raw=value;}});
  await store.load(); await store.whenSaved();
  assert.equal(attempts, 0);
  assert.equal(store.getSnapshot().storageAvailable, true);
  store.toggle('negroni-iba'); await store.whenSaved();
  assert.equal(store.getSnapshot().storageAvailable, false);
  assert.equal(store.getSnapshot().error, 'write');
  assert.deepEqual(store.getSnapshot().versionIds, ['negroni-iba']);
  assert.equal(await store.retry(), true);
  assert.equal(store.getSnapshot().storageAvailable, true);
  assert.equal(store.getSnapshot().error, undefined);
  assert.deepEqual(store.getSnapshot().versionIds, ['negroni-iba']);
  assert.deepEqual(parseFavoritesState(raw),{version:2,versionIds:['negroni-iba'],lists:[]});
});

test('valid JSON with a malformed favorites envelope stays unread and cannot be overwritten', async () => {
  for (const raw of ['null', '{}', '[]', '{"version":2,"versionIds":[]}', '{"version":1,"versionIds":[null]}','{"version":2,"versionIds":["x","x"],"lists":[]}']) {
    const writes: string[] = [];
    const store = new FavoritesStore(allowed, {
      getItem: async () => raw,
      setItem: async (_key, value) => { writes.push(value); },
    });
    await store.load();
    store.set('negroni-iba', true);
    await store.whenSaved();
    assert.equal(store.getSnapshot().hydrated, false, raw);
    assert.equal(store.getSnapshot().error, 'read', raw);
    assert.deepEqual(writes, [], raw);
  }
});

test('unknown legacy favorite ids stay visible separately and survive the first real v2 write',async()=>{
  let raw=encode(['future-version','martini-iba']);
  const store=new FavoritesStore(allowed,{getItem:async()=>raw,setItem:async(_key,value)=>{raw=value;}});
  await store.load();
  assert.deepEqual(store.getSnapshot().versionIds,['martini-iba']);
  assert.deepEqual(store.getSnapshot().unknownVersionIds,['future-version']);
  assert.equal(raw,encode(['future-version','martini-iba']),'read-only hydration must not migrate');
  store.set('negroni-iba',true);await store.whenSaved();
  assert.deepEqual(parseFavoritesState(raw).versionIds,['negroni-iba','future-version','martini-iba']);
});
