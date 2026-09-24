import type {Localized} from '../domain/contracts';
import type {ResearchMaterial,ResearchPreparation,ResearchTopic,ResearchWork} from './topics';

const L=(en:string,zh:string,fr:string,de:string,es:string,ko:string,ja:string,it:string):Localized=>({en,zh,fr,de,es,ko,ja,it});
const name=(value:string):Localized=>L(value,value,value,value,value,value,value,value);
const ingredient=(value:string,amount?:string):ResearchMaterial=>({name:name(value),amount});
const summary=(en:string,zh:string):Localized=>L(en,zh,en,en,en,en,en,en);
const gap=summary;
const checkedAt='2026-09-08';
const patron2016='https://www.patrontequila.com/global-es/campaign/patron-perfectionists/2016.html';
const patron2018='https://www.patrontequila.com/stories/2018-12/patron-perfectionists-finalists.html';

const identity=(id:string,title:string,author:string,region:string,award:string,sourceUrl:string,sourceTitle:string,editorial:string):ResearchWork=>({
  id,title,author,region,award,materials:[],disclosure:'identity-only',summary:summary(editorial,`官方页面确认${author}以《${title}》代表${region}进入该阶段；该条只记录作品身份，不补写未核实配方。`),
  source:{title:sourceTitle,url:sourceUrl,checkedAt},
});

const patron2016Works:ResearchWork[]=[
  identity('patron-2016-song-of-the-sea','Song of the Sea','Nick Cozens','Australia','Australia winner · global finalist',patron2016,'Patrón Perfectionists 2016 · official competition timeline','Patrón identifies this work as the Australian winning serve and a global-final entry; recipe details were not transcribed in this pass.'),
  identity('patron-2016-bell-of-jalisco','The Bell of Jalisco','Mike McGinty','United Kingdom','United Kingdom winner · 2016 global winner',patron2016,'Patrón Perfectionists 2016 · official competition timeline','The official timeline identifies both the UK win and the global title; this record does not infer recipe details.'),
  identity('patron-2016-el-pacto','El Pacto','Fernando Fastuca','Spain','Spain winner · global finalist',patron2016,'Patrón Perfectionists 2016 · official competition timeline','Patrón identifies this work as the Spanish winning serve and a global-final entry; recipe details were not transcribed in this pass.'),
  identity('patron-2016-pimiento-goloso','Pimiento Goloso','Brice Martaud','France','France winner · global finalist',patron2016,'Patrón Perfectionists 2016 · official competition timeline','Patrón identifies this work as the French winning serve and a global-final entry; recipe details were not transcribed in this pass.'),
  identity('patron-2016-patron-atole','Patrón Atole','Nicola Ruggiero','Italy','Italy winner · global finalist',patron2016,'Patrón Perfectionists 2016 · official competition timeline','Patrón identifies this work as the Italian winning serve and a global-final entry; recipe details were not transcribed in this pass.'),
  identity('patron-2016-augurio','Augurio','Macario Vazquez','Mexico City','Mexico City winner · global finalist',patron2016,'Patrón Perfectionists 2016 · official competition timeline','Patrón identifies this work as the Mexico City winning serve and a global-final entry; recipe details were not transcribed in this pass.'),
  identity('patron-2016-jalisco-swizzle','Jalisco Swizzle','Sudeera Fernando','Dubai, UAE','Dubai winner · global finalist',patron2016,'Patrón Perfectionists 2016 · official competition timeline','Patrón identifies this work as the Dubai winning serve and a global-final entry; recipe details were not transcribed in this pass.'),
];

