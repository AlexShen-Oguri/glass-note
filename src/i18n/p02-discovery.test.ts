import assert from 'node:assert/strict';
import test from 'node:test';

import {LOCALES} from '../domain/contracts';
import {p02DiscoveryText, p02ResultCount, type P02DiscoveryKey} from './p02-discovery';

test('provides the P02 discovery controls in all eight locales', () => {
  const keys: P02DiscoveryKey[] = [
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
    for (const key of keys) assert.ok(p02DiscoveryText(locale, key).trim(), `${locale}.${key}`);
    assert.match(p02ResultCount(locale, 24, 252), /24/);
    assert.match(p02ResultCount(locale, 24, 252), /252/);
  }
});
