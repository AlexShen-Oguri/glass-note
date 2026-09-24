/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';

import type {
  Catalogue,
  Cocktail,
  Ingredient,
  Localized,
  RecipeVersion,
  SearchQuery,
} from '../contracts';
import {
  formatAmount,
  matchVersion,
  normalizeSearchText,
  searchCocktails,
} from './index';

const localized = (english: string, chinese = english): Localized => ({
  en: english,
  zh: chinese,
  fr: english,
  de: english,
  es: english,
  ko: english,
  ja: english,
  it: english,
});

test('editorial collections still require the same recipe version to match other preferences', () => {
  const japanese = cocktail('japan-creation', ['japan-herbal', 'japan-fruit'], {collections: ['japan']});
  const other = cocktail('other', ['other-fruit']);
  const data: Catalogue = {
    cocktails: [japanese, other],
    versions: [
      version('japan-herbal', japanese.id, {flavours: ['herbal'], strength: 'strong'}),
      version('japan-fruit', japanese.id, {flavours: ['fruit'], strength: 'low'}),
      version('other-fruit', other.id, {flavours: ['fruit'], strength: 'strong'}),
    ], ingredients: [], sources: [], brands: [],
  };
  assert.deepEqual(searchCocktails(data, {collection: 'japan', flavours: ['fruit'], strengths: ['strong']}), []);
  const results = searchCocktails(data, {collection: 'japan', flavours: ['fruit']});
  assert.deepEqual(results.map(item => item.cocktailId), ['japan-creation']);
  assert.equal(results[0]?.selectedVersionId, 'japan-fruit');
  assert.ok(data.versions[2]);
  assert.equal(matchVersion(data, data.versions[2], {collection: 'japan'}), false);
});

const ingredient = (
  id: string,
  options: Partial<Ingredient> = {},
): Ingredient => ({
  id,
  name: localized(id),
  exclusionTags: [],
  compositionKnown: true,
  ...options,
});

const cocktail = (
  id: string,
  versionIds: string[],
  options: Partial<Cocktail> = {},
): Cocktail => ({
  id,
  name: localized(id),
  aliases: [],
  category: 'classic',
  description: localized(''),
  versionIds,
  defaultVersionId: versionIds[0] ?? '',
  accent: '#000000',
  ...options,
});

const version = (
  id: string,
  cocktailId: string,
  options: Partial<RecipeVersion> = {},
): RecipeVersion => ({
  id,
  cocktailId,
  servings: 1,
  label: localized(id),
  sourceId: 'source',
  ingredients: [],
  steps: {
    en: [], zh: [], fr: [], de: [], es: [], ko: [], ja: [], it: [],
  },
  originalLanguage: 'en',
  glass: localized('glass'),
  garnish: localized('garnish'),
  flavours: [],
  tastes: [],
  strength: null,
  approachability: null,
  profileBasis: 'editorial',
  profileNote: localized(''),
  sourceChecked: true,
  translationStatus: 'reviewed',
  ...options,
});

const catalogue = (options: Partial<Catalogue> = {}): Catalogue => ({
  cocktails: [],
  versions: [],
  ingredients: [],
  brands: [],
  sources: [],
  ...options,
});

test('normalizes case, punctuation, whitespace, and composed or decomposed accents', () => {
  assert.equal(normalizeSearchText('  CRÈME—Brûlée!! '), 'creme brulee');
  assert.equal(normalizeSearchText('Cre\u0300me Bru\u0302le\u0301e'), 'creme brulee');
  assert.equal(normalizeSearchText('内格罗尼'), '内格罗尼');
});

test('uses tolerant text scoring without relaxing exact recipe-version filters', () => {
  const martini = cocktail('martini', ['gin-version', 'vodka-version'], {
    name: localized('Dry Martini', '干马天尼'),
  });
  const data = catalogue({
    cocktails: [martini],
    ingredients: [
      ingredient('gin', {base: 'gin'}),
      ingredient('vodka', {base: 'vodka'}),
      ingredient('egg-white', {exclusionTags: ['egg']}),
    ],
    brands: [{id: 'acme', name: 'Acme Gin', ingredientIds: ['gin']}],
    versions: [
      version('gin-version', martini.id, {
        ingredients: [{ingredientId: 'gin', amount: 60, unit: 'ml', brandId: 'acme'}],
        flavours: ['herbal'],
      }),
      version('vodka-version', martini.id, {
        ingredients: [
          {ingredientId: 'vodka', amount: 60, unit: 'ml'},
          {ingredientId: 'egg-white', amount: 15, unit: 'ml', optional: true},
        ],
        flavours: ['fruit'],
      }),
    ],
  });

  assert.deepEqual(searchCocktails(data, {text: '马提尼', bases: ['gin']})[0]?.versionIds, ['gin-version']);
  assert.deepEqual(searchCocktails(data, {text: 'martni', brandIds: ['acme']})[0]?.versionIds, ['gin-version']);
  assert.deepEqual(searchCocktails(data, {text: '马提尼', bases: ['gin'], flavours: ['fruit']}), []);
  assert.deepEqual(searchCocktails(data, {text: '马提尼', brandIds: ['missing']}), []);
  assert.deepEqual(searchCocktails(data, {text: 'martni', bases: ['vodka'], excluded: ['egg']}), []);
});

