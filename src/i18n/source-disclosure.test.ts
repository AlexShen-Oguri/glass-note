import assert from 'node:assert/strict';
import test from 'node:test';

import {LOCALES} from '../domain/contracts';
import {DISCLOSURE_DIMENSIONS, DISCLOSURE_EDITORIAL_NOTES, DISCLOSURE_NOTES, DISCLOSURE_STATUSES} from '../content/source-disclosure';
import {disclosureDimensionText, disclosureEditorialText, disclosureNoteText, disclosureStatusText, sourceDisclosureText, type SourceDisclosureKey} from './source-disclosure';

const keys = [
  'topicSelector', 'changeTopic', 'closeTopics', 'topicSearch', 'noTopicResults', 'collectedEntries', 'officialKnown', 'officialUnknown', 'selectedSubset',
  'reviewTitle', 'completeness', 'sources', 'sourceAvailable', 'sourceUnavailable', 'sourceRecordNotice', 'checkedOn', 'lastPriorCheck', 'status410', 'factLayer', 'editorialLayer',
  'researchOnly', 'translationReview', 'originalUrl',
] satisfies SourceDisclosureKey[];

test('source disclosure UI copy covers all eight locales and review codes', () => {
  for (const locale of LOCALES) {
    for (const key of keys) assert.ok(sourceDisclosureText(locale, key, {count: 2, date: '2026-09-15'}).trim(), `${locale}.${key}`);
    for (const value of DISCLOSURE_DIMENSIONS) assert.ok(disclosureDimensionText(locale, value).trim(), `${locale}.dimension.${value}`);
    for (const value of DISCLOSURE_STATUSES) assert.ok(disclosureStatusText(locale, value).trim(), `${locale}.status.${value}`);
    for (const value of DISCLOSURE_NOTES) assert.ok(disclosureNoteText(locale, value).trim(), `${locale}.note.${value}`);
    for (const value of DISCLOSURE_EDITORIAL_NOTES) assert.ok(disclosureEditorialText(locale, value).trim(), `${locale}.editorial.${value}`);
  }
});

test('research boundary copy is explicit in English and Chinese', () => {
  assert.match(sourceDisclosureText('en', 'researchOnly'), /not a makeable public recipe/i);
  assert.match(sourceDisclosureText('zh', 'researchOnly'), /不是可调制公共配方/);
  assert.match(sourceDisclosureText('en', 'translationReview'), /native-language final review is still pending/i);
  assert.match(sourceDisclosureText('en', 'sourceRecordNotice'), /currently unavailable.*existing record/i);
  assert.match(sourceDisclosureText('zh', 'sourceRecordNotice'), /当前不可访问.*既有记录/);
  assert.match(sourceDisclosureText('zh', 'status410'), /HTTP 410/);
});
