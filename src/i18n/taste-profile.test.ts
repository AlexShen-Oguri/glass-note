import assert from 'node:assert/strict';
import test from 'node:test';
import {LOCALES} from '../domain/contracts';
import {tm,type TasteKey} from './taste';

const profileKeys:TasteKey[]=[
  'profileTitle','profileEmpty','profileCount','profileFeatureCount','profileIntro',
  'profileLimited','profileRepeated','profileEarly','profileRecurring','profileSupport',
  'profileExactOnly','profileSweet','profileStrong','profileEvidence','profileSavedOnly',
  'reasonSupport',
];

for(const locale of LOCALES){
  test(`taste profile resolves its labels and boundaries in ${locale}`,()=>{
    for(const key of profileKeys){
      assert.doesNotThrow(()=>{
        const result=tm(locale,key,{count:3});
        assert.ok(result.trim().length>0,`${locale}.${key} is blank`);
        assert.doesNotMatch(result,/\{[^}]+\}/,`${locale}.${key} has an unresolved placeholder`);
        assert.doesNotMatch(result,/[0-9]+(?:[.,][0-9]+)?\s*%/,`${locale}.${key} claims numerical accuracy`);
        if(locale!=='en')assert.notEqual(result,tm('en',key,{count:3}),`${locale}.${key} fell back to English`);
      },`${locale}.${key} is missing usable copy`);
    }
  });
}

test('taste profile count interpolation preserves unsupplied values and supports zero and multiple snapshots',()=>{
  const countKeys:TasteKey[]=['profileCount','profileFeatureCount','profileSupport','reasonSupport'];
  for(const locale of LOCALES){
    for(const key of countKeys){
      assert.doesNotThrow(()=>{
        assert.match(tm(locale,key),/\{count\}/,`${locale}.${key} dropped its count slot`);
        for(const count of [0,3,12]){
          const result=tm(locale,key,{count});
          assert.ok(result.includes(String(count)),`${locale}.${key} dropped count ${count}`);
          assert.doesNotMatch(result,/\{[^}]+\}/,`${locale}.${key} did not interpolate count ${count}`);
        }
      },`${locale}.${key} is missing count interpolation`);
    }
  }
});
