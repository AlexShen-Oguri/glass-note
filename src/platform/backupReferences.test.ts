import assert from 'node:assert/strict';
import test from 'node:test';
import type {LabBackup,LabIngredient,LabSource,LabVersion} from '../domain/lab/types';
import type {PrivateIngredient,PrivateRecipeBook,PrivateRecipeContent} from '../domain/private-recipes/types';
import {parseFullBackup,serializeFullBackup} from '../domain/backup';
import {catalogue} from '../content/catalogue';
import {createSession,recipeFingerprint,recipeSnapshot} from '../domain/making';
import {createFeedback} from '../domain/taste';
import {fullBackupFromRaw} from './backupAdapter';
import {PERSONAL_KEYS,type RawPersonalData} from './personalStorage';

const at='2026-09-10T18:00:00.000Z';
const labRow=(id:string,bottleId:string,bottleName:string):LabIngredient=>({id,name:`${id} ingredient`,amount:'1.250',unit:'source oz',ingredientId:`${id}-ingredient`,bottleId,bottleName});
const privateRow=(id:string,brandId:string,bottleId:string):PrivateIngredient=>({id,name:`${id} ingredient`,amount:'2 1/4',unit:'original parts',ingredientId:`${id}-ingredient`,brandId,brandName:`${id} brand`,bottleId,bottleName:`${id} bottle`});
const content=(title:string,row:PrivateIngredient):PrivateRecipeContent=>({title,description:'Snapshot description',servings:1,ingredients:[row],steps:['Stir.'],method:'Stir',glass:'Coupe',garnish:'Peel',notes:'Keep exact source units'});

function rawFixture():RawPersonalData{
  const raw=Object.fromEntries(Object.keys(PERSONAL_KEYS).map(key=>[key,null])) as RawPersonalData;
  const source:LabSource={cocktailId:'reference-fixture-lab-cocktail',versionId:'reference-fixture-lab-source-version',title:'Archived Lab source',sourceTitle:'Archived source title',url:'https://example.com/lab-source',
    ingredients:[labRow('lab-source-row','reference-fixture-lab-source-bottle','Lab source bottle')],method:'Build'};
  const version:LabVersion={id:'reference-fixture-lab-version',name:'Lab version',createdAt:at,updatedAt:at,
    ingredients:[labRow('lab-version-row','reference-fixture-lab-version-bottle','Lab version bottle')],method:'Stir',notes:''};
  const snapshot:LabVersion={...version,ingredients:[labRow('lab-batch-row','reference-fixture-lab-batch-bottle','Lab batch bottle')]};
  const lab:LabBackup={format:'glass-notes-lab',schemaVersion:1,exportedAt:at,projects:[{id:'reference-fixture-project',name:'Reference project',goal:'',createdAt:at,updatedAt:at,source,versions:[version],batches:[{
    id:'reference-fixture-batch',versionId:version.id,name:'Batch',createdAt:at,updatedAt:at,versionSnapshot:snapshot,medium:'ice',ratio:'',temperature:'',startedAt:'',endedAt:'',agitation:'',filtration:'',yield:'',outcome:'',nextStep:'',observations:[],
  }]}]};
  const privateLabSource:LabSource={...source,versionId:'reference-fixture-private-lab-source-version',ingredients:[labRow('private-source-row','reference-fixture-private-source-bottle','Private source bottle')]};
  const privateRecipes:PrivateRecipeBook={format:'glass-notes-private-recipes',schemaVersion:1,recipes:[{
    id:'reference-fixture-private-catalogue',private:true,createdAt:at,updatedAt:at,activeRevisionId:'reference-fixture-revision-catalogue',origin:{kind:'catalogue-version',cocktailId:'reference-fixture-cocktail',versionId:'reference-fixture-catalogue-version',sourceId:'reference-fixture-source',sourceTitle:'Private archived source',sourceUrl:'https://example.com/private-source',versionTitle:'Archived version',capturedAt:at,capturedLocale:'en',
      snapshot:content('Catalogue origin snapshot',privateRow('private-origin-row','reference-fixture-origin-brand','reference-fixture-origin-bottle'))},
    revisions:[{id:'reference-fixture-revision-catalogue',createdAt:at,content:content('Edited revision',privateRow('private-revision-row','reference-fixture-revision-brand','reference-fixture-revision-bottle'))}],
  },{
    id:'reference-fixture-private-lab',private:true,createdAt:at,updatedAt:at,activeRevisionId:'reference-fixture-revision-lab',origin:{kind:'lab-version',projectId:'reference-fixture-project',versionId:'reference-fixture-lab-version',batchId:'reference-fixture-batch',projectTitle:'Reference project',versionTitle:'Lab version',capturedAt:at,
      snapshot:content('Lab origin snapshot',privateRow('private-lab-origin-row','reference-fixture-lab-origin-brand','reference-fixture-lab-origin-bottle')),source:privateLabSource},
    revisions:[{id:'reference-fixture-revision-lab',createdAt:at,content:content('Lab-derived revision',privateRow('private-lab-revision-row','reference-fixture-lab-revision-brand','reference-fixture-lab-revision-bottle'))}],
  }]};
  raw.lab=JSON.stringify(lab);raw.privateRecipes=JSON.stringify(privateRecipes);return raw;
}

