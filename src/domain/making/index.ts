import {semanticFingerprint,canonicalJson} from '../backup/canonical';
import type {Bottle} from '../bottles/types';
import type {
  Approachability,
  Catalogue,
  Flavour,
  Localized,
  MeasureUnit,
  RecipeIngredient,
  RecipeVersion,
  Source,
  Strength,
  Taste,
} from '../contracts';
import {LOCALES} from '../contracts';
import {getRecipePreparation} from '../preparations';
import type {PreparationCard,RecipePreparation} from '../preparations/types';
import {
  emptyMakingState,
  type AbvResult,
  type ConsumptionPlan,
  type FeasibilityIssue,
  type MakingAssumptions,
  type MakingContext,
  type MakingRecipe,
  type MakingSession,
  type MakingState,
  type ReadinessReview,
  type RestockSuggestion,
  type RowAvailability,
  type ScaledRow,
  type StockEntry,
  type StockUnit,
  type VersionAvailability,
} from './types';

export * from './types';

const ML_PER_OZ=29.5735295625;
const MAX_TEXT=20_000;
const MAX_ID=200;
const MAX_ROWS=5_000;
const MAX_SESSIONS=5_000;
const MEASURE_UNITS=new Set<MeasureUnit>(['ml','oz','g','tsp','tbsp','pinch','bunch','barspoon','dash','drop','spray','piece','top','part']);
const STOCK_UNITS=new Set<StockUnit>(['ml','oz','g','piece']);
const FLAVOURS=new Set<Flavour>(['citrus','fruit','floral','herbal','spice','coffee']);
const TASTES=new Set<Taste>(['sour','sweet','bitter','dry','creamy','refreshing']);
const STRENGTHS=new Set<Strength>(['none','low','medium','strong']);
const APPROACHABILITY=new Set<Approachability>(['gentle','balanced','bold']);
const ISSUE_ORDER:FeasibilityIssue[]=['missing','insufficient','quantity-unknown','unit-incompatible','brand-unconfirmed','bottle-unconfirmed','preparation-gap','preparation-unconfirmed','tools-unconfirmed','unknown-ingredient','amount-unknown'];

