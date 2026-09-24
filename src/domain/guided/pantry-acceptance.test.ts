import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from '../../content/catalogue';
import {emptyTasteState} from '../taste';
import {matchVersion} from '../search';
import {rankForPantry,diversifyPantryResults} from './pantry-ranking';

test('real catalogue pantry candidates enforce exact-version filters, unique drinks and base-first tiers',()=>{
  const pantry={ingredientIds:['gin','lemon-juice','sugar-syrup'],brandsByIngredient:{}};
  const queries=[{}, {flavours:['floral'] as const}, {strengths:['none'] as const,excluded:['egg'] as const}];
  for (const queryValue of queries) {
    const query=JSON.parse(JSON.stringify(queryValue));
    const results=diversifyPantryResults(catalogue,rankForPantry(catalogue,query,emptyTasteState(),{},[],pantry));
    assert.equal(new Set(results.map(r=>r.cocktailId)).size,results.length);
    let previous=-1;
    for(const result of results) {
      const version=catalogue.versions.find(v=>v.id===result.selectedVersionId)!;
      assert.equal(matchVersion(catalogue,version,query),true);
      const missing=[...new Set(version.ingredients.filter(r=>!r.optional&&!pantry.ingredientIds.includes(r.ingredientId)).map(r=>r.ingredientId))];
      assert.deepEqual(result.pantryMatch.missingIngredientIds,missing);
      assert.ok(missing.length<3);
      const tier=(result.pantryMatch.baseReady?0:3)+missing.length;
      assert.ok(tier>=previous); previous=tier;
    }
  }
});
