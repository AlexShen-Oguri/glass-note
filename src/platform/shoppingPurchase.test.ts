import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from '../content/catalogue';
import {recipeSnapshot} from '../domain/making';
import {addShoppingTarget,emptyShoppingState,parseShoppingState} from '../domain/shopping';
import {PersonalStorage,PERSONAL_KEYS,JOURNAL_KEY,type RawPersonalData} from './personalStorage';
import * as module from './shoppingPurchase';
const api=module as any;
function fixture(){
 const shopping=addShoppingTarget(emptyShoppingState(),catalogue,recipeSnapshot(catalogue,catalogue.versions[0]!.id)!,{ingredientIds:[],brandsByIngredient:{}}),pantry=JSON.stringify({ingredientIds:[],brandsByIngredient:{}});
 const values=new Map<string,string>([[PERSONAL_KEYS.pantry,pantry],[PERSONAL_KEYS.shopping,JSON.stringify(shopping)]]);
 return {shopping,values,pantry};
}
const raw=(values:Map<string,string>)=>Object.fromEntries(Object.entries(PERSONAL_KEYS).map(([name,key])=>[name,values.get(key)??null])) as RawPersonalData;
function storage(values:Map<string,string>,mutation=(key:string,value:string|null,apply:()=>void)=>apply()) {return {getItem:async(key:string)=>values.get(key)??null,setItem:async(key:string,value:string)=>mutation(key,value,()=>{values.set(key,value);}),removeItem:async(key:string)=>mutation(key,null,()=>{values.delete(key);})};}
test('confirm commits pantry and durable bought together and repeating after pantry removal does not add it again',async()=>{
 assert.equal(typeof api.purchaseShoppingItem,'function');const f=fixture(),personal=new PersonalStorage(storage(f.values));await personal.initialize();let prepares=0;
 const recovery={prepare:async()=>{prepares++;return personal.readAll();},restore:personal.restore};const item=f.shopping.items[0]!;
 assert(await api.purchaseShoppingItem(recovery,item.id,catalogue));assert.equal(prepares,1);assert.equal(personal.getSnapshot().notice,'purchased');
 assert(parseShoppingState(f.values.get(PERSONAL_KEYS.shopping)!).items[0]!.bought);assert(JSON.parse(f.values.get(PERSONAL_KEYS.pantry)!).ingredientIds.includes(item.ingredientId));
 await personal.createSession().setItem(PERSONAL_KEYS.pantry,f.pantry);
 assert(await api.purchaseShoppingItem(recovery,item.id,catalogue));assert.deepEqual(JSON.parse(f.values.get(PERSONAL_KEYS.pantry)!).ingredientIds,[]);
});
test('a failed second category rolls both values back and uses a purchase failure notice',async()=>{
 assert.equal(typeof api.purchaseShoppingItem,'function');const f=fixture(),before=raw(f.values);let fail=true;
 const personal=new PersonalStorage(storage(f.values,(key,value,apply)=>{if(key===PERSONAL_KEYS.shopping&&value!==before.shopping&&fail){fail=false;throw Error('disk-full');}apply();}));await personal.initialize();
 const recovery={prepare:personal.readAll,restore:personal.restore};
 await assert.rejects(api.purchaseShoppingItem(recovery,f.shopping.items[0]!.id,catalogue),/disk-full/);assert.deepEqual(raw(f.values),before);assert.equal(personal.getSnapshot().notice,'purchase-failed');
 assert(await api.purchaseShoppingItem(recovery,f.shopping.items[0]!.id,catalogue));
});
test('every interrupted mutation yields both before or both after, including committed cleanup',async()=>{
 assert.equal(typeof api.purchaseShoppingItem,'function');const baseline=fixture();let mutations=0;
 const finished=new PersonalStorage(storage(baseline.values,(_k,_v,apply)=>{mutations++;apply();}));await finished.initialize();await api.purchaseShoppingItem({prepare:finished.readAll,restore:finished.restore},baseline.shopping.items[0]!.id,catalogue);const after=raw(baseline.values);
 for(let cut=1;cut<=mutations;cut++){
  const f=fixture(),before=raw(f.values);let count=0,dead=false;
  const adapter=storage(f.values,(_k,_v,apply)=>{if(dead)throw Error('stopped');apply();if(++count===cut){dead=true;throw Error('stopped');}});const getter=adapter.getItem;adapter.getItem=async key=>{if(dead)throw Error('stopped');return getter(key);};
  const personal=new PersonalStorage(adapter);await personal.initialize();await api.purchaseShoppingItem({prepare:personal.readAll,restore:personal.restore},f.shopping.items[0]!.id,catalogue).catch(()=>undefined);
  const restart=new PersonalStorage(storage(f.values));await restart.initialize();const result=raw(f.values);
  assert.equal(restart.getSnapshot().phase,'ready',`cut ${cut}`);if(restart.getSnapshot().notice)assert(['purchased','purchase-failed'].includes(restart.getSnapshot().notice!),`purchase recovery notice at cut ${cut}`);assert(JSON.stringify(result)===JSON.stringify(before)||JSON.stringify(result)===JSON.stringify(after),`mixed purchase at cut ${cut}`);assert.equal(f.values.has(JOURNAL_KEY),false);
 }
});
test('missing locks, invalid after inputs and participant preparation failure never start a purchase journal',async()=>{
 assert.equal(typeof api.purchaseShoppingItem,'function');const f=fixture(),before=raw(f.values),personal=new PersonalStorage(storage(f.values),fn=>fn(),()=>false);await personal.initialize();
 await assert.rejects(api.purchaseShoppingItem({prepare:personal.readAll,restore:personal.restore},f.shopping.items[0]!.id,catalogue),/exclusive-storage/);assert.deepEqual(raw(f.values),before);
 await assert.rejects(api.purchaseShoppingItem({prepare:async()=>{throw Error('personal-data-not-ready');},restore:personal.restore},f.shopping.items[0]!.id,catalogue),/not-ready/);
 f.values.set(PERSONAL_KEYS.pantry,'{"ingredientIds":[7],"brandsByIngredient":{}}');const invalid=raw(f.values);
 await assert.rejects(api.purchaseShoppingItem({prepare:async()=>invalid,restore:personal.restore},f.shopping.items[0]!.id,catalogue));assert.deepEqual(raw(f.values),invalid);assert.equal(f.values.has(JOURNAL_KEY),false);
});
test('an intervening unrelated edit or generation change rejects purchase before destination writes',async()=>{
 assert.equal(typeof api.purchaseShoppingItem,'function');const f=fixture(),personal=new PersonalStorage(storage(f.values));await personal.initialize();const before=await personal.readAll();
 await personal.createSession().setItem(PERSONAL_KEYS.preferences,'{"locale":"zh"}');const changed=raw(f.values);
 await assert.rejects(api.purchaseShoppingItem({prepare:async()=>before,restore:personal.restore},f.shopping.items[0]!.id,catalogue),/stale/);assert.deepEqual(raw(f.values),changed);assert.equal(f.values.has(JOURNAL_KEY),false);assert.equal(personal.getSnapshot().notice,'purchase-failed');
});

