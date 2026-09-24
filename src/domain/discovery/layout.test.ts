import assert from 'node:assert/strict';
import test from 'node:test';

import {createDiscoveryRows, getDiscoveryColumnCount} from './layout';

test('keeps the intended column count at responsive boundaries', () => {
  assert.equal(getDiscoveryColumnCount(390), 2);
  assert.equal(getDiscoveryColumnCount(739), 2);
  assert.equal(getDiscoveryColumnCount(740), 3);
  assert.equal(getDiscoveryColumnCount(1119), 3);
  assert.equal(getDiscoveryColumnCount(1120), 4);
});

test('packs complete rows until one natural incomplete final row', () => {
  const items = Array.from({length: 10}, (_, index) => index);
  assert.deepEqual(createDiscoveryRows(items, 3), [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [9],
  ]);
});

test('preserves every item exactly once for each supported layout', () => {
  const items = Array.from({length: 160}, (_, index) => `cocktail-${index}`);
  for (const columns of [2, 3, 4] as const) {
    const rows = createDiscoveryRows(items, columns);
    assert.deepEqual(rows.flat(), items);
    assert.ok(rows.slice(0, -1).every((row) => row.length === columns));
    assert.ok((rows.at(-1)?.length ?? 0) <= columns);
  }
});
