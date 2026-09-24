import type {
  Approachability, Cocktail, Flavour, Ingredient, Localized, RecipeIngredient,
  RecipeVersion, Source, Taste,
} from '../../domain/contracts';
import {L, S} from './localized';
import type {CatalogueBatch} from './types';

const checkedAt = '2026-09-16';
const known = (exclusionTags: Ingredient['exclusionTags'] = []): Pick<Ingredient, 'exclusionTags'|'compositionKnown'> => ({exclusionTags, compositionKnown:true});
const note = L;
const draftOrigin:NonNullable<Ingredient['guide']>['nameOrigin']={
  en:'source',zh:'draft',fr:'draft',de:'draft',es:'draft',ko:'draft',ja:'draft',it:'draft',
};

const ingredients: Ingredient[] = [
  {id:'vanilla-syrup',name:L('Vanilla syrup','香草糖浆','Sirop de vanille','Vanillesirup','Sirope de vainilla','바닐라 시럽','バニラシロップ','Sciroppo alla vaniglia'),...known(),guide:{family:'syrup',parents:['vanilla','syrup'],aliases:['vanilla syrup'],nameOrigin:draftOrigin}},
];

const brands: CatalogueBatch['brands'] = [
  {id:'brand-havana-club',name:'Havana Club',ingredientIds:['aged-rum','cuban-rum']},
];

const sourceLabel = (en:string, zh:string, fr:string, de:string, es:string, ko:string, ja:string, it:string): Localized =>
  L(en,zh,fr,de,es,ko,ja,it);

const currentDiffordLabel = sourceLabel(
  'Current Difford’s Guide published version',
  'Difford’s Guide 当前发布版本',
  'Version actuellement publiée par Difford’s Guide',
  'Aktuell veröffentlichte Version von Difford’s Guide',
  'Versión publicada actualmente por Difford’s Guide',
  '현재 Difford’s Guide 공개 버전',
  'Difford’s Guide 現行掲載版',
  'Versione attualmente pubblicata da Difford’s Guide',
);

const editorialProfileNote = L(
  'Flavour, taste, and approachability are editorial assessments from the published ingredients and method; alcohol-strength classification remains unknown.',
  '风味、味觉与入口难易度是依据公开材料和步骤作出的编辑判断；酒精强度分类仍为未知。',
  'Les saveurs, le goût et l’accessibilité sont des évaluations éditoriales tirées des ingrédients et de la méthode publiés ; la catégorie de force alcoolique reste inconnue.',
  'Aromen, Geschmack und Zugänglichkeit sind redaktionelle Einschätzungen aus den veröffentlichten Zutaten und der Methode; die Alkoholstärke bleibt unbekannt.',
  'El sabor, el gusto y la accesibilidad son valoraciones editoriales basadas en los ingredientes y el método publicados; la categoría de graduación sigue siendo desconocida.',
  '풍미, 맛, 접근성은 공개된 재료와 제조법을 바탕으로 한 편집 판단이며, 알코올 강도 분류는 미상입니다.',
  '風味、味わい、親しみやすさは公開材料と手順に基づく編集判断です。アルコール強度区分は不明のままです。',
  'Aromi, gusto e accessibilità sono valutazioni editoriali basate su ingredienti e metodo pubblicati; la categoria di intensità alcolica resta sconosciuta.',
);

const cocktailNames: Record<string, Localized> = {
  'maid-in-cuba':L('Maid in Cuba','Maid in Cuba','Maid in Cuba','Maid in Cuba','Maid in Cuba','Maid in Cuba','メイド・イン・キューバ','Maid in Cuba'),
  'le-latin':L('Le Latin','Le Latin','Le Latin','Le Latin','Le Latin','Le Latin','ル・ラタン','Le Latin'),
  venceremos:L('Venceremos','Venceremos','Venceremos','Venceremos','Venceremos','Venceremos','ベンセレーモス','Venceremos'),
  clarita:L('Clarita','Clarita','Clarita','Clarita','Clarita','Clarita','クラリータ','Clarita'),
  carino:L('Cariño','Cariño','Cariño','Cariño','Cariño','Cariño','カリーニョ','Cariño'),
  'pink-me-up':L('Pink Me Up','Pink Me Up','Pink Me Up','Pink Me Up','Pink Me Up','Pink Me Up','ピンク・ミー・アップ','Pink Me Up'),
};

interface RecipeDef {
  id:string;
  year:number;
  countryCodes:string[];
  event:string;
  venue:string;
  label:Localized;
  sourceId:string;
  ingredients:RecipeIngredient[];
  steps:RecipeVersion['steps'];
  originalSteps:string[];
  glass:Localized;
  garnish:Localized;
  flavours:Flavour[];
  tastes:Taste[];
  approachability:Approachability;
  description:Localized;
  accent:string;
  mixingMethod:'shake'|'stir';
  mixingStepIndex:number;
}

const coupe = L('Chilled coupe','冰镇碟形杯','Coupe refroidie','Gekühlte Coupette','Copa coupe fría','차갑게 식힌 쿠페','冷やしたクープ','Coppa raffreddata');
const nickAndNora = L('Chilled Nick and Nora glass','冰镇 Nick and Nora 杯','Verre Nick and Nora refroidi','Gekühltes Nick-and-Nora-Glas','Copa Nick and Nora fría','차갑게 식힌 닉 앤 노라 글라스','冷やしたニック＆ノラ','Bicchiere Nick and Nora raffreddato');

