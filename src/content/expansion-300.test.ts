import {deepEqual,equal,ok} from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {bottles} from './bottles';
import {catalogue} from './catalogue';
import {addedBottles,addedBottleIngredients} from './bottles/expansion-300';
import {recipeFingerprint,recipeSnapshot} from '../domain/making';
import {bottleDisplayName} from '../domain/bottles/format';
const baseline=JSON.parse(readFileSync('research/bottles/expansion-100-300/baseline.json','utf8'));

test('six major base spirit families gain exactly 50 unique products each',()=>{
  equal(addedBottles.length,300);
  equal(bottles.length,baseline.bottles.length+300);
  equal(new Set(addedBottles.map(b=>b.id)).size,300);
  for(const family of ['gin','rum','tequila','whiskey','vodka','brandy'])equal(addedBottles.filter(b=>b.family===family).length,50,family);
  for(const bottle of addedBottles)ok(!baseline.bottles.some((old:any)=>old.id===bottle.id));
  for(const old of baseline.bottles){
    const bottle=bottles.find(b=>b.id===old.id)!;
    ok(bottle,old.id);equal(bottleDisplayName(bottle),old.name);equal(bottle.family,old.family);equal(bottle.brandName,old.brandName);
  }
});

test('bottle additions preserve every previously saved recipe fingerprint',()=>{
  equal(baseline.versions.length,271);
  for(const old of baseline.versions)equal(recipeFingerprint(recipeSnapshot(catalogue,old.id)!),old.fingerprint,old.id);
});

test('flavoured products do not grant ownership of plain vodka and ABV conflicts remain unknown',()=>{
  for(const ingredient of addedBottleIngredients)equal(ingredient.compositionKnown,false,ingredient.id);
  for(const id of ['absolut-pears-producer','absolut-raspberri-producer','makers-mark-cask-strength-kentucky-straight-bourbon-whisky',
    'penelope-barrel-strength-bourbon-whiskey','bowmore-15-year-old-sherry-oak-cask-islay-single-malt-scotch-whisky']){
    const bottle=addedBottles.find(b=>b.id===id);ok(bottle,id);equal(bottle.abv,null,id);
  }
  deepEqual(addedBottles.find(b=>b.id==='absolut-apeach-producer')!.ingredientIds,['peach-vodka']);
  deepEqual(addedBottles.find(b=>b.id==='woodford-reserve-kentucky-straight-wheat-whiskey')!.ingredientIds,['wheat-whiskey']);
  equal(addedBottles.filter(b=>/Hennessy XO/.test(b.name)).length,1,'decorative packaging is not a second product');
  equal(addedBottles.filter(b=>/Ararat/.test(b.name)).length,1,'reject mislabeled duplicate 5-year bottle');
});
