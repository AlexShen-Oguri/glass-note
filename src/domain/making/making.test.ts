import assert from 'node:assert/strict';
import test from 'node:test';
import type {Bottle} from '../bottles/types';
import type {Catalogue,Localized,RecipeIngredient,RecipeVersion} from '../contracts';
import {catalogue as fullCatalogue} from '../../content/catalogue';
import {
  applyConsumption,
  calculateAbv,
  createSession,
  evaluateVersion,
  findResumableSession,
  pantryDecisions,
  parseMakingState,
  planConsumption,
  rankSingleItemUnlocks,
  recipeFingerprint,
  recipeSnapshot,
  rowId,
  scaleRecipe,
  updateSession,
  validateMakingState,
  type MakingContext,
  type MakingRecipe,
  type MakingState,
} from '.';

const L=(value:string):Localized=>({en:value,zh:value,fr:value,de:value,es:value,ko:value,ja:value,it:value});
const NOW='2026-09-10T12:00:00Z',LATER='2026-09-10T12:01:00Z';
function version(id:string,cocktailId:string,ingredients:RecipeIngredient[],options:Partial<RecipeVersion>={}):RecipeVersion{
  return{id,cocktailId,label:L(id),sourceId:'source',servings:1,ingredients,steps:{en:['Mix'],zh:['Mix'],fr:['Mix'],de:['Mix'],es:['Mix'],ko:['Mix'],ja:['Mix'],it:['Mix']},originalLanguage:'en',glass:L('Glass'),garnish:L('None'),flavours:[],tastes:[],strength:null,approachability:null,profileBasis:'source',profileNote:L('Source facts'),sourceChecked:true,translationStatus:'draft',...options};
}
function catalogue(versions:RecipeVersion[],cocktails?:Catalogue['cocktails'],brands:Catalogue['brands']=[]):Catalogue{
  const ingredientIds=[...new Set(versions.flatMap(item=>item.ingredients.map(row=>row.ingredientId)))];
  return{versions,ingredients:ingredientIds.map(id=>({id,name:L(id),exclusionTags:[],compositionKnown:true})),brands,sources:[{id:'source',title:'Source',url:'https://example.com',checkedAt:'2026-09-10T00:00:00Z'}],cocktails:cocktails??versions.map(item=>({id:item.cocktailId,name:L(item.cocktailId),aliases:[],category:'classic',description:L('Drink'),versionIds:[item.id],defaultVersionId:item.id,accent:'#fff'}))};
}
function bottle(id:string,ingredientId:string,brandId='brand',abv:number|null=40):Bottle{return{id,brandId,brandName:brandId,name:id,aliases:[],family:'gin',ingredientIds:[ingredientId],abv,market:'test',flavours:[],profile:L('Bottle'),source:{title:'Bottle',url:'https://example.com/bottle',checkedAt:'2026-09-10'},profileBasis:'identity'};}
function state(overrides:Partial<MakingState>={}):MakingState{return{format:'glass-notes-making',schemaVersion:1,stock:[],reviews:[],sessions:[],...overrides};}
function context(data:Catalogue,overrides:Partial<Omit<MakingContext,'catalogue'>>={}):MakingContext{return{catalogue:data,pantry:{ingredientIds:[],brandsByIngredient:{}},ownedBottleIds:[],bottles:[],making:state(),...overrides};}
function reviewed(data:Catalogue,versionId:string,stock:MakingState['stock'],pantryIds:string[],extra:Partial<Omit<MakingContext,'catalogue'>>={}):MakingContext{
  const recipe=recipeSnapshot(data,versionId)!;
  return context(data,{pantry:{ingredientIds:pantryIds,brandsByIngredient:{}},making:state({stock,reviews:[{versionId,fingerprint:recipeFingerprint(recipe),toolsConfirmed:true,preparationConfirmed:true}]}),...extra});
}

