import assert from 'node:assert/strict';
import test from 'node:test';
import type {Catalogue,Localized,RecipeVersion} from '../contracts';
import type {ContextEvidence} from '../context';
import {createFeedback,emptyTasteState,type TasteState} from '../taste';
import {recipeSnapshot} from '.';
import {rankPresenceCombinations} from './presence-decisions';
import {createCabinetPlanner} from './personalized-planning';

const L=(value:string):Localized=>({en:value,zh:value,fr:value,de:value,es:value,ko:value,ja:value,it:value});
const recipe=(id:string,ingredients:string[],changes:Partial<RecipeVersion>={}):RecipeVersion=>({id,cocktailId:id,label:L(id),sourceId:'source',servings:1,
  ingredients:ingredients.map(ingredientId=>({ingredientId,amount:30,unit:'ml'})),steps:{en:['Mix'],zh:['Mix'],fr:['Mix'],de:['Mix'],es:['Mix'],ko:['Mix'],ja:['Mix'],it:['Mix']},
  originalLanguage:'en',glass:L('Glass'),garnish:L('None'),flavours:[],tastes:[],strength:null,approachability:null,profileBasis:'source',profileNote:L('Facts'),sourceChecked:true,translationStatus:'draft',...changes});
function catalogue(versions:RecipeVersion[]):Catalogue{
  return{versions,brands:[],ingredients:[...new Set(versions.flatMap(v=>v.ingredients.map(r=>r.ingredientId)))].map(id=>({id,name:L(id),compositionKnown:true,exclusionTags:[]})),sources:[{id:'source',title:'Source',url:'https://example.com/recipe',checkedAt:'2026-10-23'}],cocktails:[...new Set(versions.map(v=>v.cocktailId))].map(id=>({id,name:L(id),aliases:[],category:'classic',description:L('Drink'),versionIds:versions.filter(v=>v.cocktailId===id).map(v=>v.id),defaultVersionId:versions.find(v=>v.cocktailId===id)!.id,accent:'#fff'}))};
}
const data=()=>catalogue([recipe('dry',['gin','dry']),recipe('soda',['gin','soda'])]);
const pantry=()=>({ingredientIds:['gin'],brandsByIngredient:{} as Record<string,string[]>});
function rated(c:Catalogue,values:Array<[string,'like'|'dislike'|'neutral']>):TasteState{
  return{...emptyTasteState(),entries:values.map(([id,sentiment],i)=>createFeedback(recipeSnapshot(c,id)!,`rating-${i}`,'2026-10-23T12:00:00Z',{experience:'drank',sentiment,likedFlavours:[],tooSweet:false,tooStrong:false,notes:''}))};
}
const ids=(result:ReturnType<ReturnType<typeof createCabinetPlanner>['plan']>)=>result.plans.map(p=>p.ingredientIds.join('+'));

test('taste goal can reverse equal-gain purchases without changing the unlocked sources',()=>{
  const c=data(),p=pantry(),planner=createCabinetPlanner(),taste=rated(c,[['soda','like'],['dry','dislike']]);
  const coverage=planner.plan(c,p,1,{goal:'coverage',taste});
  assert.deepEqual(ids(coverage),['dry','soda']);
  const personal=planner.plan(c,p,1,{goal:'taste',taste});
  assert.equal(personal.status,'personalized');assert.deepEqual(ids(personal),['soda','dry']);
  assert.deepEqual(new Set(personal.plans.flatMap(p=>p.cocktails.flatMap(d=>[...d.readyVersions,...d.needsReviewVersions].map(v=>v.versionId)))),new Set(['dry','soda']));
});

test('cold, note-only and unreadable preferences honestly retain count planning',()=>{
  const c=data(),p=pantry(),planner=createCabinetPlanner();
  const neutral=rated(c,[['soda','neutral']]);neutral.entries[0]!.notes='I love this';
  for(const taste of [emptyTasteState(),neutral]){
    const r=planner.plan(c,p,1,{goal:'taste',taste});assert.equal(r.status,'cold-start');assert.deepEqual(r.plans,rankPresenceCombinations(c,p,1));
  }
  const bad=planner.plan(c,p,1,{goal:'taste',taste:{...emptyTasteState(),schemaVersion:2} as unknown as TasteState});
  assert.equal(bad.status,'unavailable');assert.deepEqual(bad.plans,rankPresenceCombinations(c,p,1));
});

