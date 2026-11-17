import type {LocalKeyValueStorage} from './desktop-contract';
import {parseShoppingState, validateShoppingState} from '../domain/shopping';
import {emptyShoppingState, type ShoppingState} from '../domain/shopping/types';
import {utf8ByteLength} from '../domain/lab';
export const SHOPPING_STORAGE_KEY = 'glass-notes.shopping.v1';
export interface ShoppingStoreSnapshot {state:ShoppingState;hydrated:boolean;saving:boolean;error?:'read'|'write'}
export class ShoppingStore {
  private snapshot:ShoppingStoreSnapshot={state:emptyShoppingState(),hydrated:false,saving:false};
  private listeners=new Set<()=>void>();
  private queue:Promise<unknown>=Promise.resolve();
  private loading?:Promise<void>;
  constructor(private storage:LocalKeyValueStorage){}
  getSnapshot=()=>this.snapshot;
  subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn);};};
  private update(value:ShoppingStoreSnapshot){this.snapshot=value;for(const fn of this.listeners)fn();}
  load=():Promise<void>=>{
    if(this.snapshot.hydrated)return Promise.resolve();
    if(this.loading)return this.loading;
    this.loading=(async()=>{try{const raw=await this.storage.getItem(SHOPPING_STORAGE_KEY);this.update({state:parseShoppingState(raw),hydrated:true,saving:false});}
      catch{this.update({...this.snapshot,hydrated:false,saving:false,error:'read'});}})().finally(()=>{this.loading=undefined;});
    return this.loading;
  };
  private async persist():Promise<boolean>{
    this.update({...this.snapshot,saving:true});
    try{const raw=JSON.stringify(validateShoppingState(this.snapshot.state));
      if(utf8ByteLength(raw)>5_000_000)throw Error('shopping-too-large');
      await this.storage.setItem(SHOPPING_STORAGE_KEY,raw);
      if(await this.storage.getItem(SHOPPING_STORAGE_KEY)!==raw)throw Error('shopping-readback-failed');
      this.update({...this.snapshot,saving:false,error:undefined});return true;
    }catch{this.update({...this.snapshot,saving:false,error:'write'});return false;}
  }
  /** A failed intent stays in memory. Retry persists it once; it never reruns an edit. */
  change=(fn:(value:ShoppingState)=>ShoppingState):Promise<boolean>=>{
    const run=this.queue.catch(()=>undefined).then(async()=>{
      if(!this.snapshot.hydrated||this.snapshot.error) return false;
      const next=validateShoppingState(fn(validateShoppingState(this.snapshot.state)));
      if(next.items.some(item=>item.bought!==(this.snapshot.state.items.find(old=>old.ingredientId===item.ingredientId)?.bought??false)))throw Error('shopping-atomic-purchase-required');
      if(utf8ByteLength(JSON.stringify(next))>5_000_000)throw Error('shopping-too-large');
      this.update({...this.snapshot,state:next});return this.persist();
    });this.queue=run;return run;
  };
  retry=():Promise<boolean>=>{
    const run=this.queue.catch(()=>undefined).then(async()=>{if(!this.snapshot.hydrated){await this.load();return this.snapshot.hydrated;}return this.persist();});
    this.queue=run;return run;
  };
  whenSaved=async():Promise<boolean>=>{await this.queue.catch(()=>undefined);return this.snapshot.hydrated&&!this.snapshot.error&&!this.snapshot.saving;};
}
