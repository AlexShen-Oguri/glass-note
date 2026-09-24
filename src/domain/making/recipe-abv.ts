import type {Catalogue,RecipeVersion} from '../contracts';
import type {Bottle} from '../bottles/types';

// Explicit ordinary mixers only. A taxonomy family never proves an unknown compound alcohol-free.
const mixers=new Set(['lime-juice','lemon-juice','orange-juice','pineapple-juice','grapefruit-juice','tomato-juice','passion-fruit-juice','cranberry-juice','sugar-syrup','simple-syrup','soda-water','water','sugar-cane-juice','honey-syrup','vanilla-syrup','black-tea-syrup']);

/** Range from matching catalogue bottle strengths and exact liquid measures, before ice dilution. */
export function estimateRecipeAbv(version:RecipeVersion,catalogue:Catalogue,bottles:readonly Bottle[]){
  let total=0,low=0,high=0;
  const sources=new Map<string,Bottle['source']>();
  for(const row of version.ingredients.filter(row=>!row.optional)){
    if(row.amount===null||!Number.isFinite(row.amount)||row.amount<=0||!['ml','oz'].includes(row.unit))return null;
    const volume=row.amount*(row.unit==='oz'?29.5735295625:1);
    const ingredient=catalogue.ingredients.find(item=>item.id===row.ingredientId);
    const matches=bottles.filter(bottle=>bottle.ingredientIds.includes(row.ingredientId)&&(!row.brandId||row.brandId===bottle.brandId)&&bottle.abv!==null);
    if(matches.length){
      const strengths=matches.map(item=>item.abv!);
      low+=volume*Math.min(...strengths)/100;high+=volume*Math.max(...strengths)/100;
      for(const bottle of matches)sources.set(bottle.source.url,bottle.source);
    }else if(!ingredient?.compositionKnown||!mixers.has(row.ingredientId)||row.brandId)return null;
    total+=volume;
  }
  return total>0?{low:Math.floor(low/total*100),high:Math.ceil(high/total*100),sources:[...sources.values()]}:null;
}
