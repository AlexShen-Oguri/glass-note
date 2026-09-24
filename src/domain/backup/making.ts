import {emptyMakingState,type MakingState,type MakingSession} from '../making/types';
import {canonicalJson,semanticFingerprint} from './canonical';
import type {BackupConflict} from './types';

export function makingCount(value:MakingState|undefined):number{return value?value.stock.length+value.reviews.length+value.sessions.length:0;}
export function mergeMaking(current:MakingState|undefined,incoming:MakingState,mode:'merge'|'replace'):{value:MakingState;same:number;added:number;removed:number;conflicts:BackupConflict[]}{
  const a=current??emptyMakingState(),conflicts:BackupConflict[]=[];
  let same=0,added=0,removed=0;
  const merge=<T,>(left:T[],right:T[],identity:(v:T)=>string,title:(v:T)=>string):T[]=>{
    const map=new Map(left.map(v=>[identity(v),v]));
    for(const item of right){const old=map.get(identity(item));
      if(old===undefined){added++;map.set(identity(item),item);}
      else if(canonicalJson(old)===canonicalJson(item))same++;
      else{conflicts.push({section:'making',id:identity(item),currentTitle:title(old),incomingTitle:title(item),action:mode==='merge'?'keep-current':'replace'});if(mode==='replace')map.set(identity(item),item);}
    }
    if(mode==='replace'){const ids=new Set(right.map(identity));removed+=left.filter(v=>!ids.has(identity(v))).length;return right;}
    return [...map.values()];
  };
  const stock=merge(a.stock,incoming.stock,v=>v.ingredientId,v=>`${v.ingredientId} · ${v.amount} ${v.unit}${v.bottleId?` · ${v.bottleId}`:''}`);
  const reviews=merge(a.reviews,incoming.reviews,v=>`${v.versionId}\u0000${v.fingerprint}`,v=>v.versionId);
  const sessions:MakingSession[]=mode==='merge'?[...a.sessions]:[];
  const key=(session:MakingSession)=>canonicalJson({...session,id:undefined,consumptionApplied:undefined});
  const seen=new Set(a.sessions.map(key));const used=new Set(a.sessions.map(s=>s.id));
  for(const item of incoming.sessions){
    if(mode==='merge'&&seen.has(key(item))){same++;continue;}
    const old=a.sessions.find(s=>s.id===item.id);
    if(mode==='replace'){if(old&&key(old)===key(item))same++;else if(!old)added++;else conflicts.push({section:'making',id:item.id,currentTitle:old.recipe.title.en,incomingTitle:item.recipe.title.en,action:'replace'});sessions.push(item);continue;}
    let next=item;
    if(used.has(item.id)){
      const base=`import-making-${semanticFingerprint(item)}`;let id=base,n=2;while(used.has(id))id=`${base}-${n++}`;
      next={...item,id};conflicts.push({section:'making',id:item.id,currentTitle:old?.recipe.title.en??item.id,incomingTitle:item.recipe.title.en,action:'keep-both'});
    }
    // An identical batch retains its original consumption identity after ID remapping.
    // A forged/reused identity with a different snapshot is rejected by state validation.
    sessions.push(next);used.add(next.id);seen.add(key(item));added++;
  }
  if(mode==='replace')removed+=a.sessions.filter(s=>!incoming.sessions.some(i=>i.id===s.id)).length;
  const consumed=new Set([...a.sessions,...incoming.sessions].filter(s=>s.consumptionApplied).map(s=>s.consumptionId));
  return {value:{...a,stock,reviews,sessions:sessions.map(s=>consumed.has(s.consumptionId)?{...s,consumptionApplied:true}:s)},same,added,removed,conflicts};
}
