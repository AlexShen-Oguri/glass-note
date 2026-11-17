import assert from 'node:assert/strict';
import test from 'node:test';
import type {Catalogue, Localized, RecipeVersion} from '../contracts';
import {recipeSnapshot} from '../making';
import {createFeedback, deriveTasteProfile, emptyTasteState, parseTasteState, rankWithTaste, type TasteFeedback, type TasteFeedbackInput, type TasteState} from '.';
import {recommendDiscovery, scoreTasteVersions} from './recommendations';

const L=(text:string):Localized=>({en:text,zh:text,fr:text,de:text,es:text,ko:text,ja:text,it:text});
const NOW='2026-10-17T12:00:00Z';
const neutral:TasteFeedbackInput={experience:'drank',sentiment:'neutral',tooSweet:false,tooStrong:false,likedFlavours:[],notes:''};
function version(id:string, changes:Partial<RecipeVersion>={}):RecipeVersion{
  return{id,cocktailId:id,label:L(id),sourceId:'source',servings:1,ingredients:[{ingredientId:'gin',amount:30,unit:'ml'}],steps:{en:['Mix'],zh:['Mix'],fr:['Mix'],de:['Mix'],es:['Mix'],ko:['Mix'],ja:['Mix'],it:['Mix']},originalLanguage:'en',glass:L('Glass'),garnish:L('None'),flavours:[],tastes:[],strength:null,approachability:null,profileBasis:'source',profileNote:L('Facts'),sourceChecked:true,translationStatus:'draft',...changes};
}
function catalogue(versions:RecipeVersion[]):Catalogue{
  const ids=[...new Set(versions.flatMap(item=>item.ingredients.map(row=>row.ingredientId)))];
  const cocktailIds=[...new Set(versions.map(item=>item.cocktailId))];
  return{versions,ingredients:ids.map(id=>({id,name:L(id),exclusionTags:[],compositionKnown:true})),brands:[],sources:[{id:'source',title:'Source',url:'https://example.com/recipe',checkedAt:'2026-10-17'}],cocktails:cocktailIds.map(id=>({id,name:L(id),aliases:[],category:'classic',description:L('Drink'),versionIds:versions.filter(item=>item.cocktailId===id).map(item=>item.id),defaultVersionId:versions.find(item=>item.cocktailId===id)!.id,accent:'#fff'}))};
}
const state=(entries:TasteFeedback[]=[]):TasteState=>({...emptyTasteState(),entries});
function feedback(data:Catalogue,id:string,versionId:string,input:Partial<TasteFeedbackInput>={},now=NOW):TasteFeedback{
  return createFeedback(recipeSnapshot(data,versionId)!,id,now,{...neutral,...input});
}
const recommend=(data:Catalogue,entries:TasteFeedback[]=[],seed='one',limit=6)=>recommendDiscovery(data,{},state(entries),{seed,limit});
const item=(result:ReturnType<typeof recommend>,id:string)=>result.items.find(value=>value.cocktailId===id)!;

test('mixed-case imported duplicate IDs choose one identical latest observation in every taste view',()=>{
  const data=catalogue([version('same',{flavours:['citrus']})]);
  const entries=[feedback(data,'Z','same',{sentiment:'like',likedFlavours:['citrus']}),feedback(data,'a','same',{sentiment:'dislike'})];
  for(const ordered of [entries,[...entries].reverse()]){
    const saved=state(ordered);
    assert.deepEqual(deriveTasteProfile(saved).flavours,[]);
    assert.deepEqual(rankWithTaste(data,{},saved)[0]!.memoryReasons,[{kind:'disliked-version',feedbackIds:['a']}]);
    assert.deepEqual(recommend(data,ordered).items[0]!.reasons,[{kind:'disliked-version',feedbackIds:['a']}]);
  }
});

