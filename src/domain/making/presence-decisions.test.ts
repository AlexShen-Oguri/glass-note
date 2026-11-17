/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';
import {isDeepStrictEqual} from 'node:util';
import type {Catalogue, Cocktail, Ingredient, Localized, RecipeIngredient, RecipeVersion} from '../contracts';
import {evaluateOwnedVersion} from '../ingredients/presence';
import type {Pantry} from '../ingredients/types';
import {decisionShelf, decisionsForPresence, rankPresenceCombinations, rankPresenceUnlocks} from './presence-decisions';
import {catalogue as realCatalogue} from '../../content/catalogue';

const localized = (value: string): Localized => ({
  en: value, zh: value, fr: value, de: value, es: value, ko: value, ja: value, it: value,
});

function ingredient(id: string): Ingredient {
  return {id, name: localized(id), exclusionTags: [], compositionKnown: true};
}

function version(
  id: string,
  cocktailId: string,
  ingredients: RecipeIngredient[],
): RecipeVersion {
  return {
    id,
    cocktailId,
    label: localized(id),
    sourceId: `source-${id}`,
    servings: 1,
    ingredients,
    steps: {en: ['Mix'], zh: ['Mix'], fr: ['Mix'], de: ['Mix'], es: ['Mix'], ko: ['Mix'], ja: ['Mix'], it: ['Mix']},
    originalLanguage: 'en',
    glass: localized('glass'),
    garnish: localized('none'),
    flavours: [],
    tastes: [],
    strength: 'medium',
    approachability: 'balanced',
    profileBasis: 'source',
    profileNote: localized('profile'),
    sourceChecked: true,
    translationStatus: 'reviewed',
  };
}

function cocktail(id: string, versionIds: string[], defaultVersionId = versionIds[0]!): Cocktail {
  return {
    id,
    name: localized(id),
    aliases: [],
    category: 'curated',
    description: localized(id),
    versionIds,
    defaultVersionId,
    accent: '#abc',
  };
}

function catalogue(
  versions: RecipeVersion[],
  cocktails: Cocktail[],
  ingredients: Ingredient[],
): Catalogue {
  return {
    versions,
    cocktails,
    ingredients,
    brands: [],
    sources: versions.map(({sourceId}) => ({
      id: sourceId,
      title: sourceId,
      url: `https://example.com/${sourceId}`,
      checkedAt: '2026-09-16',
    })),
  };
}

const pantry = (ingredientIds: string[], brandsByIngredient: Pantry['brandsByIngredient'] = {}): Pantry => ({
  ingredientIds,
  brandsByIngredient,
});

test('returns one best source version per cocktail rather than duplicate cards', () => {
  const missing = version('default-missing', 'drink', [
    {ingredientId: 'gin', amount: 30, unit: 'ml'},
    {ingredientId: 'lime', amount: 15, unit: 'ml'},
  ]);
  const ready = version('alternate-ready', 'drink', [
    {ingredientId: 'gin', amount: 45, unit: 'ml'},
  ]);
  const data = catalogue(
    [missing, ready],
    [cocktail('drink', [missing.id, ready.id], missing.id)],
    [ingredient('gin'), ingredient('lime')],
  );

  const decisions = decisionsForPresence(data, pantry(['gin']));
  assert.equal(decisions.length, 1);
  assert.equal(decisions[0]?.cocktailId, 'drink');
  assert.equal(decisions[0]?.versionId, ready.id);
  assert.equal(decisionShelf(decisions[0]!), 'ready');
});

test('omits versions with unknown ingredient ids from decisions and unlocks', () => {
  const unknown = version('unknown-version', 'unknown-drink', [
    {ingredientId: 'unknown', amount: 1, unit: 'piece'},
  ]);
  const data = catalogue([unknown], [cocktail('unknown-drink', [unknown.id])], []);

  assert.deepEqual(decisionsForPresence(data, pantry([])), []);
  assert.deepEqual(rankPresenceUnlocks(data, pantry([])), []);
});

