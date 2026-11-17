import {recipeMaterialRequirement,materialRequirementMatchesRow} from '../../content/ingredients/concepts';
import {LOCALES,type Catalogue,type Localized} from '../contracts';
import {canonicalMemberIds,compileMaterialResolver} from '../ingredients/canonical';
import type {Pantry} from '../ingredients/types';
import {recipeFingerprint,rowId,validateMakingRecipe,type MakingRecipe} from '../making';
import {canonicalJson,semanticFingerprint} from '../backup/canonical';
import {rejectUnsafe} from '../backup/unsafe';
import {utf8ByteLength} from '../lab';
import {emptyShoppingState,type ShoppingCandidate,type ShoppingItem,type ShoppingState,type ShoppingTarget} from './types';
export * from './types';
const LIMIT=5_000_000,COUNT=5_000,MAX_TARGETS=500;
const clone=<T>(value:T):T=>JSON.parse(JSON.stringify(value)) as T;
function object(value:unknown,keys:string[],path:string):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error(`${path}: expected object`);
 const result=value as Record<string,unknown>;
 if(Object.keys(result).length!==keys.length||keys.some(key=>!Object.hasOwn(result,key)))throw Error(`${path}: unsupported properties`);
 return result;
}
function id(value:unknown,path:string,max=200):string{if(typeof value!=='string'||!value.trim()||value.length>max||['__proto__','constructor','prototype'].includes(value))throw Error(`${path}: invalid text`);return value;}
function boolean(value:unknown,path:string):boolean{if(typeof value!=='boolean')throw Error(`${path}: expected boolean`);return value;}
function array(value:unknown,path:string,max=COUNT):unknown[]{if(!Array.isArray(value)||value.length>max)throw Error(`${path}: array limit ${max}`);return value;}
function ids(value:unknown,path:string):string[]{const result=array(value,path).map(v=>id(v,path));if(new Set(result).size!==result.length)throw Error(`${path}: duplicate identity`);return result;}
function name(value:unknown,path:string):Localized{const item=object(value,[...LOCALES],path);return Object.fromEntries(LOCALES.map(locale=>[locale,id(item[locale],path,20_000)])) as unknown as Localized;}
function candidate(value:unknown,path:string):ShoppingCandidate{const item=object(value,['ingredientId','name','memberIds','known'],path),ingredientId=id(item.ingredientId,path),memberIds=ids(item.memberIds,path);if(!memberIds.length||!memberIds.includes(ingredientId))throw Error(`${path}: candidate members mismatch`);return {ingredientId,name:name(item.name,path),memberIds,known:boolean(item.known,path)};}
function unique(values:string[]):string[]{return [...new Set(values)];}
const referenceKey=(targetId:string,rowId:string)=>canonicalJson([targetId,rowId]);
export function validateShoppingState(value:unknown):ShoppingState{
 rejectUnsafe(value,'shopping');
 const state=object(value,['format','schemaVersion','targets','items'],'shopping');
 if(state.format!=='glass-notes-shopping'||state.schemaVersion!==1)throw Error('shopping: unsupported format');
 const targets:ShoppingTarget[]=array(state.targets,'shopping.targets',MAX_TARGETS).map((v,index)=>{
  const p=`shopping.targets[${index}]`,t=object(v,['id','fingerprint','recipe','rows'],p),recipe=validateMakingRecipe(t.recipe),fingerprint=id(t.fingerprint,p);
  if(fingerprint!==recipeFingerprint(recipe))throw Error(`${p}: fingerprint mismatch`);
  const rows=array(t.rows,p,recipe.version.ingredients.length).map(v=>{const r=object(v,['rowId','sourceName','candidates','selectedIngredientId','dismissed'],p),rid=id(r.rowId,p,300),rowIndex=recipe.version.ingredients.findIndex((_,i)=>rowId(recipe,i)===rid);
   if(rowIndex<0||recipe.version.ingredients[rowIndex]!.optional)throw Error(`${p}: row reference mismatch`);
   const candidates=array(r.candidates,p).map(v=>candidate(v,p));if(!candidates.length||new Set(candidates.map(c=>c.ingredientId)).size!==candidates.length)throw Error(`${p}: duplicate or empty candidates`);
   const selectedIngredientId=id(r.selectedIngredientId,p);if(!candidates.some(c=>c.ingredientId===selectedIngredientId))throw Error(`${p}: selected candidate unavailable`);
   return{rowId:rid,sourceName:name(r.sourceName,p),candidates,selectedIngredientId,dismissed:boolean(r.dismissed,p)};
  });
  if(new Set(rows.map(r=>r.rowId)).size!==rows.length)throw Error(`${p}: duplicate rows`);
  return{id:id(t.id,p),fingerprint,recipe,rows};
 });
 if(new Set(targets.map(t=>t.id)).size!==targets.length)throw Error('shopping: duplicate targets');
 if(targets.reduce((total,t)=>total+t.rows.length,0)>COUNT)throw Error('shopping source reference limit 5000');
 const targetsById=new Map(targets.map(t=>[t.id,t])),covered=new Set<string>();
 const items:ShoppingItem[]=array(state.items,'shopping.items').map((v,index)=>{
  const p=`shopping.items[${index}]`,i=object(v,['id','ingredientId','name','memberIds','known','bought','refs'],p);
  const item=candidate({ingredientId:i.ingredientId,name:i.name,memberIds:i.memberIds,known:i.known},p);
  const candidates:ShoppingCandidate[]=[];
  const refs=array(i.refs,p).map(v=>{const r=object(v,['targetId','rowId'],p),targetId=id(r.targetId,p),rid=id(r.rowId,p,300),row=targetsById.get(targetId)?.rows.find(r=>r.rowId===rid),key=referenceKey(targetId,rid);
   if(!row||row.dismissed||row.selectedIngredientId!==item.ingredientId||covered.has(key))throw Error(`${p}: invalid item reference`);
   candidates.push(row.candidates.find(c=>c.ingredientId===item.ingredientId)!);covered.add(key);return{targetId,rowId:rid};
  });
  if(!refs.length||canonicalJson([...item.memberIds].sort())!==canonicalJson(unique(candidates.flatMap(c=>c.memberIds)).sort())||item.known!==candidates.every(c=>c.known)||!candidates.some(c=>canonicalJson(c.name)===canonicalJson(item.name)))throw Error(`${p}: frozen candidate facts mismatch`);
  return {...item,id:id(i.id,p),bought:boolean(i.bought,p),refs};
 });
 if(new Set(items.map(i=>i.id)).size!==items.length||new Set(items.map(i=>i.ingredientId)).size!==items.length)throw Error('shopping: duplicate items');
 for(const t of targets)for(const r of t.rows)if(!r.dismissed&&!covered.has(referenceKey(t.id,r.rowId)))throw Error('shopping: missing item reference');
 const result:ShoppingState={format:'glass-notes-shopping',schemaVersion:1,targets,items};
 if(utf8ByteLength(JSON.stringify(result))>LIMIT)throw Error('shopping-too-large');return result;
}
export function parseShoppingState(raw:string|null):ShoppingState{if(raw===null)return emptyShoppingState();if(utf8ByteLength(raw)>LIMIT)throw Error('shopping-too-large');return validateShoppingState(JSON.parse(raw));}
/** Rebuild only after explicit edits; reading never recomputes a saved shopping list. */
export function rebuildShoppingItems(state:ShoppingState):ShoppingState{
 const previous=new Map(state.items.map(i=>[i.ingredientId,i])),items=new Map<string,ShoppingItem>();
 for(const target of state.targets)for(const row of target.rows){if(row.dismissed)continue;const c=row.candidates.find(c=>c.ingredientId===row.selectedIngredientId)!;let item=items.get(c.ingredientId);
  if(!item){const old=previous.get(c.ingredientId);item={...clone(c),id:old?.id??`shopping-item-${semanticFingerprint(c.ingredientId)}`,bought:old?.bought??false,refs:[]};items.set(c.ingredientId,item);}
  item.refs.push({targetId:target.id,rowId:row.rowId});item.memberIds=unique([...item.memberIds,...c.memberIds]);item.known=item.known&&c.known;
 }
 return validateShoppingState({...state,items:[...items.values()]});
}
export function addShoppingTarget(state:ShoppingState,catalogue:Catalogue,recipeValue:MakingRecipe,mergedPantry:Pantry):ShoppingState{
 rejectUnsafe(recipeValue,'recipe');
 const current=validateShoppingState(state),recipe=validateMakingRecipe(recipeValue),fingerprint=recipeFingerprint(recipe);
 if(current.targets.some(t=>t.fingerprint===fingerprint))return current;
 const resolver=compileMaterialResolver(catalogue),known=new Set(catalogue.ingredients.map(i=>i.id));
 const rows=recipe.version.ingredients.flatMap((row,index)=>{
  if(row.optional)return[];const resolution=resolver.resolveRecipeMaterial(recipe.version,index,mergedPantry.ingredientIds);if(resolution.match!=='missing')return[];
  const candidates=resolution.candidateIngredientIds.map(ingredientId=>{const concept=catalogue.materialConcepts?.find(c=>c.id===ingredientId),fallback=Object.fromEntries(LOCALES.map(locale=>[locale,ingredientId])) as unknown as Localized;
   return{ingredientId,name:clone(concept?.name??resolver.ingredients.get(ingredientId)?.name??fallback),memberIds:canonicalMemberIds(catalogue,ingredientId),known:known.has(ingredientId)};
  });
  const indexed=recipeMaterialRequirement(catalogue,recipe.version.id,index),requirement=indexed&&materialRequirementMatchesRow(indexed,row)?indexed:undefined;
  return[{rowId:rowId(recipe,index),sourceName:clone(requirement?.sourceName??recipe.ingredientNames[row.ingredientId]!),candidates,selectedIngredientId:candidates[0]!.ingredientId,dismissed:false}];
 });
 return rebuildShoppingItems({...current,targets:[...current.targets,{id:`shopping-target-${fingerprint}`,fingerprint,recipe,rows}]});
}
export function removeShoppingTarget(state:ShoppingState,targetId:string):ShoppingState{return rebuildShoppingItems({...state,targets:state.targets.filter(t=>t.id!==targetId)});}
export function removeShoppingItem(state:ShoppingState,itemId:string):ShoppingState{
 const current=validateShoppingState(state),item=current.items.find(i=>i.id===itemId);if(!item)return current;
 for(const ref of item.refs)current.targets.find(t=>t.id===ref.targetId)!.rows.find(r=>r.rowId===ref.rowId)!.dismissed=true;
 return rebuildShoppingItems(current);
}
export function selectShoppingAlternative(state:ShoppingState,targetId:string,rid:string,ingredientId:string):ShoppingState{
 const current=validateShoppingState(state),target=current.targets.find(t=>t.id===targetId),row=target?.rows.find(r=>r.rowId===rid);
 if(!row||row.dismissed||!row.candidates.some(c=>c.ingredientId===ingredientId))throw Error('shopping-alternative-unavailable');
 if(current.items.some(i=>i.bought&&i.refs.some(r=>r.targetId===targetId&&r.rowId===rid)))throw Error('shopping-item-bought');
 row.selectedIngredientId=ingredientId;return rebuildShoppingItems(current);
}
export function planShoppingPurchase(state:ShoppingState,pantry:Pantry,itemId:string,catalogue:Catalogue):{shopping:ShoppingState;pantry:Pantry;alreadyBought:boolean}{
 const current=validateShoppingState(state),item=current.items.find(i=>i.id===itemId);if(!item)throw Error('shopping-item-unavailable');
 if(item.bought)return{shopping:current,pantry:clone(pantry),alreadyBought:true};
 if(!item.known||!catalogue.ingredients.some(i=>i.id===item.ingredientId))throw Error('shopping-ingredient-unavailable');
 item.bought=true;
 return{shopping:current,pantry:{...clone(pantry),ingredientIds:pantry.ingredientIds.some(id=>item.memberIds.includes(id))?[...pantry.ingredientIds]:[...pantry.ingredientIds,item.ingredientId]},alreadyBought:false};
}
