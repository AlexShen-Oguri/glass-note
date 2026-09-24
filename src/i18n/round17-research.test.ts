import assert from 'node:assert/strict';
import test from 'node:test';

import {LOCALES} from '../domain/contracts';
import {ROUND17_DIMENSIONS, ROUND17_EDITORIAL_NOTES, ROUND17_NOTES, ROUND17_STATUSES} from '../content/round17-research';
import {round17DimensionText, round17EditorialText, round17NoteText, round17StatusText, round17Text, type Round17Key} from './round17-research';

const keys = [
  'topicSelector', 'changeTopic', 'closeTopics', 'topicSearch', 'noTopicResults', 'collectedEntries', 'officialKnown', 'officialUnknown', 'selectedSubset',
  'reviewTitle', 'completeness', 'sources', 'sourceAvailable', 'sourceUnavailable', 'sourceRecordNotice', 'checkedOn', 'lastPriorCheck', 'status410', 'factLayer', 'editorialLayer',
  'researchOnly', 'translationReview', 'originalUrl',
] satisfies Round17Key[];

test('round seventeen research UI copy covers all eight locales and review codes', () => {
  for (const locale of LOCALES) {
    for (const key of keys) assert.ok(round17Text(locale, key, {count: 2, date: '2026-09-15'}).trim(), `${locale}.${key}`);
    for (const value of ROUND17_DIMENSIONS) assert.ok(round17DimensionText(locale, value).trim(), `${locale}.dimension.${value}`);
    for (const value of ROUND17_STATUSES) assert.ok(round17StatusText(locale, value).trim(), `${locale}.status.${value}`);
    for (const value of ROUND17_NOTES) assert.ok(round17NoteText(locale, value).trim(), `${locale}.note.${value}`);
    for (const value of ROUND17_EDITORIAL_NOTES) assert.ok(round17EditorialText(locale, value).trim(), `${locale}.editorial.${value}`);
  }
});

test('research boundary copy is explicit in English and Chinese', () => {
  assert.match(round17Text('en', 'researchOnly'), /not a makeable public recipe/i);
  assert.match(round17Text('zh', 'researchOnly'), /不是可调制公共配方/);
  assert.match(round17Text('en', 'translationReview'), /native-language final review is still pending/i);
  assert.match(round17Text('en', 'sourceRecordNotice'), /currently unavailable.*existing record/i);
  assert.match(round17Text('zh', 'sourceRecordNotice'), /当前不可访问.*既有记录/);
  assert.match(round17Text('zh', 'status410'), /HTTP 410/);
});
