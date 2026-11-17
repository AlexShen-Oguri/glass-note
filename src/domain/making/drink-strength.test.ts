import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue as data} from '../../content/catalogue';
import type {Catalogue, RecipeIngredient} from '../contracts';
import type {Bottle} from '../bottles/types';
import {calculateAbv, createSession, recipeFingerprint, recipeSnapshot} from '.';
import type {MakingContext, MakingRecipe} from './types';
import {analyzeDrinkStrength as analyze} from './drink-strength';
import type {DrinkStrengthContent} from './drink-strength';

const source={title:'Reviewed producer example',url:'https://example.com/producer',checkedAt:'2026-10-23'};
function fixture(rows:RecipeIngredient[]=[{ingredientId:'gin',amount:60,unit:'ml'},{ingredientId:'lime-juice',amount:30,unit:'ml'}]) {
  const version={...data.versions.find(value=>value.id==='negroni-iba')!,id:'strength-test',servings:1,ingredients:rows};
  const cocktail={...data.cocktails.find(value=>value.id===version.cocktailId)!,versionIds:[version.id],defaultVersionId:version.id};
  const catalogue:Catalogue={...data,versions:[version],cocktails:[cocktail]};
  const recipe=recipeSnapshot(catalogue,version.id)!;
  const content:DrinkStrengthContent={references:[
    {ingredientId:'gin',low:40,high:40,basis:'producer-example',sources:[source],bottleIds:['example-gin']},
    {ingredientId:'lime-juice',low:0,high:0,basis:'editorial-assumption',sources:[source]},
    {ingredientId:'white-rum',low:40,high:40,basis:'producer-example',sources:[source]},
    {ingredientId:'bourbon-whiskey',low:45,high:45,basis:'producer-example',sources:[source]},
    {ingredientId:'genepy-liqueur',low:40,high:40,basis:'producer-example',sources:[source]},
  ],profiles:[]};
  return {recipe,catalogue,content};
}
function bottle(ingredientId='gin',abv:number|null=40,id='actual'):Bottle {
  return {id,ingredientIds:[ingredientId],abv,brandId:'producer',brandName:'Producer',name:id,aliases:[],family:'gin',market:'test',flavours:[],profile:data.ingredients[0]!.name,source,profileBasis:'producer'};
}
function context(catalogue:Catalogue,bottles:Bottle[]=[]):MakingContext {
  return {catalogue,bottles,pantry:{ingredientIds:['bourbon-whiskey','genepy-liqueur'],brandsByIngredient:{}},ownedBottleIds:bottles.map(value=>value.id),making:{format:'glass-notes-making',schemaVersion:2,stock:[],reviews:[],sessions:[]}};
}
function profile(recipe:MakingRecipe,volumeMl:Record<string,number>={}):DrinkStrengthContent['profiles'][number] {
  return {versionId:recipe.version.id,sourceId:recipe.version.sourceId,fingerprint:recipeFingerprint(recipe),format:'short',formatBasis:'editorial',formatReason:'compact-strained',sources:[source],volumeMl};
}

test('hand calculation separates 26.666% before ice from 20% after 30 ml water',()=>{
  const f=fixture(),result=analyze(f.recipe,f.catalogue,[],f.content,{dilutionMl:30});
  assert.equal(result.status,'estimated');assert.equal(result.totalMl,90);
  assert.deepEqual(result.alcoholMl,{low:24,high:24});
  assert.ok(Math.abs(result.beforeIce!.low-26.666666666666668)<1e-12);
  assert.deepEqual(result.diluted,{low:20,high:20});
  const local=createSession(f.recipe,'local','2026-10-23T12:00:00Z');
  local.assumptions={volumeMl:{'strength-test:0':60,'strength-test:1':30},abv:{'strength-test:0':40,'strength-test:1':0},bottleIds:{},dilutionMl:30};
  assert.equal(result.diluted!.low,calculateAbv(local).abv);
});

test('unknown dilution leaves only before-ice reference, while explicit zero is known',()=>{
  const f=fixture(),result=analyze(f.recipe,f.catalogue,[],f.content);
  assert.ok(result.beforeIce);assert.equal(result.diluted,null);assert.equal(result.dilutionMl,null);
  assert.deepEqual(analyze(f.recipe,f.catalogue,[],f.content,{dilutionMl:0}).diluted,result.beforeIce);
});

