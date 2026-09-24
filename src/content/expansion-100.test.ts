import {deepEqual,equal,ok} from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {batchM,batchMPreparations} from './expansion/batch-m';
import {catalogue} from './catalogue';
import {LOCALES} from '../domain/contracts';
import {searchCocktails} from '../domain/search';
const baseline=JSON.parse(readFileSync('research/bottles/expansion-100-300/baseline.json','utf8'));
const selection=JSON.parse(readFileSync('research/expansion/100-cocktails/selection-100.json','utf8'));
const recipe=(id:string)=>batchM.versions.find(v=>v.cocktailId===id)!;

test('100 additions are new identities, not extra source versions or replacements',()=>{
 equal(batchM.cocktails.length,100);equal(batchM.versions.length,100);equal(catalogue.cocktails.length,367);
 equal(new Set(batchM.cocktails.map(c=>c.id)).size,100);
 deepEqual(batchM.cocktails.map(c=>c.id).sort(),[...selection.ids].sort());
 for(const old of baseline.cocktails)ok(catalogue.cocktails.some(c=>c.id===old.id),old.id);
 for(const c of batchM.cocktails){ok(!baseline.cocktails.some((old:any)=>old.id===c.id));equal(c.versionIds.length,1);equal(recipe(c.id).sourceChecked,true);}
 for(const id of ['scorpion-bowl','nonalcoholic-old-fashioned','nonalcoholic-negroni'])ok(!batchM.cocktails.some(c=>c.id===id));
});
test('new names remain translated, original-searchable and explicitly editorial',()=>{
 for(const addition of batchM.cocktails){
  const c=catalogue.cocktails.find(c=>c.id===addition.id)!;
  ok(c.originalName);ok(searchCocktails(catalogue,{text:c.originalName}).some(r=>r.cocktailId===c.id),c.id);
  ok(!/&#\d+;/.test(c.originalName),c.id+' decoded original title');
  for(const locale of LOCALES){ok(c.name[locale].trim());if(locale!=='en')ok(c.editorialNameLocales?.includes(locale),c.id+locale);}
  for(const locale of ['zh','ja','ko'] as const)ok(/[^\x00-\x7f]/.test(c.name[locale]),c.id+locale);
 }
 for(const source of batchM.sources)ok(!/&#\d+;/.test(source.title),source.id+' decoded source title');
 for(const preparation of batchMPreparations)for(const card of preparation.cards)for(const source of card.sources??[])ok(!/&#\d+;/.test(source.title),'decoded preparation source title');
});
test('source-specific measures, batches, optional alcohol and distinct preparations survive',()=>{
 for(const id of ['red-sangria','mango-margarita'])equal(recipe(id).servings,6);
 const coffee=recipe('coffee-cocktail');ok(!coffee.ingredients.some(i=>i.ingredientId.includes('coffee')));
 equal(recipe('blackthorn').ingredients[0]?.ingredientId,'generic-aged-whiskey','preferred Knappogue does not restrict the source to Irish whiskey');
 equal(recipe('honey-berry-lemonade').ingredients.find(i=>i.ingredientId==='vodka')?.optional,true);
 equal(batchM.cocktails.find(c=>c.id==='honey-berry-lemonade')?.category,'curated');
 for(const id of ['arnold-palmer','shirley-temple','virgin-mary']){equal(recipe(id).strength,'none');ok(!recipe(id).ingredients.some(i=>i.ingredientId==='vodka'));}
 equal(recipe('b-52').ingredients.length,3);
 equal(recipe('yellow-bird').ingredients.find(i=>i.ingredientId==='saline-twenty-percent')?.amount,5);
 ok(recipe('yellow-bird').garnish.en.includes('twist'));
 ok(recipe('sawyer').steps.en.some(s=>s.includes('without serving ice')));
 ok(recipe('sloe-gin-fizz').steps.en.some(s=>s.includes('without adding serving ice')));
 ok(recipe('chartreuse-toddy').ingredients.some(i=>i.ingredientId==='plain-water'&&i.note?.en.includes('4–6')));
 const ginger=batchMPreparations.filter(p=>['red-sangria-batch-m','queens-road-batch-m'].includes(p.versionId));
 equal(ginger.length,2);ok(ginger[0]!.cards[0]!.inputs[0]!.en!==ginger[1]!.cards[0]!.inputs[0]!.en,'different source ratios stay separate');
});
test('new pictures are unique reviewed local assets bound to source provenance',()=>{
 const manifest=JSON.parse(readFileSync('assets/styled/manifest.json','utf8'));
 const selected=manifest.filter((m:any)=>selection.ids.includes(m.id));equal(selected.length,100);
 const hashes=selected.map((m:any)=>createHash('sha256').update(readFileSync(m.file)).digest('hex'));
 equal(new Set(hashes).size,100);
 for(const m of selected){equal(m.origin,'ai-generated');equal(m.referenceReviewed,true);equal(m.outputReviewed,true);ok(m.referenceSHA256);ok(m.outputSHA256);}
});