test('snapshot keeps readable names and scaling preserves source ratios and unknown amounts',()=>{
  const v=version('v','drink',[{ingredientId:'gin',amount:2,unit:'oz',brandId:'brand'},{ingredientId:'tonic',amount:2,unit:'part'},{ingredientId:'soda',amount:null,unit:'top'}],{servings:2});
  const data=catalogue([v],undefined,[{id:'brand',name:'Named Brand',ingredientIds:['gin']}]);
  const recipe=recipeSnapshot(data,'v')!;
  assert.equal(recipe.ingredientNames.gin!.en,'gin');assert.equal(recipe.brandNames.brand,'Named Brand');assert.match(recipeFingerprint(recipe),/^[0-9a-f]{64}$/);
  assert.deepEqual(scaleRecipe(recipe,4).map(row=>[row.amount,row.linear]),[[4,true],[2,false],[null,false]]);
  assert.equal(rowId(recipe,1),'v:1');assert.throws(()=>rowId(recipe,3),RangeError);
});

test('availability distinguishes missing, unknown quantity, and confirmed readiness',()=>{
  const data=catalogue([version('v','drink',[{ingredientId:'gin',amount:60,unit:'ml'},{ingredientId:'lime',amount:30,unit:'ml'}])]);
  const empty=evaluateVersion(context(data),'v');assert.equal(empty.status,'missing');assert.deepEqual(empty.missingIngredientIds,['gin','lime']);
  const unknown=evaluateVersion(context(data,{pantry:{ingredientIds:['gin','lime'],brandsByIngredient:{}}}),'v');
  assert.equal(unknown.status,'check');assert(unknown.issues.includes('quantity-unknown'));assert(unknown.issues.includes('tools-unconfirmed'));
  const ready=evaluateVersion(reviewed(data,'v',[{ingredientId:'gin',amount:60,unit:'ml'},{ingredientId:'lime',amount:1.1,unit:'oz'}],['gin','lime']),'v');
  assert.equal(ready.status,'ready');
});

test('duplicate required rows share one measured stock entry',()=>{
  const data=catalogue([version('v','drink',[{ingredientId:'gin',amount:20,unit:'ml'},{ingredientId:'gin',amount:15,unit:'ml'}])]);
  const insufficient=evaluateVersion(reviewed(data,'v',[{ingredientId:'gin',amount:30,unit:'ml'}],['gin']),'v');
  assert.equal(insufficient.status,'missing');assert(insufficient.rows.every(row=>row.issues.includes('insufficient')));
  assert.equal(evaluateVersion(reviewed(data,'v',[{ingredientId:'gin',amount:35,unit:'ml'}],['gin']),'v').status,'ready');
});

test('unchecked optional rows do not consume stock needed by required rows',()=>{
  const data=catalogue([version('v','drink',[{ingredientId:'gin',amount:30,unit:'ml'},{ingredientId:'gin',amount:30,unit:'ml',optional:true}])]);
  const result=evaluateVersion(reviewed(data,'v',[{ingredientId:'gin',amount:30,unit:'ml'}],['gin']),'v');
  assert.equal(result.status,'ready');assert(!result.rows[0]!.issues.includes('insufficient'));
});

test('inventory demand uses scaled source measures instead of ABV volume assumptions',()=>{
  const data=catalogue([version('v','drink',[{ingredientId:'gin',amount:30,unit:'ml'}])]);const recipe=recipeSnapshot(data,'v')!;
  let session=createSession(recipe,'s',NOW);session=updateSession(session,{assumptions:{volumeMl:{'v:0':0},abv:{'v:0':40},dilutionMl:0,bottleIds:{}}},LATER);
  const review={versionId:'v',fingerprint:recipeFingerprint(recipe),toolsConfirmed:true,preparationConfirmed:true};
  const result=evaluateVersion(context(data,{pantry:{ingredientIds:['gin'],brandsByIngredient:{}},making:state({stock:[{ingredientId:'gin',amount:20,unit:'ml'}],reviews:[review],sessions:[session]})}),'v');
  assert(result.rows[0]!.issues.includes('insufficient'));
});

