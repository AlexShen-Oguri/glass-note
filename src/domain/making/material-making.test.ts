import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue as catalogueData} from '../../content/catalogue';
import {bottles as bottleData} from '../../content/bottles';
import type {Catalogue,RecipeIngredient} from '../contracts';
import * as making from '.';
import type {Bottle} from '../bottles/types';
import type {MakingContext, MakingState} from './types';

const now='2026-10-12T12:00:00Z',later='2026-10-12T12:01:00Z';
function fixture(rows:RecipeIngredient[]=[{ingredientId:'scotch-whisky',amount:30,unit:'ml'}]):MakingContext {
  const source=catalogueData.versions.find(version=>version.ingredients.some(row=>row.ingredientId==='scotch-whisky'))!;
  const version={...source,id:'material-test',ingredients:rows};
  const cocktail={...catalogueData.cocktails.find(value=>value.id===source.cocktailId)!,versionIds:[version.id],defaultVersionId:version.id};
  const catalogue:Catalogue={...catalogueData,versions:[version],cocktails:[cocktail]};
  return {catalogue,pantry:{ingredientIds:['bourbon-whiskey'],brandsByIngredient:{}},ownedBottleIds:[],bottles:[],making:{format:'glass-notes-making',schemaVersion:2,stock:[{ingredientId:'bourbon-whiskey',amount:60,unit:'ml'}],sessions:[],reviews:[]}};
}
function complete(context:MakingContext,legacy=false) {
  const recipe=making.recipeSnapshot(context.catalogue,context.catalogue.versions[0]!.id)!;
  const session=legacy?making.createSession(recipe,'batch',now):making.createSession(recipe,'batch',now,context);
  return making.updateSession(session,{checkedRows:recipe.version.ingredients.map((_,index)=>making.rowId(recipe,index)),completed:true},later);
}

test('an explicitly allowed génépy alternative does not require the source Chartreuse brand',()=>{
  const ctx=fixture();ctx.catalogue=catalogueData;
  ctx.pantry={ingredientIds:['genepy-liqueur'],brandsByIngredient:{}};
  ctx.making.stock=[{ingredientId:'genepy-liqueur',amount:20,unit:'ml'}];
  const recipe=making.recipeSnapshot(ctx.catalogue,'carino-batch-j')!,id=making.rowId(recipe,1);
  const availability=making.evaluateVersion(ctx,recipe.version.id).rows[1]!;
  assert(!availability.issues.includes('brand-unconfirmed'));
  assert(!availability.issues.includes('quantity-unknown'));
  const initial=making.createSession(recipe,'carino-alternative',now,ctx);
  assert.deepEqual(making.sessionSupplyOptions(initial,ctx,id),[{ingredientId:'genepy-liqueur'}]);
  const session=making.updateSession(initial,{checkedRows:[id],completed:true},later,ctx);
  const state={...ctx.making,sessions:[session]};
  assert.deepEqual(making.planConsumption(session,state,[],[],ctx.pantry).deductions,[{ingredientId:'genepy-liqueur',amount:5,unit:'ml'}]);
  ctx.pantry={ingredientIds:['yellow-chartreuse'],brandsByIngredient:{}};
  ctx.making.stock=[{ingredientId:'yellow-chartreuse',amount:20,unit:'ml'}];
  assert(making.evaluateVersion(ctx,recipe.version.id).rows[1]!.issues.includes('brand-unconfirmed'));
  assert.deepEqual(making.sessionSupplyOptions(making.createSession(recipe,'carino-original',now,ctx),ctx,id),[]);
});

