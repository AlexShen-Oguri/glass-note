import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {catalogue} from './catalogue';
import {contextEvidence, contextRecipeFacts} from './context-evidence';
import {CONTEXT_REASONS, OCCASIONS, SEASONS} from '../domain/context/types';
import {needsPreparationReview} from '../domain/preparations';

const review = JSON.parse(readFileSync(new URL('../../research/recommendations/p02-context-review.json', import.meta.url), 'utf8')) as {
  editorial: boolean;
  entries: Array<{versionId: string; sourceId: string; sourceUrl: string; recipeDigest: string; recipeFacts: unknown; note: string}>;
};

test('context suggestions retain exact source facts and editorial provenance', () => {
  assert.equal(review.editorial, true);
  assert.equal(new Set(contextEvidence.map(record => record.versionId)).size, contextEvidence.length);
  assert.equal(review.entries.length, contextEvidence.length);
  for (const record of contextEvidence) {
    const version = catalogue.versions.find(version => version.id === record.versionId);
    assert.ok(version, record.versionId);
    assert.equal(record.sourceId, version.sourceId);
    assert.equal(record.basis, 'editorial');
    assert.ok(Number.isFinite(Date.parse(record.reviewedAt)));
    const facts = contextRecipeFacts(version);
    assert.equal(createHash('sha256').update(facts).digest('hex'), record.recipeDigest, `${record.versionId}: changed source/profile needs review`);
    const entry = review.entries.find(entry => entry.versionId === record.versionId);
    assert.ok(entry);
    assert.equal(entry.sourceId, version.sourceId);
    assert.equal(entry.sourceUrl, catalogue.sources.find(source => source.id === version.sourceId)?.url);
    assert.equal(entry.recipeDigest, record.recipeDigest);
    assert.deepEqual(entry.recipeFacts, JSON.parse(facts));
    assert.ok(entry.note.trim());
    for (const [annotations, allowed] of [[record.occasions, OCCASIONS], [record.seasons, SEASONS]] as const) {
      assert.equal(new Set(annotations.map(annotation => annotation.value)).size, annotations.length);
      for (const annotation of annotations) {
        assert.ok((allowed as readonly string[]).includes(annotation.value));
        assert.ok(CONTEXT_REASONS.includes(annotation.reason));
      }
    }
  }
});

test('context reason claims have the specific recipe facts they name', () => {
  const bubbly = new Set(['prosecco', 'champagne', 'soda-water', 'tonic-water', 'ginger-beer', 'ginger-ale', 'lemonade', 'pink-grapefruit-soda']);
  for (const record of contextEvidence) {
    const version = catalogue.versions.find(version => version.id === record.versionId)!;
    const ingredients = version.ingredients.map(item => item.ingredientId);
    for (const {reason} of [...record.occasions, ...record.seasons]) {
      const label = `${record.versionId}: ${reason}`;
      if (reason === 'sparkling') assert.ok(ingredients.some(id => bubbly.has(id)), label);
      if (reason === 'warm-serve') assert.match(version.originalSteps?.join(' ') ?? '', /hot|warm|preheat|boiling/i, label);
      if (reason === 'bitter-dry') assert.ok(version.tastes.some(taste => taste === 'bitter' || taste === 'dry'), label);
      if (reason === 'citrus-refreshing') assert.ok(version.flavours.includes('citrus'), label);
      if (reason === 'floral-fruit') assert.ok(version.flavours.some(flavour => flavour === 'floral' || flavour === 'fruit'), label);
      if (reason === 'herbal-fresh') assert.ok(version.flavours.includes('herbal') && ingredients.some(id => id.startsWith('mint')), label);
      if (reason === 'spice-depth') assert.ok(version.flavours.includes('spice'), label);
      if (reason === 'rich-finish') assert.ok(version.tastes.includes('creamy') || version.flavours.includes('coffee'), label);
      if (reason === 'spirit-forward') assert.equal(version.strength, 'strong', label);
      if (reason === 'long-refreshing') assert.match(version.glass.en, /highball|collins|tall/i, label);
      if (reason === 'simple-build') {
        assert.ok(version.mixingMethods?.some(item => item.method === 'build' && item.sourceId === version.sourceId), label);
        assert.equal(needsPreparationReview(version.id), false, label);
        // This label describes the documented mixing method, not ingredient
        // disclosure, preparation effort, or suitability for batch scaling.
        assert.ok(version.originalSteps?.length, label);
      }
    }
  }
});

test('every occasion and season offers several distinct drinks without dropping alcohol-free choices', () => {
  for (const tag of OCCASIONS) {
    const ids = new Set(contextEvidence.filter(record => record.occasions.some(item => item.value === tag)).map(record => catalogue.versions.find(version => version.id === record.versionId)!.cocktailId));
    assert.ok(ids.size >= 3, tag);
  }
  for (const tag of SEASONS) {
    const ids = new Set(contextEvidence.filter(record => record.seasons.some(item => item.value === tag)).map(record => catalogue.versions.find(version => version.id === record.versionId)!.cocktailId));
    assert.ok(ids.size >= 3, tag);
  }
  const alcoholFree = catalogue.versions.filter(version => version.strength === 'none');
  assert.ok(alcoholFree.length > 0);
  for (const version of alcoholFree) assert.ok(contextEvidence.some(record => record.versionId === version.id), version.id);
});
