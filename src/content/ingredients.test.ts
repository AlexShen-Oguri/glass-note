import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import test from 'node:test';
import {catalogue,recipeIngredients} from './catalogue';
import {materialRecords} from './ingredients';
import {LOCALES} from '../domain/contracts';
import {ingredientEntries,filterIngredientEntries,pantryMatches,parsePantry,ingredientFamily} from '../domain/ingredients';

test('independent materials have stable identities, original provenance, eight names and bundled illustrations',()=>{
  assert.ok(catalogue.ingredients.length>1000);
  assert.equal(new Set(catalogue.ingredients.map(i=>i.id)).size,catalogue.ingredients.length);
  const imageIndex=readFileSync(new URL('../media/ingredients/index.ts',import.meta.url),'utf8');
  for(const item of catalogue.ingredients){
    const family=ingredientFamily(item);
    assert.ok(imageIndex.includes(family),item.id);
    assert.ok(existsSync(new URL(`../../assets/ingredients/${family}.png`,import.meta.url)),item.id);
    for(const locale of LOCALES){assert.ok(item.name[locale].trim(),item.id);assert.notEqual(item.guide?.nameOrigin?.[locale],'fallback',item.id+'/'+locale);}
  }
  for(const r of materialRecords){
    const item=catalogue.ingredients.find(i=>i.id===r.id)!;
    assert.ok(item.guide?.source?.url.endsWith('#L'+r.sourceLine));
    assert.equal(item.guide?.source?.canonicalName,r.names.en);
    if(!r.existingId && !recipeIngredients.some(i=>i.id===r.id)){assert.equal(item.compositionKnown,false);assert.deepEqual(item.exclusionTags,[]);}
  }
  for(const prior of recipeIngredients){
    const item=catalogue.ingredients.find(i=>i.id===prior.id)!;
    assert.equal(item.compositionKnown,prior.compositionKnown);
    assert.deepEqual(item.exclusionTags,prior.exclusionTags);
    assert.deepEqual(item.name,prior.name);
  }
});

test('a standalone ingredient can be searched and saved without inventing cocktail matches',()=>{
  const entries=ingredientEntries(catalogue);
  const apple=entries.find(e=>e.ingredient.id==='food-apple')!;
  assert.equal(apple.versions.length,0);
  assert.equal(filterIngredientEntries(entries,catalogue,'苹果','zh')[0]?.ingredient.id,'food-apple');
  const restored=parsePantry(JSON.stringify({ingredientIds:['food-apple','food-apple','retired-id'],brandsByIngredient:{'food-apple':['brand-campari']}}),catalogue);
  assert.deepEqual(restored.ingredientIds,['food-apple']);
  assert.deepEqual(restored.brandsByIngredient['food-apple'],[]);
  assert.deepEqual(pantryMatches(catalogue,restored),[]);
});

test('whole fruit and its juice remain distinct recipe requirements',()=>{
  const pantry={ingredientIds:['white-rum','food-lime','sugar'],brandsByIngredient:{}};
  const match=pantryMatches(catalogue,pantry).find(m=>m.cocktailId==='daiquiri');
  assert.ok(match);
  assert.ok(match.missingIngredientIds.includes('lime-juice'));
  assert.notEqual(match.status,'ready');
});