test('six exact likes cannot crowd equally promising unrated cocktails out of the exploration slot',()=>{
  const data=catalogue(Array.from({length:8},(_,index)=>version(`drink-${index}`)));
  const entries=data.versions.slice(0,6).map(value=>feedback(data,value.id,value.id,{sentiment:'like'}));
  const result=recommend(data,entries);
  assert.equal(result.status,'personalized');
  assert.equal(result.items.filter(value=>value.kind==='familiar').length,5);
  assert.equal(result.items[5]!.kind,'explore');
  assert(['drink-6','drink-7'].includes(result.items[5]!.cocktailId));
});

test('large valid imported snapshots have a bounded synchronous interaction budget',()=>{
  const ingredients=Array.from({length:800},(_,index)=>({ingredientId:`ingredient-${index}`,amount:30,unit:'ml' as const}));
  const old=catalogue(Array.from({length:20},(_,index)=>version(`old-${index}`,{ingredients})));
  const entries=old.versions.map(value=>feedback(old,value.id,value.id,{sentiment:'like'}));
  const saved=parseTasteState(JSON.stringify(state(entries)));
  const ordinary=catalogue(Array.from({length:8},(_,index)=>version(`current-${index}`)));
  const start=performance.now();const result=recommendDiscovery(ordinary,{},saved,{seed:'bounded'});
  const elapsed=performance.now()-start;
  assert.equal(result.diagnostics.trainingRecipeCount,20);
  assert(elapsed<2500,`valid imported snapshots blocked discovery for ${elapsed.toFixed(0)}ms`);
});

test('cold start returns a stable diverse six without fabricated personal reasons',()=>{
  const data=catalogue([version('a'),version('b'),version('c'),version('d'),version('e'),version('f',{ingredients:[{ingredientId:'rum',amount:30,unit:'ml'}],flavours:['fruit']}),version('g',{ingredients:[{ingredientId:'coffee',amount:30,unit:'ml'}],flavours:['coffee']})]);
  const result=recommend(data);
  assert.equal(result.status,'cold-start');
  assert.equal(result.items.length,6);
  assert.equal(new Set(result.items.map(value=>value.cocktailId)).size,6);
  assert(result.items.some(value=>value.cocktailId==='f'));
  assert(result.items.some(value=>value.cocktailId==='g'));
  assert(result.items.every(value=>value.kind==='discovery'&&value.reasons.length===0));
  assert.deepEqual(result,recommend(data,[],'another'));
});

test('experience and notes alone remain cold while unchecked aspect flags are not negative observations',()=>{
  const data=catalogue([version('a'),version('b',{flavours:['citrus']}),version('c'),version('d'),version('e'),version('f')]);
  const result=recommend(data,[feedback(data,'seen','a',{notes:'I love citrus and hate sweet drinks'})]);
  assert.equal(result.status,'cold-start');
  assert.equal(result.diagnostics.trainingObservationCount,0);
  assert.deepEqual(result.items,recommend(data).items);
});

test('hard filters only return eligible source versions and deduplicate cocktail identities',()=>{
  const data=catalogue([version('wrong',{cocktailId:'a',flavours:['coffee']}),version('right',{cocktailId:'a',flavours:['citrus']}),version('b',{flavours:['coffee']}),version('c',{flavours:['citrus']})]);
  const result=recommendDiscovery(data,{flavours:['citrus']},state([feedback(data,'liked','wrong',{sentiment:'like'})]),{seed:'one'});
  assert.deepEqual(new Set(result.items.map(value=>value.selectedVersionId)),new Set(['right','c']));
  assert.equal(result.status,'insufficient-candidates');
  assert.equal(result.items.length,2);
  const blocked=recommendDiscovery(data,{excludedIngredientIds:['gin']},state(),{seed:'one'});
  assert.equal(blocked.items.length,0);
});

