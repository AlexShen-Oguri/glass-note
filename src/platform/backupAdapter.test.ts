import test from 'node:test';
import assert from 'node:assert/strict';
import {fullBackupFromRaw,knownBackupReferences,rawAfterRestore} from './backupAdapter';
import {PersonalStorage,PERSONAL_KEYS,JOURNAL_KEY,type RawPersonalData} from './personalStorage';
import {BACKUP_LIMIT,parseFullBackup,planRestore,serializeFullBackup,type FullBackup,type RestoreChoice} from '../domain/backup';
import {FavoritesStore,parseFavoritesState} from '../domain/favorites';
import {createSession,parseMakingState,recipeFingerprint,recipeSnapshot} from '../domain/making';
import {createFeedback,parseTasteState} from '../domain/taste';
import {parsePrivateRecipeBook,serializePrivateRecipeBook,type PrivateRecipe} from '../domain/private-recipes';
import {BottleOwnershipStore} from '../domain/bottles/ownership';
import {utf8ByteLength} from '../domain/lab';
import {parsePantry} from '../domain/ingredients';
import {catalogue} from '../content/catalogue';
const empty=()=>Object.fromEntries(Object.keys(PERSONAL_KEYS).map(key=>[key,null])) as RawPersonalData;
test('unknown favorites and pantry references survive real store edits and backup round trip',async()=>{const raw=empty();raw.favorites=JSON.stringify({version:1,versionIds:['future-version']});raw.pantry=JSON.stringify({ingredientIds:['future-ingredient'],brandsByIngredient:{'future-ingredient':['future-brand']}});let saved=raw.favorites;const store=new FavoritesStore(new Set(['known-version']),{getItem:async()=>saved,setItem:async(_key,value)=>{saved=value;}});await store.load();store.set('known-version',true);await store.whenSaved();assert.deepEqual(JSON.parse(saved!).versionIds,['known-version','future-version']);raw.favorites=saved;assert.deepEqual(parsePantry(raw.pantry,catalogue,true).ingredientIds,['future-ingredient']);const backup=fullBackupFromRaw(raw,'zh');const restored=parseFullBackup(serializeFullBackup(backup));assert.equal(restored.sections.favorites.schemaVersion,2);assert(restored.references.some(r=>r.id==='future-version'));assert(restored.references.some(r=>r.id==='future-brand'));assert.deepEqual(restored.sections.pantry.ingredientIds,['future-ingredient']);});
test('raw plan leaves unselected payloads and preference null untouched',()=>{const raw=empty();raw.lab='{"format":"glass-notes-lab","schemaVersion":1,"exportedAt":"2026-09-10T00:00:00Z","projects":[]}';const current=fullBackupFromRaw(raw,'en');const incoming=structuredClone(current);incoming.sections.favorites.versionIds=['future-version'];const choice={mode:'merge' as const,sections:['favorites' as const],preferenceFields:[]};const plan=planRestore({sections:current.sections,references:current.references},incoming,choice,knownBackupReferences);const after=rawAfterRestore(raw,plan,choice);assert.equal(after.preferences,undefined);assert.equal(after.lab,undefined);assert.equal(JSON.parse(after.favorites!).versionIds[0],'future-version');});
test('unknown stored properties are rejected rather than silently dropped in export',()=>{const raw=empty();raw.pantry='{"ingredientIds":[],"futureField":"keep me"}';assert.throws(()=>fullBackupFromRaw(raw,'en'),/invalid-personal-data/);});

