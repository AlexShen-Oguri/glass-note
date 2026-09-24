import type {Preferences} from '../../platform/preferences';
import type {LabIngredient,LabProject,LabVersion} from '../lab/types';
import type {PrivateIngredient,PrivateRecipe,PrivateRecipeContent,PrivateRecipeOrigin} from '../private-recipes/types';
import {canonicalJson,semanticFingerprint} from './canonical';
import {validateFullBackup,validatePersonalData} from './validation';
import {mergeTaste} from './taste';
import {makingCount,mergeMaking} from './making';
import {favoriteSectionCount,restoreFavorites} from './favorites';
import {
  BACKUP_SECTIONS,
  type BackupConflict,
  type BackupPreviewRow,
  type BackupReference,
  type BackupSection,
  type BackupSections,
  type FullBackup,
  type KnownReferences,
  type PersonalData,
  type PreferenceChange,
  type ReferenceKind,
  type RestoreChoice,
  type RestorePlan,
} from './types';

const PREFERENCE_FIELDS:(keyof Preferences)[]=['locale','unit','motionPaused'];

function union(first:readonly string[],second:readonly string[]):string[]{return [...new Set([...first,...second])];}

function remappedId(prefix:string,index:string,used:Set<string>):string{
  const base=`import-${prefix.slice(0,16)}-${index}`.slice(0,190);
  let candidate=base,suffix=2;
  while(used.has(candidate))candidate=`${base.slice(0,185)}-${suffix++}`;
  used.add(candidate);return candidate;
}

function labSemanticValue(project:LabProject):unknown{
  const versionIds=new Map(project.versions.map((version,index)=>[version.id,`$version:${index}`]));
  const versionRows=new Map<string,Map<string,string>>();
  const versions=project.versions.map((version,versionIndex)=>{
    const rows=new Map(version.ingredients.map((ingredient,index)=>[ingredient.id,`$version:${versionIndex}:ingredient:${index}`]));
    versionRows.set(version.id,rows);
    return {...version,id:`$version:${versionIndex}`,ingredients:version.ingredients.map((ingredient,index)=>({...ingredient,id:`$version:${versionIndex}:ingredient:${index}`}))};
  });
  const batches=project.batches.map((batch,batchIndex)=>{
    const mappedVersion=versionIds.get(batch.versionId)??`$external-version:${batch.versionId}`;
    const rows=versionRows.get(batch.versionId);
    return {...batch,id:`$batch:${batchIndex}`,versionId:mappedVersion,
      versionSnapshot:{...batch.versionSnapshot,id:mappedVersion,ingredients:batch.versionSnapshot.ingredients.map((ingredient,index)=>
        ({...ingredient,id:rows?.get(ingredient.id)??`$batch:${batchIndex}:snapshot-ingredient:${index}`}))},
      observations:batch.observations.map((observation,index)=>({...observation,id:`$batch:${batchIndex}:observation:${index}`}))};
  });
  const source=project.source?{...project.source,ingredients:project.source.ingredients.map((ingredient,index)=>({...ingredient,id:`$source-ingredient:${index}`}))}:undefined;
  return {...project,id:'$project',versions,batches,...(source?{source}:{})};
}

function labSemanticKey(project:LabProject):string{return canonicalJson(labSemanticValue(project));}

function remapLabProject(project:LabProject,used:Set<string>):LabProject{
  const fingerprint=semanticFingerprint(labSemanticValue(project));
  const projectId=remappedId(fingerprint,'project',used);
  const versionIds=new Map<string,string>();
  const rowIds=new Map<string,Map<string,string>>();
  const versions=project.versions.map((version,versionIndex)=>{
    const versionId=remappedId(fingerprint,`version-${versionIndex}`,used);versionIds.set(version.id,versionId);
    const rows=new Map<string,string>();
    const ingredients=version.ingredients.map((ingredient,index)=>{const next=remappedId(fingerprint,`version-${versionIndex}-ingredient-${index}`,used);rows.set(ingredient.id,next);return{...ingredient,id:next};});
    rowIds.set(version.id,rows);return{...version,id:versionId,ingredients};
  });
  const batches=project.batches.map((batch,batchIndex)=>{
    const versionId=versionIds.get(batch.versionId)!;const rows=rowIds.get(batch.versionId);
    return {...batch,id:remappedId(fingerprint,`batch-${batchIndex}`,used),versionId,
      versionSnapshot:{...batch.versionSnapshot,id:versionId,ingredients:batch.versionSnapshot.ingredients.map((ingredient,index)=>
        ({...ingredient,id:rows?.get(ingredient.id)??remappedId(fingerprint,`batch-${batchIndex}-snapshot-ingredient-${index}`,used)}))},
      observations:batch.observations.map((observation,index)=>({...observation,id:remappedId(fingerprint,`batch-${batchIndex}-observation-${index}`,used)}))};
  });
  const source=project.source?{...project.source,ingredients:project.source.ingredients.map((ingredient,index)=>
    ({...ingredient,id:remappedId(fingerprint,`source-ingredient-${index}`,used)}))}:undefined;
  return {...project,id:projectId,versions,batches,...(source?{source}:{})};
}

