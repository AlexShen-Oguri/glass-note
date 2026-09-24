import assert from 'node:assert/strict';
import test from 'node:test';
import type {Catalogue,Localized,RecipeIngredient,RecipeVersion,SearchQuery} from '../contracts';
import {recipeSnapshot} from '../making';
import {searchCocktails} from '../search';
import {createFeedback,editFeedback,parseTasteState,rankWithTaste,validateTasteState,type TasteFeedbackInput,type TasteState} from '.';

const L=(value:string):Localized=>({en:value,zh:value,fr:value,de:value,es:value,ko:value,ja:value,it:value});
const NOW='2026-09-11T12:00:00Z',LATER='2026-09-11T13:00:00+00:00';
const neutral: TasteFeedbackInput={experience:'drank',sentiment:'neutral',tooSweet:false,tooStrong:false,likedFlavours:[],notes:''};
function version(id:string,cocktailId:string,ingredients:RecipeIngredient[],options:Partial<RecipeVersion>={}):RecipeVersion{
  return{id,cocktailId,label:L(id),sourceId:'source',servings:1,ingredients,steps:{en:['Mix'],zh:['Mix'],fr:['Mix'],de:['Mix'],es:['Mix'],ko:['Mix'],ja:['Mix'],it:['Mix']},originalLanguage:'en',glass:L('Glass'),garnish:L('None'),flavours:[],tastes:[],strength:null,approachability:null,profileBasis:'source',profileNote:L('Facts'),sourceChecked:true,translationStatus:'draft',...options};
}
function catalogue(versions:RecipeVersion[],options:{ingredients?:Catalogue['ingredients'];cocktails?:Catalogue['cocktails'];brands?:Catalogue['brands']}={}):Catalogue{
  const ids=[...new Set(versions.flatMap(item=>item.ingredients.map(row=>row.ingredientId)))];
  return{
    versions,
    ingredients:options.ingredients??ids.map(id=>({id,name:L(id),exclusionTags:[],compositionKnown:true})),
    brands:options.brands??[],sources:[{id:'source',title:'Source',url:'https://example.com/recipe',checkedAt:'2026-09-11'}],
    cocktails:options.cocktails??versions.map(item=>({id:item.cocktailId,name:L(item.cocktailId),aliases:[],category:'classic',description:L('Drink'),versionIds:[item.id],defaultVersionId:item.id,accent:'#fff'})),
  };
}
function state(entries:TasteState['entries']=[]):TasteState{return{format:'glass-notes-taste',schemaVersion:1,entries};}

test('feedback creation and editing preserve the immutable source snapshot and enforce monotonic ISO times',()=>{
  const data=catalogue([version('v','drink',[{ingredientId:'gin',amount:30,unit:'ml'}])]);
  const recipe=recipeSnapshot(data,'v')!;
  const created=createFeedback(recipe,'feedback-1',NOW,{...neutral,sentiment:'like',likedFlavours:['herbal'],notes:'private note'});
  recipe.title.en='Mutated';
  assert.equal(created.recipe.title.en,'drink');
  const edited=editFeedback(created,LATER,{...neutral,experience:'made',tooSweet:true});
  assert.equal(edited.createdAt,NOW);assert.equal(edited.updatedAt,LATER);assert.equal(edited.sentiment,'neutral');assert.equal(edited.tooSweet,true);
  assert.throws(()=>editFeedback(created,'2026-09-11T11:59:59Z',neutral),/before existing timestamp/);
  assert.throws(()=>createFeedback(created.recipe,'bad','2026-02-30T00:00:00Z',neutral),/invalid date/);
  assert.throws(()=>createFeedback(created.recipe,'bad','2026-09-11T12:00:00',neutral),/invalid date/);
});

test('taste state validation rejects unknown fields, enums, duplicate ids, unsafe keys, and oversized JSON',()=>{
  const recipe=recipeSnapshot(catalogue([version('v','drink',[{ingredientId:'gin',amount:30,unit:'ml'}])]),'v')!;
  const entry=createFeedback(recipe,'one',NOW,neutral);
  assert.throws(()=>validateTasteState({...state([entry]),future:true}),/unsupported future/);
  assert.throws(()=>validateTasteState(state([entry,{...entry}])),/duplicate id/);
  assert.throws(()=>createFeedback(recipe,'two',NOW,{...neutral,experience:'guessed' as never}),/unsupported/);
  assert.throws(()=>parseTasteState('{bad'),/invalid JSON/);
  assert.throws(()=>parseTasteState(JSON.stringify({padding:'x'.repeat(5_000_001)})),/invalid JSON/);
  assert.throws(()=>parseTasteState('{"format":"glass-notes-taste","schemaVersion":1,"entries":[],"__proto__":{}}'),/unsafe key/);
  assert.deepEqual(parseTasteState(null),state());
});

