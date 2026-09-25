import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {usedReferences} from './plan';
import type {LabProject} from '../lab/types';
import type {PrivateRecipe,PrivateRecipeContent} from '../private-recipes/types';
import {
  BACKUP_LIMIT,
  BackupError,
  parseFullBackup,
  planRestore,
  semanticFingerprint,
  serializeFullBackup,
  type FullBackup,
  type KnownReferences,
  type PersonalData,
  type RestoreChoice,
  type BackupReference,
} from '.';

const at='2026-09-10T12:00:00.000Z';

function content(title:string,amount='1 1/2',unit='source fl oz'):PrivateRecipeContent{return{
  title,description:'',servings:1,ingredients:[{id:'private-row',name:'Unknown cordial',amount,unit,ingredientId:'unknown-ingredient'}],
  steps:['Stir.'],method:'Stir.',glass:'Coupe',garnish:'',notes:'',
};}

function privateRecipe(title:string):PrivateRecipe{return{id:'private-one',private:true,createdAt:at,updatedAt:at,origin:{kind:'catalogue-version',
  cocktailId:'cocktail-one',versionId:'unknown-version',sourceId:'unknown-source',sourceTitle:'Archived source',sourceUrl:'https://example.com/source',
  versionTitle:'Archived version',capturedAt:at,capturedLocale:'en',snapshot:{...content(`${title} origin`),ingredients:[{id:'origin-row',name:'Old ingredient',amount:'2',unit:'parts'}]}},
  activeRevisionId:'revision-one',revisions:[{id:'revision-one',createdAt:at,content:content(title)}]};}

function labProject(name:string):LabProject{const version={id:'lab-version',name:'Version',createdAt:at,updatedAt:at,
  ingredients:[{id:'lab-row',name:'Unknown ingredient',amount:'0.75',unit:'original oz',ingredientId:'unknown-ingredient'}],method:'Stir.',notes:''};
  return{id:'lab-project',name,goal:'',createdAt:at,updatedAt:at,source:{cocktailId:'cocktail-one',versionId:'unknown-version',title:'Source drink',
    sourceTitle:'Archived source',url:'https://example.com/source',ingredients:[{id:'source-row',name:'Source ingredient',amount:'1',unit:'dash'}],method:'Build.'},
  versions:[version],batches:[{id:'batch-one',versionId:version.id,name:'Batch',createdAt:at,updatedAt:at,versionSnapshot:{...version,ingredients:version.ingredients.map(item=>({...item}))},
    medium:'ice',ratio:'',temperature:'',startedAt:'',endedAt:'',agitation:'',filtration:'',yield:'',outcome:'',nextStep:'',observations:[{id:'observation-one',time:'',temperature:'',aroma:'',palate:'',appearance:'',notes:''}]}]};}

function personal(labName='Current',privateTitle='Current'):PersonalData{return{sections:{
  preferences:{schemaVersion:1,value:{locale:'en',unit:'ml',motionPaused:false}},favorites:{schemaVersion:1,versionIds:['known-version']},
  pantry:{schemaVersion:1,ingredientIds:['unknown-ingredient'],brandsByIngredient:{'unknown-ingredient':['unknown-brand']}},bottles:{schemaVersion:1,ids:['known-bottle']},
  lab:{format:'glass-notes-lab',schemaVersion:1,exportedAt:at,projects:[labProject(labName)]},
  privateRecipes:{format:'glass-notes-private-recipes',schemaVersion:1,recipes:[privateRecipe(privateTitle)]},
},references:[{kind:'ingredient',id:'unknown-ingredient',name:'Old snapshot'},{kind:'brand',id:'unknown-brand',name:'Unknown brand'},
  {kind:'recipeVersion',id:'unknown-version',name:'Unknown version',sourceId:'unknown-source'},{kind:'source',id:'unknown-source',name:'Archived source',sourceUrl:'https://example.com/source'}]};}

function backup(data:PersonalData=personal()):FullBackup{return{format:'glass-notes-backup',schemaVersion:1,exportedAt:at,...data};}

const all:RestoreChoice={mode:'merge',sections:['preferences','favorites','pantry','bottles','lab','privateRecipes'],preferenceFields:['locale','unit','motionPaused']};
const known:KnownReferences={ingredient:new Set(),brand:new Set(),bottle:new Set(['known-bottle']),recipeVersion:new Set(['known-version']),source:new Set()};

