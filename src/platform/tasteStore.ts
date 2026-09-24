import type {LocalKeyValueStorage} from './desktop-contract';
import {parseTasteState, validateTasteState} from '../domain/taste';
import {emptyTasteState, type TasteState} from '../domain/taste/types';
import {utf8ByteLength} from '../domain/lab';
export const TASTE_STORAGE_KEY = 'glass-notes.taste.v1';
export interface TasteStoreSnapshot {state:TasteState;savedState:TasteState;hydrated:boolean;saving:boolean;error?:'read'|'write'}
export class TasteStore {
  private snapshot:TasteStoreSnapshot={state:emptyTasteState(),savedState:emptyTasteState(),hydrated:false,saving:false};
  private listeners=new Set<()=>void>();
  private queue:Promise<unknown>=Promise.resolve();
  private loading?:Promise<void>;
  constructor(private storage:LocalKeyValueStorage){}
  getSnapshot=()=>this.snapshot;
  subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn);};};
  private update(value:TasteStoreSnapshot){this.snapshot=value;for(const fn of this.listeners)fn();}
  load=():Promise<void>=>{
    if(this.snapshot.hydrated)return Promise.resolve();
    if(this.loading)return this.loading;
    this.loading=(async()=>{try{const raw=await this.storage.getItem(TASTE_STORAGE_KEY);this.update({state:parseTasteState(raw),savedState:parseTasteState(raw),hydrated:true,saving:false});}
      catch{this.update({...this.snapshot,hydrated:false,saving:false,error:'read'});}})().finally(()=>{this.loading=undefined;});
    return this.loading;
  };
  private async persist():Promise<boolean>{
    this.update({...this.snapshot,saving:true});
    try{const raw=JSON.stringify(validateTasteState(this.snapshot.state));
      if(utf8ByteLength(raw)>5_000_000)throw Error('taste-too-large');
      await this.storage.setItem(TASTE_STORAGE_KEY,raw);
      if(await this.storage.getItem(TASTE_STORAGE_KEY)!==raw)throw Error('taste-readback-failed');
      this.update({...this.snapshot,savedState:this.snapshot.state,saving:false,error:undefined});return true;
    }catch{this.update({...this.snapshot,saving:false,error:'write'});return false;}
  }
  /** A failed intent stays in memory. Retry persists it once; it never applies feedback twice. */
  change=(fn:(value:TasteState)=>TasteState):Promise<boolean>=>{
    const run=this.queue.catch(()=>undefined).then(async()=>{
      if(!this.snapshot.hydrated||this.snapshot.error) return false;
      const next=validateTasteState(fn(this.snapshot.state));
      if(utf8ByteLength(JSON.stringify(next))>5_000_000)throw Error('taste-too-large');
      this.update({...this.snapshot,state:next});return this.persist();
    });this.queue=run;return run;
  };
  retry=():Promise<boolean>=>{
    const run=this.queue.catch(()=>undefined).then(async()=>{if(!this.snapshot.hydrated){await this.load();return this.snapshot.hydrated;}return this.persist();});
    this.queue=run;return run;
  };
  whenSaved=async():Promise<boolean>=>{await this.queue.catch(()=>undefined);return this.snapshot.hydrated&&!this.snapshot.error&&!this.snapshot.saving;};
}
