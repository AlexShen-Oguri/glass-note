/// <reference types="node" />

import assert from 'node:assert/strict';
import test from 'node:test';
import {catalogue} from '../../content/catalogue';
import type {Catalogue} from '../contracts';
import * as api from './index';
import {evaluateOwnedVersion} from './presence';
import type {Pantry} from './types';

const pantry = (ingredientIds: string[], brandsByIngredient: Pantry['brandsByIngredient'] = {}): Pantry => ({ingredientIds, brandsByIngredient});
const salineIds = ['saline-solution', 'saline-five-one', 'saline-twenty-percent', 'food-brine'];

test('a deleted concept representative falls back consistently for display, ownership and purchase',()=>{
  const data={...catalogue,ingredients:catalogue.ingredients.filter(item=>item.id!=='food-generic-whisky')};
  assert.equal(api.canonicalIngredientId(data,'scotch-whisky'),'scotch-whisky');
  assert.ok(api.canonicalIngredientEntries(data).every(entry=>data.ingredients.some(item=>item.id===entry.ingredient.id)));
  assert.deepEqual(api.setCanonicalOwned(data,pantry([]),'scotch-whisky',true).ingredientIds,['scotch-whisky']);
});

test('guarded source alternatives preserve distinct flavor identities while satisfying the source row',()=>{
  for(const [versionId,rowIndex,acceptedIngredientIds] of [
    ['virgin-mary-batch-m',2,['pickle-brine','green-olive-brine']],
    ['vermouth-tonic-batch-m',0,['sweet-red-vermouth','bianco-vermouth']],
  ] as const){
    const version=catalogue.versions.find(item=>item.id===versionId)!;
    const row=version.ingredients[rowIndex]!;
    const data:Catalogue={...catalogue,materialRequirements:[{versionId,rowIndex,originalRow:structuredClone(row),sourceName:catalogue.ingredients.find(item=>item.id===row.ingredientId)!.name,acceptedIngredientIds:[...acceptedIngredientIds]}]};
    for(const supply of acceptedIngredientIds){
      const owned=pantry([...version.ingredients.filter((_,index)=>index!==rowIndex).map(item=>item.ingredientId),supply]);
      assert.deepEqual(evaluateOwnedVersion(data,version,owned)!.missingIngredientIds,[],`${versionId}: ${supply}`);
    }
    assert.notEqual(api.canonicalIngredientId(data,acceptedIngredientIds[0]),api.canonicalIngredientId(data,acceptedIngredientIds[1]));
  }
});

test('all guarded source alternatives accept only their reviewed identities and preserve the row guard', () => {
  const requirements = catalogue.materialRequirements!.filter(item => item.acceptedIngredientIds?.length);
  assert.equal(requirements.length, 7);
  for (const requirement of requirements) {
    const recipe = catalogue.versions.find(item => item.id === requirement.versionId)!;
    const remaining = recipe.ingredients.filter((_row, index) => index !== requirement.rowIndex).map(row => row.ingredientId);
    for (const id of requirement.acceptedIngredientIds!) {
      const match = evaluateOwnedVersion(catalogue, recipe, pantry([...remaining, id]))!;
      assert.deepEqual(match.missingIngredientIds, [], `${recipe.id}: ${id}`);
      assert.equal(api.pantryMatches(catalogue, pantry([...remaining, id])).find(item => item.versionId === recipe.id)?.missingIngredientIds.length, 0);
      if (recipe.id === 'carino-batch-j' && id === 'genepy-liqueur') {
        assert.equal(match.unconfirmedBrands.some(item => item.brandId === 'brand-chartreuse'), false, 'accepted génépy does not require a Chartreuse bottle');
      }
    }
    const changed = {...recipe, ingredients: recipe.ingredients.map((row, index) => index === requirement.rowIndex ? {...row, amount: (row.amount ?? 0) + 1} : row)};
    const data: Catalogue = {...catalogue, versions: catalogue.versions.map(item => item.id === changed.id ? changed : item)};
    const alternative = requirement.acceptedIngredientIds!.find(id => id !== requirement.originalRow.ingredientId)!;
    assert.equal(api.resolveRecipeMaterial(data, changed, requirement.rowIndex, [alternative]).match, 'missing', `${recipe.id}: changed row must reject stale OR`);
  }
  const vermouth = catalogue.versions.find(item => item.id === 'vermouth-tonic-batch-m')!;
  assert.equal(api.resolveRecipeMaterial(catalogue, vermouth, 0, ['food-vermouth']).match, 'missing');
});