test('US fluid ounces and source servings scale, while row overrides describe the whole batch',()=>{
  const f=fixture([{ingredientId:'gin',amount:2,unit:'oz'},{ingredientId:'lime-juice',amount:1,unit:'oz'}]);
  f.recipe.version.servings=2;
  const result=analyze(f.recipe,f.catalogue,[],f.content,{servings:4,volumeMl:{'strength-test:1':30}});
  assert.equal(result.rows[0]!.volumeMl,118.29411825);assert.equal(result.rows[1]!.volumeMl,30);
  assert.equal(result.rows[1]!.volumeBasis,'user');
});

test('curated references ignore unrelated bottle extremes and retain provenance',()=>{
  const f=fixture(),result=analyze(f.recipe,f.catalogue,[bottle('gin',5,'weak'),bottle('gin',99,'strong')],f.content);
  assert.deepEqual(result.rows[0]!.abv,{low:40,high:40});
  assert.equal(result.rows[0]!.abvBasis,'producer-example');assert.deepEqual(result.rows[0]!.sources,[source]);
  assert.deepEqual(result.rows[0]!.eligibleBottleIds,['weak','strong']);
});

test('explicit bottle overrides reference, but null strength never falls back to another bottle',()=>{
  const f=fixture(),known=bottle('gin',50),unknown=bottle('gin',null,'unknown');
  const actual=analyze(f.recipe,f.catalogue,[known,unknown],f.content,{bottleIds:{'strength-test:0':'actual'}});
  assert.deepEqual(actual.rows[0]!.abv,{low:50,high:50});assert.equal(actual.rows[0]!.abvBasis,'bottle');
  assert.equal(actual.rows[0]!.sources[0]!.market,'test');
  const missing=analyze(f.recipe,f.catalogue,[known,unknown],f.content,{bottleIds:{'strength-test:0':'unknown'}});
  assert.equal(missing.beforeIce,null);assert.equal(missing.rows[0]!.abv,null);assert.deepEqual(missing.missingRowIds,['strength-test:0']);
  assert.equal(analyze(f.recipe,f.catalogue,[known],f.content,{bottleIds:{'strength-test:0':'missing'}}).rows[0]!.abv,null);
});

test('explicit user ABV may fill an unknown selected bottle and remains labelled user input',()=>{
  const f=fixture(),result=analyze(f.recipe,f.catalogue,[bottle('gin',null)],f.content,{bottleIds:{'strength-test:0':'actual'},abv:{'strength-test:0':41}});
  assert.deepEqual(result.rows[0]!.abv,{low:41,high:41});assert.equal(result.rows[0]!.abvBasis,'user');assert.ok(result.beforeIce);
});

test('a reference never propagates over a canonical family without an exact reviewed ingredient',()=>{
  const f=fixture([{ingredientId:'food-generic-whisky',amount:60,unit:'ml'}]);
  const result=analyze(f.recipe,f.catalogue,[],f.content);
  assert.equal(result.rows[0]!.abv,null);assert.equal(result.beforeIce,null);
});

test('canonical white rum and generic whisky can simulate actual matching bottles',()=>{
  for(const [required,actual] of [['white-rum','aged-rum'],['food-generic-whisky','bourbon-whiskey']]) {
    const f=fixture([{ingredientId:required!,amount:60,unit:'ml'}]);
    const result=analyze(f.recipe,f.catalogue,[bottle(actual,47)],f.content,{bottleIds:{'strength-test:0':'actual'}});
    assert.deepEqual(result.beforeIce,{low:47,high:47});assert.deepEqual(result.rows[0]!.eligibleBottleIds,['actual']);
  }
});

