import type {Catalogue,Flavour,RecipeVersion,SearchQuery} from '../contracts';
import {recipeFingerprint,recipeSnapshot} from '../making';
import {searchCocktails} from '../search';
import {
  emptyTasteState,
  type MemoryReason,
  type TasteFeedback,
  type TasteFeedbackInput,
  type TasteResult,
  type TasteState,
} from './types';

export * from './types';

const MAX_ENTRIES=5_000;
const MAX_ID=200;
const MAX_NOTES=20_000;
const MAX_JSON_BYTES=5_000_000;
const FLAVOURS=new Set<Flavour>(['citrus','fruit','floral','herbal','spice','coffee']);
const UNSAFE_KEYS=new Set(['__proto__','prototype','constructor']);

function object(value:unknown,path:string):Record<string,unknown>{
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error(`${path}: expected object`);
  const prototype=Object.getPrototypeOf(value);if(prototype!==Object.prototype&&prototype!==null)throw Error(`${path}: unsupported prototype`);
  return value as Record<string,unknown>;
}
function exactKeys(value:Record<string,unknown>,required:readonly string[],optional:readonly string[],path:string):void{
  const allowed=new Set([...required,...optional]);
  for(const key of required)if(!Object.prototype.hasOwnProperty.call(value,key))throw Error(`${path}: missing ${key}`);
  for(const key of Object.keys(value))if(!allowed.has(key))throw Error(`${path}: unsupported ${key}`);
}
function rejectUnsafeKeys(value:unknown,path:string,seen=new Set<object>()):void{
  if(!value||typeof value!=='object')return;
  if(seen.has(value))throw Error(`${path}: cyclic value`);
  seen.add(value);
  if(Array.isArray(value))value.forEach((item,index)=>rejectUnsafeKeys(item,`${path}[${index}]`,seen));
  else for(const [key,item] of Object.entries(value as Record<string,unknown>)){
    if(UNSAFE_KEYS.has(key))throw Error(`${path}: unsafe key ${key}`);
    rejectUnsafeKeys(item,`${path}.${key}`,seen);
  }
  seen.delete(value);
}
function text(value:unknown,path:string,max:number,{empty=false}:{empty?:boolean}={}):string{
  if(typeof value!=='string'||value.length>max||(!empty&&value.trim().length===0))throw Error(`${path}: invalid text`);
  return value;
}
function date(value:unknown,path:string):string{
  const result=text(value,path,100);
  const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|([+-])(\d{2}):(\d{2}))$/.exec(result);
  if(!match)throw Error(`${path}: invalid date`);
  const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]),hour=Number(match[4]),minute=Number(match[5]),second=Number(match[6]);
  const calendar=new Date(Date.UTC(year,month-1,day));
  const calendarValid=calendar.getUTCFullYear()===year&&calendar.getUTCMonth()===month-1&&calendar.getUTCDate()===day;
  const offsetHour=match[8]==='Z'?0:Number(match[10]),offsetMinute=match[8]==='Z'?0:Number(match[11]);
  if(!calendarValid||hour>23||minute>59||second>59||offsetHour>14||offsetMinute>59||(offsetHour===14&&offsetMinute!==0)||!Number.isFinite(Date.parse(result)))throw Error(`${path}: invalid date`);
  return result;
}
function boolean(value:unknown,path:string):boolean{
  if(typeof value!=='boolean')throw Error(`${path}: expected boolean`);
  return value;
}
function feedbackInput(value:unknown,path:string):TasteFeedbackInput{
  const item=object(value,path);exactKeys(item,['experience','sentiment','tooSweet','tooStrong','likedFlavours','notes'],[],path);
  if(!['drank','made','both'].includes(String(item.experience)))throw Error(`${path}.experience: unsupported`);
  if(!['neutral','like','dislike'].includes(String(item.sentiment)))throw Error(`${path}.sentiment: unsupported`);
  if(!Array.isArray(item.likedFlavours)||item.likedFlavours.length>FLAVOURS.size||item.likedFlavours.some(value=>!FLAVOURS.has(value as Flavour)))throw Error(`${path}.likedFlavours: unsupported`);
  if(new Set(item.likedFlavours).size!==item.likedFlavours.length)throw Error(`${path}.likedFlavours: duplicate value`);
  return{
    experience:item.experience as TasteFeedbackInput['experience'],
    sentiment:item.sentiment as TasteFeedbackInput['sentiment'],
    tooSweet:boolean(item.tooSweet,`${path}.tooSweet`),
    tooStrong:boolean(item.tooStrong,`${path}.tooStrong`),
    likedFlavours:[...(item.likedFlavours as Flavour[])],
    notes:text(item.notes,`${path}.notes`,MAX_NOTES,{empty:true}),
  };
}
function recipe(value:unknown,path:string):TasteFeedback['recipe']{
  rejectUnsafeKeys(value,path);
  recipeFingerprint(value as TasteFeedback['recipe']);
  return JSON.parse(JSON.stringify(value)) as TasteFeedback['recipe'];
}
function feedback(value:unknown,path:string):TasteFeedback{
  const item=object(value,path);exactKeys(item,['id','recipe','createdAt','updatedAt','experience','sentiment','tooSweet','tooStrong','likedFlavours','notes'],[],path);
  const id=text(item.id,`${path}.id`,MAX_ID),createdAt=date(item.createdAt,`${path}.createdAt`),updatedAt=date(item.updatedAt,`${path}.updatedAt`);
  if(Date.parse(updatedAt)<Date.parse(createdAt))throw Error(`${path}.updatedAt: before createdAt`);
  const input=feedbackInput({experience:item.experience,sentiment:item.sentiment,tooSweet:item.tooSweet,tooStrong:item.tooStrong,likedFlavours:item.likedFlavours,notes:item.notes},path);
  return{id,recipe:recipe(item.recipe,`${path}.recipe`),createdAt,updatedAt,...input};
}

