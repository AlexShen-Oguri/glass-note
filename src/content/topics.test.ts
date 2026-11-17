import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {researchTopics} from './topics';
import {catalogue} from './catalogue';

test('original competition preparations retain reviewed source ingredient forms and doses',()=>{
  const selection=JSON.parse(readFileSync(new URL('../../research/competitions/recipe-selection.json',import.meta.url),'utf8')) as {works:Array<{id:string;url:string;sourceIngredients?:Array<{preparationId:string;name:string;amount:string;species?:null}>}>};
  for(const source of selection.works.filter(work=>work.sourceIngredients?.length)){
    const work=researchTopics.flatMap(topic=>topic.research??[]).find(work=>work.id===source.id)!;
    assert.equal(work.source?.url,source.url);
    for(const fact of source.sourceIngredients!){
      const preparation=work.preparations!.find(preparation=>preparation.id===fact.preparationId)!;
      const ingredient=preparation.ingredients.find(ingredient=>'name' in ingredient&&ingredient.name.en.toLowerCase()===fact.name.toLowerCase());
      assert(ingredient,`${work.id}/${fact.preparationId} omitted the source form: ${fact.name}`);
      assert.equal(ingredient.amount,fact.amount);
    }
  }
});

test('year collections preserve exact source versions and never infer full competition coverage',()=>{
  const years=researchTopics.filter(t=>t.id.startsWith('suntory-'));
  assert.deepEqual(years.map(t=>t.year),[2025,2024,2023]);
  for(const topic of years){assert.equal(topic.officialCount,topic.year===2023?12:8);assert.equal(topic.scope,'published-finalist-works');assert.ok(topic.versionIds.length>0);for(const id of topic.versionIds){
    const version=catalogue.versions.find(v=>v.id===id)!;assert.ok(version);assert.equal(catalogue.sources.find(s=>s.id===version.sourceId)?.url,topic.source.url);
  }}
});
test('recipe research removes name-only cards and topics left without recipes',()=>{
  assert.ok(!researchTopics.some(topic=>topic.id==='bacardi-legacy-2019-japan'||topic.id==='patron-perfectionists-2016'));
  const selected=researchTopics.filter(topic=>topic.id.startsWith('patron-perfectionists-')||topic.id.startsWith('angostura-'));
  assert.ok(selected.length>=2);
  for(const work of selected.flatMap(topic=>topic.research??[])){
    assert.equal(work.disclosure,'published-recipe');
    assert.ok(work.materials.length>0);
    assert.ok(work.method?.length);
  }
});