test('deduplicates cocktails unlocked by one ingredient while retaining source versions', () => {
  const oneA = version('one-a', 'one', [
    {ingredientId: 'gin', amount: 30, unit: 'ml'},
    {ingredientId: 'lime', amount: 15, unit: 'ml'},
  ]);
  const oneB = version('one-b', 'one', [
    {ingredientId: 'gin', amount: 45, unit: 'ml'},
    {ingredientId: 'lime', amount: 10, unit: 'ml'},
  ]);
  const two = version('two-a', 'two', [
    {ingredientId: 'gin', amount: 30, unit: 'ml'},
    {ingredientId: 'lime', amount: 20, unit: 'ml'},
  ]);
  const data = catalogue(
    [oneA, oneB, two],
    [cocktail('one', [oneA.id, oneB.id]), cocktail('two', [two.id])],
    [ingredient('gin'), ingredient('lime')],
  );

  assert.deepEqual(rankPresenceUnlocks(data, pantry(['gin'])), [{
    ingredientId: 'lime',
    readyCocktailIds: ['one', 'two'],
    reviewCocktailIds: [],
    versionIds: ['one-a', 'one-b', 'two-a'],
  }]);
});

test('keeps brand and preparation warnings in the review shelf and unlock count', () => {
  const review = version('penicillin-iba', 'review-drink', [
    {ingredientId: 'honey-syrup', amount: 15, unit: 'ml', brandId: 'brand-special'},
  ]);
  const data = catalogue(
    [review],
    [cocktail('review-drink', [review.id])],
    [ingredient('honey-syrup')],
  );
  const full = pantry(['honey-syrup']);
  const match = evaluateOwnedVersion(data, review, full);
  assert.ok(match);
  assert.equal(match.preparationNeedsReview, true);
  assert.deepEqual(match.unconfirmedBrands, [{ingredientId: 'honey-syrup', brandId: 'brand-special'}]);
  assert.equal(decisionShelf(match), 'check');
  assert.equal(decisionShelf(decisionsForPresence(data, full)[0]!), 'check');

  assert.deepEqual(rankPresenceUnlocks(data, pantry([])), [{
    ingredientId: 'honey-syrup',
    readyCocktailIds: [],
    reviewCocktailIds: ['review-drink'],
    versionIds: ['penicillin-iba'],
  }]);
});

test('a two-material deficit unlocks only when both materials are added', () => {
  const recipe = version('joint-version', 'joint', [
    {ingredientId: 'gin', amount: 30, unit: 'ml'},
    {ingredientId: 'lime', amount: 15, unit: 'ml'},
    {ingredientId: 'syrup', amount: 10, unit: 'ml'},
  ]);
  const data = catalogue([recipe], [cocktail('joint', [recipe.id])], ['gin', 'lime', 'syrup'].map(ingredient));
  assert.deepEqual(rankPresenceCombinations(data, pantry(['gin']), 1), []);
  const plans = rankPresenceCombinations(data, pantry(['gin']), 2);
  assert.equal(plans.length, 1);
  assert.deepEqual(plans[0]!.ingredientIds, ['lime', 'syrup']);
  assert.equal(plans[0]!.cocktails[0]!.jointlyUnlocked, true);
  assert.equal(plans[0]!.cocktails[0]!.readyVersions[0]!.versionId, recipe.id);
});

