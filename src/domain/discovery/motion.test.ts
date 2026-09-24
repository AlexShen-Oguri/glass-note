import assert from 'node:assert/strict';
import test from 'node:test';
import {motionEnabled, transitionDuration} from './motion';
test('motion stays static until preferences and system settings are known and allowed',()=>{
  assert.equal(motionEnabled(false,true,false,false),false);
  assert.equal(motionEnabled(true,false,false,false),false);
  assert.equal(motionEnabled(true,true,true,false),false);
  assert.equal(motionEnabled(true,true,false,true),false);
  assert.equal(motionEnabled(true,true,false,false),true);
  assert.ok(transitionDuration.page>=600&&transitionDuration.page<=800);
  assert.ok(transitionDuration.completion>transitionDuration.page);
  assert.ok(transitionDuration.step<transitionDuration.page);
});
