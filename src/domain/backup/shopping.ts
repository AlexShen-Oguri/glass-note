import {emptyShoppingState,rebuildShoppingItems,validateShoppingState,type ShoppingState,type ShoppingTarget,type ShoppingItem} from '../shopping';
import {canonicalJson,semanticFingerprint} from './canonical';
import type {BackupConflict} from './types';
const clone=<T>(value:T):T=>JSON.parse(JSON.stringify(value)) as T;
const targetKey=(target:ShoppingTarget)=>canonicalJson({...target,id:undefined});
export function shoppingCount(value:ShoppingState|undefined):number{return value?value.targets.length+value.items.length:0;}
function safeId(base:string,used:Set<string>):string{let id=base,index=2;while(used.has(id))id=`${base}-${index++}`;used.add(id);return id;}
/** Frozen target conflicts stay separate; purchased canonical identities never become unbought. */
export function mergeShopping(current:ShoppingState|undefined,incoming:ShoppingState,mode:'merge'|'replace'):{value:ShoppingState;same:number;added:number;removed:number;conflicts:BackupConflict[]}{
 const a=validateShoppingState(current??emptyShoppingState()),b=validateShoppingState(incoming),conflicts:BackupConflict[]=[],targets=mode==='merge'?clone(a.targets):[],used=new Set(targets.map(t=>t.id)),seen=new Set(targets.map(targetKey));let same=0;
 for(const target of b.targets){const key=targetKey(target),old=a.targets.find(t=>t.id===target.id);
  if(mode==='merge'&&seen.has(key)){same++;continue;}
  let next=clone(target);
  if(used.has(next.id)){
   next.id=safeId(`import-shopping-${semanticFingerprint(key)}`,used);
   conflicts.push({section:'shopping',id:target.id,currentTitle:old?.recipe.title.en??target.id,incomingTitle:target.recipe.title.en,action:'keep-both'});
  }else {used.add(next.id);if(mode==='replace'&&old&&targetKey(old)!==key)conflicts.push({section:'shopping',id:target.id,currentTitle:old.recipe.title.en,incomingTitle:target.recipe.title.en,action:'replace'});}
  targets.push(next);seen.add(key);
 }
 const purchased=new Set([...a.items,...b.items].filter(i=>i.bought).map(i=>i.ingredientId)),seeds=new Map<string,ShoppingItem>(),itemIds=new Set<string>();
 for(const item of [...a.items,...b.items]){
  if(seeds.has(item.ingredientId))continue;const next=clone(item);
  if(itemIds.has(next.id)){next.id=safeId(`import-shopping-item-${semanticFingerprint(next.ingredientId)}`,itemIds);conflicts.push({section:'shopping',id:item.id,currentTitle:a.items.find(i=>i.id===item.id)?.name.en??item.id,incomingTitle:item.name.en,action:'keep-both'});}else itemIds.add(next.id);
  next.bought=purchased.has(next.ingredientId);seeds.set(next.ingredientId,next);
 }
 const value=rebuildShoppingItems({format:'glass-notes-shopping',schemaVersion:1,targets,items:[...seeds.values()]});
 const oldKeys=new Set(a.targets.map(targetKey)),oldMaterials=new Set(a.items.map(i=>i.ingredientId));
 const added=value.targets.filter(t=>!oldKeys.has(targetKey(t))).length+value.items.filter(i=>!oldMaterials.has(i.ingredientId)).length;
 const newKeys=new Set(value.targets.map(targetKey)),newMaterials=new Set(value.items.map(i=>i.ingredientId));
 const removed=a.targets.filter(t=>!newKeys.has(targetKey(t))).length+a.items.filter(i=>!newMaterials.has(i.ingredientId)).length;
 same+=b.items.filter(i=>a.items.some(old=>old.ingredientId===i.ingredientId&&old.bought===i.bought)).length;
 return{value,same,added,removed,conflicts};
}