const recipes: RecipeDef[] = [
  {
    id:'maid-in-cuba',year:2014,countryCodes:['GB'],event:'Bacardí Legacy Global Cocktail Competition 2014',venue:'The Savoy, London',
    label:sourceLabel('BACARDÍ current official web recipe','BACARDÍ 当前官方网页配方','Recette web officielle actuelle de BACARDÍ','Aktuelles offizielles BACARDÍ-Webrezept','Receta web oficial actual de BACARDÍ','현재 BACARDÍ 공식 웹 레시피','BACARDÍ 現行公式ウェブレシピ','Ricetta web ufficiale attuale BACARDÍ'),
    sourceId:'batch-j-maid-in-cuba',
    ingredients:[
      {ingredientId:'white-rum',amount:2,unit:'oz',brandId:'brand-bacardi',note:note('The source requires BACARDÍ Superior rum.','来源指定 BACARDÍ Superior 朗姆酒。','La source impose le rhum BACARDÍ Superior.','Die Quelle verlangt BACARDÍ Superior Rum.','La fuente exige ron BACARDÍ Superior.','출처는 BACARDÍ Superior 럼을 지정합니다.','出典はBACARDÍ Superiorラムを指定します。','La fonte richiede rum BACARDÍ Superior.')},
      {ingredientId:'lime-juice',amount:.75,unit:'oz'},{ingredientId:'simple-syrup',amount:.5,unit:'oz'},
      {ingredientId:'absinthe',amount:.25,unit:'oz',note:note('Reserved for rinsing the chilled coupe; do not shake it with the drink.','用于润洗冰镇碟形杯；不要与饮品一起摇和。','Réservée au rinçage de la coupe froide ; ne pas la shaker avec le cocktail.','Zum Ausspülen der gekühlten Coupette; nicht mit dem Drink shaken.','Se reserva para enjuagar la coupe fría; no se agita con la bebida.','차가운 쿠페를 린스하는 용도이며 음료와 함께 셰이크하지 않습니다.','冷やしたクープのリンス用。ドリンクとはシェイクしません。','Riservato al risciacquo della coppa fredda; non shakerare con il drink.')},
      {ingredientId:'mint-leaves',amount:7,unit:'piece'},
      {ingredientId:'fresh-cucumber-slice',amount:2,unit:'piece',note:note('English cucumber, peeled. The source explicitly says not to muddle it.','去皮英式黄瓜；来源明确要求不要捣压。','Concombre anglais pelé ; la source demande explicitement de ne pas le piler.','Geschälte englische Gurke; laut Quelle ausdrücklich nicht muddeln.','Pepino inglés pelado; la fuente indica expresamente que no se machaque.','껍질을 벗긴 잉글리시 오이이며, 출처는 머들하지 말라고 명시합니다.','皮をむいたイングリッシュキュウリ。出典は潰さないよう明記。','Cetriolo inglese pelato; la fonte dice esplicitamente di non pestarlo.')},
      {ingredientId:'soda-water',amount:null,unit:'top',note:note('A splash; the source gives no numeric quantity.','少量飞溅；来源未给数值。','Une petite quantité ; la source ne donne pas de mesure chiffrée.','Ein Spritzer; die Quelle nennt keine Menge.','Un chorrito; la fuente no da una cantidad numérica.','소량이며 출처는 수치를 제시하지 않습니다.','少量。出典に数値指定はありません。','Uno splash; la fonte non indica una quantità numerica.')},
    ],
    steps:S(
      ['Shake the rum, lime, syrup, mint, and peeled cucumber with ice; do not muddle the cucumber.','Fine-strain into a chilled coupe rinsed with the measured absinthe.','Top with a splash of soda water and garnish with cucumber.'],
      ['朗姆、青柠汁、糖浆、薄荷与去皮黄瓜加冰摇匀；不要捣压黄瓜。','细滤入以量取苦艾酒润洗过的冰镇碟形杯。','补少量苏打水，以黄瓜装饰。'],
      ['Shaker le rhum, le citron vert, le sirop, la menthe et le concombre pelé avec glace, sans piler le concombre.','Filtrer finement dans une coupe froide rincée avec l’absinthe mesurée.','Ajouter un trait de soda et garnir de concombre.'],
      ['Rum, Limette, Sirup, Minze und geschälte Gurke mit Eis shaken; die Gurke nicht muddeln.','Fein in eine gekühlte, mit der abgemessenen Absinthmenge ausgespülte Coupette abseihen.','Mit einem Spritzer Soda auffüllen und mit Gurke garnieren.'],
      ['Agita ron, lima, almíbar, menta y pepino pelado con hielo; no machaques el pepino.','Cuela fino en una coupe fría enjuagada con la absenta medida.','Añade un chorrito de soda y decora con pepino.'],
      ['럼, 라임, 시럽, 민트, 껍질 벗긴 오이를 얼음과 셰이크하되 오이는 머들하지 않습니다.','계량한 압생트로 린스한 차가운 쿠페에 파인 스트레인합니다.','소다를 약간 더하고 오이로 장식합니다.'],
      ['ラム、ライム、シロップ、ミント、皮をむいたキュウリを氷とシェイクする。キュウリは潰さない。','計量したアブサンでリンスした冷たいクープへファインストレイン。','ソーダを少量加え、キュウリを飾る。'],
      ['Shakerare rum, lime, sciroppo, menta e cetriolo pelato con ghiaccio, senza pestare il cetriolo.','Filtrare fine in una coppa fredda risciacquata con l’assenzio misurato.','Aggiungere uno splash di soda e guarnire con cetriolo.'],
    ),
    originalSteps:['Shake all ingredients except absinthe and soda with ice; do not muddle the cucumber.','Fine-strain into a chilled, absinthe-rinsed coupe.','Top with a splash of soda and garnish with cucumber.'],
    glass:coupe,garnish:L('Cucumber slice','黄瓜片','Tranche de concombre','Gurkenscheibe','Rodaja de pepino','오이 슬라이스','キュウリスライス','Fetta di cetriolo'),
    flavours:['citrus','herbal'],tastes:['sour','sweet','refreshing'],approachability:'balanced',accent:'#A7C7A0',mixingMethod:'shake',mixingStepIndex:0,
    description:L('Tom Walker’s 2014 global winner combines a Daiquiri frame with mint, cucumber, an absinthe rinse, and soda.','Tom Walker 的 2014 年全球冠军作品以代基里结构结合薄荷、黄瓜、苦艾润杯与苏打。','Le vainqueur mondial 2014 de Tom Walker associe une base de Daiquiri à la menthe, au concombre, à un rinçage d’absinthe et au soda.','Tom Walkers globaler Siegerdrink von 2014 verbindet eine Daiquiri-Struktur mit Minze, Gurke, Absinth-Rinse und Soda.','El ganador global de 2014 de Tom Walker une una estructura de Daiquiri con menta, pepino, enjuague de absenta y soda.','톰 워커의 2014년 글로벌 우승작은 다이키리 구조에 민트, 오이, 압생트 린스, 소다를 결합합니다.','トム・ウォーカーの2014年世界優勝作。ダイキリの骨格にミント、キュウリ、アブサンリンス、ソーダを重ねます。','Il vincitore globale 2014 di Tom Walker unisce una struttura da Daiquiri a menta, cetriolo, rinse d’assenzio e soda.'),
  },
  {
    id:'le-latin',year:2015,countryCodes:['FR'],event:'Bacardí Legacy Global Cocktail Competition 2015',venue:'Redwood, Lyon',
    label:sourceLabel('BACARDÍ current official web recipe','BACARDÍ 当前官方网页配方','Recette web officielle actuelle de BACARDÍ','Aktuelles offizielles BACARDÍ-Webrezept','Receta web oficial actual de BACARDÍ','현재 BACARDÍ 공식 웹 레시피','BACARDÍ 現行公式ウェブレシピ','Ricetta web ufficiale attuale BACARDÍ'),sourceId:'batch-j-le-latin',
    ingredients:[
      {ingredientId:'white-rum',amount:1.5,unit:'oz',brandId:'brand-bacardi',note:note('The source requires BACARDÍ Superior rum.','来源指定 BACARDÍ Superior 朗姆酒。','La source impose le rhum BACARDÍ Superior.','Die Quelle verlangt BACARDÍ Superior Rum.','La fuente exige ron BACARDÍ Superior.','출처는 BACARDÍ Superior 럼을 지정합니다.','出典はBACARDÍ Superiorラムを指定します。','La fonte richiede rum BACARDÍ Superior.')},
      {ingredientId:'dry-white-wine',amount:2/3,unit:'oz',note:note('The source specifies Viognier white wine (spelled “Voignier” on the page).','来源指定 Viognier 白葡萄酒（页面拼作“Voignier”）。','La source précise un vin blanc viognier (orthographié « Voignier » sur la page).','Die Quelle nennt Viognier-Weißwein (auf der Seite „Voignier“ geschrieben).','La fuente especifica vino blanco Viognier (escrito “Voignier” en la página).','출처는 비오니에 화이트 와인을 지정하며 페이지에는 “Voignier”로 표기됩니다.','出典指定はヴィオニエ白ワイン（ページ表記は「Voignier」）。','La fonte specifica vino bianco Viognier (scritto “Voignier” nella pagina).')},
      {ingredientId:'lemon-juice',amount:2/3,unit:'oz'},{ingredientId:'green-olive-brine',amount:1/6,unit:'oz'},{ingredientId:'simple-syrup',amount:1/3,unit:'oz'},
    ],
    steps:S(
      ['Add the five liquid ingredients to a shaker, shake with cubed ice, and strain into a chilled Nick and Nora glass.','Garnish with one green olive.'],
      ['将五种液体材料倒入摇壶，以方冰摇匀，滤入冰镇 Nick and Nora 杯。','以一颗绿橄榄装饰。'],
      ['Verser les cinq liquides dans un shaker, shaker avec des glaçons et filtrer dans un Nick and Nora froid.','Garnir d’une olive verte.'],
      ['Die fünf flüssigen Zutaten in den Shaker geben, mit Eiswürfeln shaken und in ein gekühltes Nick-and-Nora-Glas abseihen.','Mit einer grünen Olive garnieren.'],
      ['Añade los cinco líquidos a la coctelera, agita con cubos de hielo y cuela en una copa Nick and Nora fría.','Decora con una aceituna verde.'],
      ['다섯 액체 재료를 셰이커에 넣고 큐브 아이스와 흔들어 차가운 닉 앤 노라에 거릅니다.','그린 올리브 한 개로 장식합니다.'],
      ['5種の液体材料をシェーカーに入れ、角氷とシェイクして冷やしたニック＆ノラへこす。','グリーンオリーブ1個を飾る。'],
      ['Versare i cinque liquidi nello shaker, shakerare con cubetti di ghiaccio e filtrare in un Nick and Nora freddo.','Guarnire con un’oliva verde.'],
    ),
    originalSteps:['Pour all liquid ingredients into a shaker, shake with cubed ice, and strain into a chilled Nick and Nora glass.','Garnish with one olive.'],
    glass:nickAndNora,garnish:L('One green olive','一颗绿橄榄','Une olive verte','Eine grüne Olive','Una aceituna verde','그린 올리브 1개','グリーンオリーブ1個','Un’oliva verde'),
    flavours:['citrus','fruit'],tastes:['sour','sweet','dry'],approachability:'balanced',accent:'#D7C47F',mixingMethod:'shake',mixingStepIndex:0,
    description:L('Franck Dedieu’s 2015 global winner pairs white rum with Viognier, lemon, olive brine, and simple syrup.','Franck Dedieu 的 2015 年全球冠军作品将白朗姆与 Viognier、柠檬、橄榄盐水及糖浆结合。','Le vainqueur mondial 2015 de Franck Dedieu associe rhum blanc, viognier, citron, saumure d’olive et sirop.','Franck Dedieus globaler Siegerdrink von 2015 verbindet weißen Rum mit Viognier, Zitrone, Olivenlake und Sirup.','El ganador global de 2015 de Franck Dedieu combina ron blanco, Viognier, limón, salmuera de aceituna y almíbar.','프랑크 드디외의 2015년 글로벌 우승작은 화이트 럼에 비오니에, 레몬, 올리브 브라인, 시럽을 결합합니다.','フランク・デデューの2015年世界優勝作。ホワイトラムにヴィオニエ、レモン、オリーブブライン、シロップを合わせます。','Il vincitore globale 2015 di Franck Dedieu abbina rum bianco, Viognier, limone, salamoia d’oliva e sciroppo.'),
  },
  {
    id:'venceremos',year:2016,countryCodes:['US'],event:'Bacardí Legacy Global Cocktail Competition 2016',venue:"Angel's Share, New York City",label:currentDiffordLabel,sourceId:'batch-j-venceremos-recipe',
    ingredients:[
      {ingredientId:'light-rum',amount:1.5,unit:'oz',note:note('The current Difford’s version specifies charcoal-filtered light white rum aged one to four years; it does not preserve the contest brand as a requirement.','当前 Difford’s 版本指定经木炭过滤、陈年 1–4 年的淡色白朗姆；未把赛事品牌保留为强制要求。','La version Difford’s actuelle précise un rhum blanc léger filtré au charbon et âgé de un à quatre ans ; la marque du concours n’est pas imposée.','Die aktuelle Difford’s-Version nennt holzkohlegefilterten, ein bis vier Jahre gereiften leichten weißen Rum; die Wettbewerbsmarke ist nicht vorgeschrieben.','La versión actual de Difford’s pide ron blanco ligero filtrado con carbón y añejado de uno a cuatro años; no exige la marca del concurso.','현재 Difford’s 버전은 숯 여과 후 1~4년 숙성한 라이트 화이트 럼을 지정하며 대회 브랜드는 필수로 유지하지 않습니다.','現行Difford’s版は、活性炭濾過した1〜4年熟成のライトホワイトラムを指定。大会時のブランド指定は要件として残していません。','La versione Difford’s attuale richiede rum bianco leggero filtrato a carbone e invecchiato da uno a quattro anni; il marchio di gara non resta obbligatorio.')},
      {ingredientId:'coconut-liqueur',amount:.5,unit:'oz',note:note('Coconut rum liqueur in the 35–40% ABV category; no numeric ABV is assigned to the finished drink here.','使用 35–40% ABV 类别的椰子朗姆利口酒；此处不为成品酒虚构具体酒精度。','Liqueur de rhum à la noix de coco de la catégorie 35–40 % vol. ; aucun degré chiffré n’est attribué au cocktail fini ici.','Kokos-Rumlikör der Kategorie 35–40 % vol.; dem fertigen Drink wird hier kein Zahlenwert zugewiesen.','Licor de ron de coco de la categoría 35–40 % vol.; aquí no se asigna graduación numérica al cóctel terminado.','35~40% ABV 범주의 코코넛 럼 리큐어이며 완성 음료의 수치 도수는 부여하지 않습니다.','35〜40% ABVのココナッツ・ラムリキュール。完成酒の数値ABVはここでは付与しません。','Liquore al rum e cocco nella categoria 35–40% vol.; qui non si assegna un valore alcolico numerico al drink finito.')},
      {ingredientId:'pineapple-juice',amount:5/6,unit:'oz'},{ingredientId:'food-cucumber-juice',amount:.5,unit:'oz',note:note('Freshly extracted cucumber juice.','鲜榨黄瓜汁。','Jus de concombre fraîchement extrait.','Frisch extrahierter Gurkensaft.','Jugo de pepino recién extraído.','갓 추출한 오이 주스.','搾りたてのキュウリジュース。','Succo di cetriolo appena estratto.')},{ingredientId:'lime-juice',amount:1/6,unit:'oz'},{ingredientId:'food-sesame-oil',amount:1,unit:'dash'},
    ],
    steps:S(
      ['Shake all six ingredients with ice.','Strain into a wine glass filled with ice and garnish with pineapple leaves.'],
      ['六种材料全部加冰摇匀。','滤入装冰葡萄酒杯，以菠萝叶装饰。'],
      ['Shaker les six ingrédients avec glace.','Filtrer dans un verre à vin rempli de glace et garnir de feuilles d’ananas.'],
      ['Alle sechs Zutaten mit Eis shaken.','In ein mit Eis gefülltes Weinglas abseihen und mit Ananasblättern garnieren.'],
      ['Agita los seis ingredientes con hielo.','Cuela en una copa de vino con hielo y decora con hojas de piña.'],
      ['여섯 재료를 모두 얼음과 셰이크합니다.','얼음 채운 와인 잔에 거르고 파인애플 잎으로 장식합니다.'],
      ['6材料をすべて氷とシェイクする。','氷入りワイングラスへこし、パイナップルの葉を飾る。'],
      ['Shakerare tutti e sei gli ingredienti con ghiaccio.','Filtrare in un calice da vino pieno di ghiaccio e guarnire con foglie d’ananas.'],
    ),
    originalSteps:['Shake all ingredients with ice.','Strain into an ice-filled wine glass and garnish with pineapple leaves.'],
    glass:L('Wine glass filled with ice','装冰葡萄酒杯','Verre à vin rempli de glace','Weinglas mit Eis','Copa de vino con hielo','얼음 채운 와인 잔','氷入りワイングラス','Calice da vino con ghiaccio'),garnish:L('Pineapple leaves','菠萝叶','Feuilles d’ananas','Ananasblätter','Hojas de piña','파인애플 잎','パイナップルの葉','Foglie d’ananas'),
    flavours:['fruit','herbal','spice'],tastes:['sweet','refreshing'],approachability:'balanced',accent:'#C9B85D',mixingMethod:'shake',mixingStepIndex:0,
    description:L('This is Difford’s current published Venceremos, linked separately to Gn Chan’s 2016 global-winning identity rather than presented as the exact competition original.','这是 Difford’s 当前发布的 Venceremos；其与 Gn Chan 的 2016 全球冠军身份另行关联，并不冒充赛事原始配方。','Il s’agit de la version actuellement publiée par Difford’s, reliée séparément à l’identité gagnante mondiale 2016 de Gn Chan sans être présentée comme la recette exacte du concours.','Dies ist die aktuell veröffentlichte Difford’s-Version, separat mit Gn Chans globalem Siegerdrink 2016 verknüpft und nicht als exaktes Wettbewerbsoriginal ausgegeben.','Esta es la versión actual de Difford’s, vinculada por separado a la identidad ganadora global de Gn Chan en 2016 sin presentarse como la receta exacta del concurso.','Difford’s의 현재 공개 Venceremos로, Gn Chan의 2016년 글로벌 우승 정체성과 별도로 연결되며 대회 원본으로 제시하지 않습니다.','Difford’s現行掲載版のVenceremos。Gn Chanの2016年世界優勝作という同一性とは別に紐づけ、競技時の正確な原作とは表示しません。','È la versione attualmente pubblicata da Difford’s, collegata separatamente all’identità vincitrice globale 2016 di Gn Chan senza presentarla come ricetta originale esatta della gara.'),
  },
  {
    id:'clarita',year:2017,countryCodes:['BE'],event:'Bacardí Legacy Global Cocktail Competition 2017',venue:'The Pharmacy, Knokke-Heist',label:currentDiffordLabel,sourceId:'batch-j-clarita-recipe',
    ingredients:[
      {ingredientId:'aged-rum',amount:2,unit:'oz',brandId:'brand-havana-club',note:note('The current page shows Havana Club Añejo 7 Años, within Difford’s aged Caribbean rum category of six to ten years.','当前页面显示 Havana Club Añejo 7 Años，属于 Difford’s 的 6–10 年陈年加勒比朗姆类别。','La page actuelle affiche Havana Club Añejo 7 Años, dans la catégorie Difford’s des rhums caribéens âgés de six à dix ans.','Die aktuelle Seite zeigt Havana Club Añejo 7 Años in Difford’s Kategorie sechs bis zehn Jahre gereifter karibischer Rums.','La página actual muestra Havana Club Añejo 7 Años, dentro de la categoría de Difford’s de ron caribeño de seis a diez años.','현재 페이지는 Difford’s의 6~10년 숙성 카리브해 럼 범주에 속하는 Havana Club Añejo 7 Años를 표시합니다.','現行ページは、Difford’sの6〜10年熟成カリブ海ラム区分にあるHavana Club Añejo 7 Añosを表示。','La pagina attuale mostra Havana Club Añejo 7 Años, nella categoria Difford’s dei rum caraibici invecchiati da sei a dieci anni.')},
      {ingredientId:'amontillado-sherry',amount:1/3,unit:'oz',note:note('The current page shows Lustau Amontillado Los Arcos.','当前页面显示 Lustau Amontillado Los Arcos。','La page actuelle affiche Lustau Amontillado Los Arcos.','Die aktuelle Seite zeigt Lustau Amontillado Los Arcos.','La página actual muestra Lustau Amontillado Los Arcos.','현재 페이지에는 Lustau Amontillado Los Arcos가 표시됩니다.','現行ページはLustau Amontillado Los Arcosを表示。','La pagina attuale mostra Lustau Amontillado Los Arcos.')},
      {ingredientId:'creme-de-cacao',amount:1/6,unit:'oz',note:note('White crème de cacao; the current page shows Giffard.','白可可利口酒；当前页面显示 Giffard。','Crème de cacao blanche ; la page actuelle affiche Giffard.','Weiße Crème de Cacao; die aktuelle Seite zeigt Giffard.','Crema de cacao blanca; la página actual muestra Giffard.','화이트 크렘 드 카카오이며 현재 페이지에는 Giffard가 표시됩니다.','ホワイト・クレーム・ド・カカオ。現行ページはGiffardを表示。','Crème de cacao bianca; la pagina attuale mostra Giffard.')},
      {ingredientId:'absinthe',amount:2,unit:'dash',note:note('The current page shows La Fée Parisienne absinthe.','当前页面显示 La Fée Parisienne 苦艾酒。','La page actuelle affiche l’absinthe La Fée Parisienne.','Die aktuelle Seite zeigt La Fée Parisienne Absinth.','La página actual muestra absenta La Fée Parisienne.','현재 페이지에는 La Fée Parisienne 압생트가 표시됩니다.','現行ページはLa Fée Parisienneアブサンを表示。','La pagina attuale mostra assenzio La Fée Parisienne.')},
      {ingredientId:'saline-solution',amount:1,unit:'dash',note:note('A 20% saline solution made from 20 g sea salt and 80 g water; the page also allows the merest pinch of salt. This row records the solution option only.','20% 盐水溶液，由 20 克海盐与 80 克水制成；页面也允许极少一撮盐。本行仅记录盐水选项。','Solution saline à 20 %, avec 20 g de sel marin et 80 g d’eau ; la page permet aussi une infime pincée de sel. Cette ligne ne retient que la solution.','20%ige Salzlösung aus 20 g Meersalz und 80 g Wasser; die Seite erlaubt auch eine winzige Prise Salz. Diese Zeile erfasst nur die Lösung.','Solución salina al 20 %, con 20 g de sal marina y 80 g de agua; la página también permite una pizca mínima. Esta fila registra solo la solución.','바다 소금 20g과 물 80g으로 만든 20% 식염수이며 페이지는 극소량의 소금도 허용합니다. 이 행은 식염수 선택지만 기록합니다.','海塩20gと水80gの20%食塩水。ページはごく少量の塩も可としますが、この行は食塩水のみを記録。','Soluzione salina al 20% con 20 g di sale marino e 80 g d’acqua; la pagina ammette anche un minimo pizzico di sale. Questa riga registra solo la soluzione.')},
    ],
    steps:S(
      ['Stir all drink ingredients with ice and strain into a chilled coupe.','Finish with three drops of olive oil as the garnish.'],
      ['所有饮品材料加冰搅拌，滤入冰镇碟形杯。','以三滴橄榄油完成装饰。'],
      ['Remuer tous les ingrédients avec glace et filtrer dans une coupe froide.','Terminer avec trois gouttes d’huile d’olive en garniture.'],
      ['Alle Drinkzutaten mit Eis rühren und in eine gekühlte Coupette abseihen.','Mit drei Tropfen Olivenöl garnieren.'],
      ['Remueve todos los ingredientes con hielo y cuela en una coupe fría.','Termina con tres gotas de aceite de oliva como adorno.'],
      ['모든 음료 재료를 얼음과 저어 차가운 쿠페에 거릅니다.','올리브 오일 세 방울을 가니시로 마무리합니다.'],
      ['全材料を氷とステアし、冷やしたクープへこす。','オリーブオイル3滴をガーニッシュとして落とす。'],
      ['Mescolare tutti gli ingredienti con ghiaccio e filtrare in una coppa fredda.','Completare con tre gocce di olio d’oliva come guarnizione.'],
    ),
    originalSteps:['Stir all drink ingredients with ice and strain into a chilled coupe.','Garnish with three drops of olive oil.'],
    glass:coupe,garnish:L('Three drops olive oil','三滴橄榄油','Trois gouttes d’huile d’olive','Drei Tropfen Olivenöl','Tres gotas de aceite de oliva','올리브 오일 3방울','オリーブオイル3滴','Tre gocce di olio d’oliva'),
    flavours:['herbal','spice'],tastes:['dry','bitter'],approachability:'bold',accent:'#B58A57',mixingMethod:'stir',mixingStepIndex:0,
    description:L('This current Difford’s version of Ran Van Ongevalle’s 2017 winner keeps its rum, dry sherry, white cacao, absinthe, saline, and olive-oil structure separate from other published seawater variants.','这是 Ran Van Ongevalle 2017 冠军作品的 Difford’s 当前版本；朗姆、干型雪莉、白可可、苦艾、盐水与橄榄油结构不与其他海水版本混用。','Cette version Difford’s actuelle du vainqueur 2017 de Ran Van Ongevalle conserve sa structure rhum, xérès sec, cacao blanc, absinthe, saline et huile d’olive, sans la mélanger aux variantes publiées à l’eau de mer.','Diese aktuelle Difford’s-Version von Ran Van Ongevalles Siegerdrink 2017 hält Rum, trockenen Sherry, weißen Kakao, Absinth, Salzlösung und Olivenöl von anderen veröffentlichten Meerwasser-Varianten getrennt.','Esta versión actual de Difford’s del ganador de 2017 de Ran Van Ongevalle conserva su estructura de ron, jerez seco, cacao blanco, absenta, salina y aceite de oliva separada de otras variantes publicadas con agua de mar.','Ran Van Ongevalle의 2017년 우승작에 대한 현재 Difford’s 버전으로, 럼·드라이 셰리·화이트 카카오·압생트·식염수·올리브 오일 구성을 다른 해수 버전과 섞지 않습니다.','Ran Van Ongevalleの2017年優勝作のDifford’s現行版。ラム、辛口シェリー、ホワイトカカオ、アブサン、食塩水、オリーブオイルの構成を、他媒体の海水版と混同しません。','Questa versione Difford’s attuale del vincitore 2017 di Ran Van Ongevalle mantiene separata la struttura di rum, sherry secco, cacao bianco, assenzio, salina e olio d’oliva dalle varianti pubblicate con acqua di mare.'),
  },
  {
    id:'carino',year:2018,countryCodes:['NL'],event:'Bacardí Legacy Global Cocktail Competition 2018',venue:'Bar TwentySeven, Amsterdam',label:currentDiffordLabel,sourceId:'batch-j-carino-recipe',
    ingredients:[
      {ingredientId:'cuban-rum',amount:50,unit:'ml',brandId:'brand-havana-club',note:note('The current Difford’s version uses Havana Club Añejo 7 Años. The original winning recipe documented by Bacardi Japan instead used BACARDÍ 8; this row does not merge those versions.','当前 Difford’s 版本使用 Havana Club Añejo 7 Años。Bacardi Japan 记录的夺冠原配方则使用 BACARDÍ 8；本行不混合两版。','La version Difford’s actuelle utilise Havana Club Añejo 7 Años. La recette gagnante originale documentée par Bacardi Japan utilisait BACARDÍ 8 ; cette ligne ne fusionne pas les deux versions.','Die aktuelle Difford’s-Version nutzt Havana Club Añejo 7 Años. Das von Bacardi Japan dokumentierte Siegeroriginal nutzte BACARDÍ 8; diese Zeile vermischt beide Versionen nicht.','La versión actual de Difford’s usa Havana Club Añejo 7 Años. La receta ganadora original documentada por Bacardi Japan usaba BACARDÍ 8; esta fila no mezcla ambas versiones.','현재 Difford’s 버전은 Havana Club Añejo 7 Años를 사용합니다. Bacardi Japan이 기록한 우승 원본은 BACARDÍ 8을 사용했으며 이 행은 두 버전을 섞지 않습니다.','Difford’s現行版はHavana Club Añejo 7 Añosを使用。Bacardi Japanが記録した優勝時原作はBACARDÍ 8であり、この行では両版を混在させません。','La versione Difford’s attuale usa Havana Club Añejo 7 Años. La ricetta vincitrice originale documentata da Bacardi Japan usava BACARDÍ 8; questa riga non fonde le due versioni.')},
      {ingredientId:'yellow-chartreuse',amount:5,unit:'ml',brandId:'brand-chartreuse',note:note('The current page allows Yellow Chartreuse or génépy; this recorded version uses Yellow Chartreuse.','当前页面允许黄色查特酒或 génépy；本记录版本采用黄色查特酒。','La page actuelle permet Chartreuse jaune ou génépy ; cette version retient la Chartreuse jaune.','Die aktuelle Seite erlaubt gelbe Chartreuse oder Génépy; diese erfasste Version nutzt gelbe Chartreuse.','La página actual permite Chartreuse amarilla o génépy; esta versión registra Chartreuse amarilla.','현재 페이지는 옐로 샤르트뢰즈 또는 제네피를 허용하며 이 기록 버전은 옐로 샤르트뢰즈를 사용합니다.','現行ページはイエロー・シャルトリューズまたはジェネピを許容。本記録版はイエローを採用。','La pagina attuale consente Chartreuse gialla o génépy; questa versione registra Chartreuse gialla.')},
      {ingredientId:'food-plain-yogurt',amount:30,unit:'ml',note:note('Natural yogurt. The current catalogue taxonomy does not assert a complete composition for this ingredient.','原味酸奶；当前材料分类不对其完整组成作保证。','Yaourt nature ; la taxonomie actuelle du catalogue n’en affirme pas la composition complète.','Naturjoghurt; die aktuelle Katalogtaxonomie bestätigt keine vollständige Zusammensetzung.','Yogur natural; la taxonomía actual del catálogo no afirma una composición completa.','플레인 요거트이며 현재 카탈로그 분류는 전체 성분을 확정하지 않습니다.','プレーンヨーグルト。現行カタログ分類は完全な組成を保証しません。','Yogurt naturale; la tassonomia attuale del catalogo non ne attesta la composizione completa.')},
      {ingredientId:'vanilla-syrup',amount:20,unit:'ml',note:note('Eric van Beek’s disclosed syrup uses 1 kg caster sugar, 500 g water, and two split vanilla pods, vacuum sealed and held at 65 °C until the sugar dissolves. Yield and storage are not disclosed.','Eric van Beek 公开的糖浆使用 1 千克细砂糖、500 克水及两根剖开的香草荚，真空封袋后以 65°C 加热至糖溶解；产量与保存方式未公开。','Le sirop publié par Eric van Beek contient 1 kg de sucre semoule, 500 g d’eau et deux gousses de vanille fendues, mis sous vide à 65 °C jusqu’à dissolution ; rendement et conservation non publiés.','Eric van Beeks offengelegter Sirup nutzt 1 kg feinen Zucker, 500 g Wasser und zwei aufgeschnittene Vanilleschoten, vakuumiert bei 65 °C bis zur Auflösung; Ausbeute und Lagerung sind nicht veröffentlicht.','El jarabe divulgado por Eric van Beek usa 1 kg de azúcar fino, 500 g de agua y dos vainas de vainilla abiertas, selladas al vacío a 65 °C hasta disolver; no se publican rendimiento ni conservación.','에릭 판 베이크가 공개한 시럽은 캐스터 슈거 1kg, 물 500g, 갈라 연 바닐라 빈 2개를 진공 포장해 설탕이 녹을 때까지 65°C로 가열합니다. 수율과 보관법은 공개되지 않았습니다.','Eric van Beek公開のシロップは、上白糖1kg、水500g、割いたバニラ2本を真空包装し、砂糖が溶けるまで65℃で加熱。出来上がり量と保存方法は未記載。','Lo sciroppo divulgato da Eric van Beek usa 1 kg di zucchero semolato, 500 g d’acqua e due baccelli di vaniglia aperti, sigillati sottovuoto a 65 °C fino a dissoluzione; resa e conservazione non sono pubblicate.')},
      {ingredientId:'lemon-juice',amount:10,unit:'ml'},
    ],
    steps:S(
      ['Shake all five ingredients with ice.','Fine-strain into a chilled coupe over one large ice cube and grate fresh nutmeg over the drink.'],
      ['五种材料全部加冰摇匀。','细滤入放有一块大冰的冰镇碟形杯，并现磨肉豆蔻于酒面。'],
      ['Shaker les cinq ingrédients avec glace.','Filtrer finement dans une coupe froide sur un gros glaçon et râper de la muscade fraîche.'],
      ['Alle fünf Zutaten mit Eis shaken.','Fein in eine gekühlte Coupette über einen großen Eiswürfel abseihen und frische Muskatnuss darüberreiben.'],
      ['Agita los cinco ingredientes con hielo.','Cuela fino en una coupe fría sobre un cubo grande y ralla nuez moscada fresca encima.'],
      ['다섯 재료를 모두 얼음과 셰이크합니다.','큰 얼음 하나를 넣은 차가운 쿠페에 파인 스트레인하고 생 넛메그를 갈아 올립니다.'],
      ['5材料をすべて氷とシェイクする。','大きな氷1個を入れた冷たいクープへファインストレインし、ナツメグを削る。'],
      ['Shakerare tutti e cinque gli ingredienti con ghiaccio.','Filtrare fine in una coppa fredda su un cubo grande e grattugiare noce moscata fresca.'],
    ),
    originalSteps:['Shake all ingredients with ice.','Fine-strain into a chilled coupe over a large ice cube and finish with freshly grated nutmeg.'],
    glass:L('Chilled coupe with one large ice cube','放一块大冰的冰镇碟形杯','Coupe refroidie avec un gros glaçon','Gekühlte Coupette mit einem großen Eiswürfel','Coupe fría con un cubo grande','큰 얼음 하나를 넣은 차가운 쿠페','大きな氷1個入りの冷やしたクープ','Coppa fredda con un cubo grande'),garnish:L('Freshly grated nutmeg','现磨肉豆蔻','Muscade fraîchement râpée','Frisch geriebene Muskatnuss','Nuez moscada recién rallada','갓 간 넛메그','削りたてのナツメグ','Noce moscata appena grattugiata'),
    flavours:['herbal','spice'],tastes:['sour','sweet','creamy'],approachability:'balanced',accent:'#D6C7A1',mixingMethod:'shake',mixingStepIndex:0,
    description:L('This current Difford’s version of Eric van Beek’s 2018 winner uses Havana Club 7 and publishes the vanilla-syrup method; the original Bacardi 8 identity remains separate.','这是 Eric van Beek 2018 冠军作品的 Difford’s 当前版本，使用 Havana Club 7，并公开香草糖浆做法；Bacardi 8 原始夺冠版本的身份资料独立保留。','Cette version Difford’s actuelle du vainqueur 2018 d’Eric van Beek utilise Havana Club 7 et publie la méthode du sirop de vanille ; l’identité originale au Bacardi 8 reste séparée.','Diese aktuelle Difford’s-Version von Eric van Beeks Siegerdrink 2018 nutzt Havana Club 7 und veröffentlicht die Vanillesirup-Methode; die ursprüngliche Bacardi-8-Identität bleibt getrennt.','Esta versión actual de Difford’s del ganador de 2018 de Eric van Beek usa Havana Club 7 y publica el método del sirope de vainilla; la identidad original con Bacardi 8 se conserva por separado.','에릭 판 베이크의 2018년 우승작에 대한 현재 Difford’s 버전은 Havana Club 7을 사용하고 바닐라 시럽 제조법을 공개합니다. Bacardi 8 원본 우승 정체성은 별도로 보존합니다.','Eric van Beekの2018年優勝作のDifford’s現行版。Havana Club 7を使用し、バニラシロップ製法を公開。Bacardi 8の優勝時原作とは別に保持します。','Questa versione Difford’s attuale del vincitore 2018 di Eric van Beek usa Havana Club 7 e pubblica il metodo dello sciroppo alla vaniglia; l’identità originale con Bacardi 8 resta separata.'),
  },
  {
    id:'pink-me-up',year:2019,countryCodes:['TH'],event:'Bacardí Legacy Global Cocktail Competition 2019',venue:'Backstage Cocktail Bar, Bangkok',
    label:sourceLabel('Creator interview winning recipe','创作者访谈中的夺冠配方','Recette gagnante publiée dans l’entretien du créateur','Siegerrezept aus dem Interview mit dem Schöpfer','Receta ganadora publicada en la entrevista al creador','창작자 인터뷰 공개 우승 레시피','作者インタビュー掲載の優勝レシピ','Ricetta vincitrice pubblicata nell’intervista al creatore'),sourceId:'batch-j-pink-me-up-recipe',
    ingredients:[
      {ingredientId:'white-rum',amount:2,unit:'part',brandId:'brand-bacardi',note:note('The interview specifies BACARDÍ Carta Blanca rum and gives the measure in parts.','访谈指定 BACARDÍ Carta Blanca 朗姆，并以份数计量。','L’entretien précise le rhum BACARDÍ Carta Blanca et mesure en parts.','Das Interview nennt BACARDÍ Carta Blanca Rum und misst in Teilen.','La entrevista especifica ron BACARDÍ Carta Blanca y mide en partes.','인터뷰는 BACARDÍ Carta Blanca 럼을 지정하고 파트 단위로 계량합니다.','インタビューはBACARDÍ Carta Blancaラムを指定し、パート表記で計量。','L’intervista specifica rum BACARDÍ Carta Blanca e misura in parti.')},
      {ingredientId:'food-tomato',amount:null,unit:'piece',note:note('Three to four pieces of fresh tomato; the range is preserved because the source does not give a single quantity.','3–4 块新鲜番茄；来源没有给单一数值，因此保留区间。','Trois à quatre morceaux de tomate fraîche ; la plage est conservée car la source ne donne pas une quantité unique.','Drei bis vier Stücke frische Tomate; die Spanne bleibt erhalten, da die Quelle keine Einzelmenge nennt.','Tres o cuatro trozos de tomate fresca; se conserva el rango porque la fuente no da una cantidad única.','신선한 토마토 3~4조각이며 출처가 단일 수량을 제시하지 않아 범위를 유지합니다.','新鮮なトマト3〜4片。出典に単一量がないため範囲を保持。','Da tre a quattro pezzi di pomodoro fresco; l’intervallo resta perché la fonte non dà una quantità unica.')},
      {ingredientId:'basil-leaves',amount:null,unit:'piece',note:note('Five to seven basil leaves; the range is preserved because the source does not give a single quantity.','5–7 片罗勒叶；来源没有给单一数值，因此保留区间。','Cinq à sept feuilles de basilic ; la plage est conservée car la source ne donne pas une quantité unique.','Fünf bis sieben Basilikumblätter; die Spanne bleibt erhalten, da die Quelle keine Einzelmenge nennt.','Cinco a siete hojas de albahaca; se conserva el rango porque la fuente no da una cantidad única.','바질 잎 5~7장이며 출처가 단일 수량을 제시하지 않아 범위를 유지합니다.','バジル5〜7枚。出典に単一量がないため範囲を保持。','Da cinque a sette foglie di basilico; l’intervallo resta perché la fonte non dà una quantità unica.')},
      {ingredientId:'orgeat',amount:.5,unit:'part',note:note('The interview names orgeat syrup but does not disclose its formula or preparation.','访谈列出杏仁糖浆，但未公开其配方或制作方法。','L’entretien nomme le sirop d’orgeat sans en publier la formule ni la préparation.','Das Interview nennt Orgeat, veröffentlicht aber weder Rezeptur noch Herstellung.','La entrevista nombra el sirope de orgeat, pero no publica su fórmula ni preparación.','인터뷰는 오르자 시럽을 명시하지만 배합이나 제조법은 공개하지 않습니다.','インタビューはオルジェを記載するが、配合と製法は未公開。','L’intervista indica l’orzata ma non ne pubblica formula o preparazione.')},
      {ingredientId:'lemon-juice',amount:1,unit:'part'},
      {ingredientId:'green-olive-brine',amount:1,unit:'barspoon',note:note('The creator interview says one bar spoon. Bacardi Japan’s identity page says one teaspoon; this recipe preserves the interview version and does not combine the two.','创作者访谈写一吧匙；Bacardi Japan 身份页写一茶匙。本配方保留访谈版本，不混合两种计量。','L’entretien du créateur indique une cuillère de bar ; la page d’identité de Bacardi Japan indique une cuillère à café. Cette recette conserve la version de l’entretien.','Das Interview nennt einen Barlöffel; die Identitätsseite von Bacardi Japan einen Teelöffel. Dieses Rezept bewahrt die Interviewversion.','La entrevista al creador dice una cucharilla de bar; la página de identidad de Bacardi Japan dice una cucharadita. Esta receta conserva la versión de la entrevista.','창작자 인터뷰는 바스푼 1개, Bacardi Japan 신원 페이지는 티스푼 1개라고 합니다. 이 레시피는 인터뷰 버전을 유지합니다.','作者インタビューは1バースプーン、Bacardi Japanの同一性ページは1ティースプーン。本レシピはインタビュー版を保持。','L’intervista al creatore indica un bar spoon; la pagina d’identità Bacardi Japan un cucchiaino. Questa ricetta conserva la versione dell’intervista.')},
    ],
    steps:S(
      ['Muddle the fresh tomato pieces with the basil leaves.','Add the rum, orgeat, lemon juice, and olive brine; shake with ice.','Strain into a chilled coupette and garnish with a green olive and basil leaf.'],
      ['捣压新鲜番茄块与罗勒叶。','加入朗姆、杏仁糖浆、柠檬汁与橄榄盐水，加冰摇匀。','滤入冰镇小碟形杯，以绿橄榄与罗勒叶装饰。'],
      ['Piler les morceaux de tomate fraîche avec les feuilles de basilic.','Ajouter rhum, orgeat, citron et saumure d’olive, puis shaker avec glace.','Filtrer dans une coupette froide et garnir d’une olive verte et d’une feuille de basilic.'],
      ['Frische Tomatenstücke mit Basilikumblättern muddeln.','Rum, Orgeat, Zitronensaft und Olivenlake zugeben und mit Eis shaken.','In eine gekühlte Coupette abseihen und mit grüner Olive und Basilikumblatt garnieren.'],
      ['Machaca el tomate fresco con las hojas de albahaca.','Añade ron, orgeat, limón y salmuera de aceituna; agita con hielo.','Cuela en una coupette fría y decora con una aceituna verde y una hoja de albahaca.'],
      ['신선한 토마토 조각과 바질 잎을 머들합니다.','럼, 오르자, 레몬 주스, 올리브 브라인을 넣고 얼음과 셰이크합니다.','차가운 쿠페트에 거르고 그린 올리브와 바질 잎으로 장식합니다.'],
      ['新鮮なトマト片とバジルを潰す。','ラム、オルジェ、レモン、オリーブブラインを加え、氷とシェイクする。','冷やしたクーペットへこし、グリーンオリーブとバジルを飾る。'],
      ['Pestare i pezzi di pomodoro fresco con le foglie di basilico.','Aggiungere rum, orzata, limone e salamoia d’oliva; shakerare con ghiaccio.','Filtrare in una coppetta fredda e guarnire con oliva verde e foglia di basilico.'],
    ),
    originalSteps:['Muddle fresh tomato pieces and basil leaves.','Add the remaining ingredients and shake with ice.','Strain into a chilled coupette and garnish with a green olive and basil leaf.'],
    glass:L('Chilled coupette','冰镇小碟形杯','Coupette refroidie','Gekühlte Coupette','Coupette fría','차갑게 식힌 쿠페트','冷やしたクーペット','Coppetta raffreddata'),garnish:L('Green olive and basil leaf','绿橄榄与罗勒叶','Olive verte et feuille de basilic','Grüne Olive und Basilikumblatt','Aceituna verde y hoja de albahaca','그린 올리브와 바질 잎','グリーンオリーブとバジル','Oliva verde e foglia di basilico'),
    flavours:['fruit','herbal'],tastes:['sour','sweet'],approachability:'balanced',accent:'#D66F76',mixingMethod:'shake',mixingStepIndex:1,
    description:L('Ronnaporn Kanivichaporn’s 2019 global winner combines white rum, fresh tomato, basil, orgeat, lemon, and olive brine in the creator-interview version.','Ronnaporn Kanivichaporn 的 2019 年全球冠军作品，在创作者访谈版本中结合白朗姆、鲜番茄、罗勒、杏仁糖浆、柠檬与橄榄盐水。','Le vainqueur mondial 2019 de Ronnaporn Kanivichaporn associe rhum blanc, tomate fraîche, basilic, orgeat, citron et saumure d’olive dans la version de l’entretien.','Ronnaporn Kanivichaporns globaler Siegerdrink 2019 kombiniert in der Interviewversion weißen Rum, frische Tomate, Basilikum, Orgeat, Zitrone und Olivenlake.','El ganador global de 2019 de Ronnaporn Kanivichaporn combina ron blanco, tomate fresco, albahaca, orgeat, limón y salmuera de aceituna en la versión de la entrevista.','론나폰 카니위차폰의 2019년 글로벌 우승작은 창작자 인터뷰 버전에서 화이트 럼, 생토마토, 바질, 오르자, 레몬, 올리브 브라인을 결합합니다.','ロンナポーン・カニヴィチャポーンの2019年世界優勝作。作者インタビュー版ではホワイトラム、フレッシュトマト、バジル、オルジェ、レモン、オリーブブラインを合わせます。','Il vincitore globale 2019 di Ronnaporn Kanivichaporn combina rum bianco, pomodoro fresco, basilico, orzata, limone e salamoia d’oliva nella versione dell’intervista.'),
  },
];