test('keeps independent source versions and does not count an already covered cocktail', () => {
  const v1 = version('new-a', 'new', [{ingredientId: 'lime', amount: 1, unit: 'ml'}]);
  const v2 = version('new-b', 'new', [{ingredientId: 'syrup', amount: 1, unit: 'ml', brandId: 'special'}]);
  const covered = version('covered-a', 'old', [{ingredientId: 'gin', amount: 1, unit: 'ml'}]);
  const other = version('covered-b', 'old', [{ingredientId: 'lime', amount: 1, unit: 'ml'}]);
  const data = catalogue([v1, v2, covered, other], [cocktail('new', [v1.id, v2.id, v1.id]), cocktail('old', [covered.id, other.id])], ['gin', 'lime', 'syrup'].map(ingredient));
  const plans = rankPresenceCombinations(data, pantry(['gin']), 2);
  assert.equal(plans.length, 1);
  assert.equal(plans[0]!.cocktails.length, 1);
  const drink = plans[0]!.cocktails[0]!;
  assert.equal(drink.cocktailId, 'new');
  assert.equal(drink.jointlyUnlocked, false);
  assert.deepEqual(drink.readyVersions.map(item => item.versionId), ['new-a']);
  assert.deepEqual(drink.needsReviewVersions.map(item => item.versionId), ['new-b']);
  assert.deepEqual(drink.needsReviewVersions[0]!.unconfirmedBrands, [{ingredientId: 'syrup', brandId: 'special'}]);
});

test('does not stitch deficits across versions or substitute a material category', () => {
  const a = version('source-a', 'drink', ['dry-gin', 'lime', 'mint'].map(id => ({ingredientId: id, amount: 1, unit: 'ml'})));
  const b = version('source-b', 'drink', ['dry-gin', 'syrup', 'water'].map(id => ({ingredientId: id, amount: 1, unit: 'ml'})));
  const data = catalogue([a, b], [cocktail('drink', [a.id, b.id])], ['gin', 'dry-gin', 'lime', 'mint', 'syrup', 'water'].map(ingredient));
  assert.deepEqual(rankPresenceCombinations(data, pantry(['gin']), 2), []);
  const plans = rankPresenceCombinations(data, pantry(['dry-gin']), 2);
  assert.deepEqual(plans.map(item => item.ingredientIds).sort(), [['lime', 'mint'], ['syrup', 'water']]);
});

test('never buys a useless or purely optional material and updates optional warnings for the chosen pair', () => {
  const a = version('a', 'a', [
    {ingredientId: 'lime', amount: 1, unit: 'ml'},
    {ingredientId: 'lime', amount: 2, unit: 'ml'},
    {ingredientId: 'mint', amount: 1, unit: 'piece', optional: true},
  ]);
  const b = version('b', 'b', [{ingredientId: 'mint', amount: 1, unit: 'piece'}]);
  const data = catalogue([a, b], [cocktail('a', ['a']), cocktail('b', ['b'])], ['lime', 'mint', 'unused'].map(ingredient));
  const original = pantry([]), snapshot = structuredClone({data, original});
  const plans = rankPresenceCombinations(data, original);
  assert.deepEqual(plans.filter(item => item.ingredientIds.length === 2).map(item => item.ingredientIds), [['lime', 'mint']]);
  const pair = plans.find(item => item.ingredientIds.length === 2)!;
  assert.deepEqual(pair.cocktails.find(item => item.cocktailId === 'a')!.readyVersions[0]!.optionalMissingIngredientIds, []);
  assert.deepEqual({data, original}, snapshot);
});

test('ignores foreign source associations and unknown materials without fabricating purchases', () => {
  const foreign = version('foreign', 'other', [{ingredientId: 'lime', amount: 1, unit: 'ml'}]);
  const unknown = version('unknown', 'drink', [{ingredientId: 'unknown', amount: 1, unit: 'ml'}]);
  const data = catalogue([foreign, unknown], [cocktail('drink', ['foreign', 'unknown'])], [ingredient('lime')]);
  assert.deepEqual(rankPresenceCombinations(data, pantry([])), []);
});

