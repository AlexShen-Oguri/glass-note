import assert from 'node:assert/strict';
import test from 'node:test';

import {catalogue} from './catalogue';
import {recipePreparations} from './preparations';
import {getRecipePreparation, needsPreparationReview, preparationStatus} from '../domain/preparations';
import {LOCALES, type Localized} from '../domain/contracts';
import {preparationCopy} from '../i18n/preparations';

function assertLocalized(value: Localized, context: string) {
  for (const locale of LOCALES) assert.ok(value[locale].trim(), `${context}.${locale}`);
}

test('preparation registry contains distinct, real catalogue version IDs', () => {
  assert.ok(recipePreparations.length >= 15);
  assert.equal(new Set(recipePreparations.map(record => record.versionId)).size, recipePreparations.length);
  const versionIds = new Set(catalogue.versions.map(version => version.id));
  for (const record of recipePreparations) assert.ok(versionIds.has(record.versionId), record.versionId);
  const cardIds = recipePreparations.flatMap(record => record.cards.map(card => card.id));
  assert.equal(new Set(cardIds).size, cardIds.length);
});

test('Houmei preserves the official tea soda inputs and five disclosed steps', () => {
  const record = getRecipePreparation('houmei-batch-h')!;
  assert.equal(record.status, 'disclosed');
  assert.equal(record.cards.length, 1);
  assert.equal(record.cards[0]?.ingredientId, 'world-tea-soda');
  assert.equal(record.cards[0]?.inputs.length, 10);
  assert.equal(record.cards[0]?.steps.length, 5);
  assert.match(record.cards[0]?.inputs[0]?.en ?? '', /6 g Assam/);
  assert.match(record.cards[0]?.steps[1]?.en ?? '', /5 minutes/);
});

test('process inputs stay separate from ingredients poured into the glass', () => {
  const record = getRecipePreparation('brown-butter-old-fashioned-batch-i')!;
  const wash = record.cards.find(card => card.id === 'brown-butter-wash')!;
  assert.equal(wash.role, 'process');
  assert.equal(wash.ingredientId, 'brown-butter-washed-bourbon');
  assert.deepEqual(wash.inputs.map(input => input.en), ['1/2 cup unsalted butter', '750 ml Benchmark bourbon, or another bourbon']);
  assert.ok(!catalogue.versions.find(version => version.id === record.versionId)?.ingredients.some(row => row.ingredientId === 'food-unsalted-butter'));
});

test('Pearl Diver keeps the nested cinnamon syrup method under its exact version', () => {
  const record = getRecipePreparation('pearl-diver-batch-f')!;
  assert.equal(record.status, 'disclosed');
  assert.deepEqual(record.cards.map(card => card.id), ['pearl-diver-gardenia', 'pearl-diver-cinnamon-syrup']);
  assert.equal(record.cards[1]?.inputs.length, 3);
  assert.match(record.cards[1]?.steps[1]?.en ?? '', /20 minutes/);
});

test('named but undisclosed competition preparations remain explicit gaps', () => {
  const record = getRecipePreparation('musubi-batch-h')!;
  assert.equal(record.status, 'partial');
  assert.deepEqual(record.cards.map(card => card.status), ['undisclosed','undisclosed','undisclosed']);
  assert.ok(record.gaps.length > 0);
  assert.ok(record.cards.every(card => card.gaps.length > 0 && card.steps.length === 0));
});

test('status differentiates disclosed, incomplete, and unreviewed versions', () => {
  assert.equal(preparationStatus('houmei-batch-h'), 'disclosed');
  assert.equal(preparationStatus('shiki-batch-h'), 'partial');
  assert.equal(preparationStatus('old-fashioned-iba'), 'unreviewed');
  assert.equal(needsPreparationReview('houmei-batch-h'), false);
  assert.equal(needsPreparationReview('shiki-batch-h'), true);
  assert.equal(needsPreparationReview('old-fashioned-iba'), false);
});

test('all displayed preparation copy has eight non-empty locale values', () => {
  for (const record of recipePreparations) {
    assertLocalized(record.summary, `${record.versionId}.summary`);
    record.gaps.forEach((gap, index) => assertLocalized(gap, `${record.versionId}.gaps.${index}`));
    for (const card of record.cards) {
      assertLocalized(card.title, `${card.id}.title`);
      card.inputs.forEach((input, index) => assertLocalized(input, `${card.id}.inputs.${index}`));
      card.steps.forEach((step, index) => assertLocalized(step, `${card.id}.steps.${index}`));
      card.gaps.forEach((gap, index) => assertLocalized(gap, `${card.id}.gaps.${index}`));
      for (const optional of [card.equipment, card.timing, card.temperature, card.yield]) {
        if (optional) assertLocalized(optional, `${card.id}.optional`);
      }
      assert.ok(card.sources.length > 0, `${card.id}.sources`);
    }
  }
  const englishKeys = Object.keys(preparationCopy('en'));
  for (const locale of LOCALES) {
    const copy = preparationCopy(locale);
    assert.deepEqual(Object.keys(copy), englishKeys, `UI keys for ${locale}`);
    for (const key of englishKeys) assert.ok(copy[key as keyof typeof copy].trim(), `${locale}.${key}`);
  }
});
