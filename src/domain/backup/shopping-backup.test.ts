import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from '../../content/catalogue';
import {recipeSnapshot} from '../making';
import {addShoppingTarget,emptyShoppingState,planShoppingPurchase,validateShoppingState} from '../shopping';
import {parseFullBackup,planRestore,serializeFullBackup} from '.';
import {fullBackupFromRaw,rawAfterRestore} from '../../platform/backupAdapter';
import {PersonalStorage,PERSONAL_KEYS,type RawPersonalData} from '../../platform/personalStorage';
import {purchaseShoppingItem} from '../../platform/shoppingPurchase';
const now='2026-10-13T12:00:00Z',pantry={ingredientIds:[],brandsByIngredient:{}};
const raw=()=>Object.fromEntries(Object.keys(PERSONAL_KEYS).map(k=>[k,null])) as RawPersonalData;
const state=()=>addShoppingTarget(emptyShoppingState(),catalogue,recipeSnapshot(catalogue,catalogue.versions[0]!.id)!,pantry);
const backup=()=>{const data=raw();data.shopping=JSON.stringify(state());return fullBackupFromRaw(data,'en',now);};
const personal=(value:ReturnType<typeof backup>)=>({sections:value.sections,references:value.references});
const choice={mode:'merge' as const,sections:['shopping' as const],preferenceFields:[]};
test('shopping exports under full schema 3 with frozen snapshots and canonical references',()=>{
 const original=backup();assert(original.sections.shopping,'full export must include shopping');assert.equal(original.schemaVersion,3);
 const restored=parseFullBackup(serializeFullBackup(original));assert.deepEqual(restored.sections.shopping,state());
 for(const item of state().items)assert(restored.references.some(r=>r.kind==='ingredient'&&r.id===item.ingredientId));
 assert(restored.references.some(r=>r.kind==='recipeVersion'&&r.id===state().targets[0]!.recipe.version.id));
});
test('valid long shopping labels survive import, subsequent export and an atomic purchase without shortening frozen facts',async()=>{
 const incoming=backup(),target=incoming.sections.shopping!.targets[0]!;
 target.recipe.title.en='t'.repeat(1999)+'🍸 long frozen title';
 target.recipe.source.title='Source title '+ 's'.repeat(2001);
 target.recipe.ingredientNames[target.recipe.version.ingredients[0]!.ingredientId]!.en='Frozen ingredient '+ 'i'.repeat(2001);
 target.rows[0]!.candidates[0]!.name.en='Purchase candidate '+ 'c'.repeat(19_981);
 for(const item of incoming.sections.shopping!.items)if(item.ingredientId===target.rows[0]!.candidates[0]!.ingredientId)item.name=structuredClone(target.rows[0]!.candidates[0]!.name);
 target.fingerprint=snapshotFingerprint(target.recipe);
 const imported=parseFullBackup(serializeFullBackup(incoming));
 const frozen=JSON.stringify(imported.sections.shopping!.targets);
 const before=raw(),current=fullBackupFromRaw(before,'en',now);
 const plan=planRestore(personal(current),imported,choice),after=rawAfterRestore(before,plan,choice);
 const values=new Map<string,string>();
 const storage=new PersonalStorage({getItem:async key=>values.get(key)??null,setItem:async(key,value)=>{values.set(key,value);},removeItem:async key=>{values.delete(key);}});
 await storage.initialize();await storage.restore(before,after);
 const exported=parseFullBackup(serializeFullBackup(fullBackupFromRaw(await storage.readAll(),'en',now)));
 assert.equal(JSON.stringify(exported.sections.shopping!.targets),frozen);
 assert(exported.references.every(reference=>reference.name.length<=2000&&(reference.sourceTitle?.length??0)<=2000));
 assert(exported.references.every(reference=>!/[\uD800-\uDBFF]$/.test(reference.name)&&!/[\uD800-\uDBFF]$/.test(reference.sourceTitle??'')),'derived labels must not split a supplementary character');
 assert(exported.references.some(reference=>reference.kind==='recipeVersion'&&reference.id===target.recipe.version.id&&reference.sourceId===target.recipe.source.id&&reference.sourceUrl===target.recipe.source.url));
 const item=imported.sections.shopping!.items[0]!;
 assert(await purchaseShoppingItem({prepare:storage.readAll,restore:storage.restore},item.id,catalogue));
 const purchased=parseFullBackup(serializeFullBackup(fullBackupFromRaw(await storage.readAll(),'en',now)));
 assert.equal(JSON.stringify(purchased.sections.shopping!.targets),frozen);
 assert(purchased.sections.shopping!.items.find(row=>row.id===item.id)!.bought);
 assert(purchased.sections.pantry.ingredientIds.includes(item.ingredientId));
});
for(const schemaVersion of [1,2,3] as const)test(`older schema ${schemaVersion} without shopping preserves exact local data even on replace`,()=>{
 const current=backup();assert(current.sections.shopping);const incoming=structuredClone(current);incoming.schemaVersion=schemaVersion;delete incoming.sections.shopping;
 if(schemaVersion<3)delete incoming.sections.taste;if(schemaVersion<2)delete incoming.sections.making;
 const restored=planRestore(personal(current),parseFullBackup(serializeFullBackup(incoming)),{...choice,mode:'replace'});
 assert.deepEqual(restored.next.sections.shopping,current.sections.shopping);assert.equal(restored.preview.find(r=>r.section==='shopping')!.selected,false);
 const before=raw();before.shopping=JSON.stringify(current.sections.shopping,null,2);
 assert.equal(rawAfterRestore(before,restored,{...choice,mode:'replace'}).shopping,undefined);
});
test('merge preserves bought guard for the same canonical purchase while remapping conflicting target and item IDs',()=>{
 const current=backup();assert(current.sections.shopping);const incoming=backup();
 current.sections.shopping=planShoppingPurchase(current.sections.shopping,pantry,current.sections.shopping.items[0]!.id,catalogue).shopping;
 const other=structuredClone(incoming.sections.shopping!);const target=other.targets[0]!;target.recipe.title.en='Another exact version';target.fingerprint=(snapshotFingerprint(target.recipe));
 // Reuse target ID with a different exact recipe; item ID also deliberately conflicts with another canonical identity.
 other.items[1]!.id=other.items[0]!.id+'-conflict';current.sections.shopping.items[0]!.id=other.items[1]!.id;
 incoming.sections.shopping=validateShoppingState(other);
 const once=planRestore(personal(current),incoming,choice);assert.equal(once.next.sections.shopping!.targets.length,2);assert(once.conflicts.some(c=>c.section==='shopping'&&c.action==='keep-both'));
 assert(once.next.sections.shopping!.items.find(i=>i.ingredientId===current.sections.shopping!.items[0]!.ingredientId)!.bought);
 assert.equal(new Set(once.next.sections.shopping!.items.map(i=>i.id)).size,once.next.sections.shopping!.items.length);
 const twice=planRestore(once.next,incoming,choice);assert.deepEqual(twice.next.sections.shopping,once.next.sections.shopping);
});
import {recipeFingerprint as snapshotFingerprint} from '../making';
test('invalid shopping and combined section-size overflow reject before producing restore after-images',()=>{
 const current=backup();assert(current.sections.shopping);const bad=structuredClone(current);bad.sections.shopping!.items[0]!.refs[0]!.rowId='invalid';assert.throws(()=>parseFullBackup(JSON.stringify(bad)),/reference/);
 const incoming=backup();const recipe=incoming.sections.shopping!.targets[0]!.recipe;
 // Individually valid snapshots together exceed 5 MB after merge.
 recipe.version.steps.en=Array.from({length:125},()=> 'x'.repeat(20_000));recipe.title.en='Large incoming';incoming.sections.shopping!.targets[0]!.fingerprint=snapshotFingerprint(recipe);
 const left=structuredClone(incoming);left.sections.shopping!.targets[0]!.recipe.title.en='Large current';left.sections.shopping!.targets[0]!.fingerprint=snapshotFingerprint(left.sections.shopping!.targets[0]!.recipe);
 assert.throws(()=>planRestore(personal(left),incoming,choice),/large/);
});
test('shopping after-images use the strict normal reader while unselected raw stays untouched',()=>{
 const current=fullBackupFromRaw(raw(),'en',now),incoming=backup();assert(incoming.sections.shopping);
 const plan=planRestore(personal(current),incoming,choice),after=rawAfterRestore(raw(),plan,choice);
 assert.deepEqual(validateShoppingState(JSON.parse(after.shopping!)),state());
 assert.equal(after.pantry,undefined);assert.equal(after.making,undefined);assert.equal(after.taste,undefined);
});