const sources: Source[] = [
  {id:'batch-j-maid-in-cuba',title:'Maid in Cuba Cocktail Recipe — BACARDÍ',url:'https://www.bacardi.com/us/en/rum-cocktails/maid-in-cuba/',author:'BACARDÍ',checkedAt},
  {id:'batch-j-le-latin',title:'Le Latin Cocktail Recipe — BACARDÍ',url:'https://www.bacardi.com/us/en/rum-cocktails/le-latin/',author:'BACARDÍ',checkedAt},
  {id:'batch-j-venceremos-recipe',title:'Venceremos — Difford’s Guide current published recipe',url:'https://www.diffordsguide.com/cocktails/recipe/3890/venceremos',author:'Difford’s Guide',checkedAt},
  {id:'batch-j-venceremos-identity',title:'Bacardi Legacy 2016 Global Final (all recipes) — Difford’s Guide',url:'https://www.diffordsguide.com/encyclopedia/1107/cocktails/bacardi-legacy-2016-global-final-all-recipes',author:'Simon Difford',checkedAt},
  {id:'batch-j-clarita-recipe',title:'Clarita — Difford’s Guide current published recipe',url:'https://www.diffordsguide.com/cocktails/recipe/4158/clarita',author:'Difford’s Guide',checkedAt},
  {id:'batch-j-carino-recipe',title:'Cariño — Difford’s Guide current published recipe',url:'https://www.diffordsguide.com/cocktails/recipe/4420/carino',author:'Difford’s Guide',checkedAt},
  {id:'batch-j-carino-identity',title:'Bacardí Legacy Cocktail Competition 2018 winner — Bacardi Japan',url:'https://www.bacardijapan.jp/event-news/2018/20180508-1886/',author:'Bacardi Japan',checkedAt},
  {id:'batch-j-pink-me-up-recipe',title:'The class of Bacardí Legacy 2019 — The Cocktail Lovers',url:'https://thecocktaillovers.com/the-class-of-bacardi-legacy-2019/',author:'The Cocktail Lovers',checkedAt},
  {id:'batch-j-pink-me-up-identity',title:'Bacardí Legacy Cocktail Competition 2019 world final result — Bacardi Japan',url:'https://www.bacardijapan.jp/event-news/2019/20190516-4790/',author:'Bacardi Japan',checkedAt},
];

