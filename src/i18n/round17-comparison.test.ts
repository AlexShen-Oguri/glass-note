import assert from 'node:assert/strict';
import test from 'node:test';
import {LOCALES} from '../domain/contracts';
import {ROUND17_COMPARISON_TRANSLATION_REVIEW,round17ComparisonText,type Round17ComparisonKey} from './round17-comparison';

const keys:Round17ComparisonKey[]=[
  'pilotEyebrow','pilotTitle','pilotBody','loadPilot','startPilot','chooseRowNext','producerEvidence','evidenceSource',
  'catalogueAbv','actualAbvUnknown','editorialBoundary','sourceColumn','bottleColumn','ingredients',
  'changedRow','unchangedRow','methodTitle','methodBody','scrollHint','sourceIdentity',
];

test('round 17 bottle comparison copy is present for all eight locales',()=>{
  for(const locale of LOCALES){
    for(const key of keys)assert.ok(round17ComparisonText(locale,key,{abv:40,market:'UK'}).trim(),`${locale}:${key}`);
  }
});

test('comparison copy substitutes values and records incomplete native-speaker review honestly',()=>{
  assert.equal(round17ComparisonText('en','catalogueAbv',{abv:47.3,market:'US'}),'Catalogue reference: 47.3% ABV · US');
  assert.equal(ROUND17_COMPARISON_TRANSLATION_REVIEW.nativeSpeakerReviewComplete,false);
});