test('no feedback or deleted feedback preserves search order, exact selected version, score, and reasons',()=>{
  const versions=[version('a','alpha',[{ingredientId:'gin',amount:30,unit:'ml'}]),version('b','beta',[{ingredientId:'rum',amount:30,unit:'ml'}])];
  const data=catalogue(versions),query:SearchQuery={};const baseline=searchCocktails(data,query);
  assert.deepEqual(rankWithTaste(data,query,state()),baseline.map(result=>({...result,memoryReasons:[]})));
  const liked=createFeedback(recipeSnapshot(data,'b')!,'liked',NOW,{...neutral,sentiment:'like'});
  assert.equal(rankWithTaste(data,query,state([liked]))[0]!.cocktailId,'beta');
  assert.deepEqual(rankWithTaste(data,query,state([])),baseline.map(result=>({...result,memoryReasons:[]})));
});

test('hard exclusions remain hard for egg, dairy, and unknown composition despite liked memories',()=>{
  const versions=[
    version('egg-v','egg-drink',[{ingredientId:'egg',amount:1,unit:'piece'}]),
    version('dairy-v','dairy-drink',[{ingredientId:'milk',amount:30,unit:'ml'}]),
    version('unknown-v','unknown-drink',[{ingredientId:'compound',amount:30,unit:'ml'}]),
    version('safe-v','safe-drink',[{ingredientId:'gin',amount:30,unit:'ml'}]),
  ];
  const ingredients=[
    {id:'egg',name:L('Egg'),exclusionTags:['egg'] as const,compositionKnown:true},
    {id:'milk',name:L('Milk'),exclusionTags:['dairy'] as const,compositionKnown:true},
    {id:'compound',name:L('Compound'),exclusionTags:[],compositionKnown:false},
    {id:'gin',name:L('Gin'),exclusionTags:['gin'] as const,compositionKnown:true},
  ];
  const data=catalogue(versions,{ingredients:ingredients.map(item=>({...item,exclusionTags:[...item.exclusionTags]}))});
  const entries=versions.slice(0,3).map((item,index)=>createFeedback(recipeSnapshot(data,item.id)!,`like-${index}`,NOW,{...neutral,sentiment:'like'}));
  assert.deepEqual(rankWithTaste(data,{excluded:['egg','dairy']},state(entries)).map(item=>item.cocktailId),['safe-drink']);
});

test('exact sentiment never crosses source versions and only an eligible searched version can be selected',()=>{
  const a=version('version-a','drink',[{ingredientId:'gin',amount:30,unit:'ml',brandId:'brand-a'}]);
  const b=version('version-b','drink',[{ingredientId:'gin',amount:30,unit:'ml',brandId:'brand-b'}]);
  const cocktails=[{id:'drink',name:L('Drink'),aliases:[],category:'classic' as const,description:L('Drink'),versionIds:['version-a','version-b'],defaultVersionId:'version-a',accent:'#fff'}];
  const brands=[{id:'brand-a',name:'A',ingredientIds:['gin']},{id:'brand-b',name:'B',ingredientIds:['gin']}];
  const data=catalogue([a,b],{cocktails,brands});
  const liked=createFeedback(recipeSnapshot(data,'version-a')!,'liked-a',NOW,{...neutral,sentiment:'like'});
  const result=rankWithTaste(data,{brandIds:['brand-b']},state([liked]))[0]!;
  assert.deepEqual(result.versionIds,['version-b']);assert.equal(result.selectedVersionId,'version-b');assert(!result.memoryReasons.some(item=>item.kind==='liked-version'));
});

test('latest feedback for one exact version replaces contradictory observations instead of stacking',()=>{
  const a=version('a','drink',[{ingredientId:'gin',amount:30,unit:'ml'}],{flavours:['citrus']});
  const b=version('b','drink',[{ingredientId:'rum',amount:30,unit:'ml'}],{flavours:['citrus']});
  const cocktails=[{id:'drink',name:L('Drink'),aliases:[],category:'classic' as const,description:L('Drink'),versionIds:['a','b'],defaultVersionId:'a',accent:'#fff'}];
  const data=catalogue([a,b],{cocktails});
  const old=createFeedback(recipeSnapshot(data,'a')!,'old',NOW,{...neutral,sentiment:'like',likedFlavours:['citrus']});
  const latest=createFeedback(recipeSnapshot(data,'a')!,'latest',LATER,{...neutral,sentiment:'dislike'});
  const result=rankWithTaste(data,{},state([old,latest]))[0]!;
  assert.equal(result.selectedVersionId,'b');
  assert(!result.memoryReasons.some(item=>item.feedbackIds.includes('old')));
});

test('latest feedback compares ISO instants rather than misleading offset strings',()=>{
  const a=version('a','drink',[{ingredientId:'gin',amount:30,unit:'ml'}]),b=version('b','drink',[{ingredientId:'rum',amount:30,unit:'ml'}]);
  const cocktails=[{id:'drink',name:L('Drink'),aliases:[],category:'classic' as const,description:L('Drink'),versionIds:['a','b'],defaultVersionId:'a',accent:'#fff'}];
  const data=catalogue([a,b],{cocktails}),recipe=recipeSnapshot(data,'a')!;
  const earlier=createFeedback(recipe,'earlier','2026-09-11T13:30:00+02:00',{...neutral,sentiment:'like'});
  const later=createFeedback(recipe,'later','2026-09-11T12:00:00Z',{...neutral,sentiment:'dislike'});
  assert.equal(rankWithTaste(data,{},state([earlier,later]))[0]!.selectedVersionId,'b');
});

