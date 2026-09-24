import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from '../content/catalogue';
import {FavoritesStore,parseFavoritesState,validateFavoriteLists,type FavoriteList,type FavoriteListItem} from '../domain/favorites';
import {recipeFingerprint,recipeSnapshot} from '../domain/making';

const allowed=new Set(catalogue.versions.map(version=>version.id));
const firstVersion=catalogue.versions[0]!;
const multiCocktail=catalogue.cocktails.find(cocktail=>cocktail.versionIds.length>1)!;
const sameCocktailVersions=multiCocktail.versionIds.map(id=>catalogue.versions.find(version=>version.id===id)!);
const anotherVersion=catalogue.versions.find(version=>version.id!==firstVersion.id)!;
const now='2026-09-17T04:00:00Z';
const later='2026-09-17T05:00:00Z';

function item(versionId=firstVersion.id,addedAt=now):FavoriteListItem{
  const recipe=recipeSnapshot(catalogue,versionId)!;
  return{versionId,cocktailId:recipe.version.cocktailId,fingerprint:recipeFingerprint(recipe),addedAt,recipe};
}
function list(overrides:Partial<FavoriteList>={}):FavoriteList{return{id:'list-1',name:'Weekend',createdAt:now,updatedAt:now,items:[item()],...overrides};}
function memory(initial:string|null=null,failWrites=0){
  let raw=initial;let attempts=0;const writes:string[]=[];
  return{storage:{getItem:async()=>raw,setItem:async(_key:string,value:string)=>{attempts++;if(attempts<=failWrites)throw Error('write failed');raw=value;writes.push(value);}},raw:()=>raw,writes,attempts:()=>attempts};
}

test('strict list parsing deep-copies snapshots and rejects unknown keys, bad dates, references, and fingerprints',()=>{
  const source=list();const parsed=validateFavoriteLists([source]);
  source.items[0]!.recipe.title.en='mutated outside';
  assert.notEqual(parsed[0]!.items[0]!.recipe.title.en,'mutated outside');
  const cases:unknown[]=[
    {...list(),extra:true},
    {...list(),updatedAt:'not-a-date'},
    {...list(),updatedAt:'2026-02-31T00:00:00Z'},
    {...list(),items:[{...item(),cocktailId:'wrong'}]},
    {...list(),items:[{...item(),fingerprint:'0'.repeat(64)}]},
    {...list(),items:[item(),item()]},
    {...list(),items:[{...item(),recipe:{...item().recipe,unsafe:true}}]},
  ];
  for(const value of cases)assert.throws(()=>validateFavoriteLists([value]));
  assert.throws(()=>parseFavoritesState(JSON.stringify({version:2,versionIds:[],lists:[list()],extra:true})));
  assert.throws(()=>parseFavoritesState(' '.repeat(5_000_001)));
});

test('create with a version atomically saves a v2 snapshot and duplicate add is idempotent',async()=>{
  const data=memory(JSON.stringify({version:1,versionIds:[]}));
  const store=new FavoritesStore(allowed,data.storage,catalogue);await store.load();
  assert.deepEqual(await store.createList({id:'list-1',name:'Weekend',now,versionId:firstVersion.id}),{status:'saved',listId:'list-1'});
  assert.equal(store.getSnapshot().lists[0]!.items[0]!.versionId,firstVersion.id);
  assert.deepEqual(await store.addToList('list-1',firstVersion.id,later),{status:'duplicate',listId:'list-1'});
  assert.equal(store.getSnapshot().lists[0]!.items.length,1);
  const persisted=parseFavoritesState(data.raw());
  assert.equal(persisted.version,2);assert.equal(persisted.lists[0]!.items[0]!.fingerprint,recipeFingerprint(persisted.lists[0]!.items[0]!.recipe));
});

test('one list keeps two exact source versions of one cocktail in insertion order',async()=>{
  assert.equal(sameCocktailVersions.length>=2,true);
  const data=memory();const store=new FavoritesStore(allowed,data.storage,catalogue);await store.load();
  await store.createList({id:'list-1',name:'Comparisons',now,versionId:sameCocktailVersions[0]!.id});
  assert.equal((await store.addToList('list-1',sameCocktailVersions[1]!.id,later)).status,'saved');
  assert.deepEqual(store.getSnapshot().lists[0]!.items.map(entry=>entry.versionId),sameCocktailVersions.slice(0,2).map(version=>version.id));
  assert.equal(new Set(store.getSnapshot().lists[0]!.items.map(entry=>entry.cocktailId)).size,1);
});