function copy<T>(value:T):T{return JSON.parse(JSON.stringify(value)) as T;}
function unique<T>(values:readonly T[]):T[]{return [...new Set(values)];}
function utf8ByteLength(value:string):number{
  let bytes=0;for(let index=0;index<value.length;index++){const point=value.charCodeAt(index);if(point<=0x7f)bytes+=1;else if(point<=0x7ff)bytes+=2;
    else if(point>=0xd800&&point<=0xdbff&&index+1<value.length&&value.charCodeAt(index+1)>=0xdc00&&value.charCodeAt(index+1)<=0xdfff){bytes+=4;index++;}else bytes+=3;}
  return bytes;
}
function finite(value:unknown,min=Number.NEGATIVE_INFINITY,max=Number.POSITIVE_INFINITY):value is number{
  return typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max;
}
function object(value:unknown,path:string):Record<string,unknown>{
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error(`${path}: expected object`);
  return value as Record<string,unknown>;
}
function exactKeys(value:Record<string,unknown>,required:readonly string[],optional:readonly string[],path:string):void{
  const allowed=new Set([...required,...optional]);
  for(const key of required)if(!Object.prototype.hasOwnProperty.call(value,key))throw Error(`${path}: missing ${key}`);
  for(const key of Object.keys(value))if(!allowed.has(key))throw Error(`${path}: unsupported ${key}`);
}
function text(value:unknown,path:string,{empty=false,max=MAX_TEXT}:{empty?:boolean;max?:number}={}):string{
  if(typeof value!=='string'||value.length>max||(!empty&&value.trim().length===0))throw Error(`${path}: invalid text`);
  return value;
}
function identifier(value:unknown,path:string):string{return text(value,path,{max:MAX_ID});}
function boolean(value:unknown,path:string):boolean{if(typeof value!=='boolean')throw Error(`${path}: expected boolean`);return value;}
function date(value:unknown,path:string):string{
  const result=text(value,path,{max:100});
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(result)||!Number.isFinite(Date.parse(result)))throw Error(`${path}: invalid date`);
  return result;
}
function checkedDate(value:unknown,path:string):string{
  const result=text(value,path,{max:100});
  if(/^\d{4}-\d{2}-\d{2}$/.test(result)){if(!Number.isFinite(Date.parse(`${result}T00:00:00Z`)))throw Error(`${path}: invalid checked date`);return result;}
  return date(result,path);
}
function httpUrl(value:unknown,path:string):string{
  const result=text(value,path,{max:4096});if(!/^https?:\/\//i.test(result))throw Error(`${path}: expected http or https URL`);return result;
}
function number(value:unknown,path:string,min:number,max:number,integer=false):number{
  if(!finite(value,min,max)||(integer&&!Number.isInteger(value)))throw Error(`${path}: invalid number`);
  return value;
}
function localized(value:unknown,path:string):Localized{
  const item=object(value,path);exactKeys(item,LOCALES,[],path);
  return Object.fromEntries(LOCALES.map(locale=>[locale,text(item[locale],`${path}.${locale}`)])) as unknown as Localized;
}
function stringArray(value:unknown,path:string,{max=MAX_ROWS,empty=false,uniqueValues=false}:{max?:number;empty?:boolean;uniqueValues?:boolean}={}):string[]{
  if(!Array.isArray(value)||value.length>max)throw Error(`${path}: invalid array`);
  const result=value.map((item,index)=>text(item,`${path}[${index}]`,{empty}));
  if(uniqueValues&&new Set(result).size!==result.length)throw Error(`${path}: duplicate value`);
  return result;
}
function localizedArray(value:unknown,path:string):Localized[]{
  if(!Array.isArray(value)||value.length>MAX_ROWS)throw Error(`${path}: invalid array`);
  return value.map((item,index)=>localized(item,`${path}[${index}]`));
}
function sourceValue(value:unknown,path:string):Source{
  const item=object(value,path);exactKeys(item,['id','title','url','checkedAt'],['author','book'],path);
  const result:Source={id:identifier(item.id,`${path}.id`),title:text(item.title,`${path}.title`),url:httpUrl(item.url,`${path}.url`),checkedAt:checkedDate(item.checkedAt,`${path}.checkedAt`)};
  if(item.author!==undefined)result.author=text(item.author,`${path}.author`);
  if(item.book!==undefined)result.book=text(item.book,`${path}.book`);
  return result;
}
function recipeIngredientValue(value:unknown,path:string):RecipeIngredient{
  const item=object(value,path);exactKeys(item,['ingredientId','amount','unit'],['note','optional','brandId'],path);
  const unit=text(item.unit,`${path}.unit`) as MeasureUnit;if(!MEASURE_UNITS.has(unit))throw Error(`${path}.unit: unsupported`);
  const amount=item.amount===null?null:number(item.amount,`${path}.amount`,Number.MIN_VALUE,1_000_000);
  const result:RecipeIngredient={ingredientId:identifier(item.ingredientId,`${path}.ingredientId`),amount,unit};
  if(item.note!==undefined)result.note=localized(item.note,`${path}.note`);
  if(item.optional!==undefined)result.optional=boolean(item.optional,`${path}.optional`);
  if(item.brandId!==undefined)result.brandId=identifier(item.brandId,`${path}.brandId`);
  return result;
}
function recipeVersionValue(value:unknown,path:string):RecipeVersion{
  const item=object(value,path);exactKeys(item,['id','cocktailId','label','sourceId','servings','ingredients','steps','originalLanguage','glass','garnish','flavours','tastes','strength','approachability','profileBasis','profileNote','sourceChecked','translationStatus'],['originalSteps','bar'],path);
  if(!Array.isArray(item.ingredients)||!item.ingredients.length||item.ingredients.length>MAX_ROWS)throw Error(`${path}.ingredients: invalid array`);
  const stepsObject=object(item.steps,`${path}.steps`);exactKeys(stepsObject,LOCALES,[],`${path}.steps`);
  const steps=Object.fromEntries(LOCALES.map(locale=>[locale,stringArray(stepsObject[locale],`${path}.steps.${locale}`,{max:1_000})])) as Record<(typeof LOCALES)[number],string[]>;
  for(const locale of LOCALES)if(!steps[locale].length)throw Error(`${path}.steps.${locale}: empty`);
  if(!LOCALES.includes(item.originalLanguage as never))throw Error(`${path}.originalLanguage: unsupported`);
  if(!Array.isArray(item.flavours)||item.flavours.some(value=>!FLAVOURS.has(value as Flavour)))throw Error(`${path}.flavours: unsupported`);
  if(!Array.isArray(item.tastes)||item.tastes.some(value=>!TASTES.has(value as Taste)))throw Error(`${path}.tastes: unsupported`);
  if(item.strength!==null&&!STRENGTHS.has(item.strength as Strength))throw Error(`${path}.strength: unsupported`);
  if(item.approachability!==null&&!APPROACHABILITY.has(item.approachability as Approachability))throw Error(`${path}.approachability: unsupported`);
  if(item.profileBasis!=='editorial'&&item.profileBasis!=='source')throw Error(`${path}.profileBasis: unsupported`);
  if(item.translationStatus!=='draft'&&item.translationStatus!=='reviewed')throw Error(`${path}.translationStatus: unsupported`);
  const result:RecipeVersion={
    id:identifier(item.id,`${path}.id`),cocktailId:identifier(item.cocktailId,`${path}.cocktailId`),label:localized(item.label,`${path}.label`),sourceId:identifier(item.sourceId,`${path}.sourceId`),
    servings:number(item.servings,`${path}.servings`,1,1_000,true),ingredients:item.ingredients.map((row,index)=>recipeIngredientValue(row,`${path}.ingredients[${index}]`)),steps,
    originalLanguage:item.originalLanguage as RecipeVersion['originalLanguage'],glass:localized(item.glass,`${path}.glass`),garnish:localized(item.garnish,`${path}.garnish`),
    flavours:[...(item.flavours as Flavour[])],tastes:[...(item.tastes as Taste[])],strength:item.strength as Strength|null,approachability:item.approachability as Approachability|null,
    profileBasis:item.profileBasis,profileNote:localized(item.profileNote,`${path}.profileNote`),sourceChecked:boolean(item.sourceChecked,`${path}.sourceChecked`),translationStatus:item.translationStatus,
  };
  if(item.originalSteps!==undefined)result.originalSteps=stringArray(item.originalSteps,`${path}.originalSteps`,{max:1_000});
  if(item.bar!==undefined){const bar=object(item.bar,`${path}.bar`);exactKeys(bar,['name','address'],['url'],`${path}.bar`);result.bar={name:text(bar.name,`${path}.bar.name`),address:text(bar.address,`${path}.bar.address`),...(bar.url===undefined?{}:{url:httpUrl(bar.url,`${path}.bar.url`)})};}
  return result;
}
function preparationSource(value:unknown,path:string):{title:string;url:string}{
  const item=object(value,path);exactKeys(item,['title','url'],[],path);return{title:text(item.title,`${path}.title`),url:httpUrl(item.url,`${path}.url`)};
}
function preparationCardValue(value:unknown,path:string):PreparationCard{
  const item=object(value,path);exactKeys(item,['id','title','role','status','inputs','steps','gaps','sources'],['ingredientId','equipment','timing','temperature','yield'],path);
  if(item.role!=='prepared-ingredient'&&item.role!=='process')throw Error(`${path}.role: unsupported`);
  if(!['disclosed','partial','undisclosed'].includes(String(item.status)))throw Error(`${path}.status: unsupported`);
  if(!Array.isArray(item.sources)||item.sources.length>1_000)throw Error(`${path}.sources: invalid`);
  const result:PreparationCard={id:identifier(item.id,`${path}.id`),title:localized(item.title,`${path}.title`),role:item.role,status:item.status as PreparationCard['status'],inputs:localizedArray(item.inputs,`${path}.inputs`),steps:localizedArray(item.steps,`${path}.steps`),gaps:localizedArray(item.gaps,`${path}.gaps`),sources:item.sources.map((source,index)=>preparationSource(source,`${path}.sources[${index}]`))};
  if(item.ingredientId!==undefined)result.ingredientId=identifier(item.ingredientId,`${path}.ingredientId`);
  for(const key of ['equipment','timing','temperature','yield'] as const)if(item[key]!==undefined)result[key]=localized(item[key],`${path}.${key}`);
  return result;
}
function preparationValue(value:unknown,path:string):RecipePreparation{
  const item=object(value,path);exactKeys(item,['versionId','status','summary','gaps','cards','checkedAt'],[],path);
  if(!['disclosed','partial','inspiration'].includes(String(item.status)))throw Error(`${path}.status: unsupported`);
  if(!Array.isArray(item.cards)||item.cards.length>MAX_ROWS)throw Error(`${path}.cards: invalid`);
  const cards=item.cards.map((card,index)=>preparationCardValue(card,`${path}.cards[${index}]`));
  if(new Set(cards.map(card=>card.id)).size!==cards.length)throw Error(`${path}.cards: duplicate id`);
  return{versionId:identifier(item.versionId,`${path}.versionId`),status:item.status as RecipePreparation['status'],summary:localized(item.summary,`${path}.summary`),gaps:localizedArray(item.gaps,`${path}.gaps`),cards,checkedAt:checkedDate(item.checkedAt,`${path}.checkedAt`)};
}
function makingRecipeValue(value:unknown,path:string):MakingRecipe{
  const item=object(value,path);exactKeys(item,['version','title','source','ingredientNames','brandNames'],['preparation'],path);
  const version=recipeVersionValue(item.version,`${path}.version`),source=sourceValue(item.source,`${path}.source`);
  if(version.sourceId!==source.id)throw Error(`${path}: source mismatch`);
  const rawIngredientNames=object(item.ingredientNames,`${path}.ingredientNames`),ingredientNames:Record<string,Localized>={};
  for(const [id,name] of Object.entries(rawIngredientNames)){identifier(id,`${path}.ingredientNames key`);ingredientNames[id]=localized(name,`${path}.ingredientNames.${id}`);}
  const rawBrandNames=object(item.brandNames,`${path}.brandNames`),brandNames:Record<string,string>={};
  for(const [id,name] of Object.entries(rawBrandNames)){identifier(id,`${path}.brandNames key`);brandNames[id]=text(name,`${path}.brandNames.${id}`);}
  const ingredientIds=unique(version.ingredients.map(row=>row.ingredientId)),brandIds=unique(version.ingredients.flatMap(row=>row.brandId?[row.brandId]:[]));
  if(ingredientIds.some(id=>!Object.hasOwn(ingredientNames,id))||Object.keys(ingredientNames).some(id=>!ingredientIds.includes(id)))throw Error(`${path}.ingredientNames: references mismatch`);
  if(brandIds.some(id=>!Object.hasOwn(brandNames,id))||Object.keys(brandNames).some(id=>!brandIds.includes(id)))throw Error(`${path}.brandNames: references mismatch`);
  const preparation=item.preparation===undefined?undefined:preparationValue(item.preparation,`${path}.preparation`);
  if(preparation&&preparation.versionId!==version.id)throw Error(`${path}: preparation mismatch`);
  if(preparation?.cards.some(card=>card.ingredientId!==undefined&&!ingredientIds.includes(card.ingredientId)))throw Error(`${path}: preparation ingredient reference mismatch`);
  return{version,title:localized(item.title,`${path}.title`),source,ingredientNames,brandNames,...(preparation?{preparation}:{})};
}

/** Strictly validates and deep-copies a persisted public recipe snapshot. */
export function validateMakingRecipe(value:unknown):MakingRecipe{return makingRecipeValue(value,'recipe');}

function catalogueRecipe(catalogue:Catalogue,version:RecipeVersion):MakingRecipe|null{
  const cocktail=catalogue.cocktails.find(item=>item.id===version.cocktailId&&item.versionIds.includes(version.id));
  const source=catalogue.sources.find(item=>item.id===version.sourceId);
  if(!cocktail||!source)return null;
  const preparation=getRecipePreparation(version.id);
  const fallback=(id:string)=>Object.fromEntries(LOCALES.map(locale=>[locale,id])) as unknown as Localized;
  const ingredientNames=Object.fromEntries(unique(version.ingredients.map(row=>row.ingredientId)).map(id=>[id,catalogue.ingredients.find(item=>item.id===id)?.name??fallback(id)]));
  const brandNames=Object.fromEntries(unique(version.ingredients.flatMap(row=>row.brandId?[row.brandId]:[])).map(id=>[id,catalogue.brands.find(item=>item.id===id)?.name??id]));
  // Search annotations are a catalogue index, not part of a personal recipe.
  // Keep existing snapshot schemas and fingerprints stable when that index changes.
  const {mixingMethods:_searchAnnotations,origin:_catalogueOrigin,...snapshotVersion}=version;
  return{version:snapshotVersion,title:cocktail.snapshotName??cocktail.name,source,ingredientNames,brandNames,...(preparation?{preparation}:{})};
}
export function recipeSnapshot(catalogue:Catalogue,versionId:string):MakingRecipe|null{
  const version=catalogue.versions.find(item=>item.id===versionId);if(!version)return null;
  const recipe=catalogueRecipe(catalogue,version);return recipe?validateMakingRecipe(copy(recipe)):null;
}

export function recipeFingerprint(recipe:MakingRecipe):string{return semanticFingerprint(makingRecipeValue(recipe,'recipe'));}
export function rowId(recipe:MakingRecipe,index:number):string{
  if(!Number.isInteger(index)||index<0||index>=recipe.version.ingredients.length)throw RangeError('row index is outside the recipe');
  return `${recipe.version.id}:${index}`;
}

export function scaleRecipe(recipe:MakingRecipe,servings:number):ScaledRow[]{
  if(!finite(servings,1,1_000)||!Number.isInteger(servings))throw RangeError('servings must be an integer from 1 to 1000');
  const sourceServings=recipe.version.servings;
  if(!finite(sourceServings,1,1_000))throw Error('invalid source servings');
  const multiplier=servings/sourceServings;
  return recipe.version.ingredients.map((row,index)=>{
    const linear=row.amount!==null&&row.unit!=='top'&&row.unit!=='part';
    return{rowId:rowId(recipe,index),ingredientId:row.ingredientId,amount:linear?row.amount!*multiplier:row.amount,unit:row.unit,optional:row.optional===true,linear};
  });
}

function currentSession(context:MakingContext,recipe:MakingRecipe,servings:number,fingerprint:()=>string):MakingSession|undefined{
  const candidates=context.making.sessions.filter(session=>session.recipe.version.id===recipe.version.id&&session.servings===servings&&!session.completed);
  if(!candidates.length)return undefined;const expected=fingerprint();
  return candidates.filter(session=>session.fingerprint===expected)
    .sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt))[0];
}
function reviewFor(making:MakingState,recipe:MakingRecipe,fingerprint:()=>string):ReadinessReview|undefined{
  const candidates=making.reviews.filter(review=>review.versionId===recipe.version.id);if(!candidates.length)return undefined;
  const expected=fingerprint();return candidates.find(review=>review.fingerprint===expected);
}
function bottleMapsIngredient(bottle:{ingredientIds:string[]},ingredientId:string):boolean{return bottle.ingredientIds.includes(ingredientId);}
function canonicalStockAmount(entry:StockEntry):{dimension:'volume'|'mass'|'count';amount:number}{
  if(entry.unit==='ml')return{dimension:'volume',amount:entry.amount};
  if(entry.unit==='oz')return{dimension:'volume',amount:entry.amount*ML_PER_OZ};
  if(entry.unit==='g')return{dimension:'mass',amount:entry.amount};
  return{dimension:'count',amount:entry.amount};
}
function demandFor(row:ScaledRow,assumptions:MakingAssumptions):{dimension:'volume'|'mass'|'count';amount:number}|null{
  if(row.amount!==null&&row.linear){
    if(row.unit==='ml')return{dimension:'volume',amount:row.amount};
    if(row.unit==='oz')return{dimension:'volume',amount:row.amount*ML_PER_OZ};
    if(row.unit==='g')return{dimension:'mass',amount:row.amount};
    if(row.unit==='piece')return{dimension:'count',amount:row.amount};
    return null;
  }
  const assumed=assumptions.volumeMl[row.rowId];
  if(finite(assumed,0,1_000_000))return{dimension:'volume',amount:assumed};
  return null;
}
function sortedIssues(values:Iterable<FeasibilityIssue>):FeasibilityIssue[]{const set=new Set(values);return ISSUE_ORDER.filter(issue=>set.has(issue));}

