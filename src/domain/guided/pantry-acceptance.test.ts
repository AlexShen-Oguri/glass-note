import assert from 'node:assert/strict';
import test from 'node:test';
import {isDeepStrictEqual} from 'node:util';
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
      // Independently enumerate the reviewed raw candidate sets, without using the resolver.
      const canonical=(id:string)=>catalogue.materialConcepts?.find(concept=>concept.memberIds.includes(id))?.id??id;
      const owned=new Set(pantry.ingredientIds.map(canonical));
      const unmet=version.ingredients.flatMap((row,index)=>{
        if(row.optional)return [];
        const rule=catalogue.materialRequirements?.find(item=>item.versionId===version.id&&item.rowIndex===index&&isDeepStrictEqual(item.originalRow,row));
        const choices=[...new Set((rule?.acceptedIngredientIds??[row.ingredientId]).map(canonical))];
        return choices.some(id=>owned.has(id))?[]:[choices];
      });
      const satisfies=(ids:string[])=>unmet.every(choices=>choices.some(id=>ids.includes(id)));
      const universe=[...new Set(unmet.flat())];
      const minimum=!unmet.length?0:universe.some(id=>satisfies([id]))?1:
        universe.some((id,index)=>universe.slice(index+1).some(other=>satisfies([id,other])))?2:3;
      const missing=result.pantryMatch.missingIngredientIds;
      assert.equal(missing.length,minimum);
      assert.equal(new Set(missing).size,missing.length);
      assert(missing.every(id=>canonical(id)===id));
      assert(satisfies(missing));
      assert.ok(missing.length<3);
      const tier=(result.pantryMatch.baseReady?0:3)+missing.length;
      assert.ok(tier>=previous); previous=tier;
    }
  }
});
