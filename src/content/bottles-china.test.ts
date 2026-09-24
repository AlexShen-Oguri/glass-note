import assert from 'node:assert/strict';
import test from 'node:test';
import {bottles,bottleBrands} from './bottles';
import {chinaMarketBottles,chinaMarketIngredients} from './bottles/china-market';
import {catalogue} from './catalogue';
import {bottleDisplayName} from '../domain/bottles/format';
import {scoreTextSearch,normalizeSearchText} from '../domain/search';
import {bottleMarketSummary,bottleMarketText} from '../i18n/bottle-market';
import {LOCALES} from '../domain/contracts';

test('China additions keep existing identities and resolve brand and material links',()=>{
 const additions=new Set(chinaMarketBottles.map(b=>b.id));
 assert.equal(bottles.filter(b=>!additions.has(b.id)).length,1028);
 const identities=bottles.map(b=>normalizeSearchText(`${b.brandName} ${b.name}`));
 assert.equal(new Set(identities).size,identities.length,'a regional listing must not duplicate a bottle');
 for(const b of chinaMarketBottles){
  assert.equal(bottles.filter(item=>item.id===b.id).length,1);
  assert.ok(bottleBrands.some(brand=>brand.id===b.brandId&&brand.name===b.brandName));
  assert.ok(b.ingredientIds.every(id=>catalogue.ingredients.some(i=>i.id===id)));
 }
 assert.equal(chinaMarketIngredients.some(i=>i.id==='spiced-rum'),false,'reuse existing ingredient rather than inventing a complete composition');
 assert.equal(catalogue.ingredients.find(i=>i.id==='spiced-rum')?.compositionKnown,false);
});

test('Chinese product queries rank the exact expression ahead of neighbouring bottles',()=>{
 const examples:readonly (readonly [string,string])[]=[['哥顿金酒','gordons-london-dry-gin'],['摩根船长金牌','captain-morgan-original-spiced-gold'],['斯米诺21','smirnoff-no-21-vodka'],['尊尼获加红牌','johnnie-walker-red-label'],['百加得金朗姆酒','bacardi-carta-oro'],['马天尼白味美思','martini-bianco-vermouth'],['豪帅快活金标','jose-cuervo-especial-gold']];
 for(const [query,id] of examples){
  const scores=bottles.map(b=>({id:b.id,score:scoreTextSearch(query!,[bottleDisplayName(b),b.name,b.brandName,...b.aliases])})).sort((a,b)=>b.score-a.score);
  assert.equal(scores[0]?.id,id,query);
  assert.ok(scores[0]!.score>0);
 }
});

test('regional evidence remains traceable and the UI distinguishes product from brand presence',()=>{
 for(const b of chinaMarketBottles){
  assert.ok(b.marketEvidence?.length,b.id);
  for(const source of b.marketEvidence!){
   assert.match(source.url,/^https:\/\//);
   assert.ok(source.title.trim());
   assert.ok(['product','brand'].includes(source.scope));
   assert.equal(new Date(source.checkedAt).toISOString().slice(0,10),source.checkedAt);
  }
 }
 const sample=chinaMarketBottles[0]!;
 for(const locale of LOCALES){
  const copy=bottleMarketText(locale);
  assert.ok(Object.values(copy).every(value=>value.trim()));
  assert.notEqual(copy.product,copy.brand);
  assert.equal(bottleMarketSummary({...sample,marketEvidence:[{...sample.marketEvidence![0]!,scope:'brand'}]},locale),copy.brand);
  assert.equal(bottleMarketSummary({...sample,marketEvidence:undefined},locale),sample.market);
 }
});
