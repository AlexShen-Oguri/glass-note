import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from '../content/catalogue';
import {recipeSnapshot} from '../domain/making';
import {addShoppingTarget,emptyShoppingState,parseShoppingState,removeShoppingItem} from '../domain/shopping';
import * as module from './shoppingStore';
const api=module as any;
const initial=()=>addShoppingTarget(emptyShoppingState(),catalogue,recipeSnapshot(catalogue,catalogue.versions[0]!.id)!,{ingredientIds:[],brandsByIngredient:{}});
test('saved shopping list hydrates unchanged and explicit removal survives a second store load',async()=>{
 assert.equal(typeof api.ShoppingStore,'function');let raw:string|null=JSON.stringify(initial());
 const storage={getItem:async()=>raw,setItem:async(_key:string,value:string)=>{raw=value;}};
 const store=new api.ShoppingStore(storage);await store.load();assert.deepEqual(store.getSnapshot().state,initial());
 const id=store.getSnapshot().state.items[0].id;assert(await store.change((s:any)=>removeShoppingItem(s,id)));
 const reopened=new api.ShoppingStore(storage);await reopened.load();assert.equal(reopened.getSnapshot().state.items.some((i:any)=>i.id===id),false);
});
test('failed writes retain one pending intent and retry persists it without rerunning the edit',async()=>{
 assert.equal(typeof api.ShoppingStore,'function');let raw:string|null=null,fail=true,calls=0;
 const store=new api.ShoppingStore({getItem:async()=>raw,setItem:async(_key:string,value:string)=>{if(fail)throw Error('disk-full');raw=value;}});
 await store.load();assert.equal(await store.change(()=>{calls++;return initial();}),false);assert.equal(store.getSnapshot().error,'write');
 assert.equal(await store.whenSaved(),false);fail=false;assert(await store.retry());assert.equal(calls,1);assert.deepEqual(parseShoppingState(raw),initial());
});
test('serialized edits preserve the newest intent and refuse bought flags outside the atomic purchase',async()=>{
 assert.equal(typeof api.ShoppingStore,'function');let raw:string|null=JSON.stringify(initial());
 const store=new api.ShoppingStore({getItem:async()=>raw,setItem:async(_key:string,value:string)=>{await new Promise(resolve=>setTimeout(resolve,3));raw=value;}});await store.load();
 const [first,second]=store.getSnapshot().state.items;await Promise.all([store.change((s:any)=>removeShoppingItem(s,first.id)),store.change((s:any)=>removeShoppingItem(s,second.id))]);
 assert.equal(parseShoppingState(raw).items.length,initial().items.length-2);
 await assert.rejects(store.change((s:any)=>({...s,items:s.items.map((i:any)=>({...i,bought:true}))})),/atomic-purchase/);
 assert(parseShoppingState(raw).items.every(i=>!i.bought));
});

test('an in-place callback cannot expose an uncommitted bought flag or erase a durable one',async()=>{
 assert.equal(typeof api.ShoppingStore,'function');let raw:string|null=JSON.stringify(initial());const storage={getItem:async()=>raw,setItem:async(_key:string,value:string)=>{raw=value;}};
 const store=new api.ShoppingStore(storage);await store.load();await assert.rejects(store.change((s:any)=>{s.items[0].bought=true;return s;}),/atomic-purchase/);
 assert.equal(store.getSnapshot().state.items[0].bought,false);assert.equal(parseShoppingState(raw).items[0]!.bought,false);
 const durable=initial();durable.items[0]!.bought=true;raw=JSON.stringify(durable);const reopened=new api.ShoppingStore(storage);await reopened.load();
 await assert.rejects(reopened.change((s:any)=>{s.items[0].bought=false;return s;}),/atomic-purchase/);assert(reopened.getSnapshot().state.items[0].bought);assert(parseShoppingState(raw).items[0]!.bought);
});

test('an unsafe saved recipe map reports a read failure and leaves exact raw bytes available for recovery',async()=>{
 const recipe=recipeSnapshot(catalogue,'negroni-iba')!,state=addShoppingTarget(emptyShoppingState(),catalogue,recipe,{ingredientIds:[],brandsByIngredient:{}});
 const frozen=state.targets[0]!.recipe;frozen.version.ingredients.forEach(row=>{delete row.brandId;});frozen.version.ingredients[0]!.brandId='constructor';frozen.brandNames={constructor:'Unsafe brand'};state.targets[0]!.fingerprint=unsafeRecipeFingerprint(frozen);
 const raw=JSON.stringify(state);let writes=0;const store=new api.ShoppingStore({getItem:async()=>raw,setItem:async()=>{writes++;}});await store.load();
 assert.equal(store.getSnapshot().hydrated,false);assert.equal(store.getSnapshot().error,'read');assert.equal(await store.change(()=>emptyShoppingState()),false);assert.equal(await store.retry(),false);assert.equal(writes,0);
});
import {recipeFingerprint as unsafeRecipeFingerprint} from '../domain/making';
