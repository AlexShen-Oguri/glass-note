import assert from 'node:assert/strict';
import test from 'node:test';
import type {LabBackup,LabIngredient,LabSource,LabVersion} from '../domain/lab/types';
import type {PrivateIngredient,PrivateRecipeBook,PrivateRecipeContent} from '../domain/private-recipes/types';
import {parseFullBackup,serializeFullBackup} from '../domain/backup';
import {fullBackupFromRaw} from './backupAdapter';
import {PERSONAL_KEYS,type RawPersonalData} from './personalStorage';

const at='2026-09-10T18:00:00.000Z';
const labRow=(id:string,bottleId:string,bottleName:string):LabIngredient=>({id,name:`${id} ingredient`,amount:'1.250',unit:'source oz',ingredientId:`${id}-ingredient`,bottleId,bottleName});
const privateRow=(id:string,brandId:string,bottleId:string):PrivateIngredient=>({id,name:`${id} ingredient`,amount:'2 1/4',unit:'original parts',ingredientId:`${id}-ingredient`,brandId,brandName:`${id} brand`,bottleId,bottleName:`${id} bottle`});
const content=(title:string,row:PrivateIngredient):PrivateRecipeContent=>({title,description:'Snapshot description',servings:1,ingredients:[row],steps:['Stir.'],method:'Stir',glass:'Coupe',garnish:'Peel',notes:'Keep exact source units'});

function rawFixture():RawPersonalData{
  const raw=Object.fromEntries(Object.keys(PERSONAL_KEYS).map(key=>[key,null])) as RawPersonalData;
  const source:LabSource={cocktailId:'round14-lab-cocktail',versionId:'round14-lab-source-version',title:'Archived Lab source',sourceTitle:'Archived source title',url:'https://example.com/lab-source',
    ingredients:[labRow('lab-source-row','round14-lab-source-bottle','Lab source bottle')],method:'Build'};
  const version:LabVersion={id:'round14-lab-version',name:'Lab version',createdAt:at,updatedAt:at,
    ingredients:[labRow('lab-version-row','round14-lab-version-bottle','Lab version bottle')],method:'Stir',notes:''};
  const snapshot:LabVersion={...version,ingredients:[labRow('lab-batch-row','round14-lab-batch-bottle','Lab batch bottle')]};
  const lab:LabBackup={format:'glass-notes-lab',schemaVersion:1,exportedAt:at,projects:[{id:'round14-project',name:'Reference project',goal:'',createdAt:at,updatedAt:at,source,versions:[version],batches:[{
    id:'round14-batch',versionId:version.id,name:'Batch',createdAt:at,updatedAt:at,versionSnapshot:snapshot,medium:'ice',ratio:'',temperature:'',startedAt:'',endedAt:'',agitation:'',filtration:'',yield:'',outcome:'',nextStep:'',observations:[],
  }]}]};
  const privateLabSource:LabSource={...source,versionId:'round14-private-lab-source-version',ingredients:[labRow('private-source-row','round14-private-source-bottle','Private source bottle')]};
  const privateRecipes:PrivateRecipeBook={format:'glass-notes-private-recipes',schemaVersion:1,recipes:[{
    id:'round14-private-catalogue',private:true,createdAt:at,updatedAt:at,activeRevisionId:'round14-revision-catalogue',origin:{kind:'catalogue-version',cocktailId:'round14-cocktail',versionId:'round14-catalogue-version',sourceId:'round14-source',sourceTitle:'Private archived source',sourceUrl:'https://example.com/private-source',versionTitle:'Archived version',capturedAt:at,capturedLocale:'en',
      snapshot:content('Catalogue origin snapshot',privateRow('private-origin-row','round14-origin-brand','round14-origin-bottle'))},
    revisions:[{id:'round14-revision-catalogue',createdAt:at,content:content('Edited revision',privateRow('private-revision-row','round14-revision-brand','round14-revision-bottle'))}],
  },{
    id:'round14-private-lab',private:true,createdAt:at,updatedAt:at,activeRevisionId:'round14-revision-lab',origin:{kind:'lab-version',projectId:'round14-project',versionId:'round14-lab-version',batchId:'round14-batch',projectTitle:'Reference project',versionTitle:'Lab version',capturedAt:at,
      snapshot:content('Lab origin snapshot',privateRow('private-lab-origin-row','round14-lab-origin-brand','round14-lab-origin-bottle')),source:privateLabSource},
    revisions:[{id:'round14-revision-lab',createdAt:at,content:content('Lab-derived revision',privateRow('private-lab-revision-row','round14-lab-revision-brand','round14-lab-revision-bottle'))}],
  }]};
  raw.lab=JSON.stringify(lab);raw.privateRecipes=JSON.stringify(privateRecipes);return raw;
}

test('Lab and private nested source, origin, batch, and revision references export and round trip',()=>{
  const backup=fullBackupFromRaw(rawFixture(),'en',at);
  const expected:Array<['brand'|'bottle',string,string]>=[
    ['bottle','round14-lab-source-bottle','Lab source bottle'],['bottle','round14-lab-version-bottle','Lab version bottle'],['bottle','round14-lab-batch-bottle','Lab batch bottle'],
    ['brand','round14-origin-brand','private-origin-row brand'],['bottle','round14-origin-bottle','private-origin-row bottle'],
    ['brand','round14-revision-brand','private-revision-row brand'],['bottle','round14-revision-bottle','private-revision-row bottle'],
    ['brand','round14-lab-origin-brand','private-lab-origin-row brand'],['bottle','round14-lab-origin-bottle','private-lab-origin-row bottle'],
    ['bottle','round14-private-source-bottle','Private source bottle'],['brand','round14-lab-revision-brand','private-lab-revision-row brand'],['bottle','round14-lab-revision-bottle','private-lab-revision-row bottle'],
  ];
  for(const [kind,id,name] of expected)assert(backup.references.some(ref=>ref.kind===kind&&ref.id===id&&ref.name===name),`${kind}:${id}`);
  assert(backup.references.some(ref=>ref.kind==='source'&&ref.id==='round14-source'&&ref.name==='Private archived source'));
  assert(backup.references.some(ref=>ref.kind==='recipeVersion'&&ref.id==='round14-catalogue-version'&&ref.sourceId==='round14-source'));
  assert(backup.references.filter(ref=>ref.kind==='recipeVersion'&&ref.id==='round14-catalogue-version').length>=2,'same id snapshot variants are retained');
  const restored=parseFullBackup(serializeFullBackup(backup));
  assert.deepEqual(restored.references,backup.references);
  assert.deepEqual(restored.sections.lab,backup.sections.lab);
  assert.deepEqual(restored.sections.privateRecipes,backup.sections.privateRecipes);
  assert.equal(restored.sections.privateRecipes.recipes[0]!.origin.kind==='catalogue-version'&&restored.sections.privateRecipes.recipes[0]!.origin.snapshot.ingredients[0]!.unit,'original parts');
});
