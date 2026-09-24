import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from '../../content/catalogue';
import {ingredientEntries, pantryMatches} from './index';

test('sour mix stays in mixers while dairy and coconut cream have their detailed shelf', () => {
  const groupById = new Map(ingredientEntries(catalogue).map(entry => [entry.ingredient.id, entry.group]));
  assert.equal(groupById.get('sweet-and-sour-mix'), 'mixers');
  for (const id of ['milk', 'cream', 'coconut-cream', 'cream-of-coconut']) {
    assert.equal(groupById.get(id), 'dairy', `${id} should be in Dairy, eggs & plant milks`);
  }
});

test('best pantry result selects one complete real version and never assembles Penicillin variants', () => {
  const completePunchPantry = {
    ingredientIds: ['scotch-whisky', 'honey-ginger-syrup', 'lemon-juice', 'islay-whisky'],
    brandsByIngredient: {},
  };
  const ready = pantryMatches(catalogue, completePunchPantry).find(match => match.cocktailId === 'penicillin');
  assert.equal(ready?.versionId, 'penicillin-punch-proper-drink');
  assert.equal(ready?.status, 'ready');
  assert.deepEqual(ready?.missingIngredientIds, []);

  const crossVersionPantry = {
    ingredientIds: ['scotch-whisky', 'islay-whisky', 'lemon-juice', 'honey-syrup'],
    brandsByIngredient: {},
  };
  const incomplete = pantryMatches(catalogue, crossVersionPantry).find(match => match.cocktailId === 'penicillin');
  assert.equal(incomplete?.versionId, 'penicillin-punch-proper-drink');
  assert.equal(incomplete?.status, 'missing');
  assert.deepEqual(incomplete?.missingIngredientIds, ['honey-ginger-syrup']);
  assert.deepEqual(incomplete?.unconfirmedBrands, []);
});

test('every returned pantry suggestion obeys the distinct-missing and required-owned contract', () => {
  const pantry = {
    ingredientIds: ['gin', 'vodka', 'white-rum', 'light-rum', 'lime-juice', 'lemon-juice', 'simple-syrup', 'dry-vermouth'],
    brandsByIngredient: {},
  };
  const owned = new Set(pantry.ingredientIds);
  for (const match of pantryMatches(catalogue, pantry)) {
    const version = catalogue.versions.find(candidate => candidate.id === match.versionId && candidate.cocktailId === match.cocktailId);
    assert.ok(version, `${match.cocktailId} must retain one concrete source version`);
    assert.ok(match.missingIngredientIds.length <= 2);
    assert.equal(match.missingIngredientIds.length, new Set(match.missingIngredientIds).size);
    assert.equal(match.optionalMissingIngredientIds.length, new Set(match.optionalMissingIngredientIds).size);
    assert.ok(version.ingredients.some(row => !row.optional && owned.has(row.ingredientId)));
  }
});
