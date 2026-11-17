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

test('taste copy explains combination learning without attributing a whole-recipe verdict to every ingredient',()=>{
  const boundaries:Record<Locale,{combination:RegExp;ingredientBoundary:RegExp;similar:RegExp;privateBoundary:RegExp}>={
    en:{combination:/recipe combinations/i,ingredientBoundary:/does not mean liking every ingredient/i,similar:/similar recipe combinations/i,privateBoundary:/Browsing and private notes are never interpreted as preferences/},
    zh:{combination:/配方组合/,ingredientBoundary:/不代表喜欢其中的每种材料/,similar:/相似配方组合/,privateBoundary:/浏览行为和私人笔记绝不会被解读为偏好/},
    fr:{combination:/combinaisons de recettes/,ingredientBoundary:/ne signifie pas aimer chaque ingrédient/,similar:/combinaisons de recettes similaires/,privateBoundary:/navigation et les notes privées ne sont jamais interprétées comme des préférences/},
    de:{combination:/Rezeptkombinationen/,ingredientBoundary:/bedeutet nicht, jede Zutat zu mögen/,similar:/ähnlichen Rezeptkombinationen/,privateBoundary:/Aufrufe und private Notizen werden nie als Vorlieben interpretiert/},
    es:{combination:/combinaciones de recetas/,ingredientBoundary:/no significa que te guste cada ingrediente/,similar:/combinaciones de recetas similares/,privateBoundary:/navegación y las notas privadas nunca se interpretan como preferencias/},
    ko:{combination:/레시피 조합/,ingredientBoundary:/모든 재료를 좋아한다는 뜻은 아닙니다/,similar:/비슷한 레시피 조합/,privateBoundary:/탐색 기록과 비공개 메모는 취향으로 해석하지 않습니다/},
    ja:{combination:/レシピの組み合わせ/,ingredientBoundary:/すべての材料を好きという意味ではありません/,similar:/似たレシピの組み合わせ/,privateBoundary:/閲覧履歴や非公開メモを好みとして解釈することはありません/},
    it:{combination:/combinazioni di ricette/,ingredientBoundary:/non significa apprezzare ogni ingrediente/,similar:/combinazioni di ricette simili/,privateBoundary:/navigazione e le note private non vengono mai interpretate come preferenze/},
  };
  for(const locale of LOCALES){
    const expected=boundaries[locale];
    assert.match(tm(locale,'profileIntro'),expected.combination,`${locale} omits combination learning`);
    assert.match(tm(locale,'profileIntro'),expected.ingredientBoundary,`${locale} attributes whole-recipe feedback to every ingredient`);
    assert.match(tm(locale,'profileExactOnly'),expected.similar,`${locale} still limits whole-recipe verdicts to exact versions`);
    assert.match(tm(locale,'recordIntro'),expected.similar,`${locale} omits the effect of a saved verdict`);
    assert.match(tm(locale,'recordIntro'),expected.privateBoundary,`${locale} omits the private-note and browsing boundary`);
  }
});