test('Bayesian combination learning distinguishes a liked pair despite disliking either component in other pairs',()=>{
  const pair=(id:string,first:string,second:string)=>version(id,{ingredients:[{ingredientId:first,amount:30,unit:'ml'},{ingredientId:second,amount:30,unit:'ml'}]});
  const training=catalogue(Array.from({length:12},(_,index)=>[pair(`ab-${index}`,'a','b'),pair(`ac-${index}`,'a','c'),pair(`db-${index}`,'d','b'),pair(`dc-${index}`,'d','c')]).flat());
  const entries=training.versions.map(value=>feedback(training,value.id,value.id,{sentiment:value.id.startsWith('ab')||value.id.startsWith('dc')?'like':'dislike'}));
  const candidates=catalogue([pair('liked-combination','a','b'),pair('disliked-combination','a','c'),pair('other-liked','d','c'),pair('other-disliked','d','b')]);
  const result=recommend(candidates,entries,'one',4);
  assert(item(result,'liked-combination').meanUtility>item(result,'disliked-combination').meanUtility+0.1);
  assert(item(result,'other-liked').meanUtility>item(result,'other-disliked').meanUtility+0.1);
  assert(item(result,'liked-combination').reasons.some(reason=>reason.kind==='learned-combination'&&reason.feedbackIds.length>0));
});

test('explicit flavour pairs also learn a non-additive utility without claiming every component is liked',()=>{
  const variants=(prefix:string,flavours:RecipeVersion['flavours'])=>Array.from({length:10},(_,index)=>version(`${prefix}-${index}`,{flavours}));
  const training=catalogue([...variants('both',['citrus','herbal']),...variants('citrus',['citrus']),...variants('herbal',['herbal']),...variants('neither',[])]);
  const entries=training.versions.map(value=>feedback(training,value.id,value.id,{sentiment:value.id.startsWith('both')||value.id.startsWith('neither')?'like':'dislike'}));
  const candidates=catalogue([version('both',{flavours:['citrus','herbal']}),version('single',{flavours:['citrus']})]);
  const result=recommend(candidates,entries,'one',2);
  assert(item(result,'both').meanUtility>item(result,'single').meanUtility+0.1);
  assert(!result.items.flatMap(value=>value.reasons).some(reason=>reason.kind==='liked-flavour'));
});

test('posterior uncertainty shrinks with independent recipe evidence while duplicate snapshots count once',()=>{
  const data=catalogue([version('target')]);
  const training=catalogue(Array.from({length:20},(_,index)=>version(`memory-${index}`)));
  const entries=training.versions.map(value=>feedback(training,value.id,value.id,{sentiment:'like'}));
  const prior=item(recommend(data),'target').uncertainty;
  const one=item(recommend(data,entries.slice(0,1)),'target').uncertainty;
  const many=item(recommend(data,entries),'target').uncertainty;
  assert(many<one&&one<prior);
  const duplicated=Array.from({length:50},(_,index)=>({...entries[0]!,id:`duplicate-${index}`}));
  assert.equal(recommend(data,duplicated).diagnostics.trainingObservationCount,1);
  assert.equal(item(recommend(data,duplicated),'target').uncertainty,one);
});

test('positive explicit aspect observations do not treat an unselected aspect as disliked',()=>{
  const data=catalogue([version('citrus',{flavours:['citrus']}),version('herbal',{flavours:['herbal']})]);
  const memory=feedback(data,'aspect','citrus',{likedFlavours:['citrus']});
  const result=recommend(data,[memory]);
  assert(item(result,'citrus').meanUtility>0);
  assert.equal(item(result,'herbal').meanUtility,0);
  assert.equal(result.diagnostics.trainingObservationCount,1);
});

