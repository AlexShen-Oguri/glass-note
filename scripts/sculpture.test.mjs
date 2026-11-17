import assert from 'node:assert/strict';
import {test} from 'node:test';
import {sampleSensoryWave} from '../src/features/discovery/sculpture.web.js';
import {createGlassFrameBudget} from '../src/features/discovery/glass-frame-budget.web.js';

test('a DPR 1 software renderer downscales promptly and leaves input time at its floor',()=>{
  const budget=createGlassFrameBudget(1);
  budget.recordRender(1240,1240);
  assert.equal(budget.pixelRatio,1);
  budget.recordRender(1240,2580);
  assert.equal(budget.pixelRatio,.5);
  assert.equal(budget.canRender(2630),false);
  assert.equal(budget.canRender(2680),true);
  for(let frame=0;frame<120;frame++)budget.recordRender(310,3000+frame*410);
  assert.equal(budget.pixelRatio,.5);
  assert.equal(budget.canRender(3000+119*410+50),false);
  assert.equal(budget.canRender(3000+119*410+100),true);
});

test('fast rendering and isolated shader or GC spikes preserve display resolution and cadence',()=>{
  const budget=createGlassFrameBudget(1.6);
  for(let frame=0;frame<120;frame++){
    const end=frame*17;
    budget.recordRender(frame===4?200:4,end);
    assert.equal(budget.canRender(end+101),true);
    if(frame!==4)assert.equal(budget.canRender(end),true);
  }
  assert.equal(budget.pixelRatio,1.6);
});

test('deferred GPU paint stalls also downscale when JS render calls return quickly',()=>{
  const budget=createGlassFrameBudget(1);
  budget.recordRender(2,2);
  budget.recordPaintInterval(1240,1240);
  assert.equal(budget.pixelRatio,1);
  assert.equal(budget.canRender(1290),false);
  assert.equal(budget.canRender(1340),true);
  budget.recordRender(2,1342);
  budget.recordPaintInterval(1240,2580);
  assert.equal(budget.pixelRatio,.5);
  assert.equal(budget.canRender(2630),false);
  assert.equal(budget.canRender(2680),true);
  // An isolated late paint is not evidence that a fast GPU needs lower quality.
  const fast=createGlassFrameBudget(1.6);
  for(const gap of [16,16,400,16,16]){fast.recordRender(2,1000);fast.recordPaintInterval(gap,1000);}
  assert.equal(fast.pixelRatio,1.6);
});

test('Sensory waves persist, remain bounded and blend strength without late phase jumps',()=>{
// Selected patterns remain active after the entrance pulse (3–4 seconds).
// The CPU sampler is also what keeps garnish and foam on the shader surface.
const emptyTaste=Array(6).fill(0),emptyStyle=Array(4).fill(0);
const field=(time,tastes,style)=>Array.from({length:49},(_,i)=>{
 const x=(i%7-3)*.28,z=(Math.floor(i/7)-3)*.28;
 return sampleSensoryWave(x,z,time,tastes,style);
});
assert.ok(field(20,emptyTaste,emptyStyle).every(v=>v===0));
for(let i=0;i<6;i++){
 const selected=[...emptyTaste];selected[i]=1;
 for(const time of [10,20,30]){
  const values=field(time,selected,emptyStyle);
  assert.ok(values.some(v=>Math.abs(v)>.0007),`Taste ${i} stopped at ${time}s`);
 }
 assert.ok(sampleSensoryWave(.5,.3,20,selected,emptyStyle,0)===0);
}
for(let i=1;i<4;i++){
 const selected=[...emptyStyle];selected[i]=1;
 assert.ok(field(30,emptyTaste,selected).some(v=>Math.abs(v)>.02));
 assert.notDeepEqual(field(10,emptyTaste,selected),field(20,emptyTaste,selected));
}
// Strength keeps the same wave vocabulary with stronger visible body motion.
const bodyLow=field(20,emptyTaste,[.30,0,0,0]);
const bodyStrong=field(20,emptyTaste,[1,0,0,0]);
const rms=v=>Math.sqrt(v.reduce((sum,n)=>sum+n*n,0)/v.length);
assert.ok(rms(bodyStrong)>rms(bodyLow)*2);
// Even combined choices stay within the modeled bowl's wave clearance.
for(let mask=0;mask<64;mask++)for(let approach=0;approach<4;approach++){
 const tastes=emptyTaste.map((_,i)=>Number(Boolean(mask&(1<<i))));
 const style=[1,Number(approach===1),Number(approach===2),Number(approach===3)];
 for(const time of [10,20,30])assert.ok(field(time,tastes,style).every(v=>Number.isFinite(v)&&Math.abs(v)<=.075));
}
console.log('Persistent taste / strength / first-sip fields and reduced motion: passed.');

// Real regressions appear after the page has been open for a while: the old
// frequency × total elapsed expression raced through cycles during a selection.
let largestStrengthStep=0;
for(const elapsed of [0,120,600,3600])for(const from of [.08,.30,.47,.60,.83,1])for(const to of [.08,.30,.60,1]){
 let previous=field(elapsed,emptyTaste,[from,0,0,0]);
 for(let frame=1;frame<=39;frame++){
  const progress=frame/39,ease=1-(1-progress)**3;
  const values=field(elapsed+frame/60,emptyTaste,[from+(to-from)*ease,0,0,0]);
  const step=Math.max(...values.map((v,i)=>Math.abs(v-previous[i])));
  largestStrengthStep=Math.max(largestStrengthStep,step);
  assert.ok(step<.003,`Strength blend jumped ${step} at page age ${elapsed}s`);
  previous=values;
 }
}
console.log(`Late and interrupted strength blends: passed (max frame step ${largestStrengthStep.toFixed(5)}).`);

});
