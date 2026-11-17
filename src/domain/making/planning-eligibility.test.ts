import assert from 'node:assert/strict';
import test from 'node:test';
import type {Catalogue,Localized,RecipeVersion} from '../contracts';
import {rankPresenceCombinations} from './presence-decisions';

const L=(value:string):Localized=>({en:value,zh:value,fr:value,de:value,es:value,ko:value,ja:value,it:value});
const version=(id:string,ids:string[],changes:Partial<RecipeVersion>={}):RecipeVersion=>({
  id,cocktailId:id,label:L(id),sourceId:'source',servings:1,
  ingredients:ids.map(ingredientId=>({ingredientId,amount:30,unit:'ml'})),
  steps:{en:['Mix'],zh:['Mix'],fr:['Mix'],de:['Mix'],es:['Mix'],ko:['Mix'],ja:['Mix'],it:['Mix']},
  originalLanguage:'en',glass:L('Glass'),garnish:L('None'),flavours:[],tastes:[],strength:null,approachability:null,
  profileBasis:'source',profileNote:L('Facts'),sourceChecked:true,translationStatus:'draft',...changes,
});
function catalogue(versions:RecipeVersion[]):Catalogue{
  return{versions,brands:[],ingredients:[...new Set(versions.flatMap(v=>v.ingredients.map(r=>r.ingredientId)))].map(id=>({id,name:L(id),compositionKnown:true,exclusionTags:[]})),
    sources:[{id:'source',title:'Source',url:'https://example.com/recipe',checkedAt:'2026-10-23'}],
    cocktails:[...new Set(versions.map(v=>v.cocktailId))].map(id=>({id,name:L(id),aliases:[],category:'classic',description:L('Drink'),versionIds:versions.filter(v=>v.cocktailId===id).map(v=>v.id),defaultVersionId:versions.find(v=>v.cocktailId===id)!.id,accent:'#fff'}))};
}
const pantry={ingredientIds:['owned'],brandsByIngredient:{}};

test('planning only offers purchases that unlock an eligible exact source version',()=>{
  const data=catalogue([version('allowed',['owned','lemon']),version('excluded',['owned','soda'])]);
  const plans=rankPresenceCombinations(data,pantry,1,{eligibleVersionIds:new Set(['allowed'])});
  assert.deepEqual(plans.map(p=>p.ingredientIds),[['lemon']]);
  assert.deepEqual(plans[0]!.cocktails.flatMap(c=>c.readyVersions.map(v=>v.versionId)),['allowed']);
});

test('a source outside the filter still prevents counting an already covered cocktail as new',()=>{
  const data=catalogue([version('owned-source',['owned'],{cocktailId:'same'}),version('filtered-source',['owned','lemon'],{cocktailId:'same'}),version('new-source',['owned','soda'])]);
  const plans=rankPresenceCombinations(data,pantry,1,{eligibleVersionIds:new Set(['filtered-source','new-source'])});
  assert.deepEqual(plans.map(p=>p.ingredientIds),[['soda']]);
  assert.deepEqual(plans[0]!.cocktails.map(c=>c.cocktailId),['new-source']);
});

test('two-item planning rejects a purchase used only by an excluded source',()=>{
  const data=catalogue([version('allowed',['owned','lemon']),version('excluded',['owned','soda'])]);
  assert.deepEqual(rankPresenceCombinations(data,pantry,2,{eligibleVersionIds:new Set(['allowed'])}),[]);
});

test('an empty eligible-source set gives no plans and omitting eligibility preserves ordinary enumeration',()=>{
  const data=catalogue([version('allowed',['owned','lemon'])]);
  assert.deepEqual(rankPresenceCombinations(data,pantry,1,{eligibleVersionIds:new Set()}),[]);
  assert.deepEqual(rankPresenceCombinations(data,pantry,1,{}),rankPresenceCombinations(data,pantry,1));
});