test('source OR brand applicability stays frozen, and the original candidate still rejects a wrong brand bottle',()=>{
  const ctx=fixture();ctx.catalogue=catalogueData;
  const recipe=making.recipeSnapshot(ctx.catalogue,'carino-batch-j')!,id=making.rowId(recipe,1);
  const bottle:Bottle={id:'actual-genepy',brandId:'genepy-maker',brandName:'Génépy maker',name:'Actual génépy',aliases:[],family:'liqueur',ingredientIds:['genepy-liqueur'],abv:40,market:'test',flavours:[],profile:recipe.title,source:{title:'Bottle',url:'https://example.com/bottle',checkedAt:'2026-10-12'},profileBasis:'identity'};
  ctx.bottles=[bottle];ctx.ownedBottleIds=[bottle.id];ctx.pantry.ingredientIds=[];
  ctx.making.stock=[{ingredientId:'genepy-liqueur',amount:20,unit:'ml',bottleId:bottle.id}];
  const initial=making.createSession(recipe,'genepy-bottle',now,ctx);
  assert.deepEqual(making.sessionSupplyOptions(initial,ctx,id),[{ingredientId:'genepy-liqueur',bottleId:bottle.id}]);
  const session=making.updateSession(initial,{checkedRows:[id],completed:true},later,ctx),state={...ctx.making,sessions:[session]};
  ctx.catalogue={...ctx.catalogue,materialRequirements:[]};
  assert.deepEqual(making.planConsumption(session,state,ctx.bottles,ctx.ownedBottleIds,ctx.pantry).deductions,[{ingredientId:'genepy-liqueur',amount:5,unit:'ml'}]);
  assert.equal(session.recipe.version.ingredients[1]!.brandId,'brand-chartreuse');
  assert.equal(session.fingerprint,making.recipeFingerprint(recipe));
  const original={...bottle,id:'wrong-yellow',ingredientIds:['yellow-chartreuse']};
  ctx.catalogue=catalogueData;ctx.bottles=[original];ctx.ownedBottleIds=[original.id];
  ctx.making.stock=[{ingredientId:'yellow-chartreuse',amount:20,unit:'ml',bottleId:original.id}];
  assert(making.evaluateVersion(ctx,recipe.version.id).rows[1]!.issues.includes('brand-unconfirmed'));
  assert(making.evaluateVersion(ctx,recipe.version.id).rows[1]!.issues.includes('quantity-unknown'));
  assert.deepEqual(making.sessionSupplyOptions(making.createSession(recipe,'wrong-original',now,ctx),ctx,id),[]);
  const valid={...original,brandId:'brand-chartreuse'};ctx.bottles=[valid];
  const brandSession=making.updateSession(making.createSession(recipe,'actual-original',now,ctx),{checkedRows:[id],completed:true},later,ctx);
  assert.equal(making.planConsumption(brandSession,{...ctx.making,sessions:[brandSession]},[valid],ctx.ownedBottleIds,ctx.pantry).deductions.length,1);
  assert.equal(making.planConsumption(brandSession,{...ctx.making,sessions:[brandSession]},[original],ctx.ownedBottleIds,ctx.pantry).deductions.length,0);
});

test('one-item quantity planning evaluates every source candidate without inventing unknown source amounts',()=>{
  const ctx=fixture([{ingredientId:'food-vermouth',amount:30,unit:'ml'}]),version=ctx.catalogue.versions[0]!;
  ctx.catalogue.materialRequirements=[{versionId:version.id,rowIndex:0,originalRow:structuredClone(version.ingredients[0]!),sourceName:version.label,acceptedIngredientIds:['sweet-red-vermouth','bianco-vermouth']}];
  ctx.pantry.ingredientIds=[];ctx.making.stock=[];
  const recipe=making.recipeSnapshot(ctx.catalogue,version.id)!;
  ctx.making.reviews=[{versionId:version.id,fingerprint:making.readinessFingerprint(recipe,ctx.catalogue),toolsConfirmed:true,preparationConfirmed:true}];
  const suggestions=making.rankSingleItemUnlocks(ctx);
  assert.deepEqual(suggestions.map(value=>value.ingredientId).sort(),['bianco-vermouth','sweet-red-vermouth']);
  assert(suggestions.every(value=>value.readyCocktailIds.length===1&&value.reviewCocktailIds.length===0));
  const unchanged=structuredClone(ctx.making.stock);version.ingredients[0]!.amount=null;version.ingredients[0]!.unit='top';ctx.catalogue.materialRequirements[0]!.originalRow=structuredClone(version.ingredients[0]!);
  const unknownRecipe=making.recipeSnapshot(ctx.catalogue,version.id)!;ctx.making.reviews=[{versionId:version.id,fingerprint:making.readinessFingerprint(unknownRecipe,ctx.catalogue),toolsConfirmed:true,preparationConfirmed:true}];
  const unknown=making.rankSingleItemUnlocks(ctx);
  assert.deepEqual(unknown.map(value=>value.ingredientId).sort(),['bianco-vermouth','sweet-red-vermouth']);
  assert(unknown.every(value=>value.readyCocktailIds.length===0&&value.reviewCocktailIds.length===1));
  assert.deepEqual(ctx.making.stock,unchanged);
});