export function validateTasteState(value:unknown):TasteState{
  rejectUnsafeKeys(value,'taste');
  const item=object(value,'taste');exactKeys(item,['format','schemaVersion','entries'],[],'taste');
  if(item.format!=='glass-notes-taste'||item.schemaVersion!==1)throw Error('taste: unsupported format or version');
  if(!Array.isArray(item.entries)||item.entries.length>MAX_ENTRIES)throw Error('taste.entries: invalid array');
  const entries=item.entries.map((entry,index)=>feedback(entry,`taste.entries[${index}]`));
  if(new Set(entries.map(entry=>entry.id)).size!==entries.length)throw Error('taste.entries: duplicate id');
  return{format:'glass-notes-taste',schemaVersion:1,entries};
}

export function parseTasteState(raw:string|null):TasteState{
  if(raw===null)return emptyTasteState();
  if(typeof raw!=='string'||utf8ByteLength(raw)>MAX_JSON_BYTES)throw Error('taste: invalid JSON');
  let value:unknown;
  try{value=JSON.parse(raw);}catch{throw Error('taste: invalid JSON');}
  return validateTasteState(value);
}

export function createFeedback(recipeValue:TasteFeedback['recipe'],idValue:string,nowValue:string,inputValue:TasteFeedbackInput):TasteFeedback{
  const id=text(idValue,'feedback.id',MAX_ID),now=date(nowValue,'feedback.createdAt'),input=feedbackInput(inputValue,'feedback');
  return feedback({id,recipe:recipe(recipeValue,'feedback.recipe'),createdAt:now,updatedAt:now,...input},'feedback');
}

export function editFeedback(entryValue:TasteFeedback,nowValue:string,inputValue:TasteFeedbackInput):TasteFeedback{
  const entry=feedback(entryValue,'feedback'),now=date(nowValue,'feedback.updatedAt');
  if(Date.parse(now)<Date.parse(entry.createdAt)||Date.parse(now)<Date.parse(entry.updatedAt))throw Error('feedback.updatedAt: before existing timestamp');
  return feedback({...entry,...feedbackInput(inputValue,'feedback'),updatedAt:now},'feedback');
}

/** Mark experience without inventing a preference or overwriting an existing opinion. */
export function recordExperience(state:TasteState,recipeValue:TasteFeedback['recipe'],experience:'drank'|'made',id:string,now:string):TasteState{
  const fingerprint=recipeFingerprint(recipeValue);
  const previous=[...state.entries].reverse().filter(entry=>entry.recipe.version.id===recipeValue.version.id&&recipeFingerprint(entry.recipe)===fingerprint).sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt))[0];
  if(previous){
    if(previous.experience===experience||previous.experience==='both')return state;
    const updated=editFeedback(previous,now,{experience:'both',sentiment:previous.sentiment,tooSweet:previous.tooSweet,tooStrong:previous.tooStrong,likedFlavours:previous.likedFlavours,notes:previous.notes});
    return {...state,entries:state.entries.map(entry=>entry.id===previous.id?updated:entry)};
  }
  return {...state,entries:[...state.entries,createFeedback(recipeValue,id,now,{experience,sentiment:'neutral',tooSweet:false,tooStrong:false,likedFlavours:[],notes:''})]};
}

interface VersionMemory {score:number;reasons:MemoryReason[]}

