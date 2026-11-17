import assert from 'node:assert/strict';
import test from 'node:test';

import {researchTopics} from './topics';
import {DISCLOSURE_DIMENSIONS, sourceDisclosure, sourceDisclosureFor} from './source-disclosure';

test('source disclosure review covers only the selected 2024 World Class US research works', () => {
  const topic = researchTopics.find((item) => item.id === sourceDisclosure.topicId);
  assert.ok(topic);
  assert.equal(topic.year, 2024);
  assert.equal(sourceDisclosure.officialFieldCount, null);
  assert.equal(sourceDisclosure.selectionScope, 'two-published-winner-recipes');
  assert.equal(sourceDisclosure.works.length, 2);
  assert.deepEqual(
    new Set(sourceDisclosure.works.map((item) => item.workId)),
    new Set(topic.research?.map((item) => item.id)),
  );
});

test('every reviewed work keeps the same disclosure dimensions and unknown dilution and ABV', () => {
  for (const work of sourceDisclosure.works) {
    assert.deepEqual(new Set(work.dimensions.map((item) => item.dimension)), new Set(DISCLOSURE_DIMENSIONS));
    assert.equal(work.dimensions.find((item) => item.dimension === 'finished-recipe')?.status, 'published');
    assert.equal(work.dimensions.find((item) => item.dimension === 'dilution')?.status, 'unknown');
    assert.equal(work.dimensions.find((item) => item.dimension === 'finished-abv')?.status, 'unknown');
    const resolved = sourceDisclosureFor(sourceDisclosure.topicId, work.workId);
    assert.equal(resolved?.sources.length, 2);
  }
});

test('unavailable recipe pages retain prior check provenance and do not masquerade as current reads', () => {
  const recipes = sourceDisclosure.sources.filter((source) => source.kind === 'recipe');
  assert.equal(recipes.length, 2);
  for (const source of recipes) {
    assert.equal(source.availability, 'unavailable');
    assert.equal(source.httpStatus, 410);
    assert.equal(source.checkedAt, '2026-09-15');
    assert.equal(source.lastPriorCheck, '2026-09-08');
    assert.match(source.fact, /existing project transcription/i);
  }
  const identity = sourceDisclosure.sources.find((source) => source.kind === 'identity');
  assert.equal(identity?.availability, 'available');
  assert.match(identity?.url ?? '', /^https:\/\/www\.usbg\.org\//);
});

test('sidecar remains research metadata rather than a public recipe payload', () => {
  const serialized = JSON.stringify(sourceDisclosure.works);
  assert.doesNotMatch(serialized, /"ingredients"|"steps"|"method"|"versionId"/);
  assert.equal(sourceDisclosureFor('another-topic', sourceDisclosure.works[0]!.workId), undefined);
});
