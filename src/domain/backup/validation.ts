import {parseLabBackup, utf8ByteLength} from '../lab';
import {validatePrivateRecipeBook} from '../private-recipes';
import {validateTasteState} from '../taste';
import {validateMakingState} from '../making';
import {validateFavoriteLists,type FavoriteList} from '../favorites';
import type {Preferences} from '../../platform/preferences';
import {
  BACKUP_LIMIT,
  BACKUP_SECTIONS,
  type BackupReference,
  type BackupSections,
  type FullBackup,
  type PersonalData,
  type ReferenceKind,
} from './types';
import {canonicalJson} from './canonical';
import {BackupError, type BackupErrorCode} from './errors';

const LIMITS = {nodes: 250_000, depth: 64, ids: 20_000, id: 200, name: 2_000, url: 4_096} as const;
const DANGEROUS_KEYS = new Set(['__proto__','prototype','constructor']);
const REFERENCE_KINDS = new Set<ReferenceKind>(['ingredient','brand','bottle','recipeVersion','source']);
type RecordValue = Record<string,unknown>;

function fail(code: BackupErrorCode, path: string, detail: string): never {
  throw new BackupError(code, `${path}: ${detail}`);
}

function record(value: unknown, path: string): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('invalid-data', path, 'expected an object');
  return value as RecordValue;
}

function exactKeys(value: RecordValue, required: readonly string[], optional: readonly string[], path: string): void {
  const allowed = new Set([...required,...optional]);
  for (const key of required) if (!Object.prototype.hasOwnProperty.call(value,key)) fail('invalid-data',path,`missing ${key}`);
  for (const key of Object.keys(value)) if (!allowed.has(key)) fail('invalid-data',path,`unsupported property ${key}`);
}

function rejectUnsafe(value: unknown): void {
  const pending: Array<{value:unknown;path:string;depth:number}> = [{value,path:'backup',depth:0}];
  let nodes = 0;
  while (pending.length) {
    const current = pending.pop()!;
    if (++nodes > LIMITS.nodes) fail('invalid-data','backup',`exceeds ${LIMITS.nodes} nested values`);
    if (current.depth > LIMITS.depth) fail('invalid-data',current.path,`exceeds nesting depth ${LIMITS.depth}`);
    if (Array.isArray(current.value)) {
      current.value.forEach((item,index)=>pending.push({value:item,path:`${current.path}[${index}]`,depth:current.depth+1}));
    } else if (current.value && typeof current.value === 'object') {
      for (const key of Object.keys(current.value)) {
        if (DANGEROUS_KEYS.has(key)) fail('unsafe-key',current.path,`unsafe property ${key}`);
        pending.push({value:(current.value as RecordValue)[key],path:`${current.path}.${key}`,depth:current.depth+1});
      }
    }
  }
}

function text(value: unknown, path: string, max: number = LIMITS.name, empty = false): string {
  if (typeof value !== 'string' || value.length > max || (!empty && value.trim().length === 0)) {
    fail('invalid-data',path,`expected ${empty?'':'non-empty '}text up to ${max} characters`);
  }
  return value;
}

function id(value: unknown, path: string): string { return text(value,path,LIMITS.id); }

function date(value: unknown, path: string): string {
  const result=text(value,path,100);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(result)
    || !Number.isFinite(Date.parse(result))) fail('invalid-data',path,'expected an ISO 8601 date-time with timezone');
  return result;
}

function stringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.length > LIMITS.ids) fail('invalid-data',path,`expected an array up to ${LIMITS.ids} entries`);
  const result=value.map((item,index)=>id(item,`${path}[${index}]`));
  if (new Set(result).size!==result.length) fail('invalid-data',path,'contains duplicate ids');
  return result;
}

function preferences(value: unknown, path: string): Preferences {
  const item=record(value,path);
  exactKeys(item,['locale','unit','motionPaused'],[],path);
  if (!['en','zh','fr','de','es','ko','ja','it'].includes(String(item.locale))) fail('invalid-data',`${path}.locale`,'unsupported locale');
  if (item.unit!=='ml'&&item.unit!=='oz') fail('invalid-data',`${path}.unit`,'unsupported unit');
  if (typeof item.motionPaused!=='boolean') fail('invalid-data',`${path}.motionPaused`,'expected boolean');
  return {locale:item.locale as Preferences['locale'],unit:item.unit,motionPaused:item.motionPaused};
}

