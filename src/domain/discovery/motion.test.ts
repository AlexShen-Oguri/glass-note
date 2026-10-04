import assert from 'node:assert/strict';
import test from 'node:test';
import {motionEnabled, transitionDuration} from './motion';
test('motion stays static until preferences and system settings are known and allowed',()=>{
  assert.equal(motionEnabled(false,true,false,false),false);
  assert.equal(motionEnabled(true,false,false,false),false);
  assert.equal(motionEnabled(true,true,true,false),false);
  assert.equal(motionEnabled(true,true,false,true),false);
  assert.equal(motionEnabled(true,true,false,false),true);
  assert.ok(transitionDuration.page>=300&&transitionDuration.page<=500);
  assert.ok(transitionDuration.completion>=180&&transitionDuration.completion<=300);
  assert.ok(transitionDuration.selection>=160&&transitionDuration.selection<=240);
  assert.ok(transitionDuration.step<transitionDuration.page);
});