test('sweetness and strength observations are separate cautious features with unknown values left unknown',()=>{
  const data=catalogue([version('sweet',{tastes:['sweet']}),version('strong',{strength:'strong'}),version('unknown')]);
  const entries=[feedback(data,'sweet-memory','unknown',{tooSweet:true}),feedback(data,'strong-memory','sweet',{tooStrong:true})];
  const result=recommend(data,entries);
  assert(item(result,'sweet').meanUtility<0);
  assert(item(result,'strong').meanUtility<0);
  assert.equal(item(result,'unknown').meanUtility,0);
  assert(item(result,'sweet').reasons.some(reason=>reason.kind==='sweet-caution'));
  assert(!item(result,'unknown').reasons.some(reason=>reason.kind==='sweet-caution'||reason.kind==='strong-caution'));
});

test('known ratios use comparable units, omit unknown or incompatible quantities and preserve frozen source rows',()=>{
  const rows:RecipeVersion['ingredients']=[{ingredientId:'gin',amount:60,unit:'ml'},{ingredientId:'lemon',amount:30,unit:'ml'}];
  const training=catalogue(Array.from({length:15},(_,index)=>version(`memory-${index}`,{ingredients:rows})));
  const entries=training.versions.map(value=>feedback(training,value.id,value.id,{sentiment:'like'}));
  const candidates=catalogue([version('ml',{ingredients:rows}),version('oz',{ingredients:[{ingredientId:'gin',amount:60/29.5735295625,unit:'oz'},{ingredientId:'lemon',amount:30/29.5735295625,unit:'oz'}]}),version('unknown',{ingredients:[{ingredientId:'gin',amount:null,unit:'ml'},{ingredientId:'lemon',amount:30,unit:'ml'}]}),version('incompatible',{ingredients:[{ingredientId:'gin',amount:60,unit:'g'},{ingredientId:'lemon',amount:30,unit:'ml'}]}),version('opposite',{ingredients:[{ingredientId:'gin',amount:30,unit:'ml'},{ingredientId:'lemon',amount:60,unit:'ml'}]})]);
  const before=JSON.stringify(candidates);
  const result=recommend(candidates,entries,'one',5);
  assert(Math.abs(item(result,'ml').meanUtility-item(result,'oz').meanUtility)<1e-10);
  assert.equal(item(result,'unknown').meanUtility,item(result,'incompatible').meanUtility);
  assert(item(result,'ml').meanUtility>item(result,'opposite').meanUtility);
  assert.equal(JSON.stringify(candidates),before);
});

test('latest full frozen identity wins deterministically, and changes never inherit an exact rating',()=>{
  const old=catalogue([version('same')]);
  const changed=catalogue([version('same',{ingredients:[{ingredientId:'gin',amount:45,unit:'ml'}]})]);
  const liked=feedback(old,'a','same',{sentiment:'like'});
  const disliked=feedback(old,'z','same',{sentiment:'dislike'});
  assert(item(recommend(old,[liked,disliked]),'same').reasons.some(reason=>reason.kind==='disliked-version'&&reason.feedbackIds[0]==='z'));
  assert.deepEqual(recommend(old,[liked,disliked]),recommend(old,[disliked,liked]));
  assert(!item(recommend(changed,[liked]),'same').reasons.some(reason=>reason.kind==='liked-version'));
  const edited={...disliked,sentiment:'neutral' as const,updatedAt:'2026-10-17T13:00:00Z'};
  assert.equal(recommend(old,[liked,edited]).diagnostics.trainingObservationCount,0);
  assert.equal(recommend(old,[liked]).diagnostics.trainingObservationCount,1);
  assert.equal(recommend(old,[]).diagnostics.trainingObservationCount,0);
});