test('different OR choices keep both frozen targets and the bought alternative through repeated imports and older replacements',()=>{
 const source=recipeSnapshot(catalogue,'carino-batch-j')!,a=addShoppingTarget(emptyShoppingState(),catalogue,source,pantry);
 const target=a.targets[0]!,row=target.rows.find(r=>r.candidates.some(c=>c.ingredientId==='genepy-liqueur'))!;
 const selected=selectAlternative(a,target.id,row.rowId,'genepy-liqueur'),genepy=selected.items.find(i=>i.ingredientId==='genepy-liqueur')!;
 const purchased=planShoppingPurchase(selected,pantry,genepy.id,catalogue).shopping;
 const current=backup(),incoming=backup();current.sections.shopping=a;incoming.sections.shopping=purchased;
 const merged=planRestore(personal(current),incoming,choice);assert.equal(merged.next.sections.shopping!.targets.length,2);
 assert(merged.next.sections.shopping!.items.find(i=>i.ingredientId==='genepy-liqueur')!.bought);
 const repeated=planRestore(merged.next,incoming,choice);assert.deepEqual(repeated.next.sections.shopping,merged.next.sections.shopping);
 const older=structuredClone(incoming);older.sections.shopping=selected;
 const replaced=planRestore(repeated.next,older,{...choice,mode:'replace'});assert(replaced.next.sections.shopping!.items.find(i=>i.ingredientId==='genepy-liqueur')!.bought);
});
import {selectShoppingAlternative as selectAlternative} from '../shopping';
