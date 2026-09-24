import assert from 'node:assert/strict';
import test from 'node:test';
import {LOCALES,type Locale} from '../domain/contracts';
import {tm,type TasteKey} from './taste';

const interpolationCases: Array<{
  key:TasteKey;
  values:Record<string,string|number>;
}> = [
  {key:'entrySource',values:{source:'Exact source'}},
  {key:'createdAt',values:{date:'2026-09-11'}},
  {key:'updatedAt',values:{date:'2026-09-11'}},
  {key:'deleteConfirmBody',values:{name:'Dry Martini'}},
  {key:'clearConfirmBody',values:{count:12}},
  {key:'orderFor',values:{name:'Dry Martini'}},
  {key:'orderSource',values:{source:'Exact source'}},
  {key:'numericAbv',values:{abv:'24.5'}},
  {key:'pantryReason',values:{owned:2,total:3}},
  {key:'likedFlavour',values:{flavours:'citrus'}},
];

test('taste copy resolves every documented interpolation in all eight locales',()=>{
  for(const locale of LOCALES){
    for(const item of interpolationCases){
      const result=tm(locale,item.key,item.values);
      assert.ok(result.trim().length>0,`${locale}.${item.key} is blank`);
      assert.doesNotMatch(result,/\{[^}]+\}/,`${locale}.${item.key} has an unresolved placeholder`);
    }
  }
});

test('taste copy keeps unknown ABV, source provenance and private-memory boundaries explicit',()=>{
  const keys:TasteKey[]=['abvUnknown','sourceProfile','editorialProfile','originalParaphrase','memoryHint','privateNote','noPrivateNotes'];
  for(const locale of LOCALES){
    for(const key of keys)assert.ok(tm(locale,key).trim().length>0,`${locale}.${key} is blank`);
  }
  assert.match(tm('en','abvUnknown'),/unknown/i);
  assert.doesNotMatch(tm('en','abvUnknown'),/\b0(?:\.0+)?%/);
  assert.match(tm('en','memoryHint'),/explicitly saved/i);
  assert.match(tm('zh','privateNote'),/绝不会加入点单卡/);
  assert.match(tm('ja','originalParaphrase'),/言い換え/);
});

test('recommendation reasons expose no score and pantry counts never claim readiness',()=>{
  const reasonKeys:TasteKey[]=['likedVersion','dislikedVersion','likedFlavour','sweetCaution','strongCaution'];
  for(const locale of LOCALES){
    for(const key of reasonKeys)assert.doesNotMatch(tm(locale,key,{flavours:'citrus'}),/[0-9]+(?:[.,][0-9]+)?\s*%/);
  }
  assert.doesNotMatch(tm('en','pantryReason',{owned:2,total:3}),/ready|can make/i);
  assert.doesNotMatch(tm('zh','pantryReason',{owned:2,total:3}),/齐全|可做/);
});

test('tm replaces only supplied values and preserves a missing placeholder for review',()=>{
  assert.equal(tm('en','pantryReason',{owned:2,total:3}),'2 of 3 known required ingredients are in your pantry.');
  assert.match(tm('en','pantryReason',{owned:2}),/\{total\}/);
  assert.equal(tm('zh' satisfies Locale,'orderFor',{name:'Dry Martini'}),'点单：Dry Martini');
});
