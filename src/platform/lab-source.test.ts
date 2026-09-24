import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from '../content/catalogue';
import {getRecipePreparation} from '../domain/preparations';
import {recipeLabSource} from '../domain/lab/recipeSource';
import {preparationCopy} from '../i18n/preparations';

test('copying recipe preserves amounts, servings and full preparation metadata outside glass ingredient rows',()=>{
  for(const id of ['houmei-batch-h','pearl-diver-batch-f','penicillin-punch-proper-drink','uchimizu-batch-h']){
    const v=catalogue.versions.find(v=>v.id===id)!;const before=JSON.stringify(v);const prep=getRecipePreparation(id)!;
    const source=recipeLabSource(catalogue,v,'en',prep);
    assert.equal(source.versionId,id);assert.equal(source.ingredients.length,v.ingredients.length);
    assert.deepEqual(source.ingredients.map(i=>[i.ingredientId,i.amount,i.unit]),v.ingredients.map(i=>[i.ingredientId,i.amount===null?'':String(i.amount),i.unit]));
    assert.ok(source.method.includes(preparationCopy('en')[prep.status]));
    if(prep.cards.some(c=>c.status==='undisclosed'))assert.ok(source.method.includes(preparationCopy('en').undisclosed));
    for(const card of prep.cards){for(const field of ['equipment','timing','temperature','yield'] as const)if(card[field])assert.ok(source.method.includes(card[field]!.en));for(const gap of card.gaps)assert.ok(source.method.includes(gap.en));for(const s of card.sources){assert.ok(source.method.includes(s.title));assert.ok(source.method.includes(s.url));}}
    assert.equal(JSON.stringify(v),before);
  }
});
test('source copy rejects preparations belonging to a different recipe version',()=>{
  const v=catalogue.versions.find(v=>v.id==='houmei-batch-h')!;
  assert.throws(()=>recipeLabSource(catalogue,v,'en',getRecipePreparation('pearl-diver-batch-f')),/source-preparation-version-mismatch/);
});
