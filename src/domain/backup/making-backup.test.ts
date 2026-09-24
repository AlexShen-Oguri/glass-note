import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from '../../content/catalogue';
import {createSession,recipeSnapshot,planConsumption} from '../making';
import {emptyMakingState} from '../making/types';
import {BACKUP_SECTIONS,parseFullBackup,planRestore,serializeFullBackup,type FullBackup,type RestoreChoice} from '.';
import {fullBackupFromRaw,rawAfterRestore} from '../../platform/backupAdapter';
import {PERSONAL_KEYS,type RawPersonalData} from '../../platform/personalStorage';
const now='2026-09-11T00:00:00.000Z';
const raw=()=>Object.fromEntries(Object.keys(PERSONAL_KEYS).map(k=>[k,null])) as RawPersonalData;
const make=()=>{const value=fullBackupFromRaw(raw(),'zh',now);value.schemaVersion=2;delete value.sections.taste;return value;};
const personal=(b:FullBackup)=>({sections:b.sections,references:b.references});
const choice:RestoreChoice={mode:'merge',sections:[...BACKUP_SECTIONS],preferenceFields:[]};

test('v1 backup cannot clear quantities or progress even when replace asks for every category',()=>{
  const current=make();current.sections.making!.stock=[{ingredientId:'future-material',amount:120,unit:'ml'}];
  const old=make();old.schemaVersion=1;delete old.sections.making;
  const restored=planRestore(personal(current),parseFullBackup(serializeFullBackup(old)),{...choice,mode:'replace'});
  assert.deepEqual(restored.next.sections.making,current.sections.making);
  assert.equal(restored.preview.find(row=>row.section==='making')!.selected,false);
  const before=raw();before.making=JSON.stringify(current.sections.making);
  assert.equal(rawAfterRestore(before,restored,{...choice,mode:'replace'}).making,undefined);
});
test('making quantities conflict visibly and are never summed when merging backups',()=>{
  const current=make(),incoming=make();current.sections.making!.stock=[{ingredientId:'gin',amount:60,unit:'ml'}];incoming.sections.making!.stock=[{ingredientId:'gin',amount:500,unit:'ml'}];
  const merge=planRestore(personal(current),incoming,choice);assert.equal(merge.next.sections.making!.stock[0]!.amount,60);
  assert.equal(merge.conflicts[0]!.action,'keep-current');
  const replace=planRestore(personal(current),incoming,{...choice,mode:'replace'});assert.equal(replace.next.sections.making!.stock[0]!.amount,500);assert.equal(replace.conflicts[0]!.action,'replace');
});
test('source snapshots and deduction identity survive a conflicting session import and repeating that import',()=>{
  const current=make(),incoming=make();const recipe=recipeSnapshot(catalogue,catalogue.versions[0]!.id)!;
  const session=createSession(recipe,'round15-session',now);session.completed=true;session.consumptionApplied=true;
  current.sections.making!.sessions=[session];incoming.sections.making!.sessions=[{...session,stepIndex:0,consumptionApplied:false,updatedAt:'2026-09-11T00:01:00.000Z'}];
  const once=planRestore(personal(current),incoming,choice);
  assert.equal(once.next.sections.making!.sessions.length,2);
  assert.ok(once.next.sections.making!.sessions.every(s=>s.consumptionApplied&&s.consumptionId===session.consumptionId));
  assert.deepEqual(once.next.sections.making!.sessions[1]!.recipe,recipe);
  assert.throws(()=>planConsumption(once.next.sections.making!.sessions[1]!,once.next.sections.making!));
  const twice=planRestore(once.next,incoming,choice);
  assert.equal(twice.next.sections.making!.sessions.length,2);
});
test('v2 requires its new section and v1 rejects unrecognized new data',()=>{
  const broken=make();delete broken.sections.making;assert.throws(()=>serializeFullBackup(broken));
  assert.throws(()=>serializeFullBackup({...make(),schemaVersion:1}));
  const legacy=make();legacy.schemaVersion=1;delete legacy.sections.making;assert.equal(parseFullBackup(serializeFullBackup(legacy)).sections.making,undefined);
  const state=emptyMakingState();assert.deepEqual(parseFullBackup(serializeFullBackup(make())).sections.making,state);
});

test('restoring an older copy of the same batch retains its already-applied deduction guard',()=>{
  const current=make(),incoming=make();const session=createSession(recipeSnapshot(catalogue,catalogue.versions[0]!.id)!,'used-batch',now);
  current.sections.making!.sessions=[{...session,completed:true,consumptionApplied:true}];
  incoming.sections.making!.sessions=[{...session,completed:true}];
  const replaced=planRestore(personal(current),incoming,{...choice,mode:'replace'});
  assert.equal(replaced.next.sections.making!.sessions[0]!.consumptionApplied,true);
  assert.throws(()=>planConsumption(replaced.next.sections.making!.sessions[0]!,replaced.next.sections.making!));
});

test('preparation confirmations for different snapshots of the same version both survive merge',()=>{
  const current=make(),incoming=make();
  current.sections.making!.reviews=[{versionId:'changed-version',fingerprint:'a'.repeat(64),toolsConfirmed:true,preparationConfirmed:false}];
  incoming.sections.making!.reviews=[{versionId:'changed-version',fingerprint:'b'.repeat(64),toolsConfirmed:false,preparationConfirmed:true}];
  const merged=planRestore(personal(current),incoming,choice);
  assert.equal(merged.next.sections.making!.reviews.length,2);assert.equal(merged.conflicts.length,0);
});
