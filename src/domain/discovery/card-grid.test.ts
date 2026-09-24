import assert from 'node:assert/strict';
import test from 'node:test';
import {cardGrid} from './card-grid';

test('card columns follow available width at phone, tablet and desktop widths', () => {
  for (const [width, columns] of [[284, 1], [354, 1], [732, 2], [1244, 4], [1400, 5]]) {
    const grid = cardGrid(width!);
    assert.equal(grid.columns, columns);
    const occupied = grid.cardWidth * grid.columns + grid.gap * (grid.columns - 1);
    assert.ok(occupied <= width!);
    assert.ok(width! - occupied <= grid.columns + 1);
  }
});

test('a rounded layout width cannot wrap the final column onto another row', () => {
  const grid = cardGrid(1349);
  assert.equal(grid.columns, 5);
  assert.ok(grid.cardWidth * 5 + grid.gap * 4 <= 1348.5);
});

test('partial rows retain the same card width for 1, 2, 3, 5, 6, 7 and 11 results', () => {
  const {columns, cardWidth, gap} = cardGrid(1400);
  for (const count of [1, 2, 3, 5, 6, 7, 11]) {
    const tail = count % columns || columns;
    assert.ok(tail * cardWidth + (tail - 1) * gap <= 1400.001);
    if (tail < columns) assert.ok(tail * cardWidth + (tail - 1) * gap < 1400);
  }
});

test('grid handles unmeasured and smaller than minimum containers', () => {
  assert.equal(cardGrid(180).cardWidth, 180);
  for (const width of [0, -1, NaN, Infinity]) {
    assert.deepEqual(cardGrid(width), {columns: 1, cardWidth: 0, gap: 16});
  }
});
