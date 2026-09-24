import assert from 'node:assert/strict';
import test from 'node:test';

import {researchTopics} from './topics';
import {ROUND17_DIMENSIONS, round17Research, round17ReviewFor} from './round17-research';

test('round seventeen review covers only the selected 2024 World Class US research works', () => {
  const topic = researchTopics.find((item) => item.id === round17Research.topicId);
  assert.ok(topic);
  assert.equal(topic.year, 2024);
  assert.equal(round17Research.officialFieldCount, null);
  assert.equal(round17Research.selectionScope, 'two-published-winner-recipes');
  assert.equal(round17Research.works.length, 2);
  assert.deepEqual(
    new Set(round17Research.works.map((item) => item.workId)),
    new Set(topic.research?.map((item) => item.id)),
  );
});

test('every reviewed work keeps the same disclosure dimensions and unknown dilution and ABV', () => {
  for (const work of round17Research.works) {
    assert.deepEqual(new Set(work.dimensions.map((item) => item.dimension)), new Set(ROUND17_DIMENSIONS));
    assert.equal(work.dimensions.find((item) => item.dimension === 'finished-recipe')?.status, 'published');
    assert.equal(work.dimensions.find((item) => item.dimension === 'dilution')?.status, 'unknown');
    assert.equal(work.dimensions.find((item) => item.dimension === 'finished-abv')?.status, 'unknown');
    const resolved = round17ReviewFor(round17Research.topicId, work.workId);
    assert.equal(resolved?.sources.length, 2);
  }
});

test('unavailable recipe pages retain prior check provenance and do not masquerade as current reads', () => {
  const recipes = round17Research.sources.filter((source) => source.kind === 'recipe');
  assert.equal(recipes.length, 2);
  for (const source of recipes) {
    assert.equal(source.availability, 'unavailable');
    assert.equal(source.httpStatus, 410);
    assert.equal(source.checkedAt, '2026-09-15');
    assert.equal(source.lastPriorCheck, '2026-09-08');
    assert.match(source.fact, /existing project transcription/i);
  }
  const identity = round17Research.sources.find((source) => source.kind === 'identity');
  assert.equal(identity?.availability, 'available');
  assert.match(identity?.url ?? '', /^https:\/\/www\.usbg\.org\//);
});

test('sidecar remains research metadata rather than a public recipe payload', () => {
  const serialized = JSON.stringify(round17Research.works);
  assert.doesNotMatch(serialized, /"ingredients"|"steps"|"method"|"versionId"/);
  assert.equal(round17ReviewFor('another-topic', round17Research.works[0]!.workId), undefined);
});