test('personal planning scores relevant versions beyond discovery pagination limits',()=>{
  const c=catalogue(Array.from({length:30},(_,i)=>recipe(`drink-${i}`,['gin',`purchase-${String(i).padStart(2,'0')}`])));
  const r=createCabinetPlanner().plan(c,pantry(),1,{goal:'taste',taste:rated(c,[['drink-29','like']])});
  assert.equal(r.plans.length,30);assert.equal(r.plans[0]!.ingredientIds[0],'purchase-29');
});

test('excluded, unavailable and already covered source versions cannot create a gain',()=>{
  const c=catalogue([recipe('owned',['gin'],{cocktailId:'covered'}),recipe('covered-source',['gin','soda'],{cocktailId:'covered'}),recipe('allowed',['gin','dry'],{cocktailId:'same'}),recipe('unavailable',['gin','soda','rare'],{cocktailId:'same'})]);
  const r=createCabinetPlanner().plan(c,pantry(),1,{goal:'taste',taste:rated(c,[['unavailable','like']]),query:{excludedIngredientIds:['soda']}});
  assert.deepEqual(ids(r),['dry']);assert.deepEqual(r.plans[0]!.preference!.versionIds,['allowed']);
  assert.deepEqual(r.plans[0]!.cocktails.map(d=>d.cocktailId),['same']);
});

test('ready plans cannot be displaced by a liked source that still needs brand confirmation',()=>{
  const c=data();c.brands=[{id:'premium',name:'Premium',ingredientIds:['gin']}];c.versions[0]!.ingredients[0]!.brandId='premium';
  const r=createCabinetPlanner().plan(c,pantry(),1,{goal:'taste',taste:rated(c,[['dry','like'],['soda','dislike']])});
  assert.deepEqual(ids(r),['soda','dry']);
  assert.equal(r.plans[1]!.cocktails[0]!.needsReviewVersions[0]!.unconfirmedBrands[0]!.brandId,'premium');
});

test('context tiers precede preference and stay attached to the unlocked exact version',()=>{
  const c=data(),evidence:ContextEvidence[]=[{versionId:'dry',sourceId:'source',basis:'editorial',recipeDigest:'a'.repeat(64),reviewedAt:'2026-10-23',occasions:[{value:'aperitif',reason:'bitter-dry'}],seasons:[]}];
  const r=createCabinetPlanner().plan(c,pantry(),1,{goal:'taste',taste:rated(c,[['soda','like'],['dry','dislike']]),context:{occasion:'aperitif'},evidence});
  assert.deepEqual(ids(r),['dry','soda']);
  const filtered=createCabinetPlanner().plan(c,pantry(),1,{goal:'taste',taste:rated(c,[['dry','like']]),query:{excludedIngredientIds:['dry']},context:{occasion:'aperitif'},evidence});
  assert.deepEqual(ids(filtered),['soda']);assert.equal(filtered.plans[0]!.preference!.contextScore,0);
});

test('multiple source versions count as one positive cocktail and select one legal representative',()=>{
  const c=catalogue([recipe('one',['gin','dry'],{cocktailId:'same'}),recipe('two',['gin','dry'],{cocktailId:'same'})]);
  const r=createCabinetPlanner().plan(c,pantry(),1,{goal:'taste',taste:rated(c,[['one','like'],['two','like']])});
  assert.equal(r.plans[0]!.preference!.positiveCocktailCount,1);assert.equal(r.plans[0]!.preference!.versionIds.length,1);
  assert.deepEqual(r.plans[0]!.cocktails[0]!.readyVersions.map(v=>v.versionId),['one','two']);
});

test('unchanged calls and goal toggles reuse bounded immutable cached results',()=>{
  const c=data(),p=pantry(),taste=rated(c,[['soda','like']]),planner=createCabinetPlanner();
  const first=planner.plan(c,p,1,{goal:'taste',taste});
  assert.strictEqual(planner.plan(c,p,1,{goal:'taste',taste}),first);
  planner.plan(c,p,1,{goal:'coverage',taste});
  assert.strictEqual(planner.plan(c,p,1,{goal:'taste',taste}),first);
  assert.throws(()=>first.plans[0]!.ingredientIds.push('poison'));
  assert.deepEqual(ids(planner.plan(c,p,1,{goal:'taste',taste})),['soda','dry']);
});