function normalizedPrivateContent(content:PrivateRecipeContent,prefix:string):PrivateRecipeContent{
  return {...content,ingredients:content.ingredients.map((ingredient,index)=>({...ingredient,id:`${prefix}:ingredient:${index}`}))};
}

function normalizedPrivateOrigin(origin:PrivateRecipeOrigin):PrivateRecipeOrigin{
  if(origin.kind==='original')return origin;
  if(origin.kind==='catalogue-version')return{...origin,snapshot:normalizedPrivateContent(origin.snapshot,'$origin')};
  return{...origin,snapshot:normalizedPrivateContent(origin.snapshot,'$origin'),...(origin.source?{source:{...origin.source,
    ingredients:origin.source.ingredients.map((ingredient,index)=>({...ingredient,id:`$origin:source-ingredient:${index}`}))}}:{})};
}

function privateSemanticValue(recipe:PrivateRecipe):unknown{
  const revisionIds=new Map(recipe.revisions.map((revision,index)=>[revision.id,`$revision:${index}`]));
  return {...recipe,id:'$recipe',origin:normalizedPrivateOrigin(recipe.origin),activeRevisionId:revisionIds.get(recipe.activeRevisionId)??'$missing-active',importedFromId:undefined,
    revisions:recipe.revisions.map((revision,revisionIndex)=>({...revision,id:`$revision:${revisionIndex}`,
      derivedFromRevisionId:revision.derivedFromRevisionId===undefined?undefined:revisionIds.get(revision.derivedFromRevisionId)??`$external-revision:${revision.derivedFromRevisionId}`,
      content:{...revision.content,ingredients:revision.content.ingredients.map((ingredient,index)=>({...ingredient,id:`$revision:${revisionIndex}:ingredient:${index}`}))}}))};
}

function privateSemanticKey(recipe:PrivateRecipe):string{return canonicalJson(privateSemanticValue(recipe));}

function remapPrivateRecipe(recipe:PrivateRecipe,used:Set<string>):PrivateRecipe{
  const fingerprint=semanticFingerprint(privateSemanticValue(recipe));
  const revisionIds=new Map<string,string>();
  const revisions=recipe.revisions.map((revision,revisionIndex)=>{
    const revisionId=remappedId(fingerprint,`revision-${revisionIndex}`,used);revisionIds.set(revision.id,revisionId);
    return {...revision,id:revisionId,content:{...revision.content,ingredients:revision.content.ingredients.map((ingredient,index)=>
      ({...ingredient,id:remappedId(fingerprint,`revision-${revisionIndex}-ingredient-${index}`,used)}))}};
  }).map((revision,index)=>({...revision,...(recipe.revisions[index]!.derivedFromRevisionId===undefined?{derivedFromRevisionId:undefined}:
    {derivedFromRevisionId:revisionIds.get(recipe.revisions[index]!.derivedFromRevisionId!)})}));
  const remapContent=(content:PrivateRecipeContent,prefix:string):PrivateRecipeContent=>({...content,ingredients:content.ingredients.map((ingredient,index)=>
    ({...ingredient,id:remappedId(fingerprint,`${prefix}-ingredient-${index}`,used)}))});
  let origin:PrivateRecipeOrigin=recipe.origin;
  if(recipe.origin.kind==='catalogue-version')origin={...recipe.origin,snapshot:remapContent(recipe.origin.snapshot,'origin')};
  else if(recipe.origin.kind==='lab-version')origin={...recipe.origin,snapshot:remapContent(recipe.origin.snapshot,'origin'),...(recipe.origin.source?{source:{...recipe.origin.source,
    ingredients:recipe.origin.source.ingredients.map((ingredient,index)=>({...ingredient,id:remappedId(fingerprint,`origin-source-ingredient-${index}`,used)}))}}:{})};
  return {...recipe,id:remappedId(fingerprint,'recipe',used),origin,importedFromId:recipe.importedFromId??recipe.id,
    activeRevisionId:revisionIds.get(recipe.activeRevisionId)!,revisions};
}

