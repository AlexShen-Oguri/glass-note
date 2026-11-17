import test from 'node:test';
import assert from 'node:assert/strict';
import {PersonalStorage,PERSONAL_KEYS,JOURNAL_KEY,GENERATION_KEY,type RawPersonalData} from './personalStorage';
import type {LocalKeyValueStorage} from './desktop-contract';
import {PrivateRecipeStore} from './privateRecipeStore';
import {parsePrivateRecipeBook} from '../domain/private-recipes';

function fixture(){const values=new Map<string,string>();const before=Object.fromEntries(Object.entries(PERSONAL_KEYS).map(([name,key],i)=>{const value=i%2?null:JSON.stringify({name,amount:'1.234500',note:'青柠'});if(value!==null)values.set(key,value);return [name,value];})) as RawPersonalData;const after=Object.fromEntries(Object.keys(PERSONAL_KEYS).map(name=>[name,JSON.stringify({name,value:'new'})])) as RawPersonalData;return {values,before,after};}
function adapter(values:Map<string,string>,mutation?:(key:string,value:string|null,apply:()=>void)=>void):LocalKeyValueStorage{return {getItem:async key=>values.get(key)??null,setItem:async(key,value)=>{const apply=()=>{values.set(key,value);};mutation?mutation(key,value,apply):apply();},removeItem:async key=>{const apply=()=>{values.delete(key);};mutation?mutation(key,null,apply):apply();}};}
const rawData=(values:Map<string,string>)=>Object.fromEntries(Object.entries(PERSONAL_KEYS).map(([name,key])=>[name,values.get(key)??null]));

test('restore preserves unselected exact strings/null and expires old provider writers',async()=>{const {values,before,after}=fixture();const store=new PersonalStorage(adapter(values));await store.initialize();const old=store.createSession();await store.restore(before,{lab:after.lab});assert.equal(values.get(PERSONAL_KEYS.lab),after.lab);assert.equal(values.get(PERSONAL_KEYS.preferences),before.preferences);assert.equal(values.has(PERSONAL_KEYS.favorites),false);await assert.rejects(old.setItem(PERSONAL_KEYS.lab,'{}'),/expired/);assert.equal(values.get(PERSONAL_KEYS.lab),after.lab);assert.equal(values.has(JOURNAL_KEY),false);});

test('stale preview is rejected before data writes',async()=>{const {values,before,after}=fixture();const store=new PersonalStorage(adapter(values));await store.initialize();values.set(PERSONAL_KEYS.lab,'{"newEdit":true}');await assert.rejects(store.restore(before,after),/stale/);assert.equal(values.get(PERSONAL_KEYS.lab),'{"newEdit":true}');assert.equal(values.has(JOURNAL_KEY),false);});

test('a failed middle write restores exact original strings and absent keys',async()=>{const {values,before,after}=fixture();let failed=false;const store=new PersonalStorage(adapter(values,(key,value,apply)=>{if(key===PERSONAL_KEYS.bottles&&value===after.bottles&&!failed){failed=true;throw Error('disk-full');}apply();}));await store.initialize();await assert.rejects(store.restore(before,after),/disk-full/);assert.deepEqual(rawData(values),before);assert.equal(store.getSnapshot().notice,'rolled-back');assert.equal(values.has(JOURNAL_KEY),false);});

test('failed rollback blocks writers, and startup resumes recovery',async()=>{const {values,before,after}=fixture();let failed=false;let rollbackFailed=false;const store=new PersonalStorage(adapter(values,(key,value,apply)=>{if(key===PERSONAL_KEYS.bottles&&value===after.bottles&&!failed){failed=true;throw Error('write-failed');}if(failed&&key===PERSONAL_KEYS.favorites&&!rollbackFailed){rollbackFailed=true;throw Error('rollback-failed');}apply();}));await store.initialize();await assert.rejects(store.restore(before,after));assert.equal(store.getSnapshot().phase,'blocked');assert(values.has(JOURNAL_KEY));await assert.rejects(store.createSession().setItem(PERSONAL_KEYS.favorites,'{}'));const restarted=new PersonalStorage(adapter(values));await restarted.initialize();assert.equal(restarted.getSnapshot().phase,'ready');assert.deepEqual(rawData(values),before);});

