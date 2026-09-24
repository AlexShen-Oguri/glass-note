import type {
  Approachability, Cocktail, Flavour, Ingredient, Locale, Localized, RecipeIngredient,
  RecipeVersion, Source, Taste,
} from '../../domain/contracts';
import {LOCALES} from '../../domain/contracts';
import {getResearchWorkView} from '../localization/research';
import {roundElevenTopics} from '../topics-eleven';
import type {ResearchWork} from '../topics';
import {L} from './localized';
import type {CatalogueBatch} from './types';

const checkedAt = '2026-09-16';
const known = (): Pick<Ingredient, 'exclusionTags'|'compositionKnown'> => ({exclusionTags:[],compositionKnown:true});
const unknown = (): Pick<Ingredient, 'exclusionTags'|'compositionKnown'> => ({exclusionTags:[],compositionKnown:false});
const draftOrigin:NonNullable<Ingredient['guide']>['nameOrigin']={
  en:'source',zh:'draft',fr:'draft',de:'draft',es:'draft',ko:'draft',ja:'draft',it:'draft',
};

const patronTopic = roundElevenTopics.find(topic => topic.id === 'patron-perfectionists-2018-selection');
if (!patronTopic) throw new Error('Missing Patrón Perfectionists 2018 research topic');

const researchWork = (id:string): ResearchWork => {
  const work = patronTopic.research?.find(item => item.id === id);
  if (!work) throw new Error(`Missing Patrón research work: ${id}`);
  return work;
};

const dauntlessWork = researchWork('patron-2018-dauntless-dessert');
const godfathersWork = researchWork('patron-2018-godfathers-affinity');
type ResearchView = ReturnType<typeof getResearchWorkView>;

const views = (work:ResearchWork): Record<Locale,ResearchView> => Object.fromEntries(
  LOCALES.map(locale => [locale,getResearchWorkView(work,locale)]),
) as Record<Locale,ResearchView>;
const dauntlessViews = views(dauntlessWork);
const godfathersViews = views(godfathersWork);

const localized = (record:Record<Locale,ResearchView>, select:(view:ResearchView)=>string): Localized => Object.fromEntries(
  LOCALES.map(locale => [locale,select(record[locale])]),
) as Localized;
const materialName = (record:Record<Locale,ResearchView>, index:number): Localized => localized(record,view => view.materials[index]!.name);
const translatedSteps = (record:Record<Locale,ResearchView>): Record<Locale,string[]> => Object.fromEntries(
  LOCALES.map(locale => [locale,[...(record[locale].method ?? [])]]),
) as Record<Locale,string[]>;

const ingredients: Ingredient[] = [
  {id:'grapefruit-oleo-acid',name:materialName(dauntlessViews,1),...known(),guide:{family:'citrus',parents:['grapefruit','oleo acid'],aliases:['grapefruit oleo acid'],nameOrigin:draftOrigin}},
  {id:'black-tea-syrup',name:materialName(dauntlessViews,2),...known(),guide:{family:'syrup',parents:['black tea','syrup'],aliases:['black tea syrup'],nameOrigin:draftOrigin}},
  {id:'bergamot-spirits',name:materialName(dauntlessViews,3),...unknown(),guide:{family:'spirit',parents:['bergamot'],aliases:['bergamot spirits'],nameOrigin:draftOrigin}},
  {id:'coriander-seed-soda',name:materialName(godfathersViews,2),...unknown(),guide:{family:'soda',parents:['coriander seed','soda'],aliases:['coriander seed soda'],nameOrigin:draftOrigin}},
  {id:'pickled-dry-crab-apple-reduction',name:materialName(godfathersViews,3),...unknown(),guide:{family:'apple',parents:['crab apple','reduction'],aliases:['pickled dry crab apple reduction'],nameOrigin:draftOrigin}},
  {id:'lime-zest-spray',name:materialName(godfathersViews,5),...unknown(),guide:{family:'citrus',parents:['lime zest','spray'],aliases:['lime zest spray'],nameOrigin:draftOrigin}},
  {id:'apple-crisp',name:materialName(godfathersViews,6),...unknown(),guide:{family:'apple',parents:['apple','crisp'],aliases:['apple crisp'],nameOrigin:draftOrigin}},
];