test('availability does not reuse assumptions from another serving count or a completed session',()=>{
  const data=catalogue([version('v','drink',[{ingredientId:'tonic',amount:null,unit:'top'}])]);const recipe=recipeSnapshot(data,'v')!;
  let session=createSession(recipe,'s',NOW);session=updateSession(session,{servings:2,assumptions:{volumeMl:{'v:0':50},abv:{},dilutionMl:null,bottleIds:{}}},LATER);
  const review={versionId:'v',fingerprint:recipeFingerprint(recipe),toolsConfirmed:true,preparationConfirmed:true};
  const base=context(data,{pantry:{ingredientIds:['tonic'],brandsByIngredient:{}},making:state({stock:[{ingredientId:'tonic',amount:100,unit:'ml'}],reviews:[review],sessions:[session]})});
  assert(evaluateVersion(base,'v',1).rows[0]!.issues.includes('amount-unknown'));
  const completed={...session,completed:true};
  assert(evaluateVersion({...base,making:{...base.making,sessions:[completed]}},'v',2).rows[0]!.issues.includes('amount-unknown'));
});

test('source-specified brand stock uses a verified bound bottle without a duplicate selection',()=>{
  const v=version('v','drink',[{ingredientId:'gin',amount:30,unit:'ml',brandId:'brand'}]);
  const data=catalogue([v],undefined,[{id:'brand',name:'Brand',ingredientIds:['gin']}]);
  const recipe=recipeSnapshot(data,'v')!,review={versionId:'v',fingerprint:recipeFingerprint(recipe),toolsConfirmed:true,preparationConfirmed:true};
  const generic=evaluateVersion(context(data,{pantry:{ingredientIds:['gin'],brandsByIngredient:{gin:['brand']}},making:state({stock:[{ingredientId:'gin',amount:100,unit:'ml'}],reviews:[review]})}),'v');
  assert.equal(generic.status,'check');assert(generic.rows[0]!.issues.includes('quantity-unknown'));
  const exact=bottle('bottle','gin','brand');
  const unselected=createSession(recipe,'s',NOW),stock=[{ingredientId:'gin',amount:100,unit:'ml',bottleId:'bottle'}] as MakingState['stock'];
  const unselectedResult=evaluateVersion(context(data,{pantry:{ingredientIds:[],brandsByIngredient:{}},ownedBottleIds:['bottle'],bottles:[exact],making:state({stock,reviews:[review],sessions:[unselected]})}),'v');
  assert.equal(unselectedResult.status,'ready');
  const completedWithoutSelection=updateSession(unselected,{checkedRows:['v:0'],completed:true},LATER);
  assert.deepEqual(planConsumption(completedWithoutSelection,state({stock,sessions:[completedWithoutSelection]})).skippedRowIds,['v:0']);
  const making=state({stock,sessions:[completedWithoutSelection]}),plan=planConsumption(completedWithoutSelection,making,[exact],['bottle']);
  assert.deepEqual(plan.deductions,[{ingredientId:'gin',amount:30,unit:'ml'}]);
  assert.deepEqual(planConsumption(completedWithoutSelection,making,[exact],[]).skippedRowIds,['v:0']);
  assert.deepEqual(planConsumption(completedWithoutSelection,making,[bottle('bottle','rum','brand')],['bottle']).skippedRowIds,['v:0']);
  assert.deepEqual(planConsumption(completedWithoutSelection,making,[bottle('bottle','gin','other')],['bottle']).skippedRowIds,['v:0']);
  assert.throws(()=>applyConsumption(plan,making,'2026-09-10T12:02:00Z'),/invalid consumption plan/);
  assert.equal(applyConsumption(plan,making,'2026-09-10T12:02:00Z',[exact],['bottle']).stock[0]!.amount,70);
  const wrongSelection=updateSession(unselected,{checkedRows:['v:0'],completed:true,assumptions:{...unselected.assumptions,bottleIds:{'v:0':'other'}}},LATER);
  assert.deepEqual(planConsumption(wrongSelection,state({stock,sessions:[wrongSelection]}),[exact],['bottle']).skippedRowIds,['v:0']);
});