test('interruption after every mutation recovers a whole generation on next startup',async()=>{
  const baseline=fixture();let mutations=0;const baselineStore=new PersonalStorage(adapter(baseline.values,(_k,_v,apply)=>{mutations++;apply();}));await baselineStore.initialize();await baselineStore.restore(baseline.before,baseline.after);
  for(let cut=1;cut<=mutations;cut++){
    const {values,before,after}=fixture();let count=0,dead=false;
    const raw=adapter(values,(_key,_value,apply)=>{if(dead)throw Error('process-stopped');apply();if(++count===cut){dead=true;throw Error('process-stopped');}});
    const getter=raw.getItem;raw.getItem=async key=>{if(dead)throw Error('process-stopped');return getter(key);};
    const store=new PersonalStorage(raw);await store.initialize();await store.restore(before,after).catch(()=>undefined);
    const restarted=new PersonalStorage(adapter(values));await restarted.initialize();assert.equal(restarted.getSnapshot().phase,'ready',`cut ${cut}`);
    const actual=rawData(values);assert(JSON.stringify(actual)===JSON.stringify(before)||JSON.stringify(actual)===JSON.stringify(after),`mixed generation at cut ${cut}`);assert.equal(values.has(JOURNAL_KEY),false,`journal cleanup at ${cut}`);
  }
});

test('a prepared record with a corrupt before-image blocks without overwriting data',async()=>{const {values,before,after}=fixture();let dead=false;const raw=adapter(values,(key,value,apply)=>{if(dead)throw Error('stopped');apply();if(key===JOURNAL_KEY&&value?.includes('prepared')){dead=true;throw Error('stopped');}});const get=raw.getItem;raw.getItem=async key=>{if(dead)throw Error('stopped');return get(key);};const store=new PersonalStorage(raw);await store.initialize();await store.restore(before,after).catch(()=>undefined);values.set('glass-notes.recovery.before.0','{"corrupt":true}');const restart=new PersonalStorage(adapter(values));await restart.initialize();assert.equal(restart.getSnapshot().phase,'blocked');assert.deepEqual(rawData(values),before);assert(values.has(JOURNAL_KEY));});

test('cross-window generation change rejects a stale writer',async()=>{const {values,before,after}=fixture();const first=new PersonalStorage(adapter(values)),second=new PersonalStorage(adapter(values));await first.initialize();await second.initialize();const stale=second.createSession();await first.restore(before,after);assert(values.get(GENERATION_KEY));await assert.rejects(stale.setItem(PERSONAL_KEYS.lab,'{}'),/expired/);assert.equal(second.getSnapshot().notice,'external-change');assert.equal(values.get(PERSONAL_KEYS.lab),after.lab);await second.initialize();assert.equal(await second.createSession().getItem(PERSONAL_KEYS.lab),after.lab);});

test('missing browser exclusion primitive rejects restore before writes',async()=>{const {values,before,after}=fixture();const store=new PersonalStorage(adapter(values),fn=>fn(),()=>false);await store.initialize();await assert.rejects(store.restore(before,after),/exclusive-storage/);assert.deepEqual(rawData(values),before);});

test('invalid recovery target is never passed to raw storage',async()=>{const {values}=fixture();values.set(JOURNAL_KEY,JSON.stringify({version:1,phase:'prepared',entries:[{key:'../../outside',slot:0,wasNull:true,checksum:'null'}]}));const store=new PersonalStorage(adapter(values));await store.initialize();assert.equal(store.getSnapshot().phase,'blocked');assert(values.has(JOURNAL_KEY));});

test('a second loaded recipe store cannot overwrite a successful ordinary save', async () => {
  const values = new Map<string, string>();
  const first = new PersonalStorage(adapter(values)), second = new PersonalStorage(adapter(values));
  await first.initialize(); await second.initialize();
  const a = new PrivateRecipeStore(first.createSession()), b = new PrivateRecipeStore(second.createSession());
  await a.load(); await b.load();
  const content = {title: 'First tea', description: '', servings: 1,
    ingredients: [{id: 'tea', name: 'Tea', amount: '1', unit: 'parts' as const}],
    steps: ['Build over ice.'], method: '', glass: '', garnish: '', notes: ''};
  a.createOriginal(content); assert.equal(await a.whenSaved(), true);
  b.createOriginal({...content, title: 'Second tea'});
  assert.equal(await b.whenSaved(), false, 'the stale tab must report a failed save');
  assert.deepEqual(parsePrivateRecipeBook(values.get(PERSONAL_KEYS.privateRecipes)!).recipes
    .map(recipe => recipe.revisions[0]!.content.title), ['First tea']);
  assert.equal(second.getSnapshot().notice, 'external-change');
});

