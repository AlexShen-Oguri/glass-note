import assert from 'node:assert/strict';
import test from 'node:test';

import type {Brand, Ingredient, RecipeIngredient} from '../domain/contracts';
import {catalogue} from './catalogue';
import {mergeBrands, mergeIngredients} from './expansion/merge';

function recipe(id: string) {
  const found = catalogue.versions.find((candidate) => candidate.id === id);
  assert.ok(found, `missing recipe ${id}`);
  return found;
}

function recipeIngredient(versionId: string, ingredientId: string): RecipeIngredient {
  const found = recipe(versionId).ingredients.find((candidate) => candidate.ingredientId === ingredientId);
  assert.ok(found, `${versionId}: missing ${ingredientId}`);
  return found;
}

test('batch C keeps source-specific small units, optional rows, and the documented IBA Tiki normalization', () => {
  assert.deepEqual(
    recipe('brandy-crusta-iba').ingredients.slice(2).map(({amount, unit}) => [amount, unit]),
    [[1, 'barspoon'], [15, 'ml'], [1, 'barspoon'], [2, 'dash']],
  );

  const champagneDrops = recipeIngredient('champagne-cocktail-iba', 'grand-marnier');
  assert.deepEqual([champagneDrops.amount, champagneDrops.unit, champagneDrops.optional], [null, 'drop', true]);
  const horseBitters = recipeIngredient('horses-neck-iba', 'angostura-bitters');
  assert.deepEqual([horseBitters.amount, horseBitters.unit, horseBitters.optional], [null, 'dash', true]);

  const tiki = recipe('iba-tiki-iba');
  for (const [id, amount] of [['pineapple-juice', 90], ['lime-juice', 30]] as const) {
    const row = recipeIngredient(tiki.id, id);
    assert.deepEqual([row.amount, row.unit], [amount, 'ml']);
    assert.match(row.note?.en ?? '', /(?:without|omits) (?:a|the) unit/i);
  }

  const illegal = recipe('illegal-iba');
  assert.deepEqual(
    illegal.ingredients.filter(({ingredientId}) => ingredientId === 'espadin-mezcal').map(({amount, unit}) => [amount, unit]),
    [[30, 'ml']],
  );
  const illegalEgg = recipeIngredient(illegal.id, 'egg-white');
  assert.deepEqual([illegalEgg.amount, illegalEgg.unit, illegalEgg.optional], [null, 'drop', true]);
});

test('batch D preserves compound ingredients and unusual source units without expanding recipe quantities', () => {
  assert.deepEqual(
    recipe('monkey-gland-iba').ingredients.slice(2).map(({amount, unit}) => [amount, unit]),
    [[1, 'tbsp'], [1, 'tbsp']],
  );

  const pineapple = recipeIngredient('missionarys-downfall-iba', 'fresh-pineapple');
  assert.deepEqual([pineapple.amount, pineapple.unit], [null, 'piece']);
  assert.match(pineapple.note?.en ?? '', /three to four/i);
  assert.match(recipeIngredient('missionarys-downfall-iba', 'honey-syrup').note?.en ?? '', /Honey Mix/);

  const raboBitters = recipeIngredient('rabo-de-galo-iba', 'angostura-bitters');
  assert.deepEqual([raboBitters.amount, raboBitters.unit, raboBitters.optional], [2, 'drop', true]);
  assert.deepEqual(
    ['cream', 'egg-white', 'orange-flower-water', 'vanilla-extract', 'soda-water'].map((id) => {
      const row = recipeIngredient('ramos-fizz-iba', id);
      return [id, row.amount, row.unit];
    }),
    [
      ['cream', 60, 'ml'],
      ['egg-white', 30, 'ml'],
      ['orange-flower-water', 3, 'dash'],
      ['vanilla-extract', 2, 'drop'],
      ['soda-water', null, 'top'],
    ],
  );

  const zombie = recipe('zombie-iba');
  assert.deepEqual(
    ['donns-mix', 'grenadine-syrup', 'pernod'].map((id) => {
      const row = recipeIngredient(zombie.id, id);
      return [id, row.amount, row.unit];
    }),
    [['donns-mix', 15, 'ml'], ['grenadine-syrup', 1, 'tsp'], ['pernod', 6, 'drop']],
  );
  assert.ok(!zombie.ingredients.some(({ingredientId}) => ['grapefruit-juice', 'cinnamon-syrup'].includes(ingredientId)));
  assert.match(zombie.steps.en.join(' '), /170 g/);
});

test('source-specific rum and gin styles remain version-level ingredients', () => {
  assert.ok(recipe('tuxedo-iba').ingredients.some(({ingredientId}) => ingredientId === 'old-tom-gin'));

  const dons = recipe('dons-special-daiquiri-iba');
  assert.deepEqual(
    dons.ingredients.filter(({ingredientId}) => ingredientId === 'cuban-rum').map(({amount, unit}) => [amount, unit]),
    [[15, 'ml']],
  );

  for (const versionId of [
    'between-the-sheets-iba',
    'long-island-iced-tea-iba',
    'mary-pickford-iba',
    'missionarys-downfall-iba',
  ]) {
    assert.ok(recipe(versionId).ingredients.some(({ingredientId}) => ingredientId === 'neutral-white-rum'),
      `${versionId} must retain the source's unqualified white rum`);
  }
  assert.equal(catalogue.ingredients.find(({id}) => id === 'neutral-white-rum')?.name.en, 'White rum');
  assert.equal(catalogue.ingredients.find(({id}) => id === 'white-rum')?.name.en, 'White Cuban rum');

  const ibaTiki = recipe('iba-tiki-iba');
  const profundo = recipeIngredient(ibaTiki.id, 'cuban-rum');
  assert.equal(profundo.brandId, 'brand-havana-club');
  assert.match(profundo.note?.en ?? '', /Ron Profundo/i);
});

test('catalogue mergers reject conflicting ingredient facts and preserve compatible brand associations', () => {
  const name = catalogue.ingredients[0]?.name;
  assert.ok(name);
  const first: Ingredient = {
    id: 'reviewed-spirit',
    name,
    base: 'gin',
    exclusionTags: ['gin'],
    compositionKnown: true,
    brandIds: ['brand-a'],
  };
  const compatible: Ingredient = {...first, brandIds: ['brand-b']};
  assert.deepEqual(mergeIngredients([first], [compatible])[0]?.brandIds, ['brand-a', 'brand-b']);
  assert.throws(
    () => mergeIngredients([first], [{...first, base: 'rum', exclusionTags: ['rum']}]),
    /Conflicting ingredient facts: reviewed-spirit/,
  );

  const brandsA: Brand[] = [{id: 'brand-a', name: 'A', ingredientIds: ['one']}];
  const brandsB: Brand[] = [{id: 'brand-a', name: 'A', ingredientIds: ['two', 'one']}];
  assert.deepEqual(mergeBrands(brandsA, brandsB), [{id: 'brand-a', name: 'A', ingredientIds: ['one', 'two']}]);
  assert.throws(
    () => mergeBrands(brandsA, [{id: 'brand-a', name: 'Different', ingredientIds: ['one']}]),
    /Conflicting brand: brand-a/,
  );
});