test('making reads schema v1 without migrating it and accepts v2 using the same parser',()=>{
  const old={format:'glass-notes-making',schemaVersion:1,stock:[],reviews:[],sessions:[]};
  assert.deepEqual(making.parseMakingState(JSON.stringify(old)),old);
  const current=fixture().making;
  assert.deepEqual(making.parseMakingState(JSON.stringify(current)),current);
});

test('current availability resolves native whisky to the actual measured supply',()=>{
  const ctx=fixture();
  const result=making.evaluateVersion(ctx,ctx.catalogue.versions[0]!.id);
  assert.deepEqual(result.missingIngredientIds,[]);
  assert(!result.rows[0]!.issues.includes('quantity-unknown'));
  assert(!result.rows[0]!.issues.includes('insufficient'));
});

test('new session freezes allowed materials and deducts its real supply after catalogue changes',()=>{
  const ctx=fixture(),session=complete(ctx);
  assert(session.materialSemantics);
  const stored={...ctx.making,sessions:[session]};
  const restored=making.parseMakingState(JSON.stringify(stored));
  const changed={...ctx,catalogue:{...ctx.catalogue,materialConcepts:[]}};
  assert(making.evaluateVersion(changed,ctx.catalogue.versions[0]!.id).issues.includes('missing'));
  const plan=making.planConsumption(restored.sessions[0]!,restored,[],[],ctx.pantry);
  assert.deepEqual(plan.deductions,[{ingredientId:'bourbon-whiskey',amount:30,unit:'ml'}]);
  assert.equal(making.applyConsumption(plan,restored,later,[],[],ctx.pantry).stock[0]!.amount,30);
  assert.deepEqual(making.planConsumption(session,stored,[],[],{ingredientIds:[],brandsByIngredient:{}}).skippedRowIds,[making.rowId(session.recipe,0)]);
});

test('legacy sessions stay exact and can resume their saved snapshot after recipe edits',()=>{
  const ctx=fixture(),recipe=making.recipeSnapshot(ctx.catalogue,ctx.catalogue.versions[0]!.id)!;
  const session=making.createSession(recipe,'old',now);
  assert.equal(session.materialSemantics,undefined);
  const saved={...ctx.making,sessions:[session]};
  assert.equal(making.findResumableSession(saved,'f'.repeat(64),1,recipe.version.id)?.id,'old');
  const completed=making.updateSession(session,{checkedRows:[making.rowId(recipe,0)],completed:true},later);
  const plan=making.planConsumption(completed,{...saved,sessions:[completed]},[],[],ctx.pantry);
  assert.deepEqual(plan.deductions,[]);
});

test('different canonical rows claim one physical stock capacity',()=>{
  const ctx=fixture([{ingredientId:'scotch-whisky',amount:40,unit:'ml'},{ingredientId:'whiskey',amount:30,unit:'ml'}]);
  const result=making.evaluateVersion(ctx,ctx.catalogue.versions[0]!.id);
  assert(result.rows.every(row=>row.issues.includes('insufficient')));
  const session=complete(ctx);
  assert.throws(()=>making.planConsumption(session,{...ctx.making,sessions:[session]},[],[],ctx.pantry),/insufficient/);
});