test('actual generic whisky, bourbon and Scotch with soda satisfy both Highball source versions', () => {
  for (const supply of ['food-generic-whisky', 'bourbon-whiskey', 'scotch-whisky']) {
    const owned = pantry([supply, 'soda-water']);
    const before = structuredClone(owned);
    for (const versionId of ['whiskey-highball-batch-f', 'scotch-and-soda-batch-f']) {
      const recipe = catalogue.versions.find(item => item.id === versionId)!;
      const match = evaluateOwnedVersion(catalogue, recipe, owned)!;
      assert.deepEqual(match.missingIngredientIds, [], `${supply}: ${versionId}`);
      assert.equal(match.baseReady, true);
      assert.equal(match.status, 'ready');
      assert.equal(api.pantryMatches(catalogue, owned).find(item => item.versionId === versionId)?.status, 'ready');
    }
    assert.deepEqual(owned, before, 'matching must preserve actual owned IDs');
  }
});

test('each ordinary saline legacy ID satisfies every actual ordinary saline recipe row', () => {
  for (const recipe of catalogue.versions.filter(item => item.ingredients.some(row => salineIds.includes(row.ingredientId)))) {
    for (const supply of salineIds) {
      const owned = pantry([...new Set(recipe.ingredients.filter(row => !salineIds.includes(row.ingredientId)).map(row => row.ingredientId)), supply]);
      const match = evaluateOwnedVersion(catalogue, recipe, owned)!;
      assert.deepEqual(match.missingIngredientIds, [], `${recipe.id}: ${supply}`);
      assert.deepEqual(match.optionalMissingIngredientIds, [], `${recipe.id}: ${supply}`);
    }
  }
});

test('canonical ownership reads aliases, avoids duplicates and removes all direct aliases with their brands', () => {
  const owned = pantry(['saline-five-one', 'saline-twenty-percent', 'unknown-kept', 'gin'], {
    'saline-five-one': ['old-a'], 'saline-twenty-percent': ['old-b'], 'unknown-kept': ['unknown-brand'], gin: ['brand-roku'],
  });
  const before = structuredClone(owned);
  assert.equal(api.canonicalOwned(catalogue, owned, 'food-brine'), true);
  assert.deepEqual(api.setCanonicalOwned(catalogue, owned, 'saline-solution', true), owned);
  assert.deepEqual(api.setCanonicalOwned(catalogue, owned, 'saline-solution', false), {
    ingredientIds: ['unknown-kept', 'gin'],
    brandsByIngredient: {'unknown-kept': ['unknown-brand'], gin: ['brand-roku']},
  });
  assert.deepEqual(api.setCanonicalOwned(catalogue, pantry([]), 'saline-five-one', true), pantry(['saline-solution']));
  assert.deepEqual(owned, before);
});

test('canonical entries aggregate original source usage and search aliases without changing composition evidence', () => {
  const entries = api.canonicalIngredientEntries(catalogue);
  const whiskey = entries.find(item => item.ingredient.id === 'food-generic-whisky')!;
  const representative = catalogue.ingredients.find(item => item.id === 'food-generic-whisky')!;
  assert.equal(entries.filter(item => salineIds.includes(item.ingredient.id)).length, 1);
  assert.ok(whiskey.memberIds?.includes('bourbon-whiskey'));
  assert.ok(whiskey.versions.some(item => item.id === 'whiskey-highball-batch-f'));
  assert.ok(whiskey.versions.some(item => item.id === 'scotch-and-soda-batch-f'));
  assert.ok(whiskey.brandIds.includes('brand-lagavulin'));
  assert.equal(whiskey.ingredient.compositionKnown, false);
  assert.deepEqual(whiskey.ingredient.exclusionTags, representative.exclusionTags);
  assert.deepEqual(whiskey.ingredient.guide?.source, representative.guide?.source);
  for (const text of ['bourbon-whiskey', '波本威士忌', 'scotch whiskey']) {
    assert.ok(api.filterIngredientEntries(entries, catalogue, text, 'en').some(item => item.ingredient.id === 'food-generic-whisky'), text);
  }
  assert.equal(api.ingredientEntries(catalogue).length, catalogue.ingredients.length);
});

test('source-scoped alternatives appear in canonical usage without inheriting the original brand', () => {
  const entries = api.canonicalIngredientEntries(catalogue);
  const genepy = entries.find(item => item.ingredient.id === 'genepy-liqueur')!;
  assert.ok(genepy.versions.some(item => item.id === 'carino-batch-j'));
  assert.ok(genepy.sourceIds.includes(catalogue.versions.find(item => item.id === 'carino-batch-j')!.sourceId));
  assert.equal(genepy.brandIds.includes('brand-chartreuse'), false);
  const recipe = catalogue.versions.find(item => item.id === 'carino-batch-j')!;
  const edited = {...recipe, ingredients: recipe.ingredients.map((row, index) => index === 1 ? {...row, amount: 6} : row)};
  const data: Catalogue = {...catalogue, versions: catalogue.versions.map(item => item.id === edited.id ? edited : item)};
  assert.equal(api.canonicalIngredientEntries(data).find(item => item.ingredient.id === 'genepy-liqueur')!.versions.some(item => item.id === edited.id), false);
});