test('source OR permits the alternative brand but preserves the original family brand constraint',()=>{
  const f=fixture([{ingredientId:'yellow-chartreuse',brandId:'brand-chartreuse',amount:10,unit:'ml'}]);
  f.catalogue.materialRequirements=[{versionId:f.recipe.version.id,rowIndex:0,originalRow:structuredClone(f.recipe.version.ingredients[0]!),sourceName:f.recipe.title,acceptedIngredientIds:['yellow-chartreuse','genepy-liqueur']}];
  const bottles=[bottle('genepy-liqueur',40,'alternative'),bottle('yellow-chartreuse',43,'wrong-brand'),{...bottle('yellow-chartreuse',43,'correct-brand'),brandId:'brand-chartreuse'}];
  const result=analyze(f.recipe,f.catalogue,bottles,f.content,{bottleIds:{'strength-test:0':'alternative'}});
  assert.deepEqual(result.rows[0]!.eligibleBottleIds,['alternative','correct-brand']);assert.deepEqual(result.beforeIce,{low:40,high:40});
  assert.equal(analyze(f.recipe,f.catalogue,bottles,f.content,{bottleIds:{'strength-test:0':'wrong-brand'}}).beforeIce,null);
});

test('legacy sessions use exact ingredient IDs rather than newly broadened canonical matching',()=>{
  const f=fixture([{ingredientId:'scotch-whisky',amount:60,unit:'ml'}]);
  const session=createSession(f.recipe,'legacy','2026-10-23T12:00:00Z');
  const result=analyze(f.recipe,f.catalogue,[bottle('bourbon-whiskey',45)],f.content,{session,bottleIds:{'strength-test:0':'actual'}});
  assert.deepEqual(result.rows[0]!.eligibleBottleIds,[]);assert.equal(result.beforeIce,null);
});

test('v2 frozen eligibility and actual ingredient binding survive catalogue changes',()=>{
  const f=fixture([{ingredientId:'scotch-whisky',amount:60,unit:'ml'}]),ctx=context(f.catalogue);
  const session=createSession(f.recipe,'frozen','2026-10-23T12:00:00Z',ctx);
  assert.deepEqual(session.materialBindings?.['strength-test:0'],{ingredientId:'bourbon-whiskey'});
  const changed={...f.catalogue,materialConcepts:[],materialRequirements:[],ingredients:[]};
  const result=analyze(f.recipe,changed,[bottle('bourbon-whiskey',50)],f.content,{session});
  assert.deepEqual(result.rows[0]!.abv,{low:45,high:45});assert.deepEqual(result.rows[0]!.eligibleBottleIds,['actual']);
  const simulated=analyze(f.recipe,changed,[bottle('bourbon-whiskey',50)],f.content,{session,bottleIds:{'strength-test:0':'actual'}});
  assert.deepEqual(simulated.beforeIce,{low:50,high:50});
});

test('actual bound bottle beats saved bottle assumptions and null strength stays unknown',()=>{
  const f=fixture(),ctx=context(f.catalogue,[bottle('gin',null,'bound'),bottle('gin',60,'saved')]);
  ctx.pantry.ingredientIds=[];ctx.ownedBottleIds=['bound'];
  const session=createSession(f.recipe,'bound','2026-10-23T12:00:00Z',ctx);
  session.assumptions.bottleIds['strength-test:0']='saved';
  const result=analyze(f.recipe,f.catalogue,ctx.bottles,f.content,{session});
  assert.equal(result.rows[0]!.bottleId,'bound');assert.equal(result.rows[0]!.abv,null);
  assert.deepEqual(analyze(f.recipe,f.catalogue,ctx.bottles,f.content,{session,bottleIds:{'strength-test:0':'saved'}}).rows[0]!.abv,{low:60,high:60});
});

test('v2 source OR brand applicability remains frozen after requirements are removed',()=>{
  const recipe=recipeSnapshot(data,'carino-batch-j')!,ctx=context(data,[bottle('genepy-liqueur',40)]);
  ctx.pantry.ingredientIds=[];
  const session=createSession(recipe,'alternative','2026-10-23T12:00:00Z',ctx);
  const result=analyze(recipe,{...data,materialRequirements:[],materialConcepts:[]},ctx.bottles,fixture().content,{session});
  assert.deepEqual(result.rows[1]!.abv,{low:40,high:40});assert.equal(result.rows[1]!.bottleId,'actual');
});

