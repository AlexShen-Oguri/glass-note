import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogue} from './catalogue';
import {bottles} from './bottles';
import {bottleDisplayName} from '../domain/bottles/format';
import {searchCocktails,scoreTextSearch} from '../domain/search';

test('real catalogue accepts regional names and spelling errors without changing source-version filters',()=>{
  const ids=(text:string)=>searchCocktails(catalogue,{text}).map(r=>r.cocktailId);
  assert.ok(ids('阿佩罗橙光').includes('spritz'));
  assert.ok(ids('斯普利兹').includes('spritz'));
  assert.ok(ids('Aperol Spritz').includes('spritz'));
  assert.ok(ids('尼格罗呢').includes('negroni'));
  assert.ok(ids('Negrnoi').includes('negroni'));
  assert.deepEqual(ids('mojto'),['mojito','mojito-mocktail']);
  assert.deepEqual(ids('金汤力'),['gin-and-tonic']);
  const martini=ids('马提尼').slice(0,6);
  assert.ok(martini.includes('dry-martini'));
  assert.ok(!martini.includes('mai-tai')&&!martini.includes('three-dots-and-a-dash'),'a Martinique ingredient mention must not outrank a Martini name');
  assert.deepEqual(searchCocktails(catalogue,{text:'Negrnoi',bases:['rum']}).map(r=>r.cocktailId).sort(),['east-india-negroni','kingston-negroni']);
  assert.ok(!searchCocktails(catalogue,{text:'Negrnoi',bases:['rum']}).some(r=>r.cocktailId==='negroni'),'classic gin version must not match rum');
  assert.deepEqual(ids('mojito whiskey'),[]);
});

test('expanded real bottle names use typo tolerance without making short text indiscriminate',()=>{
  const scores=(text:string)=>bottles.map(b=>({b,score:scoreTextSearch(text,[bottleDisplayName(b),b.name,b.brandName,...b.aliases])})).filter(r=>r.score>0).sort((a,b)=>b.score-a.score);
  const results=scores('Smirnof');
  assert.ok(results.length>0);
  assert.ok(results.slice(0,3).every(r=>/smirnoff/i.test(r.b.brandName)));
  assert.ok(scores('gni').length<10,'three-character input must not fuzzy-match every gin');
  assert.ok(scores('Macallan 15').some(r=>r.b.id==='macallan-15-year-old-double-cask-single-malt-scotch-whisky'));
  for(const query of ['百加得','百家得','bai jia de']){
    const found=scores(query);
    assert.ok(found.length>0,query);
    assert.ok(found.slice(0,3).every(r=>r.b.brandId==='brand-bacardi'),query+' must prefer Bacardi');
  }
  assert.ok(scores('麦卡伦').slice(0,3).every(r=>r.b.brandId==='brand-macallan'));
});
