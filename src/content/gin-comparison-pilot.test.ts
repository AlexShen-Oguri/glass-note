import assert from 'node:assert/strict';
import test from 'node:test';
import {bottles} from './bottles';
import {catalogue} from './catalogue';
import {GIN_COMPARISON_PILOT_INGREDIENT_ID,ginComparisonPilot} from './gin-comparison-pilot';
import {LOCALES} from '../domain/contracts';

test('Gin & Tonic pilot binds three real gin records to one exact public source version',()=>{
  assert.equal(ginComparisonPilot.bottles.length,3);
  assert.equal(new Set(ginComparisonPilot.bottles.map(item=>item.bottleId)).size,3);
  const version=catalogue.versions.find(item=>item.id===ginComparisonPilot.versionId);
  assert.ok(version);
  assert.equal(version.cocktailId,'gin-and-tonic');
  assert.equal(version.sourceId,'diffords-gin-and-tonic');
  assert.ok(version.ingredients.some(item=>item.ingredientId===GIN_COMPARISON_PILOT_INGREDIENT_ID));
  for(const record of ginComparisonPilot.bottles){
    const bottle=bottles.find(item=>item.id===record.bottleId);
    assert.ok(bottle,record.bottleId);
    assert.ok(bottle.ingredientIds.includes(record.supportedIngredientId));
    assert.equal(record.evidence.basis,'producer');
    assert.ok(['official-page-open','official-page-search-extract'].includes(record.evidence.retrieval));
    assert.match(record.evidence.url,/^https:\/\//);
    assert.ok(Number.isFinite(Date.parse(record.evidence.checkedAt)));
    assert.equal(record.actualBottleAbv,null);
    for(const locale of LOCALES)assert.ok(record.flavourSummary[locale].trim(),`${record.bottleId}:${locale}`);
  }
});

test('pilot evidence is explicit about the actual-bottle ABV boundary',()=>{
  for(const record of ginComparisonPilot.bottles){
    const catalogueBottle=bottles.find(item=>item.id===record.bottleId)!;
    assert.equal(typeof catalogueBottle.abv,'number');
    assert.equal(record.actualBottleAbv,null,'catalogue ABV must not become a claim about the physical bottle');
  }
});
