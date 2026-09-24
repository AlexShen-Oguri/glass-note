import assert from 'node:assert/strict';
import test from 'node:test';
import {LOCALES} from '../domain/contracts';
import {LabStore,parseLabBackup,type LabBatch,type LabSource} from '../domain/lab';
import {
  batchVersionSeed,
  compareLabBatches,
  createVersionFromBatch,
  toggleBatchComparisonSelection,
  type BatchVersionWriter,
} from '../domain/lab/batchComparison';
import {LAB_RESULTS_TRANSLATION_REVIEW,labResultsText,type LabResultsKey} from '../i18n/lab-results';

const at='2026-09-16T03:00:00.000Z';
const ingredient=(id:string,name:string,amount:string)=>({id,name,amount,unit:'oz',ingredientId:id});
const version=(id:string,name:string,ingredients= [ingredient('gin','Gin','1')])=>({id,name,createdAt:at,updatedAt:at,ingredients,method:'Stir with ice.',notes:'Recipe note.'});
const batch=(id:string,name:string,snapshot=version(`version-${id}`,`Recipe ${id}`)):LabBatch=>({
  id,versionId:snapshot.id,name,createdAt:at,updatedAt:at,versionSnapshot:snapshot,
  medium:'ice',ratio:'1:2',temperature:'4 C',startedAt:'10:00',endedAt:'10:05',
  agitation:'stirred',filtration:'fine strain',yield:'90 ml',outcome:`Outcome ${id}`,nextStep:`Next ${id}`,
  observations:[{id:`observation-${id}`,time:'2 min',temperature:'5 C',aroma:'juniper',palate:'dry',appearance:'clear',notes:`Note ${id}`}],
});

test('batch comparison is row-major, preserves duplicate rows, and detaches immutable snapshots',()=>{
  const first=batch('one','First',version('version-one','Recipe one',[
    ingredient('gin-a','Gin','1'),ingredient('gin-b','Gin','0.25'),
  ]));
  const second=batch('two','Second',version('version-two','Recipe two',[ingredient('gin-a','Gin','1.25')]));
  const before=JSON.stringify([first,second]);
  const comparison=compareLabBatches([first,second]);
  assert.equal(comparison.ingredientRows.length,2);
  assert.deepEqual(comparison.ingredientRows[0]!.cells.map(cell=>cell?.amount),['1','1.25']);
  assert.deepEqual(comparison.ingredientRows[1]!.cells.map(cell=>cell?.amount),['0.25',undefined]);
  assert.equal(comparison.fields.find(row=>row.field==='yield')?.cells[1],'90 ml');
  assert.equal(comparison.batches[0]!.observations[0]!.notes,'Note one');
  comparison.batches[0]!.versionSnapshot.ingredients[0]!.name='preview mutation';
  comparison.batches[0]!.observations[0]!.notes='preview mutation';
  assert.equal(JSON.stringify([first,second]),before);
  assert.throws(()=>compareLabBatches([first]),/batch-comparison-count/);
  assert.throws(()=>compareLabBatches([first,first]),/batch-comparison-duplicate/);
});

test('batch selection remains explicit and bounded to three available experiments',()=>{
  const available=['one','two','three','four'];
  let selected:string[]=[];
  selected=toggleBatchComparisonSelection(selected,'one',available);
  selected=toggleBatchComparisonSelection(selected,'two',available);
  selected=toggleBatchComparisonSelection(selected,'three',available);
  assert.deepEqual(selected,['one','two','three']);
  assert.deepEqual(toggleBatchComparisonSelection(selected,'four',available),selected);
  assert.deepEqual(toggleBatchComparisonSelection(selected,'two',available),['one','three']);
  assert.deepEqual(toggleBatchComparisonSelection(['missing','one','one'],'two',available),['one','two']);
});

