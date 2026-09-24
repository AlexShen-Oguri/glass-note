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
  Source,
} from '../contracts';
import {recipeSnapshot} from '../making';
import {createFeedback, emptyTasteState, rankWithTaste, type TasteState} from '../taste';
import {
  diversifyContextResults,
  normalizeContextSelection,
  rankForContext,
} from '.';
import type {ContextEvidence, ContextResult} from './types';

const NOW = '2026-09-15T18:00:00.000Z';
const DIGEST = 'a'.repeat(64);

function localized(value: string): Localized {
  return {en: value, zh: value, fr: value, de: value, es: value, ko: value, ja: value, it: value};
}

function ingredient(id: string, base?: Ingredient['base'], exclusionTags: Ingredient['exclusionTags'] = []): Ingredient {
  return {id, name: localized(id), ...(base ? {base} : {}), exclusionTags, compositionKnown: true};
}

function source(id: string): Source {
  return {id, title: id, url: `https://example.com/${id}`, checkedAt: '2026-09-15'};
}

function version(
  id: string,
  cocktailId: string,
  sourceId: string,
  ingredientId: string,
  options: Partial<RecipeVersion> = {},
): RecipeVersion {
  return {
    id,
    cocktailId,
    label: localized(id),
    sourceId,
    servings: 1,
    ingredients: [{ingredientId, amount: 30, unit: 'ml'}],
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

function cocktail(
  id: string,
  versionIds: string[],
  category: Cocktail['category'] = 'curated',
): Cocktail {
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
  cocktails = versions.map((item) => cocktail(item.cocktailId, [item.id])),
  ingredients: Ingredient[] = [
    ingredient('gin', 'gin', ['gin']),
    ingredient('rum', 'rum', ['rum']),
    ingredient('whiskey', 'whiskey', ['whiskey']),
    ingredient('tequila', 'tequila', ['tequila']),
    ingredient('water', 'none'),
    ingredient('egg', undefined, ['egg']),
  ],
): Catalogue {
  const sourceIds = [...new Set(versions.map((item) => item.sourceId))];
  return {cocktails, versions, ingredients, brands: [], sources: sourceIds.map(source)};
}

function evidence(
  versionId: string,
  sourceId: string,
  values: Pick<ContextEvidence, 'occasions' | 'seasons'>,
  overrides: Partial<ContextEvidence> = {},
): ContextEvidence {
  return {
    versionId,
    sourceId,
    reviewedAt: '2026-09-15',
    basis: 'editorial',
    recipeDigest: DIGEST,
    ...values,
    ...overrides,
  };
}

function likedState(data: Catalogue, versionId: string, feedbackId = `liked-${versionId}`): TasteState {
  const recipe = recipeSnapshot(data, versionId);
  assert.ok(recipe);
  return {
    format: 'glass-notes-taste',
    schemaVersion: 1,
    entries: [createFeedback(recipe, feedbackId, NOW, {
      experience: 'drank',
      sentiment: 'like',
      tooSweet: false,
      tooStrong: false,
      likedFlavours: [],
      notes: '',
    })],
  };
}

test('normalizeContextSelection retains only legal single occasion and season values', () => {
  assert.deepEqual(normalizeContextSelection({occasion: 'meal', season: 'summer'}), {
    occasion: 'meal',
    season: 'summer',
  });
  assert.deepEqual(normalizeContextSelection({occasion: 'brunch' as never, season: 'monsoon' as never}), {});
  assert.deepEqual(normalizeContextSelection({occasion: ['meal'] as never, season: ['summer'] as never}), {});
  assert.deepEqual(normalizeContextSelection(null as never), {});
});

test('empty or invalid context preserves rankWithTaste order and exact selected versions', () => {
  const versions = [
    version('alpha-v', 'alpha', 'source-a', 'gin'),
    version('beta-v', 'beta', 'source-b', 'rum'),
  ];
  const data = catalogue(versions);
  const taste = likedState(data, 'beta-v');
  const baseline = rankWithTaste(data, {}, taste);
  const contextual = rankForContext(data, {}, taste, {}, []);
  assert.deepEqual(
    contextual.map(({contextReasons: _reasons, contextScore: _score, ...result}) => result),
    baseline,
  );
  assert.ok(contextual.every((result) => result.contextScore === 0 && result.contextReasons.length === 0));
  assert.deepEqual(rankForContext(data, {}, taste, {occasion: 'unknown' as never}, []), contextual);
  assert.deepEqual(rankForContext(data, {}, taste, {occasion: 'meal'}, []), contextual);
});

test('context score precedes memory and selects memory only from the best exact version tier', () => {
  const lower = version('drink-lower', 'drink', 'source-lower', 'gin');
  const best = version('drink-best', 'drink', 'source-best', 'rum');
  const remembered = version('remembered-v', 'remembered', 'source-remembered', 'whiskey');
  const data = catalogue(
    [lower, best, remembered],
    [cocktail('drink', ['drink-lower', 'drink-best'], 'classic'), cocktail('remembered', ['remembered-v'])],
  );
  const bestMemory = likedState(data, 'drink-best', 'liked-best');
  const lowerTierMemory = likedState(data, 'remembered-v', 'liked-lower-tier');
  const taste: TasteState = {...bestMemory, entries: [...bestMemory.entries, ...lowerTierMemory.entries]};
  const contextEvidence = [
    evidence('drink-lower', 'source-lower', {
      occasions: [{value: 'meal', reason: 'bitter-dry'}],
      seasons: [],
    }),
    evidence('drink-best', 'source-best', {
      occasions: [{value: 'meal', reason: 'rich-finish'}],
      seasons: [{value: 'winter', reason: 'spice-depth'}],
    }),
    evidence('remembered-v', 'source-remembered', {
      occasions: [{value: 'meal', reason: 'simple-build'}],
      seasons: [],
    }),
  ];

  const results = rankForContext(data, {}, taste, {occasion: 'meal', season: 'winter'}, contextEvidence);
  assert.deepEqual(results.map(({cocktailId}) => cocktailId), ['drink', 'remembered']);
  assert.equal(results[0]!.selectedVersionId, 'drink-best');
  assert.deepEqual(results[0]!.versionIds, ['drink-lower', 'drink-best']);
  assert.equal(results[0]!.contextScore, 2);
  assert.deepEqual(results[0]!.contextReasons.map(({dimension}) => dimension), ['occasion', 'season']);
  assert.ok(results[0]!.memoryReasons.some((reason) =>
    reason.kind === 'liked-version' && reason.feedbackIds.includes('liked-best')));
  assert.ok(results[0]!.memoryReasons.every((reason) => !reason.feedbackIds.includes('liked-lower-tier')));
  assert.equal(results[1]!.contextScore, 1);
});

test('hard brand matching selects the eligible source version before context evidence', () => {
  const sourceA = version('version-a', 'drink', 'source-a', 'gin', {
    ingredients: [{ingredientId: 'gin', amount: 30, unit: 'ml', brandId: 'brand-a'}],
  });
  const sourceB = version('version-b', 'drink', 'source-b', 'gin', {
    ingredients: [{ingredientId: 'gin', amount: 30, unit: 'ml', brandId: 'brand-b'}],
  });
  const data = catalogue([sourceA, sourceB], [cocktail('drink', ['version-a', 'version-b'])]);
  data.brands = [
    {id: 'brand-a', name: 'A', ingredientIds: ['gin']},
    {id: 'brand-b', name: 'B', ingredientIds: ['gin']},
  ];
  const contextEvidence = [
    evidence('version-a', 'source-a', {
      occasions: [{value: 'meal', reason: 'bitter-dry'}],
      seasons: [{value: 'summer', reason: 'citrus-refreshing'}],
    }),
    evidence('version-b', 'wrong-source', {
      occasions: [{value: 'meal', reason: 'simple-build'}],
      seasons: [{value: 'summer', reason: 'long-refreshing'}],
    }),
    evidence('version-b', 'source-b', {
      occasions: [{value: 'meal', reason: 'rich-finish'}],
      seasons: [],
    }),
  ];
  const query: SearchQuery = {brandIds: ['brand-b']};
  const [result] = rankForContext(data, query, emptyTasteState(), {occasion: 'meal', season: 'summer'}, contextEvidence);
  assert.ok(result);
  assert.deepEqual(result.versionIds, ['version-b']);
  assert.equal(result.selectedVersionId, 'version-b');
  assert.equal(result.contextScore, 1);
  assert.deepEqual(result.contextReasons.map(({sourceId}) => sourceId), ['source-b']);
});

test('alcohol-free and exclusion constraints remain hard even when excluded drinks score higher', () => {
  const alcoholic = version('alcoholic-v', 'alcoholic', 'source-a', 'gin', {strength: 'strong'});
  const egg = version('egg-v', 'egg-drink', 'source-e', 'egg', {strength: 'none'});
  const safe = version('safe-v', 'safe', 'source-s', 'water', {strength: 'none'});
  const data = catalogue(
    [alcoholic, egg, safe],
    [
      cocktail('alcoholic', ['alcoholic-v']),
      cocktail('egg-drink', ['egg-v'], 'alcohol-free'),
      cocktail('safe', ['safe-v'], 'alcohol-free'),
    ],
  );
  const contextEvidence = [
    evidence('alcoholic-v', 'source-a', {
      occasions: [{value: 'celebration', reason: 'sparkling'}],
      seasons: [{value: 'summer', reason: 'citrus-refreshing'}],
    }),
    evidence('egg-v', 'source-e', {
      occasions: [{value: 'celebration', reason: 'rich-finish'}],
      seasons: [{value: 'summer', reason: 'floral-fruit'}],
    }),
    evidence('safe-v', 'source-s', {
      occasions: [{value: 'celebration', reason: 'long-refreshing'}],
      seasons: [],
    }),
  ];
  const query: SearchQuery = {strengths: ['none'], excluded: ['egg']};
  const results = rankForContext(data, query, emptyTasteState(), {occasion: 'celebration', season: 'summer'}, contextEvidence);
  assert.deepEqual(results.map(({cocktailId}) => cocktailId), ['safe']);
  assert.equal(results[0]!.contextScore, 1);
  assert.deepEqual(
    rankForContext(data, {...query, flavours: ['coffee']}, emptyTasteState(), {occasion: 'celebration'}, contextEvidence),
    [],
  );
});

test('unknown, malformed, and source-mismatched evidence cannot invent context reasons', () => {
  const build = version('build-v', 'build', 'source-build', 'gin', {
    servings: 8,
    ingredients: [
      {ingredientId: 'gin', amount: 30, unit: 'ml', brandId: 'brand-party'},
      {ingredientId: 'water', amount: 90, unit: 'ml'},
    ],
    mixingMethods: [{method: 'build', sourceId: 'source-build', stepIndexes: [0], reviewedAt: '2026-09-15'}],
  });
  const data = catalogue([build]);
  data.brands = [{id: 'brand-party', name: 'Party Brand', ingredientIds: ['gin']}];
  const invalidEvidence = [
    evidence('missing-version', 'source-build', {
      occasions: [{value: 'gathering', reason: 'simple-build'}],
      seasons: [],
    }),
    evidence('build-v', 'wrong-source', {
      occasions: [{value: 'gathering', reason: 'simple-build'}],
      seasons: [],
    }),
    evidence('build-v', 'source-build', {
      occasions: [{value: 'gathering', reason: 'unknown-reason' as never}],
      seasons: [],
    }),
    evidence('build-v', 'source-build', {
      occasions: [{value: 'gathering', reason: 'simple-build'}],
      seasons: [],
    }, {recipeDigest: 'not-a-digest'}),
    evidence('build-v', 'source-build', {
      occasions: [{value: 'gathering', reason: 'simple-build'}],
      seasons: [],
    }, {basis: undefined as never}),
  ];
  const [unproven] = rankForContext(data, {}, emptyTasteState(), {occasion: 'gathering'}, invalidEvidence);
  assert.ok(unproven);
  assert.equal(unproven.contextScore, 0);
  assert.deepEqual(unproven.contextReasons, []);

  const [reviewed] = rankForContext(data, {}, emptyTasteState(), {occasion: 'gathering'}, [
    evidence('build-v', 'source-build', {
      occasions: [{value: 'gathering', reason: 'simple-build'}],
      seasons: [],
    }),
  ]);
  assert.equal(reviewed?.contextScore, 1);
  assert.equal(reviewed?.contextReasons[0]?.code, 'simple-build');

  const duplicate = evidence('build-v', 'source-build', {
    occasions: [{value: 'gathering', reason: 'simple-build'}],
    seasons: [],
  });
  const [deduplicated] = rankForContext(
    data,
    {},
    emptyTasteState(),
    {occasion: 'gathering'},
    [duplicate, {...duplicate}],
  );
  assert.equal(deduplicated?.contextScore, 1);
  assert.equal(deduplicated?.contextReasons.length, 1);
});

test('diversity changes only equal-score order, balances base and primary flavour, and keeps a classic', () => {
  const versions = [
    version('gin-one-v', 'gin-one', 's1', 'gin', {flavours: ['citrus']}),
    version('gin-two-v', 'gin-two', 's2', 'gin', {flavours: ['citrus']}),
    version('classic-v', 'classic', 's3', 'gin', {flavours: ['citrus']}),
    version('rum-v', 'rum-drink', 's4', 'rum', {flavours: ['fruit']}),
    version('whiskey-v', 'whiskey-drink', 's5', 'whiskey', {flavours: ['spice']}),
    version('lower-v', 'lower', 's6', 'tequila', {flavours: ['floral']}),
  ];
  const data = catalogue(versions, [
    cocktail('gin-one', ['gin-one-v']),
    cocktail('gin-two', ['gin-two-v']),
    cocktail('classic', ['classic-v'], 'classic'),
    cocktail('rum-drink', ['rum-v']),
    cocktail('whiskey-drink', ['whiskey-v']),
    cocktail('lower', ['lower-v'], 'classic'),
  ]);
  const inputs: ContextResult[] = versions.map((item, index) => ({
    cocktailId: item.cocktailId,
    versionIds: [item.id],
    selectedVersionId: item.id,
    score: 0,
    reasons: [],
    memoryReasons: [],
    contextReasons: [],
    contextScore: index < 5 ? 2 : 1,
  }));
  const diversified = diversifyContextResults(data, inputs, 3);
  assert.equal(diversified.length, inputs.length);
  assert.deepEqual(diversified.slice(0, 3).map(({cocktailId}) => cocktailId), [
    'classic',
    'rum-drink',
    'whiskey-drink',
  ]);
  assert.ok(diversified.slice(0, 3).some(({cocktailId}) => cocktailId === 'classic'));
  assert.ok(diversified.slice(0, 5).every(({contextScore}) => contextScore === 2));
  assert.equal(diversified[5]?.contextScore, 1);
  assert.deepEqual(diversifyContextResults(data, inputs, 0), inputs);
});