test('actual ingredient without a bottle restricts reference lookup to the bound supply',()=>{
  const f=fixture([{ingredientId:'scotch-whisky',amount:60,unit:'ml'}]),session=createSession(f.recipe,'actual-supply','2026-10-23T12:00:00Z',context(f.catalogue));
  f.content.references=[{ingredientId:'scotch-whisky',low:80,high:80,basis:'producer-example',sources:[source]}];
  const result=analyze(f.recipe,f.catalogue,[],f.content,{session});
  assert.equal(result.rows[0]!.abv,null);
});

test('reviewed profile supplies only explicit rows and scales source-batch assumptions',()=>{
  const f=fixture([{ingredientId:'gin',amount:60,unit:'ml'},{ingredientId:'lime-juice',amount:null,unit:'piece'}]);
  f.recipe.version.servings=2;f.content.profiles=[profile(f.recipe,{'strength-test:1':30})];
  const result=analyze(f.recipe,f.catalogue,[],f.content,{servings:4});
  assert.equal(result.rows[1]!.volumeMl,60);assert.equal(result.rows[1]!.volumeBasis,'profile-assumption');assert.equal(result.format?.format,'short');assert.ok(result.beforeIce);
});

test('full recipe and source identity guard rejects stale classification and volume assumptions',()=>{
  const f=fixture([{ingredientId:'gin',amount:null,unit:'top'}]);f.content.profiles=[profile(f.recipe,{'strength-test:0':60})];
  for(const changed of [{...f.recipe,title:{...f.recipe.title,en:'Changed'}},{...f.recipe,source:{...f.recipe.source,url:'https://example.com/changed'}}]) {
    const result=analyze(changed,f.catalogue,[],f.content);assert.equal(result.format,undefined);assert.equal(result.rows[0]!.volumeMl,null);assert.equal(result.beforeIce,null);
  }
});

test('non-volume units never gain automatic volumes or zero, including seemingly solid ingredients',()=>{
  for(const unit of ['g','piece','dash','part','tsp','tbsp','barspoon','top'] as const) {
    const f=fixture([{ingredientId:'lime-juice',amount:1,unit}]),result=analyze(f.recipe,f.catalogue,[],f.content);
    assert.equal(result.rows[0]!.volumeMl,null);assert.equal(result.beforeIce,null);assert.deepEqual(result.missingRowIds,['strength-test:0']);
  }
});

test('a reviewed zero-volume row may be excluded from alcohol contribution without inventing ABV',()=>{
  const f=fixture([{ingredientId:'gin',amount:60,unit:'ml'},{ingredientId:'sugar',amount:1,unit:'piece'}]);
  f.content.profiles=[profile(f.recipe,{'strength-test:1':0})];
  const result=analyze(f.recipe,f.catalogue,[],f.content);assert.deepEqual(result.beforeIce,{low:40,high:40});assert.equal(result.rows[1]!.abv,null);assert.deepEqual(result.missingRowIds,[]);
});

test('optional rows enter the calculation only through explicit inclusion or checked session rows',()=>{
  const f=fixture([{ingredientId:'gin',amount:60,unit:'ml'},{ingredientId:'lime-juice',amount:60,unit:'ml',optional:true}]);
  assert.deepEqual(analyze(f.recipe,f.catalogue,[],f.content).beforeIce,{low:40,high:40});
  assert.deepEqual(analyze(f.recipe,f.catalogue,[],f.content,{includedOptionalRowIds:['strength-test:1']}).beforeIce,{low:20,high:20});
  const session=createSession(f.recipe,'optional','2026-10-23T12:00:00Z');session.checkedRows=['strength-test:1'];
  assert.deepEqual(analyze(f.recipe,f.catalogue,[],f.content,{session}).beforeIce,{low:20,high:20});
  assert.deepEqual(analyze(f.recipe,f.catalogue,[],f.content,{session,includedOptionalRowIds:[]}).beforeIce,{low:40,high:40});
});