test('concurrent writers under one shared lock accept only one stale generation', async () => {
  const values = new Map<string, string>();
  let queue = Promise.resolve();
  const lock = <T>(task: () => Promise<T>): Promise<T> => {
    const run = queue.then(task); queue = run.then(() => undefined, () => undefined); return run;
  };
  const a = new PersonalStorage(adapter(values), lock), b = new PersonalStorage(adapter(values), lock);
  await a.initialize(); await b.initialize();
  const results = await Promise.allSettled([
    a.createSession().setItem(PERSONAL_KEYS.lab, '{"owner":"a"}'),
    b.createSession().setItem(PERSONAL_KEYS.lab, '{"owner":"b"}'),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter(result => result.status === 'rejected').length, 1);
  assert.equal(values.get(PERSONAL_KEYS.lab), '{"owner":"a"}');
});

test('ordinary writes without exclusion fail before touching personal data', async () => {
  const values = new Map<string, string>();
  const store = new PersonalStorage(adapter(values), task => task(), () => false);
  await store.initialize(); const session = store.createSession();
  await assert.rejects(session.setItem(PERSONAL_KEYS.lab, '{}'), /exclusive-storage/);
  await assert.rejects(session.removeItem!(PERSONAL_KEYS.lab), /exclusive-storage/);
  assert.equal(values.size, 0);
});

test('uncertain generation writes block the session before business data can change', async () => {
  for (const applied of [false, true]) {
    const values = new Map<string, string>([[PERSONAL_KEYS.lab, '{"saved":true}']]);
    const raw = adapter(values, (key, _value, apply) => {
      if (key === GENERATION_KEY) { if (applied) apply(); throw Error('generation-write-failed'); }
      apply();
    });
    const store = new PersonalStorage(raw); await store.initialize();
    await assert.rejects(store.createSession().setItem(PERSONAL_KEYS.lab, '{"saved":false}'), /generation-write-failed/);
    assert.equal(store.getSnapshot().phase, 'blocked');
    assert.equal(values.get(PERSONAL_KEYS.lab), '{"saved":true}');
    await assert.rejects(store.createSession().setItem(PERSONAL_KEYS.lab, '{}'), /expired/);
  }
});

test('one live session can write repeatedly but a pending recovery journal blocks it', async () => {
  const values = new Map<string, string>();
  const store = new PersonalStorage(adapter(values)); await store.initialize();
  const session = store.createSession();
  await session.setItem(PERSONAL_KEYS.lab, '{"revision":1}'); const first = values.get(GENERATION_KEY);
  await session.setItem(PERSONAL_KEYS.lab, '{"revision":2}');
  assert.notEqual(values.get(GENERATION_KEY), first);
  assert.equal(await session.getItem(PERSONAL_KEYS.lab), '{"revision":2}');
  values.set(JOURNAL_KEY, '{"pending":true}');
  await assert.rejects(session.removeItem!(PERSONAL_KEYS.lab), /expired/);
  assert.equal(values.get(PERSONAL_KEYS.lab), '{"revision":2}');
  assert.equal(store.getSnapshot().phase, 'blocked');
});

test('an atomic purchase remounts durable providers without a backup-restored notice',async()=>{
 const {values,before}=fixture(),store=new PersonalStorage(adapter(values));await store.initialize();const old=store.createSession();
 await store.restore(before,{pantry:'{"ingredientIds":["gin"],"brandsByIngredient":{}}',shopping:'{"bought":true}'},'purchased');
 assert.equal(store.getSnapshot().notice,'purchased');await assert.rejects(old.getItem(PERSONAL_KEYS.pantry),/expired/);
 assert.equal(await store.createSession().getItem('glass-notes.shopping.v1'),'{"bought":true}');
});