test('full backup round trips exact source units and reference snapshot variants',()=>{
  const value=backup();value.references.push({kind:'ingredient',id:'unknown-ingredient',name:'New snapshot'},{kind:'ingredient',id:'unknown-ingredient',name:'New snapshot'});
  const parsed=parseFullBackup(serializeFullBackup(value));
  assert.equal(parsed.sections.lab.projects[0]!.versions[0]!.ingredients[0]!.unit,'original oz');
  assert.equal(parsed.sections.privateRecipes.recipes[0]!.revisions[0]!.content.ingredients[0]!.unit,'source fl oz');
  assert.deepEqual(parsed.references.filter(item=>item.kind==='ingredient').map(item=>item.name),['Old snapshot','New snapshot']);
});

test('semantic fingerprint is canonical SHA-256',()=>{
  const left=semanticFingerprint({b:'酒',a:[1,true]});
  const canonical='{"a":[1,true],"b":"酒"}';
  assert.equal(left,createHash('sha256').update(canonical).digest('hex'));
  assert.equal(left,semanticFingerprint({a:[1,true],b:'酒'}));
});

test('merge keeps colliding Lab and private recipes with stable full-tree remaps and is idempotent',()=>{
  const current=personal('Current lab','Current private');
  const incoming=backup(personal('Imported lab','Imported private'));
  incoming.references[0]={kind:'ingredient',id:'unknown-ingredient',name:'New snapshot'};
  const first=planRestore(current,incoming,all,known);
  assert.equal(first.next.sections.lab.projects.length,2);
  assert.equal(first.next.sections.privateRecipes.recipes.length,2);
  const importedLab=first.next.sections.lab.projects[1]!;
  assert.notEqual(importedLab.id,'lab-project');
  assert.notEqual(importedLab.versions[0]!.id,'lab-version');
  assert.equal(importedLab.batches[0]!.versionId,importedLab.versions[0]!.id);
  assert.equal(importedLab.batches[0]!.versionSnapshot.id,importedLab.versions[0]!.id);
  assert.equal(importedLab.batches[0]!.versionSnapshot.ingredients[0]!.id,importedLab.versions[0]!.ingredients[0]!.id);
  assert.equal(importedLab.versions[0]!.ingredients[0]!.unit,'original oz');
  const importedPrivate=first.next.sections.privateRecipes.recipes[1]!;
  assert.notEqual(importedPrivate.id,'private-one');
  assert.equal(importedPrivate.importedFromId,'private-one');
  assert.notEqual(importedPrivate.activeRevisionId,'revision-one');
  assert.notEqual(importedPrivate.origin.kind==='catalogue-version'&&importedPrivate.origin.snapshot.ingredients[0]!.id,'origin-row');
  assert.equal(first.conflicts.filter(item=>item.section==='lab').length,1);
  assert.equal(first.conflicts.filter(item=>item.section==='privateRecipes').length,1);
  assert.equal(first.conflicts.filter(item=>item.section==='references').length,1);
  assert.equal(first.next.references.filter(item=>item.kind==='ingredient').length,2);
  assert.equal(first.unresolved.filter(item=>item.kind==='ingredient').length,2);

  const second=planRestore(first.next,incoming,all,known);
  assert.equal(second.next.sections.lab.projects.length,2);
  assert.equal(second.next.sections.privateRecipes.recipes.length,2);
  assert.equal(second.preview.find(item=>item.section==='lab')!.added,0);
  assert.equal(second.preview.find(item=>item.section==='privateRecipes')!.added,0);
  assert.equal(second.conflicts.filter(item=>item.section==='lab'||item.section==='privateRecipes').length,0);
});

test('a nested id collision remaps the whole imported tree and unselected sections do not import reference variants',()=>{
  const current=personal();const incoming=backup(personal('Nested collision','Nested collision'));
  incoming.sections.lab.projects[0]!.id='different-project';
  incoming.sections.privateRecipes.recipes[0]!.id='different-recipe';
  incoming.references.push({kind:'recipeVersion',id:'known-version',name:'Unselected favorite snapshot'});
  const choice:RestoreChoice={mode:'merge',sections:['lab','privateRecipes'],preferenceFields:[]};
  const plan=planRestore(current,incoming,choice);
  const importedLab=plan.next.sections.lab.projects[1]!;
  assert.notEqual(importedLab.id,'different-project');
  assert.notEqual(importedLab.versions[0]!.id,'lab-version');
  const importedPrivate=plan.next.sections.privateRecipes.recipes[1]!;
  assert.notEqual(importedPrivate.id,'different-recipe');
  assert.notEqual(importedPrivate.activeRevisionId,'revision-one');
  assert.notEqual(plan.conflicts.find(item=>item.section==='lab')!.id,'different-project');
  assert.notEqual(plan.conflicts.find(item=>item.section==='privateRecipes')!.id,'different-recipe');
  assert.equal(plan.next.references.some(item=>item.id==='known-version'),false);
});