function labOwnedIds(project:LabProject):string[]{
  const ids=[project.id];project.source?.ingredients.forEach(item=>ids.push(item.id));
  project.versions.forEach(version=>{ids.push(version.id);version.ingredients.forEach(item=>ids.push(item.id));});
  project.batches.forEach(batch=>{ids.push(batch.id);batch.versionSnapshot.ingredients.forEach(item=>ids.push(item.id));batch.observations.forEach(item=>ids.push(item.id));});return ids;
}
function collectLabIds(projects:readonly LabProject[]):Set<string>{
  return new Set(projects.flatMap(labOwnedIds));
}

function privateOwnedIds(recipe:PrivateRecipe):string[]{
  const ids=[recipe.id];recipe.revisions.forEach(revision=>{ids.push(revision.id);revision.content.ingredients.forEach(item=>ids.push(item.id));});
  if(recipe.origin.kind!=='original')recipe.origin.snapshot.ingredients.forEach(item=>ids.push(item.id));if(recipe.origin.kind==='lab-version')recipe.origin.source?.ingredients.forEach(item=>ids.push(item.id));return ids;
}
function collectPrivateIds(recipes:readonly PrivateRecipe[]):Set<string>{
  return new Set(recipes.flatMap(privateOwnedIds));
}

interface ObjectMerge<T>{items:T[];same:number;conflicts:BackupConflict[];matches:Array<{source:T;result:T}>}

function mergeObjects<T extends {id:string}>(section:'lab'|'privateRecipes',current:readonly T[],incoming:readonly T[],
  semantic:(item:T)=>string,ownedIds:(item:T)=>string[],remap:(item:T,used:Set<string>)=>T,used:Set<string>,title:(item:T)=>string):ObjectMerge<T>{
  const items=[...current],bySemantic=new Map(current.map(item=>[semantic(item),item]));let same=0;const conflicts:BackupConflict[]=[];
  const matches:Array<{source:T;result:T}>=[];
  for(const item of incoming){const key=semantic(item),matching=bySemantic.get(key);if(matching){same+=1;matches.push({source:item,result:matching});continue;}
    const collisionId=ownedIds(item).find(id=>used.has(id));const collision=collisionId?items.find(existing=>ownedIds(existing).includes(collisionId)):undefined;const next=collisionId?remap(item,used):item;
    if(!collisionId)ownedIds(item).forEach(id=>used.add(id));else conflicts.push({section,id:collisionId,currentTitle:collision?title(collision):collisionId,incomingTitle:title(item),action:'keep-both'});
    items.push(next);bySemantic.set(key,next);matches.push({source:item,result:next});
  }return{items,same,conflicts,matches};
}

function reconnectPrivateLabOrigin(recipe:PrivateRecipe,matches:Array<{source:LabProject;result:LabProject}>):PrivateRecipe{
  const origin=recipe.origin;if(origin.kind!=='lab-version')return recipe;
  const match=matches.find(item=>item.source.id===origin.projectId);if(!match)return recipe;
  const versionIndex=match.source.versions.findIndex(item=>item.id===origin.versionId);
  const batchIndex=origin.batchId===undefined?-1:match.source.batches.findIndex(item=>item.id===origin.batchId);
  const versionId=versionIndex<0?origin.versionId:match.result.versions[versionIndex]?.id??origin.versionId;
  const batchId=origin.batchId===undefined?undefined:batchIndex<0?origin.batchId:match.result.batches[batchIndex]?.id??origin.batchId;
  return{...recipe,origin:{...origin,projectId:match.result.id,versionId,...(batchId===undefined?{}:{batchId})}};
}

