import type {Catalogue, Flavour, RecipeVersion, SearchQuery, Taste} from '../contracts';
import {recipeFingerprint, recipeSnapshot} from '../making';
import {searchCocktails} from '../search';
import {latestTasteFeedback,validateTasteState} from './index';
import type {MemoryReason, TasteFeedback, TasteState} from './types';

export const DISCOVERY_MODEL_REVISION='bayesian-combinations-v1';

export interface DiscoveryReason {
  kind:MemoryReason['kind']|'learned-combination'|'exploration';
  feedbackIds:string[];
  flavours?:Flavour[];
  ingredientIds?:string[];
  supportCount?:number;
}
export interface DiscoveryRecommendation {
  cocktailId:string;
  selectedVersionId:string;
  versionIds:string[];
  kind:'familiar'|'explore'|'discovery';
  reasons:DiscoveryReason[];
  /** Internal linear utility and posterior deviation, never a probability or accuracy. */
  meanUtility:number;
  uncertainty:number;
}
export interface DiscoveryRecommendations {
  items:DiscoveryRecommendation[];
  status:'personalized'|'cold-start'|'insufficient-candidates'|'unavailable';
  diagnostics:{latestFeedbackCount:number;trainingObservationCount:number;trainingRecipeCount:number;omittedTrainingRecipeCount:number;featureCount:number;candidateCount:number;explorationEligibleCount:number};
}
export interface TasteVersionPrediction {
  versionId:string;cocktailId:string;meanUtility:number;uncertainty:number;reasons:DiscoveryReason[];
}
export interface TasteVersionScoring {
  status:'personalized'|'cold-start'|'unavailable';
  versions:TasteVersionPrediction[];
  diagnostics:Omit<DiscoveryRecommendations['diagnostics'],'candidateCount'|'explorationEligibleCount'>;
}
/** Scores the whole catalogue once, without filtering, selection or posterior sampling. */
export function scoreTasteVersions(catalogue:Catalogue,stateValue:TasteState):TasteVersionScoring{
  const prepared=prepareTasteScoring(catalogue,stateValue);
  if(!prepared)return{status:'unavailable',versions:[],diagnostics:emptyScoringDiagnostics()};
  const {posterior,training,personalized,diagnostics}=prepared;
  const versions=[...prepared.byVersion.values()].map(version=>{
    const scored=scoreVersion(catalogue,version,prepared);
    return{versionId:version.id,cocktailId:version.cocktailId,meanUtility:scored.mean,uncertainty:posteriorUncertainty(scored.features,posterior),reasons:personalized?explain(scored,'familiar',training):[]};
  });
  return{status:personalized?'personalized':'cold-start',versions,diagnostics};
}

export interface DiscoveryOptions {seed:string;limit?:number;excludeExplorationCocktailIds?:readonly string[]}

const FLAVOURS:readonly Flavour[]=['citrus','fruit','floral','herbal','spice','coffee'];
const TASTES:readonly Taste[]=['sour','sweet','bitter','dry','creamy','refreshing'];
const STRENGTHS=['none','low','medium','strong'] as const;
const FEATURE_COUNT=120;
const PRIOR_PRECISION=8;
const MAX_TRAINING_RECIPES=1_000;
const MAX_INTERACTION_INGREDIENTS=32;
const INGREDIENT_OFFSET=17,PAIR_OFFSET=41,FLAVOUR_PAIR_OFFSET=89,RATIO_OFFSET=104;
type Features=Array<readonly [number,number]>;
interface TrainingRecipe {entry:TasteFeedback;features:Features;interactionIds:string[]}
interface VersionScore {version:RecipeVersion;features:Features;mean:number;exact?:TasteFeedback}
interface Candidate extends VersionScore {cocktailId:string;versionIds:string[];defaultVersion:boolean}
interface Posterior {cholesky:Float64Array[];mean:Float64Array;observations:number}