test('partial preparation remains a data gap after user confirmation',()=>{
  const v=version('penicillin-iba','drink',[{ingredientId:'honey-syrup',amount:15,unit:'ml'}]);
  const data=catalogue([v]);const recipe=recipeSnapshot(data,v.id)!;
  assert.equal(recipe.preparation?.status,'partial');
  const result=evaluateVersion(reviewed(data,v.id,[{ingredientId:'honey-syrup',amount:100,unit:'ml'}],['honey-syrup']),'penicillin-iba');
  assert.equal(result.status,'check');assert(result.issues.includes('preparation-gap'));assert(!result.issues.includes('preparation-unconfirmed'));
});

test('pantry choices stay version-local and prefer the version with fewer unresolved facts',()=>{
  const a=version('a','drink',[{ingredientId:'gin',amount:30,unit:'ml'},{ingredientId:'lime',amount:20,unit:'ml'}]);
  const b=version('b','drink',[{ingredientId:'rum',amount:30,unit:'ml'}]);
  const drinks=[{id:'drink',name:L('Drink'),aliases:[],category:'classic' as const,description:L('Drink'),versionIds:['a','b'],defaultVersionId:'a',accent:'#fff'}];
  const data=catalogue([a,b],drinks);const ctx=reviewed(data,'b',[{ingredientId:'rum',amount:30,unit:'ml'}],['gin','rum']);
  assert.equal(pantryDecisions(ctx)[0]!.versionId,'b');
});

test('one-item suggestions separate strict unlocks from review candidates and deduplicate cocktails',()=>{
  const versions=[
    version('a1','a',[{ingredientId:'gin',amount:30,unit:'ml'},{ingredientId:'lime',amount:20,unit:'ml'}]),
    version('a2','a',[{ingredientId:'gin',amount:45,unit:'ml'},{ingredientId:'lime',amount:10,unit:'ml'}]),
    version('b','b',[{ingredientId:'gin',amount:30,unit:'ml'},{ingredientId:'lime',amount:null,unit:'top'}]),
    version('c','c',[{ingredientId:'gin',amount:30,unit:'ml'},{ingredientId:'lime',amount:20,unit:'ml'},{ingredientId:'sugar',amount:5,unit:'g'}]),
  ];
  const cocktails=[{id:'a',name:L('A'),aliases:[],category:'classic' as const,description:L('A'),versionIds:['a1','a2'],defaultVersionId:'a1',accent:'#fff'},...['b','c'].map(id=>({id,name:L(id),aliases:[],category:'classic' as const,description:L(id),versionIds:[id],defaultVersionId:id,accent:'#fff'}))];
  const data=catalogue(versions,cocktails);const reviews=versions.map(v=>{const recipe=recipeSnapshot(data,v.id)!;return{versionId:v.id,fingerprint:recipeFingerprint(recipe),toolsConfirmed:true,preparationConfirmed:true};});
  const ctx=context(data,{pantry:{ingredientIds:['gin'],brandsByIngredient:{}},making:state({stock:[{ingredientId:'gin',amount:200,unit:'ml'}],reviews})});
  const lime=rankSingleItemUnlocks(ctx).find(item=>item.ingredientId==='lime')!;
  assert.deepEqual(lime.readyCocktailIds,['a']);assert.deepEqual(lime.reviewCocktailIds,['b']);assert.deepEqual(lime.versionIds,['a1','a2','b']);
  assert(!lime.readyCocktailIds.includes('c'));
});

