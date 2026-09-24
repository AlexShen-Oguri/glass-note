/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';
import type {Bottle} from '../bottles/types';
import type {Catalogue, Ingredient, Localized, RecipeVersion} from '../contracts';
import {catalogue as fullCatalogue} from '../../content/catalogue';
import {evaluateOwnedVersion, mergeOwnedPantry} from './presence';
import type {Pantry} from './types';

const localized = (value: string): Localized => ({
  en: value, zh: value, fr: value, de: value, es: value, ko: value, ja: value, it: value,
});

function ingredient(id: string, base?: Ingredient['base']): Ingredient {
  return {id, name: localized(id), ...(base ? {base} : {}), exclusionTags: [], compositionKnown: true};
}

function version(id: string, ingredients: RecipeVersion['ingredients']): RecipeVersion {
  return {
    id,
    cocktailId: 'drink',
    label: localized(id),
    sourceId: 'source',
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

function catalogue(ingredients: Ingredient[], recipe: RecipeVersion): Catalogue {
  return {
    ingredients,
    versions: [recipe],
    cocktails: [{
      id: recipe.cocktailId,
      name: localized(recipe.cocktailId),
      aliases: [],
      category: 'curated',
      description: localized(recipe.cocktailId),
      versionIds: [recipe.id],
      defaultVersionId: recipe.id,
      accent: '#abc',
    }],
    brands: [],
    sources: [{id: recipe.sourceId, title: 'source', url: 'https://example.com', checkedAt: '2026-09-16'}],
  };
}

function bottle(id: string, brandId: string, ingredientIds: string[]): Bottle {
  return {
    id,
    brandId,
    brandName: brandId,
    name: id,
    aliases: [],
    family: 'gin',
    ingredientIds,
    abv: 40,
    market: 'test',
    flavours: [],
    profile: localized(id),
    source: {title: 'source', url: 'https://example.com', checkedAt: '2026-09-16'},
    profileBasis: 'identity',
  };
}

test('evaluates distinct required, optional, and base-missing ingredients without quantities', () => {
  const recipe = version('v', [
    {ingredientId: 'gin', amount: 30, unit: 'ml'},
    {ingredientId: 'gin', amount: 15, unit: 'ml'},
    {ingredientId: 'lime', amount: 15, unit: 'ml'},
    {ingredientId: 'lime', amount: 1, unit: 'piece', optional: true},
    {ingredientId: 'egg', amount: 1, unit: 'piece', optional: true},
  ]);
  const match = evaluateOwnedVersion(
    catalogue([ingredient('gin', 'gin'), ingredient('lime'), ingredient('egg')], recipe),
    recipe,
    {ingredientIds: [], brandsByIngredient: {}},
  );
  assert.ok(match);
  assert.deepEqual(match.missingIngredientIds, ['gin', 'lime']);
  assert.deepEqual(match.optionalMissingIngredientIds, ['egg']);
  assert.deepEqual(match.missingBaseIngredientIds, ['gin']);
  assert.equal(match.baseReady, false);
  assert.equal(match.status, 'missing');
});

test('returns null when any recipe ingredient id is unknown', () => {
  const recipe = version('unknown-v', [{ingredientId: 'unknown', amount: 1, unit: 'piece'}]);
  assert.equal(evaluateOwnedVersion(catalogue([], recipe), recipe, {ingredientIds: [], brandsByIngredient: {}}), null);
});

test('recipes without required base ingredients are base-ready and are not penalized', () => {
  const recipe = version('no-base-v', [{ingredientId: 'water', amount: 90, unit: 'ml'}]);
  const match = evaluateOwnedVersion(
    catalogue([ingredient('water', 'none')], recipe),
    recipe,
    {ingredientIds: [], brandsByIngredient: {}},
  );
  assert.ok(match);
  assert.equal(match.baseReady, true);
  assert.deepEqual(match.missingBaseIngredientIds, []);
  assert.deepEqual(match.missingIngredientIds, ['water']);
});

test('retains source brand and preparation review signals on a real catalogue version', () => {
  const recipe = fullCatalogue.versions.find(({id}) => id === 'penicillin-iba');
  assert.ok(recipe);
  const pantry: Pantry = {
    ingredientIds: [...new Set(recipe.ingredients.map(({ingredientId}) => ingredientId))],
    brandsByIngredient: {},
  };
  const match = evaluateOwnedVersion(fullCatalogue, recipe, pantry);
  assert.ok(match);
  assert.ok(match.unconfirmedBrands.some(({brandId}) => brandId === 'brand-lagavulin'));
  assert.equal(match.preparationNeedsReview, true);
  assert.equal(match.status, 'preparation-check');
});

test('merges only each owned bottle actual ingredient and brand mappings without mutating pantry', () => {
  const pantry: Pantry = {ingredientIds: ['lime'], brandsByIngredient: {lime: ['brand-lime']}};
  const merged = mergeOwnedPantry(pantry, [
    bottle('one', 'brand-a', ['gin']),
    bottle('two', 'brand-b', ['gin', 'vermouth']),
    bottle('three', 'brand-a', ['gin']),
  ]);
  assert.deepEqual(merged, {
    ingredientIds: ['lime', 'gin', 'vermouth'],
    brandsByIngredient: {
      lime: ['brand-lime'],
      gin: ['brand-a', 'brand-b'],
      vermouth: ['brand-b'],
    },
  });
  assert.deepEqual(pantry, {ingredientIds: ['lime'], brandsByIngredient: {lime: ['brand-lime']}});
});
