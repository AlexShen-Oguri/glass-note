import assert from 'node:assert/strict';
import test from 'node:test';
import {LOCALES} from '../domain/contracts';
import {refinementText} from './experience-refinement';

test('experience refinement copy covers every supported language',()=>{
  for(const locale of LOCALES)for(const key of ['drank','made','again','photo','choosePhoto','processingPhoto','removePhoto','photoHint','photoError','backToList','tips','abv','beforeIce','estimateNote','unknownAbv','sources'] as const){
    assert.ok(refinementText(locale,key)?.trim(),`${locale}:${key}`);
  }
});
