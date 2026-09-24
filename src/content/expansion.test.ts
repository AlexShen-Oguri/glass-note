import assert from 'node:assert/strict';
import {readFileSync, statSync} from 'node:fs';
import test from 'node:test';
import type {Base, Flavour, SearchQuery} from '../domain/contracts';
import {searchCocktails} from '../domain/search';
import {catalogue} from './catalogue';
import {batchA} from './expansion/batch-a';
import {batchB} from './expansion/batch-b';

const recipe = (id: string) => {
  const version = catalogue.versions.find((candidate) => candidate.id === id);
  assert.ok(version, `missing recipe ${id}`);
  return version;
};
const ingredient = (versionId: string, ingredientId: string) => {
  const item = recipe(versionId).ingredients.find((candidate) => candidate.ingredientId === ingredientId);
  assert.ok(item, `${versionId}: missing ${ingredientId}`);
  return item;
};
const ids = (query: SearchQuery) => searchCocktails(catalogue, query).map((result) => result.cocktailId);

test('expanded catalogue makes previously sparse guided profiles discoverable', () => {
  for (const flavour of ['citrus', 'fruit', 'floral', 'herbal', 'spice', 'coffee'] as Flavour[]) {
    assert.ok(ids({flavours: [flavour]}).length, `no ${flavour} candidates`);
  }
  for (const base of ['gin', 'rum', 'tequila', 'whiskey', 'vodka', 'brandy', 'mezcal', 'cachaca', 'grappa'] as Base[]) {
    assert.ok(ids({bases: [base]}).length, `no ${base} candidates`);
  }
  assert.ok(ids({flavours: ['floral'], tastes: ['sour']}).includes('aviation'));
  assert.ok(ids({flavours: ['fruit'], tastes: ['creamy']}).includes('pina-colada'));
  assert.ok(ids({bases: ['brandy'], tastes: ['creamy']}).includes('alexander'));
  const lighter = ids({strengths: ['low']});
  assert.ok(lighter.includes('americano') && lighter.includes('spritz'));
  assert.equal(ids({}).length, catalogue.cocktails.length);
});

test('IBA Bee’s Knees retains its verified orange juice and teaspoon quantities', () => {
  const orange = ingredient('bees-knees-iba', 'orange-juice');
  const honey = ingredient('bees-knees-iba', 'honey-syrup');
  assert.deepEqual([orange.amount, orange.unit], [22.5, 'ml']);
  assert.deepEqual([honey.amount, honey.unit], [2, 'tsp']);
});

test('source-specific rum, egg, cacao and unquantified soda details survive import', () => {
  const martinique = ingredient('mai-tai-iba', 'martinique-rum');
  assert.deepEqual([martinique.amount, martinique.unit], [30, 'ml']);
  assert.match(martinique.note?.en ?? '', /molasses/);
  assert.match(martinique.note?.en ?? '', /not rhum agricole/);
  const jamaican = ingredient('mai-tai-iba', 'jamaican-rum');
  assert.deepEqual([jamaican.amount, jamaican.unit], [30, 'ml']);
  for (const id of ['pina-colada-iba', 'cuba-libre-iba']) {
    assert.equal(ingredient(id, 'light-rum').amount, 50);
    assert.ok(!recipe(id).ingredients.some((item) => item.ingredientId === 'white-rum'), 'generic white rum must not be narrowed to Cuban rum');
  }
  const egg = ingredient('pisco-sour-iba', 'egg-white');
  assert.deepEqual([egg.amount, egg.unit], [1, 'piece']);
  assert.equal(ingredient('pisco-sour-iba', 'lemon-juice').amount, 30);
  assert.match(ingredient('alexander-iba', 'creme-de-cacao').note?.en ?? '', /brown/i);
  for (const id of ['spritz-iba', 'americano-iba']) {
    const soda = ingredient(id, 'soda-water');
    assert.equal(soda.amount, null);
    assert.ok(soda.note?.en.trim());
  }
});