test('five deterministic mean picks precede one Thompson exploration and seed changes only the exploration',()=>{
  const data=catalogue(Array.from({length:24},(_,index)=>version(`candidate-${String(index).padStart(2,'0')}`,{ingredients:[{ingredientId:`ingredient-${index}`,amount:30,unit:'ml'}],flavours:[(['citrus','fruit','floral','herbal','spice','coffee'] as const)[index%6]!]})));
  const training=catalogue([version('memory',{flavours:['herbal']})]);
  const entries=[feedback(training,'liked','memory',{sentiment:'like'})];
  const result=recommend(data,entries);
  assert.equal(result.status,'personalized');
  assert.deepEqual(result.items.map(value=>value.selectedVersionId),['candidate-03','candidate-12','candidate-01','candidate-02','candidate-04','candidate-18']);
  assert.deepEqual(result.items.map(value=>value.kind),['familiar','familiar','familiar','familiar','familiar','explore']);
  assert.deepEqual(result,recommend(data,entries));
  const runs=Array.from({length:16},(_,index)=>recommend(data,entries,`seed-${index}`));
  for(const run of runs)assert.deepEqual(run.items.slice(0,5),result.items.slice(0,5));
  assert(new Set(runs.map(run=>run.items[5]!.cocktailId)).size>1);
  assert.equal(new Set(result.items.map(value=>value.cocktailId)).size,6);
});

test('exploration prefers unrated drinks and cannot reintroduce an exactly disliked version',()=>{
  const data=catalogue(Array.from({length:12},(_,index)=>version(`candidate-${index}`,{flavours:index%2?['herbal']:['citrus']})));
  const entries=data.versions.slice(0,7).map((value,index)=>feedback(data,`memory-${index}`,value.id,{sentiment:index===0?'dislike':index===1?'neutral':'like'}));
  const result=recommend(data,entries);
  assert.equal(result.items[5]!.kind,'explore');
  assert(!data.versions.slice(0,7).some(value=>value.cocktailId===result.items[5]!.cocktailId));
  assert.notEqual(result.items[5]!.selectedVersionId,'candidate-0');
});

test('MMR keeps an alternative in the exploitation slate instead of filling it with identical recipes',()=>{
  const data=catalogue([...Array.from({length:10},(_,index)=>version(`similar-${index}`,{flavours:['herbal']})),version('different',{ingredients:[{ingredientId:'rum',amount:30,unit:'ml'}],flavours:['fruit']})]);
  const training=catalogue([version('memory')]);
  const result=recommend(data,[feedback(training,'liked','memory',{sentiment:'like'})]);
  assert(result.items.slice(0,5).some(value=>value.cocktailId==='different'));
});

test('frozen training never reads changed live ingredient taxonomy, method or source metadata',()=>{
  const data=catalogue([version('target',{flavours:['citrus']})]);
  const memory=feedback(data,'liked','target',{sentiment:'like'});
  const other=structuredClone(data);
  other.ingredients[0]!.base='rum';other.ingredients[0]!.guide={family:'coffee',parents:[],aliases:[]};
  other.sources[0]!.author='Another author';
  other.versions[0]!.mixingMethods=[{method:'shake',sourceId:'source',stepIndexes:[0],reviewedAt:'2026-10-17'}];
  const original=recommend(data,[memory]);
  const changed=recommend(other,[memory]);
  assert(item(original,'target').meanUtility>item(changed,'target').meanUtility);
  assert.equal(item(original,'target').uncertainty,item(changed,'target').uncertainty);
  const methodOnly=structuredClone(data);
  methodOnly.versions[0]!.mixingMethods=other.versions[0]!.mixingMethods;
  assert.deepEqual(recommend(methodOnly,[memory]),original);
});

test('known equal ratios remain distinguishable from missing quantities, including dimensionless part recipes',()=>{
  const ratio=(id:string,amount:number|null,unit:'ml'|'part'='ml')=>version(id,{ingredients:[{ingredientId:'gin',amount,unit},{ingredientId:'lemon',amount,unit}]});
  const training=catalogue(Array.from({length:20},(_,index)=>ratio(`memory-${index}`,30)));
  const entries=training.versions.map(value=>feedback(training,value.id,value.id,{sentiment:'like'}));
  const candidates=catalogue([ratio('known',30),ratio('parts',1,'part'),ratio('unknown',null)]);
  const result=recommend(candidates,entries,'one',3);
  assert(item(result,'known').meanUtility>item(result,'unknown').meanUtility);
  assert.equal(item(result,'known').meanUtility,item(result,'parts').meanUtility);
});