test('invalid override values never silently fall back or coerce missing input to zero',()=>{
  const f=fixture();
  for(const invalid of [NaN,Infinity,-1,'',null,undefined]) {
    const volumeMl={'strength-test:0':invalid} as Record<string,number>;
    assert.equal(analyze(f.recipe,f.catalogue,[],f.content,{volumeMl}).rows[0]!.volumeMl,null);
    const abv={'strength-test:0':invalid} as Record<string,number>;
    assert.equal(analyze(f.recipe,f.catalogue,[],f.content,{abv}).rows[0]!.abv,null);
  }
  assert.equal(analyze(f.recipe,f.catalogue,[],f.content,{abv:{'strength-test:0':101}}).beforeIce,null);
  for(const servings of [0,-1,NaN,Infinity])assert.equal(analyze(f.recipe,f.catalogue,[],f.content,{servings}).beforeIce,null);
  for(const dilutionMl of [-1,NaN,Infinity])assert.equal(analyze(f.recipe,f.catalogue,[],f.content,{dilutionMl}).diluted,null);
});

test('explicit options override saved assumptions with whole-batch values, and frozen recipe stays authoritative',()=>{
  const f=fixture(),session=createSession(f.recipe,'saved','2026-10-23T12:00:00Z');
  session.assumptions={volumeMl:{'strength-test:0':120,'strength-test:1':60},abv:{'strength-test:0':50},bottleIds:{},dilutionMl:60};session.servings=2;
  const changed={...f.recipe,version:{...f.recipe.version,ingredients:[{ingredientId:'gin',amount:1,unit:'ml' as const}]}};
  const result=analyze(changed,f.catalogue,[],f.content,{session,volumeMl:{'strength-test:0':60},abv:{'strength-test:0':40},dilutionMl:null});
  assert.equal(result.rows.length,2);assert.equal(result.rows[0]!.volumeMl,60);assert.equal(result.rows[1]!.volumeMl,60);assert.deepEqual(result.beforeIce,{low:20,high:20});assert.equal(result.diluted,null);
});

test('unknown references and invalid reference ranges remain incomplete, without mutating any inputs',()=>{
  const f=fixture();f.content.references=[{ingredientId:'gin',low:60,high:40,basis:'producer-example',sources:[source]}];
  const bottles=[bottle()],options={dilutionMl:30},before=JSON.stringify([f,bottles,options]);
  const result=analyze(f.recipe,f.catalogue,bottles,f.content,options);
  assert.equal(result.beforeIce,null);assert.equal(result.alcoholMl,null);assert.equal(JSON.stringify([f,bottles,options]),before);
});

test('explicit reviewed brand identity permits an external reference without inventing a local bottle',()=>{
  const f=fixture([{ingredientId:'gin',brandId:'reviewed-producer',amount:60,unit:'ml'}]);
  f.content.references=[{ingredientId:'gin',low:40,high:45,basis:'producer-example',brandIds:['reviewed-producer'],sources:[source]}];
  assert.deepEqual(analyze(f.recipe,f.catalogue,[],f.content).beforeIce,{low:40,high:45});
  f.recipe.version.ingredients[0]!.brandId='other-producer';
  f.recipe.brandNames={'other-producer':'Other producer'};
  assert.equal(analyze(f.recipe,f.catalogue,[],f.content).beforeIce,null);
});

test('malformed profile assumptions cannot turn null or text into zero-volume contributions',()=>{
  const f=fixture([{ingredientId:'gin',amount:60,unit:'ml'},{ingredientId:'sugar',amount:1,unit:'piece'}]);
  for(const invalid of [null,'',undefined,-1,Infinity]) {
    f.content.profiles=[profile(f.recipe,{'strength-test:1':invalid} as Record<string,number>)];
    assert.equal(analyze(f.recipe,f.catalogue,[],f.content).rows[1]!.volumeMl,null);
  }
});