const patron2018Identities:[string,string,string,string][]=[
  ['cielo-de-jalisco','Cielo de Jalisco','Antonio Rosato','Italy'],['coral-and-coast','Coral & Coast','Thomas Begbie','Belgium'],
  ['mayagarita','Mayagarita','François Descamps','France'],['harmony','Harmony','Bruce Dorfling','South Africa'],
  ['wind','Wind','Yeray Monforte','Spain'],['best-promise','The Best Promise','Mitsuhiro Nakamura','Japan'],
  ['muldejewangk','The Muldejewangk','Abby Wegener','Australia'],['kosmos','KOSMOS','Pat Park','South Korea'],
];
const patron2018Works:ResearchWork[]=[
  {
    id:'patron-2018-godfathers-affinity',title:"The Godfather's Affinity",author:'Nicole Sykes',region:'United Kingdom',award:'United Kingdom winner · global finalist',disclosure:'published-recipe',
    materials:[ingredient('Patrón Silver','45 ml'),ingredient('Martini Ambrato','15 ml'),ingredient('Coriander seed soda','75 ml'),ingredient('Pickled dry crab apple reduction','15 ml'),ingredient('Fresh lime juice','7.5 ml'),ingredient('Lime zest spray','to finish'),ingredient('Apple crisp','garnish')],
    method:['Shake every ingredient except the soda with cubed ice.','Double-strain over cubed ice, top with coriander seed soda and finish with lime-zest spray.','Garnish with an apple crisp.'],
    missingDetails:[gap('Coriander seed soda: composition, carbonation and preparation are not published.','芫荽籽苏打：未公开组成、充气方式和制备过程。'),gap('Pickled dry crab apple reduction: composition and preparation are not published.','腌渍海棠果浓缩液：未公开组成和制备过程。'),gap('Lime zest spray and apple crisp: quantities and preparation are not specified.','青柠皮喷雾与苹果脆片：未注明用量和制备过程。')],
    summary:summary('The official recipe preserves the competition serve, including two bespoke components; their component formulas are not supplied on this page.','官方配方保留两项特制材料；该页面没有公开这两项材料的制备公式。'),
    source:{title:"Patrón · The Godfather's Affinity official recipe",url:'https://www.patrontequila.com/cocktails/patron-silver/the-godfathers-affinity.html',checkedAt},
  },
  {
    id:'patron-2018-dauntless-dessert',title:'Dauntless Dessert',author:'Chloé Merz',region:'Germany',award:'Germany winner · global finalist',disclosure:'published-recipe',
    materials:[ingredient('Patrón Reposado','52.5 ml'),ingredient('Grapefruit oleo acid','30 ml'),ingredient('Black tea syrup','15 ml'),ingredient('Bergamot spirits','1 bar spoon'),ingredient('Absinthe','1 bar spoon'),ingredient('Grapefruit zest','garnish')],
    method:['Add all finished-serve ingredients to a shaker with ice.','Shake for 15–20 seconds.','Double-strain into a cordial glass and garnish with grapefruit zest.'],
    preparations:[
      {id:'grapefruit-oleo-acid',name:name('Grapefruit oleo acid'),ingredients:[ingredient('Grapefruit zest','zest of 10 grapefruits'),ingredient('Sugar','2 lb'),ingredient('Malic acid','2.5 oz'),ingredient('Water','1 L')],method:['Combine the grapefruit zests and sugar in a sealable or vacuum bag.','Rest for 24–48 hours, until the oils have been drawn from the zests.','Separately dissolve the malic acid in the water.','Add that solution to the grapefruit-and-sugar mixture, stir until the sugar dissolves, then strain out the zests.']},
      {id:'black-tea-syrup',name:name('Black tea syrup'),ingredients:[ingredient('Black tea bags','10 bags'),ingredient('Hot water','1 L'),ingredient('Sugar','1 lb')],method:['Steep the tea bags in the hot water for approximately 5–8 minutes.','Remove the tea bags, add the sugar and stir until completely dissolved.']},
    ] satisfies ResearchPreparation[],
    summary:summary('The official page discloses the serve and both bespoke preparations; the compact card keeps the preparation facts separate from this editorial note.','官方页面公开成品与两项特制材料的做法；卡片将制作事实与编辑摘要分开。'),
    source:{title:'Patrón · Dauntless Dessert official recipe',url:'https://www.patrontequila.com/cocktails/patron-reposado/dauntless-dessert.html',checkedAt},
  },
  ...patron2018Identities.map(([id,title,author,region])=>identity(`patron-2018-${id}`,title,author,region,`${region} winner · global finalist`,patron2018,'Patrón Perfectionists 2018 · official finalist directory','Patrón lists this regional winner among the twenty global finalists; recipe facts were not transcribed in this pass.')),
];