test('Lab and private nested source, origin, batch, and revision references export and round trip',()=>{
  const backup=fullBackupFromRaw(rawFixture(),'en',at);
  const expected:Array<['brand'|'bottle',string,string]>=[
    ['bottle','reference-fixture-lab-source-bottle','Lab source bottle'],['bottle','reference-fixture-lab-version-bottle','Lab version bottle'],['bottle','reference-fixture-lab-batch-bottle','Lab batch bottle'],
    ['brand','reference-fixture-origin-brand','private-origin-row brand'],['bottle','reference-fixture-origin-bottle','private-origin-row bottle'],
    ['brand','reference-fixture-revision-brand','private-revision-row brand'],['bottle','reference-fixture-revision-bottle','private-revision-row bottle'],
    ['brand','reference-fixture-lab-origin-brand','private-lab-origin-row brand'],['bottle','reference-fixture-lab-origin-bottle','private-lab-origin-row bottle'],
    ['bottle','reference-fixture-private-source-bottle','Private source bottle'],['brand','reference-fixture-lab-revision-brand','private-lab-revision-row brand'],['bottle','reference-fixture-lab-revision-bottle','private-lab-revision-row bottle'],
  ];
  for(const [kind,id,name] of expected)assert(backup.references.some(ref=>ref.kind===kind&&ref.id===id&&ref.name===name),`${kind}:${id}`);
  assert(backup.references.some(ref=>ref.kind==='source'&&ref.id==='reference-fixture-source'&&ref.name==='Private archived source'));
  assert(backup.references.some(ref=>ref.kind==='recipeVersion'&&ref.id==='reference-fixture-catalogue-version'&&ref.sourceId==='reference-fixture-source'));
  assert(backup.references.filter(ref=>ref.kind==='recipeVersion'&&ref.id==='reference-fixture-catalogue-version').length>=2,'same id snapshot variants are retained');
  const restored=parseFullBackup(serializeFullBackup(backup));
  assert.deepEqual(restored.references,backup.references);
  assert.deepEqual(restored.sections.lab,backup.sections.lab);
  assert.deepEqual(restored.sections.privateRecipes,backup.sections.privateRecipes);
  assert.equal(restored.sections.privateRecipes.recipes[0]!.origin.kind==='catalogue-version'&&restored.sections.privateRecipes.recipes[0]!.origin.snapshot.ingredients[0]!.unit,'original parts');
});

test('favourite, making and taste derived labels fit reference limits without editing their frozen source facts',()=>{
  const raw=rawFixture(),backup=fullBackupFromRaw(raw,'en',at),recipe=recipeSnapshot(catalogue,catalogue.versions[0]!.id)!;
  recipe.title.en='Archived recipe '+ 'r'.repeat(2001);recipe.source.title='Archived source '+ 's'.repeat(2001);
  const favorites={version:2,versionIds:[],lists:[{id:'long-label-list',name:'Saved list',createdAt:at,updatedAt:at,items:[{versionId:recipe.version.id,cocktailId:recipe.version.cocktailId,fingerprint:recipeFingerprint(recipe),addedAt:at,recipe}]}]};
  const making={...backup.sections.making,sessions:[createSession(recipe,'long-label-session',at)]};
  const taste={...backup.sections.taste,entries:[createFeedback(recipe,'long-label-taste',at,{experience:'drank',sentiment:'neutral',tooSweet:false,tooStrong:false,likedFlavours:[],notes:''})]};
  raw.favorites=JSON.stringify(favorites);raw.making=JSON.stringify(making);raw.taste=JSON.stringify(taste);
  const exported=parseFullBackup(serializeFullBackup(fullBackupFromRaw(raw,'en',at)));
  assert.deepEqual(exported.sections.favorites,{schemaVersion:2,versionIds:[],lists:favorites.lists});
  assert.deepEqual(exported.sections.making,making);assert.deepEqual(exported.sections.taste,taste);
  assert(exported.references.every(reference=>reference.name.length<=2000&&(reference.sourceTitle?.length??0)<=2000));
});

test('generated display summaries never repair invalid stored reference labels, identifiers or URLs',()=>{
  for(const reference of [
    {kind:'ingredient',id:'stored',name:'x'.repeat(2001)},
    {kind:'recipeVersion',id:'stored',name:'Valid',sourceTitle:'x'.repeat(2001)},
    {kind:'ingredient',id:'x'.repeat(201),name:'Valid'},
    {kind:'source',id:'stored',name:'Valid',sourceUrl:'javascript:alert(1)'},
    {kind:'source',id:'stored',name:'Valid',sourceUrl:'https://example.com/'+ 'x'.repeat(4096)},
  ]){
    const raw=rawFixture();raw.references=JSON.stringify([reference]);
    assert.throws(()=>fullBackupFromRaw(raw,'en',at));
  }
});
