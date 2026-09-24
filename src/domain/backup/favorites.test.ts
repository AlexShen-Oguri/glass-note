import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from '../../content/catalogue';
import type {FavoriteList} from '../favorites';
import {recipeFingerprint,recipeSnapshot} from '../making';
import {favoriteSectionCount,restoreFavorites} from './favorites';
import {parseFullBackup} from './validation';
import {planRestore} from './plan';
import type {FullBackup,PersonalData,RestoreChoice} from './types';

const at='2026-09-17T00:00:00.000Z';
const firstVersion=catalogue.versions[0]!;
const recipe=recipeSnapshot(catalogue,firstVersion.id)!;

function list(id:string,name='Evening'):FavoriteList{return{id,name,createdAt:at,updatedAt:at,items:[{
  versionId:recipe.version.id,cocktailId:recipe.version.cocktailId,fingerprint:recipeFingerprint(recipe),addedAt:at,recipe,
}]};}

function personal(favorites:PersonalData['sections']['favorites']):PersonalData{return{sections:{
  preferences:{schemaVersion:1,value:{locale:'en',unit:'ml',motionPaused:false}},favorites,
  pantry:{schemaVersion:1,ingredientIds:[],brandsByIngredient:{}},bottles:{schemaVersion:1,ids:[]},
  lab:{format:'glass-notes-lab',schemaVersion:1,exportedAt:at,projects:[]},privateRecipes:{format:'glass-notes-private-recipes',schemaVersion:1,recipes:[]},
},references:[]};}

function backup(favorites:PersonalData['sections']['favorites']):FullBackup{return{format:'glass-notes-backup',schemaVersion:1,exportedAt:at,...personal(favorites)};}

test('legacy favorites replacement changes IDs but preserves current private lists',()=>{
  const current={schemaVersion:2 as const,versionIds:['old'],lists:[list('current-list')]};
  const result=restoreFavorites(current,{schemaVersion:1,versionIds:[]},'replace');
  assert.deepEqual(result.value,{schemaVersion:2,versionIds:[],lists:current.lists});
  assert.equal(result.legacyListsPreserved,true);
  assert.equal(result.removed,1);
  assert.equal(favoriteSectionCount(result.value),2);
});

test('legacy replacement preview keeps a nonzero list result and carries the explicit protection notice',()=>{
  const current=personal({schemaVersion:2,versionIds:['old'],lists:[list('current-list')]});
  const incoming=backup({schemaVersion:1,versionIds:[]});
  const result=planRestore(current,incoming,{mode:'replace',sections:['favorites'],preferenceFields:[]});
  const row=result.preview.find(item=>item.section==='favorites')!;
  assert.deepEqual({current:row.current,incoming:row.incoming,removed:row.removed,result:row.result,notice:row.notice},
    {current:3,incoming:0,removed:1,result:2,notice:'legacy-favorites-lists-preserved'});
});

test('legacy merge also preserves lists, while an unselected legacy section has no protection notice',()=>{
  const current=personal({schemaVersion:2,versionIds:['old'],lists:[list('current-list')]});
  const incoming=backup({schemaVersion:1,versionIds:['incoming']});
  const merged=planRestore(current,incoming,{mode:'merge',sections:['favorites'],preferenceFields:[]});
  assert.deepEqual(merged.next.sections.favorites,{schemaVersion:2,versionIds:['old','incoming'],lists:current.sections.favorites.schemaVersion===2?current.sections.favorites.lists:[]});
  assert.equal(merged.preview.find(item=>item.section==='favorites')!.notice,'legacy-favorites-lists-preserved');
  const skipped=planRestore(current,incoming,{mode:'replace',sections:[],preferenceFields:[]});
  assert.equal(skipped.preview.find(item=>item.section==='favorites')!.notice,undefined);
});

test('v2 empty replacement explicitly clears favorites and lists',()=>{
  const current={schemaVersion:2 as const,versionIds:['old'],lists:[list('current-list')]};
  const result=restoreFavorites(current,{schemaVersion:2,versionIds:[],lists:[]},'replace');
  assert.deepEqual(result.value,{schemaVersion:2,versionIds:[],lists:[]});
  assert.equal(result.removed,3);
  assert.equal(result.legacyListsPreserved,false);
});

test('merge remaps a colliding list deterministically and repeated import is idempotent',()=>{
  const current={schemaVersion:2 as const,versionIds:[],lists:[list('same-id','Current')]};
  const incoming={schemaVersion:2 as const,versionIds:[],lists:[list('same-id','Imported')]};
  const first=restoreFavorites(current,incoming,'merge');
  assert.equal(first.value.lists.length,2);
  assert.equal(first.conflicts[0]?.action,'keep-both');
  assert.match(first.value.lists[1]!.id,/^import-list-[0-9a-f]{16}$/);
  assert.equal(first.value.lists[1]!.importedFromId,'same-id');
  const second=restoreFavorites(first.value,incoming,'merge');
  assert.deepEqual(second.value,first.value);
  assert.equal(second.added,0);
  assert.equal(second.conflicts.length,0);
});

