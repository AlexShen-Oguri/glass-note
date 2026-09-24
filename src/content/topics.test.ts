import assert from 'node:assert/strict';
import test from 'node:test';
import {researchTopics} from './topics';
import {catalogue} from './catalogue';

test('year collections preserve exact source versions and never infer full competition coverage',()=>{
  const years=researchTopics.filter(t=>t.id.startsWith('suntory-'));
  assert.deepEqual(years.map(t=>t.year),[2025,2024,2023]);
  for(const topic of years){assert.equal(topic.officialCount,topic.year===2023?12:8);assert.equal(topic.scope,'published-finalist-works');assert.ok(topic.versionIds.length>0);for(const id of topic.versionIds){
    const version=catalogue.versions.find(v=>v.id===id)!;assert.ok(version);assert.equal(catalogue.sources.find(s=>s.id===version.sourceId)?.url,topic.source.url);
  }}
});
test('Bacardi finalist directory keeps missing-quantity research outside the recipe catalogue',()=>{
  const topic=researchTopics.find(t=>t.id==='bacardi-legacy-2019-japan')!;
  assert.equal(topic.scope,'national-finalists');assert.equal(topic.officialCount,5);assert.equal(topic.research?.length,5);assert.deepEqual(topic.versionIds,[]);
  assert.equal(topic.source.publishedAt,'2018-11-22');assert.equal(topic.year,2019);
  for(const row of topic.research!){assert.ok(!catalogue.versions.some(v=>v.id===row.id));assert.ok(row.materials.length>0);assert.ok(row.original&&row.original.length>0);}
});

test('round eleven adds three official competition topics and 19 traceable works',()=>{
  const ids=['patron-perfectionists-2016','patron-perfectionists-2018-selection','world-class-us-2024-winner-recipes'];
  const topics=ids.map(id=>researchTopics.find(topic=>topic.id===id)!);
  assert.ok(topics.every(Boolean));
  assert.equal(topics.reduce((sum,topic)=>sum+(topic.research?.length??0),0),19);
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
  const added=researchTopics.filter(topic=>topic.id.includes('patron-perfectionists')||topic.id==='world-class-us-2024-winner-recipes').flatMap(topic=>topic.research??[]);
  assert.equal(added.filter(work=>work.disclosure==='published-recipe').length,4);
  assert.equal(added.filter(work=>work.disclosure==='identity-only').length,15);
  for(const work of added.filter(work=>work.disclosure==='published-recipe')){
    assert.ok(work.materials.length>=5);
    assert.ok((work.method?.length??0)>=2);
    assert.ok(work.summary);
  }
  for(const work of added.filter(work=>work.disclosure==='identity-only')) assert.deepEqual(work.materials,[]);
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
