import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from '../../content/catalogue';
import {emptyPantry, filterIngredientEntries, ingredientEntries, pantryMatches, parsePantry} from './index';

test('material search supports all translated names and related brands without implying ownership', () => {
  const entries = ingredientEntries(catalogue);
  assert.ok(filterIngredientEntries(entries, catalogue, '青柠', 'zh').some(e => e.ingredient.id === 'lime-juice'));
  assert.ok(filterIngredientEntries(entries, catalogue, 'Cointreau', 'en').some(e => e.ingredient.id === 'triple-sec'));
  assert.ok(filterIngredientEntries(entries, catalogue, '琴酒', 'zh').some(e => e.ingredient.id === 'gin'));
  assert.equal(filterIngredientEntries(entries, catalogue, 'gin', 'en')[0]?.ingredient.id,'gin');
  assert.deepEqual(filterIngredientEntries(entries, catalogue, '青柠', 'zh', 'spirits').map(e=>e.ingredient.id).sort(),['lime-gin','makrut-lime-vodka']);
  assert.ok(!filterIngredientEntries(entries, catalogue, '青柠', 'zh', 'spirits').some(e=>e.ingredient.id==='lime-juice'));
  const lime = entries.find(e => e.ingredient.id === 'lime-juice')!;
  assert.equal(lime.cocktailIds.length, new Set(lime.versions.map(v => v.cocktailId)).size);
  assert.deepEqual(pantryMatches(catalogue, emptyPantry()), []);
  assert.deepEqual(pantryMatches(catalogue, {ingredientIds:['coffee-beans'],brandsByIngredient:{}}), []);
});

test('material search uses tolerant scoring while preserving editorial group filters', () => {
  const entries = ingredientEntries(catalogue);
  assert.ok(filterIngredientEntries(entries, catalogue, 'laim juice', 'en').some(e => e.ingredient.id === 'lime-juice'));
  assert.ok(filterIngredientEntries(entries, catalogue, 'qing ning', 'zh').some(e => e.ingredient.id === 'lime-juice'));
  assert.equal(filterIngredientEntries(entries, catalogue, 'laim juice', 'en', 'spirits').some(e => e.ingredient.id === 'lime-juice'), false);
  assert.deepEqual(filterIngredientEntries(entries, catalogue, 'gin impossibleword', 'en'), []);
});

test('pantry tracks exact materials, missing counts and optional ingredients at version level', () => {
  const pantry = {ingredientIds: ['gin','lime-juice','superfine-sugar'], brandsByIngredient:{}};
  const daiquiri = pantryMatches(catalogue, pantry).find(m => m.cocktailId === 'daiquiri')!;
  assert.deepEqual(daiquiri.missingIngredientIds, ['white-rum']);
  assert.equal(daiquiri.status, 'missing');
  const ready = pantryMatches(catalogue, {...pantry,ingredientIds:[...pantry.ingredientIds,'white-rum']}).find(m => m.cocktailId === 'daiquiri')!;
  assert.equal(ready.status, 'ready');
  const sour = catalogue.versions.find(v => v.id === 'whiskey-sour-iba')!;
  const required = sour.ingredients.filter(row => !row.optional).map(row => row.ingredientId);
  const result = pantryMatches(catalogue,{ingredientIds:required, brandsByIngredient:{}}).find(m => m.cocktailId === 'whiskey-sour')!;
  assert.equal(result.status, 'ready');
  assert.ok(result.optionalMissingIngredientIds.includes('egg-white'));
});

test('owning a material does not satisfy a source-specific brand or another brand ingredient', () => {
  const recipe = catalogue.versions.find(v => v.id === 'penicillin-iba')!;
  const ingredientIds = recipe.ingredients.map(row => row.ingredientId);
  const first = pantryMatches(catalogue,{ingredientIds,brandsByIngredient:{}}).find(m => m.cocktailId === 'penicillin')!;
  assert.equal(first.versionId, recipe.id);
  assert.equal(first.status, 'preparation-check');
  assert.ok(first.unconfirmedBrands.some(row => row.brandId === 'brand-lagavulin'));
  const verified = pantryMatches(catalogue,{ingredientIds, brandsByIngredient:{'islay-whisky':['brand-lagavulin']}}).find(m => m.cocktailId === 'penicillin')!;
  assert.equal(verified.status,'preparation-check');
  assert.deepEqual(verified.unconfirmedBrands,[]);
  const wrong = pantryMatches(catalogue,{ingredientIds, brandsByIngredient:{'scotch-whisky':['brand-lagavulin']}}).find(m => m.cocktailId === 'penicillin')!;
  assert.equal(wrong.status,'preparation-check');
  assert.ok(wrong.unconfirmedBrands.some(row=>row.brandId==='brand-lagavulin'));
});

test('pantry preferences cannot be assembled across two independent recipe versions', () => {
  const recipe = catalogue.versions.find(v => v.id === 'penicillin-iba')!;
  const results = pantryMatches(catalogue,{ingredientIds:recipe.ingredients.map(r=>r.ingredientId),brandsByIngredient:{}},{text:'Honig-Ingwersirup',brandIds:['brand-lagavulin']});
  assert.deepEqual(results,[]);
});

test('stored pantry rejects malformed, unknown and cross-ingredient brand values', () => {
  assert.deepEqual(parsePantry('{bad', catalogue),emptyPantry());
  const stored = parsePantry(JSON.stringify({ingredientIds:['gin','gin','missing'],brandsByIngredient:{gin:['brand-lagavulin'],missing:['brand-goslings']}}),catalogue);
  assert.deepEqual(stored,{ingredientIds:['gin'],brandsByIngredient:{gin:[]}});
});