test('multiple old stocks in one concept remain unknown and are never summed or deducted',()=>{
  const ctx=fixture();ctx.pantry.ingredientIds.push('whiskey');ctx.making.stock.push({ingredientId:'whiskey',amount:40,unit:'ml'});
  const result=making.evaluateVersion(ctx,ctx.catalogue.versions[0]!.id);
  assert.deepEqual(result.missingIngredientIds,[]);
  assert(result.rows[0]!.issues.includes('quantity-unknown'));
  const session=complete(ctx),plan=making.planConsumption(session,{...ctx.making,sessions:[session]},[],[],ctx.pantry);
  assert.deepEqual(plan.deductions,[]);assert.deepEqual(plan.after,ctx.making.stock);
});

test('two legacy material stocks for one actual bottle cannot create duplicate capacity',()=>{
  const ctx=fixture([{ingredientId:'scotch-whisky',amount:40,unit:'ml'},{ingredientId:'whiskey',amount:40,unit:'ml'}]);
  const bottle=bottleData.find(item=>item.id==='buffalo-trace-bourbon')!;
  ctx.bottles=[bottle];ctx.ownedBottleIds=[bottle.id];ctx.pantry.ingredientIds=[];
  ctx.making.stock=[
    {ingredientId:'scotch-whisky',amount:60,unit:'ml',bottleId:bottle.id},
    {ingredientId:'bourbon-whiskey',amount:60,unit:'ml',bottleId:bottle.id},
  ];
  const recipe=making.recipeSnapshot(ctx.catalogue,ctx.catalogue.versions[0]!.id)!;
  const rowIds=recipe.version.ingredients.map((_,index)=>making.rowId(recipe,index));
  const initial=making.createSession(recipe,'duplicate-bottle',now,ctx);
  const selected=making.updateSession(initial,{materialBindings:{
    [rowIds[0]!]:{ingredientId:'scotch-whisky',bottleId:bottle.id},
    [rowIds[1]!]:{ingredientId:'bourbon-whiskey',bottleId:bottle.id},
  }},later,ctx);
  ctx.making.sessions=[selected];
  assert(making.evaluateVersion(ctx,recipe.version.id).rows.every(row=>row.issues.includes('quantity-unknown')));
  const completed=making.updateSession(selected,{checkedRows:rowIds,completed:true},later,ctx);
  const state={...ctx.making,sessions:[completed]};
  const plan=making.planConsumption(completed,state,ctx.bottles,ctx.ownedBottleIds,ctx.pantry);
  assert.deepEqual(plan.deductions,[]);
  assert.deepEqual(plan.skippedRowIds,rowIds);
  assert.deepEqual(plan.after,ctx.making.stock);
});

test('new semantics remain part of consumption identity for remapped duplicate sessions',()=>{
  const ctx=fixture(),session=complete(ctx),copy={...session,id:'imported'};
  const state={...ctx.making,sessions:[session,copy]};
  const applied=making.applyConsumption(making.planConsumption(session,state,[],[],ctx.pantry),state,later,[],[],ctx.pantry);
  assert(applied.sessions.every(value=>value.consumptionApplied));
  assert.throws(()=>making.planConsumption(applied.sessions[1]!,applied,[],[],ctx.pantry),/already applied/);
  const forged=structuredClone(copy);forged.materialSemantics!.rows[0]!.allowedIngredientIds=['scotch-whisky'];
  assert.throws(()=>making.validateMakingState({...state,sessions:[session,forged]}));
});

