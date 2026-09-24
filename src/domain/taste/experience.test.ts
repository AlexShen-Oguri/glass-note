import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from '../../content/catalogue';
import {recipeSnapshot} from '../making';
import {emptyTasteState,recordExperience,parseTasteState} from './index';
import {TasteStore} from '../../platform/tasteStore';

test('experience saves exact recipe, combines drank/made, and preserves explicit preferences',()=>{
  const recipe=recipeSnapshot(catalogue,catalogue.versions[0]!.id)!;
  const first=recordExperience(emptyTasteState(),recipe,'drank','memory','2026-09-17T10:00:00Z');
  assert.equal(first.entries[0]!.sentiment,'neutral');
  assert.equal(first.entries[0]!.recipe.version.id,recipe.version.id);
  first.entries[0]!.sentiment='dislike';first.entries[0]!.notes='Too sweet';
  const next=recordExperience(first,recipe,'made','other','2026-09-17T11:00:00Z');
  assert.equal(next.entries.length,1);assert.equal(next.entries[0]!.experience,'both');
  assert.equal(next.entries[0]!.sentiment,'dislike');assert.equal(next.entries[0]!.notes,'Too sweet');
  assert.equal(recordExperience(next,recipe,'made','duplicate','2026-09-17T12:00:00Z'),next);
  assert.deepEqual(parseTasteState(JSON.stringify(next)),next);
});

test('quick experience retry saves once after failure and keeps exact versions separate',async()=>{
  let raw:string|null=null,fail=true;
  const store=new TasteStore({getItem:async()=>raw,setItem:async(_key,value)=>{if(fail)throw Error('disk-full');raw=value;}});
  await store.load();
  const recipe=recipeSnapshot(catalogue,'negroni-iba')!;
  assert.equal(await store.change(state=>recordExperience(state,recipe,'made','one','2026-09-17T10:00:00Z')),false);
  assert.equal(store.getSnapshot().savedState.entries.length,0);
  fail=false;assert.equal(await store.retry(),true);
  assert.equal(await store.change(state=>recordExperience(state,recipe,'made','one','2026-09-17T10:00:00Z')),true);
  const other=structuredClone(recipe);other.version.ingredients[0]!.amount=25;
  await store.change(state=>recordExperience(state,other,'drank','two','2026-09-17T11:00:00Z'));
  const reloaded=new TasteStore({getItem:async()=>raw,setItem:async()=>{throw Error('read only');}});await reloaded.load();
  assert.equal(reloaded.getSnapshot().savedState.entries.length,2);
  assert.equal(reloaded.getSnapshot().savedState.entries[0]!.experience,'made');
});
