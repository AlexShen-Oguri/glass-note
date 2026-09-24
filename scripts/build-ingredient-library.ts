import fs from 'node:fs';
import {recipeIngredients} from '../src/content/catalogue';
import {ingredientFamily} from '../src/domain/ingredients/guide';
import {LOCALES, type Ingredient, type IngredientFamily, type Localized} from '../src/domain/contracts';
import type {MaterialRecord} from '../src/content/ingredients';

const base='research/ingredients/round-six/';
const product=JSON.parse(fs.readFileSync(base+'ingredients-candidates-product.json','utf8'));
const strict=JSON.parse(fs.readFileSync(base+'ingredients-candidates-strict.json','utf8'));
const raw=JSON.parse(fs.readFileSync(base+'taxonomy-records.json','utf8'));
const extra=fs.readFileSync('research/ingredients/product/extra-selection.txt','utf8').split(/\r?\n/).filter(s=>s&&!s.startsWith('#'));
type Candidate={sourceId:string;sourceLine:number;group?:string;names:Localized;aliases:Record<string,string[]>;parents:string[]};
const normalize=(s:string)=>s.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const sourceByName=new Map<string,Candidate>([...raw.records,...strict.candidates].map((r:Candidate)=>[normalize(r.names.en),r]));
const requested=[...product.candidates,...extra.map(n=>{const r=sourceByName.get(normalize(n));if(!r)throw new Error('Missing selected source: '+n);return r;})] as Candidate[];

// Explicit identity merges. Preparations with different roles remain independent.
const equivalent:Record<string,string>={
  'caramelised sugar syrup':'caramel syrup','bee honey':'honey','liquid honey':'honey','flower honey':'wildflower honey',
  'barley syrup':'barley malt syrup','corn molasses':'dark corn syrups','cane sugar molasses':'molasses',
  'rapeseed oil':'canola oil','colza oil':'canola oil','clarified butter':'ghee',
  'white vinegar':'white distilled vinegar','distilled vinegar':'white distilled vinegar','table vinegar':'white distilled vinegar',
  'apple vinegar':'apple cider vinegar','cider vinegar':'apple cider vinegar',
  'pickled cucumber':'pickled gherkin','gherkin':'pickled gherkin',
  'semolina':'wheat semolina','semolina flour':'wheat semolina','wheat grain':'wheat',
  'malt':'malted barley','wheat bulgur':'bulgur','chia':'chia seed','flax':'flax seed','sesame':'sesame seeds','soya':'soya bean',
  'paprika powder':'paprika','curry':'curry powder','juniper':'juniper berry','liquorice':'liquorice root',
  'nutmeg nut':'nutmeg','cardamom seed':'cardamom','caraway seed':'caraway','aniseed':'aniseseed',
  'whisky':'generic whisky','whiskey':'generic whisky','whiskeys':'generic whisky',
  'mint':'mint leaves','mint leaf':'mint leaves','lemon zest':'lemon peel',
  'perilla':'shiso','bamboo':'bamboo shoot','garlic puree':'garlic paste','sour cherry juice':'tart cherry juice',
  'boabab':'baobab','camomile':'chamomile','lavander honey':'lavender honey',
  'yambean':'jicama','citrus unshiu':'satsuma mandarin','granny apple':'granny smith apple',
  'corinthian raisins':'zante currants','hom mali rice':'jasmine rice',
};
const canonical=(s:string)=>equivalent[normalize(s)]??normalize(s);
const exclude=new Set(['frying oil','shea butter','natural yeast','chive seasoning','hard cheese','soft cheese','cereal flour','mixed cereal flour','fruit juice','berry juice','citrus fruit','citrus fruit juice','vegetable juice','liqueur','sauce','marinade','jam','marmalade','fondant','bamboo','wheat breadcrumbs'].map(normalize));
const selected=new Map<string,Candidate>();
const excluded:string[]=[];
for (const record of requested) {
  if(exclude.has(normalize(record.names.en))) {excluded.push(record.names.en);continue;}
  const key=canonical(record.names.en),previous=selected.get(key);
  if(!previous){selected.set(key,{...record,names:{...record.names},aliases:structuredClone(record.aliases)});continue;}
  for(const locale of LOCALES){
    previous.aliases[locale]=[...new Set([...(previous.aliases[locale]??[]),record.names[locale],...(record.aliases[locale]??[])].filter(Boolean))];
    if(!previous.names[locale])previous.names[locale]=record.names[locale];
  }
}