/** Derived synchronously from saved snapshots. The scores are local utilities, not calibrated predictions. */
export function recommendDiscovery(catalogue:Catalogue,query:SearchQuery,stateValue:TasteState,options:DiscoveryOptions):DiscoveryRecommendations{
  const prepared=prepareTasteScoring(catalogue,stateValue);
  const diagnostics:DiscoveryRecommendations['diagnostics']={...(prepared?.diagnostics??emptyScoringDiagnostics()),candidateCount:0,explorationEligibleCount:0};
  if(!prepared)return{items:[],status:'unavailable',diagnostics};
  const {posterior,training,personalized,byVersion,latest}=prepared;
  const experienced=new Set(latest.map(entry=>entry.recipe.version.cocktailId));
  const candidates:Candidate[]=[];
  const searched=searchCocktails(catalogue,query);
  for(const result of searched)for(const id of result.versionIds){
    const version=byVersion.get(id);if(!version)continue;
    candidates.push({...scoreVersion(catalogue,version,prepared),cocktailId:result.cocktailId,versionIds:result.versionIds,defaultVersion:id===result.selectedVersionId});
  }
  diagnostics.candidateCount=searched.length;
  const limit=Number.isFinite(options.limit)?Math.max(0,Math.min(24,Math.floor(options.limit!))):6;
  const selected:Candidate[]=[];
  const items:DiscoveryRecommendation[]=[];
  const hasSpace=searched.length>=limit&&limit>1;
  const exploitationCount=personalized&&hasSpace?limit-1:limit;
  for(let index=0;index<exploitationCount;index++){
    const candidate=greedy(candidates,selected,value=>value.mean);
    if(!candidate)break;
    selected.push(candidate);items.push(toItem(candidate,personalized?'familiar':'discovery',posterior,training));
  }
  if(personalized&&items.length<limit){
    const used=new Set(selected.map(value=>value.cocktailId));
    const remaining=candidates.filter(value=>!used.has(value.cocktailId));
    const excluded=new Set(options.excludeExplorationCocktailIds??[]);
    const novel=remaining.filter(value=>!experienced.has(value.cocktailId)&&value.exact?.sentiment!=='dislike');
    const bestMean=Math.max(...novel.map(value=>value.mean));
    // Mean quality gates the pool before one shared posterior draw; no per-card random bonus.
    const plausible=novel.filter(value=>value.mean>=Math.max(-0.25,bestMean-0.6));
    const eligible=plausible.filter(value=>!excluded.has(value.cocktailId));
    diagnostics.explorationEligibleCount=new Set(eligible.map(value=>value.cocktailId)).size;
    const sampled=samplePosterior(posterior,options.seed);
    const exploration=greedy(eligible,selected,value=>dot(value.features,sampled));
    const final=exploration??greedy(remaining,selected,value=>value.mean);
    if(final)items.push(toItem(final,exploration?'explore':'familiar',posterior,training));
  }
  const insufficient=items.length<limit||(personalized&&limit>1&&!items.some(value=>value.kind==='explore'));
  return{items,status:insufficient?'insufficient-candidates':personalized?'personalized':'cold-start',diagnostics};
}

interface PreparedTasteScoring {
  latest:TasteFeedback[];training:TrainingRecipe[];posterior:Posterior;personalized:boolean;
  byVersion:Map<string,RecipeVersion>;memories:Map<string,Map<string,TasteFeedback>>;
  diagnostics:TasteVersionScoring['diagnostics'];
}
function emptyScoringDiagnostics():TasteVersionScoring['diagnostics']{
  return{latestFeedbackCount:0,trainingObservationCount:0,trainingRecipeCount:0,omittedTrainingRecipeCount:0,featureCount:FEATURE_COUNT};
}
function prepareTasteScoring(catalogue:Catalogue,stateValue:TasteState):PreparedTasteScoring|null{
  const diagnostics=emptyScoringDiagnostics();
  let state:TasteState;
  try{state=validateTasteState(stateValue);}catch{return null;}
  const latest=latestTasteFeedback(state.entries);
  diagnostics.latestFeedbackCount=latest.length;
  const explicit=latest.filter(hasPreference);
  // A fixed newest-snapshot budget bounds rebuilding after large imports; no accumulator is persisted.
  const training=explicit.slice(0,MAX_TRAINING_RECIPES).map(entry=>{
    const ids=requiredIngredientIds(entry.recipe.version);
    return{entry,features:recipeFeatures(entry.recipe.version,ids),interactionIds:ids.slice(0,MAX_INTERACTION_INGREDIENTS)};
  });
  diagnostics.trainingRecipeCount=training.length;
  diagnostics.omittedTrainingRecipeCount=Math.max(0,explicit.length-training.length);
  const posterior=fitPosterior(training);
  diagnostics.trainingObservationCount=posterior.observations;
  const personalized=posterior.observations>0;
  const byVersion=new Map<string,RecipeVersion>();
  for(const version of catalogue.versions)if(!byVersion.has(version.id))byVersion.set(version.id,version);
  const memories=new Map<string,Map<string,TasteFeedback>>();
  for(const entry of latest){
    const versions=memories.get(entry.recipe.version.id)??new Map<string,TasteFeedback>();
    versions.set(recipeFingerprint(entry.recipe),entry);memories.set(entry.recipe.version.id,versions);
  }
  return{latest,training,posterior,personalized,byVersion,memories,diagnostics};
}
function scoreVersion(catalogue:Catalogue,version:RecipeVersion,prepared:PreparedTasteScoring):VersionScore{
  const features=recipeFeatures(version);
  const history=prepared.memories.get(version.id);
  const current=history?recipeSnapshot(catalogue,version.id):null;
  const exact=current?history?.get(recipeFingerprint(current)):undefined;
  const exactUtility=exact?.sentiment==='like'?1:exact?.sentiment==='dislike'?-1:0;
  return{version,features,mean:dot(features,prepared.posterior.mean)+exactUtility,exact};
}