test('replace uses multiset semantic matching for duplicate content under different IDs',()=>{
  const original=list('one'),copy={...list('two')};
  const result=restoreFavorites({schemaVersion:2,versionIds:[],lists:[original]},
    {schemaVersion:2,versionIds:[],lists:[{...original,id:'incoming-one'},copy]},'replace');
  assert.equal(result.same,2,'one list plus its one item matches only once');
  assert.equal(result.added,2,'the second list plus item remains an addition');
  assert.equal(result.removed,0);
  assert.equal(favoriteSectionCount(result.value),4);
});

test('backup parser reads legacy and v2 favorite sections but rejects malformed lists',()=>{
  const legacy=parseFullBackup(JSON.stringify(backup({schemaVersion:1,versionIds:['old']})));
  assert.equal(legacy.sections.favorites.schemaVersion,1);
  const current=parseFullBackup(JSON.stringify(backup({schemaVersion:2,versionIds:[],lists:[list('valid')]})));
  assert.equal(current.sections.favorites.schemaVersion,2);
  const malformed=backup({schemaVersion:2,versionIds:[],lists:[{...list('bad'),name:''}]});
  assert.throws(()=>parseFullBackup(JSON.stringify(malformed)),/favorites\.lists/);
  const brokenSnapshot=list('broken-snapshot');brokenSnapshot.items[0]!.fingerprint='0'.repeat(64);
  assert.throws(()=>parseFullBackup(JSON.stringify(backup({schemaVersion:2,versionIds:[],lists:[brokenSnapshot]}))),/fingerprint/);
});

test('unselected favorite lists do not bring their snapshot reference variants into the plan',()=>{
  const incoming=backup({schemaVersion:2,versionIds:[],lists:[list('incoming')]});
  const item=incoming.sections.favorites.schemaVersion===2?incoming.sections.favorites.lists[0]!.items[0]!:null;
  incoming.references=[
    {kind:'recipeVersion',id:item!.recipe.version.id,name:'Incoming snapshot variant',sourceId:item!.recipe.source.id},
    {kind:'source',id:item!.recipe.source.id,name:'Incoming source variant',sourceUrl:item!.recipe.source.url},
  ];
  const choice:RestoreChoice={mode:'merge',sections:[],preferenceFields:[]};
  const result=planRestore(personal({schemaVersion:2,versionIds:[],lists:[]}),incoming,choice);
  assert.deepEqual(result.next.references,[]);
  assert.deepEqual(result.next.sections.favorites,{schemaVersion:2,versionIds:[],lists:[]});
});

test('selected favorite lists preserve future snapshot references without catalogue rematching',()=>{
  const future=list('future-list'),saved=structuredClone(future.items[0]!.recipe);
  saved.version.id='future-list-version';saved.version.cocktailId='future-cocktail';saved.version.sourceId='future-source';saved.source.id='future-source';
  const ingredientNames:typeof saved.ingredientNames={},brandNames:typeof saved.brandNames={};
  saved.version.ingredients=saved.version.ingredients.map((row,index)=>{const ingredientId=`future-ingredient-${index}`,brandId=row.brandId?`future-brand-${index}`:undefined;
    ingredientNames[ingredientId]=future.items[0]!.recipe.ingredientNames[row.ingredientId]!;if(brandId)brandNames[brandId]='Future archived brand';return{...row,ingredientId,...(brandId?{brandId}:{brandId:undefined})};});
  saved.ingredientNames=ingredientNames;saved.brandNames=brandNames;
  future.items=[{versionId:saved.version.id,cocktailId:saved.version.cocktailId,fingerprint:recipeFingerprint(saved),addedAt:at,recipe:saved}];
  const incoming=backup({schemaVersion:2,versionIds:[],lists:[future]});incoming.references=[
    {kind:'recipeVersion',id:'future-list-version',name:'Archived future recipe',cocktailId:'future-cocktail',sourceId:'future-source'},
    {kind:'source',id:'future-source',name:'Archived future source',sourceUrl:saved.source.url},
    ...saved.version.ingredients.map((row,index)=>({kind:'ingredient' as const,id:row.ingredientId,name:`Archived ingredient ${index}`})),
    ...saved.version.ingredients.flatMap((row,index)=>row.brandId?[{kind:'brand' as const,id:row.brandId,name:`Archived brand ${index}`,ingredientId:row.ingredientId}]:[]),
  ];
  const result=planRestore(personal({schemaVersion:2,versionIds:[],lists:[]}),incoming,{mode:'merge',sections:['favorites'],preferenceFields:[]});
  assert(result.next.references.some(ref=>ref.kind==='recipeVersion'&&ref.id==='future-list-version'));
  assert(result.next.references.some(ref=>ref.kind==='source'&&ref.id==='future-source'));
  for(const row of saved.version.ingredients){assert(result.next.references.some(ref=>ref.kind==='ingredient'&&ref.id===row.ingredientId));if(row.brandId)assert(result.next.references.some(ref=>ref.kind==='brand'&&ref.id===row.brandId));}
});
