import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import {catalogue} from './catalogue';
import {LOCALES, type Ingredient, type MaterialConcept} from '../domain/contracts';
import {buildMaterialConcepts,buildRecipeMaterialRequirements,recipeMaterialRequirement} from './ingredients/concepts';

// Exact legacy entries remain the observable fallback before the new index exists.
function conceptFor(id:string):MaterialConcept {
  return catalogue.materialConcepts?.find(concept=>concept.memberIds.includes(id)) ?? {
    id, name:catalogue.ingredients.find(ingredient=>ingredient.id===id)!.name, memberIds:[id], kind:'unreviewed', basis:'Exact legacy identity',
  };
}
function sourceName(versionId:string, rowIndex:number) {
  const row = catalogue.versions.find(version=>version.id===versionId)!.ingredients[rowIndex]!;
  return recipeMaterialRequirement(catalogue,versionId,rowIndex)?.sourceName
    ?? catalogue.ingredients.find(ingredient=>ingredient.id===row.ingredientId)!.name;
}

test('reviewed pure whiskey styles share one daily material identity',()=>{
  for (const id of ['whiskey','bourbon-whiskey','rye-whiskey','scotch-whisky','islay-whisky','single-malt-whisky','japanese-whisky','corn-whiskey']) {
    assert.equal(conceptFor(id).id,'food-generic-whisky',id);
  }
  assert.equal(conceptFor('food-generic-whisky').name.zh,'威士忌');
});

test('ordinary saline has one entry while olive and pickle brines keep their flavor',()=>{
  for (const id of ['saline-solution','saline-five-one','saline-twenty-percent','food-brine']) {
    assert.equal(conceptFor(id).id,'saline-solution',id);
    assert.equal(conceptFor(id).name.zh,'盐水');
  }
  assert.equal(conceptFor('green-olive-brine').id,'green-olive-brine');
  assert.equal(conceptFor('pickle-brine').id,'pickle-brine');
  for (const id of ['saline-five-one','saline-twenty-percent']) {
    const row = catalogue.versions.flatMap(version=>version.ingredients).find(ingredient=>ingredient.ingredientId===id)!;
    const originalName = catalogue.ingredients.find(ingredient=>ingredient.id===id)!.name.en;
    assert.ok(/5:1|20%/.test(originalName));
    assert.ok(row.amount!==null);
  }
});

test('reviewed rum, gin, tequila and mezcal styles normalize without flavored substitutes',()=>{
  for (const id of ['rum','food-rum','white-rum','dark-rum','overproof-rum','martinique-agricole-rhum','navy-style-rum','clairin','charanda']) assert.equal(conceptFor(id).id,'rum',id);
  for (const id of ['gin','old-tom-gin','barrel-aged-gin']) assert.equal(conceptFor(id).id,'gin',id);
  assert.equal(conceptFor('food-tequila').id,'tequila');
  assert.equal(conceptFor('espadin-mezcal').id,'mezcal');
  for (const id of ['pineapple-lapsang-infused-gin','earl-grey-gin','sloe-gin','berry-gin','blackberry-whiskey','whiskey-liqueur','umeshu-whisky-blend','brown-butter-washed-bourbon','spiced-rum','coconut-rum','vanilla-vodka','citron-vodka','smoky-rum','genever']) assert.equal(conceptFor(id).id,id,id);
});

test('reviewed grape and apple brandies retain separate fruit identities',()=>{
  for (const id of ['brandy','cognac','food-armagnac']) assert.equal(conceptFor(id).id,'brandy',id);
  for (const id of ['apple-brandy','calvados','applejack']) assert.equal(conceptFor(id).id,'apple-brandy',id);
  for (const id of ['pisco','plum-eau-de-vie','pear-eau-de-vie','apple-pear-brandy','food-eau-de-vie','cherry-brandy']) assert.equal(conceptFor(id).id,id,id);
});