const brands: CatalogueBatch['brands'] = [
  {id:'brand-martini',name:'Martini',ingredientIds:['amber-vermouth']},
];

const sourceLabel = L(
  'Patrón official 2018 competition recipe',
  'Patrón 官方 2018 赛事配方',
  'Recette officielle Patrón du concours 2018',
  'Offizielles Patrón-Wettbewerbsrezept 2018',
  'Receta oficial Patrón de la competición 2018',
  'Patrón 공식 2018 대회 레시피',
  'Patrón公式2018年大会レシピ',
  'Ricetta ufficiale Patrón della competizione 2018',
);

const editorialProfileNote = L(
  'Flavour, taste, and approachability are editorial assessments from the official ingredients and method; finished-drink strength and ABV remain unknown.',
  '风味、味觉与入口难易度是依据官方材料和步骤作出的编辑判断；成品酒精强度与 ABV 仍为未知。',
  'Les saveurs, le goût et l’accessibilité sont des évaluations éditoriales fondées sur les ingrédients et la méthode officiels ; la force et le degré final restent inconnus.',
  'Aromen, Geschmack und Zugänglichkeit sind redaktionelle Einschätzungen aus den offiziellen Zutaten und der Methode; Stärke und ABV des fertigen Drinks bleiben unbekannt.',
  'El sabor, el gusto y la accesibilidad son valoraciones editoriales basadas en los ingredientes y el método oficiales; la fuerza y el ABV finales siguen desconocidos.',
  '풍미, 맛, 접근성은 공식 재료와 제조법을 바탕으로 한 편집 판단이며 완성 음료의 강도와 ABV는 미상입니다.',
  '風味、味わい、親しみやすさは公式材料と手順に基づく編集判断です。完成酒の強度とABVは不明のままです。',
  'Aromi, gusto e accessibilità sono valutazioni editoriali basate su ingredienti e metodo ufficiali; forza e ABV finali restano sconosciuti.',
);

const dauntlessIngredients: RecipeIngredient[] = [
  {ingredientId:'tequila',amount:52.5,unit:'ml',brandId:'brand-patron',note:L('The source requires Patrón Reposado.','来源指定 Patrón Reposado。','La source impose Patrón Reposado.','Die Quelle verlangt Patrón Reposado.','La fuente exige Patrón Reposado.','출처는 Patrón Reposado를 지정합니다.','出典はPatrón Reposadoを指定します。','La fonte richiede Patrón Reposado.')},
  {ingredientId:'grapefruit-oleo-acid',amount:30,unit:'ml',note:L('The official page heading writes “grapefruit oleic acid”; its disclosed zest-and-sugar preparation is recorded as grapefruit oleo acid, matching the research record.','官方页面标题写作“grapefruit oleic acid”；其公开的果皮与糖制作法按研究记录保留为 grapefruit oleo acid。','La page officielle écrit « grapefruit oleic acid » ; sa préparation publiée au zeste et au sucre est conservée comme grapefruit oleo acid, conformément au dossier de recherche.','Die offizielle Seite schreibt „grapefruit oleic acid“; die veröffentlichte Zesten-Zucker-Zubereitung wird entsprechend dem Forschungseintrag als Grapefruit Oleo Acid geführt.','La página oficial escribe “grapefruit oleic acid”; su preparación publicada de piel y azúcar se registra como grapefruit oleo acid, conforme al estudio.','공식 페이지 표제는 “grapefruit oleic acid”라고 쓰지만 공개된 제스트·설탕 제조법은 연구 기록과 같이 grapefruit oleo acid로 보존합니다.','公式ページの見出しは「grapefruit oleic acid」ですが、公開されたゼストと砂糖の製法は研究記録に合わせてgrapefruit oleo acidとして保持します。','La pagina ufficiale scrive “grapefruit oleic acid”; la preparazione pubblicata con scorze e zucchero è registrata come grapefruit oleo acid, coerentemente con la ricerca.')},
  {ingredientId:'black-tea-syrup',amount:15,unit:'ml'},
  {ingredientId:'bergamot-spirits',amount:1,unit:'barspoon',note:L('The source names bergamot spirits but does not publish composition or preparation.','来源列出佛手柑烈酒，但未公开组成或制作方法。','La source nomme un spiritueux de bergamote sans en publier la composition ni la préparation.','Die Quelle nennt Bergamotte-Spirituose, veröffentlicht aber weder Zusammensetzung noch Zubereitung.','La fuente nombra destilado de bergamota, pero no publica composición ni preparación.','출처는 베르가모트 스피릿을 명시하지만 구성과 제조법은 공개하지 않습니다.','出典はベルガモット・スピリッツを記載しますが、組成と製法は未公開です。','La fonte indica un distillato alla bergamotta ma non ne pubblica composizione o preparazione.')},
  {ingredientId:'absinthe',amount:1,unit:'barspoon'},
  {ingredientId:'food-grapefruit',amount:null,unit:'piece',note:L('Grapefruit zest garnish; the source gives no quantity.','葡萄柚皮装饰；来源未给用量。','Garniture de zeste de pamplemousse ; quantité non précisée.','Grapefruitzesten-Garnitur; die Quelle nennt keine Menge.','Piel de pomelo para decorar; la fuente no da cantidad.','자몽 제스트 가니시이며 출처는 수량을 제시하지 않습니다.','グレープフルーツゼストの飾り。出典に量の指定はありません。','Scorza di pompelmo per guarnire; la fonte non indica la quantità.')},
];