test('favorite list snapshots export as v2, contribute references, and restore to exact raw v2',()=>{
  const raw=empty(),version=catalogue.versions.find(item=>item.ingredients.some(line=>line.brandId))??catalogue.versions[0]!;
  const recipe=recipeSnapshot(catalogue,version.id)!;const at='2026-09-17T00:00:00.000Z';
  raw.favorites=JSON.stringify({version:2,versionIds:['future-version'],lists:[{id:'list-one',name:'Tonight',createdAt:at,updatedAt:at,items:[{
    versionId:version.id,cocktailId:version.cocktailId,fingerprint:recipeFingerprint(recipe),addedAt:at,recipe,
  }]}]});
  const exported=fullBackupFromRaw(raw,'en',at);
  assert.equal(exported.sections.favorites.schemaVersion,2);
  assert(exported.references.some(ref=>ref.kind==='recipeVersion'&&ref.id===version.id));
  assert(exported.references.some(ref=>ref.kind==='source'&&ref.id===recipe.source.id));
  for(const line of recipe.version.ingredients){assert(exported.references.some(ref=>ref.kind==='ingredient'&&ref.id===line.ingredientId));if(line.brandId)assert(exported.references.some(ref=>ref.kind==='brand'&&ref.id===line.brandId));}
  const currentRaw=empty(),current=fullBackupFromRaw(currentRaw,'en',at),choice={mode:'replace' as const,sections:['favorites' as const],preferenceFields:[]};
  const plan=planRestore({sections:current.sections,references:current.references},parseFullBackup(serializeFullBackup(exported)),choice,knownBackupReferences);
  const restored=rawAfterRestore(currentRaw,plan,choice);
  assert.deepEqual(parseFavoritesState(restored.favorites!),parseFavoritesState(raw.favorites));
});

test('invalid and oversized favorites raw fails export instead of being truncated',()=>{
  const invalid=empty();invalid.favorites='{"version":2,"versionIds":[],"lists":[],"extra":true}';
  assert.throws(()=>fullBackupFromRaw(invalid,'en'),/unsupported extra/);
  const oversized=empty();oversized.favorites=' '.repeat(5_000_001);
  assert.throws(()=>fullBackupFromRaw(oversized,'en'),/invalid JSON/);
});

const restoreAt='2026-10-05T00:00:00.000Z';
const personal=(backup:FullBackup)=>({sections:backup.sections,references:backup.references});
const bottleIds=(count:number,prefix='future-')=>Array.from({length:count},(_,index)=>`${prefix}${index}`);
const incomingFile=(backup:FullBackup)=>parseFullBackup(serializeFullBackup(backup));

for(const mode of ['replace','merge'] as const){
  test(`${mode} rejects bottle count overflow before any journal or personal-data write`,async()=>{
    const values=new Map<string,string>([[PERSONAL_KEYS.bottles,JSON.stringify({schemaVersion:1,ids:bottleIds(2_500,'existing-')})]]);
    let writes=0;
    const recovery=new PersonalStorage({getItem:async key=>values.get(key)??null,setItem:async(key,value)=>{writes++;values.set(key,value);},removeItem:async key=>{writes++;values.delete(key);}});
    await recovery.initialize();
    const before=await recovery.readAll(),snapshot=new Map(values),state=recovery.getSnapshot();
    const current=fullBackupFromRaw(before,'en',restoreAt),incoming=fullBackupFromRaw(empty(),'en',restoreAt);
    incoming.sections.bottles.ids=bottleIds(mode==='replace'?5_001:2_501);
    const choice:RestoreChoice={mode,sections:['bottles'],preferenceFields:[]};
    const plan=planRestore(personal(current),incomingFile(incoming),choice,knownBackupReferences);
    assert.equal(plan.next.sections.bottles.ids.length,5_001);
    await assert.rejects(async()=>recovery.restore(before,rawAfterRestore(before,plan,choice)),/invalid-owned-bottles/);
    assert.equal(writes,0);
    assert.deepEqual(values,snapshot);
    assert.deepEqual(await recovery.readAll(),before);
    assert.equal(recovery.getSnapshot(),state);
    assert.equal(values.has(JOURNAL_KEY),false);
  });
}

test('bottle restore checks serialized length including JSON escapes, even below the count limit',()=>{
  const before=empty(),current=fullBackupFromRaw(before,'en',restoreAt),incoming=structuredClone(current);
  incoming.sections.bottles.ids=bottleIds(3_000).map(id=>id.padEnd(200,'\\'));
  assert(JSON.stringify(incoming.sections.bottles).length>1_000_000);
  const choice:RestoreChoice={mode:'replace',sections:['bottles'],preferenceFields:[]};
  const plan=planRestore(personal(current),incomingFile(incoming),choice,knownBackupReferences);
  assert.throws(()=>rawAfterRestore(before,plan,choice),/owned-bottles-too-large/);
});

