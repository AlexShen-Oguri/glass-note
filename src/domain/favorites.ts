import type {Catalogue} from './contracts';
import {recipeFingerprint,recipeSnapshot,validateMakingRecipe,type MakingRecipe} from './making';

export const FAVORITES_STORAGE_KEY = 'glass-notes.favorites.v1';
export const FAVORITES_RAW_VERSION = 2 as const;
export const MAX_FAVORITE_LISTS = 100;
export const MAX_FAVORITE_LIST_ITEMS = 500;
export const MAX_FAVORITE_LIST_NAME = 100;
const MAX_ID = 200;
const MAX_RAW_BYTES = 5_000_000;

export interface FavoriteListItem {
  versionId: string;
  cocktailId: string;
  fingerprint: string;
  addedAt: string;
  recipe: MakingRecipe;
}
export interface FavoriteList {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: FavoriteListItem[];
  importedFromId?: string;
}
export interface FavoritesState {
  version: typeof FAVORITES_RAW_VERSION;
  versionIds: string[];
  lists: FavoriteList[];
}
export type FavoriteListMutationStatus = 'saved'|'duplicate'|'not-found'|'write-failed'|'read-failed'|'invalid'|'limit-exceeded';
export interface FavoriteListMutationResult {status:FavoriteListMutationStatus;listId?:string}
export interface FavoritesSnapshot {
  versionIds: string[];
  unknownVersionIds: string[];
  lists: FavoriteList[];
  hydrated: boolean;
  storageAvailable: boolean;
  saving: boolean;
  error?: 'read' | 'write';
}
interface Storage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
export function favoriteVersionIds(catalogue: Catalogue): Set<string> {
  return new Set(catalogue.versions.filter(version => catalogue.cocktails.some(cocktail =>
    cocktail.id === version.cocktailId && cocktail.versionIds.includes(version.id))).map(version => version.id));
}

