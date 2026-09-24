import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from './catalogue';
import {researchTopics} from './topics';
import {buildTopicDirectory} from '../domain/research/directory';
import {searchCocktails} from '../domain/search';

test('published origins link to real topics containing that exact source version',()=>{
  for(const version of catalogue.versions.filter(v=>v.origin)){
    const origin=version.origin!;
    const topic=researchTopics.find(t=>t.id===origin.topicId);
    assert.ok(topic,version.id);
    assert.ok(topic.versionIds.includes(version.id),version.id);
    assert.equal(topic.kind??'competition',origin.kind);
    assert.ok(origin.countryCodes.length);
  }
});

test('the bar Sling remains one cocktail card and opens the requested bar version',()=>{
  assert.equal(catalogue.cocktails.filter(c=>c.id==='singapore-sling').length,1);
  const result=searchCocktails(catalogue,{recipeCategory:'bar',text:'Singapore Sling'}).find(r=>r.cocktailId==='singapore-sling');
  assert.equal(result?.selectedVersionId,'singapore-sling-jigger-pony-bar-k');
  assert.equal(result?.versionIds.length,1);
});

test('promoting a research work preserves its evidence without inflating directory counts',()=>{
  const topic=researchTopics.find(t=>t.id==='patron-perfectionists-2018-selection')!;
  const linked=topic.research!.filter(work=>work.catalogueVersionId);
  assert.equal(linked.length,2);
  for(const work of linked)assert.ok(topic.versionIds.includes(work.catalogueVersionId!));
  assert.equal(buildTopicDirectory([topic],catalogue,'en')[0]!.workCount,topic.research!.length);
});
