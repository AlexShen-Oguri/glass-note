import {deepEqual, equal, ok} from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {bottles} from '../bottles';
import {LOCALES} from '../../domain/contracts';
import {bottleDisplayName, bottleSearchNames} from '../../domain/bottles/format';
import {applyBottleNames, reviewedBottleNames} from './bottle-names';

test('every published bottle translation maps to a real product and recorded name evidence', async () => {
  const evidence = JSON.parse(await readFile(new URL('../../../research/localization/p02/bottle-name-evidence.json', import.meta.url), 'utf8'));
  // This test file lives in src/content/localization; evidence is at the repository root.
  for (const [id, names] of Object.entries(reviewedBottleNames)) {
    const bottle = bottles.find(value => value.id === id);
    ok(bottle, id);
    for (const [locale, translation] of Object.entries(names)) {
      ok(LOCALES.includes(locale as typeof LOCALES[number]), locale);
      ok(translation.name.trim());
      ok(['producer', 'editorial'].includes(translation.basis));
      ok(translation.sources.length > 0);
      for (const source of translation.sources) {
        ok(source.url.startsWith('https://'));
        ok(source.title.trim());
        ok(/^\d{4}-\d{2}-\d{2}$/.test(source.checkedAt));
        const record = evidence.records.find((item: {bottleId:string;locale:string;sourceUrl:string}) =>
          item.bottleId === id && (item.locale.startsWith('zh-') ? 'zh' : item.locale) === locale && item.sourceUrl === source.url);
        ok(record, `${id}:${locale} must have its own evidence`);
        if (translation.basis === 'producer') equal(translation.name, record.name);
      }
      ok(bottleSearchNames(bottle).includes(translation.name));
    }
  }
});

test('display-name enrichment never overwrites market facts or the saved canonical identity', () => {
  for (const id of Object.keys(reviewedBottleNames)) {
    const bottle = bottles.find(value => value.id === id)!;
    const {nameTranslations: _names, ...source} = bottle;
    const before = JSON.stringify(source);
    const enriched = applyBottleNames(source);
    equal(JSON.stringify(source), before);
    equal(bottleDisplayName(enriched), bottleDisplayName(source));
    for (const key of ['id', 'brandId', 'brandName', 'name', 'abv', 'market', 'ingredientIds', 'source', 'marketEvidence'] as const) {
      deepEqual(enriched[key], source[key], `${id}:${key}`);
    }
    deepEqual(applyBottleNames(enriched), enriched);
  }
});

test('capacity-specific Chinese source is rendered without inventing a package size', () => {
  const bottle = bottles.find(value => value.id === 'absolut-vodka')!;
  equal(bottleDisplayName(bottle, 'zh'), '原味绝对伏特加');
  equal(bottle.nameTranslations?.zh?.basis, 'editorial');
});
