import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from './catalogue';
import {ingredientEntries, pantryMatches, parsePantry} from '../domain/ingredients';
import {matchVersion, searchCocktails} from '../domain/search';

test('Japanese collection is searchable by kana while preserving other filters', () => {
  assert.equal(searchCocktails(catalogue, {collection: 'japan'}).length, 36);
  assert.deepEqual(searchCocktails(catalogue, {text: 'テフテフ', collection: 'japan'}).map(r => r.cocktailId), ['tefutefu']);
  assert.equal(searchCocktails(catalogue, {text: 'テフテフ', collection: 'japan', strengths: ['none']}).length, 0);
  assert.equal(searchCocktails(catalogue, {text: 'gimlet', collection: 'japan'}).length, 0);
  assert.ok(searchCocktails(catalogue, {text: 'gimlet'}).some(r => r.cocktailId === 'gimlet'));
});

test('existing standalone material IDs keep saved ownership when new recipes use them', () => {
  const restored = parsePantry(JSON.stringify({ingredientIds: ['food-matcha', 'food-pear'], brandsByIngredient: {}}), catalogue);
  assert.deepEqual(restored.ingredientIds, ['food-matcha', 'food-pear']);
  const entries = ingredientEntries(catalogue);
  for (const id of restored.ingredientIds) {
    const entry = entries.find(e => e.ingredient.id === id)!;
    assert.ok(entry.ingredient.guide?.source);
    assert.ok(entry.versions.length > 0, id);
    const version = entry.versions[0]!;
    const match = pantryMatches(catalogue, {ingredientIds: version.ingredients.map(row => row.ingredientId), brandsByIngredient: {}}).find(m => m.versionId === version.id)!;
    assert.equal(match.missingIngredientIds.includes(id), false);
  }
});

test('prepared bourbon and explicitly required cherry brand stay exact pantry requirements', () => {
  const version = catalogue.versions.find(v => v.cocktailId === 'brown-butter-old-fashioned')!;
  assert.ok(catalogue.ingredients.some(item => item.id === 'bourbon-whiskey'));
  const ordinary = {ingredientIds: version.ingredients.map(row => row.ingredientId === 'brown-butter-washed-bourbon' ? 'bourbon-whiskey' : row.ingredientId), brandsByIngredient: {}};
  const match = pantryMatches(catalogue, ordinary).find(m => m.versionId === version.id)!;
  assert.deepEqual(match.missingIngredientIds, ['brown-butter-washed-bourbon']);
  assert.equal(matchVersion(catalogue, version, {excluded: ['dairy']}), false);
  const allMaterials = {ingredientIds: version.ingredients.map(row => row.ingredientId), brandsByIngredient: {}};
  const brandCheck = pantryMatches(catalogue, allMaterials).find(m => m.versionId === version.id)!;
  assert.ok(brandCheck.unconfirmedBrands.some(b => b.ingredientId === 'cocktail-cherries' && b.brandId === 'brand-luxardo'));
  const confirmed = {...allMaterials, brandsByIngredient: Object.fromEntries(version.ingredients.filter(row => row.brandId).map(row => [row.ingredientId, [row.brandId!]]))};
  const confirmedMatch=pantryMatches(catalogue, confirmed).find(m => m.versionId === version.id)!;
  assert.deepEqual(confirmedMatch.unconfirmedBrands,[]);
  assert.equal(confirmedMatch.status, 'preparation-check');
});