export function evaluateVersion(context:MakingContext,versionId:string,servings=1):VersionAvailability{
  const version=context.catalogue.versions.find(item=>item.id===versionId);
  const recipe=version?catalogueRecipe(context.catalogue,version):null;
  if(!recipe||!version)throw Error(`unknown recipe version ${versionId}`);
  let cachedFingerprint:string|undefined;const fingerprint=()=>cachedFingerprint??=recipeFingerprint(recipe);
  const scaled=scaleRecipe(recipe,servings),session=currentSession(context,recipe,servings,fingerprint),assumptions=session?.assumptions??{volumeMl:{},abv:{},dilutionMl:null,bottleIds:{}};
  const ownedIds=new Set(context.ownedBottleIds),pantryIds=new Set(context.pantry.ingredientIds);
  const bottlesById=new Map(context.bottles.map(bottle=>[bottle.id,bottle]));
  const ownedBottles=context.bottles.filter(bottle=>ownedIds.has(bottle.id));
  const ingredients=new Set(context.catalogue.ingredients.map(item=>item.id));
  const stockByIngredient=new Map(context.making.stock.map(entry=>[entry.ingredientId,entry]));
  const rows:RowAvailability[]=[];
  const stockClaims=new Map<string,Array<{row:RowAvailability;demand:{dimension:'volume'|'mass'|'count';amount:number}}>>();

  scaled.forEach((scaledRow,index)=>{
    const sourceRow=version.ingredients[index]!,issues=new Set<FeasibilityIssue>(),id=scaledRow.rowId;
    const selectedId=assumptions.bottleIds[id],selected=selectedId?bottlesById.get(selectedId):undefined;
    const selectedValid=selected!==undefined&&ownedIds.has(selected.id)&&bottleMapsIngredient(selected,sourceRow.ingredientId);
    if(selectedId&&!selectedValid)issues.add('bottle-unconfirmed');
    if(!ingredients.has(sourceRow.ingredientId))issues.add('unknown-ingredient');
    const ownedForIngredient=ownedBottles.filter(bottle=>bottleMapsIngredient(bottle,sourceRow.ingredientId));
    const ingredientPresent=pantryIds.has(sourceRow.ingredientId)||ownedForIngredient.length>0;
    if(!ingredientPresent&&!selectedValid)issues.add('missing');
    const brandConfirmed=!sourceRow.brandId||
      (selectedValid&&selected!.brandId===sourceRow.brandId)||
      context.pantry.brandsByIngredient[sourceRow.ingredientId]?.includes(sourceRow.brandId)||
      ownedForIngredient.some(bottle=>bottle.brandId===sourceRow.brandId);
    if(!brandConfirmed)issues.add('brand-unconfirmed');
    if(selectedValid&&sourceRow.brandId&&selected!.brandId!==sourceRow.brandId)issues.add('brand-unconfirmed');

    const availability:RowAvailability={rowId:id,ingredientId:sourceRow.ingredientId,optional:scaledRow.optional,required:scaledRow.amount,unit:scaledRow.unit,issues:[]};
    if(!issues.has('missing')&&!issues.has('unknown-ingredient')&&!issues.has('bottle-unconfirmed')){
      const demand=demandFor(scaledRow,assumptions);
      if(!demand)issues.add((scaledRow.amount===null||scaledRow.unit==='top'||scaledRow.unit==='part')?'amount-unknown':'unit-incompatible');
      const stock=stockByIngredient.get(sourceRow.ingredientId);
      let eligible=false;
      if(stock){
        if(stock.bottleId){
          const bottle=bottlesById.get(stock.bottleId);
          eligible=!!bottle&&ownedIds.has(bottle.id)&&bottleMapsIngredient(bottle,sourceRow.ingredientId)&&
            (!selectedId||selectedId===bottle.id)&&(!sourceRow.brandId||sourceRow.brandId===bottle.brandId);
        }else eligible=pantryIds.has(sourceRow.ingredientId)&&!selectedId&&!sourceRow.brandId;
      }
      if(!stock||!eligible)issues.add('quantity-unknown');
      else if(demand){
        const available=canonicalStockAmount(stock);
        if(available.dimension!==demand.dimension)issues.add('unit-incompatible');
        else if(scaledRow.optional){if(demand.amount>available.amount+1e-9)issues.add('insufficient');}
        else{const claims=stockClaims.get(sourceRow.ingredientId)??[];claims.push({row:availability,demand});stockClaims.set(sourceRow.ingredientId,claims);}
      }
    }
    availability.issues=sortedIssues(issues);rows.push(availability);
  });

  for(const [ingredientId,claims] of stockClaims){
    const stock=stockByIngredient.get(ingredientId)!;
    const available=canonicalStockAmount(stock);
    if(claims.some(claim=>claim.demand.dimension!==available.dimension))continue;
    const required=claims.reduce((sum,claim)=>sum+claim.demand.amount,0);
    if(required>available.amount+1e-9)for(const claim of claims)claim.row.issues=sortedIssues([...claim.row.issues,'insufficient']);
  }
  const requiredRows=rows.filter(row=>!row.optional),issues=new Set<FeasibilityIssue>(requiredRows.flatMap(row=>row.issues));
  const review=reviewFor(context.making,recipe,fingerprint);
  if(!review?.toolsConfirmed)issues.add('tools-unconfirmed');
  if(recipe.preparation){
    if(recipe.preparation.status!=='disclosed'||recipe.preparation.gaps.length||recipe.preparation.cards.some(card=>card.status!=='disclosed'||card.gaps.length))issues.add('preparation-gap');
    if(!review?.preparationConfirmed)issues.add('preparation-unconfirmed');
  }
  const allIssues=sortedIssues(issues),hard=new Set<FeasibilityIssue>(['missing','insufficient','unknown-ingredient']);
  return{cocktailId:version.cocktailId,versionId,status:allIssues.some(issue=>hard.has(issue))?'missing':allIssues.length?'check':'ready',rows,issues:allIssues,
    missingIngredientIds:unique(requiredRows.filter(row=>row.issues.includes('missing')).map(row=>row.ingredientId))};
}

