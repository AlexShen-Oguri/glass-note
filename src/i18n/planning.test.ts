import assert from 'node:assert/strict';
import test from 'node:test';
import {LOCALES} from '../domain/contracts';
import {pantryText, type PantryKey} from './pantry';

const english = {
  plannerGoalCoverage: 'Unlock more',
  plannerGoalTaste: 'Better my taste',
  plannerRecipeFilters: 'Recipe filters',
  plannerFilterCount: '{count} active',
  plannerResetFilters: 'Clear recipe filters',
  plannerTasteLoading: 'Loading taste memory. Showing plans that unlock more drinks.',
  plannerTasteCold: 'Save a drink rating to personalize your plans. Showing plans that unlock more drinks.',
  plannerTasteReadError: 'Taste memory could not be read. Showing plans that unlock more drinks. Retry to load your saved feedback.',
  plannerTasteUnavailable: 'Taste-based planning is unavailable. Showing plans that unlock more drinks.',
  plannerTasteWriteError: 'Using your last saved feedback. Retry to save your changes.',
  plannerTasteRetry: 'Retry',
  plannerTasteRetrying: 'Retrying…',
  plannerTasteMatch: 'Likely your taste',
} as const satisfies Partial<Record<PantryKey, string>>;
const keys = Object.keys(english) as (keyof typeof english)[];

test('planning copy names both goals and explains every recoverable taste state', () => {
  for (const key of keys) {
    let actual = '';
    assert.doesNotThrow(() => {actual = pantryText('en', key);}, `${key} needs planning copy`);
    assert.equal(actual, english[key]);
  }
  assert.equal(pantryText('zh', 'plannerGoalCoverage'), '解锁更多');
  assert.equal(pantryText('zh', 'plannerGoalTaste'), '更合口味');
  assert.equal(pantryText('zh', 'plannerRecipeFilters'), '配方条件');
  assert.equal(pantryText('zh', 'plannerTasteMatch'), '可能合口味');
});

for (const locale of LOCALES) {
  test(`planning controls and fallback notices are localized in ${locale}`, () => {
    for (const key of keys) {
      let result = '';
      assert.doesNotThrow(() => {result = pantryText(locale, key, {count: 3});}, `${locale}.${key} needs usable copy`);
      assert.ok(result.trim(), `${locale}.${key} is empty`);
      assert.doesNotMatch(result, /\{[^}]+\}/, `${locale}.${key} leaves an unresolved slot`);
      assert.doesNotMatch(result, /[0-9]+(?:[.,][0-9]+)?\s*%/, `${locale}.${key} promises a probability`);
      if (locale !== 'en') assert.notEqual(result, pantryText('en', key, {count: 3}), `${locale}.${key} falls back to English`);
    }
    for (const count of [0, 1, 12]) {
      assert.ok(pantryText(locale, 'plannerFilterCount', {count}).includes(String(count)));
    }
  });
}