const godfathersIngredients: RecipeIngredient[] = [
  {ingredientId:'tequila',amount:45,unit:'ml',brandId:'brand-patron',note:L('The source requires Patrón Silver.','来源指定 Patrón Silver。','La source impose Patrón Silver.','Die Quelle verlangt Patrón Silver.','La fuente exige Patrón Silver.','출처는 Patrón Silver를 지정합니다.','出典はPatrón Silverを指定します。','La fonte richiede Patrón Silver.')},
  {ingredientId:'amber-vermouth',amount:15,unit:'ml',brandId:'brand-martini',note:L('The source requires Martini Ambrato.','来源指定 Martini Ambrato。','La source impose Martini Ambrato.','Die Quelle verlangt Martini Ambrato.','La fuente exige Martini Ambrato.','출처는 Martini Ambrato를 지정합니다.','出典はMartini Ambratoを指定します。','La fonte richiede Martini Ambrato.')},
  {ingredientId:'coriander-seed-soda',amount:75,unit:'ml',note:L('The official page spells “corriander”; composition, carbonation, and preparation are not published.','官方页面拼作“corriander”；组成、充气方式与制作方法均未公开。','La page officielle écrit « corriander » ; composition, gazéification et préparation ne sont pas publiées.','Die offizielle Seite schreibt „corriander“; Zusammensetzung, Karbonisierung und Zubereitung sind nicht veröffentlicht.','La página oficial escribe “corriander”; no se publican composición, carbonatación ni preparación.','공식 페이지는 “corriander”로 표기하며 구성, 탄산화, 제조법은 공개하지 않습니다.','公式ページの綴りは「corriander」。組成、炭酸化、製法は未公開です。','La pagina ufficiale scrive “corriander”; composizione, carbonatazione e preparazione non sono pubblicate.')},
  {ingredientId:'pickled-dry-crab-apple-reduction',amount:15,unit:'ml',note:L('The source does not publish its composition or preparation.','来源未公开其组成或制作方法。','La source n’en publie ni la composition ni la préparation.','Die Quelle veröffentlicht weder Zusammensetzung noch Zubereitung.','La fuente no publica su composición ni preparación.','출처는 구성과 제조법을 공개하지 않습니다.','出典は組成と製法を公開していません。','La fonte non ne pubblica composizione o preparazione.')},
  {ingredientId:'lime-juice',amount:7.5,unit:'ml'},
  {ingredientId:'lime-zest-spray',amount:null,unit:'spray',note:L('Used to finish the drink; the source does not state a number of sprays or a preparation.','用于收尾；来源未说明喷洒次数或制作方法。','Utilisé en finition ; la source ne précise ni le nombre de pulvérisations ni la préparation.','Zum Abschluss; die Quelle nennt weder Anzahl der Sprühstöße noch Zubereitung.','Se usa al final; la fuente no indica número de pulverizaciones ni preparación.','마무리에 사용하며 출처는 분사 횟수나 제조법을 밝히지 않습니다.','仕上げ用。出典はスプレー回数と製法を指定していません。','Usato per finire; la fonte non indica numero di spruzzi o preparazione.')},
  {ingredientId:'apple-crisp',amount:null,unit:'piece',note:L('Garnish; quantity and preparation are not specified.','装饰；未注明用量与制作方法。','Garniture ; quantité et préparation non précisées.','Garnitur; Menge und Zubereitung sind nicht angegeben.','Decoración; no se indican cantidad ni preparación.','가니시이며 수량과 제조법은 명시되지 않았습니다.','飾り。分量と製法は指定されていません。','Guarnizione; quantità e preparazione non specificate.')},
];

