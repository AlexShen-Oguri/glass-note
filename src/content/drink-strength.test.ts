import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from './catalogue';
import {bottles} from './bottles';
import {recipeFingerprint, recipeSnapshot} from '../domain/making';
import {analyzeDrinkStrength} from '../domain/making/drink-strength';
import {drinkStrengthContent} from './drink-strength';

const reviewedFormats = {
  'negroni-iba':'short', 'jungle-bird-iba':'long', 'three-dots-and-a-dash-iba':'long',
  'daiquiri-iba':'short', 'dry-martini-iba':'short', 'margarita-iba':'short',
  'mojito-iba':'long', 'whiskey-sour-iba':'short', 'manhattan-iba':'short',
  'old-fashioned-iba':'short', 'cosmopolitan-iba':'short', 'espresso-martini-iba':'short',
  'boulevardier-iba':'short', 'americano-iba':'long', 'spritz-iba':'long',
  'gin-fizz-iba':'long', 'tom-collins-iba':'long', 'moscow-mule-iba':'long',
  'mai-tai-iba':'long', 'paloma-iba':'long',
} as const;

test('the first twenty source versions have independently authored format and frozen identity guards', () => {
  assert.deepEqual(drinkStrengthContent.profiles.map(profile=>profile.versionId).sort(), Object.keys(reviewedFormats).sort());
  for (const profile of drinkStrengthContent.profiles) {
    const recipe=recipeSnapshot(catalogue,profile.versionId)!;
    assert.equal(profile.sourceId,recipe.version.sourceId);
    assert.equal(profile.fingerprint,recipeFingerprint(recipe),profile.versionId);
    assert.equal(profile.format,reviewedFormats[profile.versionId as keyof typeof reviewedFormats]);
    assert.equal(profile.formatBasis,'editorial');
    assert.ok(profile.sources.some(source=>source.url===recipe.source.url));
    assert.ok(profile.sources.some(source=>source.title.includes('Editorial')),'the IBA composition is evidence for an editorial judgment, not an IBA classification');
  }
});

test('non-volume assumptions cover only reviewed rows and preserve source ml quantities', () => {
  const expected: Record<string,number> = {
    'three-dots-and-a-dash-iba:7':2, 'daiquiri-iba:2':0,
    'mojito-iba:2':0, 'mojito-iba:3':0, 'mojito-iba:4':60,
    'manhattan-iba:2':1, 'old-fashioned-iba:1':0,
    'old-fashioned-iba:2':3, 'old-fashioned-iba:3':3,
    'espresso-martini-iba:3':30, 'americano-iba:2':60,
    'spritz-iba:2':60, 'gin-fizz-iba:3':60, 'paloma-iba:2':0,
  };
  assert.deepEqual(Object.assign({},...drinkStrengthContent.profiles.map(profile=>profile.volumeMl)),expected);
  const solids=new Set(['superfine-sugar','white-cane-sugar','sugar-cube','mint-sprigs','salt']);
  for(const profile of drinkStrengthContent.profiles){
    const recipe=recipeSnapshot(catalogue,profile.versionId)!;
    for(const [key,value] of Object.entries(profile.volumeMl)){
      const row=recipe.version.ingredients[Number(key.slice(key.lastIndexOf(':')+1))]!;
      assert.equal(key.startsWith(`${profile.versionId}:`),true);
      assert.ok(!['ml','oz'].includes(row.unit));
      if(value===0)assert.ok(solids.has(row.ingredientId),key);
    }
  }
});