test('the actual Negroni pair preserves the required Campari brand warning', () => {
  const drink = realCatalogue.cocktails.find(item => item.id === 'negroni')!;
  const recipe = realCatalogue.versions.find(item => item.id === drink.defaultVersionId)!;
  const data = {...realCatalogue, cocktails: [drink], versions: [recipe]};
  const plans = rankPresenceCombinations(data, pantry(['gin']), 2);
  assert.equal(plans.length, 1);
  const plan = plans[0]!;
  assert.deepEqual(new Set(plan.ingredientIds), new Set(['campari', 'sweet-red-vermouth']));
  assert.equal(plan.cocktails[0]!.readyVersions.length, 0);
  assert.equal(plan.cocktails[0]!.jointlyUnlocked, true);
  assert.deepEqual(plan.cocktails[0]!.needsReviewVersions[0]!.unconfirmedBrands, [{ingredientId: 'campari', brandId: 'brand-campari'}]);
});

test('one canonical whiskey purchase unlocks both actual Highballs and never buys a second whiskey style', () => {
  const drinkIds = ['whiskey-highball', 'scotch-and-soda'];
  const data = {
    ...realCatalogue,
    cocktails: realCatalogue.cocktails.filter(item => drinkIds.includes(item.id)),
    versions: realCatalogue.versions.filter(item => drinkIds.includes(item.cocktailId)),
  };
  const plans = rankPresenceCombinations(data, pantry(['soda-water']));
  assert.deepEqual(plans.map(item => item.ingredientIds), [['food-generic-whisky']]);
  assert.deepEqual(plans[0]!.cocktails.map(item => item.cocktailId).sort(), drinkIds.sort());
  assert.deepEqual(rankPresenceCombinations(data, pantry(['food-generic-whisky', 'soda-water'])), []);
});

test('every guarded actual OR row offers each real alternative as a separate useful purchase', () => {
  for (const requirement of realCatalogue.materialRequirements!.filter(item => item.acceptedIngredientIds?.length)) {
    const recipe = realCatalogue.versions.find(item => item.id === requirement.versionId)!;
    const drink = realCatalogue.cocktails.find(item => item.id === recipe.cocktailId)!;
    const data: Catalogue = {...realCatalogue, versions: [recipe], cocktails: [{...drink, versionIds: [recipe.id], defaultVersionId: recipe.id}]};
    const owned = pantry(recipe.ingredients.filter((_row, index) => index !== requirement.rowIndex).map(row => row.ingredientId));
    const plans = rankPresenceCombinations(data, owned);
    assert.deepEqual(plans.map(item => item.ingredientIds).sort(), requirement.acceptedIngredientIds!.map(id => [id]).sort(), recipe.id);
    assert.ok(plans.every(item => item.cocktails[0]?.readyVersions.length || item.cocktails[0]?.needsReviewVersions.length));
  }
});

test('ordinary saline aliases count as one purchase while source rows and joint gain stay independent', () => {
  const one = version('saline-one', 'one', [
    {ingredientId: 'gin', amount: 30, unit: 'ml'},
    {ingredientId: 'saline-five-one', amount: 1, unit: 'dash'},
    {ingredientId: 'saline-twenty-percent', amount: 2, unit: 'drop'},
    {ingredientId: 'soda-water', amount: 30, unit: 'ml', optional: true},
  ]);
  const two = version('saline-two', 'two', [
    {ingredientId: 'gin', amount: 30, unit: 'ml'},
    {ingredientId: 'saline-twenty-percent', amount: 2, unit: 'drop'},
    {ingredientId: 'soda-water', amount: 60, unit: 'ml'},
    {ingredientId: 'food-brine', amount: 1, unit: 'dash', optional: true},
  ]);
  const data: Catalogue = {
    ...realCatalogue,
    cocktails: [cocktail('one', [one.id]), cocktail('two', [two.id])],
    versions: [one, two],
    sources: [one, two].map(item => ({id: item.sourceId, title: item.sourceId, url: 'https://example.com', checkedAt: '2026-10-12'})),
  };
  const plans = rankPresenceCombinations(data, pantry(['gin']));
  assert.deepEqual(plans.map(item => item.ingredientIds), [['saline-solution', 'soda-water'], ['saline-solution']]);
  const pair = plans.find(item => item.ingredientIds.length === 2)!;
  assert.equal(pair.cocktails.find(item => item.cocktailId === 'one')!.jointlyUnlocked, false);
  assert.equal(pair.cocktails.find(item => item.cocktailId === 'two')!.jointlyUnlocked, true);
  assert.deepEqual(pair.cocktails.find(item => item.cocktailId === 'two')!.readyVersions[0]!.optionalMissingIngredientIds, []);
  assert.equal(pair.cocktails.find(item => item.cocktailId === 'one')!.readyVersions[0]!.materialResolutions?.find(item => item.rowIndex === 3)?.match, 'exact');
});

