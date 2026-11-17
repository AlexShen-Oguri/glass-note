import assert from 'node:assert/strict';
import test from 'node:test';
import {LOCALES} from '../domain/contracts';
import {guidedFlowText,type GuidedFlowKey} from './guided-flow';
import {orderCopy,type OrderKey} from './order';
import {makingText} from './making';
test('guided and order labels cover all eight locales and resolve pantry placeholders',()=>{
  const guided:GuidedFlowKey[]=['modeTitle','modeHint','drink','drinkHint','make','makeHint','changeMode','pantryLoading','pantryError','retry','emptyTitle','emptyBody','addIngredients','chooseFirst','fallbackNote','makeResultHint','ready','missing','baseReady','baseMissing','reviewDetails','noMakeTitle','noMakeBody','openPantry','switchDrink'];
  const order:OrderKey[]=['originalName','ingredients','requests','optional','brand','modification','sourceBrand','source','sourceVersion','details','hideDetails','showCard','closeCard','copyText','shareText','viewRecipe','addRequest','hideRequest','requestHint','simpleCardHint','copied','copyUnavailable','shared','shareCancelled','shareUnavailable','selectTextHint'];
  for(const locale of LOCALES) {
    for(const key of guided) assert.ok(guidedFlowText(locale,key,{count:2,ingredients:'A · B'}).trim().length>0);
    assert.ok(!guidedFlowText(locale,'missing',{count:2,ingredients:'A · B'}).includes('{'));
    for(const key of order) assert.ok(orderCopy(locale,key).trim().length>0);
    for(const key of ['prepareTitle','prepareIntro','missingReadyConfirm','completedIntro'] as const) assert.ok(makingText(locale,key).trim().length>0);
  }
  assert.equal(guidedFlowText('zh','drink'),'喝一杯');
  assert.notEqual(orderCopy('zh','shareCancelled'),orderCopy('zh','shared'));
});