test('unknown restock amount is review-only and an already-ready cocktail is not newly unlocked',()=>{
  const versions=[version('unknown','unknown',[{ingredientId:'gin',amount:30,unit:'ml'},{ingredientId:'tonic',amount:null,unit:'top'}]),version('ready','ready',[{ingredientId:'gin',amount:30,unit:'ml'},{ingredientId:'lime',amount:10,unit:'ml'}])];
  const data=catalogue(versions);const reviews=versions.map(v=>{const recipe=recipeSnapshot(data,v.id)!;return{versionId:v.id,fingerprint:recipeFingerprint(recipe),toolsConfirmed:true,preparationConfirmed:true};});
  const ctx=context(data,{pantry:{ingredientIds:['gin','lime'],brandsByIngredient:{}},making:state({stock:[{ingredientId:'gin',amount:100,unit:'ml'},{ingredientId:'lime',amount:20,unit:'ml'}],reviews})});
  const suggestions=rankSingleItemUnlocks(ctx),tonic=suggestions.find(item=>item.ingredientId==='tonic')!;
  assert.deepEqual(tonic.readyCocktailIds,[]);assert.deepEqual(tonic.reviewCocktailIds,['unknown']);assert(!suggestions.some(item=>item.versionIds.includes('ready')));
});

test('restock suggestions use the requested serving count',()=>{
  const data=catalogue([version('v','drink',[{ingredientId:'gin',amount:30,unit:'ml'},{ingredientId:'lime',amount:10,unit:'ml'}])]);
  const recipe=recipeSnapshot(data,'v')!,review={versionId:'v',fingerprint:recipeFingerprint(recipe),toolsConfirmed:true,preparationConfirmed:true};
  const ctx=context(data,{pantry:{ingredientIds:['gin'],brandsByIngredient:{}},making:state({stock:[{ingredientId:'gin',amount:30,unit:'ml'}],reviews:[review]})});
  assert(rankSingleItemUnlocks(ctx,1).some(item=>item.ingredientId==='lime'&&item.readyCocktailIds.includes('drink')));
  assert(!rankSingleItemUnlocks(ctx,2).some(item=>item.ingredientId==='lime'));
});

test('ABV requires explicit ABV for every included liquid and explicit dilution',()=>{
  const data=catalogue([version('v','drink',[{ingredientId:'gin',amount:60,unit:'ml'},{ingredientId:'water',amount:30,unit:'ml'},{ingredientId:'olive',amount:1,unit:'piece',optional:true}])]);
  let session=createSession(recipeSnapshot(data,'v')!,'s',NOW);
  session=updateSession(session,{assumptions:{volumeMl:{'v:0':60,'v:1':30},abv:{'v:0':40,'v:1':0},dilutionMl:null,bottleIds:{}}},LATER);
  let result=calculateAbv(session);assert.equal(result.status,'incomplete');assert.equal(result.dilutionUnknown,true);assert.equal(result.alcoholMl,24);
  session=updateSession(session,{assumptions:{...session.assumptions,dilutionMl:30}},'2026-09-10T12:02:00Z');result=calculateAbv(session);
  assert.equal(result.status,'estimated');assert.equal(result.abv,20);
  session=updateSession(session,{checkedRows:['v:2']},'2026-09-10T12:03:00Z');assert.deepEqual(calculateAbv(session).missingRowIds,['v:2']);
});

test('changing servings clears batch-dependent checks and volume assumptions',()=>{
  const data=catalogue([version('v','drink',[{ingredientId:'gin',amount:30,unit:'ml'}])]);let session=createSession(recipeSnapshot(data,'v')!,'s',NOW);
  session=updateSession(session,{checkedRows:['v:0'],stepIndex:0,assumptions:{volumeMl:{'v:0':31},abv:{'v:0':40},dilutionMl:10,bottleIds:{'v:0':'b'}}},LATER);
  session=updateSession(session,{servings:2},'2026-09-10T12:02:00Z');
  assert.deepEqual(session.checkedRows,[]);assert.deepEqual(session.assumptions.volumeMl,{});assert.equal(session.assumptions.dilutionMl,null);assert.equal(session.assumptions.abv['v:0'],40);assert.equal(session.completed,false);
});

