import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue as original} from '../../content/catalogue';
import {recipeSnapshot} from '../making';
import type {Catalogue,RecipeIngredient} from '../contracts';
import * as shoppingModule from './index';
const shopping=shoppingModule as any;
const pantry={ingredientIds:[],brandsByIngredient:{}};
function fixture(rows:RecipeIngredient[]){
 const source=original.versions[0]!,version={...source,id:'shopping-test',ingredients:rows};
 const cocktail={...original.cocktails.find(c=>c.id===source.cocktailId)!,versionIds:[version.id],defaultVersionId:version.id};
 const catalogue:Catalogue={...original,versions:[version],cocktails:[cocktail]};
 return {catalogue,recipe:recipeSnapshot(catalogue,version.id)!};
}
function add(rows:RecipeIngredient[]){assert.equal(typeof shopping.addShoppingTarget,'function','shopping targets must be implemented');const f=fixture(rows);return {...f,state:shopping.addShoppingTarget(shopping.emptyShoppingState(),f.catalogue,f.recipe,pantry)};}
test('shopping covers arbitrary missing required rows and deduplicates whisky and saline without flavour collapse',()=>{
 const {state}=add(['scotch-whisky','bourbon-whiskey','saline-solution','saline-twenty-percent','orange-flavoured-gin','gin'].map(ingredientId=>({ingredientId,amount:10,unit:'ml'})));
 assert.deepEqual(state.items.map((i:any)=>i.ingredientId).sort(),['food-generic-whisky','gin','orange-flavoured-gin','saline-solution'].sort());
 assert.equal(state.targets[0].rows.length,6);assert(state.items.every((i:any)=>!i.bought));
});
test('owned canonical supplies and optional rows produce no shopping items',()=>{
 assert.equal(typeof shopping.addShoppingTarget,'function');const f=fixture([{ingredientId:'scotch-whisky',amount:10,unit:'ml'},{ingredientId:'gin',amount:10,unit:'ml',optional:true}]);
 const state=shopping.addShoppingTarget(shopping.emptyShoppingState(),f.catalogue,f.recipe,{ingredientIds:['bourbon-whiskey'],brandsByIngredient:{}});
 assert.equal(state.items.length,0);assert.equal(state.targets.length,1);
});
test('OR buys one actual candidate and selection survives parse and later catalogue edits',()=>{
 assert.equal(typeof shopping.addShoppingTarget,'function');const f=fixture([{ingredientId:'food-vermouth',amount:10,unit:'ml'}]);
 f.catalogue.materialRequirements=[{versionId:f.recipe.version.id,rowIndex:0,originalRow:structuredClone(f.recipe.version.ingredients[0]!),sourceName:f.recipe.title,acceptedIngredientIds:['sweet-red-vermouth','bianco-vermouth']}];
 const initial=shopping.addShoppingTarget(shopping.emptyShoppingState(),f.catalogue,f.recipe,pantry),target=initial.targets[0];
 assert.deepEqual(initial.items.map((i:any)=>i.ingredientId),['sweet-red-vermouth']);
 const chosen=shopping.selectShoppingAlternative(initial,target.id,target.rows[0].rowId,'bianco-vermouth');
 f.catalogue.materialRequirements=[];
 assert.deepEqual(shopping.parseShoppingState(JSON.stringify(chosen)),chosen);
 assert.deepEqual(chosen.items.map((i:any)=>i.ingredientId),['bianco-vermouth']);
 assert.deepEqual(shopping.addShoppingTarget(chosen,f.catalogue,f.recipe,pantry),chosen);
});
test('removed items stay removed on reload and re-adding the same target; adding a new target preserves bought state',()=>{
 const f=add([{ingredientId:'gin',amount:10,unit:'ml'},{ingredientId:'sweet-red-vermouth',amount:10,unit:'ml'}]);
 const bought=shopping.planShoppingPurchase(f.state,pantry,f.state.items[0].id,f.catalogue);
 const removed=shopping.removeShoppingItem(bought.shopping,f.state.items[1].id);
 assert.equal(removed.items.length,1);assert(removed.items[0].bought);
 assert.deepEqual(shopping.addShoppingTarget(shopping.parseShoppingState(JSON.stringify(removed)),f.catalogue,f.recipe,pantry),removed);
 const nextRecipe=structuredClone(f.recipe);nextRecipe.version.id='another-shopping-target';
 const added=shopping.addShoppingTarget(removed,f.catalogue,nextRecipe,pantry);
 assert(added.items.find((i:any)=>i.ingredientId==='gin').bought);assert.equal(added.targets.length,2);
 const withoutFirst=shopping.removeShoppingTarget(added,added.targets[0].id);assert.equal(withoutFirst.targets.length,1);assert(withoutFirst.items.find((i:any)=>i.ingredientId==='gin').bought);
});
test('purchase is idempotent even after deliberate later pantry removal and locks alternatives once bought',()=>{
 const f=add([{ingredientId:'gin',amount:10,unit:'ml'}]),id=f.state.items[0].id;
 const purchase=shopping.planShoppingPurchase(f.state,pantry,id,f.catalogue);
 assert.deepEqual(purchase.pantry.ingredientIds,['gin']);assert(purchase.shopping.items[0].bought);
 const repeat=shopping.planShoppingPurchase(purchase.shopping,pantry,id,f.catalogue);
 assert.deepEqual(repeat.pantry,pantry);assert(repeat.alreadyBought);
 assert.throws(()=>shopping.selectShoppingAlternative(purchase.shopping,f.state.targets[0].id,f.state.targets[0].rows[0].rowId,'gin'),/bought/);
});
test('frozen unknown imports retain their identities and cannot be purchased or rebound',()=>{
 const f=add([{ingredientId:'future-material',amount:10,unit:'ml'}]);
 assert.equal(f.state.items[0].ingredientId,'future-material');assert.equal(f.state.items[0].known,false);
 assert.deepEqual(shopping.parseShoppingState(JSON.stringify(f.state)),f.state);
 assert.throws(()=>shopping.planShoppingPurchase(f.state,pantry,f.state.items[0].id,f.catalogue),/unavailable/);
});
test('strict reader rejects altered recipe fingerprints, dangling references, bad candidates and oversize data',()=>{
 const f=add([{ingredientId:'gin',amount:10,unit:'ml'}]);
 const bad=structuredClone(f.state);bad.targets[0].recipe.title.en='Changed';assert.throws(()=>shopping.validateShoppingState(bad),/fingerprint/);
 const dangling=structuredClone(f.state);dangling.items[0].refs[0].targetId='missing';assert.throws(()=>shopping.validateShoppingState(dangling),/reference/);
 const malformed=structuredClone(f.state);malformed.targets[0].rows[0].candidates[0].known='yes';assert.throws(()=>shopping.validateShoppingState(malformed));
 assert.throws(()=>shopping.parseShoppingState(' '.repeat(5_000_001)),/large/);
});

