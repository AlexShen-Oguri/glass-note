import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DISCOVERY_FILTERED_INITIAL_LIMIT,
  DISCOVERY_UNFILTERED_INITIAL_LIMIT,
  discoveryQueryFingerprint,
  hasDiscoveryFilters,
  loadMoreDiscoveryPage,
  nextDiscoveryLimit,
  paginationForQuery,
} from './pagination';

test('starts the full collection at 24 and filtered results at 6', () => {
  assert.equal(paginationForQuery(undefined, {}, 'en').limit, DISCOVERY_UNFILTERED_INITIAL_LIMIT);
  assert.equal(paginationForQuery(undefined, {text: 'gin'}, 'en').limit, DISCOVERY_FILTERED_INITIAL_LIMIT);
  assert.equal(paginationForQuery(undefined, {collection: 'japan'}, 'en').limit, DISCOVERY_FILTERED_INITIAL_LIMIT);
});

test('restores count and scroll only for the exact query fingerprint', () => {
  const stored = {
    fingerprint: discoveryQueryFingerprint({flavours: ['fruit', 'citrus']}, 'en'),
    limit: 54,
    scrollY: 1320,
  };
  assert.equal(paginationForQuery(stored, {flavours: ['citrus', 'fruit']}, 'en'), stored);
  assert.deepEqual(paginationForQuery(stored, {flavours: ['citrus']}, 'en'), {
    fingerprint: discoveryQueryFingerprint({flavours: ['citrus']}, 'en'),
    limit: DISCOVERY_FILTERED_INITIAL_LIMIT,
    scrollY: 0,
  });
  assert.equal(paginationForQuery(stored, {flavours: ['fruit', 'citrus']}, 'zh').scrollY, 0);
});

test('fingerprints structured find filters as sets and treats the default ingredient mode alike', () => {
  const first = discoveryQueryFingerprint({
    ingredientIds: ['lemon-juice', 'gin', 'gin'],
    ingredientMode: 'all',
    excludedIngredientIds: ['egg-white', 'dairy-cream'],
    methods: ['stir', 'shake'],
  }, 'en');
  const reordered = discoveryQueryFingerprint({
    ingredientIds: ['gin', 'lemon-juice'],
    excludedIngredientIds: ['dairy-cream', 'egg-white'],
    methods: ['shake', 'stir'],
  }, 'en');

  assert.equal(first, reordered);
  assert.notEqual(
    discoveryQueryFingerprint({ingredientIds: ['gin'], ingredientMode: 'any'}, 'en'),
    discoveryQueryFingerprint({ingredientIds: ['gin']}, 'en'),
  );
  assert.equal(
    discoveryQueryFingerprint({ingredientMode: 'any'}, 'en'),
    discoveryQueryFingerprint({}, 'en'),
  );
});

test('counts only populated structured fields as discovery filters', () => {
  assert.equal(hasDiscoveryFilters({ingredientIds: ['gin']}), true);
  assert.equal(hasDiscoveryFilters({excludedIngredientIds: ['egg-white']}), true);
  assert.equal(hasDiscoveryFilters({methods: ['shake']}), true);
  assert.equal(hasDiscoveryFilters({ingredientIds: [], methods: [], ingredientMode: 'any'}), false);
});

test('loads bounded batches without passing the result count', () => {
  assert.equal(nextDiscoveryLimit(6, 252), 30);
  assert.equal(nextDiscoveryLimit(24, 252), 48);
  assert.equal(nextDiscoveryLimit(246, 252), 252);
});

test('keeps the latest scroll position when loading another batch', () => {
  const current = {
    fingerprint: discoveryQueryFingerprint({text: 'gin'}, 'en'),
    limit: 30,
    scrollY: 1840,
  };
  assert.deepEqual(loadMoreDiscoveryPage(current, 252), {...current, limit: 54});
});