function availabilityScore(value:VersionAvailability,isDefault:boolean):readonly number[]{
  const rank=value.status==='ready'?0:value.status==='check'?1:2;
  const hard=value.rows.filter(row=>!row.optional&&row.issues.some(issue=>issue==='missing'||issue==='insufficient'||issue==='unknown-ingredient')).length;
  return[rank,value.missingIngredientIds.length,hard,value.issues.length,isDefault?0:1];
}
function compareNumbers(a:readonly number[],b:readonly number[]):number{for(let index=0;index<Math.max(a.length,b.length);index++){const delta=(a[index]??0)-(b[index]??0);if(delta)return delta;}return 0;}

export function pantryDecisions(context:MakingContext):VersionAvailability[]{
  return context.catalogue.cocktails.map(cocktail=>{
    const candidates=cocktail.versionIds.map(versionId=>evaluateVersion(context,versionId)).sort((a,b)=>compareNumbers(availabilityScore(a,a.versionId===cocktail.defaultVersionId),availabilityScore(b,b.versionId===cocktail.defaultVersionId))||a.versionId.localeCompare(b.versionId));
    if(!candidates[0])throw Error(`cocktail ${cocktail.id} has no usable version`);return candidates[0];
  }).sort((a,b)=>compareNumbers(availabilityScore(a,false),availabilityScore(b,false))||a.cocktailId.localeCompare(b.cocktailId));
}

