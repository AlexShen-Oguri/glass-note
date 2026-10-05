import assert from 'node:assert/strict';
import test from 'node:test';
import {resultsLayout} from './results-layout';

test('wide recommendations compose all supported counts deliberately, including six as 3 by 2', () => {
  const expected = [[1], [2], [3], [2, 2], [3, 2], [3, 3]];
  for (const width of [1470, 2000]) {
    for (let count = 1; count <= 6; count++) {
      const layout = resultsLayout(width, count);
      assert.deepEqual(layout.rows.map(row => row.length), expected[count - 1]);
      assert.equal(layout.width, 1260);
      assert.ok(layout.columns <= 3);
      assert.equal(layout.hero, count === 1);
      if (count === 1) assert.equal(layout.cardWidth, 1260);
    }
  }
});

test('rows keep exact ranked indices and fit the measured container at mobile and desktop widths', () => {
  for (const width of [320, 390, 699, 700, 820, 1260, 2000]) {
    for (const count of [1, 2, 3, 4, 5, 6, 7, 12, 29]) {
      const layout = resultsLayout(width, count);
      assert.deepEqual(layout.rows.flat().map(slot => slot.index), Array.from({length: count}, (_, index) => index));
      for (const row of layout.rows) {
        const rowWidth = row.length * layout.cardWidth + (row.length - 1) * layout.gap;
        assert.ok(rowWidth <= layout.width + 0.001);
        assert.ok((layout.width - rowWidth) / 2 >= -0.001, 'incomplete rows can be centered without overflow');
      }
      assert.equal(layout.columns, count === 1 ? 1 : width < 700 ? 2 : count === 2 || count === 4 ? 2 : 3);
      assert.ok(Number.isFinite(layout.cardWidth));
      assert.ok(layout.photoHeight >= 175);
    }
  }
});

test('count changes replace the composition instead of retaining a width-only five column grid', () => {
  assert.deepEqual(resultsLayout(1400, 6).rows.map(row => row.length), [3, 3]);
  assert.deepEqual(resultsLayout(1400, 5).rows.map(row => row.length), [3, 2]);
  assert.deepEqual(resultsLayout(1400, 4).rows.map(row => row.length), [2, 2]);
  assert.deepEqual(resultsLayout(390, 6).rows.map(row => row.length), [2, 2, 2]);
  assert.equal(resultsLayout(390, 1).cardWidth, 390);
});

test('empty and invalid inputs are safe without losing valid fractional-width geometry', () => {
  assert.deepEqual(resultsLayout(390, 0).rows, []);
  assert.equal(resultsLayout(390, 0).cardWidth, 0);
  assert.deepEqual(resultsLayout(Number.NaN, Number.NaN).rows, []);
  assert.equal(resultsLayout(Number.POSITIVE_INFINITY, 3).width, 320);
  const tiny=resultsLayout(-10,3);
  assert.ok(tiny.cardWidth*2+tiny.gap<=tiny.width);
  assert.ok(tiny.cardWidth>0);
  assert.equal(resultsLayout(1037.5, 3).cardWidth * 3 + 54, 1037.5);
});