test('a private recipe imported with a remapped Lab tree reconnects to the resulting project, version, and batch',()=>{
  const current=personal('Existing lab','Existing private');const incoming=backup(personal('Imported lab','Imported private'));
  const importedRecipe=incoming.sections.privateRecipes.recipes[0]!,source=incoming.sections.lab.projects[0]!.source!;
  importedRecipe.origin={kind:'lab-version',projectId:'lab-project',versionId:'lab-version',batchId:'batch-one',projectTitle:'Imported lab',
    versionTitle:'Version',capturedAt:at,snapshot:content('Lab snapshot'),source};
  const first=planRestore(current,incoming,all);
  const lab=first.next.sections.lab.projects[1]!,recipe=first.next.sections.privateRecipes.recipes[1]!;
  assert.equal(recipe.origin.kind,'lab-version');
  if(recipe.origin.kind!=='lab-version')return;
  assert.equal(recipe.origin.projectId,lab.id);
  assert.equal(recipe.origin.versionId,lab.versions[0]!.id);
  assert.equal(recipe.origin.batchId,lab.batches[0]!.id);
  const second=planRestore(first.next,incoming,all);
  assert.equal(second.preview.find(item=>item.section==='privateRecipes')!.added,0);
});

test('replace affects selected sections and selected preference fields only',()=>{
  const current=personal();
  const incoming=backup(personal());
  incoming.sections.preferences.value={locale:'zh',unit:'oz',motionPaused:true};
  incoming.sections.favorites.versionIds=['replacement'];incoming.sections.bottles.ids=['incoming-bottle'];
  const choice:RestoreChoice={mode:'replace',sections:['preferences','favorites'],preferenceFields:['unit']};
  const plan=planRestore(current,incoming,choice);
  assert.deepEqual(plan.next.sections.favorites.versionIds,['replacement']);
  assert.deepEqual(plan.next.sections.bottles.ids,['known-bottle']);
  assert.deepEqual(plan.next.sections.preferences.value,{locale:'en',unit:'oz',motionPaused:false});
  assert.equal(plan.preferenceChanges.find(item=>item.field==='unit')!.applied,true);
  assert.equal(plan.preferenceChanges.find(item=>item.field==='locale')!.applied,false);
  assert.equal(plan.preview.find(item=>item.section==='preferences')!.conflicts,3);
  assert.equal(plan.preview.find(item=>item.section==='favorites')!.removed,1);
  assert.equal(plan.preview.find(item=>item.section==='bottles')!.selected,false);
});

test('replace preview reports stable identity removal and addition even when record content is otherwise equal',()=>{
  const current=personal(),incoming=backup(personal());
  incoming.sections.lab.projects[0]!.id='replacement-lab-id';
  incoming.sections.privateRecipes.recipes[0]!.id='replacement-private-id';
  const choice:RestoreChoice={mode:'replace',sections:['lab','privateRecipes'],preferenceFields:[]};
  const plan=planRestore(current,incoming,choice);
  for(const section of ['lab','privateRecipes'] as const){const row=plan.preview.find(item=>item.section===section)!;
    assert.equal(row.added,1);assert.equal(row.removed,1);assert.equal(row.same,0);}
});