test('the bottle count boundary restores unknown IDs without filtering and hydrates normally',async()=>{
  const before=empty(),current=fullBackupFromRaw(before,'en',restoreAt),incoming=structuredClone(current);
  incoming.sections.bottles.ids=bottleIds(5_000);
  const choice:RestoreChoice={mode:'replace',sections:['bottles'],preferenceFields:[]};
  const after=rawAfterRestore(before,planRestore(personal(current),incomingFile(incoming),choice,knownBackupReferences),choice);
  assert.deepEqual(JSON.parse(after.bottles!).ids,incoming.sections.bottles.ids);
  const store=new BottleOwnershipStore(new Set([incoming.sections.bottles.ids[0]!]),{getItem:async()=>after.bottles!,setItem:async()=>undefined});
  await store.load();
  assert.equal(store.getSnapshot().hydrated,true);
  assert.deepEqual(store.getSnapshot().ids,[incoming.sections.bottles.ids[0]]);
});

test('bottle restore accepts the exact raw-length limit and rejects one extra code unit',()=>{
  const before=empty(),current=fullBackupFromRaw(before,'en',restoreAt),incoming=structuredClone(current);
  incoming.sections.bottles.ids=bottleIds(5_000).map(id=>id.padEnd(196,'x'));
  let remaining=1_000_000-JSON.stringify(incoming.sections.bottles).length;
  for(let index=0;index<incoming.sections.bottles.ids.length&&remaining>0;index++){
    const extra=Math.min(remaining,200-incoming.sections.bottles.ids[index]!.length);
    incoming.sections.bottles.ids[index]+='x'.repeat(extra);remaining-=extra;
  }
  assert.equal(remaining,0);
  const choice:RestoreChoice={mode:'replace',sections:['bottles'],preferenceFields:[]};
  const after=rawAfterRestore(before,planRestore(personal(current),incomingFile(incoming),choice,knownBackupReferences),choice);
  assert.equal(after.bottles!.length,1_000_000);
  const index=incoming.sections.bottles.ids.findIndex(id=>id.length<200);
  incoming.sections.bottles.ids[index]+='x';
  assert.throws(()=>rawAfterRestore(before,planRestore(personal(current),incomingFile(incoming),choice,knownBackupReferences),choice),/owned-bottles-too-large/);
});

test('an unselected oversized bottle section does not prevent selective favorites restore',()=>{
  const before=empty(),current=fullBackupFromRaw(before,'en',restoreAt),incoming=structuredClone(current);
  incoming.sections.bottles.ids=bottleIds(5_001);
  incoming.sections.favorites.versionIds=['future-version'];
  const choice:RestoreChoice={mode:'replace',sections:['favorites'],preferenceFields:[]};
  const after=rawAfterRestore(before,planRestore(personal(current),incomingFile(incoming),choice,knownBackupReferences),choice);
  assert.equal(after.bottles,undefined);
  assert.deepEqual(parseFavoritesState(after.favorites!).versionIds,['future-version']);
});