export function rankSingleItemUnlocks(context:MakingContext,servings=1):RestockSuggestion[]{
  const byIngredient=new Map<string,{ready:Map<string,string[]>;review:Map<string,string[]>}>();
  const baseline=new Map(context.catalogue.versions.map(version=>[version.id,evaluateVersion(context,version.id,servings)]));
  const alreadyReady=new Set(context.catalogue.cocktails.filter(cocktail=>cocktail.versionIds.some(versionId=>baseline.get(versionId)?.status==='ready')).map(cocktail=>cocktail.id));
  for(const version of context.catalogue.versions){
    const availability=baseline.get(version.id)!;
    if(alreadyReady.has(availability.cocktailId))continue;
    if(availability.missingIngredientIds.length!==1)continue;
    const ingredientId=availability.missingIngredientIds[0]!;
    const remainingRowIssues=availability.rows.filter(row=>!row.optional).flatMap(row=>row.issues.filter(issue=>!(row.ingredientId===ingredientId&&issue==='missing')));
    const globalIssues=availability.issues.filter(issue=>!availability.rows.some(row=>!row.optional&&row.issues.includes(issue)));
    const recipe=catalogueRecipe(context.catalogue,version)!;let cachedFingerprint:string|undefined;const fingerprint=()=>cachedFingerprint??=recipeFingerprint(recipe);
    const assumptions=currentSession(context,recipe,servings,fingerprint)?.assumptions??{volumeMl:{},abv:{},dilutionMl:null,bottleIds:{}};
    const missingRows=scaleRecipe(recipe,servings).filter(row=>!row.optional&&row.ingredientId===ingredientId);
    const demands=missingRows.map(row=>demandFor(row,assumptions));
    const knownDemand=demands.every((demand):demand is NonNullable<typeof demand>=>demand!==null)&&new Set(demands.map(demand=>demand.dimension)).size===1;
    const remaining=sortedIssues([...remainingRowIssues,...globalIssues,...(knownDemand?[]:['amount-unknown' as const])]);
    if(remaining.some(issue=>issue==='missing'||issue==='insufficient'||issue==='unknown-ingredient'))continue;
    const group=byIngredient.get(ingredientId)??{ready:new Map(),review:new Map()};
    const target=remaining.length?group.review:group.ready;
    target.set(availability.cocktailId,[...(target.get(availability.cocktailId)??[]),availability.versionId]);
    byIngredient.set(ingredientId,group);
  }
  return [...byIngredient].map(([ingredientId,group])=>{
    for(const cocktailId of group.ready.keys())group.review.delete(cocktailId);
    const readyCocktailIds=[...group.ready.keys()].sort(),reviewCocktailIds=[...group.review.keys()].sort();
    const versionIds=unique([...group.ready.values(),...group.review.values()].flat()).sort();
    return{ingredientId,readyCocktailIds,reviewCocktailIds,versionIds};
  }).sort((a,b)=>b.readyCocktailIds.length-a.readyCocktailIds.length||b.reviewCocktailIds.length-a.reviewCocktailIds.length||a.ingredientId.localeCompare(b.ingredientId));
}