test('explicit exploration exclusions rotate only the final slot and exhausted exploration is visible',()=>{
  const data=catalogue(Array.from({length:12},(_,index)=>version(`candidate-${index}`,{ingredients:[{ingredientId:`ingredient-${index}`,amount:30,unit:'ml'}]})));
  const training=catalogue([version('memory')]);
  const entries=[feedback(training,'liked','memory',{sentiment:'like'})];
  const first=recommend(data,entries);
  const rotated=recommendDiscovery(data,{},state(entries),{seed:'one',excludeExplorationCocktailIds:[first.items[5]!.cocktailId]});
  assert.deepEqual(rotated.items.slice(0,5),first.items.slice(0,5));
  assert.notEqual(rotated.items[5]!.cocktailId,first.items[5]!.cocktailId);
  assert.equal(rotated.items[5]!.kind,'explore');
  const exhausted=recommendDiscovery(data,{},state(entries),{seed:'one',excludeExplorationCocktailIds:data.cocktails.map(value=>value.id)});
  assert.deepEqual(exhausted.items.slice(0,5),first.items.slice(0,5));
  assert.equal(exhausted.items[5]!.kind,'familiar');
  assert.equal(exhausted.status,'insufficient-candidates');
});

test('a changed source version of an experienced cocktail is never labelled as a novel exploration',()=>{
  const old=catalogue([version('old',{cocktailId:'experienced'})]);
  const data=catalogue([version('new',{cocktailId:'experienced'}),...Array.from({length:12},(_,index)=>version(`novel-${index}`,{ingredients:[{ingredientId:`ingredient-${index}`,amount:30,unit:'ml'}]}))]);
  const entries=[feedback(old,'memory','old',{sentiment:'like'})];
  for(const seed of ['one','two','three','four'])assert.notEqual(recommend(data,entries,seed).items[5]!.cocktailId,'experienced');
});

test('equal-scoring source versions preserve the search-selected default while a matching exact like can choose another',()=>{
  const data=catalogue([version('default',{cocktailId:'drink'}),version('alternate',{cocktailId:'drink'})]);
  assert.equal(recommend(data).items[0]!.selectedVersionId,'default');
  const memory=feedback(data,'liked','alternate',{sentiment:'like'});
  assert.equal(recommend(data,[memory]).items[0]!.selectedVersionId,'alternate');
  const filtered=recommendDiscovery(data,{ingredientIds:['absent']},state([memory]),{seed:'one'});
  assert.equal(filtered.items.length,0);
});

test('large history rebuilds use a deterministic bounded newest snapshot set without changing exact memory identity',()=>{
  const training=catalogue(Array.from({length:1_005},(_,index)=>version(`memory-${String(index).padStart(4,'0')}`)));
  const entries=training.versions.map(value=>feedback(training,value.id,value.id,{sentiment:'like'}));
  const data=catalogue([version('target')]);
  const result=recommend(data,entries);
  assert.equal(result.diagnostics.latestFeedbackCount,1_005);
  assert(result.diagnostics.trainingRecipeCount<1_005);
  assert.equal(result.diagnostics.trainingRecipeCount+result.diagnostics.omittedTrainingRecipeCount,1_005);
  assert.deepEqual(result,recommend(data,[...entries].reverse()));
});

test('invalid feedback is unavailable instead of inventing cold-start state',()=>{
  const data=catalogue([version('a')]);
  const invalid={...state(),schemaVersion:2} as unknown as TasteState;
  const result=recommendDiscovery(data,{},invalid,{seed:'one'});
  assert.equal(result.status,'unavailable');
  assert.deepEqual(result.items,[]);
});


