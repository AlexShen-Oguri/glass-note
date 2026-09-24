import assert from 'node:assert/strict';
import test from 'node:test';
import type {Bottle} from '../bottles/types';
import {LOCALES,type Catalogue,type Flavour,type Localized,type MeasureUnit,type RecipeVersion,type Strength} from '../contracts';
import {recipeSnapshot} from '../making';
import {buildOrderCard,formatOrderCard,formatSimpleOrderCard,OrderCardError,type OrderCardFormatCopy,type OrderCardInput} from '.';
import {orderCopy,round175OrderCopy,type Round175OrderKey} from '../../i18n/round17-5-order';

const L=(en:string,zh=`中-${en}`):Localized=>({en,zh,fr:`fr-${en}`,de:`de-${en}`,es:`es-${en}`,ko:`ko-${en}`,ja:`ja-${en}`,it:`it-${en}`});
function version(options:Partial<RecipeVersion>={}):RecipeVersion{return{id:'v',cocktailId:'drink',label:L('Source version'),sourceId:'source',servings:1,ingredients:[{ingredientId:'gin',amount:30,unit:'ml',brandId:'brand-source',note:L('Source note')}],steps:{en:['Stir'],zh:['搅拌'],fr:['fr'],de:['de'],es:['es'],ko:['ko'],ja:['ja'],it:['it']},originalLanguage:'en',originalSteps:['Original source wording'],glass:L('Coupe'),garnish:L('Twist'),flavours:['herbal'],tastes:['dry'],strength:'strong',approachability:'bold',profileBasis:'source',profileNote:L('Source profile'),sourceChecked:true,translationStatus:'reviewed',...options};}
function catalogue(v=version()):Catalogue{return{versions:[v],cocktails:[{id:'drink',name:L('Martini'),aliases:[],category:'classic',description:L('Drink'),versionIds:[v.id],defaultVersionId:v.id,accent:'#fff'}],ingredients:[{id:'gin',name:L('Gin'),exclusionTags:['gin'],compositionKnown:true}],brands:[{id:'brand-source',name:'Source Brand',ingredientIds:['gin']}],sources:[{id:'source',title:'Exact Source',url:'https://example.com/exact',checkedAt:'2026-09-11'}]};}
function bottle(id='bottle',ingredientIds=['gin'],brandId='brand-source'):Bottle{return{id,brandId,brandName:brandId==='brand-source'?'Source Brand':'Different Brand',name:'Selected Bottle',aliases:[],family:'gin',ingredientIds,abv:47,market:'test',flavours:[],profile:L('Bottle'),source:{title:'Bottle source',url:'https://example.com/bottle',checkedAt:'2026-09-11'},profileBasis:'producer'};}
function input(overrides:Partial<OrderCardInput>={}):OrderCardInput{return{locale:'zh',textMode:'localized',unitPreference:'oz',bottleIdsByRow:{},modificationsByRow:{},...overrides};}
const copy:OrderCardFormatCopy={version:'V',source:'S',servings:'N',ingredients:'I',steps:'P',glass:'G',garnish:'R',flavours:'F',strength:'T',profile:'Profile',profileBasis:'Basis',sourceProfile:'Source profile',editorialProfile:'Editorial profile',translationStatus:'Translation',draft:'Draft',reviewed:'Reviewed',abv:'A',unknown:'?',sourceBrand:'SB',bottle:'B',modification:'M',brandSubstitution:'Brand substitution',optional:'Optional',original:'Original',formatUnit:(unit:MeasureUnit)=>`u-${unit}`,formatFlavour:(flavour:Flavour)=>`f-${flavour}`,formatStrength:(strength:Strength)=>`s-${strength}`};

test('order card preserves exact source, locale, profile provenance and never computes a finished-drink ABV',()=>{
  const recipe=recipeSnapshot(catalogue(),'v')!,card=buildOrderCard(recipe,[bottle()],input({bottleIdsByRow:{'v:0':'bottle'}}));
  assert.equal(card.title,'中-Martini');assert.equal(card.versionTitle,'中-Source version');assert.equal(card.sourceTitle,'Exact Source');assert.equal(card.sourceUrl,'https://example.com/exact');
  assert.equal(card.locale,'zh');assert.equal(card.textLocale,'zh');assert.equal(card.actualOriginal,false);assert.equal(card.profileBasis,'source');assert.equal(card.profileNote,'中-Source profile');assert.equal(card.sourceChecked,true);assert.equal(card.translationStatus,'reviewed');
  assert.equal(card.rows[0]!.amount,'1.01');assert.equal(card.rows[0]!.unit,'oz');assert.equal(card.rows[0]!.selectedBottle?.name,'Selected Bottle');assert.equal(card.abv,null);
  const formatted=formatOrderCard(card,copy);assert(!formatted.includes('Exact Source'));assert.match(formatted,/A: \?/);assert(!formatted.includes('47'));
});

