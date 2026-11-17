import type {Catalogue} from '../contracts';
import type {Bottle} from '../bottles/types';
import type {MakingRecipe, MakingSession} from './types';
import {canonicalMemberIds, compileMaterialResolver} from '../ingredients/canonical';
import {recipeFingerprint} from '.';

export interface StrengthRange {low:number; high:number}
export interface StrengthSource {title:string; url:string; checkedAt:string; market?:string}
export interface IngredientStrengthReference {
  ingredientId:string; low:number; high:number;
  basis:'producer-example'|'editorial-assumption'; sources:StrengthSource[]; bottleIds?:string[]; brandIds?:string[];
}
export interface DrinkStrengthProfile {
  versionId:string; sourceId:string; fingerprint:string; format:'short'|'long';
  formatBasis:'editorial'|'source';
  formatReason:'compact-strained'|'compact-rocks'|'soda-long'|'tropical-long'|'crushed-long';
  sources:StrengthSource[];
  /** Source-batch quantities, keyed by versionId:index; scaled to the displayed batch. */
  volumeMl:Record<string,number>;
  /** Explicit source-row exceptions; valid only with this profile's complete frozen identity. */
  rowReferences?:Record<string,IngredientStrengthReference>;
}
export interface DrinkStrengthContent {
  references:readonly IngredientStrengthReference[]; profiles:readonly DrinkStrengthProfile[];
}
export interface DrinkStrengthOptions {
  servings?:number; dilutionMl?:number|null; volumeMl?:Record<string,number>;
  abv?:Record<string,number>; bottleIds?:Record<string,string>; session?:MakingSession;
  includedOptionalRowIds?:readonly string[];
}
export interface DrinkStrengthRow {
  rowId:string; ingredientId:string; volumeMl:number|null;
  volumeBasis:'recipe'|'profile-assumption'|'user'|'unknown'; abv:StrengthRange|null;
  abvBasis:'producer-example'|'editorial-assumption'|'bottle'|'user'|'unknown';
  sources:StrengthSource[]; bottleId?:string; eligibleBottleIds:string[]; issues:string[]; included:boolean;
}
export interface DrinkStrengthResult {
  status:'estimated'|'incomplete'; rows:DrinkStrengthRow[];
  beforeIce:StrengthRange|null; diluted:StrengthRange|null;
  /** Sum of known included liquid volumes before dilution; incomplete totals are never an estimate. */
  totalMl:number; alcoholMl:StrengthRange|null; dilutionMl:number|null;
  format?:DrinkStrengthProfile; missingRowIds:string[];
}

const ML_PER_OZ=29.5735295625;
const MAX_ML=1_000_000;
const owns=(record:object|undefined,key:string):boolean=>record!==undefined&&Object.hasOwn(record,key);
const finite=(value:unknown,max:number):value is number=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=max;
const copySource=(source:StrengthSource):StrengthSource=>({...source});
const copyReference=(reference:IngredientStrengthReference):IngredientStrengthReference=>({...reference,
  sources:reference.sources.map(copySource),...(reference.bottleIds?{bottleIds:[...reference.bottleIds]}:{}),
  ...(reference.brandIds?{brandIds:[...reference.brandIds]}:{}),
});

