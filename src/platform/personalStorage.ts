import type {LocalKeyValueStorage} from './desktop-contract';

export const PERSONAL_KEYS = {
  preferences:'glass-notes.preferences', favorites:'glass-notes.favorites.v1', pantry:'glass-notes.pantry.v1',
  bottles:'glass-notes.owned-bottles.v1', lab:'glass-notes.lab.v1', privateRecipes:'glass-notes.private-recipes.v1',
  references:'glass-notes.backup-references.v1',
  making:'glass-notes.making.v1',
  taste:'glass-notes.taste.v1',
} as const;
export type PersonalKey = keyof typeof PERSONAL_KEYS;
export type RawPersonalData = Record<PersonalKey,string|null>;
export const GENERATION_KEY='glass-notes.storage-generation.v1';
export const JOURNAL_KEY='glass-notes.recovery.v1';
const targets=[...Object.values(PERSONAL_KEYS),GENERATION_KEY];
const slot=(index:number)=>`glass-notes.recovery.before.${index}`;
interface Journal {version:1; phase:'prepared'|'committed'; entries:{key:string; slot:number; wasNull:boolean; checksum:string}[]}
export type RecoveryNotice='restored'|'rolled-back'|'stale'|'external-change';
export interface RecoveryState {phase:'loading'|'ready'|'restoring'|'blocked'; epoch:number; notice?:RecoveryNotice; error?:string}
type Lock=<T>(task:()=>Promise<T>)=>Promise<T>;

// Corruption detection for saved before-images; this is not a security signature.
function checksum(value:string|null):string {
  if(value===null)return 'null'; let a=2166136261,b=5381;
  for(let i=0;i<value.length;i++){a=Math.imul(a^value.charCodeAt(i),16777619);b=Math.imul(b,33)^value.charCodeAt(i);}
  return `${value.length}:${a>>>0}:${b>>>0}`;
}
function parseJournal(raw:string):Journal {
  const value=JSON.parse(raw) as Journal;
  if(!value||Object.keys(value).some(k=>!['version','phase','entries'].includes(k))||value.version!==1||!['prepared','committed'].includes(value.phase)||!Array.isArray(value.entries)||!value.entries.length||value.entries.length>targets.length)throw Error('invalid-recovery-record');
  const seen=new Set<string>(),slots=new Set<number>();
  for(const e of value.entries){if(!e||Object.keys(e).some(k=>!['key','slot','wasNull','checksum'].includes(k))||!targets.includes(e.key)||seen.has(e.key)||!Number.isInteger(e.slot)||e.slot<0||e.slot>=targets.length||slots.has(e.slot)||typeof e.wasNull!=='boolean'||typeof e.checksum!=='string'||e.checksum.length>90)throw Error('invalid-recovery-record');seen.add(e.key);slots.add(e.slot);}
  return value;
}