function reviewedFixture(): Catalogue {
  const recipes = [
    version('raw-highball', 'highball', ['scotch', 'soda'].map(id => ({ingredientId: id, amount: 30, unit: 'ml'}))),
    version('raw-salty', 'salty', ['gin', 'saline-five', 'saline-twenty'].map(id => ({ingredientId: id, amount: 1, unit: 'dash'}))),
    version('raw-pair', 'pair', ['whisky', 'saline-five', 'soda'].map(id => ({ingredientId: id, amount: 30, unit: 'ml'}))),
    version('raw-cross-a', 'cross', ['scotch', 'gin', 'saline-twenty'].map(id => ({ingredientId: id, amount: 30, unit: 'ml'}))),
    version('raw-cross-b', 'cross', ['gin', 'soda', 'fruit-gin'].map(id => ({ingredientId: id, amount: 30, unit: 'ml'}))),
    version('raw-covered-a', 'covered', [{ingredientId: 'whisky', amount: 30, unit: 'ml'}]),
    version('raw-covered-b', 'covered', [{ingredientId: 'fruit-gin', amount: 30, unit: 'ml'}]),
    version('raw-optional', 'optional', [{ingredientId: 'gin', amount: 30, unit: 'ml'}, {ingredientId: 'saline-five', amount: 1, unit: 'dash', optional: true}]),
  ];
  return {
    ...catalogue(recipes, [...new Set(recipes.map(item => item.cocktailId))].map(id => cocktail(id, recipes.filter(item => item.cocktailId === id).map(item => item.id))),
      ['whisky', 'scotch', 'gin', 'fruit-gin', 'saline', 'saline-five', 'saline-twenty', 'soda'].map(ingredient)),
    materialConcepts: [
      {id: 'whisky', name: localized('Whisky'), memberIds: ['whisky', 'scotch'], kind: 'pure-spirit', basis: 'Reviewed fixture'},
      {id: 'saline', name: localized('Saline'), memberIds: ['saline', 'saline-five', 'saline-twenty'], kind: 'recipe-specification', basis: 'Reviewed fixture'},
    ],
  };
}