test('resolver retains actual supply IDs, distinguishes reviewed styles and refuses flavored or unknown supply', () => {
  assert.deepEqual(api.resolveMaterial(catalogue, 'scotch-whisky', ['food-generic-whisky']), {
    requiredIngredientId: 'scotch-whisky', canonicalId: 'food-generic-whisky', supplyIngredientIds: ['food-generic-whisky'], match: 'style',
  });
  assert.equal(api.resolveMaterial(catalogue, 'gin', ['lime-gin']).match, 'missing');
  assert.equal(api.resolveMaterial(catalogue, 'lime-gin', ['gin']).match, 'missing');
  assert.equal(api.resolveMaterial(catalogue, 'saline-solution', ['olive-brine']).match, 'missing');
  assert.equal(api.resolveMaterial(catalogue, 'saline-five-one', ['food-brine']).match, 'equivalent');
  assert.equal(api.resolveMaterial(catalogue, 'unknown', ['unknown']).match, 'missing');
  assert.equal(api.canonicalIngredientId(catalogue, 'unknown'), 'unknown');
  assert.deepEqual(api.canonicalMemberIds(catalogue, 'unknown'), ['unknown']);
});

test('catalogues without reviewed concepts preserve exact matching and observe catalogue edits', () => {
  const data: Catalogue = {...catalogue, materialConcepts: undefined, materialRequirements: undefined};
  assert.equal(api.resolveMaterial(data, 'gin', ['gin']).match, 'exact');
  assert.equal(api.resolveMaterial(data, 'scotch-whisky', ['food-generic-whisky']).match, 'missing');
  assert.deepEqual(api.canonicalIngredientEntries(data), api.ingredientEntries(data));
  data.materialConcepts = catalogue.materialConcepts;
  assert.equal(api.resolveMaterial(data, 'scotch-whisky', ['food-generic-whisky']).match, 'style');
  data.ingredients = data.ingredients.filter(item => item.id !== 'food-generic-whisky');
  assert.equal(api.resolveMaterial(data, 'scotch-whisky', ['food-generic-whisky']).match, 'missing');
});

test('separate compiled operations and public resolutions observe in-place concept and source edits', () => {
  const compile = Reflect.get(api, 'compileMaterialResolver') as (data: Catalogue) => {
    resolveMaterial: typeof api.resolveMaterial extends (data: Catalogue, ...args: infer Args) => infer Result ? (...args: Args) => Result : never;
    resolveRecipeMaterial: typeof api.resolveRecipeMaterial extends (data: Catalogue, ...args: infer Args) => infer Result ? (...args: Args) => Result : never;
  };
  assert.equal(typeof compile, 'function', 'the operation-local resolver compiler must be exported');
  const data: Catalogue = {...catalogue, ingredients: [...catalogue.ingredients],
    materialConcepts: structuredClone(catalogue.materialConcepts), materialRequirements: structuredClone(catalogue.materialRequirements)};
  const version = data.versions.find(item => item.id === 'vermouth-tonic-batch-m')!;
  const first = compile(data);
  assert.equal(first.resolveMaterial('scotch-whisky', ['bourbon-whiskey']).match, 'style');
  assert.equal(first.resolveRecipeMaterial(version, 0, ['bianco-vermouth']).match, 'equivalent');
  const whiskey = data.materialConcepts!.find(item => item.id === 'food-generic-whisky')!;
  whiskey.memberIds.splice(whiskey.memberIds.indexOf('bourbon-whiskey'), 1);
  const requirement = data.materialRequirements!.find(item => item.versionId === version.id)!;
  requirement.acceptedIngredientIds!.splice(requirement.acceptedIngredientIds!.indexOf('bianco-vermouth'), 1);
  const next = compile(data);
  assert.equal(next.resolveMaterial('scotch-whisky', ['bourbon-whiskey']).match, 'missing');
  assert.equal(next.resolveRecipeMaterial(version, 0, ['bianco-vermouth']).match, 'missing');
  assert.equal(api.resolveMaterial(data, 'scotch-whisky', ['bourbon-whiskey']).match, 'missing');
  assert.equal(api.resolveRecipeMaterial(data, version, 0, ['bianco-vermouth']).match, 'missing');
});
