/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';
import type {Catalogue, Cocktail, Ingredient, Localized, RecipeIngredient, RecipeVersion} from '../contracts';
import {evaluateOwnedVersion} from '../ingredients/presence';
import type {Pantry} from '../ingredients/types';
import {decisionShelf, decisionsForPresence, rankPresenceUnlocks} from './presence-decisions';

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