test('new exact-only semantics do not reuse a legacy tools confirmation',()=>{
  const ctx=fixture();ctx.catalogue={...ctx.catalogue,materialConcepts:undefined};
  ctx.pantry.ingredientIds=['scotch-whisky'];ctx.making.stock=[{ingredientId:'scotch-whisky',amount:60,unit:'ml'}];
  const recipe=making.recipeSnapshot(ctx.catalogue,ctx.catalogue.versions[0]!.id)!;
  ctx.making.reviews=[{versionId:recipe.version.id,fingerprint:making.recipeFingerprint(recipe),toolsConfirmed:true,preparationConfirmed:true}];
  const result=making.evaluateVersion(ctx,recipe.version.id);
  assert(result.issues.includes('tools-unconfirmed'));
});

test('v2 bottle supply must stay owned, mapped, selected, and true to its actual brand',()=>{
  const ctx=fixture(),id=ctx.catalogue.versions[0]!.id;
  const stockBottle={id:'actual-bourbon',brandId:'actual-brand',brandName:'Actual brand',name:'Actual bottle',aliases:[],family:'whiskey' as const,ingredientIds:['bourbon-whiskey'],abv:40,market:'test',flavours:[],profile:ctx.catalogue.ingredients[0]!.name,source:{title:'Bottle',url:'https://example.com/bottle',checkedAt:'2026-10-12'},profileBasis:'identity' as const};
  ctx.bottles=[stockBottle];ctx.ownedBottleIds=[stockBottle.id];ctx.pantry.ingredientIds=[];ctx.making.stock=[{ingredientId:'bourbon-whiskey',amount:60,unit:'ml',bottleId:stockBottle.id}];
  assert(!making.evaluateVersion(ctx,id).issues.includes('quantity-unknown'));
  const session=complete(ctx),state={...ctx.making,sessions:[session]};
  assert.equal(making.planConsumption(session,state,ctx.bottles,ctx.ownedBottleIds,ctx.pantry).deductions.length,1);
  assert.equal(making.planConsumption(session,state,ctx.bottles,[],ctx.pantry).deductions.length,0);
  assert.equal(making.planConsumption(session,state,[{...stockBottle,ingredientIds:['orange-flavoured-gin']}],ctx.ownedBottleIds,ctx.pantry).deductions.length,0);
  const branded=fixture([{ingredientId:'scotch-whisky',amount:30,unit:'ml',brandId:'actual-brand'}]);
  Object.assign(branded,{bottles:ctx.bottles,ownedBottleIds:ctx.ownedBottleIds,pantry:ctx.pantry,making:ctx.making});
  const brandedSession=complete(branded),brandedState={...branded.making,sessions:[brandedSession]};
  assert.equal(making.planConsumption(brandedSession,brandedState,ctx.bottles,ctx.ownedBottleIds,ctx.pantry).deductions.length,1);
  assert.equal(making.planConsumption(brandedSession,brandedState,[{...stockBottle,brandId:'other-brand'}],ctx.ownedBottleIds,ctx.pantry).deductions.length,0);
});

test('a batch freezes its actual owned supply even when its quantity has never been measured',()=>{
  const ctx=fixture();ctx.making.stock=[];
  const recipe=making.recipeSnapshot(ctx.catalogue,ctx.catalogue.versions[0]!.id)!,session=making.createSession(recipe,'unmeasured',now,ctx),id=making.rowId(recipe,0);
  assert.deepEqual(making.sessionSupplyOptions(session,ctx,id),[{ingredientId:'bourbon-whiskey'}]);
  assert.deepEqual(session.materialBindings?.[id],{ingredientId:'bourbon-whiskey'});
  assert(making.evaluateVersion(ctx,recipe.version.id).rows[0]!.issues.includes('quantity-unknown'));
});

