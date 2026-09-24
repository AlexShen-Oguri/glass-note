/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';
import type {Catalogue, Cocktail, Ingredient, Localized, RecipeIngredient, RecipeVersion} from '../contracts';
import type {ContextEvidence} from '../context';
import {recipeSnapshot} from '../making';
import {createFeedback, emptyTasteState, type TasteState} from '../taste';
import type {Pantry} from '../ingredients/types';
import {diversifyPantryResults, rankForPantry} from './pantry-ranking';

const DIGEST = 'a'.repeat(64);
const NOW = '2026-09-16T18:00:00.000Z';
const localized = (value: string): Localized => ({
  en: value, zh: value, fr: value, de: value, es: value, ko: value, ja: value, it: value,
});

function ingredient(id: string, base?: Ingredient['base'], exclusionTags: Ingredient['exclusionTags'] = []): Ingredient {
  return {id, name: localized(id), ...(base ? {base} : {}), exclusionTags, compositionKnown: true};
}

function version(
  id: string,
  cocktailId: string,
  ingredients: RecipeIngredient[],
  options: Partial<RecipeVersion> = {},
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
    originalSteps: ['Mix'],
    glass: localized('glass'),
    garnish: localized('none'),
    flavours: ['citrus'],
    tastes: ['refreshing'],
    strength: 'medium',
    approachability: 'balanced',
    profileBasis: 'editorial',
    profileNote: localized('profile'),
    sourceChecked: true,
    translationStatus: 'reviewed',
    ...options,
  };
}

function cocktail(id: string, versionIds: string[], category: Cocktail['category'] = 'curated'): Cocktail {
  return {
    id,
    name: localized(id),
    aliases: [],
    category,
    description: localized(id),
    versionIds,
    defaultVersionId: versionIds[0]!,
    accent: '#abc',
  };
}

function catalogue(
  versions: RecipeVersion[],
  cocktails: Cocktail[] = versions.map((item) => cocktail(item.cocktailId, [item.id])),
  ingredients: Ingredient[] = [
    ingredient('gin', 'gin', ['gin']),
    ingredient('rum', 'rum', ['rum']),
    ingredient('tequila', 'tequila', ['tequila']),
    ingredient('lime'),
    ingredient('syrup'),
    ingredient('water', 'none'),
    ingredient('egg', undefined, ['egg']),
  ],
): Catalogue {
  return {
    versions,
    cocktails,
    ingredients,
    brands: [],
    sources: [...new Set(versions.map(({sourceId}) => sourceId))].map((id) => ({
      id, title: id, url: `https://example.com/${id}`, checkedAt: '2026-09-16',
    })),
  };
}

function pantry(ingredientIds: string[]): Pantry {
  return {ingredientIds, brandsByIngredient: {}};
}

function evidence(versionId: string, sourceId: string, score = 1): ContextEvidence {
  return {
    versionId,
    sourceId,
    reviewedAt: '2026-09-16',
    basis: 'editorial',
    recipeDigest: DIGEST,
    occasions: score > 0 ? [{value: 'meal', reason: 'bitter-dry'}] : [],
    seasons: score > 1 ? [{value: 'summer', reason: 'citrus-refreshing'}] : [],
  };
}

function liked(data: Catalogue, versionId: string): TasteState {
  const recipe = recipeSnapshot(data, versionId);
  assert.ok(recipe);
  return {
    format: 'glass-notes-taste',
    schemaVersion: 1,
    entries: [createFeedback(recipe, `liked-${versionId}`, NOW, {
      experience: 'drank',
      sentiment: 'like',
      tooSweet: false,
      tooStrong: false,
      likedFlavours: [],
      notes: '',
    })],
  };
}

test('empty pantry returns no ranked results so the UI can own fallback confirmation', () => {
  const recipe = version('v', 'drink', [{ingredientId: 'gin', amount: 30, unit: 'ml'}]);
  assert.deepEqual(rankForPantry(catalogue([recipe]), {}, emptyTasteState(), {}, [], pantry([])), []);
});

test('nonempty unrelated pantry still includes a two-required-ingredient version', () => {
  const recipe = version('v', 'drink', [
    {ingredientId: 'lime', amount: 15, unit: 'ml'},
    {ingredientId: 'syrup', amount: 15, unit: 'ml'},
  ]);
  const results = rankForPantry(catalogue([recipe]), {}, emptyTasteState(), {}, [], pantry(['water']));
  assert.equal(results.length, 1);
  assert.deepEqual(results[0]!.pantryMatch.missingIngredientIds, ['lime', 'syrup']);
});

test('base-ready with two missing auxiliaries ranks before one missing base', () => {
  const baseReady = version('base-ready-v', 'base-ready', [
    {ingredientId: 'gin', amount: 30, unit: 'ml'},
    {ingredientId: 'lime', amount: 15, unit: 'ml'},
    {ingredientId: 'syrup', amount: 15, unit: 'ml'},
  ]);
  const baseMissing = version('base-missing-v', 'base-missing', [
    {ingredientId: 'rum', amount: 30, unit: 'ml'},
    {ingredientId: 'water', amount: 30, unit: 'ml'},
  ]);
  const results = rankForPantry(
    catalogue([baseMissing, baseReady]), {}, emptyTasteState(), {}, [], pantry(['gin', 'water']),
  );
  assert.deepEqual(results.map(({cocktailId}) => cocktailId), ['base-ready', 'base-missing']);
  assert.equal(results[0]!.pantryMatch.missingIngredientIds.length, 2);
  assert.equal(results[1]!.pantryMatch.missingIngredientIds.length, 1);
});

