import assert from 'node:assert/strict';
import test from 'node:test';

import {revealLayout, type RevealLayout} from './reveal-layout';

const EDGE = 16;
const GAP = 12;

function assertFiniteLayout(layout: RevealLayout): void {
  for (const value of [layout.width, layout.height, layout.cardWidth, layout.cardHeight]) assert.equal(Number.isFinite(value), true);
  if (layout.slots.length > 0) assert.equal(layout.cardHeight, layout.cardWidth * 3 / 4);
  for (const slot of layout.slots) {
    for (const value of [slot.x, slot.y, slot.fromX, slot.fromY]) assert.equal(Number.isFinite(value), true);
    assert.ok(slot.x >= EDGE, `x ${slot.x} is outside the horizontal margin`);
    assert.ok(slot.x + layout.cardWidth <= layout.width - EDGE, `right ${slot.x + layout.cardWidth} is outside the horizontal margin`);
    assert.ok(slot.y >= EDGE, `y ${slot.y} is outside the vertical margin`);
    assert.ok(slot.y + layout.cardHeight <= layout.height - EDGE, `bottom ${slot.y + layout.cardHeight} is outside the vertical margin`);
    assert.ok(slot.fromX + layout.cardWidth > 0 && slot.fromX < layout.width, 'entry point must leave part of the card visible horizontally');
    assert.ok(slot.fromY + layout.cardHeight > 0 && slot.fromY < layout.height, 'entry point must leave part of the card visible vertically');
  }
  for (let first = 0; first < layout.slots.length; first += 1) {
    for (let second = first + 1; second < layout.slots.length; second += 1) {
      const a = layout.slots[first]!;
      const b = layout.slots[second]!;
      const separated = a.x + layout.cardWidth <= b.x || b.x + layout.cardWidth <= a.x || a.y + layout.cardHeight <= b.y || b.y + layout.cardHeight <= a.y;
      assert.equal(separated, true, `slots ${first} and ${second} overlap`);
    }
  }
}

function assertGrid(layout: RevealLayout, inputWidth: number, count: number): void {
  const columns = count === 1 ? 1 : inputWidth >= 700 ? Math.min(3, count) : Math.min(2, count);
  for (let row = 0; row < Math.ceil(count / columns); row += 1) {
    const start = row * columns;
    const cardsInRow = Math.min(columns, count - start);
    const rowSlots = layout.slots.slice(start, start + cardsInRow);
    assert.ok(rowSlots.length > 0);
    assert.ok(rowSlots.every(slot => slot.y === rowSlots[0]!.y));
    for (let index = 1; index < rowSlots.length; index += 1) {
      assert.equal(rowSlots[index]!.x - rowSlots[index - 1]!.x, layout.cardWidth + GAP);
    }
    const rowWidth = cardsInRow * layout.cardWidth + (cardsInRow - 1) * GAP;
    assert.equal(rowSlots[0]!.x, (layout.width - rowWidth) / 2);
  }
  for (let row = 1; row < Math.ceil(count / columns); row += 1) {
    assert.equal(layout.slots[row * columns]!.y - layout.slots[(row - 1) * columns]!.y, layout.cardHeight + GAP);
  }
}

test('empty and excessive counts are safe and capped at six', () => {
  const empty = revealLayout(320, 360, 0);
  assert.deepEqual(empty.slots, []);
  assert.equal(empty.cardWidth, 0);
  assert.equal(empty.cardHeight, 0);
  const capped = revealLayout(320, 360, 99);
  assert.equal(capped.slots.length, 6);
  assertFiniteLayout(capped);
});

test('mobile and desktop rows stay centered with the requested columns and gaps', () => {
  for (const width of [320, 390, 768, 1400]) {
    for (const count of [1, 2, 3, 4, 5, 6]) {
      const layout = revealLayout(width, 560, count);
      assert.equal(layout.slots.length, count);
      assertFiniteLayout(layout);
      assertGrid(layout, width, count);
      assert.ok(layout.cardWidth <= 150);
      assert.ok(layout.cardHeight <= 150);
    }
  }
});

test('four and five cards keep one shared width and center their incomplete last row', () => {
  for (const width of [320, 768]) {
    for (const count of [4, 5]) {
      const layout = revealLayout(width, 560, count);
      assertGrid(layout, width, count);
      const columns = width >= 700 ? 3 : 2;
      const fullRow = layout.slots.slice(0, columns);
      const lastStart = Math.floor((count - 1) / columns) * columns;
      const lastRow = layout.slots.slice(lastStart);
      assert.equal(lastRow.length, count - lastStart);
      assert.ok(lastRow.every(slot => slot.x >= EDGE));
      assert.ok(layout.slots.every(slot => slot.x + layout.cardWidth <= layout.width - EDGE));
      assert.equal(fullRow.every(slot => slot.x + layout.cardWidth <= layout.width - EDGE), true);
      const lastRowWidth = lastRow.length * layout.cardWidth + (lastRow.length - 1) * GAP;
      assert.equal(lastRow[0]!.x, (layout.width - lastRowWidth) / 2);
    }
  }
});

test('six cards fit the short 360px mobile reveal without covering the footer', () => {
  const layout = revealLayout(320, 360, 6);
  assert.equal(layout.cardWidth, 76);
  assert.equal(layout.cardHeight, 57);
  assert.equal(layout.slots[0]!.y, 140.5);
  assert.equal(layout.slots[3]!.y, 209.5);
  assertFiniteLayout(layout);
});

test('short heights shrink safely while preserving deterministic absolute geometry', () => {
  for (const height of [64, 120, 180, 240, 360]) {
    const first = revealLayout(390, height, 6);
    const second = revealLayout(390, height, 6);
    assert.deepEqual(first, second);
    assertFiniteLayout(first);
  }
});

test('every supported count keeps a complete 4:3 tile across short viewport boundaries', () => {
  for (const height of [64, 120, 180, 240, 360]) {
    for (const count of [1, 2, 3, 4, 5, 6]) {
      const layout = revealLayout(320, height, count);
      assert.equal(layout.slots.length, count);
      assertFiniteLayout(layout);
    }
  }
});

test('the smallest supported viewport keeps six final cards safe even when tiles degenerate', () => {
  const layout = revealLayout(64, 64, 6);
  assert.equal(layout.width, 64);
  assert.equal(layout.height, 64);
  assert.equal(layout.slots.length, 6);
  assert.equal(layout.cardWidth, 1);
  assert.equal(layout.cardHeight, 0.75);
  assertFiniteLayout(layout);
});

test('a single card is centered and entries are staggered around the edges', () => {
  const layout = revealLayout(768, 560, 1);
  const slot = layout.slots[0]!;
  assert.equal(slot.x, (layout.width - layout.cardWidth) / 2);
  assert.equal(slot.y, 140 + ((layout.height - 24 - 140 - layout.cardHeight) / 2));
  const six = revealLayout(768, 560, 6);
  assert.equal(new Set(six.slots.map(item => `${item.fromX}:${item.fromY}`)).size, 6);
});

test('invalid dimensions fall back without NaN or unsafe slots', () => {
  const layout = revealLayout(Number.NaN, Number.POSITIVE_INFINITY, Number.NaN);
  assert.equal(layout.width, 320);
  assert.equal(layout.height, 360);
  assertFiniteLayout(layout);
  const negative = revealLayout(-10, 0, 3);
  assertFiniteLayout(negative);
});