test('interrupted cleanup after a completed rollback reports purchase failure and preserves the before generation',async()=>{
 assert.equal(typeof api.purchaseShoppingItem,'function');const f=fixture(),before=raw(f.values);let failed=false,dead=false;
 const adapter=storage(f.values,(key,value,apply)=>{
  if(dead)throw Error('stopped');
  if(key===PERSONAL_KEYS.shopping&&value!==before.shopping&&!failed){failed=true;throw Error('disk-full');}
  apply();if(failed&&key===JOURNAL_KEY&&value?.includes('committed')){dead=true;throw Error('stopped');}
 });
 const getter=adapter.getItem;adapter.getItem=async key=>{if(dead)throw Error('stopped');return getter(key);};
 const personal=new PersonalStorage(adapter);await personal.initialize();await api.purchaseShoppingItem({prepare:personal.readAll,restore:personal.restore},f.shopping.items[0]!.id,catalogue).catch(()=>undefined);
 assert.equal(personal.getSnapshot().phase,'blocked');assert.deepEqual(raw(f.values),before);
 const restart=new PersonalStorage(storage(f.values));await restart.initialize();assert.equal(restart.getSnapshot().notice,'purchase-failed');assert.deepEqual(raw(f.values),before);assert.equal(f.values.has(JOURNAL_KEY),false);
});

test('an unchanged whole raw snapshot still rejects an externally advanced generation',async()=>{
 assert.equal(typeof api.purchaseShoppingItem,'function');const f=fixture(),first=new PersonalStorage(storage(f.values)),second=new PersonalStorage(storage(f.values));await first.initialize();await second.initialize();const before=await first.readAll();
 await second.createSession().setItem(PERSONAL_KEYS.pantry,f.pantry);assert.deepEqual(raw(f.values),before);
 await assert.rejects(api.purchaseShoppingItem({prepare:async()=>before,restore:first.restore},f.shopping.items[0]!.id,catalogue),/stale/);assert.deepEqual(raw(f.values),before);assert.equal(f.values.has(JOURNAL_KEY),false);
});
