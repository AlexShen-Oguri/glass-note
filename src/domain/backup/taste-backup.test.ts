import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from '../../content/catalogue';
import {recipeSnapshot} from '../making';
import {createFeedback} from '../taste';
import {fullBackupFromRaw,rawAfterRestore} from '../../platform/backupAdapter';
import {PERSONAL_KEYS,type RawPersonalData} from '../../platform/personalStorage';
import {BACKUP_SECTIONS,planRestore,parseFullBackup,serializeFullBackup,type FullBackup,type RestoreChoice} from '.';
const now='2026-09-11T12:00:00.000Z';
const raw=()=>Object.fromEntries(Object.keys(PERSONAL_KEYS).map(key=>[key,null])) as RawPersonalData;
const backup=()=>fullBackupFromRaw(raw(),'zh',now);
const choice:RestoreChoice={mode:'merge',sections:[...BACKUP_SECTIONS],preferenceFields:[]};
const personal=(b:FullBackup)=>({sections:b.sections,references:b.references});
const entry=()=>createFeedback(recipeSnapshot(catalogue,catalogue.versions[0]!.id)!,'taste-one',now,{experience:'both',sentiment:'like',tooSweet:true,tooStrong:false,likedFlavours:['citrus'],notes:'保留我的笔记'});

test('v3 requires memory; older v1 and v2 replace never clear missing memory',()=>{
  const current=backup();current.sections.taste!.entries=[entry()];
  const broken=backup();delete broken.sections.taste;assert.throws(()=>serializeFullBackup(broken));
  for(const schemaVersion of [1,2] as const){
    const older=backup();older.schemaVersion=schemaVersion;delete older.sections.taste;if(schemaVersion===1)delete older.sections.making;
    const result=planRestore(personal(current),parseFullBackup(serializeFullBackup(older)),{...choice,mode:'replace'});
    assert.deepEqual(result.next.sections.taste,current.sections.taste);assert.equal(result.preview.find(p=>p.section==='taste')!.selected,false);
    assert.equal(rawAfterRestore(raw(),result,choice).taste,undefined);
  }
});
test('taste backup preserves snapshots, times, conflicting notes and is idempotent after remapping',()=>{
  const current=backup(),incoming=backup();current.sections.taste!.entries=[entry()];
  incoming.sections.taste!.entries=[{...entry(),notes:'另一台设备记录',updatedAt:'2026-09-11T13:00:00.000Z'}];
  const once=planRestore(personal(current),parseFullBackup(serializeFullBackup(incoming)),choice);
  assert.equal(once.next.sections.taste!.entries.length,2);assert.equal(once.conflicts.find(c=>c.section==='taste')!.action,'keep-both');
  const imported=once.next.sections.taste!.entries[1]!;assert.notEqual(imported.id,entry().id);assert.deepEqual(imported.recipe,entry().recipe);assert.equal(imported.createdAt,now);
  const twice=planRestore(once.next,incoming,choice);assert.equal(twice.next.sections.taste!.entries.length,2);
  const replaced=planRestore(once.next,incoming,{...choice,mode:'replace'});assert.equal(replaced.next.sections.taste!.entries.length,1);assert.equal(replaced.next.sections.taste!.entries[0]!.notes,'另一台设备记录');
});
test('unknown memory references survive current catalogue changes and exported raw restore',()=>{
  const before=raw(),value=entry();value.recipe.version.id='archived-version';value.recipe.source.id='archived-source';value.recipe.version.sourceId='archived-source';
  value.recipe.source.url='https://example.com/archived-source';
  value.recipe.version.ingredients[0]!.brandId='archived-brand';value.recipe.brandNames['archived-brand']='Archived specified brand';
  before.taste=JSON.stringify({format:'glass-notes-taste',schemaVersion:1,entries:[value]});
  const exported=fullBackupFromRaw(before,'ja',now);assert.ok(exported.references.some(ref=>ref.kind==='recipeVersion'&&ref.id==='archived-version'));
  assert.ok(exported.references.some(ref=>ref.kind==='brand'&&ref.id==='archived-brand'&&ref.name==='Archived specified brand'));
  const plan=planRestore(personal(backup()),parseFullBackup(serializeFullBackup(exported)),choice);
  const restored=rawAfterRestore(raw(),plan,choice);assert.deepEqual(JSON.parse(restored.taste!).entries[0],value);
});