test('rename, remove, and delete preserve explicit not-found semantics and timestamps',async()=>{
  const data=memory();const store=new FavoritesStore(allowed,data.storage,catalogue);await store.load();
  await store.createList({id:'list-1',name:'  Weekend  ',now,versionId:firstVersion.id});
  assert.equal(store.getSnapshot().lists[0]!.name,'Weekend');
  assert.deepEqual(await store.renameList('list-1','  Guests  ',later),{status:'saved',listId:'list-1'});
  assert.equal(store.getSnapshot().lists[0]!.name,'Guests');
  assert.equal(store.getSnapshot().lists[0]!.updatedAt,later);
  assert.equal((await store.removeFromList('list-1',firstVersion.id,later)).status,'saved');
  assert.equal((await store.removeFromList('list-1',firstVersion.id,later)).status,'not-found');
  assert.equal((await store.deleteList('list-1')).status,'saved');
  assert.equal((await store.deleteList('list-1')).status,'not-found');
});

test('invalid names, reversed dates, list count, item count, and UTF-8 raw limits fail without truncation',async()=>{
  const hundred=Array.from({length:100},(_,index)=>list({id:`list-${index}`,name:`List ${index}`,items:[]}));
  let raw=JSON.stringify({version:2,versionIds:[],lists:hundred});
  const store=new FavoritesStore(allowed,{getItem:async()=>raw,setItem:async(_key,value)=>{raw=value;}},catalogue);await store.load();
  assert.equal((await store.createList({id:'overflow',name:'Overflow',now})).status,'limit-exceeded');
  assert.equal((await store.createList({id:'bad-name',name:'x'.repeat(101),now})).status,'invalid');
  assert.equal((await store.renameList('list-0','Earlier','2026-09-16T00:00:00Z')).status,'invalid');

  const five=[firstVersion,...catalogue.versions.filter(version=>version.id!==firstVersion.id).slice(0,4)].map(version=>item(version.id));
  const full=Array.from({length:100},(_,index)=>list({id:`full-${index}`,name:`Full ${index}`,items:five}));
  raw=JSON.stringify({version:2,versionIds:[],lists:full});
  const fullStore=new FavoritesStore(allowed,{getItem:async()=>raw,setItem:async(_key,value)=>{raw=value;}},catalogue);await fullStore.load();
  const sixth=catalogue.versions.find(version=>!five.some(entry=>entry.versionId===version.id))!;
  assert.equal((await fullStore.addToList('full-0',sixth.id,later)).status,'limit-exceeded');
  assert.equal(fullStore.getSnapshot().lists.reduce((total,entry)=>total+entry.items.length,0),500);
});

test('read failure keeps a prepared create intent and retry writes the same caller-owned id',async()=>{
  let reads=0;let raw=JSON.stringify({version:1,versionIds:['future-version']});
  const storage={getItem:async()=>{if(++reads===1)throw Error('offline');return raw;},setItem:async(_key:string,value:string)=>{raw=value;}};
  const store=new FavoritesStore(allowed,storage,catalogue);
  assert.deepEqual(await store.createList({id:'stable-id',name:'Later',now,versionId:firstVersion.id}),{status:'read-failed',listId:'stable-id'});
  assert.equal(store.getSnapshot().hydrated,false);assert.equal(store.getSnapshot().lists.length,0);
  assert.equal(await store.retry(),true);
  assert.equal(store.getSnapshot().lists[0]!.id,'stable-id');
  assert.deepEqual(store.getSnapshot().unknownVersionIds,['future-version']);
  assert.equal(parseFavoritesState(raw).lists.length,1);
});

test('pending replay that hits a limit is not silently reported as a successful retry',async()=>{
  const full=Array.from({length:100},(_,index)=>list({id:`full-${index}`,name:`Full ${index}`,items:[]}));
  let reads=0;let raw=JSON.stringify({version:2,versionIds:[],lists:full});
  const store=new FavoritesStore(allowed,{getItem:async()=>{if(++reads===1)throw Error('offline');return raw;},setItem:async(_key,value)=>{raw=value;}},catalogue);
  assert.equal((await store.createList({id:'overflow',name:'Overflow',now})).status,'read-failed');
  assert.equal(await store.retry(),false);
  assert.equal(await store.retry(),false);
  assert.equal(store.getSnapshot().lists.length,100);assert.equal(parseFavoritesState(raw).lists.length,100);
  assert.equal((await store.deleteList('full-0')).status,'saved');
  assert.equal(await store.retry(),true);
  assert.equal(store.getSnapshot().lists.some(entry=>entry.id==='overflow'),true);
  assert.equal(parseFavoritesState(raw).lists.some(entry=>entry.id==='overflow'),true);
});