test('alcohol examples are curated numeric facts with exact product and market evidence', () => {
  const reference=(id:string)=>drinkStrengthContent.references.find(item=>item.ingredientId===id)!;
  assert.deepEqual([reference('gin').low,reference('gin').high],[40,47.3]);
  assert.deepEqual([reference('campari').low,reference('campari').high],[24,24]);
  for(const [id,abv,url] of [
    ['sweet-red-vermouth',16,'https://www.dolin.fr/en/products/red-vermouth/'],
    ['triple-sec',40,'https://www.cointreau.com/us/en/products/cointreau'],
    ['coffee-liqueur',20,'https://www.kahlua.com/en-us/products/original-coffee-liqueur/'],
    ['allspice-dram',22.5,'https://alpenz.com/product-allspice.html'],
    ['falernum',11,'https://alpenz.com/product-falernum.html'],
  ] as const){
    const item=reference(id);
    assert.equal(item.basis,'producer-example');assert.equal(item.low,abv);assert.equal(item.high,abv);
    assert.ok(item.sources.some(source=>source.url===url&&source.market));
  }
  for(const item of drinkStrengthContent.references){
    assert.ok(catalogue.ingredients.some(ingredient=>ingredient.id===item.ingredientId),item.ingredientId);
    assert.ok(Number.isFinite(item.low)&&item.low>=0&&item.high>=item.low&&item.high<=100);
    for(const id of item.bottleIds??[]){
      const bottle=bottles.find(bottle=>bottle.id===id)!;assert.ok(bottle,id);
      assert.ok(bottle.abv!==null&&bottle.abv>=item.low&&bottle.abv<=item.high,id);
      assert.ok(item.sources.some(source=>source.url===bottle.source.url&&source.title===bottle.source.title&&source.checkedAt===bottle.source.checkedAt),id);
    }
  }
});

test('brand-specific external producer facts retain exact source-brand scope', () => {
  for(const [id,brandId] of [['triple-sec','brand-cointreau'],['coffee-liqueur','brand-kahlua'],['allspice-dram','brand-st-elizabeth'],['angostura-bitters','brand-angostura-aromatic'],['aperol','brand-aperol']] as const){
    const item=drinkStrengthContent.references.find(item=>item.ingredientId===id)!;
    assert.equal(item.basis,'producer-example');assert.ok(item.brandIds?.includes(brandId),id);
  }
  const bitters=drinkStrengthContent.references.find(item=>item.ingredientId==='angostura-bitters')!;
  assert.equal(bitters.low,44.7);assert.equal(bitters.high,44.7);
  assert.ok(bitters.sources.some(source=>source.url==='https://angosturabitters.com/wp-content/uploads/2025/06/Large_Aromatic2022.png'));
  assert.equal(bitters.bottleIds,undefined,'a catalogue bottle with null ABV must not be promoted to a measured bottle');
});

test('zero alcohol is an explicit composition model and unverified rum is not a producer fact', () => {
  const modeledZero=['pineapple-juice','lime-juice','orange-juice','cranberry-juice','lemon-juice','demerara-syrup','honey-syrup','simple-syrup','orgeat','espresso','soda-water','plain-water','ginger-beer','pink-grapefruit-soda'];
  for(const id of modeledZero){
    const item=drinkStrengthContent.references.find(item=>item.ingredientId===id)!;
    assert.ok(item,id);assert.equal(item.basis,'editorial-assumption');assert.equal(item.low,0);assert.equal(item.high,0);
    assert.ok(item.sources.some(source=>/assumption.*not measured/i.test(source.title)),id);
    assert.equal(item.bottleIds,undefined);
  }
  for(const id of ['blackstrap-rum','martinique-rum','blended-aged-rum']){
    const item=drinkStrengthContent.references.find(item=>item.ingredientId===id)!;
    assert.equal(item.basis,'editorial-assumption');assert.equal(item.low,40);assert.equal(item.high,40);
    assert.ok(item.sources.some(source=>/40%.*simulation.*not.*producer/i.test(source.title)),id);
    assert.equal(item.bottleIds,undefined);
  }
  const molasses=drinkStrengthContent.references.find(item=>item.ingredientId==='martinique-rum')!;
  assert.ok(molasses.sources.every(source=>!source.url.includes('rhumjm')&&!source.url.includes('rhum-clement')));
});