test('completed sessions are terminal and never resumable, including legacy unapplied batches',()=>{
  const data=catalogue([version('v','drink',[{ingredientId:'gin',amount:30,unit:'ml'}])]);const recipe=recipeSnapshot(data,'v')!;
  const active=createSession(recipe,'active',NOW);
  const completed=updateSession(createSession(recipe,'completed',NOW),{completed:true},LATER);
  const parsed=parseMakingState(JSON.stringify(state({sessions:[active,completed]})));
  assert.equal(parsed.sessions[1]!.completed,true);assert.equal(parsed.sessions[1]!.consumptionApplied,false);
  assert.equal(findResumableSession(parsed,recipeFingerprint(recipe),recipe.version.servings)?.id,'active');
  assert.throws(()=>updateSession(completed,{stepIndex:0},'2026-09-10T12:02:00Z'),/already completed/);
  assert.equal(findResumableSession(state({sessions:[completed]}),recipeFingerprint(recipe),recipe.version.servings),undefined);
});

test('session progress accepts the longest localized method',()=>{
  const steps={en:['Mix'],zh:['一','二','三'],fr:['Un','Deux'],de:['Eins'],es:['Uno'],ko:['하나'],ja:['一'],it:['Uno']};
  const data=catalogue([version('v','drink',[{ingredientId:'gin',amount:30,unit:'ml'}],{steps})]);
  const session=updateSession(createSession(recipeSnapshot(data,'v')!,'s',NOW),{stepIndex:2},LATER);
  assert.equal(validateMakingState(state({sessions:[session]})).sessions[0]!.stepIndex,2);
  assert.throws(()=>updateSession(session,{stepIndex:3},'2026-09-10T12:02:00Z'),/invalid number/);
});

test('manual consumption only deducts checked compatible rows and rejects stale or repeat plans',()=>{
  const data=catalogue([version('v','drink',[{ingredientId:'gin',amount:30,unit:'ml'},{ingredientId:'lime',amount:15,unit:'ml'}])]);let session=createSession(recipeSnapshot(data,'v')!,'s',NOW);
  assert.throws(()=>planConsumption(session,state({stock:[{ingredientId:'gin',amount:30,unit:'ml'}],sessions:[session]})),/not completed/);
  session=updateSession(session,{checkedRows:['v:0'],completed:true,assumptions:{volumeMl:{'v:0':0},abv:{},dilutionMl:null,bottleIds:{}}},LATER);
  const making=state({stock:[{ingredientId:'gin',amount:30,unit:'ml'},{ingredientId:'lime',amount:20,unit:'ml'}],sessions:[session]});
  const plan=planConsumption(session,making);assert.deepEqual(plan.deductions,[{ingredientId:'gin',amount:30,unit:'ml'}]);assert.equal(plan.after[0]!.amount,0);
  const applied=applyConsumption(plan,making,'2026-09-10T12:02:00Z');assert.equal(applied.sessions[0]!.consumptionApplied,true);assert.throws(()=>applyConsumption(plan,applied,'2026-09-10T12:03:00Z'),/already applied/);
  assert.throws(()=>applyConsumption(plan,{...making,stock:[{ingredientId:'gin',amount:29,unit:'ml'},{ingredientId:'lime',amount:20,unit:'ml'}]},'2026-09-10T12:03:00Z'),/stale/);
  assert.throws(()=>planConsumption(session,{...making,stock:[{ingredientId:'gin',amount:20,unit:'ml'},{ingredientId:'lime',amount:20,unit:'ml'}]}),/insufficient/);
  const recipe=recipeSnapshot(data,'v')!,review={versionId:'v',fingerprint:recipeFingerprint(recipe),toolsConfirmed:true,preparationConfirmed:true};
  const depleted=evaluateVersion(context(data,{pantry:{ingredientIds:['gin','lime'],brandsByIngredient:{}},making:{...applied,reviews:[review]}}),'v');
  assert(depleted.rows[0]!.issues.includes('insufficient'));assert(!depleted.rows[0]!.issues.includes('quantity-unknown'));
});