test('requires one version to satisfy every dimension and uses OR within a dimension', () => {
  const data = catalogue({
    cocktails: [cocktail('split', ['gin-version', 'rum-version'])],
    ingredients: [
      ingredient('gin', {base: 'gin'}),
      ingredient('rum', {base: 'rum'}),
    ],
    versions: [
      version('gin-version', 'split', {
        ingredients: [{ingredientId: 'gin', amount: 30, unit: 'ml'}],
        flavours: ['floral'],
        tastes: ['sour'],
        strength: 'strong',
        approachability: 'bold',
      }),
      version('rum-version', 'split', {
        ingredients: [{ingredientId: 'rum', amount: 30, unit: 'ml'}],
        flavours: ['fruit'],
        tastes: ['sweet'],
        strength: 'low',
        approachability: 'gentle',
      }),
    ],
  });

  const oneVersionQuery: SearchQuery = {
    bases: ['vodka', 'gin'],
    flavours: ['spice', 'floral'],
    tastes: ['bitter', 'sour'],
    strengths: ['medium', 'strong'],
    approachability: ['balanced', 'bold'],
  };
  assert.deepEqual(searchCocktails(data, oneVersionQuery), [{
    cocktailId: 'split',
    versionIds: ['gin-version'],
    selectedVersionId: 'gin-version',
    score: 0,
    reasons: ['base', 'flavour', 'taste', 'strength', 'approachability'],
  }]);

  assert.deepEqual(searchCocktails(data, {bases: ['gin'], flavours: ['fruit']}), []);
});

test('matches exact listed ingredient IDs with all or any semantics, including optional rows', () => {
  const drink = cocktail('listed', ['default', 'exact'], {defaultVersionId: 'default'});
  const data = catalogue({
    cocktails: [drink],
    ingredients: [ingredient('gin'), ingredient('lemon-juice'), ingredient('vermouth')],
    versions: [
      version('default', drink.id, {
        ingredients: [{ingredientId: 'gin', amount: 45, unit: 'ml'}],
      }),
      version('exact', drink.id, {
        ingredients: [
          {ingredientId: 'gin', amount: 45, unit: 'ml'},
          {ingredientId: 'lemon-juice', amount: 5, unit: 'ml', optional: true},
        ],
      }),
    ],
  });

  assert.deepEqual(searchCocktails(data, {
    ingredientIds: ['gin', 'lemon-juice'],
  }), [{
    cocktailId: drink.id,
    versionIds: ['exact'],
    selectedVersionId: 'exact',
    score: 0,
    reasons: ['ingredient'],
  }]);
  assert.deepEqual(
    searchCocktails(data, {ingredientIds: ['lemon-juice', 'vermouth'], ingredientMode: 'any'})[0]?.versionIds,
    ['exact'],
  );
  assert.deepEqual(searchCocktails(data, {ingredientIds: ['lemon-juice', 'vermouth']}), []);
  assert.deepEqual(searchCocktails(data, {ingredientIds: ['lemon']}), []);
});

test('does not combine ingredient and method evidence from separate source versions', () => {
  const drink = cocktail('split-structured', ['with-ingredients', 'with-method']);
  const data = catalogue({
    cocktails: [drink],
    ingredients: [ingredient('gin'), ingredient('lemon-juice')],
    versions: [
      version('with-ingredients', drink.id, {
        sourceId: 'ingredients-source',
        ingredients: [
          {ingredientId: 'gin', amount: 45, unit: 'ml'},
          {ingredientId: 'lemon-juice', amount: 15, unit: 'ml'},
        ],
      }),
      version('with-method', drink.id, {
        sourceId: 'method-source',
        ingredients: [{ingredientId: 'gin', amount: 45, unit: 'ml'}],
        originalSteps: ['Shake with ice.'],
        mixingMethods: [{
          method: 'shake',
          sourceId: 'method-source',
          stepIndexes: [0],
          reviewedAt: '2026-09-15',
        }],
      }),
    ],
  });

  assert.deepEqual(searchCocktails(data, {
    ingredientIds: ['gin', 'lemon-juice'],
    methods: ['shake'],
  }), []);
});

