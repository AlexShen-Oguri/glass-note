/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';

import {LOCALES} from '../domain/contracts';
import {
  localeFromDeviceLanguages,
  parseStoredPreferences,
  resolvePreferences,
  serializePreferences,
  validateStoredPreferences,
} from './preferences';

test('accepts all eight supported saved locales and lets a valid saved locale win', () => {
  for (const locale of LOCALES) {
    assert.equal(resolvePreferences(JSON.stringify({locale}), ['fr-CA']).locale, locale);
  }
});

test('maps regional device languages, including Chinese variants, and defaults to English', () => {
  assert.equal(localeFromDeviceLanguages(['zh-Hant-TW']), 'zh');
  assert.equal(localeFromDeviceLanguages(['ZH_hans_cn']), 'zh');
  assert.equal(localeFromDeviceLanguages(['pt-BR', 'fr-CA']), 'fr');
  assert.equal(localeFromDeviceLanguages(['pt-BR']), 'en');
  assert.equal(localeFromDeviceLanguages([]), 'en');
});

test('ignores corrupt and invalid stored fields without throwing', () => {
  assert.deepEqual(parseStoredPreferences('{bad json'), {});
  assert.deepEqual(
    resolvePreferences(
      JSON.stringify({locale: 'pt', unit: 'litres', motionPaused: 'yes'}),
      ['de-DE'],
    ),
    {locale: 'de', unit: 'ml', motionPaused: false},
  );
});

test('parses and serializes valid unit and motion preferences', () => {
  const expected = {locale: 'it' as const, unit: 'oz' as const, motionPaused: true};
  assert.deepEqual(parseStoredPreferences(serializePreferences(expected)), expected);
});

test('write-back validation rejects invalid saved fields while allowing legacy partial preferences', () => {
  for (const raw of ['{"locale":"pt"}', '{"unit":"litres"}', '{"motionPaused":"yes"}',
    '{"locale":null}', '[]', '{}garbage', '{"future":true}']) {
    assert.throws(() => validateStoredPreferences(raw));
  }
  for (const raw of [null, '{}', '{"locale":"zh"}', '{"unit":"oz","motionPaused":false}']) {
    assert.doesNotThrow(() => validateStoredPreferences(raw));
  }
});