test('consumption id prevents a remapped backup copy from deducting the same batch twice',()=>{
  const data=catalogue([version('v','drink',[{ingredientId:'gin',amount:10,unit:'ml'}])]);let original=createSession(recipeSnapshot(data,'v')!,'original',NOW);
  original=updateSession(original,{checkedRows:['v:0'],completed:true},LATER);
  const copySession={...original,id:'remapped'};
  const making=state({stock:[{ingredientId:'gin',amount:30,unit:'ml'}],sessions:[original,copySession]});
  const applied=applyConsumption(planConsumption(original,making),making,'2026-09-10T12:02:00Z');
  assert(applied.sessions.every(item=>item.consumptionApplied));assert.throws(()=>planConsumption(applied.sessions[1]!,applied),/already applied/);
  assert.throws(()=>validateMakingState({...making,sessions:[original,{...copySession,startedAt:'2026-09-11T00:00:00Z'}]}),/reused consumption id/);
});

test('making parser validates self-contained old snapshots without the live catalogue',()=>{
  const data=catalogue([version('future-version','future-drink',[{ingredientId:'future-ingredient',amount:1,unit:'oz'}])]);const session=createSession(recipeSnapshot(data,'future-version')!,'s',NOW);
  const parsed=parseMakingState(JSON.stringify(state({sessions:[session]})));assert.equal(parsed.sessions[0]!.recipe.ingredientNames['future-ingredient']!.ja,'future-ingredient');
  assert.equal(validateMakingState(state({stock:[{ingredientId:'future-ingredient',amount:0,unit:'ml'}]})).stock[0]!.amount,0);
  assert.throws(()=>parseMakingState('{bad'),/invalid JSON/);
  assert.throws(()=>parseMakingState(JSON.stringify({padding:'饮'.repeat(1_700_000)})),/invalid JSON/);
  const bad=JSON.parse(JSON.stringify(state({sessions:[session]})));delete bad.sessions[0].recipe.ingredientNames['future-ingredient'];assert.throws(()=>validateMakingState(bad),/references mismatch/);
  bad.sessions[0].recipe.ingredientNames['future-ingredient']=L('future');delete bad.sessions[0].recipe.title.it;assert.throws(()=>validateMakingState(bad),/missing it/);
  const unsafe=JSON.parse(JSON.stringify(state({sessions:[session]})));unsafe.sessions[0].recipe.source.url='javascript:alert(1)';assert.throws(()=>validateMakingState(unsafe),/http or https/);
});

test('all public versions create and validate self-contained snapshots',()=>{
  for(const version of fullCatalogue.versions){
    const recipe=recipeSnapshot(fullCatalogue,version.id);assert(recipe,version.id);
    const session=createSession(recipe,`session-${version.id}`,NOW);
    assert.doesNotThrow(()=>validateMakingState(state({sessions:[session]})),version.id);
  }
});

test('catalogue index annotations do not invalidate personal snapshots or their fingerprints',()=>{
  const original=version('v','drink',[{ingredientId:'gin',amount:30,unit:'ml'}],{originalSteps:['Stir over ice and strain.']});
  const before=recipeSnapshot(catalogue([original]),original.id)!;
  const annotated={...original,mixingMethods:[{method:'stir' as const,sourceId:original.sourceId,stepIndexes:[0],reviewedAt:'2026-09-15'}],origin:{kind:'bar' as const,topicId:'sample-bar',countryCodes:['GB']}};
  const after=recipeSnapshot(catalogue([annotated]),original.id)!;
  assert.deepEqual(after,before);
  assert.equal(recipeFingerprint(after),recipeFingerprint(before));
  assert.equal(after.version.mixingMethods,undefined);
  assert.equal(after.version.origin,undefined);
  assert.equal(annotated.origin.topicId,'sample-bar','snapshot creation must not mutate source classification');
  assert.equal(annotated.mixingMethods.length,1,'snapshot creation must not mutate the public index');
  const session=createSession(before,'existing-session',NOW);
  assert.doesNotThrow(()=>validateMakingState(state({sessions:[session]})));
});
