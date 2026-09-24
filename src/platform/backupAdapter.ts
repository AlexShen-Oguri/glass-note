import {catalogue} from '../content/catalogue';
import {bottles} from '../content/bottles';
import type {Locale} from '../domain/contracts';
import {parseLabBackup,utf8ByteLength} from '../domain/lab';
import {parseFavoritesState} from '../domain/favorites';
import {parsePrivateRecipeBook} from '../domain/private-recipes';
import {parseTasteState} from '../domain/taste';
import {parseMakingState} from '../domain/making';
import {BACKUP_LIMIT,validateFullBackup} from '../domain/backup';
import type {BackupReference,FullBackup,KnownReferences,RestoreChoice,RestorePlan} from '../domain/backup/types';
import {resolvePreferences} from './preferences';
import type {RawPersonalData} from './personalStorage';

export const knownBackupReferences:KnownReferences={ingredient:new Set(catalogue.ingredients.map(i=>i.id)),brand:new Set(catalogue.brands.map(i=>i.id)),bottle:new Set(bottles.map(i=>i.id)),recipeVersion:new Set(catalogue.versions.map(i=>i.id)),source:new Set(catalogue.sources.map(i=>i.id))};
function stored(raw:string|null,allowed:string[],fallback:Record<string,unknown>):Record<string,unknown>{
  if(raw===null)return fallback;const value=JSON.parse(raw);if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!allowed.includes(k)))throw Error('invalid-personal-data');return value;
}
export function fullBackupFromRaw(raw:RawPersonalData,locale:Locale,now=new Date().toISOString()):FullBackup{
  const prefs=stored(raw.preferences,['locale','unit','motionPaused'],{});
  let favorites:ReturnType<typeof parseFavoritesState>;
  try{favorites=parseFavoritesState(raw.favorites);}catch(error){throw Error(`invalid-personal-data: ${error instanceof Error?error.message:'invalid favorites'}`);}
  const pantry=stored(raw.pantry,['ingredientIds','brandsByIngredient'],{ingredientIds:[],brandsByIngredient:{}});
  const owned=stored(raw.bottles,['schemaVersion','ids'],{schemaVersion:1,ids:[]});
  if(owned.schemaVersion!==1)throw Error('invalid-personal-data');
  if(prefs.locale!==undefined&&!['en','zh','fr','de','es','ko','ja','it'].includes(prefs.locale as string))throw Error('invalid-personal-data');
  if(prefs.unit!==undefined&&!['ml','oz'].includes(prefs.unit as string))throw Error('invalid-personal-data');
  if(prefs.motionPaused!==undefined&&typeof prefs.motionPaused!=='boolean')throw Error('invalid-personal-data');
  const base=validateFullBackup({format:'glass-notes-backup',schemaVersion:3,exportedAt:now,sections:{
    preferences:{schemaVersion:1,value:resolvePreferences(raw.preferences,[locale])},
    favorites:{schemaVersion:2,versionIds:favorites.versionIds,lists:favorites.lists},pantry:{schemaVersion:1,ingredientIds:pantry.ingredientIds,brandsByIngredient:pantry.brandsByIngredient??{}},
    bottles:{schemaVersion:1,ids:owned.ids},lab:raw.lab===null?{format:'glass-notes-lab',schemaVersion:1,exportedAt:now,projects:[]}:parseLabBackup(raw.lab),privateRecipes:parsePrivateRecipeBook(raw.privateRecipes),
    making:parseMakingState(raw.making),
    taste:parseTasteState(raw.taste),
  },references:raw.references===null?[]:JSON.parse(raw.references)});
  const references:BackupReference[]=[...base.references];
  const add=(ref:BackupReference)=>{if(!references.some(r=>JSON.stringify(r)===JSON.stringify(ref)))references.push(ref);};
  const ingredient=(id:string,name?:string)=>add({kind:'ingredient',id,name:catalogue.ingredients.find(i=>i.id===id)?.name[locale]??name??base.references.find(r=>r.kind==='ingredient'&&r.id===id)?.name??id});
  const source=(id:string)=>{const s=catalogue.sources.find(s=>s.id===id);if(s)add({kind:'source',id,name:s.title,sourceUrl:s.url});};
  const bottle=(id:string,name?:string)=>{const b=bottles.find(b=>b.id===id);add({kind:'bottle',id,name:b?.name??name??base.references.find(r=>r.kind==='bottle'&&r.id===id)?.name??id,...(b?.ingredientIds[0]?{ingredientId:b.ingredientIds[0]}:{})});};
  const row=(i:{name:string;ingredientId?:string;brandId?:string;brandName?:string;bottleId?:string;bottleName?:string})=>{
    if(i.ingredientId)ingredient(i.ingredientId,i.name);
    if(i.brandId)add({kind:'brand',id:i.brandId,name:catalogue.brands.find(b=>b.id===i.brandId)?.name??i.brandName??base.references.find(r=>r.kind==='brand'&&r.id===i.brandId)?.name??i.brandId,...(i.ingredientId?{ingredientId:i.ingredientId}:{})});
    if(i.bottleId)bottle(i.bottleId,i.bottleName);
  };
  const version=(id:string)=>{const v=catalogue.versions.find(v=>v.id===id);const c=catalogue.cocktails.find(c=>c.id===v?.cocktailId);const s=catalogue.sources.find(s=>s.id===v?.sourceId);add({kind:'recipeVersion',id,name:c&&v?`${c.name[locale]} · ${v.label[locale]}`:base.references.find(r=>r.kind==='recipeVersion'&&r.id===id)?.name??id,...(v?{cocktailId:v.cocktailId,sourceId:v.sourceId}:{}),...(s?{sourceTitle:s.title,sourceUrl:s.url}:{})});if(s)source(s.id);};
  for(const id of base.sections.favorites.versionIds)version(id);
  if(base.sections.favorites.schemaVersion===2)for(const list of base.sections.favorites.lists)for(const item of list.items){const r=item.recipe;
    version(r.version.id);add({kind:'recipeVersion',id:r.version.id,name:r.title[locale],cocktailId:r.version.cocktailId,sourceId:r.source.id,sourceTitle:r.source.title,sourceUrl:r.source.url});
    add({kind:'source',id:r.source.id,name:r.source.title,sourceUrl:r.source.url});
    for(const line of r.version.ingredients){ingredient(line.ingredientId,r.ingredientNames[line.ingredientId]?.[locale]);if(line.brandId)row({ingredientId:line.ingredientId,brandId:line.brandId,brandName:r.brandNames[line.brandId],name:r.ingredientNames[line.ingredientId]?.[locale]??line.ingredientId});}
  }
  for(const id of base.sections.pantry.ingredientIds)ingredient(id);
  for(const [ingredientId,ids] of Object.entries(base.sections.pantry.brandsByIngredient))for(const id of ids)add({kind:'brand',id,name:catalogue.brands.find(b=>b.id===id)?.name??base.references.find(r=>r.kind==='brand'&&r.id===id)?.name??id,ingredientId});
  for(const id of base.sections.bottles.ids)bottle(id);
  for(const stock of base.sections.making?.stock??[]){ingredient(stock.ingredientId);if(stock.bottleId)bottle(stock.bottleId);}
  for(const review of base.sections.making?.reviews??[])version(review.versionId);
  for(const session of base.sections.making?.sessions??[]){const r=session.recipe;version(r.version.id);add({kind:'recipeVersion',id:r.version.id,name:r.title[locale],cocktailId:r.version.cocktailId,sourceId:r.source.id,sourceTitle:r.source.title,sourceUrl:r.source.url});add({kind:'source',id:r.source.id,name:r.source.title,sourceUrl:r.source.url});
    for(const line of r.version.ingredients){ingredient(line.ingredientId,r.ingredientNames[line.ingredientId]?.[locale]);if(line.brandId)row({ingredientId:line.ingredientId,brandId:line.brandId,brandName:r.brandNames[line.brandId],name:r.ingredientNames[line.ingredientId]?.[locale]??line.ingredientId});}
    Object.values(session.assumptions.bottleIds).forEach(id=>bottle(id));}
  for(const entry of base.sections.taste?.entries??[]){const r=entry.recipe;version(r.version.id);add({kind:'recipeVersion',id:r.version.id,name:r.title[locale],cocktailId:r.version.cocktailId,sourceId:r.source.id,sourceTitle:r.source.title,sourceUrl:r.source.url});add({kind:'source',id:r.source.id,name:r.source.title,sourceUrl:r.source.url});for(const line of r.version.ingredients){ingredient(line.ingredientId,r.ingredientNames[line.ingredientId]?.[locale]);if(line.brandId)row({ingredientId:line.ingredientId,brandId:line.brandId,brandName:r.brandNames[line.brandId],name:r.ingredientNames[line.ingredientId]?.[locale]??line.ingredientId});}}
  const labSource=(s:{versionId:string;cocktailId:string;title:string;sourceTitle:string;url:string;ingredients:{name:string;ingredientId?:string;bottleId?:string;bottleName?:string}[]})=>{version(s.versionId);add({kind:'recipeVersion',id:s.versionId,name:s.title,cocktailId:s.cocktailId,sourceTitle:s.sourceTitle,sourceUrl:s.url});s.ingredients.forEach(row);};
  for(const project of base.sections.lab.projects){if(project.source)labSource(project.source);for(const v of project.versions)v.ingredients.forEach(row);for(const batch of project.batches)batch.versionSnapshot.ingredients.forEach(row);}
  for(const recipe of base.sections.privateRecipes.recipes){
    const origin=recipe.origin;
    if(origin.kind==='catalogue-version'){version(origin.versionId);add({kind:'recipeVersion',id:origin.versionId,name:origin.snapshot.title,cocktailId:origin.cocktailId,sourceId:origin.sourceId,sourceTitle:origin.sourceTitle,sourceUrl:origin.sourceUrl});add({kind:'source',id:origin.sourceId,name:origin.sourceTitle,sourceUrl:origin.sourceUrl});}
    if(origin.kind==='lab-version'&&origin.source)labSource(origin.source);
    if(origin.kind!=='original')origin.snapshot.ingredients.forEach(row);
    for(const revision of recipe.revisions)revision.content.ingredients.forEach(row);
  }
  return validateFullBackup({...base,references});
}
export function rawAfterRestore(before:RawPersonalData,plan:RestorePlan,choice:RestoreChoice):Partial<RawPersonalData>{
  const after:Partial<RawPersonalData>={};const sections=plan.next.sections;
  for(const section of choice.sections){
    if(!plan.preview.some(row=>row.section===section&&row.selected))continue;
    let value:string;
    if(section==='preferences'){if(!choice.preferenceFields.length)continue;value=JSON.stringify(sections.preferences.value);}
    else if(section==='favorites'){
      const lists=sections.favorites.schemaVersion===2?sections.favorites.lists:[];
      value=JSON.stringify({version:2,versionIds:sections.favorites.versionIds,lists});
      if(utf8ByteLength(value)>BACKUP_LIMIT)throw Error(`favorites exceeds ${BACKUP_LIMIT} UTF-8 bytes`);
      parseFavoritesState(value);
    }
    else if(section==='pantry')value=JSON.stringify({ingredientIds:sections.pantry.ingredientIds,brandsByIngredient:sections.pantry.brandsByIngredient});
    else value=JSON.stringify(sections[section]);
    if(value!==before[section])after[section]=value;
  }
  const references=JSON.stringify(plan.next.references);if(references!==before.references)after.references=references;
  return after;
}
