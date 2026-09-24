import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from '../../content/catalogue';
import {bottles} from '../../content/bottles';
import {estimateRecipeAbv} from './recipe-abv';

test('ABV uses exact source quantities and matching bottle sources without mutating recipes',()=>{
  const recipe=catalogue.versions.find(item=>item.id==='negroni-iba')!;
  const before=JSON.stringify(recipe),result=estimateRecipeAbv(recipe,catalogue,bottles);
  assert.ok(result&&result.low>0&&result.high>=result.low&&result.high<=100);
  assert.ok(result.sources.length>0);assert.equal(JSON.stringify(recipe),before);
  assert.equal(estimateRecipeAbv({...recipe,ingredients:[{ingredientId:'gin',amount:null,unit:'top'}]},catalogue,bottles),null);
  assert.equal(estimateRecipeAbv({...recipe,ingredients:[{ingredientId:'gin',amount:20,unit:'g'}]},catalogue,bottles),null);
  assert.equal(estimateRecipeAbv({...recipe,ingredients:[{ingredientId:'unknown-compound',amount:20,unit:'ml'}]},catalogue,bottles),null);
  assert.equal(estimateRecipeAbv({...recipe,ingredients:[{ingredientId:'gin',brandId:'unknown-brand',amount:20,unit:'ml'}]},catalogue,bottles),null);
});
