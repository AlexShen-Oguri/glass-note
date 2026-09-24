import type {Localized} from '../domain/contracts';
import {catalogue} from './catalogue';
import {roundElevenTopics} from './topics-eleven';
import {competitionExtensionTopics} from './topics-extension-competitions';
import {barExtensionTopics} from './topics-extension-bars';
const L=(en:string,zh:string,fr:string,de:string,es:string,ko:string,ja:string,it:string):Localized=>({en,zh,fr,de,es,ko,ja,it});
export interface ResearchMaterial {name:Localized;amount?:string}
export interface ResearchPreparation {id:string;name:Localized;ingredients:ResearchMaterial[];method:string[]}
export interface ResearchWork {
  /** When promoted, this research record and catalogue version are one work. */
  catalogueVersionId?:string;
  id:string;title:string;author:string;bar?:string;region?:string;award?:string;
  materials:Localized[]|ResearchMaterial[];original?:string;method?:string[];
  disclosure?:'identity-only'|'ingredients-only'|'published-recipe';summary?:Localized;
  preparations?:ResearchPreparation[];missingDetails?:Localized[];
  source?:{title:string;url:string;checkedAt:string};
}
export interface ResearchTopic {
  kind?:'competition'|'bar';
  countries?:string[];
  venue?:{name:string;city:string;country:string};
  id:string;competition:string;organization?:string;year:number;region:string;scope:'published-finalist-works'|'national-finalists'|'regional-winners'|'winner-recipes'|'bar-recipes';
  officialCount:number|null;versionIds:string[];source:{title:string;url:string;publishedAt?:string;checkedAt:string};
  research?:ResearchWork[];
}
const materials={
  lemon:L('Lemon juice','柠檬汁','Jus de citron','Zitronensaft','Zumo de limón','레몬 주스','レモンジュース','Succo di limone'),
  orange:L('Orange peel','橙皮','Zeste d’orange','Orangenschale','Piel de naranja','오렌지 껍질','オレンジピール','Scorza d’arancia'),
  apple:L('Apple juice','苹果汁','Jus de pomme','Apfelsaft','Zumo de manzana','사과 주스','アップルジュース','Succo di mela'),
  sparkling:L('Sparkling wine','起泡葡萄酒','Vin effervescent','Schaumwein','Vino espumoso','스파클링 와인','スパークリングワイン','Vino spumante'),
  lime:L('Lime juice','青柠汁','Jus de citron vert','Limettensaft','Zumo de lima','라임 주스','ライムジュース','Succo di lime'),
  absinthe:L('Absinthe','苦艾酒','Absinthe','Absinth','Absenta','압생트','アブサン','Assenzio'),
  jam:L('Apricot jam','杏果酱','Confiture d’abricot','Aprikosenkonfitüre','Mermelada de albaricoque','살구 잼','アプリコットジャム','Confettura di albicocche'),
  reduction:L('White balsamic vinegar reduced by half','白巴萨米克醋熬至原体积一半','Vinaigre balsamique blanc réduit de moitié','Weißer Balsamico auf die Hälfte reduziert','Vinagre balsámico blanco reducido a la mitad','절반으로 졸인 화이트 발사믹 식초','ホワイトバルサミコを半量まで煮詰める','Aceto balsamico bianco ridotto della metà'),
  coffee:L('Coarsely ground coffee beans','粗磨咖啡豆','Café grossièrement moulu','Grob gemahlene Kaffeebohnen','Café molido grueso','굵게 간 커피 원두','粗挽きコーヒー豆','Chicchi di caffè macinati grossolanamente'),
  vinegar:L('White wine vinegar','白葡萄酒醋','Vinaigre de vin blanc','Weißweinessig','Vinagre de vino blanco','화이트 와인 식초','ホワイトワインビネガー','Aceto di vino bianco'),
  cane:L('Sugar-cane syrup','甘蔗糖浆','Sirop de canne','Rohrzuckersirup','Jarabe de caña','사탕수수 시럽','サトウキビシロップ','Sciroppo di canna'),
  water:L('Water','水','Eau','Wasser','Agua','물','水','Acqua'),
  mint:L('Mint','薄荷','Menthe','Minze','Menta','민트','ミント','Menta'),
  grapefruit:L('Grapefruit juice','葡萄柚汁','Jus de pamplemousse','Grapefruitsaft','Zumo de pomelo','자몽 주스','グレープフルーツジュース','Succo di pompelmo'),
  cinnamon:L('Cinnamon syrup','肉桂糖浆','Sirop de cannelle','Zimtsirup','Jarabe de canela','시나몬 시럽','シナモンシロップ','Sciroppo di cannella'),
  ale:L('White ale','白艾尔啤酒','Bière blanche','Weißes Ale','Cerveza blanca','화이트 에일','ホワイトエール','Birra bianca'),
  salt:L('Coconut salt — composition not provided','椰子盐——未公开具体组成','Sel de coco — composition non précisée','Kokossalz — Zusammensetzung nicht angegeben','Sal de coco — composición no indicada','코코넛 소금 — 구성 미공개','ココナッツソルト — 組成の記載なし','Sale al cocco — composizione non indicata'),
};
const brand=(name:string):Localized=>L(name,name,name,name,name,name,name,name);
export const researchTopics:ResearchTopic[]=[
  ...competitionExtensionTopics,
  ...barExtensionTopics,
  ...[2025,2024,2023].map(year=>{
    const url=`https://www.suntory.co.jp/wnb/event/award/result_${year}.html`;
    return {id:`suntory-${year}`,competition:year===2025?'Suntory The Bartender Award':'Suntory The Cocktail Award',year,region:'Japan' as const,scope:'published-finalist-works' as const,officialCount:year===2023?12:8,
      versionIds:catalogue.versions.filter(v=>catalogue.sources.find(s=>s.id===v.sourceId)?.url===url).map(v=>v.id),
      source:{title:`Suntory ${year} · official finalist works`,url,checkedAt:'2026-09-08'}};
  }),
  ...roundElevenTopics.map(topic=>topic.id==='patron-perfectionists-2018-selection'?{
    ...topic,versionIds:[...topic.versionIds,'dauntless-dessert-batch-l','godfathers-affinity-batch-l'],
    research:topic.research?.map(work=>{
      const catalogueVersionId=work.id==='patron-2018-dauntless-dessert'?'dauntless-dessert-batch-l':work.id==='patron-2018-godfathers-affinity'?'godfathers-affinity-batch-l':undefined;
      return catalogueVersionId?{...work,catalogueVersionId}:work;
    }),
  }:topic),
  {id:'bacardi-legacy-2019-japan',competition:'Bacardí Legacy',year:2019,region:'Japan',scope:'national-finalists',officialCount:5,versionIds:[],
    source:{title:'Bacardi Japan · 2019 national finalists',url:'https://www.atpress.ne.jp/news/171847',publishedAt:'2018-11-22',checkedAt:'2026-09-08'},
    research:[
      {id:'legacy-2019-evolver',title:'EVOLVER',author:'岡沼弘泰',bar:'SHADOWBAR · Aomori',materials:[brand('Bacardi Superior'),brand('Martini Bitter'),brand('Velvet Falernum'),materials.lemon,materials.absinthe,materials.orange],original:'バカルディスペリオール／マルティーニビター／ベルベットファレナム／フレッシュレモンジュース／アブサン／オレンジピール'},
      {id:'legacy-2019-oracion',title:'oracion',author:'佐藤麻美',bar:'Pullman Tokyo Tamachi · Platform 9',materials:[brand('Bacardi 8'),materials.apple,materials.sparkling,materials.lime,materials.absinthe,materials.jam],original:'バカルディ８／アップルジュース／スパークリングワイン／ライムジュース／アブサン／アプリコットジャム'},
      {id:'legacy-2019-possibilita',title:'Possibilita',author:'高宮裕輔',bar:'TIGRATO · Tokyo',materials:[brand('Bacardi 8'),brand('Grappa'),brand('Amaretto'),brand('Amaro'),materials.reduction,materials.coffee],original:'バカルディ８／グラッパ／アマレット／アマーロ／ホワイトバルサミコのレディクション（１/２になるまで煮詰めたもの）／コーヒー豆（粗挽き）'},
      {id:'legacy-2019-logos',title:'LOGOS',author:'西野真司',bar:'union · Tokyo',materials:[brand('Bacardi Gold'),brand('Angostura Bitters'),materials.vinegar,materials.cane,materials.water,materials.mint],original:'バカルディゴールド／アンゴスチュラビターズ／ホワイトワインビネガー／サトウキビシロップ／水／ミント'},
      {id:'legacy-2019-partir',title:'PARTIR',author:'水岸直也',bar:'TRUNK(HOTEL) · Tokyo',materials:[brand('Bacardi Gold'),brand('Maraschino'),materials.grapefruit,materials.cinnamon,materials.ale,materials.salt],original:'バカルディゴールド／マラスキーノリキュール／グレープフルーツジュース／シナモンシロップ／ホワイトエール／ココナッツソルト'},
    ]},
];