export function rankWithTaste(catalogue:Catalogue,query:SearchQuery,stateValue:TasteState):TasteResult[]{
  const searched=searchCocktails(catalogue,query);
  const state=validateTasteState(stateValue);
  if(state.entries.length===0)return searched.map(result=>({...result,memoryReasons:[]}));
  const versions=new Map(catalogue.versions.map(version=>[version.id,version]));
  const latest=latestByIdentity(state.entries);
  const exactByVersion=new Map<string,TasteFeedback>();
  for(const id of new Set(searched.flatMap(result=>result.versionIds))){
    const version=versions.get(id);if(!version)continue;
    const current=recipeSnapshot(catalogue,id);
    if(!current)continue;
    const entry=latest.get(identity(id,recipeFingerprint(current)));
    if(entry&&entry.recipe.version.sourceId===version.sourceId&&entry.recipe.source.id===version.sourceId)exactByVersion.set(id,entry);
  }
  const flavourEvidence=new Map<Flavour,string[]>();
  const sweetEvidence:string[]=[],strongEvidence:string[]=[];
  for(const entry of latest.values()){
    for(const flavour of entry.likedFlavours)addEvidence(flavourEvidence,flavour,entry.id);
    if(entry.tooSweet)sweetEvidence.push(entry.id);
    if(entry.tooStrong)strongEvidence.push(entry.id);
  }
  const ranked=searched.map((result,index)=>{
    const candidates=result.versionIds.map((id,versionIndex)=>{
      const version=versions.get(id);
      const memory=version?versionMemory(version,exactByVersion.get(id),flavourEvidence,sweetEvidence,strongEvidence):{score:0,reasons:[]};
      return{id,versionIndex,memory};
    });
    const originalIndex=Math.max(0,result.versionIds.indexOf(result.selectedVersionId));
    candidates.sort((left,right)=>right.memory.score-left.memory.score||(left.versionIndex===originalIndex?-1:right.versionIndex===originalIndex?1:left.versionIndex-right.versionIndex));
    const selected=candidates[0];
    return{index,memoryScore:selected?.memory.score??0,result:{...result,selectedVersionId:selected?.id??result.selectedVersionId,memoryReasons:selected?.memory.reasons??[]}};
  });
  ranked.sort((left,right)=>right.memoryScore-left.memoryScore||left.index-right.index);
  return ranked.map(item=>item.result);
}

function latestByIdentity(entries:readonly TasteFeedback[]):Map<string,TasteFeedback>{
  const result=new Map<string,TasteFeedback>();
  for(const entry of entries){
    const key=identity(entry.recipe.version.id,recipeFingerprint(entry.recipe)),previous=result.get(key);
    if(!previous||compareFeedback(previous,entry)<0)result.set(key,entry);
  }
  return result;
}
function identity(versionId:string,fingerprint:string):string{return `${versionId}\u0000${fingerprint}`;}
function compareFeedback(left:TasteFeedback,right:TasteFeedback):number{
  return Date.parse(left.updatedAt)-Date.parse(right.updatedAt)||Date.parse(left.createdAt)-Date.parse(right.createdAt)||left.id.localeCompare(right.id);
}
function addEvidence(map:Map<Flavour,string[]>,flavour:Flavour,id:string):void{
  const ids=map.get(flavour)??[];if(!ids.includes(id))ids.push(id);map.set(flavour,ids);
}
function reason(kind:MemoryReason['kind'],feedbackIds:string[],flavours?:Flavour[]):MemoryReason{
  return{kind,feedbackIds:[...new Set(feedbackIds)].sort().slice(0,3),...(flavours?.length?{flavours:[...new Set(flavours)]}:{})};
}
function versionMemory(version:RecipeVersion,exact:TasteFeedback|undefined,flavourEvidence:Map<Flavour,string[]>,sweetEvidence:string[],strongEvidence:string[]):VersionMemory{
  let score=0;const reasons:MemoryReason[]=[];
  if(exact?.sentiment==='like'){score+=12;reasons.push(reason('liked-version',[exact.id]));}
  else if(exact?.sentiment==='dislike'){score-=12;reasons.push(reason('disliked-version',[exact.id]));}
  const liked=version.flavours.filter(flavour=>flavourEvidence.has(flavour));
  if(liked.length){score+=liked.length*2;reasons.push(reason('liked-flavour',liked.flatMap(flavour=>flavourEvidence.get(flavour)??[]),liked));}
  if(sweetEvidence.length){
    if(version.tastes.includes('sweet')){score-=2;reasons.push(reason('sweet-caution',sweetEvidence));}
  }
  if(strongEvidence.length){
    if(version.strength==='strong'){score-=2;reasons.push(reason('strong-caution',strongEvidence));}
  }
  return{score,reasons};
}
function utf8ByteLength(value:string):number{
  let bytes=0;for(let index=0;index<value.length;index++){const point=value.charCodeAt(index);if(point<=0x7f)bytes++;else if(point<=0x7ff)bytes+=2;else if(point>=0xd800&&point<=0xdbff&&index+1<value.length&&value.charCodeAt(index+1)>=0xdc00&&value.charCodeAt(index+1)<=0xdfff){bytes+=4;index++;}else bytes+=3;}return bytes;
}
