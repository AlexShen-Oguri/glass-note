import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from '../../content/catalogue';
import {pantryMatches} from './index';
import {searchCocktails} from '../search';
import {preparationStatus} from '../preparations';

test('owning every listed material and specified brand does not promise an undisclosed preparation',()=>{
  const version=catalogue.versions.find(v=>v.id==='uchimizu-batch-h')!;
  const brandsByIngredient:Record<string,string[]>={};
  for(const row of version.ingredients)if(row.brandId)brandsByIngredient[row.ingredientId]=[...(brandsByIngredient[row.ingredientId]??[]),row.brandId];
  const match=pantryMatches(catalogue,{ingredientIds:version.ingredients.map(i=>i.ingredientId),brandsByIngredient}).find(m=>m.versionId===version.id)!;
  assert.ok(match);assert.equal(match.missingIngredientIds.length,0);assert.equal(match.unconfirmedBrands.length,0);
  assert.equal(match.status,'preparation-check');assert.equal(match.preparationNeedsReview,true);
});
test('preparation filter requires positive evidence for each matching source version',()=>{
  const results=searchCocktails(catalogue,{preparationDisclosed:true});
  assert.ok(results.length>0);assert.ok(results.length<catalogue.cocktails.length);
  for(const result of results)for(const id of result.versionIds)assert.equal(preparationStatus(id),'disclosed');
  assert.ok(!results.some(result=>result.versionIds.includes('uchimizu-batch-h')));
  assert.ok(!results.some(result=>result.versionIds.includes('gimlet-batch-e')));
});