function replaceConflicts<T extends{id:string}>(section:'lab'|'privateRecipes',current:readonly T[],incoming:readonly T[],semantic:(item:T)=>string,title:(item:T)=>string):BackupConflict[]{
  const byId=new Map(current.map(item=>[item.id,item]));const output:BackupConflict[]=[];
  for(const item of incoming){const existing=byId.get(item.id);if(existing&&semantic(existing)!==semantic(item))output.push({section,id:item.id,currentTitle:title(existing),incomingTitle:title(item),action:'replace'});}return output;
}

function pantryCount(value:BackupSections['pantry']):number{return value.ingredientIds.length+Object.values(value.brandsByIngredient).reduce((sum,ids)=>sum+ids.length,0);}
function pantryEntries(value:BackupSections['pantry']):Set<string>{const entries=new Set(value.ingredientIds.map(id=>`ingredient:${id}`));for(const [ingredientId,brands] of Object.entries(value.brandsByIngredient))for(const brand of brands)entries.add(`brand:${ingredientId}:${brand}`);return entries;}
function sectionCount(section:BackupSection,value:BackupSections[BackupSection]):number{
  if(section==='taste')return (value as BackupSections['taste'])?.entries.length??0;
  if(section==='making')return makingCount(value as BackupSections['making']);
  if(section==='preferences')return 3;if(section==='favorites')return favoriteSectionCount(value as BackupSections['favorites']);
  if(section==='pantry')return pantryCount(value as BackupSections['pantry']);if(section==='bottles')return (value as BackupSections['bottles']).ids.length;
  if(section==='lab')return (value as BackupSections['lab']).projects.length;return (value as BackupSections['privateRecipes']).recipes.length;
}

function usedReferences(sections:BackupSections,references:BackupReference[]):Set<string>{
  const used=new Set<string>();const add=(kind:ReferenceKind,id:string|undefined)=>{if(id)used.add(`${kind}\0${id}`);};
  sections.favorites.versionIds.forEach(value=>add('recipeVersion',value));
  if(sections.favorites.schemaVersion===2)for(const list of sections.favorites.lists)for(const item of list.items){
    add('recipeVersion',item.recipe.version.id);add('source',item.recipe.source.id);
    for(const row of item.recipe.version.ingredients){add('ingredient',row.ingredientId);add('brand',row.brandId);}
  }
  sections.pantry.ingredientIds.forEach(value=>add('ingredient',value));Object.values(sections.pantry.brandsByIngredient).flat().forEach(value=>add('brand',value));
  sections.bottles.ids.forEach(value=>add('bottle',value));
  for(const entry of sections.taste?.entries??[]){add('recipeVersion',entry.recipe.version.id);add('source',entry.recipe.source.id);for(const row of entry.recipe.version.ingredients){add('ingredient',row.ingredientId);add('brand',row.brandId);}}
  for(const stock of sections.making?.stock??[]){add('ingredient',stock.ingredientId);add('bottle',stock.bottleId);}
  for(const review of sections.making?.reviews??[])add('recipeVersion',review.versionId);
  for(const session of sections.making?.sessions??[]){add('recipeVersion',session.recipe.version.id);add('source',session.recipe.source.id);
    for(const row of session.recipe.version.ingredients){add('ingredient',row.ingredientId);add('brand',row.brandId);}Object.values(session.assumptions.bottleIds).forEach(id=>add('bottle',id));}
  const ingredient=(item:LabIngredient|PrivateIngredient)=>{add('ingredient',item.ingredientId);add('bottle',item.bottleId);if('brandId'in item)add('brand',item.brandId);};
  for(const project of sections.lab.projects){project.source?.ingredients.forEach(ingredient);if(project.source){add('recipeVersion',project.source.versionId);}
    project.versions.forEach(version=>version.ingredients.forEach(ingredient));project.batches.forEach(batch=>batch.versionSnapshot.ingredients.forEach(ingredient));}
  for(const recipe of sections.privateRecipes.recipes){recipe.revisions.forEach(revision=>revision.content.ingredients.forEach(ingredient));
    if(recipe.origin.kind==='catalogue-version'){add('recipeVersion',recipe.origin.versionId);add('source',recipe.origin.sourceId);}
    if(recipe.origin.kind==='lab-version'&&recipe.origin.source){add('recipeVersion',recipe.origin.source.versionId);recipe.origin.source.ingredients.forEach(ingredient);}}
  let changed=true;while(changed){changed=false;for(const ref of references){if(!used.has(`${ref.kind}\0${ref.id}`))continue;
      const before=used.size;add('ingredient',ref.ingredientId);add('source',ref.sourceId);if(used.size!==before)changed=true;}}
  return used;
}