test('an explicit actual supply resolves stock ambiguity without summing old quantities',()=>{
  const ctx=fixture();ctx.pantry.ingredientIds.push('whiskey');ctx.making.stock.push({ingredientId:'whiskey',amount:40,unit:'ml'});
  const recipe=making.recipeSnapshot(ctx.catalogue,ctx.catalogue.versions[0]!.id)!,id=making.rowId(recipe,0);
  const initial=making.createSession(recipe,'selected',now,ctx);
  assert.equal(initial.materialBindings?.[id],undefined);
  const session=making.updateSession(initial,{materialBindings:{[id]:{ingredientId:'whiskey'}},checkedRows:[id],completed:true},later,ctx);
  const plan=making.planConsumption(session,{...ctx.making,sessions:[session]},[],[],ctx.pantry);
  assert.deepEqual(plan.deductions,[{ingredientId:'whiskey',amount:30,unit:'ml'}]);
  assert.deepEqual(plan.after.map(stock=>[stock.ingredientId,stock.amount]),[['bourbon-whiskey',60],['whiskey',10]]);
});

test('frozen source labels require a complete original-row match and survive later display edits',()=>{
  const ctx=fixture(),version=ctx.catalogue.versions[0]!,name={...ctx.catalogue.ingredients[0]!.name,en:'Source Whisky'};
  ctx.catalogue.materialRequirements=[{versionId:version.id,rowIndex:0,originalRow:structuredClone(version.ingredients[0]!),sourceName:name}];
  const recipe=making.recipeSnapshot(ctx.catalogue,version.id)!,session=making.createSession(recipe,'source-label',now,ctx);
  assert.equal(session.materialSemantics!.rows[0]!.sourceName.en,'Source Whisky');
  ctx.catalogue.materialRequirements[0]!.sourceName.en='Later label';
  assert.equal(making.parseMakingState(JSON.stringify({...ctx.making,sessions:[session]})).sessions[0]!.materialSemantics!.rows[0]!.sourceName.en,'Source Whisky');
  ctx.catalogue.materialRequirements[0]!.originalRow.amount=31;
  const stale=making.createSession(recipe,'stale-overlay',now,ctx);
  assert.equal(stale.materialSemantics!.rows[0]!.sourceName.en,recipe.ingredientNames['scotch-whisky']!.en);
});

test('missing canonical rows require one purchase identity rather than duplicate legacy IDs',()=>{
  const ctx=fixture([{ingredientId:'scotch-whisky',amount:20,unit:'ml'},{ingredientId:'whiskey',amount:10,unit:'ml'}]);
  ctx.pantry.ingredientIds=[];ctx.making.stock=[];
  const result=making.evaluateVersion(ctx,ctx.catalogue.versions[0]!.id);
  assert.deepEqual(result.missingIngredientIds,['food-generic-whisky']);
  assert.deepEqual(making.rankSingleItemUnlocks(ctx).map(item=>item.ingredientId),['food-generic-whisky']);
});

test('review confirmation follows recipe and matching semantics, not unrelated catalogue entries',()=>{
  const ctx=fixture(),recipe=making.recipeSnapshot(ctx.catalogue,ctx.catalogue.versions[0]!.id)!;
  ctx.making.reviews=[{versionId:recipe.version.id,fingerprint:making.readinessFingerprint(recipe,ctx.catalogue),toolsConfirmed:true,preparationConfirmed:true}];
  assert.equal(making.evaluateVersion(ctx,recipe.version.id).status,'ready');
  const irrelevant={...ctx.catalogue,ingredients:[...ctx.catalogue.ingredients,{id:'unrelated-new',name:recipe.title,exclusionTags:[],compositionKnown:true}]};
  assert.equal(making.readinessFingerprint(recipe,irrelevant),ctx.making.reviews[0]!.fingerprint);
  const restricted={...ctx.catalogue,materialConcepts:[]};
  assert.notEqual(making.readinessFingerprint(recipe,restricted),ctx.making.reviews[0]!.fingerprint);
  assert(making.evaluateVersion({...ctx,catalogue:restricted},recipe.version.id).issues.includes('tools-unconfirmed'));
});