test('an actual bound bottle cannot silently change to another allowed ingredient under the same ID',()=>{
  const f=fixture([{ingredientId:'scotch-whisky',amount:60,unit:'ml'}]);
  const actual=bottle('bourbon-whiskey',45),ctx=context(f.catalogue,[actual]);ctx.pantry.ingredientIds=[];
  const session=createSession(f.recipe,'bound-identity','2026-10-23T12:00:00Z',ctx);
  assert.deepEqual(session.materialBindings?.['strength-test:0'],{ingredientId:'bourbon-whiskey',bottleId:'actual'});
  const changed={...actual,ingredientIds:['rye-whiskey'],abv:70};
  const replay=analyze(f.recipe,f.catalogue,[changed],f.content,{session});
  assert.equal(replay.rows[0]!.abv,null);assert.equal(replay.beforeIce,null);
  assert.ok(replay.rows[0]!.issues.includes('bottle-incompatible'));
  const simulation=analyze(f.recipe,f.catalogue,[changed],f.content,{session,bottleIds:{'strength-test:0':'actual'}});
  assert.deepEqual(simulation.rows[0]!.abv,{low:70,high:70});
});

test('branded references use only eligible curated numeric bottle examples and their own evidence',()=>{
  const f=fixture([{ingredientId:'gin',brandId:'bombay',amount:60,unit:'ml'}]);
  const bombay={...bottle('gin',40,'bombay'),brandId:'bombay',source:{...source,title:'Bombay 40%',url:'https://example.com/bombay'}};
  const tanqueray={...bottle('gin',47.3,'tanqueray'),brandId:'tanqueray',source:{...source,title:'Tanqueray 47.3%',url:'https://example.com/tanqueray'}};
  f.content.references=[{ingredientId:'gin',low:40,high:47.3,basis:'producer-example',bottleIds:['bombay','tanqueray'],sources:[bombay.source,tanqueray.source]}];
  const result=analyze(f.recipe,f.catalogue,[bombay,tanqueray],f.content);
  assert.deepEqual(result.rows[0]!.abv,{low:40,high:40});
  assert.deepEqual(result.rows[0]!.sources,[{...bombay.source,market:'test'}]);
  for(const abv of [null,39,48]) {
    const unknown=analyze(f.recipe,f.catalogue,[{...bombay,abv},tanqueray],f.content);
    assert.equal(unknown.rows[0]!.abv,null);assert.equal(unknown.beforeIce,null);
  }
});

test('guarded row references override generic examples without affecting explicit bottles or stale identities',()=>{
  const f=fixture([{ingredientId:'gin',amount:60,unit:'ml'}]);
  const scopedSource={...source,title:'Editorial special-gin 35% assumption',url:'https://example.com/special-gin'};
  f.content.profiles=[{...profile(f.recipe),rowReferences:{'strength-test:0':{
    ingredientId:'gin',low:35,high:35,basis:'editorial-assumption',sources:[scopedSource],
  }}}];
  const scoped=analyze(f.recipe,f.catalogue,[],f.content);
  assert.deepEqual(scoped.rows[0]!.abv,{low:35,high:35});
  assert.equal(scoped.rows[0]!.abvBasis,'editorial-assumption');assert.deepEqual(scoped.rows[0]!.sources,[scopedSource]);
  const actual=analyze(f.recipe,f.catalogue,[bottle('gin',null)],f.content,{bottleIds:{'strength-test:0':'actual'}});
  assert.equal(actual.rows[0]!.abv,null);
  const changed={...f.recipe,title:{...f.recipe.title,en:'Unreviewed source snapshot'}};
  const stale=analyze(changed,f.catalogue,[],f.content);
  assert.deepEqual(stale.rows[0]!.abv,{low:40,high:40});assert.equal(stale.rows[0]!.abvBasis,'producer-example');
  assert.ok(stale.rows[0]!.sources.every(value=>value.url!==scopedSource.url));
});

test('returned profile row references do not alias maintained content or nested evidence arrays',()=>{
  const f=fixture();f.content.profiles=[{...profile(f.recipe),rowReferences:{'strength-test:0':{
    ingredientId:'gin',low:35,high:35,basis:'editorial-assumption',sources:[{...source}],bottleIds:['example'],brandIds:['producer'],
  }}}];
  const before=JSON.stringify(f.content),result=analyze(f.recipe,f.catalogue,[],f.content);
  const returned=result.format!.rowReferences!['strength-test:0']!;
  returned.low=99;returned.sources[0]!.title='Changed';returned.sources.push(source);
  returned.bottleIds!.push('extra');returned.brandIds!.push('extra');
  assert.equal(JSON.stringify(f.content),before);
});