function mergeReferences(current:BackupReference[],incoming:BackupReference[],sections:BackupSections,incomingSections:BackupSections):{references:BackupReference[];conflicts:BackupConflict[]}{
  const allowedIncoming=usedReferences(incomingSections,incoming);const relevantIncoming=incoming.filter(ref=>allowedIncoming.has(`${ref.kind}\0${ref.id}`));
  const all:BackupReference[]=[];const exact=new Set<string>();for(const ref of [...current,...relevantIncoming]){const key=canonicalJson(ref);if(!exact.has(key)){exact.add(key);all.push(ref);}}
  const used=usedReferences(sections,all);const references=all.filter(ref=>used.has(`${ref.kind}\0${ref.id}`));
  const conflicts:BackupConflict[]=[];const currentGroups=new Map<string,BackupReference[]>();
  current.forEach(ref=>{const key=`${ref.kind}\0${ref.id}`;currentGroups.set(key,[...(currentGroups.get(key)??[]),ref]);});
  const seen=new Set<string>();for(const ref of relevantIncoming){const key=`${ref.kind}\0${ref.id}`;const variants=currentGroups.get(key);if(!variants||!used.has(key)||variants.some(item=>canonicalJson(item)===canonicalJson(ref))||seen.has(key))continue;
    conflicts.push({section:'references',id:`${ref.kind}:${ref.id}`,currentTitle:variants[0]!.name,incomingTitle:ref.name,action:'keep-both'});seen.add(key);}
  return{references,conflicts};
}