test('every evidence link has a review date and profile assumptions describe their actual scope', () => {
  assert.equal(new Set(drinkStrengthContent.references.map(item=>item.ingredientId)).size,drinkStrengthContent.references.length);
  for(const item of [...drinkStrengthContent.references,...drinkStrengthContent.profiles]){
    assert.ok(item.sources.length>0);
    for(const source of item.sources){
      assert.match(source.url,/^https:\/\//);assert.ok(source.title.trim());
      assert.match(source.checkedAt,/^\d{4}-\d{2}-\d{2}$/);
      assert.equal(new Date(source.checkedAt).toISOString().slice(0,10),source.checkedAt);
    }
  }
  for(const [id,scope] of [['espresso-martini-iba',/30 ml.*espresso/i],['three-dots-and-a-dash-iba',/1 ml.*dash/i],['old-fashioned-iba',/three.*dash/i],['mojito-iba',/60 ml.*soda/i]] as const){
    const profile=drinkStrengthContent.profiles.find(item=>item.versionId===id)!;
    assert.ok(profile.sources.some(source=>scope.test(source.title)),id);
  }
});

test('all twenty reviewed source batches produce an identified before-ice reference without mutating maintained inputs', () => {
  const before=JSON.stringify({catalogue,bottles,drinkStrengthContent});
  for(const id of Object.keys(reviewedFormats)){
    const recipe=recipeSnapshot(catalogue,id)!;
    const result=analyzeDrinkStrength(recipe,catalogue,bottles,drinkStrengthContent,{});
    assert.equal(result.status,'estimated',`${id}: ${result.missingRowIds.join(', ')}`);
    assert.ok(result.beforeIce&&result.beforeIce.low>0&&result.beforeIce.high>=result.beforeIce.low&&result.beforeIce.high<=100,id);
    assert.equal(result.diluted,null,'unknown meltwater does not produce a diluted estimate');
    assert.equal(result.format?.format,reviewedFormats[id as keyof typeof reviewedFormats]);
    for(const row of result.rows.filter(row=>row.included)){
      assert.ok(row.volumeMl!==null,row.rowId);
      if(row.volumeMl>0){assert.ok(row.abv,row.rowId);assert.ok(row.sources.length,row.rowId);}
    }
  }
  assert.equal(JSON.stringify({catalogue,bottles,drinkStrengthContent}),before);
});

test('each guarded format and volume assumption is rejected when its frozen recipe identity changes', () => {
  for(const id of Object.keys(reviewedFormats)){
    const original=recipeSnapshot(catalogue,id)!;
    const changed=structuredClone(original);
    changed.version.servings+=1;
    const result=analyzeDrinkStrength(changed,catalogue,bottles,drinkStrengthContent,{});
    assert.equal(result.format,undefined,id);
    assert.ok(result.rows.every(row=>row.volumeBasis!=='profile-assumption'),id);
    const changedSource=structuredClone(original);
    changedSource.source.url='https://example.com/unreviewed';
    assert.equal(analyzeDrinkStrength(changedSource,catalogue,bottles,drinkStrengthContent,{}).format,undefined,id);
  }
});

test('reference calculations preserve US-ounce equivalence, batch scaling, and independent format classification', () => {
  const recipe=recipeSnapshot(catalogue,'negroni-iba')!;
  const base=analyzeDrinkStrength(recipe,catalogue,bottles,drinkStrengthContent,{});
  assert.ok(base.beforeIce);
  assert.ok(Math.abs(base.beforeIce.low-80/3)<1e-10);
  assert.ok(Math.abs(base.beforeIce.high-87.3/3)<1e-10);
  const ounces=structuredClone(recipe);
  for(const row of ounces.version.ingredients){row.amount=row.amount!/29.5735295625;row.unit='oz';}
  const converted=analyzeDrinkStrength(ounces,catalogue,bottles,drinkStrengthContent,{});
  assert.ok(converted.beforeIce);assert.ok(Math.abs(converted.beforeIce.low-base.beforeIce.low)<1e-10);
  const doubled=analyzeDrinkStrength(recipe,catalogue,bottles,drinkStrengthContent,{servings:2});
  assert.equal(doubled.totalMl,180);assert.deepEqual(doubled.beforeIce,base.beforeIce);
  const zero=analyzeDrinkStrength(recipe,catalogue,bottles,drinkStrengthContent,{abv:{'negroni-iba:0':0,'negroni-iba:1':0,'negroni-iba:2':0}});
  assert.deepEqual(zero.beforeIce,{low:0,high:0});assert.equal(zero.format?.format,'short');
});

test('external producer references do not fill an explicitly selected catalogue bottle with unknown alcohol', () => {
  const recipe=recipeSnapshot(catalogue,'espresso-martini-iba')!;
  const result=analyzeDrinkStrength(recipe,catalogue,bottles.map(bottle=>bottle.id==='kahlua-coffee-liqueur'?{...bottle,abv:null}:bottle),drinkStrengthContent,{bottleIds:{'espresso-martini-iba:1':'kahlua-coffee-liqueur'}});
  assert.equal(result.beforeIce,null);
  assert.equal(result.rows[1]!.abv,null);assert.equal(result.rows[1]!.abvBasis,'unknown');
  const unreviewed=structuredClone(recipe);
  unreviewed.version.ingredients[3]!.unit='g';
  const unknownVolume=analyzeDrinkStrength(unreviewed,catalogue,bottles,drinkStrengthContent,{});
  assert.equal(unknownVolume.rows[3]!.volumeMl,null);assert.equal(unknownVolume.beforeIce,null);
});

test('the source-specified Smirnoff example does not borrow an unrelated vodka endpoint', () => {
  const result=analyzeDrinkStrength(recipeSnapshot(catalogue,'moscow-mule-iba')!,catalogue,bottles,drinkStrengthContent,{});
  assert.deepEqual(result.rows[0]!.abv,{low:37.5,high:37.5});
  assert.ok(result.rows[0]!.sources.some(source=>source.market?.includes('Ireland')));
  assert.ok(result.rows[0]!.sources.every(source=>!source.url.includes('ketelone.com')));
});

test('an uncovered source version does not inherit classifications or catalogue-wide alcohol guesses', () => {
  const result=analyzeDrinkStrength(recipeSnapshot(catalogue,'sidecar-iba')!,catalogue,bottles,drinkStrengthContent,{});
  assert.equal(result.format,undefined);assert.equal(result.beforeIce,null);
  assert.equal(result.rows[0]!.ingredientId,'cognac');assert.equal(result.rows[0]!.abv,null);
  assert.ok(result.missingRowIds.includes('sidecar-iba:0'));
});

test('Tom Collins uses a guarded editorial Old Tom assumption rather than London Dry endpoints',()=>{
  const recipe=recipeSnapshot(catalogue,'tom-collins-iba')!;
  const result=analyzeDrinkStrength(recipe,catalogue,bottles,drinkStrengthContent);
  const row=result.rows[0]!;
  assert.deepEqual(row.abv,{low:40,high:40});assert.equal(row.abvBasis,'editorial-assumption');
  assert.ok(row.sources.some(source=>source.url==='https://iba-world.com/iba-cocktail/john-collins/'&&/Old Tom.*40%.*simulation assumption/i.test(source.title)));
  assert.ok(row.sources.every(source=>!source.url.includes('bombay')&&!source.url.includes('tanqueray')));
  const changed={...recipe,source:{...recipe.source,url:'https://example.com/unreviewed-collins'}};
  const stale=analyzeDrinkStrength(changed,catalogue,bottles,drinkStrengthContent);
  assert.equal(stale.format,undefined);assert.equal(stale.rows[0]!.abvBasis,'producer-example');
  assert.deepEqual(stale.rows[0]!.abv,{low:40,high:47.3});
});
