import test from 'node:test';
import assert from 'node:assert/strict';
import {fullBackupFromRaw,knownBackupReferences,rawAfterRestore} from './backupAdapter';
import {PERSONAL_KEYS,type RawPersonalData} from './personalStorage';
import {parseFullBackup,planRestore,serializeFullBackup} from '../domain/backup';
import {FavoritesStore,parseFavoritesState} from '../domain/favorites';
import {recipeFingerprint,recipeSnapshot} from '../domain/making';
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
