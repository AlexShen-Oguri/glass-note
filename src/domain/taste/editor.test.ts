import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from '../../content/catalogue';
import {recipeFingerprint,recipeSnapshot} from '../making';
import type {FavoriteList} from '../favorites';
import {createFeedback} from './index';
import {tasteEditorTarget} from './editor';
import {LOCALES} from '../contracts';
import {tm} from '../../i18n/taste';
import {plainVersionLabel} from '../../features/recipe/versionLabel';

const recipe=recipeSnapshot(catalogue,'negroni-iba')!;
const now='2026-09-17T20:00:00Z';
const entry=createFeedback(recipe,'existing',now,{experience:'both',sentiment:'like',tooSweet:false,tooStrong:false,likedFlavours:['citrus'],notes:'Keep this note'});

test('editor URLs resolve synchronously, never via the memory list',()=>{
  assert.deepEqual(tasteEditorTarget({entry:entry.id},[entry],[],catalogue),{kind:'edit',entry});
  assert.equal(tasteEditorTarget({version:'negroni-iba'},[],[],catalogue).kind,'create');
  assert.equal(tasteEditorTarget({},[entry],[],catalogue).kind,'list');
  for(const params of [{entry:'missing'},{version:'missing'},{list:'missing'},{entry:'missing',version:'negroni-iba'}]){
    assert.equal(tasteEditorTarget(params,[entry],[],catalogue).kind,'missing');
  }
});

test('saved-list recording uses the exact historical snapshot, not a fresh catalogue recipe',()=>{
  const snapshot=structuredClone(recipe);snapshot.version.ingredients[0]!.amount=25;
  const list:FavoriteList={id:'weekend',name:'Weekend',createdAt:now,updatedAt:now,items:[{versionId:recipe.version.id,cocktailId:recipe.version.cocktailId,fingerprint:recipeFingerprint(snapshot),addedAt:now,recipe:snapshot}]};
  const params={version:recipe.version.id,list:list.id};
  const target=tasteEditorTarget(params,[],[list],catalogue);
  assert.equal(target.kind,'create');
  if(target.kind==='create')assert.equal(target.recipe,snapshot);
  assert.equal(tasteEditorTarget(params,[],[],catalogue).kind,'missing');
  const archived={...catalogue,versions:[]};
  assert.equal(tasteEditorTarget(params,[],[list],archived).kind,'create');
  assert.deepEqual(tasteEditorTarget({entry:entry.id},[entry],[],archived),{kind:'edit',entry});
  assert.equal(entry.notes,'Keep this note');
});

test('opening/cancelling editor resolution does not save a feedback record; eight titles name the drink',()=>{
  const entries=structuredClone([entry]),before=JSON.stringify(entries);
  tasteEditorTarget({entry:entry.id},entries,[],catalogue);
  tasteEditorTarget({version:'negroni-iba'},entries,[],catalogue);
  assert.equal(JSON.stringify(entries),before);
  for(const locale of LOCALES){const title=tm(locale,'flavourExperience',{name:'Negroni'});assert.ok(title.includes('Negroni'));assert.ok(!title.includes('{name}'));}
  assert.equal(tm('zh','flavourExperience',{name:'内格罗尼'}),'内格罗尼的风味体验');
});

test('short version labels keep catalogue versions distinct without displaying publisher names',()=>{
  for(const locale of LOCALES){
    for(const cocktail of catalogue.cocktails){
      const labels=cocktail.versionIds.map(id=>plainVersionLabel(id,locale));
      assert.equal(new Set(labels).size,labels.length);
      assert.ok(labels.every(label=>!label.includes('IBA')));
    }
  }
});