test('selected international recipe topics trace all 16 works without changing catalogue versions',()=>{
  const ids=['angostura-global-cocktail-challenge-2008-2018-selection','patron-perfectionists-2018-selection','world-class-us-2024-winner-recipes'];
  const topics=ids.map(id=>researchTopics.find(topic=>topic.id===id)!);
  assert.ok(topics.every(Boolean));
  assert.equal(topics.reduce((sum,topic)=>sum+(topic.research?.length??0),0),16);
  assert.ok(new Set(topics.map(topic=>topic.organization)).size>=2);
  for(const topic of topics){
    assert.equal(topic.versionIds.length,topic.id==='patron-perfectionists-2018-selection'?2:0);
    assert.match(topic.source.url,/^https:\/\//);
    for(const work of topic.research!){
      assert.ok(work.title&&work.author&&work.region&&work.award);
      assert.ok(work.source?.url.startsWith('https://'));
      assert.ok(!catalogue.versions.some(version=>version.id===work.id));
    }
  }
});

test('research recipe completeness is explicit and never implied by ingredient names alone',()=>{
  const added=researchTopics.filter(topic=>topic.id.includes('patron-perfectionists')||topic.id.startsWith('angostura-')||topic.id==='world-class-us-2024-winner-recipes').flatMap(topic=>topic.research??[]);
  assert.equal(added.filter(work=>work.disclosure==='published-recipe').length,16);
  assert.equal(added.filter(work=>work.disclosure==='identity-only').length,0);
  for(const work of added.filter(work=>work.disclosure==='published-recipe')){
    assert.ok(work.materials.length>=4);
    assert.ok((work.method?.length??0)>=2);
    assert.ok(work.summary);
  }
  for(const work of added.filter(work=>work.disclosure==='identity-only')) assert.deepEqual(work.materials,[]);
});

test('Patrón adds six quantified recipes and their essential preparations while retaining original works',()=>{
  const topic=researchTopics.find(topic=>topic.id==='patron-perfectionists-2018-selection')!;
  assert.equal(topic.officialCount,20);
  assert.equal(topic.research?.length,8);
  const complete=topic.research!.filter(work=>!work.catalogueVersionId);
  assert.equal(complete.length,6);
  for(const id of ['wind','harmony','best-promise','cyanocitta','balancing-act','maestranza']){
    const work=complete.find(work=>work.id===`patron-2018-${id}`)!;
    assert.ok(work,`${id} needs a recipe, not an identity card`);
    assert.ok(!work.missingDetails?.length);
    assert.ok(work.preparations?.length);
    assert.equal(work.source?.checkedAt,'2026-10-13');
    for(const material of work.materials) assert.ok('name' in material&&material.amount?.trim());
    for(const preparation of work.preparations!){
      assert.ok(preparation.method.length);
      for(const ingredient of preparation.ingredients) assert.ok(ingredient.amount?.trim());
    }
  }
  const best=complete.find(work=>work.id==='patron-2018-best-promise')!;
  const tea=best.materials.at(-1)!;
  assert.ok('name' in tea);
  assert.equal(tea.name.en,'Green tea');
  assert.match(best.preparations![0]!.method.join(' '),/60 minutes/);
  const maestranza=complete.find(work=>work.id==='patron-2018-maestranza')!;
  assert.deepEqual(maestranza.preparations!.at(-1)!.ingredients.map(row=>row.amount),['4 parts','3 parts']);
  assert.match(maestranza.preparations![1]!.method.join(' '),/3 days/);
  assert.match(maestranza.preparations![1]!.method.join(' '),/2 days/);
  assert.match(maestranza.preparations![1]!.method.join(' '),/release.*gas/);
});

test('Angostura selection keeps six dated winner recipes and source-exact products and measures',()=>{
  const topic=researchTopics.find(topic=>topic.id==='angostura-global-cocktail-challenge-2008-2018-selection')!;
  assert.ok(topic);
  assert.equal(topic.year,2008);
  assert.equal(topic.yearEnd,2018);
  assert.equal(topic.officialCount,null);
  assert.deepEqual(topic.versionIds,[]);
  assert.deepEqual(topic.research!.map(work=>work.year),[2008,2011,2011,2014,2014,2018]);
  for(const work of topic.research!){
    assert.equal(work.disclosure,'published-recipe');
    assert.ok(!work.missingDetails?.length);
    assert.equal(work.source?.url,`https://angosturaglobalcocktailchallenge.com/winners/?Y=${work.year}`);
    assert.equal(work.source?.checkedAt,'2026-10-13');
    for(const material of work.materials) assert.ok('name' in material&&material.amount?.trim());
    assert.ok(work.method?.length);
  }
  const big=topic.research!.find(work=>work.title==='Big Bird')!;
  assert.ok(big.materials.some(row=>'name' in row&&row.name.en==="Crawley's Spiced Honey Apple"&&row.amount==='20 ml'));
  const olympia=topic.research!.find(work=>work.title==='Olympia')!;
  assert.ok(olympia.materials.some(row=>'name' in row&&row.name.en==='Paul Simon Fig & Lemon Jam'&&row.amount==='1 bar spoon'));
  const bitters=olympia.materials.at(-1)!;
  assert.ok('name' in bitters);
  assert.equal(bitters.amount,'6 dashes');
  assert.match(olympia.method!.join(' '),/1 dash/);
  assert.match(olympia.method!.join(' '),/5 dashes/);
});

test('Dauntless Dessert separates the finished serve from both published preparations',()=>{
  const work=researchTopics.flatMap(topic=>topic.research??[]).find(row=>row.id==='patron-2018-dauntless-dessert')!;
  assert.equal(work.preparations?.length,2);
  const oleo=work.preparations?.find(prep=>prep.id==='grapefruit-oleo-acid')!;
  assert.deepEqual(oleo.ingredients.map(row=>row.amount),['zest of 10 grapefruits','2 lb','2.5 oz','1 L']);
  assert.equal(oleo.method.length,4);
  assert.match(oleo.method.join(' '),/24–48 hours/);
  const tea=work.preparations?.find(prep=>prep.id==='black-tea-syrup')!;
  assert.deepEqual(tea.ingredients.map(row=>row.amount),['10 bags','1 L','1 lb']);
  assert.match(tea.method.join(' '),/5–8 minutes/);
});

test('the other published research recipes state every known bespoke-component gap',()=>{
  const works=researchTopics.flatMap(topic=>topic.research??[]);
  for(const id of ['patron-2018-godfathers-affinity','world-class-us-2024-such-great-heights','world-class-us-2024-apples-for-whales']){
    const work=works.find(row=>row.id===id)!;
    assert.ok((work.missingDetails?.length??0)>=3);
  }
  const heights=works.find(row=>row.id==='world-class-us-2024-such-great-heights')!;
  assert.ok(!heights.method?.join(' ').includes('coffee-to-coconut-water'));
  assert.match(heights.preparations?.[0]?.ingredients[0]?.amount??'',/direction and weight\/volume basis are not specified/);
});