test('same spices and plain sugar syrup normalize while flavored syrups and fruit forms stay distinct',()=>{
  assert.equal(conceptFor('food-clove').id,'cloves');
  assert.equal(conceptFor('food-red-chili-pepper').id,'red-chilli');
  assert.equal(conceptFor('rich-sugar-syrup').id,'simple-syrup');
  for (const id of ['vanilla-syrup','demerara-syrup','almond-syrup','orgeat','food-lime','lime-juice','lime-wedges','food-rice-flour','food-rice-noodles']) assert.equal(conceptFor(id).id,id,id);
});

test('every old ingredient has exactly one recoverable concept without rewriting source data',()=>{
  const concepts = catalogue.materialConcepts ?? catalogue.ingredients.map(ingredient=>conceptFor(ingredient.id));
  const membership = concepts.flatMap(concept=>concept.memberIds);
  assert.equal(membership.length,1448);
  assert.equal(new Set(membership).size,1448);
  assert.deepEqual([...membership].sort(),catalogue.ingredients.map(ingredient=>ingredient.id).sort());
  const used = new Set(catalogue.versions.flatMap(version=>version.ingredients.map(row=>row.ingredientId)));
  assert.equal(membership.filter(id=>!used.has(id)).length,1095);
  for (const concept of concepts) {
    assert.ok(concept.memberIds.includes(concept.id),concept.id);
    assert.ok(concept.basis.trim(),concept.id);
    for (const locale of LOCALES) assert.ok(concept.name[locale].trim(),concept.id+'/'+locale);
    if (concept.kind==='unreviewed') assert.deepEqual(concept.memberIds,[concept.id]);
  }
  assert.equal(createHash('sha256').update(JSON.stringify({ingredients:catalogue.ingredients,versions:catalogue.versions})).digest('hex'),'47dc907422248cc0bd681231dabdc4162599aa3a490f7d7b5f1c35d11ac44d63');
});

test('source row display distinguishes unrestricted Highball, Scotch and Hot Toddy choices',()=>{
  assert.equal(sourceName('whiskey-highball-batch-f',0).en,'Whiskey');
  assert.equal(sourceName('scotch-and-soda-batch-f',0).en,'Scotch whisky');
  assert.equal(sourceName('hot-toddy-batch-f',3).en,'Bourbon, rye, Irish whiskey, or Scotch');
  assert.equal(catalogue.ingredients.find(ingredient=>ingredient.id==='whiskey')!.name.en,'Bourbon or rye whiskey');
  assert.equal(catalogue.ingredients.find(ingredient=>ingredient.id==='scotch-whisky')!.name.en,'Blended Scotch whisky');
});

test('unknown identities and absent representatives never gain substitutes from names, bases or parents',()=>{
  const original = catalogue.ingredients.find(ingredient=>ingredient.id==='gin')!;
  const unknown:Ingredient = {...original,id:'unknown-berry-gin'};
  const concepts = buildMaterialConcepts([unknown]);
  assert.deepEqual(concepts.map(concept=>({id:concept.id,memberIds:concept.memberIds,kind:concept.kind})),[{id:'unknown-berry-gin',memberIds:['unknown-berry-gin'],kind:'unreviewed'}]);
  assert.deepEqual(concepts[0]!.name,original.name);
  const bourbon = catalogue.ingredients.find(ingredient=>ingredient.id==='bourbon-whiskey')!;
  assert.deepEqual(buildMaterialConcepts([bourbon]).map(concept=>concept.memberIds),[['bourbon-whiskey']]);
  assert.deepEqual(buildMaterialConcepts([]),[]);
});