test('reused version ids do not inherit exact sentiment after the public snapshot changes',()=>{
  const oldData=catalogue([version('v','drink',[{ingredientId:'gin',amount:30,unit:'ml'}])]);
  const liked=createFeedback(recipeSnapshot(oldData,'v')!,'liked-old',NOW,{...neutral,sentiment:'like'});
  const current=catalogue([version('v','drink',[{ingredientId:'gin',amount:45,unit:'ml'}])]);
  const result=rankWithTaste(current,{},state([liked]))[0]!;
  assert(!result.memoryReasons.some(item=>item.kind==='liked-version'));
});

test('same version id with distinct imported snapshots keeps each identity and matches the current one',()=>{
  const oldData=catalogue([version('v','drink',[{ingredientId:'gin',amount:30,unit:'ml'}])]);
  const changedData=catalogue([version('v','drink',[{ingredientId:'gin',amount:45,unit:'ml'}])]);
  const oldLiked=createFeedback(recipeSnapshot(oldData,'v')!,'old-liked',NOW,{...neutral,sentiment:'like'});
  const changedDisliked=createFeedback(recipeSnapshot(changedData,'v')!,'changed-disliked',LATER,{...neutral,sentiment:'dislike'});
  const validated=validateTasteState(state([oldLiked,changedDisliked]));assert.equal(validated.entries.length,2);
  const result=rankWithTaste(oldData,{},validated)[0]!;
  assert(result.memoryReasons.some(item=>item.kind==='liked-version'&&item.feedbackIds.includes('old-liked')));
  assert(!result.memoryReasons.some(item=>item.feedbackIds.includes('changed-disliked')));
});

test('sweet and strong observations only caution explicitly described matching candidates',()=>{
  const data=catalogue([version('v','drink',[{ingredientId:'gin',amount:30,unit:'ml'}],{tastes:['sweet'],strength:'strong'})]);
  const observed=createFeedback(recipeSnapshot(data,'v')!,'observed',NOW,{...neutral,tooSweet:true,tooStrong:true});
  const result=rankWithTaste(data,{},state([observed]))[0]!;
  assert.deepEqual(result.memoryReasons.map(item=>item.kind),['sweet-caution','strong-caution']);
  assert(result.memoryReasons.every(item=>item.feedbackIds[0]==='observed'));
});

test('reason evidence is capped at three stable ids without changing ranking strength',()=>{
  const data=catalogue([version('v','drink',[{ingredientId:'gin',amount:30,unit:'ml'}],{flavours:['herbal']})]);
  const entries=['d','b','a','c'].map((id,index)=>{
    const distinct=catalogue([version(`memory-${id}`,`memory-${id}`,[{ingredientId:'gin',amount:30+index,unit:'ml'}])]);
    return createFeedback(recipeSnapshot(distinct,`memory-${id}`)!,id,NOW,{...neutral,likedFlavours:['herbal']});
  });
  const three=rankWithTaste(data,{},state(entries.slice(0,3)))[0]!,four=rankWithTaste(data,{},state(entries))[0]!;
  assert.equal(three.selectedVersionId,four.selectedVersionId);assert.equal(three.score,four.score);
  assert.deepEqual(four.memoryReasons[0]!.feedbackIds,['a','b','c']);assert.equal(four.memoryReasons[0]!.feedbackIds.length,3);
});

test('missing version snapshots remain valid memory but are not described as the selected source version',()=>{
  const oldData=catalogue([version('removed','old',[{ingredientId:'gin',amount:30,unit:'ml'}],{flavours:['herbal']})]);
  const missing=createFeedback(recipeSnapshot(oldData,'removed')!,'missing',NOW,{...neutral,sentiment:'like',likedFlavours:['herbal']});
  assert.equal(validateTasteState(state([missing])).entries[0]!.recipe.version.id,'removed');
  const current=catalogue([version('current','current',[{ingredientId:'gin',amount:30,unit:'ml'}],{flavours:['herbal']})]);
  const result=rankWithTaste(current,{},state([missing]))[0]!;
  assert.equal(result.selectedVersionId,'current');assert(result.memoryReasons.some(item=>item.kind==='liked-flavour'&&item.feedbackIds.includes('missing')));assert(!result.memoryReasons.some(item=>item.kind==='liked-version'));
});

test('experience and freeform notes never affect ranking without explicit taste fields',()=>{
  const data=catalogue([version('a','alpha',[{ingredientId:'gin',amount:30,unit:'ml'}]),version('b','beta',[{ingredientId:'rum',amount:30,unit:'ml'}])]);
  const baseline=rankWithTaste(data,{},state());
  const note=createFeedback(recipeSnapshot(data,'b')!,'note',NOW,{...neutral,experience:'both',notes:'Loved citrus, hated sweetness, very strong'});
  assert.deepEqual(rankWithTaste(data,{},state([note])),baseline);
});
