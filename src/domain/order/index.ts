import type {Bottle} from '../bottles/types';
import {bottleDisplayName} from '../bottles/format';
import {LOCALES,type Flavour,type Locale,type MeasureUnit,type Strength,type UnitPreference} from '../contracts';
import {recipeFingerprint,rowId,type MakingRecipe} from '../making';
import {formatAmount} from '../search';
import {
  OrderCardError,
  type OrderBottleChoice,
  type OrderCard,
  type OrderCardFormatCopy,
  type OrderCardInput,
  type OrderIngredientRow,
} from './types';

export * from './types';

const MAX_TEXT=20_000;
const UNSAFE_KEYS=new Set(['__proto__','prototype','constructor']);

export function buildOrderCard(recipeValue:MakingRecipe,bottles:readonly Bottle[],inputValue:OrderCardInput):OrderCard{
  rejectUnsafeKeys(recipeValue,'recipe');rejectUnsafeKeys(bottles,'bottles');rejectUnsafeKeys(inputValue,'input');
  try{recipeFingerprint(recipeValue);}catch(error){throw new OrderCardError('invalid-recipe',message(error));}
  const recipe=clone(recipeValue),input=parseInput(inputValue);
  if(!recipe.version.sourceChecked||recipe.version.sourceId!==recipe.source.id||!/^https?:\/\//i.test(recipe.source.url))throw new OrderCardError('unverified-source','order card requires an exact verified public source');
  const rowsById=new Map(recipe.version.ingredients.map((_,index)=>[rowId(recipe,index),index]));
  for(const id of [...Object.keys(input.bottleIdsByRow),...Object.keys(input.modificationsByRow)])if(!rowsById.has(id))throw new OrderCardError('unknown-row',`unknown recipe row: ${id}`);
  const bottlesById=firstById(bottles);
  const originalAvailable=Boolean(recipe.version.originalSteps?.length);
  const actualOriginal=input.textMode==='original'&&originalAvailable;
  const textLocale=actualOriginal?recipe.version.originalLanguage:input.locale;
  const rows=recipe.version.ingredients.map((sourceRow,index):OrderIngredientRow=>{
    const id=rowId(recipe,index),bottleId=input.bottleIdsByRow[id],explicitModification=input.modificationsByRow[id];
    let selectedBottle:OrderBottleChoice|undefined,brandSubstitution=false;
    if(bottleId!==undefined){
      const bottle=bottlesById.get(bottleId);
      if(!bottle)throw new OrderCardError('unknown-bottle',`unknown bottle: ${bottleId}`);
      validateBottleChoice(bottle);
      if(!bottle.ingredientIds.includes(sourceRow.ingredientId))throw new OrderCardError('incompatible-bottle',`bottle ${bottleId} does not match ${sourceRow.ingredientId}`);
      selectedBottle={id:bottle.id,brandId:bottle.brandId,brandName:bottle.brandName,name:bottle.name,
        displayName:bottleDisplayName(bottle,input.textMode==='original'?undefined:input.locale)};
      brandSubstitution=sourceRow.brandId!==undefined&&sourceRow.brandId!==bottle.brandId;
    }
    const display=formatAmount(sourceRow.amount,sourceRow.unit,input.unitPreference);
    const modificationKinds:OrderIngredientRow['modificationKinds']=[];
    if(brandSubstitution)modificationKinds.push('brand-substitution');
    if(explicitModification!==undefined)modificationKinds.push('explicit');
    return{
      rowId:id,ingredientId:sourceRow.ingredientId,ingredientName:recipe.ingredientNames[sourceRow.ingredientId]![textLocale],amount:display.amount,unit:display.unit,optional:sourceRow.optional===true,
      ...(sourceRow.note?{sourceNote:sourceRow.note[textLocale]}:{}),
      ...(sourceRow.brandId?{sourceBrandName:recipe.brandNames[sourceRow.brandId]!}:{}),
      ...(selectedBottle?{selectedBottle}:{}),
      ...(explicitModification!==undefined?{explicitModification}:{}),
      modificationKinds,
    };
  });
  return{
    cocktailId:recipe.version.cocktailId,versionId:recipe.version.id,sourceId:recipe.source.id,sourceTitle:recipe.source.title,sourceUrl:recipe.source.url,
    locale:input.locale,textLocale,requestedOriginal:input.textMode==='original',originalAvailable,actualOriginal,
    title:recipe.title[textLocale],versionTitle:recipe.version.label[textLocale],servings:recipe.version.servings,rows,
    steps:actualOriginal?[...recipe.version.originalSteps!]:[...recipe.version.steps[textLocale]],glass:recipe.version.glass[textLocale],garnish:recipe.version.garnish[textLocale],
    flavours:[...recipe.version.flavours],strength:recipe.version.strength,profileBasis:recipe.version.profileBasis,profileNote:recipe.version.profileNote[textLocale],
    sourceChecked:true,translationStatus:recipe.version.translationStatus,abv:null,
    originalTitle:recipe.title[recipe.version.originalLanguage],
  };
}

export function formatOrderCard(card:OrderCard,copy:OrderCardFormatCopy):string{
  const lines=[card.title,`${copy.servings}: ${card.servings}`];
  if(card.actualOriginal)lines.push(copy.original);
  lines.push('',copy.ingredients);
  for(const row of card.rows){
    const amount=row.amount?`${row.amount} ${copy.formatUnit(row.unit)}`:copy.formatUnit(row.unit);
    lines.push(`• ${amount} · ${row.ingredientName}${row.optional?` · ${copy.optional}`:''}`);
    if(row.sourceBrandName)lines.push(`  ${copy.sourceBrand}: ${row.sourceBrandName}`);
    if(row.selectedBottle){
      const original=bottleDisplayName(row.selectedBottle);
      const name=card.requestedOriginal?original:row.selectedBottle.displayName||original;
      lines.push(`  ${copy.bottle}: ${name}${name===original?'':` (${original})`}`);
    }
    if(row.modificationKinds.includes('brand-substitution'))lines.push(`  ${copy.modification}: ${copy.brandSubstitution}`);
    if(row.explicitModification)lines.push(`  ${copy.modification}: ${row.explicitModification}`);
    if(row.sourceNote)lines.push(`  ${row.sourceNote}`);
  }
  lines.push('',copy.steps,...card.steps.map((step,index)=>`${index+1}. ${step}`),'',`${copy.glass}: ${card.glass}`,`${copy.garnish}: ${card.garnish}`);
  lines.push(`${copy.flavours}: ${card.flavours.length?card.flavours.map(copy.formatFlavour).join(', '):copy.unknown}`);
  lines.push(`${copy.strength}: ${card.strength===null?copy.unknown:copy.formatStrength(card.strength)}`,`${copy.profile}: ${card.profileNote}`,`${copy.profileBasis}: ${card.profileBasis==='source'?copy.sourceProfile:copy.editorialProfile}`,`${copy.translationStatus}: ${card.translationStatus==='reviewed'?copy.reviewed:copy.draft}`,`${copy.abv}: ${copy.unknown}`);
  return lines.join('\n');
}

export interface OrderSimpleFormatCopy {
  originalName:string;
  ingredients:string;
  requests:string;
  optional:string;
  brand:string;
  modification:string;
  sourceBrand:string;
  source:string;
  sourceVersion:string;
}

const SIMPLE_DEFAULT_COPY:OrderSimpleFormatCopy={
  originalName:'Original name',ingredients:'Ingredients',requests:'Your request',optional:'optional',brand:'Bottle',modification:'Modification',sourceBrand:'Source brand',source:'Source',sourceVersion:'Version',
};

export function orderCardOriginalTitle(card:OrderCard):string|undefined{
  const original=card.originalTitle;
  return original&&original!==card.title?original:undefined;
}

/**
 * Format the small, human-facing card used for ordering. The full formatter
 * above remains the source of truth for recipe details and diagnostics. This
 * view deliberately omits amounts, steps, private data, and technical fields.
 */
export function formatSimpleOrderCard(card:OrderCard,copyValue:Partial<OrderSimpleFormatCopy>={}):string{
  const copy={...SIMPLE_DEFAULT_COPY,...copyValue};
  const rows=card.rows.filter(row=>!row.optional||row.selectedBottle||row.explicitModification);
  const requiredRows=rows.filter(row=>!row.optional);
  const requestedRows=rows.filter(row=>row.selectedBottle||row.explicitModification);
  const lines=[card.title,'',copy.ingredients];
  const originalTitle=orderCardOriginalTitle(card);
  if(originalTitle)lines.splice(1,0,`${copy.originalName}: ${originalTitle}`);
  for(const row of requiredRows)lines.push(`• ${row.ingredientName}${row.sourceBrandName?` (${copy.sourceBrand}: ${row.sourceBrandName})`:''}`);
  if(requestedRows.length){
    lines.push('',copy.requests);
    for(const row of requestedRows){
      if(row.selectedBottle)lines.push(`• ${copy.brand}: ${bottleDisplayName(row.selectedBottle)}`);
      if(row.explicitModification)lines.push(`• ${copy.modification}: ${row.ingredientName}: ${row.explicitModification}`);
      if(row.optional)lines[lines.length-1]=`${lines[lines.length-1]} (${copy.optional})`;
    }
  }
  return lines.join('\n');
}

function parseInput(value:unknown):OrderCardInput{
  const item=object(value,'input');exactKeys(item,['locale','textMode','unitPreference','bottleIdsByRow','modificationsByRow'],'input');
  if(!LOCALES.includes(item.locale as Locale))throw new OrderCardError('invalid-input','input.locale is unsupported');
  if(item.textMode!=='localized'&&item.textMode!=='original')throw new OrderCardError('invalid-input','input.textMode is unsupported');
  if(item.unitPreference!=='ml'&&item.unitPreference!=='oz')throw new OrderCardError('invalid-input','input.unitPreference is unsupported');
  return{locale:item.locale as Locale,textMode:item.textMode,bottleIdsByRow:stringMap(item.bottleIdsByRow,'input.bottleIdsByRow'),modificationsByRow:stringMap(item.modificationsByRow,'input.modificationsByRow',true),unitPreference:item.unitPreference as UnitPreference};
}
function stringMap(value:unknown,path:string,omitBlank=false):Record<string,string>{
  const source=object(value,path),result:Record<string,string>=Object.create(null) as Record<string,string>;
  if(Object.keys(source).length>5_000)throw new OrderCardError('invalid-input',`${path} has too many values`);
  for(const [key,item] of Object.entries(source)){
    if(UNSAFE_KEYS.has(key)||key.length===0||key.length>400)throw new OrderCardError('invalid-input',`${path} has an invalid key`);
    if(typeof item!=='string'||item.length>MAX_TEXT)throw new OrderCardError('invalid-input',`${path}.${key} is invalid`);
    if(omitBlank&&item.trim().length===0)continue;
    if(item.trim().length===0)throw new OrderCardError('invalid-input',`${path}.${key} is invalid`);
    result[key]=item.trim();
  }
  return result;
}
function object(value:unknown,path:string):Record<string,unknown>{
  if(!value||typeof value!=='object'||Array.isArray(value))throw new OrderCardError('invalid-input',`${path} must be an object`);
  const prototype=Object.getPrototypeOf(value);if(prototype!==Object.prototype&&prototype!==null)throw new OrderCardError('invalid-input',`${path} has an unsupported prototype`);
  return value as Record<string,unknown>;
}
function exactKeys(value:Record<string,unknown>,required:readonly string[],path:string):void{
  const allowed=new Set(required);
  for(const key of required)if(!Object.prototype.hasOwnProperty.call(value,key))throw new OrderCardError('invalid-input',`${path} is missing ${key}`);
  for(const key of Object.keys(value))if(!allowed.has(key))throw new OrderCardError('invalid-input',`${path} has unsupported ${key}`);
}
function rejectUnsafeKeys(value:unknown,path:string,seen=new Set<object>()):void{
  if(!value||typeof value!=='object')return;if(seen.has(value))throw new OrderCardError('invalid-input',`${path} is cyclic`);seen.add(value);
  if(Array.isArray(value))value.forEach((item,index)=>rejectUnsafeKeys(item,`${path}[${index}]`,seen));
  else for(const [key,item] of Object.entries(value as Record<string,unknown>)){if(UNSAFE_KEYS.has(key))throw new OrderCardError('invalid-input',`${path} has unsafe key ${key}`);rejectUnsafeKeys(item,`${path}.${key}`,seen);}seen.delete(value);
}
function firstById(items:readonly Bottle[]):Map<string,Bottle>{
  if(!Array.isArray(items)||items.length>10_000)throw new OrderCardError('invalid-input','bottles is invalid');
  const result=new Map<string,Bottle>();for(const item of items){
    if(typeof item?.id!=='string'||item.id.trim().length===0||item.id.length>400)throw new OrderCardError('invalid-input','bottle id is invalid');
    if(result.has(item.id))throw new OrderCardError('invalid-input',`duplicate bottle id: ${item.id}`);result.set(item.id,item);
  }return result;
}
function validateBottleChoice(bottle:Bottle):void{
  for(const [field,value] of [['brandId',bottle.brandId],['brandName',bottle.brandName],['name',bottle.name]] as const)if(typeof value!=='string'||value.trim().length===0||value.length>2_000)throw new OrderCardError('invalid-input',`bottle ${field} is invalid`);
  if(!Array.isArray(bottle.ingredientIds)||bottle.ingredientIds.length===0||bottle.ingredientIds.length>5_000||bottle.ingredientIds.some(id=>typeof id!=='string'||id.trim().length===0||id.length>400))throw new OrderCardError('invalid-input','bottle ingredientIds is invalid');
}
function clone<T>(value:T):T{return JSON.parse(JSON.stringify(value)) as T;}
function message(error:unknown):string{return error instanceof Error?error.message:String(error);}