function copy<T>(value:T):T{return JSON.parse(JSON.stringify(value)) as T;}
function utf8ByteLength(value:string):number{
  let bytes=0;
  for(let index=0;index<value.length;index++){
    const point=value.charCodeAt(index);
    if(point<=0x7f)bytes+=1;
    else if(point<=0x7ff)bytes+=2;
    else if(point>=0xd800&&point<=0xdbff&&index+1<value.length&&value.charCodeAt(index+1)>=0xdc00&&value.charCodeAt(index+1)<=0xdfff){bytes+=4;index++;}
    else bytes+=3;
  }
  return bytes;
}
function object(value:unknown,path:string):Record<string,unknown>{
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error(`${path}: expected object`);
  return value as Record<string,unknown>;
}
function exactKeys(value:Record<string,unknown>,required:readonly string[],optional:readonly string[],path:string):void{
  const allowed=new Set([...required,...optional]);
  for(const key of required)if(!Object.prototype.hasOwnProperty.call(value,key))throw Error(`${path}: missing ${key}`);
  for(const key of Object.keys(value))if(!allowed.has(key))throw Error(`${path}: unsupported ${key}`);
}
function text(value:unknown,path:string,max:number):string{
  if(typeof value!=='string'||value.length>max||value.trim().length===0)throw Error(`${path}: invalid text`);
  return value;
}
function listName(value:unknown,path:string):string{
  if(typeof value!=='string')throw Error(`${path}: invalid text`);
  const result=value.trim();if(!result||result.length>MAX_FAVORITE_LIST_NAME)throw Error(`${path}: invalid text`);return result;
}
function identifier(value:unknown,path:string):string{return text(value,path,MAX_ID);}
function timestamp(value:unknown,path:string):string{
  const result=text(value,path,100);
  const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.exec(result);
  const parts=match?.slice(1,7).map(Number);
  const local=parts?new Date(Date.UTC(parts[0]!,parts[1]!-1,parts[2]!,parts[3]!,parts[4]!,parts[5]!)):undefined;
  if(!parts||!local||local.getUTCFullYear()!==parts[0]||local.getUTCMonth()!==parts[1]!-1||local.getUTCDate()!==parts[2]
    ||local.getUTCHours()!==parts[3]||local.getUTCMinutes()!==parts[4]||local.getUTCSeconds()!==parts[5]||!Number.isFinite(Date.parse(result)))throw Error(`${path}: invalid date`);
  return result;
}
function assertSafeKeys(value:unknown,path:string):void{
  if(!value||typeof value!=='object')return;
  if(Array.isArray(value)){value.forEach((item,index)=>assertSafeKeys(item,`${path}[${index}]`));return;}
  for(const [key,item] of Object.entries(value as Record<string,unknown>)){
    if(key==='__proto__'||key==='prototype'||key==='constructor')throw Error(`${path}: unsafe key`);
    assertSafeKeys(item,`${path}.${key}`);
  }
}
function uniqueVersionIds(value:unknown,path:string):string[]{
  if(!Array.isArray(value))throw Error(`${path}: invalid array`);
  const result=value.map((id,index)=>identifier(id,`${path}[${index}]`));
  if(new Set(result).size!==result.length)throw Error(`${path}: duplicate id`);
  return result;
}
function legacyVersionIds(value:unknown,path:string):string[]{
  if(!Array.isArray(value))throw Error(`${path}: invalid array`);
  return[...new Set(value.map((id,index)=>identifier(id,`${path}[${index}]`)))];
}
function favoriteListItem(value:unknown,path:string):FavoriteListItem{
  const item=object(value,path);exactKeys(item,['versionId','cocktailId','fingerprint','addedAt','recipe'],[],path);
  assertSafeKeys(item.recipe,`${path}.recipe`);
  const recipe=validateMakingRecipe(item.recipe);
  const versionId=identifier(item.versionId,`${path}.versionId`);
  const cocktailId=identifier(item.cocktailId,`${path}.cocktailId`);
  const fingerprint=text(item.fingerprint,`${path}.fingerprint`,64);
  if(!/^[0-9a-f]{64}$/.test(fingerprint)||fingerprint!==recipeFingerprint(recipe))throw Error(`${path}.fingerprint: mismatch`);
  if(recipe.version.id!==versionId||recipe.version.cocktailId!==cocktailId)throw Error(`${path}: recipe reference mismatch`);
  return{versionId,cocktailId,fingerprint,addedAt:timestamp(item.addedAt,`${path}.addedAt`),recipe};
}
function favoriteList(value:unknown,path:string):FavoriteList{
  const item=object(value,path);exactKeys(item,['id','name','createdAt','updatedAt','items'],['importedFromId'],path);
  if(!Array.isArray(item.items)||item.items.length>MAX_FAVORITE_LIST_ITEMS)throw Error(`${path}.items: invalid array`);
  const items=item.items.map((entry,index)=>favoriteListItem(entry,`${path}.items[${index}]`));
  if(new Set(items.map(entry=>entry.versionId)).size!==items.length)throw Error(`${path}.items: duplicate version`);
  const createdAt=timestamp(item.createdAt,`${path}.createdAt`),updatedAt=timestamp(item.updatedAt,`${path}.updatedAt`);
  if(Date.parse(updatedAt)<Date.parse(createdAt))throw Error(`${path}.updatedAt: before createdAt`);
  return{id:identifier(item.id,`${path}.id`),name:listName(item.name,`${path}.name`),createdAt,updatedAt,items,
    ...(item.importedFromId===undefined?{}:{importedFromId:identifier(item.importedFromId,`${path}.importedFromId`)})};
}
export function validateFavoriteLists(value:unknown):FavoriteList[]{
  if(!Array.isArray(value)||value.length>MAX_FAVORITE_LISTS)throw Error('favorites.lists: invalid array');
  const lists=value.map((entry,index)=>favoriteList(entry,`favorites.lists[${index}]`));
  if(new Set(lists.map(list=>list.id)).size!==lists.length)throw Error('favorites.lists: duplicate id');
  if(lists.reduce((total,list)=>total+list.items.length,0)>MAX_FAVORITE_LIST_ITEMS)throw Error('favorites.lists: too many items');
  return lists;
}
export function parseFavoritesState(raw:string|null):FavoritesState{
  if(raw===null)return{version:FAVORITES_RAW_VERSION,versionIds:[],lists:[]};
  if(typeof raw!=='string'||utf8ByteLength(raw)>MAX_RAW_BYTES)throw Error('favorites: invalid JSON');
  let value:unknown;try{value=JSON.parse(raw);}catch{throw Error('favorites: invalid JSON');}
  const item=object(value,'favorites');
  if(item.version===1){
    exactKeys(item,['version','versionIds'],[],'favorites');
    return{version:FAVORITES_RAW_VERSION,versionIds:legacyVersionIds(item.versionIds,'favorites.versionIds'),lists:[]};
  }
  if(item.version===FAVORITES_RAW_VERSION){
    exactKeys(item,['version','versionIds','lists'],[],'favorites');
    return{version:FAVORITES_RAW_VERSION,versionIds:uniqueVersionIds(item.versionIds,'favorites.versionIds'),lists:validateFavoriteLists(item.lists)};
  }
  throw Error('favorites: unsupported version');
}
export function parseFavorites(raw: string | null, allowed: Set<string>): string[] {
  try{return parseFavoritesState(raw).versionIds.filter(id=>allowed.has(id));}catch{return[];}
}
function setSaved(ids: string[], id: string, saved: boolean): string[] {
  if (!saved) return ids.filter(value => value !== id);
  return ids.includes(id) ? ids : [id, ...ids];
}