test('frozen source row labels survive display edits and ignore stale full-row overlays',()=>{
 assert.equal(typeof shopping.addShoppingTarget,'function');const f=fixture([{ingredientId:'scotch-whisky',amount:10,unit:'ml'}]),sourceName={...f.recipe.title,en:'Source calls for whisky'};
 f.catalogue.materialRequirements=[{versionId:f.recipe.version.id,rowIndex:0,originalRow:structuredClone(f.recipe.version.ingredients[0]!),sourceName}];
 const saved=shopping.addShoppingTarget(shopping.emptyShoppingState(),f.catalogue,f.recipe,pantry);
 assert.equal(saved.targets[0].rows[0].sourceName?.en,'Source calls for whisky');sourceName.en='Later catalogue label';
 assert.equal(shopping.parseShoppingState(JSON.stringify(saved)).targets[0].rows[0].sourceName.en,'Source calls for whisky');
 f.catalogue.materialRequirements[0]!.originalRow.amount=99;
 const stale=shopping.addShoppingTarget(shopping.emptyShoppingState(),f.catalogue,f.recipe,pantry);assert.equal(stale.targets[0].rows[0].sourceName.en,f.recipe.ingredientNames['scotch-whisky']!.en);
});
test('reader rejects more than 500 targets and edits reject more than 5000 total source row references',()=>{
 const f=add([{ingredientId:'gin',amount:10,unit:'ml'}]);
 const many=structuredClone(f.state);many.targets=Array.from({length:501},(_,index)=>({...many.targets[0],id:`target-${index}`}));many.items[0].refs=many.targets.map((t:any)=>({targetId:t.id,rowId:t.rows[0].rowId}));
 assert.throws(()=>shopping.validateShoppingState(many),/target.*limit/);
 const a=fixture(Array.from({length:2501},()=>({ingredientId:'gin',amount:10,unit:'ml'}))),b=fixture(Array.from({length:2501},()=>({ingredientId:'scotch-whisky',amount:10,unit:'ml'})));
 b.recipe.version.id='second-large-target';const first=shopping.addShoppingTarget(shopping.emptyShoppingState(),a.catalogue,a.recipe,pantry);
 assert.throws(()=>shopping.addShoppingTarget(first,b.catalogue,b.recipe,pantry),/reference.*limit/);
});

test('unsafe recipe snapshot map properties reject before adding or reading a target',()=>{
 const f=fixture([{ingredientId:'gin',amount:10,unit:'ml',brandId:'constructor'}]);f.recipe.brandNames={constructor:'Unsafe brand'};
 assert.throws(()=>shopping.addShoppingTarget(shopping.emptyShoppingState(),f.catalogue,f.recipe,pantry),/unsafe property constructor/);
 const good=add([{ingredientId:'gin',amount:10,unit:'ml'}]),bad=structuredClone(good.state);bad.targets[0].recipe=f.recipe;bad.targets[0].fingerprint=recipeFingerprintForUnsafe(f.recipe);
 assert.throws(()=>shopping.parseShoppingState(JSON.stringify(bad)),/unsafe property constructor/);
});
import {recipeFingerprint as recipeFingerprintForUnsafe} from '../making';
