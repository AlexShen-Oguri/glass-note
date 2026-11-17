import {test, expect, type Page} from '@playwright/test';
import {build} from 'esbuild';
import type {GlassStage} from '../../src/features/discovery/sculpture.web';

type Liquid = {opacity:number;targetOpacity:number;surfaceOpacity:number;meniscusOpacity:number;
  volumeColour:string;surfaceColour:string;meniscusColour:string;volumeEmissive:string;surfaceEmissive:string;meniscusEmissive:string};
declare global {interface Window {glassTest:GlassStage & {getDebugState():{colour:string;targetColour:string;liquid:Liquid}}}}

async function openGlassFixture(page:Page){
  const bundle=await build({write:false,bundle:true,platform:'browser',format:'iife',stdin:{resolveDir:process.cwd(),contents:
    "import {createGlassStage} from './src/features/discovery/sculpture.web.js'; window.glassTest=createGlassStage(document.querySelector('#stage'),{paused:true});"}});
  const origin='http://127.0.0.1:4176',errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin!==origin)return route.abort();
    if(url.pathname==='/__glass-test.js')return route.fulfill({contentType:'application/javascript',body:bundle.outputFiles![0]!.text});
    if(url.pathname==='/__glass-test')return route.fulfill({contentType:'text/html',body:
      '<!DOCTYPE html><html><body style="margin:0;background:#0a1912"><div id="stage" style="width:320px;height:400px"></div><script src="/__glass-test.js"></script></body></html>'});
    return route.abort();
  });
  await page.goto('/__glass-test');
  expect(await page.evaluate(()=>window.glassTest.ready)).toBe(true);
  return errors;
}

test('the sensory glass starts clear, preserves selected colour and returns clear in every motion mode',async({page})=>{
  const errors=await openGlassFixture(page);
  const state=()=>page.evaluate(()=>window.glassTest.getDebugState());
  const settled=()=>expect.poll(async()=>{const s=await state();return s.colour===s.targetColour&&Math.abs(s.liquid.opacity-s.liquid.targetOpacity)<1e-6;}).toBe(true);
  const clear=async()=>{
    await expect.poll(async()=>(await state()).colour).toBe('#ffffff');
    await settled();const s=await state();
    expect(s.liquid.opacity).toBeCloseTo(.14,6);
    for(const key of ['volumeColour','surfaceColour','meniscusColour','volumeEmissive','surfaceEmissive','meniscusEmissive'] as const)expect(s.liquid[key]).toBe('#ffffff');
    expect(s.liquid.opacity).toBeGreaterThan(0);expect(s.liquid.surfaceOpacity).toBeGreaterThan(0);
    expect(s.liquid.surfaceOpacity).toBeLessThan(.4);expect(s.liquid.meniscusOpacity).toBeCloseTo(.24,6);
  };
  try{
    for(const mode of ['paused','reduced','running']){
      await page.evaluate(mode=>{window.glassTest.setPaused(mode==='paused');window.glassTest.setReduced(mode==='reduced');},mode);
      await clear();
      await page.evaluate(()=>window.glassTest.setFlavourState({aromas:['citrus']}));await settled();
      const citrus=await state();expect(citrus.colour).toBe('#cf962d');expect(citrus.liquid.opacity).toBeCloseTo(.90,6);
      expect(citrus.liquid.meniscusEmissive).toBe('#ebb264');expect(citrus.liquid.meniscusOpacity).toBe(.62);
      await page.evaluate(()=>window.glassTest.setFlavourState({strength:'none'}));await settled();
      const none=await state();expect(none.colour).not.toBe('#ffffff');expect(none.liquid.targetOpacity).toBe(.54);
      expect(none.liquid.opacity).toBeCloseTo(.54,6);expect(none.liquid.meniscusEmissive).toBe('#ebb264');
      await page.evaluate(()=>window.glassTest.setFlavourState({}));await clear();
      await expect(page.locator('.glass-stage-canvas')).toHaveCount(1);
    }
  }finally{await page.evaluate(()=>window.glassTest.dispose());}
  await expect(page.locator('.glass-stage-canvas')).toHaveCount(0);expect(errors).toEqual([]);
});

test('glass colour and opacity settle across slow frames while paused time stays frozen',async({page})=>{
  await page.clock.install({time:new Date('2026-10-16T12:00:00Z')});
  const errors=await openGlassFixture(page);
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+100));
  const state=()=>page.evaluate(()=>window.glassTest.getDebugState());
  // One callback per 500 ms models slow software rendering. fastForward also
  // exercises the real frame budget's deferred-paint cooldown between draws.
  const slowFrames=async()=>{for(let i=0;i<4;i++)await page.clock.fastForward(500);};
  try{
    await page.evaluate(()=>window.glassTest.setPaused(false));
    await page.clock.runFor(32);
    await page.evaluate(()=>window.glassTest.setFlavourState({aromas:['citrus']}));
    await slowFrames();
    const citrus=await state();
    expect(citrus.colour).toBe('#cf962d');expect(citrus.colour).toBe(citrus.targetColour);
    expect(citrus.liquid.opacity).toBeCloseTo(.90,6);
    expect(Math.abs(citrus.liquid.opacity-citrus.liquid.targetOpacity)).toBeLessThan(1e-6);

    await page.evaluate(()=>window.glassTest.setFlavourState({}));
    await page.clock.runFor(100);
    await page.evaluate(()=>window.glassTest.setPaused(true));
    const paused=await state();
    expect(paused.liquid.opacity).toBeGreaterThan(.14);
    await page.clock.fastForward(30_000);
    const stillPaused=await state();
    expect(stillPaused.colour).toBe(paused.colour);expect(stillPaused.liquid.opacity).toBe(paused.liquid.opacity);
    await page.evaluate(()=>window.glassTest.setPaused(false));
    await page.clock.runFor(32);
    expect((await state()).liquid.opacity).toBeGreaterThan(.14);
    await slowFrames();
    const clear=await state();
    expect(clear.colour).toBe('#ffffff');expect(clear.colour).toBe(clear.targetColour);
    expect(clear.liquid.opacity).toBeCloseTo(.14,6);
    expect(Math.abs(clear.liquid.opacity-clear.liquid.targetOpacity)).toBeLessThan(1e-6);
    await expect(page.locator('.glass-stage-canvas')).toHaveCount(1);
  }finally{await page.evaluate(()=>window.glassTest.dispose());}
  await expect(page.locator('.glass-stage-canvas')).toHaveCount(0);expect(errors).toEqual([]);
});