function includedRows(session:MakingSession):ScaledRow[]{
  const checked=new Set(session.checkedRows);return scaleRecipe(session.recipe,session.servings).filter(row=>!row.optional||checked.has(row.rowId));
}
export function calculateAbv(session:MakingSession):AbvResult{
  const missing:string[]=[];let alcoholMl=0,totalMl=0;
  for(const row of includedRows(session)){
    const volume=session.assumptions.volumeMl[row.rowId];
    if(!finite(volume,0,1_000_000)){missing.push(row.rowId);continue;}
    if(volume===0)continue;
    const abv=session.assumptions.abv[row.rowId];
    if(!finite(abv,0,100)){missing.push(row.rowId);totalMl+=volume;continue;}
    totalMl+=volume;alcoholMl+=volume*abv/100;
  }
  const dilutionUnknown=!finite(session.assumptions.dilutionMl,0,1_000_000);
  if(!dilutionUnknown)totalMl+=session.assumptions.dilutionMl!;
  const missingRowIds=unique(missing),complete=!missingRowIds.length&&!dilutionUnknown&&totalMl>0;
  return{status:complete?'estimated':'incomplete',abv:complete?alcoholMl/totalMl*100:null,alcoholMl,totalMl,missingRowIds,dilutionUnknown};
}

function assumptionsValue(value:unknown,path:string,rowIds?:Set<string>):MakingAssumptions{
  const item=object(value,path);exactKeys(item,['volumeMl','abv','dilutionMl','bottleIds'],[],path);
  const numericRecord=(raw:unknown,recordPath:string,min:number,max:number):Record<string,number>=>{
    const record=object(raw,recordPath),result:Record<string,number>={};
    for(const [key,value] of Object.entries(record)){identifier(key,`${recordPath} key`);if(rowIds&&!rowIds.has(key))throw Error(`${recordPath}: unknown row ${key}`);result[key]=number(value,`${recordPath}.${key}`,min,max);}
    return result;
  };
  const bottles=object(item.bottleIds,`${path}.bottleIds`),bottleIds:Record<string,string>={};
  for(const [key,value] of Object.entries(bottles)){identifier(key,`${path}.bottleIds key`);if(rowIds&&!rowIds.has(key))throw Error(`${path}.bottleIds: unknown row ${key}`);bottleIds[key]=identifier(value,`${path}.bottleIds.${key}`);}
  return{volumeMl:numericRecord(item.volumeMl,`${path}.volumeMl`,0,1_000_000),abv:numericRecord(item.abv,`${path}.abv`,0,100),dilutionMl:item.dilutionMl===null?null:number(item.dilutionMl,`${path}.dilutionMl`,0,1_000_000),bottleIds};
}
function sessionValue(value:unknown,path:string):MakingSession{
  const item=object(value,path);exactKeys(item,['id','consumptionId','recipe','fingerprint','servings','checkedRows','stepIndex','completed','consumptionApplied','startedAt','updatedAt','assumptions'],[],path);
  const recipe=makingRecipeValue(item.recipe,`${path}.recipe`),fingerprint=text(item.fingerprint,`${path}.fingerprint`,{max:64});
  if(!/^[0-9a-f]{64}$/.test(fingerprint)||fingerprint!==recipeFingerprint(recipe))throw Error(`${path}.fingerprint: mismatch`);
  const validRows=new Set(recipe.version.ingredients.map((_,index)=>rowId(recipe,index)));
  const checkedRows=stringArray(item.checkedRows,`${path}.checkedRows`,{uniqueValues:true});if(checkedRows.some(id=>!validRows.has(id)))throw Error(`${path}.checkedRows: unknown row`);
  const steps=Math.max(...LOCALES.map(locale=>recipe.version.steps[locale].length));
  return{id:identifier(item.id,`${path}.id`),consumptionId:identifier(item.consumptionId,`${path}.consumptionId`),recipe,fingerprint,
    servings:number(item.servings,`${path}.servings`,1,1_000,true),checkedRows,stepIndex:number(item.stepIndex,`${path}.stepIndex`,0,Math.max(0,steps-1),true),
    completed:boolean(item.completed,`${path}.completed`),consumptionApplied:boolean(item.consumptionApplied,`${path}.consumptionApplied`),startedAt:date(item.startedAt,`${path}.startedAt`),updatedAt:date(item.updatedAt,`${path}.updatedAt`),
    assumptions:assumptionsValue(item.assumptions,`${path}.assumptions`,validRows)};
}