test('a failed write retains the list and repeating the same create retries durability without duplication',async()=>{
  const data=memory(null,1);const store=new FavoritesStore(allowed,data.storage,catalogue);await store.load();
  assert.equal((await store.createList({id:'stable-id',name:'Retry me',now,versionId:firstVersion.id})).status,'write-failed');
  assert.equal(store.getSnapshot().lists.length,1);assert.equal(store.getSnapshot().storageAvailable,false);
  assert.equal((await store.createList({id:'stable-id',name:'Retry me',now,versionId:firstVersion.id})).status,'saved');
  assert.equal(store.getSnapshot().lists.length,1);assert.equal(data.attempts(),2);
  assert.equal(parseFavoritesState(data.raw()).lists.length,1);
});

test('a duplicate request waits for the in-flight exact readback before reporting durability',async()=>{
  let raw:string|null=null;const releases:Array<()=>void>=[];
  const store=new FavoritesStore(allowed,{getItem:async()=>raw,setItem:async(_key,value)=>{await new Promise<void>(resolve=>{releases.push(()=>{raw=value;resolve();});});}},catalogue);await store.load();
  let firstSettled=false;const first=store.createList({id:'list-1',name:'Wait',now,versionId:firstVersion.id}).then(result=>{firstSettled=true;return result;});
  while(releases.length<1)await Promise.resolve();
  let duplicateSettled=false;const duplicate=store.createList({id:'list-1',name:'Wait',now,versionId:firstVersion.id}).then(result=>{duplicateSettled=true;return result;});
  store.set(anotherVersion.id,true);
  await Promise.resolve();assert.equal(duplicateSettled,false);
  releases[0]!();
  while(releases.length<2)await Promise.resolve();
  assert.equal(firstSettled,false,'the original mutation also waits for the appended write');
  assert.equal(duplicateSettled,false,'duplicate must also await a write appended while it was waiting');
  releases[1]!();assert.equal((await first).status,'saved');assert.equal((await duplicate).status,'duplicate');
});

test('readback mismatch is a write failure and explicit retry only succeeds after exact storage confirmation',async()=>{
  let raw:string|null=null;let discard=true;
  const store=new FavoritesStore(allowed,{getItem:async()=>raw,setItem:async(_key,value)=>{if(!discard)raw=value;}},catalogue);await store.load();
  assert.equal((await store.createList({id:'list-1',name:'Readback',now})).status,'write-failed');
  assert.equal(store.getSnapshot().lists.length,1);assert.equal(store.getSnapshot().storageAvailable,false);
  discard=false;assert.equal(await store.retry(),true);assert.equal(store.getSnapshot().storageAvailable,true);
  assert.equal(parseFavoritesState(raw).lists[0]!.id,'list-1');
});

test('retry waits for an in-flight save and does not report success when both the save and retry fail',async()=>{
  const releases:Array<()=>void>=[];
  const store=new FavoritesStore(allowed,{getItem:async()=>null,setItem:async()=>{await new Promise<void>(resolve=>{releases.push(resolve);});throw Error('offline');}},catalogue);
  await store.load();
  const create=store.createList({id:'list-1',name:'Offline',now});
  while(releases.length<1)await Promise.resolve();
  let retrySettled=false;const retry=store.retry().then(result=>{retrySettled=true;return result;});
  await Promise.resolve();assert.equal(retrySettled,false);
  releases[0]!();assert.equal((await create).status,'write-failed');
  while(releases.length<2)await Promise.resolve();
  assert.equal(retrySettled,false,'retry must await its own exact-readback attempt');
  releases[1]!();assert.equal(await retry,false);
});

test('a saved recipe is a deep snapshot rather than a catalogue object alias',async()=>{
  const data=memory();const store=new FavoritesStore(allowed,data.storage,catalogue);await store.load();
  await store.createList({id:'list-1',name:'Snapshot',now,versionId:anotherVersion.id});
  const saved=store.getSnapshot().lists[0]!.items[0]!.recipe;
  const original=catalogue.versions.find(version=>version.id===anotherVersion.id)!;
  assert.notEqual(saved.version,original);
  assert.equal(saved.title.en,catalogue.cocktails.find(cocktail=>cocktail.id===anotherVersion.cocktailId)!.name.en);
});