test('order card name mode governs preview/share text while the selected bottle keeps its canonical identity',()=>{
  const selected=bottle();
  selected.nameTranslations={zh:{name:'已校对金酒',basis:'producer',sources:[]}};
  const before=JSON.stringify(selected);
  const recipe=recipeSnapshot(catalogue(),'v')!;
  const local=buildOrderCard(recipe,[selected],input({bottleIdsByRow:{'v:0':'bottle'}}));
  assert.equal(local.rows[0]!.selectedBottle!.name,'Selected Bottle');
  assert.match(formatOrderCard(local,copy),/已校对金酒 \(Source Brand Selected Bottle\)/);
  const original=buildOrderCard(recipe,[selected],input({textMode:'original',bottleIdsByRow:{'v:0':'bottle'}}));
  assert.match(formatOrderCard(original,copy),/B: Source Brand Selected Bottle/);
  assert(!formatOrderCard(original,copy).includes('已校对金酒'));
  const fallback=buildOrderCard(recipe,[selected],input({locale:'fr',bottleIdsByRow:{'v:0':'bottle'}}));
  assert.equal(fallback.rows[0]!.selectedBottle!.displayName,'Source Brand Selected Bottle');
  assert.equal(JSON.stringify(selected),before);
});

test('a missing source-language recipe does not change an original bottle-name request',()=>{
  const selected=bottle();
  selected.nameTranslations={zh:{name:'已校对金酒',basis:'producer',sources:[]}};
  const recipe=recipeSnapshot(catalogue(version({originalSteps:undefined})),'v')!;
  const card=buildOrderCard(recipe,[selected],input({textMode:'original',bottleIdsByRow:{'v:0':'bottle'}}));
  assert.equal(card.actualOriginal,false);
  assert.equal(card.textLocale,'zh');
  assert(!formatOrderCard(card,copy).includes('已校对金酒'));
});

test('preview/share formatter contains no personal taste note unless it is an explicit order modification',()=>{
  const recipe=recipeSnapshot(catalogue(),'v')!;
  const plain=formatOrderCard(buildOrderCard(recipe,[],input({modificationsByRow:{'v:0':'   '}})),copy);
  assert(!plain.includes('PRIVATE: I hated this last time'));
  assert.throws(()=>buildOrderCard(recipe,[],{...input(),tasteFeedback:{notes:'PRIVATE: I hated this last time'}} as never),(error:unknown)=>error instanceof OrderCardError&&error.code==='invalid-input');
  assert.throws(()=>buildOrderCard({...recipe,personalNotes:'PRIVATE: I hated this last time'} as never,[],input()),(error:unknown)=>error instanceof OrderCardError&&error.code==='invalid-recipe');
  const explicit=formatOrderCard(buildOrderCard(recipe,[],input({modificationsByRow:{'v:0':'Less vermouth'}})),copy);
  assert.match(explicit,/M: Less vermouth/);
});

test('simple formatter keeps the order card short and carries explicit bottle and modification requests',()=>{
  const recipe=recipeSnapshot(catalogue(),'v')!,card=buildOrderCard(recipe,[bottle()],input({bottleIdsByRow:{'v:0':'bottle'},modificationsByRow:{'v:0':'Less vermouth'}}));
  const formatted=formatSimpleOrderCard(card,{originalName:'ON',ingredients:'I',requests:'R',optional:'O',brand:'B',modification:'M',sourceBrand:'SB',source:'S',sourceVersion:'V'});
  assert.match(formatted,/中-Gin/);
  assert.match(formatted,/ON: Martini/);
  assert.match(formatted,/SB: Source Brand/);
  assert.match(formatted,/B: Source Brand Selected Bottle/);
  assert.match(formatted,/M: 中-Gin: Less vermouth/);
  assert(!formatted.includes('Exact Source'));
  assert(!formatted.includes('中-Source version'));
  assert(!formatted.includes('https://example.com/exact'));
  assert.equal(card.sourceTitle,'Exact Source'); // Attribution stays in the data, not the ordering surface.
  assert(!formatted.includes('1.01'));assert(!formatted.includes('u-oz'));assert(!formatted.includes('Stir'));assert(!formatted.includes('Translation'));assert(!formatted.includes('ABV'));assert(!formatted.includes('v:0'));assert(!formatted.includes('PRIVATE'));
});