type PreparedMutation=
  |{kind:'create';list:FavoriteList}
  |{kind:'rename';listId:string;name:string;now:string}
  |{kind:'add';listId:string;item:FavoriteListItem;now:string}
  |{kind:'remove';listId:string;versionId:string;now:string}
  |{kind:'delete';listId:string};

function visibleSnapshot(state:FavoritesState,allowed:Set<string>,base:Pick<FavoritesSnapshot,'hydrated'|'storageAvailable'|'saving'|'error'>):FavoritesSnapshot{
  return{versionIds:state.versionIds.filter(id=>allowed.has(id)),unknownVersionIds:state.versionIds.filter(id=>!allowed.has(id)),lists:copy(state.lists),...base};
}
function serialized(state:FavoritesState):string{
  const payload=JSON.stringify({version:FAVORITES_RAW_VERSION,versionIds:state.versionIds,lists:state.lists});
  if(utf8ByteLength(payload)>MAX_RAW_BYTES)throw Error('favorites: storage limit exceeded');
  return payload;
}
function sameValue(left:unknown,right:unknown):boolean{return JSON.stringify(left)===JSON.stringify(right);}

/** Replays explicit user intent over slow hydration and serializes device writes. */
export class FavoritesStore {
  private state:FavoritesState={version:FAVORITES_RAW_VERSION,versionIds:[],lists:[]};
  private snapshot: FavoritesSnapshot = {versionIds: [],unknownVersionIds:[],lists:[], hydrated: false, storageAvailable: true,saving:false};
  private listeners = new Set<() => void>();
  private pending: Array<{id: string; saved: boolean}> = [];
  private pendingListMutations:PreparedMutation[]=[];
  private loading?: Promise<void>;
  private hasLoaded = false;
  private writes: Promise<void> = Promise.resolve();
  private writeCount=0;
  constructor(private allowed: Set<string>, private storage: Storage,private catalogue?:Catalogue) {}
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {this.listeners.delete(listener);};
  };
  private update(value: FavoritesSnapshot) {
    this.snapshot = value;
    for (const listener of this.listeners) listener();
  }
  private publish(patch:Partial<Pick<FavoritesSnapshot,'hydrated'|'storageAvailable'|'saving'|'error'>>={}){
    const base={hydrated:this.snapshot.hydrated,storageAvailable:this.snapshot.storageAvailable,saving:this.snapshot.saving,...('error'in this.snapshot?{error:this.snapshot.error}:{}),...patch};
    if(patch.error===undefined&&Object.prototype.hasOwnProperty.call(patch,'error'))delete base.error;
    this.update(visibleSnapshot(this.state,this.allowed,base));
  }
  load = (): Promise<void> => {
    if (this.loading) return this.loading;
    if (this.hasLoaded) return Promise.resolve();
    this.loading = (async () => {
      let state:FavoritesState;
      try {state=parseFavoritesState(await this.storage.getItem(FAVORITES_STORAGE_KEY));}
      catch {
        // Keep local intentions for a later read. Never replace unread device data.
        this.update({...this.snapshot, hydrated: false, storageAvailable: false, error: 'read'});
        return;
      }
      let changed=this.pending.length>0;
      for(const {id,saved} of this.pending)state={...state,versionIds:setSaved(state.versionIds,id,saved)};
      this.pending = [];
      const replayed=this.replayPendingListMutations(state);state=replayed.state;changed=changed||replayed.changed;
      this.state=state;
      this.hasLoaded = true;
      this.publish({hydrated:true,storageAvailable:true,error:undefined});
      if(changed)this.persist(this.state);
    })().finally(() => {this.loading = undefined;});
    return this.loading;
  };
  set = (id: string, saved: boolean) => {
    if (!this.allowed.has(id)) return;
    const ids=setSaved(this.state.versionIds,id,saved);
    if (!this.hasLoaded) this.pending.push({id, saved});
    this.state={...this.state,versionIds:ids};
    this.publish();
    if(this.hasLoaded)this.persist(this.state);
  };
  toggle = (id: string) => this.set(id, !this.snapshot.versionIds.includes(id));
  private persist(state:FavoritesState):Promise<boolean>{
    let payload:string;
    try{payload=serialized(state);}catch{this.publish({storageAvailable:false,error:'write'});return Promise.resolve(false);}
    this.writeCount++;this.publish({saving:true});
    let resolveResult!:(saved:boolean)=>void;const result=new Promise<boolean>(resolve=>{resolveResult=resolve;});
    this.writes=this.writes.then(async()=>{
      try {
        await this.storage.setItem(FAVORITES_STORAGE_KEY, payload);
        const readback=await this.storage.getItem(FAVORITES_STORAGE_KEY);
        if(readback!==payload)throw Error('favorites: readback mismatch');
        this.publish({hydrated:true,storageAvailable:true,error:undefined});resolveResult(true);
      }catch{this.publish({storageAvailable:false,error:'write'});resolveResult(false);}
      finally{this.writeCount--;this.publish({saving:this.writeCount>0});}
    });
    return result;
  }
  private persistAndConfirm=async(state:FavoritesState):Promise<boolean>=>{
    await this.persist(state);await this.whenSaved();
    return this.snapshot.storageAvailable&&!this.snapshot.saving&&this.snapshot.error===undefined;
  };
  private itemFor(versionId:string,now:string):FavoriteListItem|null{
    try{
      timestamp(now,'favorite.addedAt');
      if(!this.allowed.has(versionId)||!this.catalogue)return null;
      const recipe=recipeSnapshot(this.catalogue,versionId);if(!recipe)return null;
      return favoriteListItem({versionId,cocktailId:recipe.version.cocktailId,fingerprint:recipeFingerprint(recipe),addedAt:now,recipe},'favorite');
    }catch{return null;}
  }
  private applyMutation(state:FavoritesState,mutation:PreparedMutation):{state:FavoritesState;result:FavoriteListMutationResult}{
    const originalState=state;
    const listId=mutation.kind==='create'?mutation.list.id:mutation.listId;
    if(mutation.kind==='create'){
      if(state.lists.some(list=>list.id===listId))return{state,result:{status:'duplicate',listId}};
      if(state.lists.length>=MAX_FAVORITE_LISTS||state.lists.reduce((total,list)=>total+list.items.length,0)+mutation.list.items.length>MAX_FAVORITE_LIST_ITEMS)return{state,result:{status:'limit-exceeded',listId}};
      state={...state,lists:[...state.lists,copy(mutation.list)]};
    }else{
      const index=state.lists.findIndex(list=>list.id===listId);if(index<0)return{state,result:{status:'not-found',listId}};
      const current=state.lists[index]!;let next:FavoriteList;
      if(mutation.kind==='rename'){
        if(current.name===mutation.name)return{state,result:{status:'duplicate',listId}};
        next={...current,name:mutation.name,updatedAt:mutation.now};
      }else if(mutation.kind==='add'){
        if(current.items.some(item=>item.versionId===mutation.item.versionId))return{state,result:{status:'duplicate',listId}};
        if(state.lists.reduce((total,list)=>total+list.items.length,0)>=MAX_FAVORITE_LIST_ITEMS)return{state,result:{status:'limit-exceeded',listId}};
        next={...current,items:[...current.items,copy(mutation.item)],updatedAt:mutation.now};
      }else if(mutation.kind==='remove'){
        if(!current.items.some(item=>item.versionId===mutation.versionId))return{state,result:{status:'not-found',listId}};
        next={...current,items:current.items.filter(item=>item.versionId!==mutation.versionId),updatedAt:mutation.now};
      }else return{state:{...state,lists:state.lists.filter(list=>list.id!==listId)},result:{status:'saved',listId}};
      state={...state,lists:state.lists.map((list,itemIndex)=>itemIndex===index?next:list)};
    }
    try{const lists=validateFavoriteLists(state.lists);const next={...state,lists};serialized(next);return{state:next,result:{status:'saved',listId}};}
    catch(error){return{state:originalState,result:{status:error instanceof Error&&error.message==='favorites: storage limit exceeded'?'limit-exceeded':'invalid',listId}};}
  }
  private mutationSatisfied(state:FavoritesState,mutation:PreparedMutation):boolean{
    const listId=mutation.kind==='create'?mutation.list.id:mutation.listId;
    const list=state.lists.find(entry=>entry.id===listId);
    if(mutation.kind==='create')return !!list&&sameValue(list,mutation.list);
    if(mutation.kind==='delete')return !list;
    if(!list)return false;
    if(mutation.kind==='rename')return list.name===mutation.name;
    if(mutation.kind==='add')return list.items.some(item=>item.versionId===mutation.item.versionId);
    return !list.items.some(item=>item.versionId===mutation.versionId);
  }
  private replayPendingListMutations(state:FavoritesState):{state:FavoritesState;changed:boolean}{
    let changed=false;const unresolved:PreparedMutation[]=[];
    for(const mutation of this.pendingListMutations){
      const applied=this.applyMutation(state,mutation);state=applied.state;
      if(applied.result.status==='saved')changed=true;
      else if(!this.mutationSatisfied(state,mutation))unresolved.push(mutation);
    }
    this.pendingListMutations=unresolved;return{state,changed};
  }
  private clearSatisfiedPendingMutations(){this.pendingListMutations=this.pendingListMutations.filter(mutation=>!this.mutationSatisfied(this.state,mutation));}
  private durableDuplicate=async(result:FavoriteListMutationResult):Promise<FavoriteListMutationResult>=>{
    await this.whenSaved();
    if(this.snapshot.storageAvailable&&this.snapshot.error!=='write')return result;
    return await this.persistAndConfirm(this.state)?{status:'saved',listId:result.listId}:{status:'write-failed',listId:result.listId};
  };
  private mutate=async(mutation:PreparedMutation):Promise<FavoriteListMutationResult>=>{
    if(!this.hasLoaded){await this.load();if(!this.hasLoaded){this.pendingListMutations.push(mutation);return{status:'read-failed',listId:mutation.kind==='create'?mutation.list.id:mutation.listId};}}
    const applied=this.applyMutation(this.state,mutation);
    if(applied.result.status==='duplicate'){this.clearSatisfiedPendingMutations();return this.durableDuplicate(applied.result);}
    if(applied.result.status!=='saved')return applied.result;
    this.state=applied.state;this.clearSatisfiedPendingMutations();this.publish();
    return await this.persistAndConfirm(this.state)?applied.result:{status:'write-failed',listId:applied.result.listId};
  };
  createList=async({id,name,now,versionId}:{id:string;name:string;now:string;versionId?:string}):Promise<FavoriteListMutationResult>=>{
    let normalizedName:string;try{identifier(id,'favoriteList.id');normalizedName=listName(name,'favoriteList.name');timestamp(now,'favoriteList.createdAt');}
    catch{return{status:'invalid',listId:typeof id==='string'?id:undefined};}
    const item=versionId===undefined?undefined:this.itemFor(versionId,now);if(versionId!==undefined&&!item)return{status:'invalid',listId:id};
    return this.mutate({kind:'create',list:{id,name:normalizedName,createdAt:now,updatedAt:now,items:item?[item]:[]}});
  };
  renameList=async(id:string,name:string,now:string):Promise<FavoriteListMutationResult>=>{
    let normalizedName:string;try{identifier(id,'favoriteList.id');normalizedName=listName(name,'favoriteList.name');timestamp(now,'favoriteList.updatedAt');}
    catch{return{status:'invalid',listId:typeof id==='string'?id:undefined};}
    return this.mutate({kind:'rename',listId:id,name:normalizedName,now});
  };
  addToList=async(listId:string,versionId:string,now:string):Promise<FavoriteListMutationResult>=>{
    try{identifier(listId,'favoriteList.id');identifier(versionId,'favorite.versionId');}catch{return{status:'invalid',listId:typeof listId==='string'?listId:undefined};}
    const item=this.itemFor(versionId,now);return item?this.mutate({kind:'add',listId,item,now}):{status:'invalid',listId};
  };
  removeFromList=async(listId:string,versionId:string,now:string):Promise<FavoriteListMutationResult>=>{
    try{identifier(listId,'favoriteList.id');identifier(versionId,'favorite.versionId');timestamp(now,'favoriteList.updatedAt');}
    catch{return{status:'invalid',listId:typeof listId==='string'?listId:undefined};}
    return this.mutate({kind:'remove',listId,versionId,now});
  };
  deleteList=async(listId:string):Promise<FavoriteListMutationResult>=>{
    try{identifier(listId,'favoriteList.id');}catch{return{status:'invalid',listId:typeof listId==='string'?listId:undefined};}
    return this.mutate({kind:'delete',listId});
  };
  retry = async (): Promise<boolean> => {
    if (!this.hasLoaded) {
      await this.load();
      await this.whenSaved();
      return this.hasLoaded&&this.pendingListMutations.length===0&&this.snapshot.storageAvailable&&!this.snapshot.saving&&this.snapshot.error===undefined;
    }
    await this.whenSaved();
    const replayed=this.replayPendingListMutations(this.state);this.state=replayed.state;
    if(replayed.changed)this.publish();
    if(this.pendingListMutations.length>0){if(replayed.changed)await this.persistAndConfirm(this.state);return false;}
    if(replayed.changed||!this.snapshot.storageAvailable||this.snapshot.error!==undefined)return this.persistAndConfirm(this.state);
    return true;
  };
  whenSaved = async():Promise<void>=>{
    let observed:Promise<void>;
    do{observed=this.writes;await observed;}while(observed!==this.writes);
  };
}