/** A persistent rollback journal, scoped writers and a single process queue. */
export class PersonalStorage {
  private state:RecoveryState={phase:'loading',epoch:0};
  private listeners=new Set<()=>void>();
  private queue:Promise<unknown>=Promise.resolve();
  private generation:string|null=null;
  private initializing?:Promise<void>;
  constructor(private raw:LocalKeyValueStorage,private lock:Lock=task=>task(),private canRestore=()=>true){}
  getSnapshot=()=>this.state;
  subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn);};};
  private update(state:RecoveryState){this.state=state;for(const fn of this.listeners)fn();}
  private enqueue<T>(task:()=>Promise<T>):Promise<T>{const run=this.queue.catch(()=>undefined).then(()=>this.lock(task));this.queue=run.catch(()=>undefined);return run;}
  private async put(key:string,value:string|null){if(value===null){if(!this.raw.removeItem)throw Error('remove-unavailable');await this.raw.removeItem(key);}else await this.raw.setItem(key,value);if(await this.raw.getItem(key)!==value)throw Error('storage-readback-failed');}
  private async cleanup(journal:Journal){for(const e of journal.entries)await this.put(slot(e.slot),null);await this.put(JOURNAL_KEY,null);}
  private async rollback(journal:Journal){
    // Validate every before-image before changing any destination, including absent keys.
    const values=await Promise.all(journal.entries.map(async e=>{const raw=await this.raw.getItem(slot(e.slot));const before=e.wasNull?null:raw;if((!e.wasNull&&raw===null)||checksum(before)!==e.checksum)throw Error('recovery-image-unavailable');return {e,before};}));
    for(const {e,before} of values.reverse())await this.put(e.key,before);
    // Mark rollback complete before cleanup so interrupted cleanup never needs missing slots.
    const committed:Journal={...journal,phase:'committed'};await this.put(JOURNAL_KEY,JSON.stringify(committed));await this.cleanup(committed);
  }
  initialize=():Promise<void>=>{
    if(this.initializing)return this.initializing;
    this.update({...this.state,phase:'loading',epoch:this.state.epoch+1,error:undefined});
    this.initializing=this.enqueue(async()=>{
      const raw=await this.raw.getItem(JOURNAL_KEY);let notice:RecoveryNotice|undefined;
      if(raw!==null){if(!this.canRestore())throw Error('exclusive-storage-unavailable');const journal=parseJournal(raw);if(journal.phase==='prepared'){await this.rollback(journal);notice='rolled-back';}else await this.cleanup(journal);}
      this.generation=await this.raw.getItem(GENERATION_KEY);
      this.update({phase:'ready',epoch:this.state.epoch,notice:notice??this.state.notice});
    }).catch(error=>{this.update({...this.state,phase:'blocked',error:error instanceof Error?error.message:'storage-unavailable'});}).finally(()=>{this.initializing=undefined;});
    return this.initializing;
  };
  private async checkSession(epoch:number){
    if(this.state.phase!=='ready'||epoch!==this.state.epoch)throw Error('storage-session-expired');
    if(await this.raw.getItem(GENERATION_KEY)!==this.generation){this.update({phase:'blocked',epoch:this.state.epoch+1,notice:'external-change',error:'external-change'});throw Error('storage-session-expired');}
  }
  createSession=():LocalKeyValueStorage=>{
    const epoch=this.state.epoch;
    return {
      getItem:key=>this.enqueue(async()=>{await this.checkSession(epoch);return this.raw.getItem(key);}),
      setItem:(key,value)=>this.enqueue(async()=>{await this.checkSession(epoch);await this.raw.setItem(key,value);}),
      removeItem:key=>this.enqueue(async()=>{await this.checkSession(epoch);if(!this.raw.removeItem)throw Error('remove-unavailable');await this.raw.removeItem(key);}),
    };
  };
  readAll=():Promise<RawPersonalData>=>this.enqueue(async()=>{await this.checkSession(this.state.epoch);const entries=await Promise.all(Object.entries(PERSONAL_KEYS).map(async([name,key])=>[name,await this.raw.getItem(key)]));return Object.fromEntries(entries) as RawPersonalData;});
  restore=async(before:RawPersonalData,after:Partial<RawPersonalData>):Promise<void>=>{
    if(this.state.phase!=='ready')throw Error('storage-unavailable');
    if(!this.canRestore())throw Error('exclusive-storage-unavailable');
    const selected=Object.keys(after) as PersonalKey[];
    if(!selected.length||selected.some(name=>!Object.hasOwn(PERSONAL_KEYS,name)||!(after[name]===null||typeof after[name]==='string')))throw Error('invalid-restore-plan');
    this.update({phase:'restoring',epoch:this.state.epoch+1});
    await this.enqueue(async()=>{
      let journal:Journal|undefined;let prepared=false;let committed=false;
      try{
        if(await this.raw.getItem(JOURNAL_KEY)!==null)throw Error('recovery-already-pending');
        for(const [name,key] of Object.entries(PERSONAL_KEYS))if(await this.raw.getItem(key)!==before[name as PersonalKey])throw Error('stale-restore-plan');
        if(await this.raw.getItem(GENERATION_KEY)!==this.generation)throw Error('stale-restore-plan');
        const data=selected.map(name=>({key:PERSONAL_KEYS[name],before:before[name],after:after[name]!}));
        data.push({key:GENERATION_KEY as typeof data[number]['key'],before:this.generation,after:JSON.stringify(`${Date.now()}-${Math.random().toString(36).slice(2)}`)});
        journal={version:1,phase:'prepared',entries:data.map((entry,index)=>({key:entry.key,slot:index,wasNull:entry.before===null,checksum:checksum(entry.before)}))};
        for(let i=0;i<data.length;i++)await this.put(slot(i),data[i]!.before);
        // Treat an uncertain write of the prepared record as pending, never as untouched.
        prepared=true;await this.put(JOURNAL_KEY,JSON.stringify(journal));
        for(const entry of data)await this.put(entry.key,entry.after);
        journal={...journal,phase:'committed'};
        await this.put(JOURNAL_KEY,JSON.stringify(journal));committed=true;
        this.generation=data[data.length-1]!.after;
        await this.cleanup(journal);
        this.update({phase:'ready',epoch:this.state.epoch,notice:'restored'});
      }catch(error){
        const message=error instanceof Error?error.message:'restore-failed';
        if(prepared&&journal){
          try{
            const persisted=await this.raw.getItem(JOURNAL_KEY);
            const saved=persisted===null?null:parseJournal(persisted);
            if(committed||saved?.phase==='committed'){if(saved)await this.cleanup(saved);this.generation=await this.raw.getItem(GENERATION_KEY);this.update({phase:'ready',epoch:this.state.epoch,notice:'restored'});return;}
            // Missing prepared journal means its initial write failed before any data write.
            if(saved)await this.rollback(saved);
            this.generation=await this.raw.getItem(GENERATION_KEY);
            this.update({phase:'ready',epoch:this.state.epoch,notice:'rolled-back',error:message});
          }catch(recoveryError){this.update({phase:'blocked',epoch:this.state.epoch,error:recoveryError instanceof Error?recoveryError.message:'recovery-required'});}
        }else this.update({phase:'ready',epoch:this.state.epoch,notice:message==='stale-restore-plan'?'stale':undefined,error:message});
        throw error;
      }
    });
  };
  /** Exact pre-restore values for a user-requested local rescue export. */
  readRecoveryBefore=():Promise<RawPersonalData>=>this.enqueue(async()=>{
    const record=await this.raw.getItem(JOURNAL_KEY);if(record===null)throw Error('no-recovery-record');const journal=parseJournal(record);if(journal.phase!=='prepared')throw Error('restore-already-committed');
    const entries=await Promise.all(Object.entries(PERSONAL_KEYS).map(async([name,key])=>{const e=journal.entries.find(e=>e.key===key);let value=await this.raw.getItem(e?slot(e.slot):key);if(e){if(e.wasNull)value=null;if(checksum(value)!==e.checksum)throw Error('recovery-image-unavailable');}return [name,value];}));return Object.fromEntries(entries) as RawPersonalData;
  });
}