test('applies exact ingredient exclusions without inferring compound contents or safety', () => {
  const data = catalogue({
    ingredients: [
      ingredient('lemon-juice'),
      ingredient('sour-mix'),
      ingredient('mystery-mix', {compositionKnown: false}),
    ],
  });
  const exact = version('exact-lemon', 'drink', {
    ingredients: [{ingredientId: 'lemon-juice', amount: 15, unit: 'ml', optional: true}],
  });
  const compound = version('compound', 'drink', {
    ingredients: [{ingredientId: 'sour-mix', amount: 15, unit: 'ml'}],
  });
  const unresolved = version('unresolved', 'drink', {
    ingredients: [{ingredientId: 'mystery-mix', amount: 15, unit: 'ml'}],
  });
  const missing = version('missing-reference', 'drink', {
    ingredients: [{ingredientId: 'absent', amount: 15, unit: 'ml'}],
  });

  assert.equal(matchVersion(data, exact, {excludedIngredientIds: ['lemon-juice']}), false);
  assert.equal(matchVersion(data, compound, {excludedIngredientIds: ['lemon-juice']}), true);
  assert.equal(matchVersion(data, compound, {ingredientIds: ['lemon-juice']}), false);
  assert.equal(matchVersion(data, unresolved, {excludedIngredientIds: ['lemon-juice']}), false);
  assert.equal(matchVersion(data, missing, {excludedIngredientIds: ['lemon-juice']}), false);
  assert.equal(matchVersion(data, compound, {excludedIngredientIds: ['unknown-id']}), false);
});

test('matches only valid method evidence for the same source and original steps', () => {
  const data = catalogue();
  const valid = version('valid-method', 'drink', {
    sourceId: 'source-a',
    originalSteps: ['Stir over ice.', 'Strain.'],
    mixingMethods: [{
      method: 'stir',
      sourceId: 'source-a',
      stepIndexes: [0],
      reviewedAt: '2026-09-15',
    }],
  });
  const wrongSource = version('wrong-source', 'drink', {
    sourceId: 'source-a',
    originalSteps: ['Shake.'],
    mixingMethods: [{
      method: 'shake',
      sourceId: 'source-b',
      stepIndexes: [0],
      reviewedAt: '2026-09-15',
    }],
  });
  const invalidIndex = version('invalid-index', 'drink', {
    sourceId: 'source-a',
    originalSteps: ['Shake.'],
    mixingMethods: [{
      method: 'shake',
      sourceId: 'source-a',
      stepIndexes: [0, 1],
      reviewedAt: '2026-09-15',
    }],
  });
  const unknownMethod = version('unknown-method', 'drink', {
    sourceId: 'source-a',
    originalSteps: ['Whisk.'],
    mixingMethods: [{
      method: 'whisk' as never,
      sourceId: 'source-a',
      stepIndexes: [0],
      reviewedAt: '2026-09-15',
    }],
  });
  const malformedIndexes = version('malformed-indexes', 'drink', {
    sourceId: 'source-a',
    originalSteps: ['Shake.'],
    mixingMethods: [{
      method: 'shake',
      sourceId: 'source-a',
      stepIndexes: undefined as never,
      reviewedAt: '2026-09-15',
    }],
  });

  assert.equal(matchVersion(data, valid, {methods: ['shake', 'stir']}), true);
  assert.equal(matchVersion(data, valid, {methods: ['shake']}), false);
  assert.equal(matchVersion(data, wrongSource, {methods: ['shake']}), false);
  assert.equal(matchVersion(data, invalidIndex, {methods: ['shake']}), false);
  assert.equal(matchVersion(data, unknownMethod, {methods: ['shake']}), false);
  assert.equal(matchVersion(data, malformedIndexes, {methods: ['shake']}), false);
});

