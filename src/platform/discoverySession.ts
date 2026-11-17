export interface DiscoverySession {seed:string;round:number;excludedExplorationCocktailIds:string[]}
interface SessionStorage {getItem(key:string):string|null;setItem(key:string,value:string):void}

const KEY='glass-notes.discovery-session.v1';
const MAX_ROUND=1_000_000;
const clone=(state:DiscoverySession):DiscoverySession=>({...state,excludedExplorationCocktailIds:[...state.excludedExplorationCocktailIds]});
function parse(raw:string|null):DiscoverySession|null{
  if(!raw||raw.length>2048)return null;
  try{
    const value:unknown=JSON.parse(raw);
    if(!value||typeof value!=='object'||Array.isArray(value))return null;
    const item=value as Record<string,unknown>;
    if(Object.keys(item).sort().join(',')!=='excludedExplorationCocktailIds,round,seed'||typeof item.seed!=='string'||!item.seed.trim()||item.seed.length>200||!Number.isSafeInteger(item.round)||Number(item.round)<0||Number(item.round)>MAX_ROUND)return null;
    if(!Array.isArray(item.excludedExplorationCocktailIds)||item.excludedExplorationCocktailIds.length>1||item.excludedExplorationCocktailIds.some(id=>typeof id!=='string'||!id.trim()||id.length>200))return null;
    return{seed:item.seed,round:Number(item.round),excludedExplorationCocktailIds:[...item.excludedExplorationCocktailIds]};
  }catch{return null;}
}

/** Ephemeral browse state only: no feedback, model weights, or business backup category. */
export function createDiscoverySessionStore(storage:()=>SessionStorage|null,seed:()=>string){
  let memory:DiscoverySession|undefined;
  const persist=()=>{try{storage()?.setItem(KEY,JSON.stringify(memory));}catch{/* A cache failure keeps the live session stable without claiming a business-data save. */}};
  const read=():DiscoverySession=>{
    if(!memory){let restored:DiscoverySession|null=null;try{restored=parse(storage()?.getItem(KEY)??null);}catch{/* Use memory when session storage is unavailable. */}
      memory=restored??{seed:seed(),round:0,excludedExplorationCocktailIds:[]};if(!restored)persist();
    }
    return clone(memory);
  };
  return{read,advance(id:string):DiscoverySession{
    if(!id.trim()||id.length>200)throw Error('invalid exploration id');
    const previous=read();memory={seed:previous.round>=MAX_ROUND?seed():previous.seed,round:previous.round>=MAX_ROUND?0:previous.round+1,excludedExplorationCocktailIds:[id]};persist();return clone(memory);
  }};
}

export const discoverySessionStore=createDiscoverySessionStore(
  ()=>typeof window==='undefined'?null:window.sessionStorage,
  ()=>globalThis.crypto?.randomUUID?.()??`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
);