interface VersionDef {
  id:'dauntless-dessert'|'godfathers-affinity';
  work:ResearchWork;
  record:Record<Locale,ResearchView>;
  sourceId:string;
  countryCodes:string[];
  ingredients:RecipeIngredient[];
  glass:Localized;
  garnish:Localized;
  flavours:Flavour[];
  tastes:Taste[];
  approachability:Approachability;
  description:Localized;
  accent:string;
  mixingStepIndex:number;
}

const defs: VersionDef[] = [
  {
    id:'dauntless-dessert',work:dauntlessWork,record:dauntlessViews,sourceId:'batch-l-dauntless-dessert',countryCodes:['DE'],ingredients:dauntlessIngredients,
    glass:L('Cordial glass, served up','无冰出品的 cordial 杯','Verre à cordial, servi sans glace','Cordialglas, ohne Eis serviert','Copa cordial, servido sin hielo','얼음 없이 서브하는 코디얼 글라스','氷なしで供するコーディアルグラス','Bicchiere da cordial, servito senza ghiaccio'),
    garnish:materialName(dauntlessViews,5),flavours:['citrus','herbal'],tastes:['sour','sweet'],approachability:'bold',accent:'#C88B45',mixingStepIndex:1,
    description:L('Chloé Merz’s Germany-winning 2018 Patrón Perfectionists serve combines reposado tequila with fully published grapefruit oleo acid and black-tea syrup preparations.','Chloé Merz 的 2018 Patrón Perfectionists 德国赛区冠军作品，将 Reposado 龙舌兰与已完整公开的葡萄柚 oleo acid 及红茶糖浆结合。','La création gagnante allemande 2018 de Chloé Merz pour Patrón Perfectionists associe tequila reposado, oleo-acide de pamplemousse et sirop de thé noir entièrement publiés.','Chloé Merz’ deutscher Patrón-Perfectionists-Siegerdrink 2018 verbindet Reposado-Tequila mit vollständig veröffentlichtem Grapefruit Oleo Acid und Schwarzteesirup.','La obra ganadora de Alemania 2018 de Chloé Merz en Patrón Perfectionists combina tequila reposado con preparaciones publicadas de oleoácido de pomelo y jarabe de té negro.','클로에 메르츠의 2018 Patrón Perfectionists 독일 우승작은 레포사도 테킬라에 전체 제조법이 공개된 자몽 올레오 애시드와 홍차 시럽을 결합합니다.','Chloé Merzによる2018年Patrón Perfectionistsドイツ優勝作。レポサドテキーラに、全製法が公開されたグレープフルーツ・オレオアシッドと紅茶シロップを合わせます。','Il drink vincitore tedesco 2018 di Chloé Merz per Patrón Perfectionists unisce tequila reposado a preparazioni pubblicate di oleo-acido di pompelmo e sciroppo di tè nero.'),
  },
  {
    id:'godfathers-affinity',work:godfathersWork,record:godfathersViews,sourceId:'batch-l-godfathers-affinity',countryCodes:['GB'],ingredients:godfathersIngredients,
    glass:L('Wine glass over cubed ice','装方冰的葡萄酒杯','Verre à vin sur glaçons','Weinglas über Eiswürfeln','Copa de vino con cubos de hielo','각얼음을 넣은 와인 글라스','角氷入りワイングラス','Calice da vino con ghiaccio a cubetti'),
    garnish:materialName(godfathersViews,6),flavours:['fruit','citrus','spice'],tastes:['sour','sweet','refreshing'],approachability:'balanced',accent:'#D1A25A',mixingStepIndex:0,
    description:L("Nicole Sykes’s United Kingdom-winning 2018 Patrón Perfectionists serve pairs silver tequila and amber vermouth with crab apple, coriander soda, lime, and an apple crisp.",'Nicole Sykes 的 2018 Patrón Perfectionists 英国赛区冠军作品，以银龙舌兰和琥珀味美思搭配海棠果、芫荽籽苏打、青柠与苹果脆片。',"La création gagnante du Royaume-Uni 2018 de Nicole Sykes pour Patrón Perfectionists associe tequila silver, vermouth ambré, pommette, soda à la coriandre, citron vert et croquant de pomme.","Nicole Sykes’ britischer Patrón-Perfectionists-Siegerdrink 2018 verbindet Silver Tequila und Amber Wermut mit Holzapfel, Koriandersamen-Soda, Limette und Apfelchip.","La obra ganadora del Reino Unido 2018 de Nicole Sykes en Patrón Perfectionists combina tequila silver y vermut ámbar con manzana silvestre, soda de cilantro, lima y crujiente de manzana.",'니콜 사익스의 2018 Patrón Perfectionists 영국 우승작은 실버 테킬라와 앰버 베르무트에 야생사과, 고수 씨앗 소다, 라임, 사과 크리스프를 결합합니다.','Nicole Sykesによる2018年Patrón Perfectionists英国優勝作。シルバーテキーラとアンバーベルモットに、クラブアップル、コリアンダーソーダ、ライム、アップルクリスプを合わせます。',"Il drink vincitore del Regno Unito 2018 di Nicole Sykes per Patrón Perfectionists abbina tequila silver e vermouth ambrato a mela selvatica, soda al coriandolo, lime e croccante di mela."),
  },
];