export function createSession(recipe:MakingRecipe,id:string,now:string):MakingSession{
  identifier(id,'session.id');date(now,'session.startedAt');const snapshot=makingRecipeValue(recipe,'session.recipe');const fingerprint=recipeFingerprint(snapshot);
  return sessionValue({id,consumptionId:id,recipe:snapshot,fingerprint,servings:snapshot.version.servings,checkedRows:[],stepIndex:0,completed:false,consumptionApplied:false,startedAt:now,updatedAt:now,assumptions:{volumeMl:{},abv:{},dilutionMl:null,bottleIds:{}}},'session');
}

/** A completed batch is history, even when an older build never applied its legacy stock deduction. */
export function findResumableSession(state:MakingState,fingerprint:string,servings:number):MakingSession|undefined{
  return state.sessions
    .filter(item=>item.fingerprint===fingerprint&&item.servings===servings&&!item.completed)
    .sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt))[0];
}

export function updateSession(session:MakingSession,patch:Partial<Pick<MakingSession,'servings'|'checkedRows'|'stepIndex'|'completed'|'assumptions'>>,now:string):MakingSession{
  const current=sessionValue(session,'session');date(now,'session.updatedAt');
  if(current.completed&&Object.keys(patch).length)throw Error('session already completed');
  if(current.consumptionApplied&&Object.keys(patch).length)throw Error('consumption already applied');
  const allowed=new Set(['servings','checkedRows','stepIndex','completed','assumptions']);for(const key of Object.keys(patch))if(!allowed.has(key))throw Error(`session patch: unsupported ${key}`);
  let next:MakingSession={...current,...copy(patch),updatedAt:now};
  if(patch.servings!==undefined&&patch.servings!==current.servings){next={...next,checkedRows:[],stepIndex:0,completed:false,assumptions:{...next.assumptions,volumeMl:{},dilutionMl:null}};}
  return sessionValue(next,'session');
}

function quantityForConsumption(row:ScaledRow,session:MakingSession,stock:StockEntry):number|null{
  if(row.linear&&row.amount!==null){
    if(row.unit===stock.unit)return row.amount;
    if(row.unit==='ml'&&stock.unit==='oz')return row.amount/ML_PER_OZ;
    if(row.unit==='oz'&&stock.unit==='ml')return row.amount*ML_PER_OZ;
    return null;
  }
  const assumed=session.assumptions.volumeMl[row.rowId];
  if(!finite(assumed,0,1_000_000))return null;
  if(stock.unit==='ml')return assumed;
  if(stock.unit==='oz')return assumed/ML_PER_OZ;
  return null;
}

export function planConsumption(sessionValueInput:MakingSession,makingValue:MakingState,bottles:readonly Bottle[]=[],ownedBottleIds:readonly string[]=[]):ConsumptionPlan{
  const making=validateMakingState(makingValue),session=sessionValue(sessionValueInput,'session');
  const stored=making.sessions.find(item=>item.id===session.id);
  if(!stored||canonicalJson(stored)!==canonicalJson(session))throw Error('stale making session');
  if(!session.completed)throw Error('making session is not completed');
  if(making.sessions.some(item=>item.consumptionId===session.consumptionId&&item.consumptionApplied))throw Error('consumption already applied');
  const checked=new Set(session.checkedRows),scaled=scaleRecipe(session.recipe,session.servings),stockByIngredient=new Map(making.stock.map(entry=>[entry.ingredientId,entry]));
  const bottlesById=new Map(bottles.map(bottle=>[bottle.id,bottle])),ownedIds=new Set(ownedBottleIds);
  const totals=new Map<string,{entry:StockEntry;amount:number;rowIds:string[]}>();
  const skipped:string[]=[];
  for(let index=0;index<scaled.length;index++){
    const row=scaled[index]!,source=session.recipe.version.ingredients[index]!;if(!checked.has(row.rowId))continue;
    const stock=stockByIngredient.get(row.ingredientId),selected=session.assumptions.bottleIds[row.rowId];
    if(!stock||selected&&stock.bottleId!==selected){skipped.push(row.rowId);continue;}
    const effectiveBottleId=selected??stock.bottleId;
    if(effectiveBottleId){
      const bottle=bottlesById.get(effectiveBottleId);
      if(stock.bottleId!==effectiveBottleId||!bottle||!ownedIds.has(bottle.id)||!bottleMapsIngredient(bottle,row.ingredientId)||(source.brandId!==undefined&&bottle.brandId!==source.brandId)){skipped.push(row.rowId);continue;}
    }else if(source.brandId){skipped.push(row.rowId);continue;}
    const amount=quantityForConsumption(row,session,stock);if(amount===null){skipped.push(row.rowId);continue;}
    const total=totals.get(row.ingredientId)??{entry:stock,amount:0,rowIds:[]};total.amount+=amount;total.rowIds.push(row.rowId);totals.set(row.ingredientId,total);
  }
  const deductions:ConsumptionPlan['deductions']=[],after:StockEntry[]=[];
  for(const entry of making.stock){const total=totals.get(entry.ingredientId);if(!total){after.push({...entry});continue;}
    if(total.amount>entry.amount+1e-9)throw Error(`insufficient stock for ${entry.ingredientId}`);
    if(total.amount>0)deductions.push({ingredientId:entry.ingredientId,amount:total.amount,unit:entry.unit});
    const remaining=entry.amount-total.amount;after.push({...entry,amount:remaining>1e-9?remaining:0});
  }
  return{sessionId:session.id,fingerprint:session.fingerprint,before:copy(making.stock),after,deductions,skippedRowIds:unique(skipped)};
}

