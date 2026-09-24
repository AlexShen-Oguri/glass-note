import assert from 'node:assert/strict';
import test from 'node:test';
import {TasteStore} from './tasteStore';
import {catalogue} from '../content/catalogue';
import {recipeSnapshot} from '../domain/making';
import {createFeedback} from '../domain/taste';
const entry=()=>createFeedback(recipeSnapshot(catalogue,catalogue.versions[0]!.id)!,'memory-test','2026-09-11T12:00:00.000Z',{experience:'drank',sentiment:'like',tooSweet:false,tooStrong:false,likedFlavours:[],notes:'private'});

test('unreadable taste data cannot become a writable empty memory',async()=>{
  let writes=0;
  const store=new TasteStore({getItem:async()=>{throw Error('read');},setItem:async()=>{writes++;}});
  await store.load();assert.equal(store.getSnapshot().hydrated,false);
  assert.equal(await store.change(s=>({...s,entries:[entry()]})),false);assert.equal(writes,0);
});
test('failed save does not influence recommendations; retry retains exact intent and never appends twice',async()=>{
  let disk:string|null=null,fail=true,intents=0;
  const store=new TasteStore({getItem:async()=>disk,setItem:async(_key,v)=>{if(fail)throw Error('full');disk=v;}});await store.load();
  assert.equal(await store.change(s=>{intents++;return {...s,entries:[...s.entries,entry()]};}),false);
  assert.equal(store.getSnapshot().state.entries.length,1);assert.equal(store.getSnapshot().savedState.entries.length,0);
  fail=false;assert.equal(await store.retry(),true);assert.equal(intents,1);assert.equal(store.getSnapshot().savedState.entries.length,1);
  assert.equal(await store.change(s=>({...s,entries:[]})),true);assert.equal(store.getSnapshot().savedState.entries.length,0);
  const reopened=new TasteStore({getItem:async()=>disk,setItem:async()=>{}});await reopened.load();assert.equal(reopened.getSnapshot().state.entries.length,0);
});
test('queued memory edits preserve both records and readback failure cannot report saved',async()=>{
  let disk:string|null=null,ignore=false;
  const store=new TasteStore({getItem:async()=>disk,setItem:async(_key,v)=>{if(!ignore)disk=v;}});await store.load();
  await Promise.all(['one','two'].map(id=>store.change(s=>({...s,entries:[...s.entries,{...entry(),id}]}))));
  assert.equal(store.getSnapshot().savedState.entries.length,2);
  ignore=true;assert.equal(await store.change(s=>({...s,entries:[]})),false);assert.equal(store.getSnapshot().savedState.entries.length,2);assert.equal(await store.whenSaved(),false);
});