test('one cocktail chooses its base-ready source version before a less-missing base-incomplete version', () => {
  const baseMissing = version('base-missing-v', 'drink', [
    {ingredientId: 'rum', amount: 30, unit: 'ml'},
    {ingredientId: 'water', amount: 30, unit: 'ml'},
  ]);
  const baseReady = version('base-ready-v', 'drink', [
    {ingredientId: 'gin', amount: 30, unit: 'ml'},
    {ingredientId: 'lime', amount: 15, unit: 'ml'},
    {ingredientId: 'syrup', amount: 15, unit: 'ml'},
  ]);
  const data = catalogue([baseMissing, baseReady], [cocktail('drink', ['base-missing-v', 'base-ready-v'])]);
  const [result] = rankForPantry(data, {}, emptyTasteState(), {}, [], pantry(['gin', 'water']));
  assert.ok(result);
  assert.equal(result.selectedVersionId, 'base-ready-v');
  assert.equal(result.pantryMatch.baseReady, true);
});

test('hard alcohol-free and ingredient exclusions apply before pantry priority', () => {
  const alcoholic = version('alcohol-v', 'alcohol', [{ingredientId: 'gin', amount: 30, unit: 'ml'}], {strength: 'strong'});
  const unsafe = version('egg-v', 'egg', [{ingredientId: 'egg', amount: 1, unit: 'piece'}], {strength: 'none'});
  const safe = version('safe-v', 'safe', [{ingredientId: 'water', amount: 90, unit: 'ml'}], {strength: 'none'});
  const data = catalogue(
    [alcoholic, unsafe, safe],
    [cocktail('alcohol', ['alcohol-v']), cocktail('egg', ['egg-v'], 'alcohol-free'), cocktail('safe', ['safe-v'], 'alcohol-free')],
  );
  const results = rankForPantry(
    data,
    {strengths: ['none'], excluded: ['egg']},
    emptyTasteState(),
    {},
    [],
    pantry(['gin', 'water', 'egg']),
  );
  assert.deepEqual(results.map(({cocktailId}) => cocktailId), ['safe']);
  assert.equal(results[0]!.pantryMatch.baseReady, true);
});

test('versions with unknown ingredient ids are excluded rather than counted as missing', () => {
  const unknown = version('unknown-v', 'unknown', [{ingredientId: 'unknown', amount: 1, unit: 'piece'}]);
  const known = version('known-v', 'known', [{ingredientId: 'water', amount: 30, unit: 'ml'}]);
  const results = rankForPantry(catalogue([unknown, known]), {}, emptyTasteState(), {}, [], pantry(['water']));
  assert.deepEqual(results.map(({cocktailId}) => cocktailId), ['known']);
});

test('context score precedes taste memory inside one base and missing tier', () => {
  const contextual = version('context-v', 'contextual', [{ingredientId: 'gin', amount: 30, unit: 'ml'}]);
  const remembered = version('remembered-v', 'remembered', [{ingredientId: 'gin', amount: 30, unit: 'ml'}]);
  const data = catalogue([remembered, contextual]);
  const results = rankForPantry(
    data,
    {},
    liked(data, 'remembered-v'),
    {occasion: 'meal', season: 'summer'},
    [evidence('context-v', contextual.sourceId, 2), evidence('remembered-v', remembered.sourceId, 1)],
    pantry(['gin']),
  );
  assert.deepEqual(results.map(({cocktailId}) => cocktailId), ['contextual', 'remembered']);
  assert.deepEqual(results.map(({contextScore}) => contextScore), [2, 1]);
});

test('diversification stays inside base/missing tiers and returns the complete list', () => {
  const ginOne = version('gin-one-v', 'gin-one', [{ingredientId: 'gin', amount: 30, unit: 'ml'}]);
  const ginTwo = version('gin-two-v', 'gin-two', [{ingredientId: 'gin', amount: 30, unit: 'ml'}]);
  const classic = version('classic-v', 'classic', [{ingredientId: 'gin', amount: 30, unit: 'ml'}]);
  const rum = version('rum-v', 'rum-drink', [{ingredientId: 'gin', amount: 30, unit: 'ml'}], {flavours: ['fruit']});
  const lower = version('lower-v', 'lower', [{ingredientId: 'tequila', amount: 30, unit: 'ml'}]);
  const data = catalogue(
    [ginOne, ginTwo, classic, rum, lower],
    [
      cocktail('gin-one', ['gin-one-v']),
      cocktail('gin-two', ['gin-two-v']),
      cocktail('classic', ['classic-v'], 'classic'),
      cocktail('rum-drink', ['rum-v']),
      cocktail('lower', ['lower-v']),
    ],
  );
  const ranked = rankForPantry(data, {}, emptyTasteState(), {}, [], pantry(['gin']));
  const diversified = diversifyPantryResults(data, ranked, 3);
  assert.equal(diversified.length, ranked.length);
  assert.equal(diversified.at(-1)?.cocktailId, 'lower');
  assert.ok(diversified.slice(0, 3).some(({cocktailId}) => cocktailId === 'classic'));
  assert.ok(diversified.slice(0, 4).every(({pantryMatch}) => pantryMatch.baseReady));
});