const worldClass2024Works:ResearchWork[]=[
  {
    id:'world-class-us-2024-such-great-heights',title:'Such Great Heights',author:'Jonathan Stanyard',region:'United States',award:'Work contributing to 2024 U.S. Bartender of the Year win',disclosure:'published-recipe',
    materials:[ingredient('Ron Zacapa Rum Edición Negra','0.75 oz'),ingredient('Coconut cold brew','0.75 oz'),ingredient('Pineapple amaro liqueur','0.3 oz'),ingredient('Sherry','0.3 oz'),ingredient('Coffee-ground sugar dust','garnish')],
    method:['Shake the rum, coconut cold brew, pineapple amaro liqueur and sherry with ice.','Strain into a martini glass.','Finish with coffee-ground sugar dust.'],
    preparations:[{id:'coconut-cold-brew',name:name('Coconut cold brew'),ingredients:[ingredient('Coconut water and freshly ground coffee beans','official page states “1:4”; direction and weight/volume basis are not specified')],method:['Combine coconut water and freshly ground coffee beans in the published but underspecified 1:4 relationship.','Leave to saturate overnight, then fine-strain through a paper filter.']}],
    missingDetails:[gap('Coconut cold brew: the source gives “1:4” but does not define the ratio direction or whether it is by mass or volume.','椰子冷萃：来源写作“1:4”，但未说明比例方向，也未说明按重量还是体积。'),gap('Pineapple amaro liqueur: brand, composition and preparation are not published.','菠萝 amaro 利口酒：未公开品牌、组成和制备过程。'),gap('Coffee-ground sugar dust: proportions, preparation and serving quantity are not published.','咖啡粉糖尘：未公开比例、制备过程和每杯用量。')],
    summary:summary('Diageo Bar Academy describes this as one of the cocktails that helped Stanyard win the 2024 U.S. title and publishes the cold-brew preparation.','Diageo Bar Academy 将其标为助力 Stanyard 赢得 2024 美国冠军的作品，并公开冷萃制法。'),
    source:{title:'Diageo Bar Academy · Such Great Heights',url:'https://www.diageobaracademy.com/en-us/home/explore-all-recipes/such-great-heights',checkedAt},
  },
  {
    id:'world-class-us-2024-apples-for-whales',title:'Apples for Whales',author:'Jonathan Stanyard',region:'United States',award:'Work contributing to 2024 U.S. Bartender of the Year win',disclosure:'published-recipe',
    materials:[ingredient('Apple-infused Ketel One Family Made Vodka','1.5 oz'),ingredient('Apple cordial','1 oz'),ingredient('Clarified apple juice','0.5 oz'),ingredient('Celery-cardamom bitters','1 drop'),ingredient('Clarified apple-juice ice cubes','3 cubes'),ingredient('Bee pollen granules','dusting')],
    method:['Stir the infused vodka, cordial, clarified juice and bitters with three clarified apple-juice ice cubes.','Pour into a martini glass.','Dust the surface with bee-pollen granules.'],
    preparations:[{id:'apple-infused-vodka',name:name('Apple-infused Ketel One Family Made Vodka'),ingredients:[ingredient('Ketel One Family Made Vodka','12.5 oz'),ingredient('Apple discards — cores, solids and similar remnants','quantity not specified')],method:['Place the apple discards and vodka in a vessel.','Infuse under refrigeration for 48 hours.','Fine-strain and keep refrigerated in an airtight container until use.']}],
    missingDetails:[gap('Apple cordial: composition and preparation are not published.','苹果 cordial：未公开组成和制备过程。'),gap('Clarified apple juice and its ice cubes: the clarification method is not published.','澄清苹果汁及其冰块：未公开澄清方法。'),gap('Celery-cardamom bitters: composition and preparation are not published.','芹菜豆蔻苦精：未公开组成和制备过程。'),gap('Bee-pollen granules: the serving quantity is only described as a dusting.','蜂花粉颗粒：每杯用量仅写作少量撒面。')],
    summary:summary('The official recipe publishes the apple-vodka infusion but names the cordial, clarified juice, bitters and custom ice without their component formulas.','官方配方公开苹果伏特加浸泡法，但苹果 cordial、澄清果汁、苦精和定制冰块未附完整组成。'),
    source:{title:'Diageo Bar Academy · Apples for Whales',url:'https://www.diageobaracademy.com/en-us/home/explore-all-recipes/apples-for-whales',checkedAt},
  },
];

export const roundElevenTopics:ResearchTopic[]=[
  {id:'patron-perfectionists-2016',competition:'Patrón Perfectionists',organization:'Patrón',year:2016,region:'Global · seven regional winners',scope:'regional-winners',officialCount:7,versionIds:[],source:{title:'Patrón Perfectionists 2016 · official competition timeline',url:patron2016,checkedAt},research:patron2016Works},
  {id:'patron-perfectionists-2018-selection',competition:'Patrón Perfectionists',organization:'Patrón',year:2018,region:'Global · selected finalists',scope:'regional-winners',officialCount:20,versionIds:[],source:{title:'Patrón Perfectionists 2018 · official finalist directory',url:patron2018,publishedAt:'2018-12-02',checkedAt},research:patron2018Works},
  {id:'world-class-us-2024-winner-recipes',competition:'World Class US',organization:'Diageo Bar Academy / USBG',year:2024,region:'United States',scope:'winner-recipes',officialCount:null,versionIds:[],source:{title:'Diageo Bar Academy · official winning recipe pages',url:'https://www.diageobaracademy.com/en-us/home/explore-all-recipes/such-great-heights',checkedAt},research:worldClass2024Works},
];
