import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {catalogue} from '../content/catalogue';
import {parseFullBackup, serializeFullBackup} from '../domain/backup';
import {createSession, recipeSnapshot, updateSession} from '../domain/making';
import {fullBackupFromRaw} from './backupAdapter';
import {DESKTOP_COMMANDS, type DesktopRuntime} from './desktop-contract';
import {MakingStore, MAKING_STORAGE_KEY} from './makingStore';
import {GENERATION_KEY, JOURNAL_KEY, PERSONAL_KEYS, PersonalStorage} from './personalStorage';
import {createPlatformStorage} from './storageFactory';

test('completed desktop sessions reload from disk and survive full backup export alongside older records', async t => {
  const root = await mkdtemp(path.join(tmpdir(), 'glass-notes-making-test-'));
  t.after(() => rm(root, {recursive:true, force:true}));
  const allowed = new Set<string>([...Object.values(PERSONAL_KEYS), GENERATION_KEY, JOURNAL_KEY]);
  let refuseWrite = false;
  const runtime: DesktopRuntime = {
    isDesktop: () => true,
    async invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
      const key = String(args?.key);
      assert(allowed.has(key));
      const file = path.join(root, `${key}.json`);
      if (command === DESKTOP_COMMANDS.read) {
        try { return await readFile(file, 'utf8') as T; }
        catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null as T; throw error; }
      }
      assert.equal(command, DESKTOP_COMMANDS.write);
      if (refuseWrite) throw Error('test-disk-unavailable');
      await writeFile(file, String(args?.value));
      return undefined as T;
    },
  };
  const browser = {
    getItem: async () => null,
    setItem: async () => { throw Error('desktop must not fall back to browser storage'); },
  };
  const launch = async () => {
    const personal = new PersonalStorage(createPlatformStorage(runtime, browser));
    await personal.initialize();
    assert.equal(personal.getSnapshot().phase, 'ready');
    const making = new MakingStore(personal.createSession());
    await making.load();
    assert.equal(making.getSnapshot().hydrated, true);
    return {personal, making};
  };
  const recipe = recipeSnapshot(catalogue, 'negroni-iba')!;
  assert(recipe);
  const started = '2026-09-25T00:00:00.000Z';
  const finished = '2026-09-25T00:01:00.000Z';
  const first = await launch();
  assert.equal(await first.making.change(state => ({...state, sessions:[
    createSession(recipe, 'older-session', started), createSession(recipe, 'new-session', started),
  ]})), true);
  assert.equal(await first.making.change(state => ({...state, sessions:state.sessions.map(session =>
    session.id === 'new-session' ? updateSession(session, {completed:true}, finished) : session,
  )})), true);
  assert.equal(await first.making.whenSaved(), true);
  const saved = await readFile(path.join(root, `${MAKING_STORAGE_KEY}.json`), 'utf8');

  // New store, recovery coordinator and bridge adapter: no provider state carries over.
  const second = await launch();
  assert.deepEqual(second.making.getSnapshot().state, JSON.parse(saved));
  const backup = parseFullBackup(serializeFullBackup(fullBackupFromRaw(await second.personal.readAll(), 'zh', finished)));
  assert.equal(backup.schemaVersion, 3);
  assert.equal(Object.keys(backup.sections).length, 8);
  assert.deepEqual(backup.sections.making?.sessions.map(s => [s.id, s.completed]), [
    ['older-session', false], ['new-session', true],
  ]);
  assert.deepEqual(backup.sections.making?.sessions[1]?.recipe, recipe);

  refuseWrite = true;
  assert.equal(await second.making.change(state => ({...state, sessions:[...state.sessions,
    createSession(recipe, 'failed-session', started),
  ]})), false);
  assert.equal(await second.making.whenSaved(), false);
  assert.equal(await readFile(path.join(root, `${MAKING_STORAGE_KEY}.json`), 'utf8'), saved);
  const third = await launch();
  assert.deepEqual(third.making.getSnapshot().state, JSON.parse(saved));
});