function scoreVersions(data:Catalogue,entries:TasteFeedback[]=[]){
  return scoreTasteVersions(data,state(entries));
}

test('batch scoring includes all 31 versions and the only preferred source beyond the first 24',()=>{
  const data=catalogue(Array.from({length:31},(_,index)=>version(`candidate-${index}`,{flavours:index===30?['citrus']:[]})));
  const saved=[feedback(data,'aspect','candidate-0',{likedFlavours:['citrus']})];
  const result=scoreVersions(data,saved);
  assert.equal(result.status,'personalized');
  assert.equal(result.versions.length,31);
  assert.deepEqual(result.versions.map(value=>value.versionId),data.versions.map(value=>value.id));
  const preferred=result.versions.find(value=>value.versionId==='candidate-30')!;
  assert(Math.abs(preferred.meanUtility-0.1/8.25)<1e-12);
  assert(result.versions.slice(0,30).every(value=>value.meanUtility===0));
  assert.deepEqual(preferred.reasons,[{kind:'liked-flavour',flavours:['citrus'],feedbackIds:['aspect'],supportCount:1}]);
});

test('batch scores every source of one cocktail and ignores repeated version IDs after their first occurrence',()=>{
  const data=catalogue([version('first',{cocktailId:'drink'}),version('other',{cocktailId:'drink',flavours:['citrus']}),version('first',{cocktailId:'duplicate',flavours:['citrus']})]);
  const result=scoreVersions(data,[feedback(data,'aspect','first',{likedFlavours:['citrus']})]);
  assert.deepEqual(result.versions.map(value=>[value.versionId,value.cocktailId]),[['first','drink'],['other','drink']]);
  assert.equal(result.versions[0]!.meanUtility,0);
  assert(result.versions[1]!.meanUtility>0);
});

test('batch cold start reports zero means with real prior uncertainty and no invented reasons',()=>{
  const data=catalogue([version('plain'),version('citrus',{flavours:['citrus']})]);
  const result=scoreVersions(data,[feedback(data,'seen','plain',{notes:'I like citrus'})]);
  assert.equal(result.status,'cold-start');
  assert.deepEqual(result.versions.map(value=>value.meanUtility),[0,0]);
  assert(Math.abs(result.versions[0]!.uncertainty-0.5)<1e-12);
  assert(Math.abs(result.versions[1]!.uncertainty-Math.sqrt(3/8))<1e-12);
  assert(result.versions.every(value=>value.reasons.length===0));
  assert.deepEqual(result.diagnostics,{latestFeedbackCount:1,trainingObservationCount:0,trainingRecipeCount:0,omittedTrainingRecipeCount:0,featureCount:120});
});

test('batch posterior matches a hand-derived ridge solution and discovery means exactly',()=>{
  const data=catalogue([version('liked'),version('unrated')]);
  const entries=[feedback(data,'memory','liked',{sentiment:'like'})];
  const result=scoreVersions(data,entries);
  // Two unit features: x dot x = 2, prior precision = 8; shared mean = 2/(8+2).
  assert(Math.abs(result.versions[0]!.meanUtility-1.2)<1e-12);
  assert(Math.abs(result.versions[1]!.meanUtility-0.2)<1e-12);
  for(const prediction of result.versions){
    assert(Math.abs(prediction.uncertainty-Math.sqrt(0.2))<1e-12);
    const discovery=item(recommend(data,entries,'known',2),prediction.cocktailId);
    assert.equal(prediction.meanUtility,discovery.meanUtility);
    assert.equal(prediction.uncertainty,discovery.uncertainty);
    assert.deepEqual(prediction.reasons,discovery.reasons.filter(reason=>reason.kind!=='exploration'));
  }
});