test('editing, removing and restoring saved feedback invalidate a live planner',()=>{
  const c=data(),p=pantry(),taste=rated(c,[['soda','like'],['dry','dislike']]),planner=createCabinetPlanner();
  const first=planner.plan(c,p,1,{goal:'taste',taste});assert.equal(ids(first)[0],'soda');
  taste.entries[0]!.sentiment='dislike';taste.entries[1]!.sentiment='like';
  assert.equal(ids(planner.plan(c,p,1,{goal:'taste',taste}))[0],'dry');
  taste.entries=[];assert.equal(planner.plan(c,p,1,{goal:'taste',taste}).status,'cold-start');
  const restored=rated(c,[['soda','like'],['dry','dislike']]);
  assert.equal(ids(planner.plan(c,p,1,{goal:'taste',taste:restored}))[0],'soda');
});

test('brand ownership changes and an owned ingredient added in place invalidate enumeration',()=>{
  const c=data(),p=pantry();c.brands=[{id:'premium',name:'Premium',ingredientIds:['gin']}];c.versions[0]!.ingredients[0]!.brandId='premium';
  const taste=rated(c,[['dry','like'],['soda','dislike']]),planner=createCabinetPlanner();
  assert.equal(ids(planner.plan(c,p,1,{goal:'taste',taste}))[0],'soda');
  p.brandsByIngredient.gin=['premium'];assert.equal(ids(planner.plan(c,p,1,{goal:'taste',taste}))[0],'dry');
  p.ingredientIds.push('dry');assert.deepEqual(ids(planner.plan(c,p,1,{goal:'taste',taste})),['soda']);
});

test('current source and snapshot metadata changes invalidate exact-rating score caches',()=>{
  const c=data(),p=pantry(),taste=rated(c,[['soda','like']]),planner=createCabinetPlanner();
  const first=planner.plan(c,p,1,{goal:'taste',taste}).plans.find(p=>p.ingredientIds[0]==='soda')!.preference!.utility;
  c.versions[1]!.label.en='Updated source version';
  const second=planner.plan(c,p,1,{goal:'taste',taste}).plans.find(p=>p.ingredientIds[0]==='soda')!.preference!.utility;
  assert(Math.abs(first-second-1)<1e-9);
  assert.equal(Object.isFrozen(c),false);
});


test('planning works without a structuredClone global and still protects cached results',()=>{
  const original=globalThis.structuredClone;
  try{
    Object.defineProperty(globalThis,'structuredClone',{value:undefined,configurable:true,writable:true});
    const c=data(),p=pantry(),taste=rated(c,[['soda','like']]),planner=createCabinetPlanner();
    const result=planner.plan(c,p,1,{goal:'taste',taste});
    assert.deepEqual(ids(result),['soda','dry']);
    assert.throws(()=>result.plans[0]!.ingredientIds.push('poison'));
    assert.strictEqual(planner.plan(c,p,1,{goal:'taste',taste}),result);
    assert.equal(Object.isFrozen(c),false);
  }finally{Object.defineProperty(globalThis,'structuredClone',{value:original,configurable:true,writable:true});}
});

test('a review-only source cannot lend its context or taste to a ready source of the same cocktail',()=>{
  const c=catalogue([recipe('ready',['gin','dry'],{cocktailId:'same'}),recipe('review',['gin','dry'],{cocktailId:'same'})]);
  c.brands=[{id:'premium',name:'Premium',ingredientIds:['gin']}];c.versions[1]!.ingredients[0]!.brandId='premium';
  const evidence:ContextEvidence[]=[{versionId:'review',sourceId:'source',basis:'editorial',recipeDigest:'a'.repeat(64),reviewedAt:'2026-10-23',occasions:[{value:'aperitif',reason:'bitter-dry'}],seasons:[]}];
  const r=createCabinetPlanner().plan(c,pantry(),1,{goal:'taste',taste:rated(c,[['ready','dislike'],['review','like']]),context:{occasion:'aperitif'},evidence});
  const plan=r.plans[0]!;
  assert.equal(plan.preference!.contextScore,0);assert.equal(plan.preference!.reviewOnly,false);
  assert(!plan.preference!.versionIds.includes('review'));
  assert.deepEqual(plan.cocktails[0]!.readyVersions.map(v=>v.versionId),['ready']);
  assert.deepEqual(plan.cocktails[0]!.needsReviewVersions.map(v=>v.versionId),['review']);
});