test('checked optional rows join required rows in the same physical capacity claim',()=>{
  const ctx=fixture([{ingredientId:'scotch-whisky',amount:30,unit:'ml'},{ingredientId:'whiskey',amount:30,unit:'ml',optional:true}]);
  ctx.making.stock[0]!.amount=50;
  const recipe=making.recipeSnapshot(ctx.catalogue,ctx.catalogue.versions[0]!.id)!,id=making.rowId(recipe,1);
  const session=making.updateSession(making.createSession(recipe,'optional',now,ctx),{checkedRows:[id]},later,ctx);
  ctx.making.sessions=[session];
  const result=making.evaluateVersion(ctx,recipe.version.id);
  assert(result.rows.every(row=>row.issues.includes('insufficient')));
});

test('source-specific alternatives freeze across concepts without making those materials globally equivalent',()=>{
  const ctx=fixture([{ingredientId:'pickle-brine',amount:10,unit:'ml'}]),version=ctx.catalogue.versions[0]!;
  const requirement={versionId:version.id,rowIndex:0,originalRow:structuredClone(version.ingredients[0]!),sourceName:ctx.catalogue.ingredients.find(item=>item.id==='pickle-brine')!.name,acceptedIngredientIds:['pickle-brine','green-olive-brine']};
  ctx.catalogue.materialRequirements=[requirement];ctx.pantry.ingredientIds=['green-olive-brine'];ctx.making.stock=[{ingredientId:'green-olive-brine',amount:30,unit:'ml'}];
  assert.deepEqual(making.evaluateVersion(ctx,version.id).missingIngredientIds,[]);
  const session=complete(ctx),state={...ctx.making,sessions:[session]};
  assert.deepEqual(session.materialSemantics!.rows[0]!.allowedIngredientIds,['green-olive-brine','pickle-brine']);
  ctx.catalogue.materialRequirements=[];
  assert(making.evaluateVersion(ctx,version.id).issues.includes('missing'));
  assert.deepEqual(making.planConsumption(session,state,[],[],ctx.pantry).deductions,[{ingredientId:'green-olive-brine',amount:10,unit:'ml'}]);
});

test('a source placeholder accepts only its stated candidates, and stale OR metadata cannot rebind',()=>{
  const ctx=fixture([{ingredientId:'food-vermouth',amount:30,unit:'ml'}]),version=ctx.catalogue.versions[0]!;
  const requirement={versionId:version.id,rowIndex:0,originalRow:structuredClone(version.ingredients[0]!),sourceName:ctx.catalogue.ingredients.find(item=>item.id==='food-vermouth')!.name,acceptedIngredientIds:['sweet-red-vermouth','bianco-vermouth']};
  ctx.catalogue.materialRequirements=[requirement];ctx.pantry.ingredientIds=['food-vermouth'];ctx.making.stock=[{ingredientId:'food-vermouth',amount:90,unit:'ml'}];
  assert(making.evaluateVersion(ctx,version.id).issues.includes('missing'));
  assert.deepEqual(making.rankSingleItemUnlocks(ctx).map(item=>item.ingredientId).sort(),['bianco-vermouth','sweet-red-vermouth']);
  const generic=complete(ctx);assert.equal(generic.materialBindings?.[making.rowId(generic.recipe,0)],undefined);
  ctx.pantry.ingredientIds=['bianco-vermouth'];ctx.making.stock=[{ingredientId:'bianco-vermouth',amount:90,unit:'ml'}];
  const session=complete(ctx),state={...ctx.making,sessions:[session]};
  assert.deepEqual(making.planConsumption(session,state,[],[],ctx.pantry).deductions,[{ingredientId:'bianco-vermouth',amount:30,unit:'ml'}]);
  requirement.originalRow.amount=31;
  assert(making.evaluateVersion(ctx,version.id).issues.includes('missing'));
  const stale=complete(ctx);assert.deepEqual(stale.materialSemantics!.rows[0]!.allowedIngredientIds,['food-vermouth']);
});
