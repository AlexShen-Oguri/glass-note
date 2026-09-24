import assert from 'node:assert/strict';
import test from 'node:test';
import {LOCALES} from '../../domain/contracts';
import {researchTopics} from '../topics';
import {getResearchWorkView, researchWorkLocalization} from './research';

const roundTwelveRows = researchTopics
  .filter(topic => topic.id.startsWith('patron-perfectionists-') || topic.id.startsWith('world-class-us-2024-') || topic.id === 'bacardi-legacy-2019-japan')
  .flatMap(topic => topic.research ?? []);

const row = (id: string) => roundTwelveRows.find(work => work.id === id)!;
const values = (value: string) => value.replace(/[～~]/g, '–');
const numbers = (value: string) => value.match(/\d+(?:\.\d+)?/g) ?? [];
const units = (value: string) => value.match(/(?<![A-Za-z])(?:1:4|ml|oz|lb|tbsp|tsp|L|g)(?![A-Za-z])/g) ?? [];

test('the language overlay covers exactly the 24 round-eleven and Bacardí research rows', () => {
  assert.equal(roundTwelveRows.length, 24);
  assert.deepEqual(new Set(Object.keys(researchWorkLocalization)), new Set(roundTwelveRows.map(work => work.id)));
  for (const work of roundTwelveRows) {
    for (const locale of LOCALES) {
      const view = getResearchWorkView(work, locale);
      assert.ok(view.region, `${work.id} region missing in ${locale}`);
      assert.ok(view.stage, `${work.id} stage missing in ${locale}`);
      assert.ok(view.summary, `${work.id} summary missing in ${locale}`);
      assert.ok(view.missingDetails?.length, `${work.id} source gap missing in ${locale}`);
    }
  }
});

test('all four published recipes translate their facts and retain every number and unit dimension', () => {
  const published = roundTwelveRows.filter(work => work.disclosure === 'published-recipe');
  assert.equal(published.length, 4);
  for (const work of published) {
    assert.ok(work.method?.length);
    for (const locale of LOCALES) {
      const view = getResearchWorkView(work, locale);
      assert.equal(view.materials.length, work.materials.length);
      assert.equal(view.method?.length, work.method?.length);
      if (locale !== 'en') assert.notEqual(view.summary, getResearchWorkView(work, 'en').summary, `${work.id} summary copied English in ${locale}`);
      for (const [index, source] of work.materials.entries()) {
        const sourceAmount = 'name' in source ? source.amount : undefined;
        const translatedAmount = view.materials[index]?.amount;
        if (sourceAmount !== undefined) {
          assert.ok(translatedAmount, `${work.id} amount ${index} missing in ${locale}`);
          assert.deepEqual(numbers(translatedAmount!), numbers(sourceAmount), `${work.id} amount numbers changed in ${locale}`);
          assert.deepEqual(units(translatedAmount!), units(sourceAmount), `${work.id} amount dimensions changed in ${locale}`);
        }
      }
      for (let prepIndex = 0; prepIndex < (work.preparations ?? []).length; prepIndex += 1) {
        const sourcePrep = work.preparations![prepIndex]!;
        const prep = view.preparations?.[prepIndex];
        assert.ok(prep);
        assert.equal(prep?.ingredients.length, sourcePrep.ingredients.length);
        assert.equal(prep?.method.length, sourcePrep.method.length);
        for (const [ingredientIndex, sourceIngredient] of sourcePrep.ingredients.entries()) {
          const sourceAmount = sourceIngredient.amount;
          const translatedAmount: string | undefined = prep?.ingredients[ingredientIndex]?.amount;
          if (sourceAmount !== undefined) {
            assert.ok(translatedAmount, `${work.id}/${sourcePrep.id} amount missing in ${locale}`);
            assert.deepEqual(numbers(translatedAmount!), numbers(sourceAmount), `${work.id}/${sourcePrep.id} numbers changed in ${locale}`);
            assert.deepEqual(units(translatedAmount!), units(sourceAmount), `${work.id}/${sourcePrep.id} dimensions changed in ${locale}`);
          }
        }
      }
    }
  }
});

test('published timings and the deliberately underspecified 1:4 ratio survive localization', () => {
  const dauntless = row('patron-2018-dauntless-dessert');
  const heights = row('world-class-us-2024-such-great-heights');
  const apples = row('world-class-us-2024-apples-for-whales');
  for (const locale of LOCALES) {
    const dauntlessView = getResearchWorkView(dauntless, locale);
    const dauntlessFacts = values([...(dauntlessView.method ?? []), ...(dauntlessView.preparations ?? []).flatMap(prep => prep.method)].join(' '));
    assert.match(dauntlessFacts, /15–20/);
    assert.match(dauntlessFacts, /24–48/);
    assert.match(dauntlessFacts, /5–8/);

    const heightsView = getResearchWorkView(heights, locale);
    const ratio = heightsView.preparations?.[0]?.ingredients[0]?.amount ?? '';
    assert.match(ratio, /1:4/);
    assert.match(values(heightsView.preparations?.[0]?.method.join(' ') ?? ''), /1:4/);

    const applesView = getResearchWorkView(apples, locale);
    assert.match(values([...(applesView.method ?? []), ...(applesView.preparations ?? []).flatMap(prep => prep.method)].join(' ')), /48/);
  }
});

test('original mode exposes canonical source facts and Bacardí Japanese material text', () => {
  const dauntless = row('patron-2018-dauntless-dessert');
  const originalDauntless = getResearchWorkView(dauntless, 'zh', true);
  assert.deepEqual(originalDauntless.method, dauntless.method);
  assert.deepEqual(originalDauntless.preparations?.[0]?.method, dauntless.preparations?.[0]?.method);
  assert.equal(originalDauntless.materials[0]?.name, 'Patrón Reposado');

  for (const bacardi of roundTwelveRows.filter(work => work.id.startsWith('legacy-2019-'))) {
    const sourceNames = bacardi.original!.split('／');
    for (const locale of LOCALES) {
      const translated = getResearchWorkView(bacardi, locale);
      const original = getResearchWorkView(bacardi, locale, true);
      assert.deepEqual(original.materials.map(material => material.name), sourceNames);
      assert.deepEqual(original.original, bacardi.original);
      assert.equal(translated.materials.length, bacardi.materials.length);
    }
  }
});

test('view generation never mutates canonical research rows', () => {
  const snapshot = JSON.stringify(roundTwelveRows);
  for (const work of roundTwelveRows) {
    for (const locale of LOCALES) {
      getResearchWorkView(work, locale);
      getResearchWorkView(work, locale, true);
    }
  }
  assert.equal(JSON.stringify(roundTwelveRows), snapshot);
});