const recipeIdentity:Record<string,string>={
  'mint leaves':'mint-leaves','maraschino':'maraschino-liqueur','gin':'gin','white rum':'white-rum',
  'lemon juice':'lemon-juice','lime juice':'lime-juice','sugarcane juice':'sugar-cane-juice',
  'orange blossom water':'orange-flower-water','carbonated water':'soda-water','coconut cream':'coconut-cream',
  'cinnamon powder':'ground-cinnamon',
};
const recipeKeys=new Map<string,Ingredient>();
for(const ingredient of recipeIngredients){
  recipeKeys.set(canonical(ingredient.name.en.replace(/^fresh(?:ly squeezed)?\s+/i,'')),ingredient);
}
const familyOverrides:Record<string,IngredientFamily>={
  'sea lettuce':'seaweed','calamansi':'citrus','chinotto':'citrus','citron':'citrus','clementine':'citrus',
  'damson':'stone-fruit','greengage':'stone-fruit','prune':'stone-fruit','sloe':'stone-fruit',
  'wax gourd':'vegetable','drumstick pods':'vegetable','rhubarb':'vegetable','goji':'berry','quince':'pear',
  'kale':'leaf','sea kale':'leaf','triticale':'grain','wensleydale':'cheese','edamame':'legume',
  'boletus':'mushroom','morel':'mushroom','shiitake':'mushroom','glasswort':'vegetable','cassava':'root',
  'pepper jack':'cheese','garlic salt':'salt','celery salt':'salt','chocolate liqueur':'liqueur','cashew apples':'tropical',
  'sugar apple':'tropical','mustard greens':'leaf','mustard spinach':'leaf','mustard cabbage':'leaf',
  'bell pepper':'vegetable','yellow bell pepper':'vegetable','green bell pepper':'vegetable','red bell pepper':'vegetable',
  'water spinach':'leaf','water chestnut':'vegetable','saffron milk cap':'mushroom','irish moss':'seaweed',
  'mushroom powder':'mushroom','tremella fuciformis':'mushroom','pleurotus':'mushroom','wood ear':'mushroom',
  'dulse':'seaweed','laver':'seaweed','kombu':'seaweed','wakame':'seaweed','thongweed':'seaweed',
  'jasmine petals':'flower','marigold':'flower','burnet':'herb','galangal':'root','black galangal':'root',
  'kaffir lime leaf':'herb','lemon leaf':'herb','lime leaf':'herb','bay leaf':'herb','coriander leaf':'herb',
  'black salt':'salt','rock salt':'salt','sea salt':'salt','bakers yeast':'pantry','brewers yeast':'pantry',
};
function family(record:Candidate):IngredientFamily {
  const key=normalize(record.names.en);
  if(familyOverrides[key])return familyOverrides[key];
  const mock:Ingredient={id:key,name:record.names,exclusionTags:[],compositionKnown:false};
  const detected=ingredientFamily(mock);
  const group=record.group;
  if(group==='dairy-egg' && detected === 'pantry')return 'cheese';
  if(group==='condiment-prepared' && detected==='pantry')return /mirin/.test(key)?'wine':'sauce';
  if(group==='oil-fat')return /peanut butter/.test(key)?'nut':/butter|margarine/.test(key)?'cream':'oil';
  if(group==='herb')return ['flower','tea','sauce'].includes(detected)?detected:'herb';
  if(detected!=='pantry')return detected;
  if(group==='fruit')return 'tropical';
  if(group==='vegetable')return 'vegetable';
  if(group==='grain-cereal')return 'grain';
  if(group==='nut-seed-legume')return /seed/.test(key)?'seed':/bean|pea|dal|lupin|lentil/.test(key)?'legume':'nut';
  if(group==='spice')return 'spice';
  if(group==='alcoholic-drink')return /wine|cider|sake/.test(key)?'wine':'spirit';
  if(group==='non-alcoholic-drink')return 'soda';
  return 'pantry';
}
const records:MaterialRecord[]=[];
const existingIds=new Set<string>();
for(const [key,record] of selected){
  let existing=recipeIngredients.find(i=>i.id===recipeIdentity[key]) ?? recipeKeys.get(key);
  if(key==='generic whisky')existing=undefined;
  // A canonical recipe name may include 'fresh'; keep source generic styles separate otherwise.
  const existingId=existing?.id;
  if(existingId&&existingIds.has(existingId))continue;
  if(existingId)existingIds.add(existingId);
  records.push({id:existingId??`food-${key.replace(/ /g,'-')}`,existingId,sourceId:record.sourceId,sourceLine:record.sourceLine,
    names:record.names,aliases:[...new Set([...Object.values(record.names),...Object.values(record.aliases).flat()].filter(Boolean))],
    parents:record.parents,family:existing?ingredientFamily(existing):family(record)});
}
const technique=JSON.parse(fs.readFileSync('research/ingredients/product/bar-technique-materials.json','utf8')) as {revision:string;records:MaterialRecord[]};
if(technique.revision!==raw.source.revision)throw new Error('Taxonomy revision mismatch');
for(const record of technique.records){
  if(records.some(r=>r.id===record.id))throw new Error('Duplicate technique material '+record.id);
  // Chemical source synonym lists include salts and broad legacy names. Only retain
  // reviewed ingredient names and the food additive identifier in the product search.
  const code=record.sourceId.split(':').at(-1)!.split('-')[0]!.toUpperCase();
  records.push({...record,aliases:[...new Set([...Object.values(record.names).filter(Boolean),code])]});
}
records.sort((a,b)=>a.names.en.localeCompare(b.names.en));
const output={revision:raw.source.revision,records};
fs.mkdirSync('src/content/ingredients',{recursive:true});
fs.writeFileSync('src/content/ingredients/records.json',JSON.stringify(output)+'\n');
const missing=records.filter(r=>!r.existingId).map(r=>({id:r.id,en:r.names.en,names:r.names,missing:LOCALES.filter(l=>!r.names[l])}));
fs.writeFileSync('research/ingredients/product/translation-input.json',JSON.stringify(missing,null,2)+'\n');
fs.writeFileSync('research/ingredients/product/accepted-names.txt',records.map(r=>`${r.id}\t${r.names.en}\t${r.family}\t${r.existingId??''}`).join('\n')+'\n');
const report={sourceRecords:records.length,matchedRecipeIngredients:existingIds.size,independentNew:records.filter(r=>!r.existingId).length,totalIngredients:recipeIngredients.length+records.filter(r=>!r.existingId).length,excluded:[...new Set(excluded)],missingTranslations:Object.fromEntries(LOCALES.map(l=>[l,missing.filter(r=>!r.names[l]).length]))};
fs.writeFileSync('research/ingredients/product/merge-report.json',JSON.stringify(report,null,2)+'\n');
console.log(report);