const versions: RecipeVersion[] = recipes.map((recipe) => ({
  id:`${recipe.id}-batch-j`,cocktailId:recipe.id,label:recipe.label,sourceId:recipe.sourceId,servings:1,
  origin:{kind:'competition',topicId:`bacardi-legacy-global-${recipe.year}`,countryCodes:recipe.countryCodes,event:recipe.event,year:recipe.year,venue:recipe.venue},
  ingredients:recipe.ingredients,steps:recipe.steps,originalLanguage:'en',originalSteps:recipe.originalSteps,
  mixingMethods:[{method:recipe.mixingMethod,sourceId:recipe.sourceId,stepIndexes:[recipe.mixingStepIndex],reviewedAt:checkedAt}],
  glass:recipe.glass,garnish:recipe.garnish,flavours:recipe.flavours,tastes:recipe.tastes,strength:null,
  approachability:recipe.approachability,profileBasis:'editorial',profileNote:editorialProfileNote,
  sourceChecked:true,translationStatus:'draft',
}));

const cocktails: Cocktail[] = recipes.map((recipe) => ({
  id:recipe.id,name:{...cocktailNames[recipe.id]!,ja:cocktailNames[recipe.id]!.en},aliases:[cocktailNames[recipe.id]!.ja,...(recipe.id==='carino'?['Carino']:[])],category:'curated',
  description:recipe.description,versionIds:[`${recipe.id}-batch-j`],defaultVersionId:`${recipe.id}-batch-j`,accent:recipe.accent,
}));

export const batchJ: CatalogueBatch = {cocktails,versions,sources,ingredients,brands};
export default batchJ;
