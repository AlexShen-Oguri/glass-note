import assert from 'node:assert/strict';
import test from 'node:test';

import {LOCALES} from '../domain/contracts';
import {discoveryText, discoveryResultCount, type DiscoveryKey} from './discovery';

test('provides the discovery controls in all eight locales', () => {
  const keys: DiscoveryKey[] = [
    'collectionTitle',
    'filters',
    'ingredientLibrary',
    'collections',
    'showCollections',
    'hideCollections',
    'loadMore',
    'filterTitle',
    'filterHint',
    'showOptions',
    'hideOptions',
    'preparation',
    'selected',
  ];
  assert.equal(LOCALES.length, 8);
  for (const locale of LOCALES) {
    for (const key of keys) assert.ok(discoveryText(locale, key).trim(), `${locale}.${key}`);
    assert.match(discoveryResultCount(locale, 24, 252), /24/);
    assert.match(discoveryResultCount(locale, 24, 252), /252/);
  }
});
