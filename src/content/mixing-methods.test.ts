import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {deepEqual, equal, notEqual, ok} from 'node:assert/strict';
import {test} from 'node:test';
import {catalogue} from './catalogue';
import {applyMixingMethods, mixingMethodRecords} from './mixing-methods';
import {MIXING_METHODS, type MixingMethodEvidence} from '../domain/contracts';
import {searchCocktails} from '../domain/search';

const review = JSON.parse(readFileSync(new URL('../../research/techniques/p02-mixing-methods-review.json', import.meta.url), 'utf8')) as {
  summary: {classifiedVersionCount: number; unclassifiedVersionCount: number; unclassifiedVersionIds: string[]};
  reviews: Array<{versionId: string; sourceId: string; sourceURL: string; originalStepsHash: string; methodEvidence: MixingMethodEvidence[]; unknowns: string[]}>;
};

test('every method annotation is tied to unchanged archived steps and the exact source version', () => {
  equal(review.reviews.length, catalogue.versions.length);
  equal(new Set(review.reviews.map(({versionId}) => versionId)).size, catalogue.versions.length);
  equal(Object.keys(mixingMethodRecords).length, catalogue.versions.length);
  for (const version of catalogue.versions) {
    const record = review.reviews.find(({versionId}) => versionId === version.id);
    ok(record, version.id);
    equal(record.sourceId, version.sourceId, version.id);
    equal(record.sourceURL, catalogue.sources.find(({id}) => id === version.sourceId)?.url, version.id);
    equal(record.originalStepsHash, createHash('sha256').update(JSON.stringify(version.originalSteps)).digest('hex'), `${version.id}: re-review when original steps change`);
    deepEqual(record.methodEvidence, mixingMethodRecords[version.id], version.id);
    deepEqual(version.mixingMethods ?? [], record.methodEvidence, version.id);
    const seen = new Set<string>();
    for (const evidence of record.methodEvidence) {
      ok(MIXING_METHODS.includes(evidence.method), version.id);
      ok(!seen.has(evidence.method), version.id);
      seen.add(evidence.method);
      equal(evidence.sourceId, version.sourceId, version.id);
      ok(/^\d{4}-\d{2}-\d{2}$/.test(evidence.reviewedAt), version.id);
      ok(evidence.stepIndexes.length > 0, version.id);
      ok(evidence.stepIndexes.every((index) => Number.isInteger(index) && index >= 0 && index < (version.originalSteps?.length ?? 0)), version.id);
    }
    if (!record.methodEvidence.length) ok(record.unknowns.length > 0, `${version.id}: explain unclassified steps`);
  }
  equal(catalogue.versions.filter(({mixingMethods}) => mixingMethods?.length).length, review.summary.classifiedVersionCount);
  equal(review.summary.unclassifiedVersionCount, review.summary.unclassifiedVersionIds.length);
});

test('annotation attachment preserves recipe identity, instructions and ingredient records', () => {
  const original = catalogue.versions.find(({id}) => id === 'dry-martini-ideal-gin')!;
  const before = JSON.stringify(original);
  const [attached] = applyMixingMethods([original]);
  equal(JSON.stringify(original), before);
  notEqual(attached, original);
  deepEqual(attached, original);
  equal(attached.ingredients, original.ingredients);
  equal(attached.originalSteps, original.originalSteps);
  notEqual(attached.mixingMethods, original.mixingMethods);
});

test('real catalogue queries use final technique evidence and keep nondefault source versions', () => {
  const shake = searchCocktails(catalogue, {text: 'Daiquiri', methods: ['shake']});
  ok(shake.some(({selectedVersionId}) => selectedVersionId === 'daiquiri-iba'));
  ok(!searchCocktails(catalogue, {methods: ['stir']}).some(({cocktailId}) => cocktailId === 'daiquiri'));
  ok(searchCocktails(catalogue, {methods: ['build']}).some(({selectedVersionId}) => selectedVersionId === 'negroni-iba'));
  ok(!searchCocktails(catalogue, {methods: ['stir']}).some(({selectedVersionId}) => selectedVersionId === 'negroni-iba'));
  const ideal = catalogue.versions.find(({id}) => id === 'dry-martini-ideal-gin')!;
  const defaultMartini = catalogue.versions.find(({id}) => id === 'dry-martini-iba')!;
  const distinctIngredient = ideal.ingredients.find(({ingredientId}) => !defaultMartini.ingredients.some((row) => row.ingredientId === ingredientId))!;
  ok(distinctIngredient);
  const result = searchCocktails(catalogue, {text: 'Dry Martini', bases: ['gin'], ingredientIds: [distinctIngredient.ingredientId], methods: ['stir']});
  equal(result.find(({cocktailId}) => cocktailId === 'dry-martini')?.selectedVersionId, ideal.id);
  deepEqual(catalogue.versions.find(({id}) => id === 'irish-coffee-iba')?.mixingMethods?.map(({method}) => method).sort(), ['build', 'hot']);
});
