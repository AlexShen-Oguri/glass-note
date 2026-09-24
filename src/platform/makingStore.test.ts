import assert from 'node:assert/strict';
import test from 'node:test';
import {MakingStore} from './makingStore';
import {emptyMakingState} from '../domain/making/types';
import {catalogue} from '../content/catalogue';
import {createSession, recipeSnapshot, updateSession} from '../domain/making';

test('making read failure cannot be mistaken for an empty writable state',async()=>{
  let disk=JSON.stringify({...emptyMakingState(),stock:[{ingredientId:'lime',amount:45,unit:'ml'}]});let blocked=true,writes=0;
  const store=new MakingStore({getItem:async()=>{if(blocked)throw Error('read');return disk;},setItem:async(_k,v)=>{writes++;disk=v;}});
  await store.load();assert.equal(store.getSnapshot().hydrated,false);
  assert.equal(await store.change(value=>({...value,stock:[]})),false);assert.equal(writes,0);
  blocked=false;assert.equal(await store.retry(),true);assert.equal(store.getSnapshot().state.stock[0]!.amount,45);
});
test('failed making write retries the same intent without repeating it',async()=>{
  let disk=JSON.stringify({...emptyMakingState(),stock:[{ingredientId:'lime',amount:100,unit:'ml'}]});let failed=true,intents=0;
  const store=new MakingStore({getItem:async()=>disk,setItem:async(_k,v)=>{if(failed)throw Error('full');disk=v;}});
  await store.load();assert.equal(await store.change(value=>{intents++;return {...value,stock:value.stock.map(i=>({...i,amount:i.amount-30}))};}),false);
  assert.equal(store.getSnapshot().state.stock[0]!.amount,70);assert.equal(JSON.parse(disk).stock[0].amount,100);
  assert.equal(await store.change(v=>{intents++;return v;}),false);assert.equal(intents,1);
  failed=false;assert.equal(await store.retry(),true);assert.equal(JSON.parse(disk).stock[0].amount,70);assert.equal(intents,1);
});
test('making serializes queued edits and requires readback before reporting success',async()=>{
  let disk:string|null=null;let ignoreWrite=false;
  const store=new MakingStore({getItem:async()=>disk,setItem:async(_k,v)=>{if(!ignoreWrite)disk=v;}});await store.load();
  await Promise.all([store.change(v=>({...v,stock:[{ingredientId:'lime',amount:100,unit:'ml'}]})),store.change(v=>({...v,stock:v.stock.map(i=>({...i,amount:i.amount-25}))}))]);
  assert.equal(JSON.parse(disk!).stock[0].amount,75);
  ignoreWrite=true;assert.equal(await store.change(v=>({...v,stock:[]})),false);assert.equal(await store.whenSaved(),false);
});
test('making store keeps legacy completed sessions whose stock deduction was never applied',async()=>{
  const recipe=recipeSnapshot(catalogue,catalogue.versions[0]!.id)!;
  const completed=updateSession(createSession(recipe,'legacy-completed','2026-09-10T12:00:00Z'),{completed:true},'2026-09-10T12:01:00Z');
  let disk=JSON.stringify({...emptyMakingState(),stock:[{ingredientId:recipe.version.ingredients[0]!.ingredientId,amount:10,unit:'ml'}],sessions:[completed]});
  const store=new MakingStore({getItem:async()=>disk,setItem:async(_key,value)=>{disk=value;}});
  await store.load();
  const loaded=store.getSnapshot().state;
  assert.equal(loaded.sessions[0]!.completed,true);assert.equal(loaded.sessions[0]!.consumptionApplied,false);assert.equal(loaded.stock[0]!.amount,10);
  assert.equal(await store.retry(),true);assert.equal(JSON.parse(disk).sessions[0].consumptionApplied,false);
});
