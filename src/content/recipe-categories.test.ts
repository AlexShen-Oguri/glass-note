import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from './catalogue';
import {applyRecipeOrigins} from './recipe-origins';
import {searchCocktails} from '../domain/search';
import {discoveryQueryFingerprint} from '../domain/discovery/pagination';

test('source categories and other conditions must match the same version',()=>{
  const original=catalogue.versions.find(v=>v.cocktailId==='dry-martini')!;
  const cocktail=catalogue.cocktails.find(c=>c.id===original.cocktailId)!;
  const bar={...original,id:'test-bar',ingredients:[{ingredientId:'vodka',amount:60,unit:'ml' as const}],origin:{kind:'bar' as const,topicId:'test-topic',countryCodes:['GB']}};
  const fixture={...catalogue,cocktails:[{...cocktail,versionIds:[original.id,bar.id]}],versions:[original,bar]};
  assert.equal(searchCocktails(fixture,{recipeCategory:'bar',bases:['gin']}).length,0);
  const match=searchCocktails(fixture,{recipeCategory:'bar',bases:['vodka']});
  assert.deepEqual(match.map(r=>r.selectedVersionId),['test-bar']);
  assert.deepEqual(searchCocktails(fixture,{recipeCategory:'classic'}).map(r=>r.versionIds),[[original.id]]);
  assert.equal(searchCocktails(fixture,{}).length,1);
});

test('an employer address alone cannot turn a competition source into a bar recipe',()=>{
  const version=catalogue.versions.find(v=>v.cocktailId==='tefutefu')!;
  const clean={...version,origin:undefined};
  assert.ok(clean.bar);
  const annotated=applyRecipeOrigins([clean],catalogue.sources)[0]!;
  assert.equal(annotated.origin?.kind,'competition');
  assert.equal(annotated.origin?.topicId,'suntory-2024');
  assert.equal(clean.origin,undefined);
  assert.equal(applyRecipeOrigins([clean],[])[0]!.origin,undefined);
});

test('classification changes reset discovery pagination fingerprints',()=>{
  const categories=[undefined,'classic','competition','bar'] as const;
  assert.equal(new Set(categories.map(recipeCategory=>discoveryQueryFingerprint({recipeCategory},'zh'))).size,4);
});