test('parser rejects unsafe, unknown, malformed, oversized, and broken nested data before planning',()=>{
  const cases:[string,RegExp][]=[
    ['{',/invalid JSON/],
    [JSON.stringify({...backup(),extra:true}),/unsupported property extra/],
    ['{"format":"glass-notes-backup","schemaVersion":1,"exportedAt":"2026-09-10T12:00:00Z","sections":{},"references":[],"__proto__":{}}',/unsafe property/],
    [JSON.stringify({...backup(),exportedAt:'2026-09-10'}),/ISO 8601/],
  ];
  const broken=backup();broken.sections.lab.projects[0]!.batches[0]!.versionId='missing';cases.push([JSON.stringify(broken),/unknown version/]);
  const badPrivate=backup();badPrivate.sections.privateRecipes.recipes[0]!.activeRevisionId='missing';cases.push([JSON.stringify(badPrivate),/does not reference/]);
  for(const [raw,message] of cases)assert.throws(()=>parseFullBackup(raw),(error:unknown)=>error instanceof BackupError&&message.test(error.message));
  assert.throws(()=>parseFullBackup(' '.repeat(BACKUP_LIMIT+1)),/exceeds 5000000/);
});

test('reference traversal visits a reversed chain once instead of repeatedly scanning it',()=>{
  const current=personal(),count=2_000;let reads=0;
  current.sections.pantry={schemaVersion:1,ingredientIds:['chain-0'],brandsByIngredient:{}};
  const references:BackupReference[]=Array.from({length:count},(_,index)=>({
    get kind(){assert(++reads<=count*2,'reference traversal exceeded its linear work budget');return 'ingredient' as const;},
    id:`chain-${index}`,name:`Ingredient ${index}`,ingredientId:`chain-${index+1}`,
  })).reverse();
  const used=usedReferences(current.sections,references);
  for(let index=0;index<=count;index++)assert(used.has(`ingredient\0chain-${index}`));
  assert.equal(reads,count);
});

test('reference closure keeps every variant and handles cycles, separate kinds and dangling links',()=>{
  const current=personal();current.sections.pantry={schemaVersion:1,ingredientIds:['root'],brandsByIngredient:{}};
  const references:BackupReference[]=[
    {kind:'ingredient',id:'next',name:'Next',ingredientId:'root'},
    {kind:'source',id:'root',name:'Source root',sourceId:'missing-source'},
    {kind:'ingredient',id:'root',name:'First variant',ingredientId:'next'},
    {kind:'ingredient',id:'root',name:'Second variant',sourceId:'root'},
    {kind:'brand',id:'root',name:'Unrelated kind',ingredientId:'unreachable'},
    {kind:'ingredient',id:'unused',name:'Unused',ingredientId:'unused'},
  ];
  const used=usedReferences(current.sections,references);
  for(const key of ['ingredient\0root','ingredient\0next','source\0root','source\0missing-source'])assert(used.has(key));
  for(const key of ['brand\0root','ingredient\0unreachable','ingredient\0unused'])assert(!used.has(key));
  const incoming=backup(current);incoming.references=references;
  for(const mode of ['merge','replace'] as const){
    const plan=planRestore(personal(),incoming,{mode,sections:['pantry'],preferenceFields:[]});
    assert.deepEqual(plan.next.references.filter(ref=>ref.id==='root').map(ref=>ref.name),['Source root','First variant','Second variant']);
    assert(!plan.next.references.some(ref=>ref.id==='unused'||ref.kind==='brand'&&ref.id==='root'));
  }
});

test('many same-ID variants keep original order and only report the first new conflict',()=>{
  const current=personal();
  current.references=Array.from({length:1_000},(_,index)=>({kind:'ingredient',id:'unknown-ingredient',name:`Variant ${index}`}));
  const incoming=backup(personal());incoming.references=[...current.references].reverse();
  incoming.references.push({kind:'ingredient',id:'unknown-ingredient',name:'New variant'}, {kind:'ingredient',id:'unknown-ingredient',name:'Another variant'});
  const before=JSON.stringify({current,incoming});
  const plan=planRestore(current,incoming,{mode:'merge',sections:['pantry'],preferenceFields:[]});
  assert.deepEqual(plan.next.references,[...current.references,...incoming.references.slice(-2)]);
  assert.deepEqual(plan.conflicts.filter(ref=>ref.section==='references'),[
    {section:'references',id:'ingredient:unknown-ingredient',currentTitle:'Variant 0',incomingTitle:'New variant',action:'keep-both'},
  ]);
  assert.equal(JSON.stringify({current,incoming}),before);
  const again=planRestore(plan.next,incoming,{mode:'merge',sections:['pantry'],preferenceFields:[]});
  assert.deepEqual(again.next.references,plan.next.references);
  assert.equal(again.conflicts.filter(ref=>ref.section==='references').length,0);
});
