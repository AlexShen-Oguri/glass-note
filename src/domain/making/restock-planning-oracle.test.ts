/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue as fullCatalogue} from '../../content/catalogue';
import type {Catalogue, Cocktail, Ingredient, Localized, RecipeIngredient, RecipeVersion} from '../contracts';
import type {OwnedVersionMatch} from '../ingredients/presence';
import type {Pantry} from '../ingredients/types';
import {rankPresenceCombinations} from './presence-decisions';

interface Combination {
  ingredientIds: [string] | [string, string];
  cocktails: Array<{
    cocktailId: string;
    readyVersions: OwnedVersionMatch[];
    needsReviewVersions: OwnedVersionMatch[];
    jointlyUnlocked: boolean;
  }>;
}

const localized = (value: string): Localized => ({
  en: value, zh: value, fr: value, de: value, es: value, ko: value, ja: value, it: value,
});

function ingredient(id: string): Ingredient {
  return {
    id,
    name: localized(id),
    ...(id === 'gin' || id === 'dry-gin' ? {base: 'gin' as const} : {}),
    exclusionTags: [],
    compositionKnown: true,
  };
}

const row = (ingredientId: string, options: Partial<RecipeIngredient> = {}): RecipeIngredient => ({
  ingredientId, amount: 15, unit: 'ml', ...options,
});