test('Penicillin versions keep separate units, syrup preparations and brand requirements', () => {
  const iba = recipe('penicillin-iba');
  const punch = recipe('penicillin-punch-proper-drink');
  assert.notEqual(iba.sourceId, punch.sourceId);
  assert.equal(ingredient(iba.id, 'scotch-whisky').amount, 60);
  assert.equal(ingredient(iba.id, 'honey-syrup').unit, 'ml');
  assert.match(ingredient(iba.id, 'islay-whisky').note?.en ?? '', /16/);
  assert.ok(iba.ingredients.some((item) => item.ingredientId === 'ginger'));
  assert.deepEqual(punch.ingredients.map(({amount, unit}) => [amount, unit]), [[2, 'oz'], [0.75, 'oz'], [0.75, 'oz'], [0.25, 'oz']]);
  assert.ok(punch.ingredients.some((item) => item.ingredientId === 'honey-ginger-syrup'));
  assert.ok(!punch.ingredients.some((item) => item.ingredientId === 'ginger' || item.ingredientId === 'honey-syrup'));
  assert.ok(punch.ingredients.every((item) => !item.brandId));
  const source = catalogue.sources.find((item) => item.id === punch.sourceId);
  assert.match(source?.book ?? '', /A Proper Drink/);
  const results = searchCocktails(catalogue, {text: 'Penicillin'});
  assert.equal(results.length, 1);
  assert.deepEqual(results[0]?.versionIds, [iba.id, punch.id]);
  const branded = searchCocktails(catalogue, {brandIds: ['brand-lagavulin']});
  assert.deepEqual(branded.map((result) => result.versionIds), [[iba.id]]);
  assert.deepEqual(searchCocktails(catalogue, {text: 'Honig-Ingwersirup'}).map((result) => result.versionIds), [[punch.id], ['queens-road-batch-m']]);
  assert.deepEqual(searchCocktails(catalogue, {text: 'Honig-Ingwersirup', brandIds: ['brand-lagavulin']}), []);
});

test('new drinks respect egg, dairy and base exclusions and actual source brands', () => {
  assert.ok(ids({}).includes('alexander'));
  assert.ok(!ids({excluded: ['dairy']}).includes('alexander'));
  assert.ok(!ids({excluded: ['egg']}).includes('pisco-sour'));
  assert.ok(!ids({excluded: ['egg']}).includes('clover-club'));
  assert.ok(!ids({excluded: ['brandy']}).includes('sidecar'));
  assert.deepEqual(ids({brandIds: ['brand-goslings']}), ['dark-n-stormy']);
  assert.deepEqual(ids({text: 'Brandy Alexander'}), ['alexander']);
  assert.ok(ids({text: '皮斯科'}).includes('pisco-sour'));
});

test('third-iteration reference photographs retain their original licensing and credit', () => {
  const manifest = JSON.parse(readFileSync(new URL('../../assets/photos/manifest.json', import.meta.url), 'utf8')) as {
    id: string; file: string; sourceUrl: string; license: string; licenseUrl: string; author: string; kind: string;
  }[];
  assert.equal(new Set(manifest.map((asset) => asset.id)).size, manifest.length);
  for (const cocktail of [...batchA.cocktails, ...batchB.cocktails]) {
    const asset = manifest.find((candidate) => candidate.id === cocktail.id);
    assert.ok(asset, `no photograph for ${cocktail.id}`);
    assert.ok(asset.author.trim());
    assert.match(asset.sourceUrl, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    assert.match(asset.license, /^(CC BY(-SA)? (2\.0|3\.0|4\.0)|Public domain)$/);
    assert.ok(asset.licenseUrl.startsWith('https://'));
    assert.equal(asset.kind, 'drink-illustration');
    assert.equal(asset.file, `assets/photos/${cocktail.id}.jpg`);
    const file = new URL(`../../${asset.file}`, import.meta.url);
    assert.ok(statSync(file).size > 1000);
    assert.deepEqual([...readFileSync(file).subarray(0, 3)], [0xff, 0xd8, 0xff]);
  }
});