/** Derive a displayed batch without changing its frozen recipe, session or catalogue. */
export function analyzeDrinkStrength(
  inputRecipe:MakingRecipe,catalogue:Catalogue,bottles:readonly Bottle[],content:DrinkStrengthContent,
  options:DrinkStrengthOptions={},
):DrinkStrengthResult {
  const session=options.session,recipe=session?.recipe??inputRecipe;
  const servings=owns(options,'servings')?options.servings:session?.servings??recipe.version.servings;
  const validServings=typeof servings==='number'&&Number.isFinite(servings)&&servings>0
    &&Number.isFinite(recipe.version.servings)&&recipe.version.servings>0;
  const multiplier=validServings?servings/recipe.version.servings:null;
  const fingerprint=recipeFingerprint(recipe);
  const guarded=content.profiles.find(profile=>profile.versionId===recipe.version.id
    &&profile.sourceId===recipe.version.sourceId&&profile.fingerprint===fingerprint);
  const format=guarded?{...guarded,sources:guarded.sources.map(copySource),volumeMl:{...guarded.volumeMl},
    ...(guarded.rowReferences?{rowReferences:Object.fromEntries(Object.entries(guarded.rowReferences).map(([id,reference])=>[id,copyReference(reference)]))}:{}),
  }:undefined;
  const resolver=session?undefined:compileMaterialResolver(catalogue);
  const checked=new Set(options.includedOptionalRowIds??session?.checkedRows??[]);
  const saved=session?.assumptions;
  const rows=recipe.version.ingredients.map((source,index):DrinkStrengthRow=>{
    const rowId=`${recipe.version.id}:${index}`;
    const frozen=session?.materialSemantics?.rows.find(row=>row.rowId===rowId);
    const candidates=resolver?.resolveRecipeMaterial(recipe.version,index,[]).candidateIngredientIds??[];
    const allowed=frozen?frozen.allowedIngredientIds:session?[source.ingredientId]
      :[...new Set(candidates.flatMap(id=>canonicalMemberIds(catalogue,id)))];
    const branded=frozen?frozen.brandIngredientIds:session?[source.ingredientId]:canonicalMemberIds(catalogue,source.ingredientId);
    const needsBrand=(ingredientId:string)=>source.brandId!==undefined&&branded.includes(ingredientId);
    const eligible=(bottle:Bottle)=>frozen?.known!==false&&bottle.ingredientIds.some(id=>allowed.includes(id)
      &&(!needsBrand(id)||bottle.brandId===source.brandId));
    const eligibleBottles=bottles.filter(eligible);
    const binding=session?.materialBindings?.[rowId];
    const explicitBottle=owns(options.bottleIds,rowId);
    // Actual v2 bindings describe the batch; saved assumptions must never silently rebind it.
    const hasBottle=explicitBottle||binding?.bottleId!==undefined||owns(saved?.bottleIds,rowId);
    const bottleId=explicitBottle?options.bottleIds![rowId]:binding?.bottleId??saved?.bottleIds[rowId];
    const selected=hasBottle?eligibleBottles.find(bottle=>bottle.id===bottleId
      &&(explicitBottle||binding?.bottleId===undefined||(bottle.ingredientIds.includes(binding.ingredientId)
        &&(!needsBrand(binding.ingredientId)||bottle.brandId===source.brandId)))):undefined;
    const issues:string[]=[],sources:StrengthSource[]=[];
    let volumeMl:number|null=null,volumeBasis:DrinkStrengthRow['volumeBasis']='unknown';
    const volumeRecord=owns(options.volumeMl,rowId)?options.volumeMl:owns(saved?.volumeMl,rowId)?saved?.volumeMl:undefined;
    if(volumeRecord){
      if(finite(volumeRecord[rowId],MAX_ML)){volumeMl=volumeRecord[rowId]!;volumeBasis='user';}
      else issues.push('invalid-volume');
    }else if(multiplier!==null){
      if((source.unit==='ml'||source.unit==='oz')&&finite(source.amount,MAX_ML)){
        const value=source.amount*multiplier*(source.unit==='oz'?ML_PER_OZ:1);
        if(finite(value,MAX_ML)){volumeMl=value;volumeBasis='recipe';}
      }else if(guarded&&owns(guarded.volumeMl,rowId)&&finite(guarded.volumeMl[rowId],MAX_ML)){
        const value=guarded.volumeMl[rowId]!*multiplier;
        if(finite(value,MAX_ML)){volumeMl=value;volumeBasis='profile-assumption';sources.push(...guarded.sources.map(copySource));}
      }
    }
    if(volumeMl===null)issues.push('volume-unknown');
    let abv:StrengthRange|null=null,abvBasis:DrinkStrengthRow['abvBasis']='unknown';
    const abvRecord=owns(options.abv,rowId)?options.abv:owns(saved?.abv,rowId)?saved?.abv:undefined;
    if(abvRecord){
      if(finite(abvRecord[rowId],100)){abv={low:abvRecord[rowId]!,high:abvRecord[rowId]!};abvBasis='user';}
      else issues.push('invalid-abv');
    }else if(hasBottle){
      if(selected&&finite(selected.abv,100)){
        abv={low:selected.abv,high:selected.abv};abvBasis='bottle';
        sources.push({...selected.source,market:selected.market});
      }
    }else{
      const ingredientId=binding?.ingredientId??source.ingredientId;
      const legalExamples=(reference:IngredientStrengthReference)=>eligibleBottles.filter(bottle=>reference.bottleIds?.includes(bottle.id)
        &&bottle.ingredientIds.includes(ingredientId)&&(!needsBrand(ingredientId)||bottle.brandId===source.brandId)
        &&finite(bottle.abv,100)&&bottle.abv>=reference.low&&bottle.abv<=reference.high);
      // References are deliberately exact curated facts, never min/max across a spirit family.
      const rowReference=guarded?.rowReferences?.[rowId];
      const references=rowReference?[rowReference,...content.references]:content.references;
      const reference=references.find(value=>value.ingredientId===ingredientId
        &&finite(value.low,100)&&finite(value.high,100)&&value.low<=value.high
        &&(!needsBrand(ingredientId)||value.brandIds?.includes(source.brandId!)||legalExamples(value).length>0));
      if(reference){
        if(needsBrand(ingredientId)&&!reference.brandIds?.includes(source.brandId!)){
          const examples=legalExamples(reference),values=examples.map(bottle=>bottle.abv!);
          abv={low:Math.min(...values),high:Math.max(...values)};
          sources.push(...examples.map(bottle=>({...bottle.source,market:bottle.market})));
        }else{abv={low:reference.low,high:reference.high};sources.push(...reference.sources.map(copySource));}
        abvBasis=reference.basis;
      }
    }
    if(hasBottle&&!selected)issues.push('bottle-incompatible');
    if(abv===null)issues.push('abv-unknown');
    return {rowId,ingredientId:source.ingredientId,volumeMl,volumeBasis,abv,abvBasis,sources,
      ...(typeof bottleId==='string'?{bottleId}:{}),eligibleBottleIds:eligibleBottles.map(bottle=>bottle.id),issues,
      included:!source.optional||checked.has(rowId)};
  });
  const included=rows.filter(row=>row.included);
  const missingRowIds=included.filter(row=>!validServings||row.volumeMl===null||(row.volumeMl>0&&row.abv===null)).map(row=>row.rowId);
  const totalMl=included.reduce((total,row)=>total+(row.volumeMl??0),0);
  const complete=validServings&&!missingRowIds.length&&totalMl>0;
  // Same volume-weighted formula as calculateAbv(session), evaluated independently at both
  // curated endpoints. No synthetic persistent session or extra dilution assumption is needed.
  const alcoholMl=complete?included.reduce<StrengthRange>((total,row)=>({
    low:total.low+(row.volumeMl??0)*(row.abv?.low??0)/100,
    high:total.high+(row.volumeMl??0)*(row.abv?.high??0)/100,
  }),{low:0,high:0}):null;
  const rawDilution=owns(options,'dilutionMl')?options.dilutionMl:saved?.dilutionMl;
  const dilutionMl=finite(rawDilution,MAX_ML)?rawDilution:null;
  const range=(volume:number):StrengthRange|null=>alcoholMl?{low:alcoholMl.low/volume*100,high:alcoholMl.high/volume*100}:null;
  return {status:complete?'estimated':'incomplete',rows,beforeIce:range(totalMl),
    diluted:dilutionMl!==null?range(totalMl+dilutionMl):null,totalMl,alcoholMl,dilutionMl,
    ...(format?{format}:{}),missingRowIds};
}
