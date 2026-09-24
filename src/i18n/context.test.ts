import assert from 'node:assert/strict';
import test from 'node:test';

import {LOCALES} from '../domain/contracts';
import {CONTEXT_REASONS, OCCASIONS, SEASONS} from '../domain/context/types';
import {contextReasonLabel, contextText, occasionLabel, seasonLabel, type ContextCopy} from './context';

const keys = [
  'disclosureTitle', 'optional', 'summaryOpen', 'occasion', 'season', 'anyOccasion', 'anySeason', 'apply', 'cancel', 'change', 'details', 'closeDetails', 'editorialBasis', 'noSpecificBasis', 'reasonTitle', 'notThisOne', 'picksTitle', 'picksHint', 'picksEmpty', 'viewRecipe', 'showAll', 'showLess', 'swapPicks', 'contextRankedMatch', 'contextBaseMatch', 'baseResultCount', 'contextPriorityNote', 'hiddenAllTitle', 'hiddenAllHint', 'restoreHidden',
] satisfies Array<keyof ContextCopy>;

test('context UI copy covers every locale, choice, and editorial reason', () => {
  for (const locale of LOCALES) {
    for (const key of keys) assert.ok(contextText(locale, key).trim(), `${locale}.${key}`);
    for (const value of OCCASIONS) assert.ok(occasionLabel(locale, value).trim(), `${locale}.occasion.${value}`);
    for (const value of SEASONS) assert.ok(seasonLabel(locale, value).trim(), `${locale}.season.${value}`);
    for (const code of CONTEXT_REASONS) assert.ok(contextReasonLabel(locale, code).trim(), `${locale}.reason.${code}`);
  }
});

test('reason copy states an editorial basis without claiming a percentage or source recommendation', () => {
  for (const locale of LOCALES) {
    const joined = [contextText(locale, 'editorialBasis'), ...CONTEXT_REASONS.map((code) => contextReasonLabel(locale, code))].join(' ');
    assert.doesNotMatch(joined, /\d+\s*%/u);
  }
  assert.equal(contextText('zh', 'editorialBasis'), '编辑建议，依据此配方。');
  assert.equal(contextText('en', 'editorialBasis'), 'Editorial suggestion based on this recipe.');
});
