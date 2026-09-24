/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';
import {LOCALES} from '../domain/contracts';
import {favoriteListCopy, favoriteListText} from './favorite-lists';

test('private-list copy has real values in every supported locale', () => {
  for (const locale of LOCALES) {
    const values = favoriteListCopy(locale);
    for (const [key, value] of Object.entries(values)) {
      assert.equal(typeof value, 'string', `${locale}.${key}`);
      assert.ok(value.trim().length > 0, `${locale}.${key}`);
    }
    assert.notEqual(favoriteListText(locale, 'defaultListName').trim(), '');
    assert.notEqual(favoriteListText(locale, 'addVersionHint').trim(), '');
  }
});

test('private-list copy replaces explicit count placeholders only', () => {
  assert.equal(favoriteListText('en', 'listCount'), 'lists');
  assert.equal(favoriteListText('en', 'listIntro', {count: 3}), 'Keep exact source versions together for a night, a menu, or the next drink.');
});
