import type {Bottle} from '../bottles/types';
import {bottleDisplayName} from '../bottles/format';
import type {Catalogue,Locale,RecipeVersion} from '../contracts';
import type {RecipePreparation} from '../preparations/types';
import {bottleComparisonTemplate,bottleComparisonText} from '../../i18n/bottle-comparison';
import {recipeLabSource} from './recipeSource';
import type {LabIngredient,LabSource} from './types';

export interface BottleComparisonVersionDraft {
  bottleId: string;
  name: string;
  ingredients: LabIngredient[];
  method: string;
  notes: string;
}

export interface BottleComparisonProjectDraft {
  name: string;
  goal: string;
  source?: LabSource;
  versions: BottleComparisonVersionDraft[];
}

export interface BottleComparisonRecipePreviewVersion {
  bottleId: string;
  name: string;
  ingredients: LabIngredient[];
  changedRowIndexes: number[];
}

export interface BottleComparisonRecipePreview {
  source: LabSource;
  targetIngredientIndex: number;
  versions: BottleComparisonRecipePreviewVersion[];
}

export type BottleComparisonMode =
  | {kind:'scratch'}
  | {kind:'recipe';version:RecipeVersion;targetIngredientIndex:number;preparation?:RecipePreparation;allowIncompatible?:boolean};

export function bottleSupportsIngredient(bottle:Pick<Bottle,'ingredientIds'>,ingredientId:string):boolean {
  return bottle.ingredientIds.includes(ingredientId);
}

function validateBottles(bottles:readonly Bottle[]):void {
  if(bottles.length<2||bottles.length>3)throw new Error('comparison-bottle-count');
  const ids=new Set<string>();
  const family=bottles[0]!.family;
  for(const bottle of bottles){
    if(!bottle.id.trim()||ids.has(bottle.id))throw new Error('comparison-bottle-duplicate');
    if(bottle.family!==family)throw new Error('comparison-bottle-family');
    ids.add(bottle.id);
  }
}

function replacementIngredient(source:LabIngredient,bottle:Bottle):LabIngredient {
  const bottleName=bottleDisplayName(bottle);
  const ingredientId=bottleSupportsIngredient(bottle,source.ingredientId??'')
    ? source.ingredientId
    : bottle.ingredientIds[0];
  return {
    ...source,
    ...(ingredientId?{ingredientId}:{}),
    name:bottleName,
    bottleId:bottle.id,
    bottleName,
  };
}

function sameIngredient(left:LabIngredient,right:LabIngredient):boolean {
  return left.id===right.id
    &&left.name===right.name
    &&left.amount===right.amount
    &&left.unit===right.unit
    &&left.ingredientId===right.ingredientId
    &&left.bottleId===right.bottleId
    &&left.bottleName===right.bottleName;
}

/**
 * Validate and clone a recipe comparison for display. A valid preview has one
 * bottle-bound row per version; every other row and the full source method are
 * byte-for-byte equivalent to the source snapshot.
 */
export function bottleComparisonRecipePreview(
  draft:BottleComparisonProjectDraft,
  targetIngredientIndex:number,
):BottleComparisonRecipePreview {
  const source=draft.source;
  if(!source)throw new Error('comparison-preview-source-required');
  if(!Number.isInteger(targetIngredientIndex)||targetIngredientIndex<0||targetIngredientIndex>=source.ingredients.length){
    throw new Error('comparison-invalid-replacement-row');
  }
  if(draft.versions.length<2||draft.versions.length>3)throw new Error('comparison-preview-version-count');
  const ids=new Set<string>();
  const versions=draft.versions.map(version=>{
    if(!version.bottleId.trim()||ids.has(version.bottleId))throw new Error('comparison-preview-bottle-duplicate');
    ids.add(version.bottleId);
    if(version.method!==source.method||version.ingredients.length!==source.ingredients.length){
      throw new Error('comparison-preview-source-changed');
    }
    const changedRowIndexes:number[]=[];
    const ingredients=version.ingredients.map((ingredient,row)=>{
      const sourceIngredient=source.ingredients[row]!;
      if(row===targetIngredientIndex){
        if(ingredient.id!==sourceIngredient.id
          ||ingredient.amount!==sourceIngredient.amount
          ||ingredient.unit!==sourceIngredient.unit
          ||ingredient.bottleId!==version.bottleId
          ||!ingredient.bottleName?.trim())throw new Error('comparison-preview-target-invalid');
        changedRowIndexes.push(row);
      } else if(!sameIngredient(ingredient,sourceIngredient)){
        throw new Error('comparison-preview-multiple-changes');
      }
      return {...ingredient};
    });
    return {bottleId:version.bottleId,name:version.name,ingredients,changedRowIndexes};
  });
  return {
    source:{...source,ingredients:source.ingredients.map(ingredient=>({...ingredient}))},
    targetIngredientIndex,
    versions,
  };
}

/** Build every comparison version before the store mutates, so invalid input cannot leave a partial project. */
export function bottleComparisonProjectDraft(
  catalogue:Catalogue,
  bottles:readonly Bottle[],
  locale:Locale,
  mode:BottleComparisonMode,
):BottleComparisonProjectDraft {
  validateBottles(bottles);
  const bottleNames=bottles.map(bottle=>bottleDisplayName(bottle));
  if(mode.kind==='scratch'){
    return {
      name:`${bottleNames.join(' · ')} · ${bottleComparisonText(locale,'projectSuffix')}`,
      goal:bottleComparisonText(locale,'goal'),
      versions:bottles.map((bottle,index)=>({
        bottleId:bottle.id,
        name:bottleNames[index]!,
        ingredients:[{
          id:`bottle-${index}`,
          name:bottleNames[index]!,
          amount:'',
          unit:'ml',
          ...(bottle.ingredientIds[0]?{ingredientId:bottle.ingredientIds[0]}:{}),
          bottleId:bottle.id,
          bottleName:bottleNames[index]!,
        }],
        method:'',
        notes:bottleComparisonTemplate(locale,'scratchNote',{source:`${bottle.source.title} — ${bottle.source.url}`}),
      })),
    };
  }

  const {version,targetIngredientIndex,preparation}=mode;
  if(!Number.isInteger(targetIngredientIndex)||targetIngredientIndex<0||targetIngredientIndex>=version.ingredients.length){
    throw new Error('comparison-invalid-replacement-row');
  }
  const source=recipeLabSource(catalogue,version,locale,preparation);
  const target=source.ingredients[targetIngredientIndex];
  if(!target)throw new Error('comparison-invalid-replacement-row');
  const incompatible=bottles.some(bottle=>!bottleSupportsIngredient(bottle,target.ingredientId??''));
  if(incompatible&&!mode.allowIncompatible)throw new Error('comparison-incompatible-replacement');
  return {
    name:`${source.title} · ${bottleComparisonText(locale,'projectSuffix')}`,
    goal:bottleComparisonText(locale,'goal'),
    source,
    versions:bottles.map((bottle,index)=>({
      bottleId:bottle.id,
      name:bottleNames[index]!,
      ingredients:source.ingredients.map((ingredient,row)=>row===targetIngredientIndex?replacementIngredient(ingredient,bottle):{...ingredient}),
      method:source.method,
      notes:bottleComparisonTemplate(locale,'replaced',{ingredient:target.name,bottle:bottleNames[index]!}),
    })),
  };
}