function compareText(left:string,right:string):number{return left<right?-1:left>right?1:0;}
function hasPreference(entry:TasteFeedback):boolean{return entry.sentiment!=='neutral'||entry.likedFlavours.length>0||entry.tooSweet||entry.tooStrong;}
function hash(text:string):number{
  let value=2166136261;
  for(let index=0;index<text.length;index++){value^=text.charCodeAt(index);value=Math.imul(value,16777619);}
  value^=value>>>16;value=Math.imul(value,0x7feb352d);value^=value>>>15;value=Math.imul(value,0x846ca68b);return(value^(value>>>16))>>>0;
}
function requiredIngredientIds(version:RecipeVersion):string[]{return[...new Set(version.ingredients.filter(row=>!row.optional).map(row=>row.ingredientId))].sort(compareText);}
function recipeFeatures(version:RecipeVersion,ids=requiredIngredientIds(version)):Features{
  const values=new Map<number,number>([[0,1]]);
  const add=(index:number,value:number)=>{if(value!==0)values.set(index,(values.get(index)??0)+value);};
  for(const [index,flavour] of FLAVOURS.entries())if(version.flavours.includes(flavour))add(1+index,1);
  for(const [index,taste] of TASTES.entries())if(version.tastes.includes(taste))add(7+index,1);
  const strength=STRENGTHS.findIndex(value=>value===version.strength);if(strength>=0)add(13+strength,1);
  // IDs and ratios are part of the immutable recipe; taxonomy, methods and live source metadata are not.
  const ingredientScale=1/Math.sqrt(Math.max(1,ids.length));
  for(const id of ids)add(INGREDIENT_OFFSET+hash(id)%24,ingredientScale);
  // Imported snapshots can contain thousands of rows. Single ingredients remain represented,
  // while a fixed, deterministic pair budget bounds both feature extraction and explanations.
  const interactionIds=ids.slice(0,MAX_INTERACTION_INGREDIENTS);
  const amounts=comparableAmounts(version);
  const pairs=interactionIds.length*(interactionIds.length-1)/2;
  const pairScale=1/Math.sqrt(Math.max(1,pairs));
  for(let first=0;first<interactionIds.length;first++)for(let second=first+1;second<interactionIds.length;second++){
    const key=JSON.stringify([interactionIds[first],interactionIds[second]]);
    add(PAIR_OFFSET+hash(key)%48,pairScale);
    const left=amounts.get(interactionIds[first]!),right=amounts.get(interactionIds[second]!);
    if(left&&right&&left.kind===right.kind&&left.amount+right.amount>0){
      // A known 1:1 ratio has its own presence feature; zero never stands for missing measurements.
      const bucket=hash(key)%8;
      add(RATIO_OFFSET+bucket,pairScale);
      add(RATIO_OFFSET+8+bucket,pairScale*(left.amount-right.amount)/(left.amount+right.amount));
    }
  }
  let index=FLAVOUR_PAIR_OFFSET;
  for(let first=0;first<FLAVOURS.length;first++)for(let second=first+1;second<FLAVOURS.length;second++){
    if(version.flavours.includes(FLAVOURS[first]!)&&version.flavours.includes(FLAVOURS[second]!))add(index,1);
    index++;
  }
  return [...values].filter(([,value])=>value!==0).sort((left,right)=>left[0]-right[0]);
}
function comparableAmounts(version:RecipeVersion):Map<string,{kind:'volume'|'part';amount:number}|null>{
  const result=new Map<string,{kind:'volume'|'part';amount:number}|null>();
  for(const row of version.ingredients){
    if(row.optional)continue;
    const previous=result.get(row.ingredientId);
    if(previous===null)continue;
    const current=row.unit==='ml'||row.unit==='oz'?'volume':row.unit==='part'?'part':null;
    if(row.amount===null||!Number.isFinite(row.amount)||row.amount<0||!current||(previous&&previous.kind!==current)){result.set(row.ingredientId,null);continue;}
    const amount=(previous?.amount??0)+row.amount*(row.unit==='oz'?29.5735295625:1);
    result.set(row.ingredientId,Number.isFinite(amount)?{kind:current,amount}:null);
  }
  return result;
}
function fitPosterior(training:readonly TrainingRecipe[]):Posterior{
  const precision=Array.from({length:FEATURE_COUNT},(_,index)=>{const row=new Float64Array(FEATURE_COUNT);row[index]=PRIOR_PRECISION;return row;});
  const response=new Float64Array(FEATURE_COUNT);let observations=0;
  const observe=(features:Features,reward:number,weight=1)=>{
    observations++;
    for(const [row,value] of features){
      response[row]!+=weight*value*reward;
      for(const [column,other] of features)if(column<=row)precision[row]![column]!+=weight*value*other;
    }
  };
  for(const {entry,features} of training){
    if(entry.sentiment!=='neutral')observe(features,entry.sentiment==='like'?1:-1);
    for(const flavour of [...entry.likedFlavours].sort(compareText))observe([[1+FLAVOURS.indexOf(flavour),1]],0.4,0.25);
    if(entry.tooSweet)observe([[7+TASTES.indexOf('sweet'),1]],-0.35,0.3);
    if(entry.tooStrong)observe([[13+STRENGTHS.indexOf('strong'),1]],-0.35,0.3);
  }
  const cholesky=Array.from({length:FEATURE_COUNT},()=>new Float64Array(FEATURE_COUNT));
  for(let row=0;row<FEATURE_COUNT;row++)for(let column=0;column<=row;column++){
    let value=precision[row]![column]!;
    for(let index=0;index<column;index++)value-=cholesky[row]![index]!*cholesky[column]![index]!;
    cholesky[row]![column]=row===column?Math.sqrt(Math.max(value,1e-12)):value/cholesky[column]![column]!;
  }
  return{cholesky,mean:solveTranspose(cholesky,solveLower(cholesky,response)),observations};
}
function solveLower(matrix:Float64Array[],values:Float64Array):Float64Array{
  const result=new Float64Array(FEATURE_COUNT);
  for(let row=0;row<FEATURE_COUNT;row++){
    let value=values[row]!;for(let column=0;column<row;column++)value-=matrix[row]![column]!*result[column]!;
    result[row]=value/matrix[row]![row]!;
  }
  return result;
}
function solveTranspose(matrix:Float64Array[],values:Float64Array):Float64Array{
  const result=new Float64Array(FEATURE_COUNT);
  for(let row=FEATURE_COUNT-1;row>=0;row--){
    let value=values[row]!;for(let column=row+1;column<FEATURE_COUNT;column++)value-=matrix[column]![row]!*result[column]!;
    result[row]=value/matrix[row]![row]!;
  }
  return result;
}
function samplePosterior(posterior:Posterior,seed:string):Float64Array{
  let state=hash(seed);
  const random=()=>{state=(state+0x6d2b79f5)>>>0;let value=state;value=Math.imul(value^(value>>>15),value|1);value^=value+Math.imul(value^(value>>>7),value|61);return((value^(value>>>14))>>>0)/4294967296;};
  const normal=new Float64Array(FEATURE_COUNT);
  for(let index=0;index<FEATURE_COUNT;index+=2){
    const radius=Math.sqrt(-2*Math.log(Math.max(Number.EPSILON,random()))),angle=2*Math.PI*random();
    normal[index]=radius*Math.cos(angle);normal[index+1]=radius*Math.sin(angle);
  }
  const draw=solveTranspose(posterior.cholesky,normal);
  for(let index=0;index<FEATURE_COUNT;index++)draw[index]!+=posterior.mean[index]!;
  return draw;
}
function dot(features:Features,weights:Float64Array):number{
  let result=0;for(const [index,value] of features)result+=weights[index]!*value;return result;
}
function similarity(left:Candidate,right:Candidate):number{
  // Exclude the intercept: it is shared by every recipe and is not evidence of similarity.
  const other=new Map(right.features);let product=0,leftNorm=0,rightNorm=0;
  for(const [index,value] of left.features)if(index!==0){leftNorm+=value*value;product+=value*(other.get(index)??0);}
  for(const [index,value] of right.features)if(index!==0)rightNorm+=value*value;
  return leftNorm&&rightNorm?Math.max(0,Math.min(1,product/Math.sqrt(leftNorm*rightNorm))):0;
}
function greedy(candidates:readonly Candidate[],selected:readonly Candidate[],utility:(candidate:Candidate)=>number):Candidate|undefined{
  const used=new Set(selected.map(value=>value.cocktailId));let best:Candidate|undefined,bestScore=-Infinity;
  for(const candidate of candidates){
    if(used.has(candidate.cocktailId))continue;
    const redundancy=selected.reduce((maximum,other)=>Math.max(maximum,similarity(candidate,other)),0);
    const score=utility(candidate)-0.3*redundancy;
    if(!best||score>bestScore+1e-12||(Math.abs(score-bestScore)<=1e-12&&compareCandidates(candidate,best)<0)){best=candidate;bestScore=score;}
  }
  return best;
}
function compareCandidates(left:Candidate,right:Candidate):number{
  return compareText(left.cocktailId,right.cocktailId)||(left.defaultVersion===right.defaultVersion?0:left.defaultVersion?-1:1)||compareText(left.version.id,right.version.id);
}
function toItem(candidate:Candidate,kind:DiscoveryRecommendation['kind'],posterior:Posterior,training:readonly TrainingRecipe[]):DiscoveryRecommendation{
  const uncertainty=posteriorUncertainty(candidate.features,posterior);
  return{cocktailId:candidate.cocktailId,selectedVersionId:candidate.version.id,versionIds:[...candidate.versionIds],kind,reasons:kind==='discovery'?[]:explain(candidate,kind,training),meanUtility:candidate.mean,uncertainty};
}
function posteriorUncertainty(features:Features,posterior:Posterior):number{
  const dense=new Float64Array(FEATURE_COUNT);for(const [index,value] of features)dense[index]=value;
  const projected=solveLower(posterior.cholesky,dense);
  return Math.sqrt(projected.reduce((sum,value)=>sum+value*value,0));
}
function explain(candidate:VersionScore,kind:DiscoveryRecommendation['kind'],training:readonly TrainingRecipe[]):DiscoveryReason[]{
  const reasons:DiscoveryReason[]=[];
  const add=(reason:DiscoveryReason)=>reasons.push({...reason,feedbackIds:[...new Set(reason.feedbackIds)].sort(compareText).slice(0,3)});
  const exact=candidate.exact;
  if(exact?.sentiment==='like'||exact?.sentiment==='dislike')add({kind:exact.sentiment==='like'?'liked-version':'disliked-version',feedbackIds:[exact.id]});
  for(const flavour of FLAVOURS){
    const evidence=training.filter(value=>value.entry.likedFlavours.includes(flavour));
    if(candidate.version.flavours.includes(flavour)&&evidence.length)add({kind:'liked-flavour',flavours:[flavour],feedbackIds:evidence.map(value=>value.entry.id),supportCount:evidence.length});
  }
  for(const [flag,matches,reasonKind] of [['tooSweet',candidate.version.tastes.includes('sweet'),'sweet-caution'],['tooStrong',candidate.version.strength==='strong','strong-caution']] as const){
    const evidence=training.filter(value=>value.entry[flag]);
    if(matches&&evidence.length)add({kind:reasonKind,feedbackIds:evidence.map(value=>value.entry.id),supportCount:evidence.length});
  }
  const ingredientIds=requiredIngredientIds(candidate.version).slice(0,MAX_INTERACTION_INGREDIENTS);
  const evidence=training.filter(value=>value.entry.sentiment==='like'&&value.entry.id!==exact?.id).map(value=>{
    const sharedIds=ingredientIds.filter(id=>value.interactionIds.includes(id));
    const flavours=FLAVOURS.filter(flavour=>candidate.version.flavours.includes(flavour)&&value.entry.recipe.version.flavours.includes(flavour));
    return{entry:value.entry,sharedIds,flavours};
  }).filter(value=>value.sharedIds.length>=2||value.flavours.length>=2);
  if(evidence.length)add({kind:'learned-combination',feedbackIds:evidence.map(value=>value.entry.id),ingredientIds:ingredientIds.filter(id=>evidence.some(value=>value.sharedIds.includes(id))),flavours:FLAVOURS.filter(flavour=>evidence.some(value=>value.flavours.includes(flavour))),supportCount:evidence.length});
  if(kind==='explore')add({kind:'exploration',feedbackIds:[]});
  return reasons;
}