test('new version copies the batch snapshot, keeps project source, and failed save retries without duplication',async()=>{
  let fail=false;
  let persisted='';
  const lab=new LabStore({getItem:async()=>null,setItem:async(_key,value)=>{if(fail)throw new Error('quota');persisted=value;}});
  await lab.load();
  const source:LabSource={cocktailId:'gin-tonic',versionId:'public-one',title:'Gin & Tonic',sourceTitle:'Public source',url:'https://example.com/source',ingredients:[ingredient('source-gin','Gin','1')],method:'Build.'};
  const projectId=lab.createProject({name:'Trials',source});
  let project=lab.getSnapshot().projects.find(item=>item.id===projectId)!;
  const originalVersionId=project.versions[0]!.id;
  lab.updateVersion(projectId,originalVersionId,{name:'Recorded recipe',ingredients:[ingredient('recorded-gin','Gin','1.5')],method:'Stir 20 seconds.',notes:'Original note.'});
  const batchId=lab.addBatch(projectId,originalVersionId);
  lab.updateVersion(projectId,originalVersionId,{ingredients:[ingredient('live-gin','Gin','2')],method:'Live edit.'});
  await lab.whenSaved();
  project=lab.getSnapshot().projects.find(item=>item.id===projectId)!;
  const recordedBatch=project.batches.find(item=>item.id===batchId)!;
  const sourceBefore=JSON.stringify(project.source);

  fail=true;
  const createdId=createVersionFromBatch(lab,projectId,recordedBatch,'Batch follow-up',`Source batch ${batchId}`);
  await lab.whenSaved();
  assert.equal(lab.saveStatus(),false);
  project=lab.getSnapshot().projects.find(item=>item.id===projectId)!;
  const created=project.versions.find(item=>item.id===createdId)!;
  assert.equal(created.ingredients[0]!.amount,'1.5');
  assert.equal(created.method,'Stir 20 seconds.');
  assert.match(created.notes,/Original note\.\n\nSource batch/);
  assert.equal(JSON.stringify(project.source),sourceBefore);
  assert.equal(project.versions.filter(item=>item.id===createdId).length,1);

  fail=false;
  assert.equal(await lab.retrySave(),true);
  const saved=parseLabBackup(persisted).projects.find(item=>item.id===projectId)!;
  assert.equal(saved.versions.filter(item=>item.id===createdId).length,1);
  assert.equal(saved.versions.find(item=>item.id===createdId)!.ingredients[0]!.amount,'1.5');

  lab.updateVersion(projectId,createdId,{ingredients:[ingredient('follow-up-gin','Gin','3')],method:'Shake.'});
  project=lab.getSnapshot().projects.find(item=>item.id===projectId)!;
  const unchangedBatch=project.batches.find(item=>item.id===batchId)!;
  assert.equal(unchangedBatch.versionSnapshot.ingredients[0]!.amount,'1.5');
  assert.equal(unchangedBatch.versionSnapshot.method,'Stir 20 seconds.');
});

test('a batch snapshot can create a version after its original editable version is gone',()=>{
  const calls:Array<string|undefined>=[];
  let update:Parameters<BatchVersionWriter['updateVersion']>[2]|undefined;
  const writer:BatchVersionWriter={
    addVersion:(_project,fromVersionId)=>{
      calls.push(fromVersionId);
      if(fromVersionId)throw Object.assign(new Error('missing original'),{code:'not-found'});
      return 'new-version';
    },
    updateVersion:(_project,_versionId,change)=>{update=change;},
    deleteVersion:()=>{},
  };
  const source=batch('orphan','Retained experiment');
  assert.equal(createVersionFromBatch(writer,'project',source,'Recovered follow-up','Source batch orphan'),'new-version');
  assert.deepEqual(calls,[source.versionId,undefined]);
  assert.equal(update?.ingredients?.[0]?.amount,source.versionSnapshot.ingredients[0]!.amount);
  assert.equal(update?.method,source.versionSnapshot.method);
});

test('a synchronous update error rolls back the just-created version',()=>{
  const created:string[]=[];
  const writer:BatchVersionWriter={
    addVersion:()=>{created.push('new-version');return 'new-version';},
    updateVersion:()=>{throw new Error('invalid update');},
    deleteVersion:(_project,id)=>{const index=created.indexOf(id);if(index>=0)created.splice(index,1);},
  };
  assert.throws(()=>createVersionFromBatch(writer,'project',batch('one','First'),'Follow-up','Source batch one'),/invalid update/);
  assert.deepEqual(created,[]);
});

test('version seed copies recipe facts and leaves observations out of the new notes',()=>{
  const source=batch('one','First');
  const before=JSON.stringify(source);
  const seed=batchVersionSeed(source,'  Next recipe  ','Started from batch one.');
  assert.equal(seed.name,'Next recipe');
  assert.notEqual(seed.ingredients,source.versionSnapshot.ingredients);
  assert.deepEqual(seed.ingredients,source.versionSnapshot.ingredients);
  assert.match(seed.notes,/Recipe note\.\n\nStarted from batch one\./);
  assert.doesNotMatch(seed.notes,/Outcome one|Note one|Next one/);
  assert.equal(JSON.stringify(source),before);
});

test('lab result copy covers eight locales and records pending native review',()=>{
  const keys:LabResultsKey[]=['tab','title','intro','empty','needAnother','recordExperiment','choose','chooseHint','selectedCount','comparison','scrollHint','recipeSnapshot','ingredient','notRecorded','observations','observationCount','noObservations','useAsStart','startTitle','startHint','versionName','suggestedName','createVersion','creating','saveFailed','retrySave','createFailed','noConclusion','sourceBatchNote'];
  for(const locale of LOCALES)for(const key of keys)assert.ok(labResultsText(locale,key,{count:2,number:1,batch:'Batch',id:'batch-id'}).trim(),`${locale}:${key}`);
  assert.equal(LAB_RESULTS_TRANSLATION_REVIEW.nativeSpeakerReviewComplete,false);
});
