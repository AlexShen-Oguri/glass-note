import type {TasteState} from '../taste/types';
import {emptyTasteState} from '../taste/types';
import {canonicalJson,semanticFingerprint} from './canonical';
import type {BackupConflict} from './types';

/** Keep conflicting observations without assigning them duplicate influence on import. */
export function mergeTaste(current:TasteState|undefined,incoming:TasteState,mode:'merge'|'replace'){
  const a=current?.entries??[],b=incoming.entries;
  const key=(entry:typeof b[number])=>canonicalJson({...entry,id:undefined});
  const conflicts:BackupConflict[]=[];
  const entries=mode==='replace'?[...b]:[...a];
  const ids=new Set(entries.map(e=>e.id)),semantics=new Set(a.map(key));
  let same=0,added=0;
  for(const entry of b){
    const old=a.find(e=>e.id===entry.id),semantic=key(entry);
    if(semantics.has(semantic)){same++;continue;}
    if(old)conflicts.push({section:'taste',id:entry.id,currentTitle:old.recipe.title.en,incomingTitle:entry.recipe.title.en,action:mode==='merge'?'keep-both':'replace'});
    if(mode==='merge'){
      let id=entry.id;
      if(ids.has(id)){const base=`import-taste-${semanticFingerprint({...entry,id:undefined})}`;id=base;let n=2;while(ids.has(id))id=`${base}-${n++}`;}
      entries.push({...entry,id});ids.add(id);semantics.add(semantic);added++;
    }else if(!old)added++;
  }
  return {value:{...emptyTasteState(),entries},same,added,conflicts,
    removed:mode==='replace'?a.filter(e=>!b.some(next=>next.id===e.id)).length:0};
}
