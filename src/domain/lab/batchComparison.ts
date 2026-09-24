import type {LabBatch,LabIngredient,LabVersion} from './types';

export const BATCH_COMPARISON_FIELDS=[
  'recipe-method','recipe-notes','medium','ratio','temperature','startedAt','endedAt',
  'agitation','filtration','yield','outcome','nextStep',
] as const;
export type BatchComparisonField=(typeof BATCH_COMPARISON_FIELDS)[number];

export interface BatchComparisonIngredientRow {
  index:number;
  cells:Array<LabIngredient|null>;
}

export interface BatchComparisonView {
  batches:LabBatch[];
  ingredientRows:BatchComparisonIngredientRow[];
  fields:Array<{field:BatchComparisonField;cells:string[]}>;
}

export interface BatchVersionWriter {
  addVersion:(projectId:string,fromVersionId?:string)=>string;
  updateVersion:(projectId:string,versionId:string,change:Partial<Pick<LabVersion,'name'|'ingredients'|'method'|'notes'>>)=>void;
  deleteVersion:(projectId:string,versionId:string)=>void;
}

export type BatchVersionSeed=Pick<LabVersion,'name'|'ingredients'|'method'|'notes'>;

function isMissingVersion(error:unknown):boolean {
  return error instanceof Error&&'code' in error&&(error as Error&{code?:unknown}).code==='not-found';
}

function cloneBatch(batch:LabBatch):LabBatch {
  return {
    ...batch,
    versionSnapshot:{...batch.versionSnapshot,ingredients:batch.versionSnapshot.ingredients.map(ingredient=>({...ingredient}))},
    observations:batch.observations.map(observation=>({...observation})),
  };
}

function fieldValue(batch:LabBatch,field:BatchComparisonField):string {
  if(field==='recipe-method')return batch.versionSnapshot.method;
  if(field==='recipe-notes')return batch.versionSnapshot.notes;
  return batch[field];
}

/** Build a detached row-major view from the recipe snapshot captured by each batch. */
export function compareLabBatches(batches:readonly LabBatch[]):BatchComparisonView {
  if(batches.length<2||batches.length>3)throw new Error('batch-comparison-count');
  if(new Set(batches.map(batch=>batch.id)).size!==batches.length)throw new Error('batch-comparison-duplicate');
  const detached=batches.map(cloneBatch);
  const maxIngredients=Math.max(...detached.map(batch=>batch.versionSnapshot.ingredients.length));
  const ingredientRows=Array.from({length:maxIngredients},(_,index)=>({
    index,
    cells:detached.map(batch=>batch.versionSnapshot.ingredients[index]?{...batch.versionSnapshot.ingredients[index]!}:null),
  }));
  return {
    batches:detached,
    ingredientRows,
    fields:BATCH_COMPARISON_FIELDS.map(field=>({field,cells:detached.map(batch=>fieldValue(batch,field))})),
  };
}

export function toggleBatchComparisonSelection(selected:readonly string[],batchId:string,availableIds:readonly string[]):string[] {
  const available=new Set(availableIds);
  const stable=selected.filter((id,index)=>available.has(id)&&selected.indexOf(id)===index).slice(0,3);
  if(!available.has(batchId))return stable;
  if(stable.includes(batchId))return stable.filter(id=>id!==batchId);
  return stable.length<3?[...stable,batchId]:stable;
}

/** Copy recipe facts from the immutable batch snapshot; experiment observations remain on the batch. */
export function batchVersionSeed(batch:LabBatch,name:string,sourceNote:string):BatchVersionSeed {
  const cleanName=name.trim();
  const cleanSourceNote=sourceNote.trim();
  if(!cleanName||cleanName.length>500)throw new Error('batch-version-name');
  if(!cleanSourceNote)throw new Error('batch-version-source-note');
  const notes=[batch.versionSnapshot.notes.trim(),cleanSourceNote].filter(Boolean).join('\n\n');
  if(notes.length>50_000)throw new Error('batch-version-notes');
  return {
    name:cleanName,
    ingredients:batch.versionSnapshot.ingredients.map(ingredient=>({...ingredient})),
    method:batch.versionSnapshot.method,
    notes,
  };
}

/**
 * Reuse the existing version creation interface, then replace its editable
 * content with the validated batch snapshot. A synchronous update failure is
 * rolled back so the project does not retain a half-created version.
 */
export function createVersionFromBatch(
  writer:BatchVersionWriter,
  projectId:string,
  batch:LabBatch,
  name:string,
  sourceNote:string,
):string {
  const seed=batchVersionSeed(batch,name,sourceNote);
  let versionId:string;
  try{
    versionId=writer.addVersion(projectId,batch.versionId);
  }catch(error){
    // A retained/imported batch can outlive the editable version it originally
    // referenced. The snapshot remains complete, so start with a blank version
    // and apply that snapshot rather than discarding the experiment.
    if(!isMissingVersion(error))throw error;
    versionId=writer.addVersion(projectId);
  }
  try{
    writer.updateVersion(projectId,versionId,seed);
    return versionId;
  }catch(error){
    try{writer.deleteVersion(projectId,versionId);}catch{}
    throw error;
  }
}
