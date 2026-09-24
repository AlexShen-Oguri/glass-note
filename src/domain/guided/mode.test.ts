import assert from 'node:assert/strict';
import test from 'node:test';
import {pantryAccess,needsPantryPrompt} from './mode';
test('empty cupboard is only known after both stores load without error',()=>{
  const ready={hydrated:true};
  assert.equal(pantryAccess(ready,{hydrated:false},0),'loading');
  assert.equal(pantryAccess({hydrated:false,error:'read'},ready,0),'error');
  assert.equal(pantryAccess(ready,{hydrated:true,error:'write'},4),'error');
  assert.equal(pantryAccess(ready,ready,0),'empty');
  assert.equal(pantryAccess(ready,ready,1),'ready');
});
test('explicit empty-cupboard fallback cannot bypass loading or errors',()=>{
  assert.equal(needsPantryPrompt('empty',false),true);
  assert.equal(needsPantryPrompt('empty',true),false);
  assert.equal(needsPantryPrompt('loading',true),true);
  assert.equal(needsPantryPrompt('error',true),true);
  assert.equal(needsPantryPrompt('ready',false),false);
});