const sources: Source[] = defs.map(def => ({
  id:def.sourceId,title:def.work.source!.title,url:def.work.source!.url,author:def.work.author,checkedAt,
}));

const versions: RecipeVersion[] = defs.map(def => ({
  id:`${def.id}-batch-l`,cocktailId:def.id,label:sourceLabel,sourceId:def.sourceId,servings:1,
  origin:{kind:'competition',topicId:'patron-perfectionists-2018-selection',countryCodes:def.countryCodes,event:'Patrón Perfectionists 2018',year:2018},
  ingredients:def.ingredients,steps:translatedSteps(def.record),originalLanguage:'en',originalSteps:[...(def.work.method ?? [])],
  mixingMethods:[{method:'shake',sourceId:def.sourceId,stepIndexes:[def.mixingStepIndex],reviewedAt:checkedAt}],
  glass:def.glass,garnish:def.garnish,flavours:def.flavours,tastes:def.tastes,strength:null,approachability:def.approachability,
  profileBasis:'editorial',profileNote:editorialProfileNote,sourceChecked:true,translationStatus:'draft',
}));

const cocktails: Cocktail[] = defs.map(def => ({
  id:def.id,name:L(def.work.title,def.work.title,def.work.title,def.work.title,def.work.title,def.work.title,def.work.title,def.work.title),aliases:[],category:'curated',
  description:def.description,versionIds:[`${def.id}-batch-l`],defaultVersionId:`${def.id}-batch-l`,accent:def.accent,
}));

export const batchL: CatalogueBatch = {cocktails,versions,sources,ingredients,brands};
export default batchL;
