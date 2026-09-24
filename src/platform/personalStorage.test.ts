import test from 'node:test';
import assert from 'node:assert/strict';
import {PersonalStorage,PERSONAL_KEYS,JOURNAL_KEY,GENERATION_KEY,type RawPersonalData} from './personalStorage';
import type {LocalKeyValueStorage} from './desktop-contract';

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