test('positive utility from a lower context tier is excluded from plan aggregation',()=>{
  const c=catalogue([recipe('context',['gin','dry']),recipe('lower',['gin','dry'])]);
  const evidence:ContextEvidence[]=[{versionId:'context',sourceId:'source',basis:'editorial',recipeDigest:'a'.repeat(64),reviewedAt:'2026-10-23',occasions:[{value:'aperitif',reason:'bitter-dry'}],seasons:[]}];
  const r=createCabinetPlanner().plan(c,pantry(),1,{goal:'taste',taste:rated(c,[['context','dislike'],['lower','like']]),context:{occasion:'aperitif'},evidence});
  assert.equal(r.plans[0]!.preference!.contextScore,1);
  assert(!r.plans[0]!.preference!.versionIds.includes('lower'));
  assert.equal(r.plans[0]!.preference!.positiveCocktailCount,0);
  assert.equal(r.plans[0]!.preference!.utility,0);
});

test('same-instance query and context evidence edits invalidate their respective caches',()=>{
  const c=data(),p=pantry(),taste=rated(c,[['soda','like'],['dry','dislike']]),planner=createCabinetPlanner();
  const query={excludedIngredientIds:[] as string[]};
  const evidence:ContextEvidence[]=[{versionId:'dry',sourceId:'source',basis:'editorial',recipeDigest:'a'.repeat(64),reviewedAt:'2026-10-23',occasions:[{value:'aperitif',reason:'bitter-dry'}],seasons:[]}];
  const options={goal:'taste' as const,taste,query,context:{occasion:'aperitif' as const},evidence};
  assert.equal(ids(planner.plan(c,p,1,options))[0],'dry');
  evidence[0]!.sourceId='wrong-source';assert.equal(ids(planner.plan(c,p,1,options))[0],'soda');
  query.excludedIngredientIds.push('soda');assert.deepEqual(ids(planner.plan(c,p,1,options)),['dry']);
  query.excludedIngredientIds=[];assert.equal(ids(planner.plan(c,p,1,options))[0],'soda');
});

test('same-instance material concept, OR alternatives and guarded original-row edits invalidate enumeration',()=>{
  const c=catalogue([recipe('drink',['gin','dry'])]),p=pantry(),taste=emptyTasteState(),planner=createCabinetPlanner();
  c.ingredients.push({id:'soda',name:L('Soda'),compositionKnown:true,exclusionTags:[]},{id:'style',name:L('Style'),compositionKnown:true,exclusionTags:[]});
  c.materialRequirements=[{versionId:'drink',rowIndex:1,originalRow:{...c.versions[0]!.ingredients[1]!},sourceName:L('Dry or soda'),acceptedIngredientIds:['dry','soda']}];
  assert.deepEqual(ids(planner.plan(c,p,1,{goal:'coverage',taste})),['dry','soda']);
  c.materialRequirements[0]!.acceptedIngredientIds!.splice(1,1);assert.deepEqual(ids(planner.plan(c,p,1,{goal:'coverage',taste})),['dry']);
  c.materialRequirements[0]!.acceptedIngredientIds!.push('soda');
  c.versions[0]!.ingredients[1]!.amount=31;assert.deepEqual(ids(planner.plan(c,p,1,{goal:'coverage',taste})),['dry']);
  c.materialConcepts=[{id:'gin',name:L('Gin'),memberIds:['gin','style'],kind:'pure-spirit',basis:'Reviewed'}];
  p.ingredientIds=['style'];assert.deepEqual(ids(planner.plan(c,p,1,{goal:'coverage',taste})),['dry']);
  c.materialConcepts[0]!.memberIds.pop();assert.deepEqual(ids(planner.plan(c,p,1,{goal:'coverage',taste})),[]);
});
