import type {LocalKeyValueStorage} from './desktop-contract';
import {parseMakingState, validateMakingState} from '../domain/making';
import {emptyMakingState, type MakingState} from '../domain/making/types';
import {utf8ByteLength} from '../domain/lab';
export const MAKING_STORAGE_KEY = 'glass-notes.making.v1';
export interface MakingStoreSnapshot {state:MakingState;hydrated:boolean;saving:boolean;error?:'read'|'write'}
export class MakingStore {
  private snapshot:MakingStoreSnapshot={state:emptyMakingState(),hydrated:false,saving:false};
  private listeners=new Set<()=>void>();
  private queue:Promise<unknown>=Promise.resolve();
  private loading?:Promise<void>;
  constructor(private storage:LocalKeyValueStorage){}
  getSnapshot=()=>this.snapshot;
  subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn);};};
  private update(value:MakingStoreSnapshot){this.snapshot=value;for(const fn of this.listeners)fn();}
  load=():Promise<void>=>{
    if(this.snapshot.hydrated)return Promise.resolve();
    if(this.loading)return this.loading;
    this.loading=(async()=>{try{const raw=await this.storage.getItem(MAKING_STORAGE_KEY);this.update({state:parseMakingState(raw),hydrated:true,saving:false});}
      catch{this.update({...this.snapshot,hydrated:false,saving:false,error:'read'});}})().finally(()=>{this.loading=undefined;});
    return this.loading;
  };
  private async persist():Promise<boolean>{
    this.update({...this.snapshot,saving:true});
    try{const raw=JSON.stringify(validateMakingState(this.snapshot.state));
      if(utf8ByteLength(raw)>5_000_000)throw Error('making-too-large');
      await this.storage.setItem(MAKING_STORAGE_KEY,raw);
      if(await this.storage.getItem(MAKING_STORAGE_KEY)!==raw)throw Error('making-readback-failed');
      this.update({...this.snapshot,saving:false,error:undefined});return true;
    }catch{this.update({...this.snapshot,saving:false,error:'write'});return false;}
  }
  /** A failed intent stays in memory. Retry persists it once; it never reruns a deduction. */
  change=(fn:(value:MakingState)=>MakingState):Promise<boolean>=>{
    const run=this.queue.catch(()=>undefined).then(async()=>{
      if(!this.snapshot.hydrated||this.snapshot.error) return false;
      const next=validateMakingState(fn(this.snapshot.state));
      if(utf8ByteLength(JSON.stringify(next))>5_000_000)throw Error('making-too-large');
      this.update({...this.snapshot,state:next});return this.persist();
    });this.queue=run;return run;
  };
  retry=():Promise<boolean>=>{
    const run=this.queue.catch(()=>undefined).then(async()=>{if(!this.snapshot.hydrated){await this.load();return this.snapshot.hydrated;}return this.persist();});
    this.queue=run;return run;
  };
  whenSaved=async():Promise<boolean>=>{await this.queue.catch(()=>undefined);return this.snapshot.hydrated&&!this.snapshot.error&&!this.snapshot.saving;};
}