test('matches only brands explicitly required by a recipe version', () => {
  const data = catalogue({
    cocktails: [
      cocktail('suggestion-only', ['unbranded']),
      cocktail('specified', ['branded']),
    ],
    ingredients: [
      ingredient('gin', {
        base: 'gin',
        brandIds: ['acme'],
        name: localized('Gin', '金酒'),
      }),
    ],
    brands: [{id: 'acme', name: 'Acme Gin', ingredientIds: ['gin']}],
    versions: [
      version('unbranded', 'suggestion-only', {
        ingredients: [{ingredientId: 'gin', amount: 30, unit: 'ml'}],
      }),
      version('branded', 'specified', {
        ingredients: [{ingredientId: 'gin', amount: 30, unit: 'ml', brandId: 'acme'}],
      }),
    ],
  });

  assert.deepEqual(
    searchCocktails(data, {brandIds: ['acme']}).map(({cocktailId}) => cocktailId),
    ['specified'],
  );
  assert.deepEqual(
    searchCocktails(data, {text: 'Acme Gin'}).map(({cocktailId}) => cocktailId),
    ['specified'],
  );
  assert.equal(matchVersion(data, data.versions[0]!, {brandIds: ['acme']}), false);
});

test('applies exclusions to optional ingredients and unresolved or missing composition', () => {
  const data = catalogue({
    ingredients: [
      ingredient('egg-white', {exclusionTags: ['egg']}),
      ingredient('known-juice'),
      ingredient('mystery-mix', {compositionKnown: false}),
    ],
  });
  const withOptionalEgg = version('egg', 'drink', {
    ingredients: [{ingredientId: 'egg-white', amount: 15, unit: 'ml', optional: true}],
  });
  const withMystery = version('mystery', 'drink', {
    ingredients: [{ingredientId: 'mystery-mix', amount: 15, unit: 'ml'}],
  });
  const withMissingReference = version('missing', 'drink', {
    ingredients: [{ingredientId: 'not-in-catalogue', amount: 15, unit: 'ml'}],
  });

  assert.equal(matchVersion(data, withOptionalEgg, {excluded: ['egg']}), false);
  assert.equal(matchVersion(data, withMystery, {excluded: ['dairy']}), false);
  assert.equal(matchVersion(data, withMissingReference, {excluded: ['egg']}), false);
  assert.equal(matchVersion(data, withMystery, {}), true);
});

test('checks ingredient base fields for exclusions', () => {
  const data = catalogue({ingredients: [ingredient('gin', {base: 'gin'})]});
  const recipe = version('gin-version', 'drink', {
    ingredients: [{ingredientId: 'gin', amount: 45, unit: 'ml'}],
  });

  assert.equal(matchVersion(data, recipe, {excluded: ['gin']}), false);
  assert.equal(matchVersion(data, recipe, {excluded: ['rum']}), true);
});

test('matches alcohol-free filters only from explicit version strength evidence', () => {
  const data = catalogue({
    ingredients: [
      ingredient('juice'),
      ingredient('zero-spirit', {base: 'none'}),
    ],
  });
  const verifiedByStrength = version('strength-none', 'drink', {
    strength: 'none',
    ingredients: [{ingredientId: 'juice', amount: 60, unit: 'ml'}],
  });
  const verifiedByBase = version('base-none', 'drink', {
    ingredients: [{ingredientId: 'zero-spirit', amount: 60, unit: 'ml'}],
  });
  const unverified = version('unknown', 'drink', {
    ingredients: [{ingredientId: 'juice', amount: 60, unit: 'ml'}],
  });

  assert.equal(matchVersion(data, verifiedByStrength, {bases: ['none']}), true);
  assert.equal(matchVersion(data, verifiedByBase, {bases: ['none']}), false);
  assert.equal(matchVersion(data, unverified, {bases: ['none']}), false);
  assert.equal(matchVersion(data, verifiedByStrength, {strengths: ['none']}), true);
  assert.equal(matchVersion(data, unverified, {strengths: ['none']}), false);
  assert.equal(matchVersion(data, unverified, {strengths: ['low', 'medium']}), false);
});

test('does not treat a base-none mixer as proof that an alcoholic version is alcohol-free', () => {
  const data = catalogue({
    ingredients: [
      ingredient('gin', {base: 'gin'}),
      ingredient('zero-proof-mixer', {base: 'none'}),
    ],
  });
  const alcoholicVersion = version('mixed', 'drink', {
    strength: 'strong',
    ingredients: [
      {ingredientId: 'gin', amount: 45, unit: 'ml'},
      {ingredientId: 'zero-proof-mixer', amount: 30, unit: 'ml'},
    ],
  });

  assert.equal(matchVersion(data, alcoholicVersion, {bases: ['none']}), false);
  assert.equal(matchVersion(data, alcoholicVersion, {bases: ['gin', 'none']}), true);
});

