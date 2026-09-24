import assert from 'node:assert/strict';
import test from 'node:test';
import {bottles} from '../../content/bottles';
import {catalogue} from '../../content/catalogue';
import {ginComparisonPilot} from '../../content/gin-comparison-pilot';
import {
  bottleComparisonProjectDraft,
  bottleComparisonRecipePreview,
  type BottleComparisonRecipePreview,
} from '../lab/bottleComparison';

const selected=ginComparisonPilot.bottles.map(record=>bottles.find(bottle=>bottle.id===record.bottleId)!);
const sourceVersion=catalogue.versions.find(version=>version.id===ginComparisonPilot.versionId)!;

test('same ingredient appearing twice is retained while only the explicitly selected row is bottle-bound',()=>{
  const duplicateGinVersion={
    ...sourceVersion,
    ingredients:[sourceVersion.ingredients[0]!,{...sourceVersion.ingredients[0]!,amount:0.25},sourceVersion.ingredients[1]!],
  };
  const sourceInputBefore=JSON.stringify(duplicateGinVersion);
  const draft=bottleComparisonProjectDraft(catalogue,selected,'en',{
    kind:'recipe',version:duplicateGinVersion,targetIngredientIndex:1,
  });
  const sourceSnapshotBefore=JSON.stringify(draft.source);
  const preview=bottleComparisonRecipePreview(draft,1);

  assert.deepEqual(preview.versions.map(version=>version.changedRowIndexes),[[1],[1],[1]]);
  for(const version of preview.versions){
    assert.equal(version.ingredients.length,3);
    assert.equal(version.ingredients[0]!.ingredientId,'gin');
    assert.equal(version.ingredients[0]!.bottleId,undefined,'the first duplicate gin row was not selected');
    assert.equal(version.ingredients[1]!.ingredientId,'gin');
    assert.equal(version.ingredients[1]!.bottleId,version.bottleId);
    assert.deepEqual(version.ingredients[2],draft.source!.ingredients[2]);
  }
  assert.equal(JSON.stringify(duplicateGinVersion),sourceInputBefore);
  assert.equal(JSON.stringify(draft.source),sourceSnapshotBefore);

  preview.source.ingredients[0]!.name='preview-only mutation';
  assert.equal(JSON.stringify(draft.source),sourceSnapshotBefore,'the display preview must not alias the source snapshot');
});

test('malformed comparisons fail before a preview can be partially accepted',()=>{
  const ginRow=sourceVersion.ingredients.findIndex(ingredient=>ingredient.ingredientId==='gin');
  const valid=bottleComparisonProjectDraft(catalogue,selected,'en',{
    kind:'recipe',version:sourceVersion,targetIngredientIndex:ginRow,
  });
  const sourceSnapshotBefore=JSON.stringify(valid.source);
  const malformed={
    ...valid,
    versions:valid.versions.map((version,index)=>index===1?{
      ...version,
      ingredients:version.ingredients.map((ingredient,row)=>row===ginRow?ingredient:{...ingredient,name:'silently changed'}),
    }:version),
  };
  const accepted:BottleComparisonRecipePreview[]=[];
  assert.throws(()=>accepted.push(bottleComparisonRecipePreview(malformed,ginRow)),/comparison-preview-multiple-changes/);
  assert.deepEqual(accepted,[]);
  assert.equal(JSON.stringify(valid.source),sourceSnapshotBefore);
});

test('a failed draft build leaves source inputs unchanged and yields no partial versions',()=>{
  const ginRow=sourceVersion.ingredients.findIndex(ingredient=>ingredient.ingredientId==='gin');
  const incompatible={...selected[0]!,ingredientIds:['rum']};
  const sourceInputBefore=JSON.stringify(sourceVersion);
  let draft:ReturnType<typeof bottleComparisonProjectDraft>|undefined;
  assert.throws(()=>{
    draft=bottleComparisonProjectDraft(catalogue,[incompatible,selected[1]!],'en',{
      kind:'recipe',version:sourceVersion,targetIngredientIndex:ginRow,
    });
  },/comparison-incompatible-replacement/);
  assert.equal(draft,undefined);
  assert.equal(JSON.stringify(sourceVersion),sourceInputBefore);
});
