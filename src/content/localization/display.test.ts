import {deepEqual, equal, ok} from 'node:assert/strict';
import {test} from 'node:test';
import {catalogue} from '../catalogue';
import {bottles} from '../bottles';
import {LOCALES} from '../../domain/contracts';
import {bottleDisplayName, bottleSearchNames} from '../../domain/bottles/format';
import {recipeFingerprint, recipeSnapshot} from '../../domain/making';
import {applyCocktailNames} from './names';
import {applyBottleNames, reviewedBottleNames} from './bottle-names';
import {editorialBottleBrands} from './bottle-brand-editorial';
import {bottleEditorialName} from './bottle-editorial';
import {bottleProductRows} from './bottle-product-editorial';
import {bottleVariantRows, bottleProperVariantRows} from './bottle-variant-editorial';
import {editorialCocktailNames} from './cocktail-editorial';
import {westernCocktailNames} from './cocktail-western-editorial';
import {linkedBottleDisplay, recipeDisplayName} from './display';
import {normalizeSearchText, searchCocktails} from '../../domain/search';

test('finite editorial bottle vocabulary covers all products and all eight locales', () => {
  for (const table of [bottleProductRows, bottleVariantRows]) for (const row of table.trim().split('\n')) {
    equal(row.split('|').length, 9, row);
    ok(row.split('|').every(value => value.trim()), row);
  }
  for (const row of bottleProperVariantRows.trim().split('\n')) equal(row.split('|').length, 4, row);
  for (const bottle of bottles) {
    ok(editorialBottleBrands[bottle.brandName], bottle.brandName);
    deepEqual(bottleEditorialName(bottle, 'zh').uncovered, [], bottle.id);
    for (const locale of LOCALES) {
      const translation = bottle.nameTranslations?.[locale];
      ok(translation, `${bottle.id}:${locale}`);
      ok(translation.name.trim(), `${bottle.id}:${locale}`);
      ok(bottleSearchNames(bottle).some(name => normalizeSearchText(name) === normalizeSearchText(translation.name)), `${bottle.id}:${locale}`);
      const reviewed = reviewedBottleNames[bottle.id]?.[locale];
      if (reviewed) deepEqual(translation, reviewed, 'source-backed/local reviewed names win');
      else {equal(translation.basis, 'editorial'); deepEqual(translation.sources, [], 'no invented translation evidence');}
    }
    const before = JSON.stringify(bottle);
    const enriched = applyBottleNames(bottle);
    equal(JSON.stringify(bottle), before);
    equal(bottleDisplayName(enriched), bottleDisplayName(bottle));
    deepEqual(enriched, bottle, `${bottle.id}: idempotent overlay`);
  }
});

test('editorial numeric labels preserve decimals, percentages, and named product codes', () => {
  const name = (value: string) => bottleEditorialName({brandName: 'Tanqueray', name: value}, 'zh').name;
  ok(name('Gin 47.3%').includes('47.3%'));
  ok(name('7.5 Year Old').includes('7.5年'));
  ok(name('7 1/2 Year').includes('7年半'));
  ok(name('V.J.O.P. Gin').includes('V.J.O.P.'));
  ok(name('US*1 Bourbon').includes('US*1'));
});

test('cocktail names retain a searchable source identity and complete locale coverage', () => {
  for (const id of Object.keys(westernCocktailNames)) ok(catalogue.cocktails.some(item => item.id === id), id);
  for (const cocktail of catalogue.cocktails) {
    ok(cocktail.originalName?.trim(), cocktail.id);
    ok(cocktail.snapshotName, cocktail.id);
    for (const locale of LOCALES) {
      ok(cocktail.name[locale].trim());
      if (['zh', 'ja', 'ko'].includes(locale)) ok(/[^\u0000-\u007f]/.test(cocktail.name[locale]), `${cocktail.id}:${locale}`);
    }
    deepEqual(applyCocktailNames([cocktail])[0], cocktail, 'overlay is repeatable');
  }
  for (const id of Object.keys(editorialCocktailNames)) {
    const cocktail = catalogue.cocktails.find(item => item.id === id)!;
    ok(cocktail, id);
    for (const locale of LOCALES) {
      ok(searchCocktails(catalogue, {text: cocktail.name[locale], locale}).some(result => result.cocktailId === id), `${id}:${locale}`);
    }
    ok(searchCocktails(catalogue, {text: cocktail.originalName!, locale: 'zh'}).some(result => result.cocktailId === id), id);
  }
});

test('linked bottle annotations follow locale without relabeling private free text', () => {
  const linked = {name: '我的金酒混合', bottleId: 'tanqueray-london-dry', bottleName: 'Tanqueray London Dry Gin'};
  const before = JSON.stringify(linked);
  ok(linkedBottleDisplay(linked, 'zh').name.includes('添加利'));
  ok(linkedBottleDisplay(linked, 'zh').name.startsWith('我的金酒混合'));
  equal(JSON.stringify(linked), before);
  equal(linkedBottleDisplay({name: '私人材料', bottleName: '特别瓶款'}, 'en').name, '私人材料 · 特别瓶款');
});

test('display-only translations do not change any of the 271 persisted recipe fingerprints', () => {
  const baseline = {...catalogue, cocktails: catalogue.cocktails.map(cocktail => ({...cocktail, name: cocktail.snapshotName!, snapshotName: undefined}))};
  for (const version of catalogue.versions) {
    const before = recipeSnapshot(baseline, version.id)!;
    const after = recipeSnapshot(catalogue, version.id)!;
    equal(recipeFingerprint(after), recipeFingerprint(before), version.id);
    deepEqual(after, before);
  }
  const saved = recipeSnapshot(catalogue, 'left-hand-imbibe') ?? recipeSnapshot(catalogue, catalogue.cocktails.find(item => item.id === 'left-hand')!.defaultVersionId)!;
  const bytes = JSON.stringify(saved);
  equal(recipeDisplayName(saved, 'zh'), '左手');
  equal(JSON.stringify(saved), bytes);
  const privateRecipe = structuredClone(saved);
  privateRecipe.version.id = 'private-recipe-1';
  privateRecipe.title.zh = '我的周末';
  equal(recipeDisplayName(privateRecipe, 'zh'), '我的周末', 'never relabel private or archived snapshots');
});