function largePrivateRecipe(id:string):PrivateRecipe{
  return {id,private:true,createdAt:restoreAt,updatedAt:restoreAt,origin:{kind:'original'},activeRevisionId:`${id}-revision`,revisions:[{
    id:`${id}-revision`,createdAt:restoreAt,content:{title:id,description:'',servings:1,ingredients:[{id:`${id}-tea`,name:'Tea',amount:'1',unit:'parts'}],steps:['Build over ice.'],method:'',glass:'Highball',garnish:'',notes:'饮'.repeat(100_000)},
  }]};
}
function largeSnapshot(){
  const recipe=recipeSnapshot(catalogue,catalogue.versions[0]!.id)!;
  for(const locale of Object.keys(recipe.version.steps) as Array<keyof typeof recipe.version.steps>)recipe.version.steps[locale]=['饮'.repeat(15_000)];
  return recipe;
}
const mergedCases={
  privateRecipes:{populate:(backup:FullBackup,prefix:string)=>{backup.sections.privateRecipes.recipes=bottleIds(10,prefix).map(largePrivateRecipe);},parse:parsePrivateRecipeBook},
  making:{populate:(backup:FullBackup,prefix:string)=>{const recipe=largeSnapshot();backup.sections.making!.sessions=bottleIds(8,prefix).map(id=>createSession(recipe,id,restoreAt));},parse:parseMakingState},
  taste:{populate:(backup:FullBackup,prefix:string)=>{const recipe=largeSnapshot();backup.sections.taste!.entries=bottleIds(8,prefix).map(id=>createFeedback(recipe,id,restoreAt,{experience:'drank',sentiment:'neutral',tooSweet:false,tooStrong:false,likedFlavours:[],notes:id}));},parse:parseTasteState},
};
for(const section of Object.keys(mergedCases) as Array<keyof typeof mergedCases>){
  test(`${section} rejects oversized merged UTF-8 bytes but accepts a valid replacement`,()=>{
    const before=empty(),current=fullBackupFromRaw(before,'en',restoreAt),incoming=structuredClone(current),fixture=mergedCases[section];
    fixture.populate(current,'existing-');fixture.populate(incoming,'imported-');
    before[section]=JSON.stringify(current.sections[section]);
    assert.doesNotThrow(()=>fixture.parse(before[section]));
    const parsed=incomingFile(incoming);
    const choice:RestoreChoice={mode:'merge',sections:[section],preferenceFields:[]};
    const plan=planRestore(personal(current),parsed,choice,knownBackupReferences),oversized=JSON.stringify(plan.next.sections[section]);
    assert(oversized.length<BACKUP_LIMIT,'UTF-16 length alone would miss this oversized UTF-8 payload');
    assert(utf8ByteLength(oversized)>BACKUP_LIMIT);
    assert.throws(()=>rawAfterRestore(before,plan,choice),/5000000|invalid JSON/);
    const replace={...choice,mode:'replace' as const};
    const after=rawAfterRestore(before,planRestore(personal(current),parsed,replace,knownBackupReferences),replace);
    assert.equal(after[section],JSON.stringify(parsed.sections[section]));
    assert.deepEqual(fixture.parse(after[section]!),parsed.sections[section]);
  });
}

test('a merged private book at the exact UTF-8 limit keeps compact bytes without truncation',()=>{
  const before=empty(),current=fullBackupFromRaw(before,'en',restoreAt),incoming=structuredClone(current);
  const book={...current.sections.privateRecipes,recipes:bottleIds(50).map(largePrivateRecipe)};
  for(const recipe of book.recipes)recipe.revisions[0]!.content.notes='x'.repeat(99_000);
  let remaining=BACKUP_LIMIT-utf8ByteLength(JSON.stringify(book));
  assert(remaining>0);
  for(const recipe of book.recipes){
    const content=recipe.revisions[0]!.content,extra=Math.min(remaining,100_000-content.notes.length);
    content.notes+='x'.repeat(extra);remaining-=extra;
  }
  assert.equal(remaining,0);
  assert.throws(()=>serializePrivateRecipeBook(book),/5000000/);
  current.sections.privateRecipes.recipes=book.recipes.slice(0,25);
  incoming.sections.privateRecipes.recipes=book.recipes.slice(25);
  before.privateRecipes=JSON.stringify(current.sections.privateRecipes);
  const choice:RestoreChoice={mode:'merge',sections:['privateRecipes'],preferenceFields:[]};
  const plan=planRestore(personal(current),incomingFile(incoming),choice,knownBackupReferences);
  const after=rawAfterRestore(before,plan,choice);
  assert.equal(utf8ByteLength(after.privateRecipes!),BACKUP_LIMIT);
  assert.equal(after.privateRecipes,JSON.stringify(book));
  assert.deepEqual(parsePrivateRecipeBook(after.privateRecipes!),book);
});