function sections(value: unknown): BackupSections {
  const item=record(value,'backup.sections');
  exactKeys(item,BACKUP_SECTIONS.filter(s=>s!=='making'&&s!=='taste'),['making','taste'],'backup.sections');

  const preferenceSection=record(item.preferences,'backup.sections.preferences');
  exactKeys(preferenceSection,['schemaVersion','value'],[],'backup.sections.preferences');
  if (preferenceSection.schemaVersion!==1) fail('unsupported-version','backup.sections.preferences.schemaVersion','only version 1 is supported');

  const favorites=record(item.favorites,'backup.sections.favorites');
  if(favorites.schemaVersion===1)exactKeys(favorites,['schemaVersion','versionIds'],[],'backup.sections.favorites');
  else if(favorites.schemaVersion===2)exactKeys(favorites,['schemaVersion','versionIds','lists'],[],'backup.sections.favorites');
  else fail('unsupported-version','backup.sections.favorites.schemaVersion','only versions 1 and 2 are supported');
  let favoriteLists:FavoriteList[]|undefined;
  if(favorites.schemaVersion===2){
    try{favoriteLists=validateFavoriteLists(favorites.lists) as typeof favoriteLists;}
    catch(error){fail('invalid-data','backup.sections.favorites.lists',error instanceof Error?error.message:'invalid favorite lists');}
  }

  const pantry=record(item.pantry,'backup.sections.pantry');
  exactKeys(pantry,['schemaVersion','ingredientIds','brandsByIngredient'],[],'backup.sections.pantry');
  if (pantry.schemaVersion!==1) fail('unsupported-version','backup.sections.pantry.schemaVersion','only version 1 is supported');
  const ingredientIds=stringArray(pantry.ingredientIds,'backup.sections.pantry.ingredientIds');
  const ingredientSet=new Set(ingredientIds);
  const rawBrands=record(pantry.brandsByIngredient,'backup.sections.pantry.brandsByIngredient');
  const brandsByIngredient:Record<string,string[]>={};
  if (Object.keys(rawBrands).length>LIMITS.ids) fail('invalid-data','backup.sections.pantry.brandsByIngredient','too many ingredient entries');
  for (const [ingredientId,brandIds] of Object.entries(rawBrands)) {
    id(ingredientId,'backup.sections.pantry.brandsByIngredient key');
    if (!ingredientSet.has(ingredientId)) fail('invalid-data',`backup.sections.pantry.brandsByIngredient.${ingredientId}`,'ingredient is not owned');
    brandsByIngredient[ingredientId]=stringArray(brandIds,`backup.sections.pantry.brandsByIngredient.${ingredientId}`);
  }

  const bottles=record(item.bottles,'backup.sections.bottles');
  exactKeys(bottles,['schemaVersion','ids'],[],'backup.sections.bottles');
  if (bottles.schemaVersion!==1) fail('unsupported-version','backup.sections.bottles.schemaVersion','only version 1 is supported');

  let lab:BackupSections['lab'];
  try { lab=parseLabBackup(JSON.stringify(item.lab)); }
  catch (error) {
    if (error && typeof error==='object' && 'code' in error) fail((error as {code:BackupErrorCode}).code,'backup.sections.lab',
      'message' in error&&typeof error.message==='string'?error.message:'invalid lab backup');
    fail('invalid-data','backup.sections.lab','invalid lab backup');
  }
  let privateRecipes:BackupSections['privateRecipes'];
  try { privateRecipes=validatePrivateRecipeBook(item.privateRecipes); }
  catch (error) { fail('invalid-data','backup.sections.privateRecipes',error instanceof Error?error.message:'invalid private recipe book'); }

  return {
    preferences:{schemaVersion:1,value:preferences(preferenceSection.value,'backup.sections.preferences.value')},
    favorites:favorites.schemaVersion===1
      ?{schemaVersion:1,versionIds:stringArray(favorites.versionIds,'backup.sections.favorites.versionIds')}
      :{schemaVersion:2,versionIds:stringArray(favorites.versionIds,'backup.sections.favorites.versionIds'),lists:favoriteLists!},
    pantry:{schemaVersion:1,ingredientIds,brandsByIngredient},
    bottles:{schemaVersion:1,ids:stringArray(bottles.ids,'backup.sections.bottles.ids')},
    lab,
    privateRecipes,
    ...(item.making===undefined?{}:{making:validateMakingState(item.making)}),
    ...(item.taste===undefined?{}:{taste:validateTasteState(item.taste)}),
  };
}

