import type {Catalogue,SearchQuery} from '../contracts';
import {normalizeContextSelection,scoreContextVersions,type ContextEvidence,type ContextSelection} from '../context';
import {hasDiscoveryFilters} from '../discovery/pagination';
import type {Pantry} from '../ingredients/types';
import {DISCOVERY_MODEL_REVISION,scoreTasteVersions,type TasteState,type TasteVersionPrediction,type TasteVersionScoring} from '../taste';
import {searchCocktails} from '../search';
import {rankPresenceCombinations,type PresenceCombination} from './presence-decisions';

export interface CabinetPlan extends PresenceCombination {
  preference?:{utility:number;positiveCocktailCount:number;versionIds:string[];contextScore:number;reviewOnly:boolean};
}
export interface CabinetPlanResult {status:'coverage'|'personalized'|'cold-start'|'unavailable';plans:CabinetPlan[]}
export interface CabinetPlanningOptions {goal:'coverage'|'taste';taste:TasteState;query?:SearchQuery;context?:ContextSelection;evidence?:readonly ContextEvidence[]}

function remember<T>(cache:Map<string,T>,key:string,create:()=>T,limit:number):T{
  const previous=cache.get(key);
  if(previous!==undefined){cache.delete(key);cache.set(key,previous);return previous;}
  const value=create();cache.set(key,value);
  if(cache.size>limit)cache.delete(cache.keys().next().value!);
  return value;
}
function freeze<T>(value:T):T{
  if(value&&typeof value==='object'){
    for(const child of Object.values(value))freeze(child);
    Object.freeze(value);
  }
  return value;
}
function tasteIdentity(value:TasteState):string{
  try{return JSON.stringify(value)??'invalid';}catch{return'invalid';}
}

interface Representative {versionId:string;ready:boolean;context:number;utility:number}
function assess(plan:PresenceCombination,context:ReadonlyMap<string,number>,scores:ReadonlyMap<string,TasteVersionPrediction>):NonNullable<CabinetPlan['preference']>{
  const representatives:Representative[]=plan.cocktails.map(drink=>{
    // A liked review-only or excluded source cannot lend its score to a ready source.
    const ready=drink.readyVersions.length>0;
    const available=ready?drink.readyVersions:drink.needsReviewVersions;
    const highestContext=Math.max(0,...available.map(v=>context.get(v.versionId)??0));
    const candidates=available.filter(v=>(context.get(v.versionId)??0)===highestContext);
    let selected=candidates[0]!;
    for(const candidate of candidates)if((scores.get(candidate.versionId)?.meanUtility??0)>(scores.get(selected.versionId)?.meanUtility??0))selected=candidate;
    return{versionId:selected.versionId,ready,context:highestContext,utility:scores.get(selected.versionId)?.meanUtility??0};
  });
  const reviewOnly=!representatives.some(v=>v.ready);
  const materialTier=representatives.filter(v=>v.ready!==reviewOnly);
  const contextScore=Math.max(0,...materialTier.map(v=>v.context));
  const positive=materialTier.filter(v=>v.context===contextScore&&v.utility>0);
  return{utility:positive.reduce((sum,v)=>sum+v.utility,0),positiveCocktailCount:positive.length,versionIds:positive.map(v=>v.versionId),contextScore,reviewOnly};
}

/** Component-owned derived cache. Full value identities also detect in-place input changes. */
export function createCabinetPlanner(){
  let lastCatalogue='',lastPantry='',lastTaste='',scoring:TasteVersionScoring|undefined;
  const enumerations=new Map<string,PresenceCombination[]>();
  const contexts=new Map<string,Map<string,number>>();
  const results=new Map<string,CabinetPlanResult>();
  return{plan(catalogue:Catalogue,pantry:Pantry,count:1|2,options:CabinetPlanningOptions):CabinetPlanResult{
    const catalogueKey=JSON.stringify(catalogue);
    if(catalogueKey!==lastCatalogue){lastCatalogue=catalogueKey;enumerations.clear();contexts.clear();results.clear();scoring=undefined;}
    const pantryKey=JSON.stringify(pantry);
    if(pantryKey!==lastPantry){lastPantry=pantryKey;enumerations.clear();results.clear();}
    const tasteKey=`${DISCOVERY_MODEL_REVISION}:${tasteIdentity(options.taste)}`;
    if(tasteKey!==lastTaste){lastTaste=tasteKey;scoring=undefined;results.clear();}
    const query=options.query??{},selection=normalizeContextSelection(options.context??{}),evidence=options.evidence??[];
    const enumerationKey=JSON.stringify([count,query]);
    const contextKey=JSON.stringify([selection,evidence]);
    const resultKey=JSON.stringify([options.goal,enumerationKey,contextKey]);
    return remember(results,resultKey,()=>{
      const base=remember(enumerations,enumerationKey,()=>{
        const eligibleVersionIds=hasDiscoveryFilters(query)?new Set(searchCocktails(catalogue,query).flatMap(v=>v.versionIds)):undefined;
        return rankPresenceCombinations(catalogue,pantry,count,{eligibleVersionIds});
      },4);
      const context=remember(contexts,contextKey,()=>new Map(scoreContextVersions(catalogue,selection,evidence).map(v=>[v.versionId,v.score])),4);
      if(options.goal==='taste'&&!scoring)scoring=scoreTasteVersions(catalogue,options.taste);
      const personal=options.goal==='taste'&&scoring?.status==='personalized';
      const scores=new Map(personal?scoring!.versions.map(v=>[v.versionId,v] as const):[]);
      const ranked=base.map((plan,index)=>({plan,index,preference:assess(plan,context,scores)}));
      ranked.sort((a,b)=>Number(a.preference.reviewOnly)-Number(b.preference.reviewOnly)
        ||b.preference.contextScore-a.preference.contextScore
        ||(personal?b.preference.utility-a.preference.utility:0)||a.index-b.index);
      const status=options.goal==='coverage'?'coverage':scoring!.status;
      // Returned data cannot be mutated to poison a later cache hit or freeze caller inputs.
      return freeze(JSON.parse(JSON.stringify({status,plans:ranked.map(v=>personal?{...v.plan,preference:v.preference}:v.plan)}))) as CabinetPlanResult;
    },8);
  }};
}
