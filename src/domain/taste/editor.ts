import type {Catalogue} from '../contracts';
import type {FavoriteList} from '../favorites';
import {recipeSnapshot} from '../making';
import type {TasteFeedback} from './types';

/** Resolve before rendering: an editor URL must never briefly render the memory list. */
export function tasteEditorTarget(params:{entry?:string;version?:string;list?:string},entries:TasteFeedback[],lists:FavoriteList[],catalogue:Catalogue){
  if(params.entry){
    const entry=entries.find(item=>item.id===params.entry);
    return entry?{kind:'edit' as const,entry}:{kind:'missing' as const};
  }
  if(params.version){
    const recipe=params.list
      ?lists.find(list=>list.id===params.list)?.items.find(item=>item.versionId===params.version)?.recipe
      :recipeSnapshot(catalogue,params.version);
    return recipe?.version.sourceChecked?{kind:'create' as const,recipe}:{kind:'missing' as const};
  }
  return params.list?{kind:'missing' as const}:{kind:'list' as const};
}
