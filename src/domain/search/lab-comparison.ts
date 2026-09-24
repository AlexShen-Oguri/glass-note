import type {LabIngredient,LabVersion} from '../lab/types';

export interface LabIngredientComparisonRow {
  key:string;
  label:string;
  cells:(LabIngredient|null)[];
}

function normalizedName(value:string):string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g,' ');
}

function stableIdentity(version:Pick<LabVersion,'id'>,ingredient:LabIngredient,index:number):string {
  const ingredientId=ingredient.ingredientId?.trim();
  if(ingredientId)return `ingredient:${ingredientId}`;
  const name=normalizedName(ingredient.name);
  if(name)return `name:${name}`;
  // An unnamed row has no safe cross-version identity. Keep it independent
  // instead of silently merging two unknown materials.
  return `row:${version.id}:${ingredient.id || index}`;
}

/**
 * Align existing laboratory ingredient rows without rewriting or combining
 * their contents. The first selected version establishes order; materials
 * that only occur in later versions are appended in those versions' order.
 */
export function alignLabIngredients(versions:Pick<LabVersion,'id'|'ingredients'>[]):LabIngredientComparisonRow[] {
  const orderedKeys:string[]=[];
  const labels=new Map<string,string>();
  const versionCells:Map<string,LabIngredient>[]=[];

  for(const version of versions){
    const occurrences=new Map<string,number>();
    const cells=new Map<string,LabIngredient>();
    version.ingredients.forEach((ingredient,index)=>{
      const identity=stableIdentity(version,ingredient,index);
      const occurrence=occurrences.get(identity)??0;
      occurrences.set(identity,occurrence+1);
      const key=`${identity}#${occurrence}`;
      cells.set(key,ingredient);
      if(!labels.has(key)){
        orderedKeys.push(key);
        labels.set(key,ingredient.name.trim());
      }
    });
    versionCells.push(cells);
  }

  return orderedKeys.map(key=>({
    key,
    label:labels.get(key)??'',
    cells:versionCells.map(cells=>cells.get(key)??null),
  }));
}
