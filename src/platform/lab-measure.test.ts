import assert from 'node:assert/strict';
import test from 'node:test';
import {
  commitLabAmount,
  convertLabAmountDraft,
  convertLabVolume,
  displayLabAmount,
  formatLabNumber,
  parseLabDecimal,
} from '../domain/lab/measure';
import {initialVersionSelection, reconcileVersionSelection} from '../features/workspace/lab/selection';

test('lab amount display converts numeric volume without mutating its source strings', () => {
  const source = {amount: '1.6666666666666665', unit: 'oz'};
  assert.deepEqual(displayLabAmount(source.amount, source.unit, 'oz'), {amount: '1.67', unit: 'oz', converted: false});
  assert.deepEqual(displayLabAmount(source.amount, source.unit, 'ml'), {amount: '49.29', unit: 'ml', converted: true});
  assert.deepEqual(source, {amount: '1.6666666666666665', unit: 'oz'});
});

test('text, ranges, empty amounts and other units stay verbatim', () => {
  for (const row of [
    {amount: 'to taste', unit: ''},
    {amount: '1–2', unit: 'dash'},
    {amount: '', unit: 'ml'},
    {amount: '2', unit: 'barspoon'},
  ]) assert.deepEqual(displayLabAmount(row.amount, row.unit, 'oz'), {...row, converted: false});
  assert.equal(parseLabDecimal('1e3'), 1000);
  assert.equal(parseLabDecimal('-1'), null);
  assert.equal(convertLabVolume(Number.POSITIVE_INFINITY, 'ml', 'oz'), null);
});

test('small finite quantities remain non-zero and formatting is bounded', () => {
  assert.equal(displayLabAmount('0.001', 'ml', 'oz').amount, '0.0000338');
  assert.equal(formatLabNumber(0.0000001), '0.0000001');
  assert.equal(formatLabNumber(0.0000000000001), '0.0000000000001');
  assert.equal(formatLabNumber(Number.NaN), null);
  assert.equal(formatLabNumber(-0.5), null);
});

test('no edit returns exact storage and a preferred-unit view never implies an edit', () => {
  assert.deepEqual(commitLabAmount({
    sourceAmount: '1.6666666666666665', sourceUnit: 'oz', editorAmount: '49.29', editorUnit: 'ml',
    amountEdited: false, unitEdited: false,
  }), {amount: '1.6666666666666665', unit: 'oz'});
});

test('unit-only commits convert once from exact storage while typed edits use the chosen unit', () => {
  assert.deepEqual(commitLabAmount({
    sourceAmount: '1.6666666666666665', sourceUnit: 'oz', editorAmount: '49.29', editorUnit: 'ml',
    amountEdited: false, unitEdited: true,
  }), {amount: '49.2892159375', unit: 'ml'});
  assert.deepEqual(commitLabAmount({
    sourceAmount: '30', sourceUnit: 'ml', editorAmount: '1.25', editorUnit: 'oz',
    amountEdited: true, unitEdited: true,
  }), {amount: '1.25', unit: 'oz'});
});

test('typed numeric precision remains verbatim and tiny unit conversions never become zero', () => {
  assert.deepEqual(commitLabAmount({
    sourceAmount: '30', sourceUnit: 'ml', editorAmount: ' 1.234500 ', editorUnit: 'oz',
    amountEdited: true, unitEdited: true,
  }), {amount: '1.234500', unit: 'oz'});
  const tiny = commitLabAmount({
    sourceAmount: '0.0000000000001', sourceUnit: 'ml', editorAmount: '', editorUnit: 'oz',
    amountEdited: false, unitEdited: true,
  });
  assert.notEqual(Number(tiny.amount), 0);
  assert.equal(tiny.unit, 'oz');
});

test('explicit volume toggles retain precise numeric meaning across a round trip', () => {
  const millilitres = commitLabAmount({
    sourceAmount: '1.234500', sourceUnit: 'oz', editorAmount: '', editorUnit: 'ml',
    amountEdited: false, unitEdited: true,
  });
  const ounces = commitLabAmount({
    sourceAmount: millilitres.amount, sourceUnit: millilitres.unit, editorAmount: '', editorUnit: 'oz',
    amountEdited: false, unitEdited: true,
  });
  assert.ok(Math.abs(Number(ounces.amount) - 1.2345) < 1e-12);
});

test('a typed precise draft keeps a separate clean display and precise unit-toggle commit', () => {
  const toggled = convertLabAmountDraft('1.234500', 'oz', 'ml');
  assert.deepEqual(toggled, {
    editorAmount: '36.5',
    commitAmount: '36.5085222449062',
    unit: 'ml',
  });
  const committed = commitLabAmount({
    sourceAmount: '30', sourceUnit: 'ml', editorAmount: toggled!.commitAmount, editorUnit: toggled!.unit,
    amountEdited: true, unitEdited: true,
  });
  assert.deepEqual(committed, {amount: '36.5085222449062', unit: 'ml'});
});

test('typing the displayed source number after a unit shortcut remains an amount edit', () => {
  const committed = commitLabAmount({
    sourceAmount: '30', sourceUnit: 'ml', editorAmount: '30', editorUnit: 'oz',
    amountEdited: true, unitEdited: true,
  });
  assert.deepEqual(committed, {amount: '30', unit: 'oz'});
});

test('free-form unit edits retain the visible amount while shortcut-only edits convert it', () => {
  assert.deepEqual(commitLabAmount({
    sourceAmount: '30', sourceUnit: 'ml', editorAmount: '30', editorUnit: 'g',
    amountEdited: true, unitEdited: true,
  }), {amount: '30', unit: 'g'});
  assert.deepEqual(commitLabAmount({
    sourceAmount: '30', sourceUnit: 'ml', editorAmount: '1.01', editorUnit: 'oz',
    amountEdited: false, unitEdited: true,
  }), {amount: '1.01442068105529', unit: 'oz'});
});

test('comparison defaults to three and keeps stable choices across additions and deletions', () => {
  assert.deepEqual(initialVersionSelection(['a', 'b', 'c', 'd']), ['a', 'b', 'c']);
  assert.deepEqual(reconcileVersionSelection(['a', 'b', 'c'], ['a', 'b', 'c', 'd']), ['a', 'b', 'c']);
  assert.deepEqual(reconcileVersionSelection(['a', 'b', 'c'], ['a', 'c', 'd']), ['a', 'c', 'd']);
  assert.deepEqual(reconcileVersionSelection(['a', 'b'], ['a', 'b', 'c']), ['a', 'b']);
});

test('actual edits retain editorial text and ranges instead of coercing them', () => {
  assert.deepEqual(commitLabAmount({
    sourceAmount: '30', sourceUnit: 'ml', editorAmount: ' to taste ', editorUnit: '',
    amountEdited: true, unitEdited: true,
  }), {amount: 'to taste', unit: ''});
  assert.deepEqual(commitLabAmount({
    sourceAmount: '1', sourceUnit: 'oz', editorAmount: '1–2', editorUnit: 'dash',
    amountEdited: true, unitEdited: true,
  }), {amount: '1–2', unit: 'dash'});
});
