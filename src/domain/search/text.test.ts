/// <reference types="node" />

import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import test from 'node:test';

import {normalizeSearchText, scoreTextSearch, TEXT_SEARCH_SCORE} from './text';

test('keeps score bands ordered across direct, pinyin, homophone and typo matches', () => {
  const exact = scoreTextSearch('Mojito', ['Mojito']);
  const prefix = scoreTextSearch('Moji', ['Mojito cocktail']);
  const substring = scoreTextSearch('jito', ['Mojito cocktail']);
  const pinyin = scoreTextSearch('neigeluoni', ['内格罗尼']);
  const homophone = scoreTextSearch('马提尼', ['干马天尼']);
  const typo = scoreTextSearch('mojto', ['Mojito']);

  assert.deepEqual(
    {exact, prefix, substring, pinyin, homophone, typo},
    TEXT_SEARCH_SCORE,
  );
});

test('supports adjacent transpositions, accents and Japanese kana', () => {
  assert.equal(scoreTextSearch('Negrnoi', ['Negroni']), TEXT_SEARCH_SCORE.typo);
  assert.equal(scoreTextSearch('creme brulee', ['Crème brûlée']), TEXT_SEARCH_SCORE.exact);
  assert.equal(scoreTextSearch('ネグローニ', ['ネグローニ']), TEXT_SEARCH_SCORE.exact);
  assert.equal(normalizeSearchText('  モヒート・クラシック  '), 'モヒート クラシック');
});

test('requires every query word while allowing words to match separate fields', () => {
  assert.ok(scoreTextSearch('Acme lime', ['Acme', 'Fresh lime juice']) > 0);
  assert.equal(scoreTextSearch('Acme lemon', ['Acme', 'Fresh lime juice']), 0);
  assert.ok(scoreTextSearch('dry martni', ['Dry', 'Martini']) > 0);
});

test('does not fuzzy-match ambiguous short queries and always returns a finite score', () => {
  assert.equal(scoreTextSearch('gni', ['gin']), 0);
  assert.equal(scoreTextSearch('码', ['马天尼']), 0);
  assert.equal(scoreTextSearch('马提尼', ['玛丽皮克福德']), 0);
  assert.equal(scoreTextSearch('', ['anything']), 0);
  assert.equal(scoreTextSearch('\ud800', ['Mojito']), 0);
  assert.equal(scoreTextSearch('Mojito', [null as unknown as string]), 0);
  assert.ok(Number.isFinite(scoreTextSearch('mojto', ['Mojito'])));
});

test('handles catalogue-scale local scoring within a generous interaction budget', () => {
  const bottleFields = Array.from({length: 600}, (_, index) => [
    `Bottle ${index} Negroni`,
    `第${index}号内格罗尼`,
  ]);
  const ingredientFields = Array.from({length: 1266}, (_, index) => [
    `Ingredient ${index} lime`,
    `第${index}号青柠材料`,
  ]);
  const started = performance.now();
  let total = 0;
  for (const fields of [...bottleFields, ...ingredientFields]) {
    total += scoreTextSearch('negrnoi', fields);
  }
  const elapsed = performance.now() - started;

  assert.ok(total > 0);
  assert.ok(elapsed < 2000, `catalogue-scale scoring took ${elapsed.toFixed(1)}ms`);
});