test('round 17.5 order copy has a value in all eight locales',()=>{
  const keys=Object.keys(round175OrderCopy) as Round175OrderKey[];
  assert.ok(keys.length>0);
  for(const locale of LOCALES)for(const key of keys)assert.equal(typeof orderCopy(locale,key),'string');
  for(const locale of LOCALES)for(const key of keys)assert.ok(orderCopy(locale,key).trim().length>0,`${locale}.${key}`);
});

test('original request uses the source-language paraphrase when present and records a clean localized fallback when absent',()=>{
  const original=buildOrderCard(recipeSnapshot(catalogue(),'v')!,[],input({textMode:'original'}));
  assert.equal(original.requestedOriginal,true);assert.equal(original.originalAvailable,true);assert.equal(original.actualOriginal,true);assert.equal(original.textLocale,'en');assert.deepEqual(original.steps,['Original source wording']);
  const noOriginalVersion=version({originalSteps:undefined}),fallback=buildOrderCard(recipeSnapshot(catalogue(noOriginalVersion),'v')!,[],input({textMode:'original'}));
  assert.equal(fallback.requestedOriginal,true);assert.equal(fallback.originalAvailable,false);assert.equal(fallback.actualOriginal,false);assert.equal(fallback.textLocale,'zh');assert.deepEqual(fallback.steps,['搅拌']);
});

test('a compatible bottle from another brand is explicitly labelled as a modification',()=>{
  const recipe=recipeSnapshot(catalogue(),'v')!,different=bottle('different',['gin'],'brand-other');
  const card=buildOrderCard(recipe,[different],input({bottleIdsByRow:{'v:0':'different'}}));
  assert.deepEqual(card.rows[0]!.modificationKinds,['brand-substitution']);assert.equal(card.rows[0]!.sourceBrandName,'Source Brand');assert.equal(card.rows[0]!.selectedBottle?.brandName,'Different Brand');
  assert.match(formatOrderCard(card,copy),/M: Brand substitution/);
});

test('unknown and ingredient-incompatible bottle choices fail with stable error codes',()=>{
  const recipe=recipeSnapshot(catalogue(),'v')!;
  assert.throws(()=>buildOrderCard(recipe,[],input({bottleIdsByRow:{'v:0':'missing'}})),(error:unknown)=>error instanceof OrderCardError&&error.code==='unknown-bottle');
  assert.throws(()=>buildOrderCard(recipe,[bottle('wrong',['rum'])],input({bottleIdsByRow:{'v:0':'wrong'}})),(error:unknown)=>error instanceof OrderCardError&&error.code==='incompatible-bottle');
  assert.throws(()=>buildOrderCard(recipe,[],input({modificationsByRow:{'v:99':'Change'}})),(error:unknown)=>error instanceof OrderCardError&&error.code==='unknown-row');
});

test('unverified, mismatched, and malformed source snapshots fail cleanly',()=>{
  const unchecked=recipeSnapshot(catalogue(version({sourceChecked:false})),'v')!;
  assert.throws(()=>buildOrderCard(unchecked,[],input()),(error:unknown)=>error instanceof OrderCardError&&error.code==='unverified-source');
  const mismatched=recipeSnapshot(catalogue(),'v')!;mismatched.version.sourceId='another';
  assert.throws(()=>buildOrderCard(mismatched,[],input()),(error:unknown)=>error instanceof OrderCardError&&error.code==='invalid-recipe');
  const unsafe=JSON.parse(JSON.stringify(recipeSnapshot(catalogue(),'v'))) as Record<string,unknown>;unsafe.ingredientNames=JSON.parse('{"__proto__":{"en":"bad"}}');
  assert.throws(()=>buildOrderCard(unsafe as never,[],input()),OrderCardError);
});
