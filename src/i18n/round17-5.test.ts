import assert from 'node:assert/strict';
import test from 'node:test';
import {LOCALES} from '../domain/contracts';
import {g175,type Guided175Key} from './round17-5-guided';
import {orderCopy,type Round175OrderKey} from './round17-5-order';
import {makingText} from './making';
test('round 17.5 labels cover all eight locales and resolve pantry placeholders',()=>{
  const guided:Guided175Key[]=['modeTitle','modeHint','drink','drinkHint','make','makeHint','changeMode','pantryLoading','pantryError','retry','emptyTitle','emptyBody','addIngredients','chooseFirst','fallbackNote','makeResultHint','ready','missing','baseReady','baseMissing','reviewDetails','noMakeTitle','noMakeBody','openPantry','switchDrink'];
  const order:Round175OrderKey[]=['originalName','ingredients','requests','optional','brand','modification','sourceBrand','source','sourceVersion','details','hideDetails','showCard','closeCard','copyText','shareText','viewRecipe','addRequest','hideRequest','requestHint','simpleCardHint','copied','copyUnavailable','shared','shareCancelled','shareUnavailable','selectTextHint'];
  for(const locale of LOCALES) {
    for(const key of guided) assert.ok(g175(locale,key,{count:2,ingredients:'A · B'}).trim().length>0);
    assert.ok(!g175(locale,'missing',{count:2,ingredients:'A · B'}).includes('{'));
    for(const key of order) assert.ok(orderCopy(locale,key).trim().length>0);
    for(const key of ['prepareTitle','prepareIntro','missingReadyConfirm','completedIntro'] as const) assert.ok(makingText(locale,key).trim().length>0);
  }
  assert.equal(g175('zh','drink'),'喝一杯');
  assert.notEqual(orderCopy('zh','shareCancelled'),orderCopy('zh','shared'));
});