test('matches multilingual cocktail aliases and actual version ingredient names', () => {
  const data = catalogue({
    cocktails: [cocktail('french-75', ['f75'], {
      name: {...localized('French 75'), fr: 'Soixante-quinze'},
      aliases: ['Soixante Quinze', 'French Seventy-Five'],
    })],
    ingredients: [ingredient('lemon', {
      name: {...localized('Lemon juice'), fr: 'Jus de citron'},
    })],
    versions: [version('f75', 'french-75', {
      ingredients: [{ingredientId: 'lemon', amount: 15, unit: 'ml'}],
    })],
  });

  assert.equal(matchVersion(data, data.versions[0]!, {text: 'SOIXANTE–QUINZE'}), true);
  assert.equal(matchVersion(data, data.versions[0]!, {text: 'jus de cítron'}), true);
  assert.equal(searchCocktails(data, {text: 'seventy-five'}).length, 1);
});

test('returns one card per cocktail, chooses a matching default, and ignores broken links', () => {
  const data = catalogue({
    cocktails: [
      cocktail('one', ['missing', 'v1', 'v2', 'v2'], {defaultVersionId: 'v2'}),
      cocktail('one', ['v1']),
      cocktail('broken', ['wrong-owner']),
    ],
    versions: [
      version('v1', 'one', {flavours: ['floral']}),
      version('v2', 'one', {flavours: ['fruit']}),
      version('wrong-owner', 'someone-else', {flavours: ['fruit']}),
    ],
  });

  assert.deepEqual(searchCocktails(data, {flavours: ['floral', 'fruit']}), [{
    cocktailId: 'one',
    versionIds: ['v1', 'v2'],
    selectedVersionId: 'v2',
    score: 0,
    reasons: ['flavour'],
  }]);
  assert.equal(searchCocktails(data, {flavours: ['floral']})[0]?.selectedVersionId, 'v1');
});

test('orders by text quality, then classic category, then stable id without popularity data', () => {
  const data = catalogue({
    cocktails: [
      cocktail('z-classic', ['z'], {name: localized('Sun'), category: 'classic'}),
      cocktail('a-curated', ['a'], {name: localized('Sun'), category: 'curated'}),
      cocktail('b-exact', ['b'], {name: localized('Sunrise'), category: 'curated'}),
      cocktail('a-classic', ['c'], {name: localized('Sun'), category: 'classic'}),
    ],
    versions: [
      version('z', 'z-classic'),
      version('a', 'a-curated'),
      version('b', 'b-exact'),
      version('c', 'a-classic'),
    ],
  });

  assert.deepEqual(
    searchCocktails(data, {text: 'sunrise'}).map(({cocktailId, score}) => ({cocktailId, score})),
    [{cocktailId: 'b-exact', score: 500}],
  );
  assert.deepEqual(
    searchCocktails(data, {text: 'sun'}).map(({cocktailId}) => cocktailId),
    ['a-classic', 'z-classic', 'a-curated', 'b-exact'],
  );
  assert.ok(searchCocktails(data, {}).every(({score, reasons}) => score === 0 && reasons.length === 0));
});

test('converts only volume units and preserves special measures', () => {
  assert.deepEqual(formatAmount(30, 'ml', 'oz'), {amount: '1.01', unit: 'oz'});
  assert.deepEqual(formatAmount(1, 'oz', 'ml'), {amount: '29.57', unit: 'ml'});
  assert.deepEqual(formatAmount(2, 'dash', 'oz'), {amount: '2', unit: 'dash'});
  assert.deepEqual(formatAmount(1, 'barspoon', 'ml'), {amount: '1', unit: 'barspoon'});
  assert.deepEqual(formatAmount(1.5, 'tsp', 'oz'), {amount: '1.5', unit: 'tsp'});
  assert.deepEqual(formatAmount(1, 'tbsp', 'ml'), {amount: '1', unit: 'tbsp'});
  assert.deepEqual(formatAmount(1, 'tbsp', 'oz'), {amount: '1', unit: 'tbsp'});
  assert.deepEqual(formatAmount(1, 'pinch', 'ml'), {amount: '1', unit: 'pinch'});
  assert.deepEqual(formatAmount(1, 'pinch', 'oz'), {amount: '1', unit: 'pinch'});
  assert.deepEqual(formatAmount(2, 'bunch', 'ml'), {amount: '2', unit: 'bunch'});
  assert.deepEqual(formatAmount(2, 'bunch', 'oz'), {amount: '2', unit: 'bunch'});
  assert.deepEqual(formatAmount(null, 'top', 'ml'), {amount: '', unit: 'top'});
  assert.deepEqual(formatAmount(10, 'g', 'oz'), {amount: '10', unit: 'g'});
});
