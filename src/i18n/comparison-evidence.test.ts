import assert from 'node:assert/strict';
import test from 'node:test';
import {LOCALES} from '../domain/contracts';
import {COMPARISON_TRANSLATION_REVIEW,comparisonEvidenceText,type ComparisonEvidenceKey} from './comparison-evidence';

const keys:ComparisonEvidenceKey[]=[
  'pilotEyebrow','pilotTitle','pilotBody','loadPilot','startPilot','chooseRowNext','producerEvidence','evidenceSource',
  'catalogueAbv','actualAbvUnknown','editorialBoundary','sourceColumn','bottleColumn','ingredients',
  'changedRow','unchangedRow','methodTitle','methodBody','scrollHint','sourceIdentity',
];

test('bottle comparison copy is present for all eight locales',()=>{
  for(const locale of LOCALES){
    for(const key of keys)assert.ok(comparisonEvidenceText(locale,key,{abv:40,market:'UK'}).trim(),`${locale}:${key}`);
  }
});

test('comparison copy substitutes values and records incomplete native-speaker review honestly',()=>{
  assert.equal(comparisonEvidenceText('en','catalogueAbv',{abv:47.3,market:'US'}),'Catalogue reference: 47.3% ABV · US');
  assert.equal(COMPARISON_TRANSLATION_REVIEW.nativeSpeakerReviewComplete,false);
});