export function applyConsumption(plan:ConsumptionPlan,makingValue:MakingState,now:string,bottles:readonly Bottle[]=[],ownedBottleIds:readonly string[]=[]):MakingState{
  const making=validateMakingState(makingValue);date(now,'making.updatedAt');
  const session=making.sessions.find(item=>item.id===plan.sessionId);if(!session||session.fingerprint!==plan.fingerprint)throw Error('stale consumption plan');
  if(making.sessions.some(item=>item.consumptionId===session.consumptionId&&item.consumptionApplied))throw Error('consumption already applied');
  if(canonicalJson(making.stock)!==canonicalJson(plan.before))throw Error('stale consumption plan');
  const expected=planConsumption(session,making,bottles,ownedBottleIds);if(canonicalJson(expected)!==canonicalJson(plan))throw Error('invalid consumption plan');
  const sessions=making.sessions.map(item=>item.consumptionId===session.consumptionId?{...item,consumptionApplied:true,updatedAt:now}:item);
  return validateMakingState({...making,stock:copy(plan.after),sessions});
}

function stockValue(value:unknown,path:string):StockEntry{
  const item=object(value,path);exactKeys(item,['ingredientId','amount','unit'],['bottleId'],path);const unit=text(item.unit,`${path}.unit`) as StockUnit;if(!STOCK_UNITS.has(unit))throw Error(`${path}.unit: unsupported`);
  return{ingredientId:identifier(item.ingredientId,`${path}.ingredientId`),amount:number(item.amount,`${path}.amount`,0,1_000_000),unit,...(item.bottleId===undefined?{}:{bottleId:identifier(item.bottleId,`${path}.bottleId`)})};
}
function reviewValue(value:unknown,path:string):ReadinessReview{
  const item=object(value,path);exactKeys(item,['versionId','fingerprint','toolsConfirmed','preparationConfirmed'],[],path);const fingerprint=text(item.fingerprint,`${path}.fingerprint`,{max:64});if(!/^[0-9a-f]{64}$/.test(fingerprint))throw Error(`${path}.fingerprint: invalid`);
  return{versionId:identifier(item.versionId,`${path}.versionId`),fingerprint,toolsConfirmed:boolean(item.toolsConfirmed,`${path}.toolsConfirmed`),preparationConfirmed:boolean(item.preparationConfirmed,`${path}.preparationConfirmed`)};
}

export function validateMakingState(value:unknown):MakingState{
  const item=object(value,'making');exactKeys(item,['format','schemaVersion','stock','reviews','sessions'],[],'making');
  if(item.format!=='glass-notes-making'||item.schemaVersion!==1)throw Error('making: unsupported format or version');
  if(!Array.isArray(item.stock)||item.stock.length>MAX_ROWS||!Array.isArray(item.reviews)||item.reviews.length>MAX_ROWS||!Array.isArray(item.sessions)||item.sessions.length>MAX_SESSIONS)throw Error('making: invalid collection');
  const stock=item.stock.map((entry,index)=>stockValue(entry,`making.stock[${index}]`));if(new Set(stock.map(entry=>entry.ingredientId)).size!==stock.length)throw Error('making.stock: duplicate ingredient');
  const reviews=item.reviews.map((review,index)=>reviewValue(review,`making.reviews[${index}]`));if(new Set(reviews.map(review=>`${review.versionId}\0${review.fingerprint}`)).size!==reviews.length)throw Error('making.reviews: duplicate review');
  const sessions=item.sessions.map((session,index)=>sessionValue(session,`making.sessions[${index}]`));if(new Set(sessions.map(session=>session.id)).size!==sessions.length)throw Error('making.sessions: duplicate id');
  const consumption=new Map<string,{fingerprint:string;startedAt:string}>();for(const session of sessions){const previous=consumption.get(session.consumptionId);if(previous&&(previous.fingerprint!==session.fingerprint||previous.startedAt!==session.startedAt))throw Error('making.sessions: reused consumption id');consumption.set(session.consumptionId,{fingerprint:session.fingerprint,startedAt:session.startedAt});}
  return{format:'glass-notes-making',schemaVersion:1,stock,reviews,sessions};
}

export function parseMakingState(raw:string|null):MakingState{
  if(raw===null)return emptyMakingState();if(typeof raw!=='string'||utf8ByteLength(raw)>5_000_000)throw Error('making: invalid JSON');
  let value:unknown;try{value=JSON.parse(raw);}catch{throw Error('making: invalid JSON');}return validateMakingState(value);
}
