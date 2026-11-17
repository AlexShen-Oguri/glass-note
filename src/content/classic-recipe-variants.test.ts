import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from './catalogue';
import {searchCocktails} from '../domain/search';
import {pantryMatches} from '../domain/ingredients';

test('Gin and Tonic and Gimlet are discoverable, with historical and modern Gimlets kept separate', () => {
  assert.equal(searchCocktails(catalogue,{text:'金汤力'})[0]?.cocktailId,'gin-and-tonic');
  const found=searchCocktails(catalogue,{text:'gimlet'});
  assert.deepEqual(found.map(r=>r.cocktailId).sort(),['celery-gimlet','gimlet']);
  assert.equal(found.filter(r=>r.cocktailId==='gimlet').length,1);
  const drink=catalogue.cocktails.find(c=>c.id==='gimlet')!;
  assert.equal(drink.versionIds.length,2);
  const historical=catalogue.versions.find(v=>v.id===drink.defaultVersionId)!;
  assert.deepEqual(historical.ingredients.map(r=>[r.ingredientId,r.amount,r.unit]),[['gin',1,'part'],['lime-cordial',1,'part']]);
  assert.ok(catalogue.sources.find(s=>s.id===historical.sourceId)?.book?.includes('public excerpt'));
  const modern=catalogue.versions.find(v=>v.cocktailId==='gimlet'&&v.id!==historical.id)!;
  assert.equal(modern.ingredients.length,6);
  assert.ok(modern.ingredients.some(r=>r.ingredientId==='oude-genever'));
  assert.deepEqual(searchCocktails(catalogue,{text:'genever',brandIds:['brand-plymouth']}).filter(r=>r.cocktailId==='gimlet'),[]);
});

test('Gimlet pantry readiness requires both historical source brands, not just generic gin and cordial', () => {
  const ingredientIds=['gin','lime-cordial'];
  const match=pantryMatches(catalogue,{ingredientIds,brandsByIngredient:{}}).find(m=>m.cocktailId==='gimlet')!;
  assert.equal(match.status,'brand-check');
  assert.deepEqual(new Set(match.unconfirmedBrands.map(b=>b.brandId)),new Set(['brand-plymouth','brand-roses']));
  const ready=pantryMatches(catalogue,{ingredientIds,brandsByIngredient:{gin:['brand-plymouth'],'lime-cordial':['brand-roses']}}).find(m=>m.cocktailId==='gimlet')!;
  assert.equal(ready.status,'ready');
});

test('Tiki variants retain separate rums, compound ingredients, and source-specific quantities', () => {
  const version=(id:string)=>catalogue.versions.find(v=>v.cocktailId===id)!;
  assert.equal(version('hurricane').ingredients.find(r=>r.ingredientId==='simple-syrup')?.unit,'tbsp');
  assert.equal(version('hurricane').ingredients.find(r=>r.ingredientId==='grenadine-syrup')?.unit,'tbsp');
  assert.ok(version('pearl-diver').ingredients.some(r=>r.ingredientId==='dons-gardenia-mix'));
  assert.ok(version('blue-hawaii').ingredients.some(r=>r.ingredientId==='sweet-and-sour-mix'));
  assert.ok(version('painkiller').ingredients.some(r=>r.ingredientId==='cream-of-coconut'));
  assert.ok(version('amaretto-sour').ingredients.some(r=>r.ingredientId==='egg-white'&&!r.optional));
});