function version(id: string, cocktailId: string, ingredients: RecipeIngredient[]): RecipeVersion {
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

function cocktail(id: string, versionIds: string[]): Cocktail {
  return {
    id, name: localized(id), aliases: [], category: 'curated', description: localized(id),
    versionIds, defaultVersionId: versionIds[0]!, accent: '#abc',
  };
}

function syntheticCatalogue(): Catalogue {
  const versions = [
    version('oracle-pair', 'pair-only', [row('gin'), row('lime'), row('syrup')]),
    version('oracle-single-ready', 'single-multiple-sources', [
      row('gin'), row('lime'), row('lime'), row('lime', {optional: true}),
      row('egg', {optional: true, brandId: 'brand-optional'}),
    ]),
    version('oracle-single-brand', 'single-multiple-sources', [
      row('gin'), row('lime', {brandId: 'brand-special'}), row('lime', {brandId: 'brand-special'}),
      row('egg', {optional: true}),
    ]),
    version('oracle-already-ready', 'already-covered', [row('gin')]),
    version('oracle-already-other-source', 'already-covered', [row('gin'), row('mint')]),
    version('oracle-cross-one', 'cross-source-trap', [row('gin'), row('lime'), row('mint')]),
    version('oracle-cross-two', 'cross-source-trap', [row('gin'), row('syrup'), row('egg')]),
    version('oracle-three-missing', 'three-missing', [row('gin'), row('lime'), row('syrup'), row('mint')]),
    version('oracle-exact-style', 'exact-style', [row('dry-gin'), row('lime')]),
    version('oracle-optional-only', 'optional-only', [row('gin'), row('egg', {optional: true})]),
    version('oracle-other-single-pair', 'outside-single-alternative', [row('gin'), row('lime'), row('syrup')]),
    version('oracle-other-single-mint', 'outside-single-alternative', [row('gin'), row('mint')]),
    version('oracle-unknown-required', 'unknown-required', [row('unknown')]),
    version('oracle-unknown-optional', 'unknown-optional', [row('gin'), row('unknown', {optional: true})]),
    {...version('oracle-missing-source', 'missing-source', [row('gin'), row('lime')]), sourceId: 'absent-source'},
    version('oracle-unlinked', 'unlinked', [row('unrelated')]),
    version('oracle-wrong-owner', 'different-owner', [row('gin'), row('lime')]),
  ];
  const cocktails = [
    cocktail('pair-only', ['oracle-pair']),
    cocktail('single-multiple-sources', ['oracle-single-ready', 'oracle-single-ready', 'oracle-single-brand']),
    cocktail('already-covered', ['oracle-already-ready', 'oracle-already-other-source']),
    cocktail('cross-source-trap', ['oracle-cross-one', 'oracle-cross-two']),
    cocktail('three-missing', ['oracle-three-missing']),
    cocktail('exact-style', ['oracle-exact-style']),
    cocktail('optional-only', ['oracle-optional-only']),
    cocktail('outside-single-alternative', ['oracle-other-single-pair', 'oracle-other-single-mint']),
    cocktail('unknown-required', ['oracle-unknown-required']),
    cocktail('unknown-optional', ['oracle-unknown-optional']),
    cocktail('missing-source', ['oracle-missing-source']),
    cocktail('unlinked', ['absent-version']),
    cocktail('wrong-owner', ['oracle-wrong-owner']),
  ];
  return {
    ingredients: ['gin', 'dry-gin', 'lime', 'syrup', 'mint', 'egg', 'unrelated'].map(ingredient),
    versions,
    cocktails,
    brands: [
      {id: 'brand-special', name: 'Special', ingredientIds: ['lime']},
      {id: 'brand-optional', name: 'Optional', ingredientIds: ['egg']},
    ],
    sources: versions.filter(item => item.sourceId !== 'absent-source').map(item => ({
      id: item.sourceId, title: item.sourceId, url: `https://example.com/${item.sourceId}`, checkedAt: '2026-10-11',
    })),
  };
}

/** Brute force raw rows, deliberately independent of production deficit indexing and evaluators. */
function exhaustiveOracle(
  data: Catalogue,
  pantry: Pantry,
  preparationStatuses: Record<string, 'disclosed' | 'partial' | 'inspiration'> = {},
): Combination[] {
  const known = new Set(data.ingredients.map(item => item.id));
  const owned = new Set(pantry.ingredientIds);
  const unownedIds = [...known].filter(id => !owned.has(id)).sort();
  const purchases: Array<[string] | [string, string]> = [];
  for (let first = 0; first < unownedIds.length; first += 1) {
    purchases.push([unownedIds[first]!]);
    for (let second = first + 1; second < unownedIds.length; second += 1) {
      purchases.push([unownedIds[first]!, unownedIds[second]!]);
    }
  }

  const complete = (recipe: RecipeVersion, inventory: ReadonlySet<string>): boolean =>
    recipe.ingredients.every(item => item.optional || inventory.has(item.ingredientId));
  const output: Combination[] = [];
  for (const ingredientIds of purchases) {
    const simulated = new Set([...owned, ...ingredientIds]);
    const cocktails: Combination['cocktails'] = [];
    const actuallyUsed = new Set<string>();
    for (const drink of data.cocktails) {
      const recipes = data.versions.filter(recipe =>
        drink.versionIds.includes(recipe.id)
        && recipe.cocktailId === drink.id
        && data.sources.some(source => source.id === recipe.sourceId)
        && recipe.ingredients.every(item => known.has(item.ingredientId)),
      );
      if (recipes.some(recipe => complete(recipe, owned))) continue;
      const unlocked = recipes.filter(recipe => complete(recipe, simulated));
      if (unlocked.length === 0) continue;

      const readyVersions: OwnedVersionMatch[] = [];
      const needsReviewVersions: OwnedVersionMatch[] = [];
      for (const recipe of unlocked) {
        for (const item of recipe.ingredients) {
          if (!item.optional && !owned.has(item.ingredientId)) actuallyUsed.add(item.ingredientId);
        }
        const unconfirmedBrands: OwnedVersionMatch['unconfirmedBrands'] = [];
        for (const item of recipe.ingredients) {
          if (!item.optional && item.brandId && !pantry.brandsByIngredient[item.ingredientId]?.includes(item.brandId)) {
            if (!unconfirmedBrands.some(brand => brand.ingredientId === item.ingredientId && brand.brandId === item.brandId)) {
              unconfirmedBrands.push({ingredientId: item.ingredientId, brandId: item.brandId});
            }
          }
        }
        const preparationStatus = preparationStatuses[recipe.id] ?? 'unreviewed';
        const preparationNeedsReview = preparationStatus === 'partial' || preparationStatus === 'inspiration';
        const status = preparationNeedsReview ? 'preparation-check' : unconfirmedBrands.length ? 'brand-check' : 'ready';
        const match: OwnedVersionMatch = {
          cocktailId: drink.id,
          versionId: recipe.id,
          missingIngredientIds: [],
          optionalMissingIngredientIds: [...new Set(recipe.ingredients
            .filter(item => item.optional && !simulated.has(item.ingredientId))
            .map(item => item.ingredientId))],
          unconfirmedBrands,
          preparationNeedsReview,
          preparationStatus,
          status,
          baseReady: true,
          missingBaseIngredientIds: [],
        };
        (status === 'ready' ? readyVersions : needsReviewVersions).push(match);
      }
      const singlePath = ingredientIds.some(id => {
        const singleInventory = new Set([...owned, id]);
        return recipes.some(recipe => complete(recipe, singleInventory));
      });
      cocktails.push({cocktailId: drink.id, readyVersions, needsReviewVersions, jointlyUnlocked: ingredientIds.length === 2 && !singlePath});
    }
    if (cocktails.length > 0 && ingredientIds.every(id => actuallyUsed.has(id))) {
      output.push({ingredientIds, cocktails});
    }
  }
  return output;
}

function normalize(combinations: Combination[]) {
  const normalizedMatch = (match: OwnedVersionMatch) => {
    // Compare core behavior; tracing metadata has its own canonical/OR regressions.
    const {materialResolutions: _tracing,...core}=match;
    return {
    ...core,
    missingIngredientIds: [...match.missingIngredientIds].sort(),
    optionalMissingIngredientIds: [...match.optionalMissingIngredientIds].sort(),
    missingBaseIngredientIds: [...match.missingBaseIngredientIds].sort(),
    unconfirmedBrands: [...match.unconfirmedBrands].sort((left, right) =>
      JSON.stringify(left).localeCompare(JSON.stringify(right))),
  };};
  return combinations.map(item => ({
    ingredientIds: [...item.ingredientIds].sort(),
    cocktails: item.cocktails.map(drink => ({
      ...drink,
      readyVersions: drink.readyVersions.map(normalizedMatch).sort((left, right) => left.versionId.localeCompare(right.versionId)),
      needsReviewVersions: drink.needsReviewVersions.map(normalizedMatch).sort((left, right) => left.versionId.localeCompare(right.versionId)),
    })).sort((left, right) => left.cocktailId.localeCompare(right.cocktailId)),
  })).sort((left, right) => JSON.stringify(left.ingredientIds).localeCompare(JSON.stringify(right.ingredientIds)));
}

function versionSummary(combination: Combination | undefined) {
  assert.ok(combination);
  return combination.cocktails.map(drink => ({
    cocktailId: drink.cocktailId,
    readyVersionIds: drink.readyVersions.map(item => item.versionId).sort(),
    needsReviewVersionIds: drink.needsReviewVersions.map(item => item.versionId).sort(),
    jointlyUnlocked: drink.jointlyUnlocked,
  })).sort((left, right) => left.cocktailId.localeCompare(right.cocktailId));
}

test('all owned masks agree with an independent full-material brute force oracle', () => {
  const data = syntheticCatalogue();
  const beforeCatalogue = JSON.stringify(data);
  for (let mask = 0; mask < 2 ** data.ingredients.length; mask += 1) {
    const ingredientIds = data.ingredients.filter((_item, index) => (mask & (1 << index)) !== 0).map(item => item.id);
    const brandVariants: Pantry['brandsByIngredient'][] = [
      {},
      ingredientIds.includes('lime') ? {lime: ['brand-special']} : {},
      ingredientIds.includes('syrup') ? {syrup: ['brand-special']} : {},
    ];
    for (const brandsByIngredient of brandVariants) {
      const pantry: Pantry = {ingredientIds, brandsByIngredient};
      const beforePantry = JSON.stringify(pantry);
      const expected = exhaustiveOracle(data, pantry);
      assert.deepEqual(normalize(rankPresenceCombinations(data, pantry)), normalize(expected), `owned mask ${mask}, brands ${JSON.stringify(brandsByIngredient)}`);
      for (const count of [1, 2] as const) {
        assert.deepEqual(
          normalize(rankPresenceCombinations(data, pantry, count)),
          normalize(expected.filter(item => item.ingredientIds.length === count)),
          `owned mask ${mask}, requested count ${count}, brands ${JSON.stringify(brandsByIngredient)}`,
        );
      }
      assert.equal(JSON.stringify(pantry), beforePantry, `owned mask ${mask} must not mutate the pantry`);
    }
  }
  assert.equal(JSON.stringify(data), beforeCatalogue);
});

test('hand-checked pair retains ready and review sources without cross-version or baseline duplicates', () => {
  const data = syntheticCatalogue();
  const pantry: Pantry = {ingredientIds: ['gin'], brandsByIngredient: {}};
  const expected = [
    {cocktailId: 'outside-single-alternative', readyVersionIds: ['oracle-other-single-pair'], needsReviewVersionIds: [], jointlyUnlocked: true},
    {cocktailId: 'pair-only', readyVersionIds: ['oracle-pair'], needsReviewVersionIds: [], jointlyUnlocked: true},
    {cocktailId: 'single-multiple-sources', readyVersionIds: ['oracle-single-ready'], needsReviewVersionIds: ['oracle-single-brand'], jointlyUnlocked: false},
  ];
  const chosenPair = (combinations: Combination[]) => combinations.find(item => item.ingredientIds.length === 2 && item.ingredientIds.includes('lime') && item.ingredientIds.includes('syrup'));
  assert.deepEqual(versionSummary(chosenPair(exhaustiveOracle(data, pantry))), expected);
  assert.deepEqual(versionSummary(chosenPair(rankPresenceCombinations(data, pantry))), expected);
});

test('filtered Penicillin variants retain exact fallback, preparation and brand warnings', () => {
  const drink = fullCatalogue.cocktails.find(item => item.id === 'penicillin');
  assert.ok(drink);
  const versions = fullCatalogue.versions.filter(item => drink.versionIds.includes(item.id));
  const relevantIds = new Set(versions.flatMap(item => item.ingredients.map(item => item.ingredientId)));
  const data: Catalogue = {
    ...fullCatalogue,
    cocktails: [drink],
    versions,
    ingredients: fullCatalogue.ingredients.filter(item => relevantIds.has(item.id) || item.id === 'coffee-beans'),
    sources: fullCatalogue.sources.filter(item => versions.some(version => version.sourceId === item.id)),
  };
  const pantry: Pantry = {ingredientIds: ['scotch-whisky', 'islay-whisky', 'lemon-juice'], brandsByIngredient: {}};
  // Reviewed source facts are written explicitly; no production preparation helper computes expectations.
  const expected = exhaustiveOracle(data, pantry, {
    'penicillin-iba': 'partial',
    'penicillin-punch-proper-drink': 'disclosed',
  });
  const actual = rankPresenceCombinations(data, pantry);
  assert.deepEqual(normalize(actual), normalize(expected));
  const pair = actual.find(item => item.ingredientIds.length === 2 && item.ingredientIds.includes('honey-syrup') && item.ingredientIds.includes('ginger'));
  assert.deepEqual(versionSummary(pair), [{
    cocktailId: 'penicillin', readyVersionIds: [], needsReviewVersionIds: ['penicillin-iba'], jointlyUnlocked: true,
  }]);
  assert.deepEqual(pair?.cocktails[0]?.needsReviewVersions[0]?.unconfirmedBrands, [
    {ingredientId: 'islay-whisky', brandId: 'brand-lagavulin'},
  ]);
  assert.equal(pair?.cocktails[0]?.needsReviewVersions[0]?.preparationStatus, 'partial');
});