function optional(value: unknown, path: string, max: number): string|undefined {
  return value===undefined?undefined:text(value,path,max);
}

function reference(value: unknown, path: string): BackupReference {
  const item=record(value,path);
  const optionalKeys=['ingredientId','cocktailId','sourceId','sourceTitle','sourceUrl'] as const;
  exactKeys(item,['kind','id','name'],optionalKeys,path);
  if (typeof item.kind!=='string'||!REFERENCE_KINDS.has(item.kind as ReferenceKind)) fail('invalid-data',`${path}.kind`,'unsupported reference kind');
  const result:BackupReference={kind:item.kind as ReferenceKind,id:id(item.id,`${path}.id`),name:text(item.name,`${path}.name`)};
  for (const key of ['ingredientId','cocktailId','sourceId'] as const) {
    const found=optional(item[key],`${path}.${key}`,LIMITS.id); if(found!==undefined) result[key]=found;
  }
  const sourceTitle=optional(item.sourceTitle,`${path}.sourceTitle`,LIMITS.name); if(sourceTitle!==undefined) result.sourceTitle=sourceTitle;
  const sourceUrl=optional(item.sourceUrl,`${path}.sourceUrl`,LIMITS.url);
  if(sourceUrl!==undefined){if(!/^https?:\/\//i.test(sourceUrl))fail('invalid-data',`${path}.sourceUrl`,'expected http or https URL');result.sourceUrl=sourceUrl;}
  return result;
}

function references(value: unknown): BackupReference[] {
  if(!Array.isArray(value)||value.length>LIMITS.ids)fail('invalid-data','backup.references',`expected an array up to ${LIMITS.ids} entries`);
  const output:BackupReference[]=[];const exact=new Set<string>();
  value.forEach((item,index)=>{const parsed=reference(item,`backup.references[${index}]`);const key=canonicalJson(parsed);if(!exact.has(key)){exact.add(key);output.push(parsed);}});
  return output;
}

export function validatePersonalData(value: unknown): PersonalData {
  rejectUnsafe(value);
  const item=record(value,'backup');
  exactKeys(item,['sections','references'],[],'backup');
  return {sections:sections(item.sections),references:references(item.references)};
}

export function validateFullBackup(value: unknown): FullBackup {
  rejectUnsafe(value);
  const item=record(value,'backup');
  exactKeys(item,['format','schemaVersion','exportedAt','sections','references'],[],'backup');
  if(item.format!=='glass-notes-backup')fail('invalid-format','backup.format','expected glass-notes-backup');
  if(item.schemaVersion!==1&&item.schemaVersion!==2&&item.schemaVersion!==3)fail('unsupported-version','backup.schemaVersion','only versions 1, 2 and 3 are supported');
  const personal=validatePersonalData({sections:item.sections,references:item.references});
  if(item.schemaVersion>=2&&!personal.sections.making)fail('invalid-data','backup.sections.making','missing version 2 section');
  if(item.schemaVersion===1&&personal.sections.making)fail('invalid-data','backup.sections.making','version 1 cannot contain version 2 data');
  if(item.schemaVersion===3&&!personal.sections.taste)fail('invalid-data','backup.sections.taste','missing version 3 section');
  if(item.schemaVersion!==3&&personal.sections.taste)fail('invalid-data','backup.sections.taste','older versions cannot contain taste data');
  return {format:'glass-notes-backup',schemaVersion:item.schemaVersion,exportedAt:date(item.exportedAt,'backup.exportedAt'),...personal};
}

export function parseFullBackup(raw: string): FullBackup {
  if(typeof raw!=='string')fail('invalid-json','backup','expected JSON text');
  if(utf8ByteLength(raw)>BACKUP_LIMIT)fail('invalid-data','backup',`exceeds ${BACKUP_LIMIT} UTF-8 bytes`);
  let value:unknown;try{value=JSON.parse(raw);}catch{fail('invalid-json','backup','invalid JSON');}
  return validateFullBackup(value);
}

export function serializeFullBackup(value: FullBackup): string {
  const raw=JSON.stringify(validateFullBackup(value),null,2);
  if(utf8ByteLength(raw)>BACKUP_LIMIT)fail('invalid-data','backup',`exceeds ${BACKUP_LIMIT} UTF-8 bytes`);
  return raw;
}