test('batch exact rating requires the full frozen source identity while changed metadata never changes training',()=>{
  const original=catalogue([version('same')]);
  const entries=[feedback(original,'liked','same',{sentiment:'like'})];
  const baseline=scoreVersions(original,entries).versions[0]!;
  assert(Math.abs(baseline.meanUtility-1.2)<1e-12);
  assert.deepEqual(baseline.reasons,[{kind:'liked-version',feedbackIds:['liked']}]);
  const changes=[structuredClone(original),structuredClone(original),structuredClone(original),structuredClone(original)];
  changes[0]!.sources[0]!.author='Changed author';
  changes[1]!.ingredients[0]!.name=L('Changed name');
  changes[2]!.versions[0]!.ingredients[0]!.amount=45;
  changes[3]!.versions[0]!.steps.en=['Changed instruction'];
  for(const changed of changes){
    const scored=scoreVersions(changed,entries).versions[0]!;
    assert(Math.abs(scored.meanUtility-0.2)<1e-12);
    assert.equal(scored.uncertainty,baseline.uncertainty);
    assert.deepEqual(scored.reasons,[]);
  }
  const disliked=scoreVersions(original,[feedback(original,'disliked','same',{sentiment:'dislike'})]).versions[0]!;
  assert(Math.abs(disliked.meanUtility+1.2)<1e-12);
  assert.deepEqual(disliked.reasons,[{kind:'disliked-version',feedbackIds:['disliked']}]);
});

test('batch mixed-case duplicate observation IDs share the deterministic latest winner',()=>{
  const data=catalogue([version('same',{flavours:['citrus']})]);
  const entries=[feedback(data,'Z','same',{sentiment:'like',likedFlavours:['citrus']}),feedback(data,'a','same',{sentiment:'dislike'})];
  for(const ordered of [entries,[...entries].reverse()]){
    const result=scoreVersions(data,ordered);
    assert.equal(result.diagnostics.trainingObservationCount,1);
    assert.deepEqual(result.versions[0]!.reasons,[{kind:'disliked-version',feedbackIds:['a']}]);
    assert(Math.abs(result.versions[0]!.meanUtility+1+3/11)<1e-12);
  }
});

test('batch scoring never draws randomness or mutates its catalogue and saved state',()=>{
  const data=catalogue([version('same'),version('other',{flavours:['herbal','citrus']})]);
  const saved=state([feedback(data,'liked','same',{sentiment:'like'})]);
  const before=JSON.stringify({data,saved});
  const first=scoreTasteVersions(data,saved);
  const random=Math.random;
  try{
    Math.random=()=>{throw Error('batch scoring must not draw randomness');};
    assert.deepEqual(scoreTasteVersions(data,saved),first);
  }finally{Math.random=random;}
  assert.equal(JSON.stringify({data,saved}),before);
});

test('batch invalid saved state returns unavailable with no version predictions',()=>{
  const result=scoreTasteVersions(catalogue([version('a')]),{...state(),schemaVersion:2} as unknown as TasteState);
  assert.equal(result.status,'unavailable');
  assert.deepEqual(result.versions,[]);
  assert.deepEqual(result.diagnostics,{latestFeedbackCount:0,trainingObservationCount:0,trainingRecipeCount:0,omittedTrainingRecipeCount:0,featureCount:120});
});

test('batch history cap preserves exact feedback outside the newest 1000 training snapshots',()=>{
  const data=catalogue(Array.from({length:1_005},(_,index)=>version(`memory-${String(index).padStart(4,'0')}`)));
  const entries=data.versions.map(value=>feedback(data,value.id,value.id,{sentiment:'like'}));
  const result=scoreVersions(catalogue([data.versions[0]!]),entries);
  assert.equal(result.diagnostics.latestFeedbackCount,1_005);
  assert.equal(result.diagnostics.trainingRecipeCount,1_000);
  assert.equal(result.diagnostics.omittedTrainingRecipeCount,5);
  assert.deepEqual(result.versions[0]!.reasons,[{kind:'liked-version',feedbackIds:['memory-0000']}]);
  assert(result.versions[0]!.meanUtility>1);
});
