import {catalogue} from '../../content/catalogue';
import {recipeMaterialRequirement,materialRequirementMatchesRow} from '../../content/ingredients/concepts';
import type {Locale,RecipeVersion} from '../../domain/contracts';
import {canonicalIngredientEntries,canonicalIngredientId} from '../../domain/ingredients/canonical';

const entries=new Map(canonicalIngredientEntries(catalogue).map(entry=>[entry.ingredient.id,entry]));
export function materialDisplayName(id:string,locale:Locale):string{
  const name=entries.get(canonicalIngredientId(catalogue,id))?.ingredient.name;
  return name?.[locale]||name?.en||id;
}
export function sourceMaterialName(version:RecipeVersion,index:number,locale:Locale):string{
  const row=version.ingredients[index];
  const indexed=recipeMaterialRequirement(catalogue,version.id,index);
  const requirement=indexed&&row&&materialRequirementMatchesRow(indexed,row)?indexed:undefined;
  const name=requirement?.sourceName??catalogue.ingredients.find(item=>item.id===row?.ingredientId)?.name;
  return name?.[locale]||name?.en||row?.ingredientId||'';
}