/** Enumerate original requirements and purchase definitions, without production deficit or resolver helpers. */
function rawRequirementOracle(data: Catalogue, ownedIds: string[]) {
  const known = new Set(data.ingredients.map(item => item.id));
  const definitions = new Map(data.ingredients.map(item => [item.id, item.id]));
  for (const definition of data.materialConcepts ?? []) {
    if (definition.kind === 'unreviewed') continue;
    for (const member of definition.memberIds) if (known.has(member)) definitions.set(member, definition.id);
  }
  const identity = (id: string) => definitions.get(id)!;
  const alternatives = (recipe: RecipeVersion, rowIndex: number) => {
    const row = recipe.ingredients[rowIndex]!;
    const reviewed = data.materialRequirements?.find(item => item.versionId === recipe.id && item.rowIndex === rowIndex && isDeepStrictEqual(item.originalRow, row));
    return reviewed?.acceptedIngredientIds?.length ? reviewed.acceptedIngredientIds : [row.ingredientId];
  };
  const hasRequired = (recipe: RecipeVersion, supplies: string[]) => recipe.ingredients.every((row, rowIndex) =>
    known.has(row.ingredientId) && (row.optional || supplies.some(id => known.has(id)
      && alternatives(recipe, rowIndex).some(candidate => known.has(candidate) && identity(id) === identity(candidate)))),
  );
  const choices = [...new Set(data.ingredients.map(item => identity(item.id)))].filter(id => !ownedIds.some(owned => known.has(owned) && identity(owned) === id)).sort();
  const purchases = choices.flatMap((id, index) => [[id], ...choices.slice(index + 1).map(other => [id, other])]);
  return purchases.flatMap(ids => {
    const used = new Set<string>();
    const drinks = data.cocktails.flatMap(drink => {
      const recipes = data.versions.filter(recipe => drink.versionIds.includes(recipe.id)
        && recipe.cocktailId === drink.id && data.sources.some(source => source.id === recipe.sourceId));
      if (recipes.some(recipe => hasRequired(recipe, ownedIds))) return [];
      const unlocked = recipes.filter(recipe => hasRequired(recipe, [...ownedIds, ...ids]));
      for (const recipe of unlocked) for (const id of ids) {
        if (!hasRequired(recipe, [...ownedIds, ...ids.filter(other => other !== id)])) used.add(id);
      }
      return unlocked.length ? [{
        cocktailId: drink.id,
        versionIds: unlocked.map(recipe => recipe.id).sort(),
        jointlyUnlocked: ids.length === 2 && !ids.some(id => recipes.some(recipe => hasRequired(recipe, [...ownedIds, id]))),
      }] : [];
    });
    return drinks.length && ids.every(id => used.has(id)) ? [{ingredientIds: ids, drinks: drinks.sort((a, b) => a.cocktailId.localeCompare(b.cocktailId))}] : [];
  }).sort((a, b) => JSON.stringify(a.ingredientIds).localeCompare(JSON.stringify(b.ingredientIds)));
}

test('canonical procurement agrees with an independent original-row exhaustive oracle for every owned mask', () => {
  const data = reviewedFixture();
  const before = structuredClone(data);
  for (let mask = 0; mask < 2 ** data.ingredients.length; mask += 1) {
    const ids = data.ingredients.filter((_item, index) => (mask & (1 << index)) !== 0).map(item => item.id);
    const actual = rankPresenceCombinations(data, pantry(ids)).map(plan => ({
      ingredientIds: [...plan.ingredientIds],
      drinks: plan.cocktails.map(drink => ({
        cocktailId: drink.cocktailId,
        versionIds: [...drink.readyVersions, ...drink.needsReviewVersions].map(match => match.versionId).sort(),
        jointlyUnlocked: drink.jointlyUnlocked,
      })).sort((a, b) => a.cocktailId.localeCompare(b.cocktailId)),
    })).sort((a, b) => JSON.stringify(a.ingredientIds).localeCompare(JSON.stringify(b.ingredientIds)));
    assert.deepEqual(actual, rawRequirementOracle(data, ids), `owned mask ${mask}`);
  }
  assert.deepEqual(data, before);
});

