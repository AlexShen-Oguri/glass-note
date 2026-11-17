import assert from 'node:assert/strict';
import test from 'node:test';
import {LOCALES} from '../domain/contracts';
import {recommendationText,type RecommendationKey} from './recommendations';

const english={
  forYou:'For you',
  coldTitle:'A place to start',
  coldHint:'Discover different styles. Saved feedback will help future picks.',
  personalizedHint:'Five likely matches and one new direction.',
  limitedHint:'Showing the available matches for these filters.',
  familiar:'Likely your taste',
  explore:'Try something new',
  why:'Why this pick',
  exploreAnother:'Explore another',
  evidence:'View saved feedback',
  learnedReason:'Similar to recipe combinations you rated positively.',
  explicitFlavourReason:'Matches your saved flavour preferences.',
  exactReason:'You liked this exact recipe version.',
  explorationReason:'An unrated direction near your preferences, selected to explore.',
  diversityReason:'A different combination within your saved preferences.',
  cautiousReason:'Takes your sweetness or intensity feedback into account.',
  readError:'Taste memory is unavailable. You can still browse the catalogue.',
  writeError:'Using your last saved feedback. Retry to save your changes.',
  retry:'Retry',
  retrying:'Retrying…',
  loading:'Loading taste memory…',
  unavailable:'Personal picks are unavailable. You can still browse the catalogue.',
  memory:'Taste memory',
  allCocktails:'All cocktails',
  trainingBudget:'Combination learning uses the latest {count} rated recipe snapshots. Older records are kept.',
  noMoreExploration:'No other new picks match these filters.',
} satisfies Record<RecommendationKey,string>;
const keys=Object.keys(english) as RecommendationKey[];

test('recommendation copy exposes the discovery labels, reasons and recoverable storage states',()=>{
  for(const key of keys){
    assert.equal(recommendationText('en',key),english[key],`${key} is missing its discovery copy`);
  }
});

for(const locale of LOCALES){
  test(`recommendation copy provides every label in ${locale} without promising numerical accuracy`,()=>{
    for(const key of keys){
      const result=recommendationText(locale,key,{count:1000});
      assert.ok(result.trim(),`${locale}.${key} is missing usable copy`);
      assert.doesNotMatch(result,/\{[^}]+\}/,`${locale}.${key} contains an unresolved placeholder`);
      assert.doesNotMatch(result,/[0-9]+(?:[.,][0-9]+)?\s*%/,`${locale}.${key} claims numerical accuracy`);
      if(locale!=='en')assert.notEqual(result,recommendationText('en',key,{count:1000}),`${locale}.${key} fell back to English`);
    }
  });
}

test('recommendation interpolation leaves copy unchanged when supplied values have no matching slot',()=>{
  assert.equal(recommendationText('en','forYou',{name:'Dry Martini',count:0}),'For you');
  assert.equal(recommendationText('zh','forYou',{}),'为你推荐');
});

test('combination training budget keeps its count slot visible until supplied in every locale',()=>{
  for(const locale of LOCALES){
    assert.doesNotThrow(()=>{
      assert.match(recommendationText(locale,'trainingBudget'),/\{count\}/,`${locale} dropped its training count slot`);
      for(const count of [0,1,1000]){
        const result=recommendationText(locale,'trainingBudget',{count});
        assert.ok(result.includes(String(count)),`${locale} dropped training count ${count}`);
        assert.doesNotMatch(result,/\{[^}]+\}/,`${locale} left its training count unresolved`);
      }
    },`${locale} is missing its training budget disclosure`);
  }
  assert.equal(recommendationText('en','trainingBudget',{count:1000}),'Combination learning uses the latest 1000 rated recipe snapshots. Older records are kept.');
});