test('source display rules reject changed original row fields and shifted rows',()=>{
  assert.equal(buildRecipeMaterialRequirements(catalogue.versions).filter(requirement=>!requirement.acceptedIngredientIds).length,3);
  const version = catalogue.versions.find(version=>version.id==='whiskey-highball-batch-f')!;
  const row = version.ingredients[0]!;
  for (const changed of [
    {...row,ingredientId:'rye-whiskey'}, {...row,amount:3}, {...row,unit:'ml' as const},
    {...row,optional:true}, {...row,brandId:'brand-changed'}, {...row,note:{...row.note!,zh:'来源已变更。'}},
    {ingredientId:row.ingredientId,amount:row.amount,unit:row.unit},
  ]) {
    const changedCatalogue = {...catalogue,versions:[{...version,ingredients:[changed,...version.ingredients.slice(1)]}]};
    assert.equal(buildRecipeMaterialRequirements(changedCatalogue.versions).length,0);
    assert.equal(recipeMaterialRequirement(changedCatalogue,version.id,0),undefined);
  }
  const shifted = [{...version,ingredients:[version.ingredients[1]!,row]}];
  assert.equal(buildRecipeMaterialRequirements(shifted).length,0);
  assert.equal(recipeMaterialRequirement({...catalogue,versions:shifted},version.id,0),undefined);
  assert.equal(recipeMaterialRequirement(catalogue,'missing-source',0),undefined);
  assert.equal(recipeMaterialRequirement(catalogue,version.id,99),undefined);
  const reordered = {...row,note:Object.fromEntries(Object.entries(row.note!).reverse()) as typeof row.note};
  assert.equal(buildRecipeMaterialRequirements([{...version,ingredients:[reordered]}]).length,1);
});

test('legacy alias collisions retain unknown language, source and distinct identities',()=>{
  for (const [id,value,locale] of [['food-lemon','citron','fr'],['food-citron','citron','en'],['food-grape','raisin','fr'],['food-raisin','raisin','en']] as const) {
    const ingredient = catalogue.ingredients.find(ingredient=>ingredient.id===id)!;
    const aliases = conceptFor(id).aliases ?? [];
    assert.ok(aliases.some(alias=>alias.value===value && alias.locale==='unknown' && alias.ingredientId===id && alias.sourceId===ingredient.guide!.source!.recordId),id+' legacy');
    assert.ok(aliases.some(alias=>alias.value===value && alias.locale===locale && alias.ingredientId===id),id+' localized name');
    assert.equal(conceptFor(id).id,id);
    for (const value of ingredient.guide!.aliases) assert.ok(aliases.some(alias=>alias.value===value && alias.locale==='unknown'),id+'/'+value);
  }
});

test('source OR requirements expose only explicitly accepted material IDs',()=>{
  const expected = [
    ['virgin-mary-batch-m',2,['pickle-brine','green-olive-brine']],
    ['vermouth-tonic-batch-m',0,['sweet-red-vermouth','bianco-vermouth']],
    ['old-cuban-iba',5,['champagne','prosecco']],
    ['black-velvet-diffords-black-velvet',1,['champagne','sparkling-wine']],
    ['connaught-martini-bar-k',2,['gin','vodka']],
    ['carino-batch-j',1,['yellow-chartreuse','genepy-liqueur']],
    ['satans-whiskers-batch-m',3,['grand-marnier','orange-curacao']],
  ] as const;
  for (const [versionId,rowIndex,ids] of expected) {
    const requirement = recipeMaterialRequirement(catalogue,versionId,rowIndex);
    assert.deepEqual(requirement?.acceptedIngredientIds,ids,versionId);
    for (const id of ids) assert.ok(catalogue.ingredients.some(ingredient=>ingredient.id===id),id);
    const version = catalogue.versions.find(version=>version.id===versionId)!;
    const rows = version.ingredients.map((row,index)=>index===rowIndex ? {...row,note:{...row.note!,en:'Changed source choices.'}} : row);
    const changed = {...catalogue,versions:[{...version,ingredients:rows}]};
    assert.equal(recipeMaterialRequirement(changed,versionId,rowIndex),undefined);
    assert.equal(buildRecipeMaterialRequirements(changed.versions).length,0);
  }
  assert.equal(conceptFor('food-vermouth').id,'food-vermouth');
});