function sourceOrFixture(): Catalogue {
  const overlap = version('or-overlap', 'overlap', ['or-one', 'or-two', 'or-three'].map(id => ({ingredientId: id, amount: 15, unit: 'ml'})));
  const singleA = version('or-single-a', 'alternatives', [{ingredientId: 'or-one', amount: 15, unit: 'ml'}]);
  const singleB = version('or-single-b', 'alternatives', [{ingredientId: 'd', amount: 15, unit: 'ml'}]);
  const exact = version('or-exact', 'exact', [{ingredientId: 'or-one', amount: 15, unit: 'ml'}]);
  const optional = version('or-optional', 'optional', [{ingredientId: 'a', amount: 15, unit: 'ml'}, {ingredientId: 'or-two', amount: 1, unit: 'dash', optional: true}]);
  const crossedA = version('or-cross-a', 'cross', [{ingredientId: 'or-one', amount: 15, unit: 'ml'}, {ingredientId: 'c', amount: 15, unit: 'ml'}, {ingredientId: 'd', amount: 15, unit: 'ml'}]);
  const crossedB = version('or-cross-b', 'cross', [{ingredientId: 'or-two', amount: 15, unit: 'ml'}, {ingredientId: 'a', amount: 15, unit: 'ml'}, {ingredientId: 'd', amount: 15, unit: 'ml'}]);
  const recipes = [overlap, singleA, singleB, exact, optional, crossedA, crossedB];
  const data = catalogue(recipes, [...new Set(recipes.map(item => item.cocktailId))].map(id => cocktail(id, recipes.filter(item => item.cocktailId === id).map(item => item.id))),
    ['a', 'b', 'c', 'd', 'or-one', 'or-two', 'or-three'].map(ingredient));
  data.materialRequirements = [
    [overlap, 0, ['a', 'b']], [overlap, 1, ['c', 'b']], [overlap, 2, ['d', 'a']],
    [singleA, 0, ['a', 'b']], [optional, 1, ['c', 'b']], [crossedA, 0, ['a', 'b']], [crossedB, 0, ['c', 'b']],
  ].map(([recipe, index, candidates]) => {
    const version = recipe as RecipeVersion, rowIndex = index as number;
    return {versionId: version.id, rowIndex, originalRow: structuredClone(version.ingredients[rowIndex]!), sourceName: localized('Reviewed source choice'), acceptedIngredientIds: candidates as string[]};
  });
  return data;
}

test('overlapping OR rows need two real purchases rather than three preferred labels', () => {
  const data = sourceOrFixture();
  data.cocktails = data.cocktails.filter(item => item.id === 'overlap');
  const plans = rankPresenceCombinations(data, pantry([]), 2);
  assert.deepEqual(plans.map(item => item.ingredientIds).sort(), [['a', 'b'], ['a', 'c'], ['b', 'd']]);
  assert.ok(plans.every(item => item.cocktails[0]!.jointlyUnlocked));
  const match = evaluateOwnedVersion(data, data.versions[0]!, pantry([]))!;
  assert.equal(match.missingIngredientIds.length, 2);
});

test('source-scoped OR procurement agrees with a raw-row oracle and rejects redundant alternatives', () => {
  const data = sourceOrFixture();
  const before = structuredClone(data);
  for (let mask = 0; mask < 2 ** data.ingredients.length; mask += 1) {
    const ids = data.ingredients.filter((_item, index) => (mask & (1 << index)) !== 0).map(item => item.id);
    const actual = rankPresenceCombinations(data, pantry(ids)).map(plan => ({
      ingredientIds: [...plan.ingredientIds],
      drinks: plan.cocktails.map(drink => ({cocktailId: drink.cocktailId,
        versionIds: [...drink.readyVersions, ...drink.needsReviewVersions].map(match => match.versionId).sort(),
        jointlyUnlocked: drink.jointlyUnlocked})).sort((a, b) => a.cocktailId.localeCompare(b.cocktailId)),
    })).sort((a, b) => JSON.stringify(a.ingredientIds).localeCompare(JSON.stringify(b.ingredientIds)));
    assert.deepEqual(actual, rawRequirementOracle(data, ids), `OR owned mask ${mask}`);
  }
  const onlyOr = {...data, cocktails: data.cocktails.filter(item => item.id === 'alternatives').map(item => ({...item, versionIds: ['or-single-a']}))};
  assert.deepEqual(rankPresenceCombinations(onlyOr, pantry([])).map(item => item.ingredientIds).sort(), [['a'], ['b']]);
  assert.deepEqual(data, before);
});