export function planRestore(currentValue:PersonalData,incomingValue:FullBackup,choiceValue:RestoreChoice,known?:KnownReferences):RestorePlan{
  const current=validatePersonalData(currentValue),incoming=validateFullBackup(incomingValue);
  if(choiceValue.mode!=='merge'&&choiceValue.mode!=='replace')throw new TypeError('unsupported restore mode');
  const chosen=new Set(choiceValue.sections);for(const section of chosen)if(!BACKUP_SECTIONS.includes(section))throw new TypeError(`unsupported backup section ${section}`);
  // Version 1 has no making data. Absence is never permission to clear current progress.
  if(!incoming.sections.making)chosen.delete('making');
  if(!incoming.sections.taste)chosen.delete('taste');
  const preferenceFields=new Set(choiceValue.preferenceFields);for(const field of preferenceFields)if(!PREFERENCE_FIELDS.includes(field))throw new TypeError(`unsupported preference field ${String(field)}`);
  const next:BackupSections={...current.sections,preferences:{schemaVersion:1,value:{...current.sections.preferences.value}}};
  const preview:BackupPreviewRow[]=[];const conflicts:BackupConflict[]=[];const stats=new Map<BackupSection,{same:number;added:number;conflicts:number;removed?:number}>();
  let labMatches:Array<{source:LabProject;result:LabProject}>=[];

  const preferencesSelected=chosen.has('preferences');const preferenceChanges:PreferenceChange[]=PREFERENCE_FIELDS.map(field=>({field,current:current.sections.preferences.value[field],incoming:incoming.sections.preferences.value[field],
    applied:preferencesSelected&&preferenceFields.has(field)&&current.sections.preferences.value[field]!==incoming.sections.preferences.value[field]}));
  if(preferencesSelected)for(const change of preferenceChanges)if(change.applied)(next.preferences.value as unknown as Record<string,string|boolean>)[change.field]=change.incoming;
  stats.set('preferences',{same:preferenceChanges.filter(change=>change.current===change.incoming).length,added:0,conflicts:preferenceChanges.filter(change=>change.current!==change.incoming).length});

  if(chosen.has('favorites')){const result=restoreFavorites(current.sections.favorites,incoming.sections.favorites,choiceValue.mode);
    next.favorites=result.value;conflicts.push(...result.conflicts);stats.set('favorites',{same:result.same,added:result.added,removed:result.removed,conflicts:result.conflicts.length});
  }else stats.set('favorites',{same:0,added:0,conflicts:0});

  if(chosen.has('bottles')){const currentIds=current.sections.bottles.ids,incomingIds=incoming.sections.bottles.ids;
    const ids=choiceValue.mode==='replace'?[...incomingIds]:union(currentIds,incomingIds);next.bottles={schemaVersion:1,ids};
    stats.set('bottles',{same:incomingIds.filter(id=>currentIds.includes(id)).length,added:ids.filter(id=>!currentIds.includes(id)).length,conflicts:0});
  }else stats.set('bottles',{same:0,added:0,conflicts:0});

  if(chosen.has('pantry')){const a=current.sections.pantry,b=incoming.sections.pantry;if(choiceValue.mode==='replace')next.pantry=b;else{
      const ingredientIds=union(a.ingredientIds,b.ingredientIds),brandsByIngredient:Record<string,string[]>={};
      for(const ingredientId of ingredientIds)brandsByIngredient[ingredientId]=union(a.brandsByIngredient[ingredientId]??[],b.brandsByIngredient[ingredientId]??[]);
      next.pantry={schemaVersion:1,ingredientIds,brandsByIngredient};}
    const currentEntries=pantryEntries(a),incomingEntries=pantryEntries(b);stats.set('pantry',{same:[...incomingEntries].filter(item=>currentEntries.has(item)).length,
      added:[...incomingEntries].filter(item=>!currentEntries.has(item)).length,conflicts:0,removed:[...currentEntries].filter(item=>!incomingEntries.has(item)).length});
  }else stats.set('pantry',{same:0,added:0,conflicts:0});

  if(chosen.has('lab')){const a=current.sections.lab.projects,b=incoming.sections.lab.projects;if(choiceValue.mode==='merge'){
      const result=mergeObjects('lab',a,b,labSemanticKey,labOwnedIds,remapLabProject,collectLabIds(a),item=>item.name);next.lab={...incoming.sections.lab,projects:result.items};labMatches=result.matches;conflicts.push(...result.conflicts);stats.set('lab',{same:result.same,added:result.items.length-a.length,conflicts:result.conflicts.length});
    }else{const found=replaceConflicts('lab',a,b,labSemanticKey,item=>item.name),currentIds=new Map(a.map(item=>[item.id,item])),incomingIds=new Set(b.map(item=>item.id));conflicts.push(...found);next.lab=incoming.sections.lab;labMatches=b.map(item=>({source:item,result:item}));
      stats.set('lab',{same:b.filter(item=>{const old=currentIds.get(item.id);return old!==undefined&&labSemanticKey(old)===labSemanticKey(item);}).length,
        added:b.filter(item=>!currentIds.has(item.id)).length,conflicts:found.length,removed:a.filter(item=>!incomingIds.has(item.id)).length});}
  }else stats.set('lab',{same:0,added:0,conflicts:0});

  if(chosen.has('privateRecipes')){const a=current.sections.privateRecipes.recipes,b=incoming.sections.privateRecipes.recipes.map(recipe=>reconnectPrivateLabOrigin(recipe,labMatches));if(choiceValue.mode==='merge'){
      const result=mergeObjects('privateRecipes',a,b,privateSemanticKey,privateOwnedIds,remapPrivateRecipe,collectPrivateIds(a),item=>item.revisions.find(r=>r.id===item.activeRevisionId)?.content.title??item.id);
      next.privateRecipes={...incoming.sections.privateRecipes,schemaVersion:current.sections.privateRecipes.schemaVersion===2||incoming.sections.privateRecipes.schemaVersion===2?2:1,recipes:result.items};conflicts.push(...result.conflicts);stats.set('privateRecipes',{same:result.same,added:result.items.length-a.length,conflicts:result.conflicts.length});
    }else{const title=(item:PrivateRecipe)=>item.revisions.find(r=>r.id===item.activeRevisionId)?.content.title??item.id;const found=replaceConflicts('privateRecipes',a,b,privateSemanticKey,title),currentIds=new Map(a.map(item=>[item.id,item])),incomingIds=new Set(b.map(item=>item.id));conflicts.push(...found);next.privateRecipes={...incoming.sections.privateRecipes,recipes:b};
      stats.set('privateRecipes',{same:b.filter(item=>{const old=currentIds.get(item.id);return old!==undefined&&privateSemanticKey(old)===privateSemanticKey(item);}).length,
        added:b.filter(item=>!currentIds.has(item.id)).length,conflicts:found.length,removed:a.filter(item=>!incomingIds.has(item.id)).length});}
  }else stats.set('privateRecipes',{same:0,added:0,conflicts:0});

  if(chosen.has('making')&&incoming.sections.making){const result=mergeMaking(current.sections.making,incoming.sections.making,choiceValue.mode);
    next.making=result.value;conflicts.push(...result.conflicts);stats.set('making',{same:result.same,added:result.added,removed:result.removed,conflicts:result.conflicts.length});
  }else stats.set('making',{same:0,added:0,conflicts:0});

  if(chosen.has('taste')&&incoming.sections.taste){const result=mergeTaste(current.sections.taste,incoming.sections.taste,choiceValue.mode);
    next.taste=result.value;conflicts.push(...result.conflicts);stats.set('taste',{same:result.same,added:result.added,removed:result.removed,conflicts:result.conflicts.length});
  }else stats.set('taste',{same:0,added:0,conflicts:0});

  const emptyLab:BackupSections['lab']={format:'glass-notes-lab',schemaVersion:1,exportedAt:incoming.sections.lab.exportedAt,projects:[]};
  const emptyPrivate:BackupSections['privateRecipes']={format:'glass-notes-private-recipes',schemaVersion:1,recipes:[]};
  const incomingReferenceSections:BackupSections={preferences:incoming.sections.preferences,
    favorites:chosen.has('favorites')?incoming.sections.favorites:{schemaVersion:2,versionIds:[],lists:[]},
    pantry:chosen.has('pantry')?incoming.sections.pantry:{schemaVersion:1,ingredientIds:[],brandsByIngredient:{}},
    bottles:chosen.has('bottles')?incoming.sections.bottles:{schemaVersion:1,ids:[]},lab:chosen.has('lab')?incoming.sections.lab:emptyLab,
    privateRecipes:chosen.has('privateRecipes')?incoming.sections.privateRecipes:emptyPrivate,
    ...(chosen.has('taste')&&incoming.sections.taste?{taste:incoming.sections.taste}:{}),
    ...(chosen.has('making')&&incoming.sections.making?{making:incoming.sections.making}:{})};
  const mergedReferences=mergeReferences(current.references,incoming.references,next,incomingReferenceSections);conflicts.push(...mergedReferences.conflicts);
  const personal:PersonalData=validatePersonalData({sections:next,references:mergedReferences.references});
  for(const section of BACKUP_SECTIONS){const selected=chosen.has(section),currentCount=sectionCount(section,current.sections[section]),incomingCount=sectionCount(section,incoming.sections[section]),result=sectionCount(section,next[section]);const stat=stats.get(section)!;
    preview.push({section,current:currentCount,incoming:incomingCount,added:selected?Math.max(0,stat.added):0,same:selected?stat.same:0,conflicts:selected?stat.conflicts:0,
      removed:selected&&choiceValue.mode==='replace'?(stat.removed??(
        section==='bottles'?current.sections.bottles.ids.filter(id=>!incoming.sections.bottles.ids.includes(id)).length:
        section==='lab'?current.sections.lab.projects.filter(item=>!incoming.sections.lab.projects.some(next=>labSemanticKey(next)===labSemanticKey(item))).length:
        section==='privateRecipes'?current.sections.privateRecipes.recipes.filter(item=>!incoming.sections.privateRecipes.recipes.some(next=>privateSemanticKey(next)===privateSemanticKey(item))).length:0)):0,result,selected,
      ...(section==='favorites'&&selected&&incoming.sections.favorites.schemaVersion===1?{notice:'legacy-favorites-lists-preserved' as const}:{})});}
  const unresolved=known===undefined?[]:personal.references.filter(ref=>!known[ref.kind]?.has(ref.id));
  return{next:personal,preview,conflicts,preferenceChanges,unresolved,fingerprint:semanticFingerprint(personal)};
}
