import type {Localized} from '../domain/contracts';
import type {PreparationCard, RecipePreparation} from '../domain/preparations/types';
import {competitionExtensionPreparations} from './preparations-extension-competitions';
import {barExtensionPreparations} from './preparations-extension-bars';
import {patronExtensionPreparations} from './preparations-extension-patron';
import {batchMPreparations} from './expansion/batch-m';

const L = (en:string, zh:string, fr:string, de:string, es:string, ko:string, ja:string, it:string): Localized => ({en,zh,fr,de,es,ko,ja,it});
const same = (value:string): Localized => L(value,value,value,value,value,value,value,value);

const checkedAt = '2026-09-08';
const suntory2025 = {title:'Suntory The Bartender Award 2025 — winning works',url:'https://www.suntory.co.jp/wnb/event/award/result_2025.html'};
const brownButterSource = {title:'Brown Butter Old Fashioned — Liquor.com',url:'https://www.liquor.com/recipes/brown-butter-old-fashioned/'};
const pearlDiverSource = {title:'Pearl Diver — Liquor.com',url:'https://www.liquor.com/recipes/pearl-diver/'};
const gardeniaSource = {title:'Don’s Gardenia Mix — Liquor.com',url:'https://www.liquor.com/recipes/dons-gardenia-mix/'};
const zombieSource = {title:'Zombie — International Bartenders Association',url:'https://iba-world.com/iba-cocktail/zombie/'};
const penicillinIbaSource = {title:'Penicillin — International Bartenders Association',url:'https://iba-world.com/iba-cocktail/penicillin/'};
const penicillinPunchSource = {title:'Penicillin — PUNCH / A Proper Drink adaptation',url:'https://punchdrink.com/recipes/penicillin/'};
const missionarySource = {title:'Missionary’s Downfall — International Bartenders Association',url:'https://iba-world.com/iba-cocktail/missionarys-downfall/'};
const ventoSource = {title:'Ve.N.To — International Bartenders Association',url:'https://iba-world.com/iba-cocktail/ve-n-to/'};
const blueHawaiiSource = {title:'Blue Hawaii — Liquor.com',url:'https://www.liquor.com/recipes/blue-hawaii/'};

const disclosedSummary = L(
  'The source publishes enough detail to reproduce the listed preparation.',
  '来源公开了足以复现这项预制的资料。',
  'La source donne assez de détails pour reproduire cette préparation.',
  'Die Quelle enthält genügend Angaben, um diese Vorbereitung nachzuvollziehen.',
  'La fuente publica suficiente detalle para reproducir esta preparación.',
  '출처가 이 사전 준비를 재현할 수 있을 만큼 자세히 공개합니다.',
  '出典には、この仕込みを再現できるだけの詳細があります。',
  'La fonte pubblica dettagli sufficienti per riprodurre la preparazione.',
);
const partialSummary = L(
  'The source names the preparation, but does not publish every input or step.',
  '来源提到了这项预制，但没有公开全部材料或步骤。',
  'La source nomme la préparation sans publier tous les ingrédients ou toutes les étapes.',
  'Die Quelle nennt die Vorbereitung, veröffentlicht aber nicht alle Zutaten oder Schritte.',
  'La fuente nombra la preparación, pero no publica todos los ingredientes o pasos.',
  '출처가 사전 준비의 이름은 밝히지만 모든 재료나 단계를 공개하지 않습니다.',
  '出典に仕込み名はありますが、材料や工程のすべては公開されていません。',
  'La fonte nomina la preparazione ma non pubblica tutti gli ingredienti o i passaggi.',
);
const undisclosedGap = L(
  'Formula, quantities, preparation method, yield, and storage are not disclosed on the cited page.',
  '引用页面未公开配方组成、用量、制作方法、产量及保存方式。',
  'La formule, les quantités, la méthode, le rendement et la conservation ne sont pas publiés.',
  'Rezeptur, Mengen, Methode, Ausbeute und Lagerung werden auf der zitierten Seite nicht genannt.',
  'La página citada no publica fórmula, cantidades, método, rendimiento ni conservación.',
  '인용 페이지에는 배합, 분량, 제조법, 완성량, 보관법이 공개되어 있지 않습니다.',
  '引用ページには配合、分量、作り方、出来上がり量、保存方法の記載がありません。',
  'La pagina citata non indica formula, quantità, metodo, resa o conservazione.',
);

function undisclosedCard(id:string, ingredientId:string, title:Localized): PreparationCard {
  return {id,ingredientId,title,role:'prepared-ingredient',status:'undisclosed',inputs:[],steps:[],gaps:[undisclosedGap],sources:[suntory2025]};
}

function partial2025(versionId:string, cards:PreparationCard[]): RecipePreparation {
  return {versionId,status:'partial',summary:partialSummary,gaps:[L(
    'The official competition page publishes the drink recipe and service method, but not the full preparation behind the item or items below.',
    '官方赛事页面公开了成杯配方与出品方法，但未公开下列材料的完整预制方法。',
    'La page officielle publie la recette du verre, mais pas la préparation complète des éléments ci-dessous.',
    'Die offizielle Wettbewerbsseite veröffentlicht das Getränkerezept, jedoch nicht die vollständige Vorbereitung der folgenden Bestandteile.',
    'La página oficial publica la receta de la copa, pero no la preparación completa de los elementos siguientes.',
    '공식 대회 페이지에는 완성 음료 레시피가 있지만 아래 항목의 전체 사전 준비법은 없습니다.',
    '公式大会ページにはカクテルのレシピがありますが、以下の材料の仕込み全体は記載されていません。',
    'La pagina ufficiale pubblica la ricetta del drink, ma non la preparazione completa degli elementi seguenti.',
  )],cards,checkedAt};
}

const houmei: RecipePreparation = {
  versionId:'houmei-batch-h',status:'disclosed',summary:disclosedSummary,gaps:[],checkedAt,
  cards:[{
    id:'houmei-world-tea-soda',ingredientId:'world-tea-soda',
    title:L('House world-blended tea soda','自制世界拼配茶苏打','Soda maison au mélange de thés','Hausgemachtes Tee-Soda','Soda casera de mezcla de tés','하우스 월드 블렌디드 티 소다','自家製ワールドブレンデッドティーソーダ','Soda della casa al tè miscelato'),
    role:'prepared-ingredient',status:'disclosed',
    inputs:[
      L('6 g Assam tea','阿萨姆茶 6 克','6 g de thé Assam','6 g Assam-Tee','6 g de té Assam','아삼 홍차 6g','アッサム 6g','6 g di tè Assam'),
      L('3 g Darjeeling Second Flush tea','大吉岭二采茶 3 克','3 g de Darjeeling Second Flush','3 g Darjeeling Second Flush','3 g de Darjeeling Second Flush','다즐링 세컨드 플러시 3g','ダージリン セカンドフラッシュ 3g','3 g di Darjeeling Second Flush'),
      L('1.5 g Lapsang Souchong tea','正山小种 1.5 克','1,5 g de Lapsang Souchong','1,5 g Lapsang Souchong','1,5 g de Lapsang Souchong','랍상 수숑 1.5g','ラプサンスーチョン 1.5g','1,5 g di Lapsang Souchong'),
      L('4 g Irish Breakfast tea','爱尔兰早餐茶 4 克','4 g de thé Irish Breakfast','4 g Irish-Breakfast-Tee','4 g de té Irish Breakfast','아이리시 브렉퍼스트 티 4g','アイリッシュブレックファースト 4g','4 g di tè Irish Breakfast'),
      L('2 g chamomile','洋甘菊 2 克','2 g de camomille','2 g Kamille','2 g de manzanilla','캐모마일 2g','カモミール 2g','2 g di camomilla'),
      L('3 g sencha','煎茶 3 克','3 g de sencha','3 g Sencha','3 g de sencha','센차 3g','煎茶 3g','3 g di sencha'),
      L('0.5 g dried yuzu peel','干柚子皮 0.5 克','0,5 g de zeste de yuzu séché','0,5 g getrocknete Yuzuschale','0,5 g de piel de yuzu seca','말린 유자 껍질 0.5g','柚子皮（ドライ）0.5g','0,5 g di scorza di yuzu secca'),
      L('500 ml Suntory Tennensui water','三得利天然水 500 毫升','500 ml d’eau Suntory Tennensui','500 ml Suntory-Tennensui-Wasser','500 ml de agua Suntory Tennensui','산토리 천연수 500ml','サントリー天然水 500ml','500 ml di acqua Suntory Tennensui'),
      L('20 g wasanbon sugar','和三盆 20 克','20 g de sucre wasanbon','20 g Wasanbon-Zucker','20 g de azúcar wasanbon','와산본 20g','和三盆 20g','20 g di zucchero wasanbon'),
      L('Carbon dioxide for carbonation','用于充气的二氧化碳','Dioxyde de carbone pour gazéifier','Kohlendioxid zum Karbonisieren','Dióxido de carbono para carbonatar','탄산화를 위한 이산화탄소','炭酸ガス','Anidride carbonica per gassare'),
    ],
    steps:[
      L('Blend all tea leaves with the dried yuzu peel.','将所有茶叶与干柚子皮混合。','Mélanger tous les thés avec le zeste de yuzu séché.','Alle Tees mit der getrockneten Yuzuschale mischen.','Mezclar todos los tés con la piel de yuzu seca.','모든 찻잎과 말린 유자 껍질을 섞습니다.','茶葉と柚子皮をすべてブレンドする。','Miscelare tutti i tè con la scorza di yuzu secca.'),
      L('Bring the water to a boil, immediately pour 500 ml over the blend, and steep for 5 minutes for a slightly strong infusion.','将水煮沸后立即取 500 毫升冲入茶料，浸泡 5 分钟，得到稍浓茶汤。','Porter l’eau à ébullition, verser aussitôt 500 ml sur le mélange et infuser 5 minutes, assez fort.','Wasser aufkochen, sofort 500 ml auf die Mischung gießen und 5 Minuten etwas kräftiger ziehen lassen.','Hervir el agua, verter enseguida 500 ml sobre la mezcla e infusionar 5 minutos, algo concentrado.','물을 끓인 직후 500ml를 찻잎에 붓고 약간 진하게 5분 우립니다.','天然水を沸騰させ、直後の湯500mlを注ぎ、5分間やや濃いめに抽出する。','Portare l’acqua a ebollizione, versarne subito 500 ml sulla miscela e lasciare in infusione 5 minuti, piuttosto intensa.'),
      L('Strain, let the heat subside, then chill.','过滤，散去余热后冷却。','Filtrer, laisser retomber la chaleur puis refroidir.','Abseihen, abkühlen lassen und anschließend kalt stellen.','Colar, dejar bajar la temperatura y enfriar.','거른 뒤 한김 식히고 냉각합니다.','濾して粗熱を取り、冷却する。','Filtrare, lasciare intiepidire e raffreddare.'),
      L('Add the wasanbon and stir until dissolved.','加入和三盆，搅拌至溶解。','Ajouter le wasanbon et remuer jusqu’à dissolution.','Wasanbon zugeben und vollständig auflösen.','Añadir el wasanbon y remover hasta disolver.','와산본을 넣어 녹을 때까지 섞습니다.','和三盆を加え、溶かし混ぜる。','Aggiungere il wasanbon e mescolare fino a scioglierlo.'),
      L('Carbonate the chilled mixture.','为冷却后的茶液充气。','Gazéifier le mélange refroidi.','Die gekühlte Mischung karbonisieren.','Carbonatar la mezcla fría.','차갑게 식힌 혼합물을 탄산화합니다.','冷却した液体にガスを充填する。','Gassare la miscela fredda.'),
    ],
    equipment:L('Kettle, strainer, chilling vessel, and carbonation equipment','水壶、滤具、冷却容器与充气设备','Bouilloire, filtre, récipient de refroidissement et matériel de gazéification','Wasserkocher, Sieb, Kühlgefäß und Karbonisiergerät','Hervidor, colador, recipiente de enfriado y equipo de carbonatación','주전자, 거름망, 냉각 용기, 탄산화 장비','湯沸かし、濾し器、冷却容器、炭酸ガス充填器具','Bollitore, filtro, recipiente di raffreddamento e attrezzatura per gassare'),
    timing:L('5-minute extraction, followed by cooling and carbonation','浸泡 5 分钟，随后冷却并充气','Infusion de 5 minutes, puis refroidissement et gazéification','5 Minuten Ziehzeit, danach Kühlen und Karbonisieren','Infusión de 5 minutos, seguida de enfriado y carbonatación','5분 추출 후 냉각 및 탄산화','5分抽出後、冷却して炭酸ガスを充填','Infusione di 5 minuti, poi raffreddamento e gasatura'),
    gaps:[],sources:[suntory2025],
  }],
};

const japanPartials: RecipePreparation[] = [
  partial2025('uchimizu-batch-h',[undisclosedCard('uchimizu-pine-bamboo-water','pine-bamboo-sparkling-water',L('Pine-and-bamboo sparkling water','松竹气泡水','Eau pétillante pin et bambou','Kiefern-Bambus-Sprudel','Agua con gas de pino y bambú','소나무·대나무 탄산수','松竹スパークリングウォーター','Acqua frizzante al pino e bambù'))]),
  partial2025('shiki-batch-h',[
    undisclosedCard('shiki-gyokuro-cordial','gyokuro-cordial',L('Gyokuro aroma cordial','玉露香气柯迪尔','Cordial aromatique au gyokuro','Gyokuro-Aroma-Cordial','Cordial aromático de gyokuro','교쿠로 아로마 코디얼','玉露アロマコーディアル','Cordial aromatico al gyokuro')),
    undisclosedCard('shiki-red-sansho-oil','red-sansho-oil',L('Red sansho oil','红山椒油','Huile de sansho rouge','Rotes Sanshoöl','Aceite de sansho rojo','붉은 산초 오일','赤山椒オイル','Olio di sansho rosso')),
  ]),
  partial2025('inherited-fizz-batch-h',[undisclosedCard('inherited-fizz-sonic','sonic-water',L('Sonic mix','Sonic 混合液','Mélange sonic','Sonic-Mix','Mezcla sonic','소닉 믹스','ソニック','Miscela sonic'))]),
  partial2025('toku-no-shizuku-batch-h',[undisclosedCard('toku-tencha-bergamot','tencha-bergamot-cordial',L('Fukujuen tencha and bergamot cordial','福寿园碾茶与佛手柑柯迪尔','Cordial Fukujuen au tencha et à la bergamote','Fukujuen-Tencha-Bergamotte-Cordial','Cordial Fukujuen de tencha y bergamota','후쿠주엔 텐차·베르가못 코디얼','福寿園の碾茶とベルガモットのコーディアル','Cordial Fukujuen al tencha e bergamotto'))]),
  partial2025('musubi-batch-h',[
    undisclosedCard('musubi-nori-sesame-syrup','nori-sesame-syrup',L('Nori and sesame syrup','海苔芝麻糖浆','Sirop nori-sésame','Nori-Sesam-Sirup','Sirope de nori y sésamo','김·참깨 시럽','海苔胡麻シロップ','Sciroppo di nori e sesamo')),
    undisclosedCard('musubi-saline','saline-solution',L('Saline solution','盐水','Solution saline','Salzlösung','Solución salina','소금물','塩水','Soluzione salina')),
    undisclosedCard('musubi-hydrosol','lemongrass-hydrosol',L('Lemongrass hydrosol','香茅纯露','Hydrolat de citronnelle','Zitronengras-Hydrolat','Hidrolato de limoncillo','레몬그라스 하이드로졸','レモングラスの芳香蒸留水','Idrolato di lemongrass')),
  ]),
  partial2025('silent-note-batch-h',[undisclosedCard('silent-note-kuromoji-sour','kuromoji-sour-mix',L('Kuromoji sour mix','黑文字酸味混合液','Sour mix au kuromoji','Kuromoji-Sour-Mix','Sour mix de kuromoji','쿠로모지 사워 믹스','黒文字サワーミックス','Sour mix al kuromoji'))]),
  partial2025('tokiwa-batch-h',[
    undisclosedCard('tokiwa-koji-mix','koji-sweet-sour-mix',L('Koji sweet-and-sour mix','麹甜酸混合液','Mélange aigre-doux au koji','Koji-Süß-Sauer-Mix','Mezcla agridulce de koji','코지 스위트 앤 사워 믹스','麹スウィート＆サワーミックス','Miscela agrodolce al koji')),
    undisclosedCard('tokiwa-bancha-foam','kyoto-bancha-foam',L('Kyoto bancha foam','京都番茶泡沫','Mousse de bancha de Kyoto','Kyoto-Bancha-Schaum','Espuma de bancha de Kioto','교토 반차 폼','京番茶フォーム','Schiuma di bancha di Kyoto')),
  ]),
];

const formulaMissing = L(
  'The source does not state the formula, quantities, preparation method, yield, or storage.',
  '来源未说明配方组成、用量、制作方法、产量或保存方式。',
  'La source ne précise ni formule, ni quantités, ni méthode, ni rendement, ni conservation.',
  'Die Quelle nennt weder Rezeptur, Mengen, Methode, Ausbeute noch Lagerung.',
  'La fuente no indica fórmula, cantidades, método, rendimiento ni conservación.',
  '출처에 배합, 분량, 제조법, 완성량, 보관법이 없습니다.',
  '出典に配合、分量、作り方、出来上がり量、保存方法の記載がありません。',
  'La fonte non indica formula, quantità, metodo, resa o conservazione.',
);

const brownButter: RecipePreparation = {
  versionId:'brown-butter-old-fashioned-batch-i',status:'partial',summary:L(
    'The brown-butter wash is fully described. The brown-sugar syrup ratio is known, while its method is not published.',
    '棕黄油浸洗步骤已完整公开；红糖糖浆比例已知，但来源未给制作步骤。',
    'Le lavage au beurre noisette est détaillé ; le ratio du sirop est connu, mais pas sa méthode.',
    'Das Brown-Butter-Washing ist vollständig beschrieben; beim Sirup ist nur das Verhältnis bekannt.',
    'El lavado con mantequilla dorada está detallado; del sirope se conoce la proporción, pero no el método.',
    '브라운 버터 워시는 상세히 공개되었고 흑설탕 시럽은 비율만 알려져 있습니다.',
    '焦がしバターのウォッシュ工程は詳細あり。ブラウンシュガーシロップは比率のみ記載されています。',
    'Il lavaggio al burro nocciola è descritto; dello sciroppo è noto solo il rapporto.',
  ),gaps:[L(
    'Brown-sugar syrup: the source gives equal parts brown sugar and water, but no preparation method, yield, or storage.',
    '红糖糖浆：来源只给出红糖与水等份，未说明制法、产量或保存方式。',
    'Sirop de cassonade : parts égales sucre-eau, sans méthode, rendement ni conservation.',
    'Brauner Zuckersirup: gleiche Teile Zucker und Wasser, ohne Methode, Ausbeute oder Lagerung.',
    'Sirope de azúcar moreno: partes iguales de azúcar y agua, sin método, rendimiento ni conservación.',
    '흑설탕 시럽은 설탕과 물 동량만 제시되며 제조법, 완성량, 보관법은 없습니다.',
    'ブラウンシュガーシロップは砂糖と水が同量との記載のみで、作り方、出来上がり量、保存方法は不明です。',
    'Sciroppo di zucchero di canna: parti uguali di zucchero e acqua, senza metodo, resa o conservazione.',
  )],checkedAt,cards:[
    {
      id:'brown-butter-wash',ingredientId:'brown-butter-washed-bourbon',title:L('Brown-butter-washed bourbon','棕黄油浸洗波本','Bourbon lavé au beurre noisette','Mit brauner Butter gewaschener Bourbon','Bourbon lavado con mantequilla dorada','브라운 버터 워시 버번','焦がしバター・ウォッシュ・バーボン','Bourbon lavato al burro nocciola'),
      role:'process',status:'disclosed',inputs:[
        L('1/2 cup unsalted butter','无盐黄油 1/2 杯','1/2 tasse de beurre doux','1/2 Tasse ungesalzene Butter','1/2 taza de mantequilla sin sal','무염 버터 1/2컵','無塩バター 1/2カップ','1/2 tazza di burro non salato'),
        L('750 ml Benchmark bourbon, or another bourbon','Benchmark 波本 750 毫升，或其他波本','750 ml de bourbon Benchmark, ou un autre bourbon','750 ml Benchmark Bourbon oder ein anderer Bourbon','750 ml de bourbon Benchmark u otro bourbon','벤치마크 버번 750ml 또는 다른 버번','Benchmarkバーボン750ml、または別のバーボン','750 ml di bourbon Benchmark o altro bourbon'),
      ],steps:[
        L('Slowly brown the butter in a saucepan until well toasted and nutty-smelling. Remove from the heat and let it cool.','在锅中缓慢加热黄油，煎至充分棕化并出现坚果香；离火冷却。','Faire brunir lentement le beurre jusqu’à une odeur grillée et noisettée, puis retirer du feu et refroidir.','Butter langsam kräftig bräunen, bis sie nussig duftet; vom Herd nehmen und abkühlen lassen.','Dorar lentamente la mantequilla hasta que huela tostada y a nuez; retirar y enfriar.','버터를 천천히 진한 갈색과 견과 향이 날 때까지 익히고 불에서 내려 식힙니다.','バターをゆっくり焦がし、ナッツ香が出たら火から外して冷ます。','Rosolare lentamente il burro finché è tostato e profuma di nocciola; togliere dal fuoco e raffreddare.'),
        L('Pour the bourbon into a plastic container and gently stir in the browned butter. Leave uncovered until completely cool and the butter is firm on top.','将波本倒入塑料容器，轻轻拌入棕黄油；不加盖放至完全冷却，黄油在表面凝固。','Verser le bourbon dans un récipient plastique, incorporer doucement le beurre et laisser découvert jusqu’au complet refroidissement et à la solidification en surface.','Bourbon in einen Kunststoffbehälter geben, Butter vorsichtig einrühren und offen vollständig abkühlen lassen, bis sie oben fest wird.','Verter el bourbon en un recipiente plástico, mezclar suavemente la mantequilla y dejar destapado hasta enfriar por completo y solidificar arriba.','버번을 플라스틱 용기에 붓고 브라운 버터를 부드럽게 섞은 뒤, 완전히 식어 버터가 위에서 굳을 때까지 열어 둡니다.','バーボンをプラスチック容器に入れ、焦がしバターを静かに混ぜる。蓋をせず完全に冷まし、上部のバターを固める。','Versare il bourbon in un contenitore di plastica, incorporare delicatamente il burro e lasciare scoperto fino a completo raffreddamento e solidificazione in superficie.'),
        L('Freeze the mixture, skim off the solids, then strain through cheesecloth until the solids are removed.','将混合物冷冻，撇去固体，再用纱布过滤去除剩余固体。','Congeler, retirer les solides puis filtrer sur étamine pour les éliminer.','Mischung einfrieren, Feststoffe abschöpfen und durch Käsetuch filtern.','Congelar, retirar los sólidos y colar por gasa hasta eliminarlos.','혼합물을 얼리고 고형분을 걷어낸 뒤 면포로 걸러 남은 고형분을 제거합니다.','混合物を凍らせ、固形分をすくい、チーズクロスで濾して除く。','Congelare, rimuovere i solidi e filtrare con garza fino a eliminarli.'),
        L('Cover, label, and date the finished bourbon.','完成后加盖，并标注名称与日期。','Couvrir, étiqueter et dater le bourbon fini.','Fertigen Bourbon abdecken, beschriften und datieren.','Tapar, etiquetar y fechar el bourbon terminado.','완성된 버번에 뚜껑을 덮고 이름과 날짜를 표시합니다.','完成したバーボンに蓋をし、名称と日付を記す。','Coprire, etichettare e datare il bourbon finito.'),
      ],equipment:L('Saucepan, plastic container, freezer, skimmer, and cheesecloth','锅、塑料容器、冷冻设备、撇取工具与纱布','Casserole, récipient plastique, congélateur, écumoire et étamine','Topf, Kunststoffbehälter, Gefrierfach, Abschöpfer und Käsetuch','Cazo, recipiente plástico, congelador, espumadera y gasa','소스팬, 플라스틱 용기, 냉동고, 건지개, 면포','鍋、プラスチック容器、冷凍庫、すくい器、チーズクロス','Pentola, contenitore di plastica, congelatore, schiumarola e garza'),gaps:[],sources:[brownButterSource],
    },
    {id:'brown-sugar-syrup',ingredientId:'brown-sugar-syrup',title:L('Brown-sugar syrup','红糖糖浆','Sirop de cassonade','Brauner Zuckersirup','Sirope de azúcar moreno','흑설탕 시럽','ブラウンシュガーシロップ','Sciroppo di zucchero di canna'),role:'prepared-ingredient',status:'partial',inputs:[L('Equal parts brown sugar and water','等份红糖与水','Cassonade et eau à parts égales','Brauner Zucker und Wasser zu gleichen Teilen','Azúcar moreno y agua a partes iguales','흑설탕과 물 동량','ブラウンシュガーと水を同量','Zucchero di canna e acqua in parti uguali')],steps:[],gaps:[L('The source gives the ratio but no mixing or heating method, yield, or storage.','来源给出比例，但未说明混合或加热方法、产量或保存方式。','La source donne le ratio, sans méthode, rendement ni conservation.','Die Quelle nennt das Verhältnis, aber keine Methode, Ausbeute oder Lagerung.','La fuente da la proporción, pero no método, rendimiento ni conservación.','출처는 비율만 제시하며 혼합·가열법, 완성량, 보관법은 없습니다.','出典は比率のみで、混ぜ方・加熱法・出来上がり量・保存方法は不明です。','La fonte dà il rapporto, senza metodo, resa o conservazione.')],sources:[brownButterSource]},
  ],
};

const pearlDiver: RecipePreparation = {
  versionId:'pearl-diver-batch-f',status:'disclosed',summary:disclosedSummary,gaps:[],checkedAt,cards:[
    {id:'pearl-diver-gardenia',ingredientId:'dons-gardenia-mix',title:L('Don’s Gardenia Mix','Don’s Gardenia Mix 香料黄油蜜','Don’s Gardenia Mix','Don’s Gardenia Mix','Don’s Gardenia Mix','돈스 가드니아 믹스','ドンズ・ガーデニア・ミックス','Don’s Gardenia Mix'),role:'prepared-ingredient',status:'disclosed',inputs:[
      L('1 oz honey','蜂蜜 1 盎司','30 ml de miel','1 oz Honig','1 oz de miel','꿀 1oz','蜂蜜 1oz','1 oz di miele'),
      L('1 oz unsalted butter','无盐黄油 1 盎司','30 ml de beurre doux','1 oz ungesalzene Butter','1 oz de mantequilla sin sal','무염 버터 1oz','無塩バター 1oz','1 oz di burro non salato'),
      L('1 tsp cinnamon syrup','肉桂糖浆 1 茶匙','1 c. à café de sirop de cannelle','1 TL Zimtsirup','1 cucharadita de sirope de canela','시나몬 시럽 1작은술','シナモンシロップ 小さじ1','1 cucchiaino di sciroppo di cannella'),
      L('1/2 tsp allspice liqueur','多香果利口酒 1/2 茶匙','1/2 c. à café de liqueur de piment','1/2 TL Pimentlikör','1/2 cucharadita de licor de pimienta de Jamaica','올스파이스 리큐어 1/2작은술','オールスパイスリキュール 小さじ1/2','1/2 cucchiaino di liquore allspice'),
      L('1/2 tsp vanilla syrup','香草糖浆 1/2 茶匙','1/2 c. à café de sirop de vanille','1/2 TL Vanillesirup','1/2 cucharadita de sirope de vainilla','바닐라 시럽 1/2작은술','バニラシロップ 小さじ1/2','1/2 cucchiaino di sciroppo di vaniglia'),
    ],steps:[L('Put all five ingredients in a bowl and whip with a spatula or electric mixer until smooth and creamy.','将五种材料放入碗中，用刮刀或电动搅拌器打至顺滑细腻。','Mettre les cinq ingrédients dans un bol et fouetter à la spatule ou au batteur jusqu’à consistance lisse et crémeuse.','Alle fünf Zutaten in einer Schüssel mit Spatel oder Mixer glatt und cremig schlagen.','Poner los cinco ingredientes en un bol y batir con espátula o batidora hasta obtener una crema lisa.','다섯 재료를 볼에 넣고 주걱이나 전동 믹서로 매끄럽고 크리미해질 때까지 휘핑합니다.','5材料をボウルに入れ、スパチュラまたは電動ミキサーで滑らかになるまで混ぜる。','Mettere i cinque ingredienti in una ciotola e montare con spatola o mixer fino a ottenere una crema liscia.')],equipment:L('Bowl and spatula or electric mixer','碗与刮刀，或电动搅拌器','Bol et spatule ou batteur électrique','Schüssel und Spatel oder elektrischer Mixer','Bol y espátula o batidora eléctrica','볼과 주걱 또는 전동 믹서','ボウルとスパチュラ、または電動ミキサー','Ciotola e spatola o mixer elettrico'),gaps:[],sources:[pearlDiverSource,gardeniaSource]},
    {id:'pearl-diver-cinnamon-syrup',title:L('Cinnamon syrup for the Gardenia Mix','Gardenia Mix 所用肉桂糖浆','Sirop de cannelle pour le Gardenia Mix','Zimtsirup für den Gardenia Mix','Sirope de canela para el Gardenia Mix','가드니아 믹스용 시나몬 시럽','ガーデニア・ミックス用シナモンシロップ','Sciroppo di cannella per il Gardenia Mix'),role:'prepared-ingredient',status:'disclosed',inputs:[L('2 cinnamon sticks, crumbled','肉桂棒 2 根，掰碎','2 bâtons de cannelle émiettés','2 zerbröselte Zimtstangen','2 ramas de canela desmenuzadas','부순 시나몬 스틱 2개','砕いたシナモンスティック2本','2 stecche di cannella sbriciolate'),L('4 cups sugar','砂糖 4 杯','4 tasses de sucre','4 Tassen Zucker','4 tazas de azúcar','설탕 4컵','砂糖4カップ','4 tazze di zucchero'),L('2 cups water','水 2 杯','2 tasses d’eau','2 Tassen Wasser','2 tazas de agua','물 2컵','水2カップ','2 tazze d’acqua')],steps:[L('Bring the cinnamon, sugar, and water to a boil over medium-high heat.','以中高火将肉桂、糖与水煮沸。','Porter cannelle, sucre et eau à ébullition sur feu moyen-vif.','Zimt, Zucker und Wasser bei mittlerer bis hoher Hitze aufkochen.','Llevar canela, azúcar y agua a ebullición a fuego medio-alto.','시나몬, 설탕, 물을 중강불에서 끓입니다.','シナモン、砂糖、水を中強火で沸騰させる。','Portare cannella, zucchero e acqua a ebollizione a fuoco medio-alto.'),L('Remove from the heat, cover, and let stand for 20 minutes; then strain and chill.','离火加盖静置 20 分钟，再过滤并冷却。','Retirer du feu, couvrir 20 minutes, puis filtrer et refroidir.','Vom Herd nehmen, abdecken, 20 Minuten ziehen lassen, dann abseihen und kühlen.','Retirar del fuego, tapar 20 minutos, colar y enfriar.','불에서 내려 뚜껑을 덮고 20분 둔 뒤 걸러 식힙니다.','火から外し、蓋をして20分置き、濾して冷やす。','Togliere dal fuoco, coprire per 20 minuti, filtrare e raffreddare.')],timing:L('20-minute covered rest after boiling','煮沸后加盖静置 20 分钟','Repos couvert de 20 minutes après ébullition','20 Minuten abgedeckt nach dem Aufkochen','Reposo tapado de 20 minutos tras hervir','끓인 뒤 뚜껑을 덮어 20분','沸騰後、蓋をして20分','Riposo coperto di 20 minuti dopo l’ebollizione'),gaps:[],sources:[gardeniaSource]},
  ],
};

const zombie: RecipePreparation = {
  versionId:'zombie-iba',status:'disclosed',summary:disclosedSummary,gaps:[],checkedAt,cards:[{
    id:'zombie-donns-mix',ingredientId:'donns-mix',title:same('Donn’s Mix'),role:'prepared-ingredient',status:'disclosed',
    inputs:[L('2 parts fresh yellow grapefruit juice','新鲜黄葡萄柚汁 2 份','2 parts de jus frais de pamplemousse jaune','2 Teile frischer gelber Grapefruitsaft','2 partes de zumo fresco de pomelo amarillo','생 옐로 자몽 주스 2파트','フレッシュ・イエローグレープフルーツジュース 2','2 parti di succo fresco di pompelmo giallo'),L('1 part cinnamon syrup','肉桂糖浆 1 份','1 part de sirop de cannelle','1 Teil Zimtsirup','1 parte de sirope de canela','시나몬 시럽 1파트','シナモンシロップ 1','1 parte di sciroppo di cannella')],
    steps:[L('Use the source’s two-to-one proportion of grapefruit juice to cinnamon syrup.','按来源给出的 2:1 比例使用葡萄柚汁与肉桂糖浆。','Respecter la proportion deux pour un de jus de pamplemousse et de sirop de cannelle.','Grapefruitsaft und Zimtsirup im Quellenverhältnis zwei zu eins verwenden.','Usar la proporción de la fuente: dos partes de pomelo por una de sirope de canela.','출처의 자몽 주스 2 대 시나몬 시럽 1 비율을 사용합니다.','出典どおり、グレープフルーツジュース2に対してシナモンシロップ1を用いる。','Usare il rapporto della fonte: due parti di pompelmo e una di sciroppo di cannella.')],
    gaps:[],sources:[zombieSource],
  }],
};

const penicillinPunch: RecipePreparation = {
  versionId:'penicillin-punch-proper-drink',status:'disclosed',summary:disclosedSummary,gaps:[],checkedAt,cards:[{
    id:'penicillin-honey-ginger-syrup',ingredientId:'honey-ginger-syrup',title:L('Honey-ginger syrup','蜂蜜姜糖浆','Sirop miel-gingembre','Honig-Ingwer-Sirup','Sirope de miel y jengibre','허니 진저 시럽','ハニー・ジンジャーシロップ','Sciroppo miele e zenzero'),role:'prepared-ingredient',status:'disclosed',
    inputs:[L('1 cup honey','蜂蜜 1 杯','1 tasse de miel','1 Tasse Honig','1 taza de miel','꿀 1컵','蜂蜜1カップ','1 tazza di miele'),L('One 6-inch piece of ginger root, peeled and sliced','姜根一段，长 6 英寸，去皮切片','Un morceau de gingembre de 15 cm, pelé et tranché','Ein 15 cm langes Stück Ingwer, geschält und geschnitten','Un trozo de jengibre de 15 cm, pelado y cortado','껍질을 벗겨 썬 6인치 생강 한 조각','皮をむいて薄切りにした生姜6インチ分','Un pezzo di zenzero da 15 cm, pelato e affettato'),L('1 cup water','水 1 杯','1 tasse d’eau','1 Tasse Wasser','1 taza de agua','물 1컵','水1カップ','1 tazza d’acqua')],
    steps:[L('Combine the honey, ginger, and water in a small pot and bring to a boil.','将蜂蜜、姜和水放入小锅并煮沸。','Réunir miel, gingembre et eau dans une petite casserole et porter à ébullition.','Honig, Ingwer und Wasser in einem kleinen Topf aufkochen.','Combinar miel, jengibre y agua en una olla pequeña y llevar a ebullición.','꿀, 생강, 물을 작은 냄비에 넣고 끓입니다.','蜂蜜、生姜、水を小鍋に入れて沸騰させる。','Unire miele, zenzero e acqua in un pentolino e portare a ebollizione.'),L('Lower the heat and simmer for 5 minutes.','转小火煮 5 分钟。','Réduire le feu et frémir 5 minutes.','Hitze reduzieren und 5 Minuten köcheln.','Bajar el fuego y cocer 5 minutos.','불을 줄여 5분간 끓입니다.','弱火にして5分煮る。','Abbassare il fuoco e sobbollire per 5 minuti.'),L('Refrigerate overnight, then strain and discard the solids.','冷藏一夜，随后过滤并弃去固体。','Réfrigérer une nuit, puis filtrer et jeter les solides.','Über Nacht kühlen, dann abseihen und die Feststoffe verwerfen.','Refrigerar toda la noche, colar y desechar los sólidos.','하룻밤 냉장한 뒤 걸러 고형분을 버립니다.','一晩冷蔵し、濾して固形分を除く。','Refrigerare per una notte, poi filtrare e scartare i solidi.')],
    equipment:L('Small pot, refrigerator, and strainer','小锅、冰箱与滤具','Petite casserole, réfrigérateur et filtre','Kleiner Topf, Kühlschrank und Sieb','Olla pequeña, nevera y colador','작은 냄비, 냉장고, 거름망','小鍋、冷蔵庫、濾し器','Pentolino, frigorifero e filtro'),timing:L('5-minute simmer, then refrigerate overnight','小火煮 5 分钟，再冷藏一夜','5 minutes de frémissement puis une nuit au froid','5 Minuten köcheln, dann über Nacht kühlen','5 minutos de cocción suave y una noche en frío','5분간 끓인 뒤 하룻밤 냉장','5分煮て、一晩冷蔵','5 minuti di sobbollitura, poi una notte in frigorifero'),gaps:[],sources:[penicillinPunchSource],
  }],
};

function namedPartial(versionId:string, id:string, ingredientId:string, title:Localized, source:{title:string;url:string}, gap:Localized = formulaMissing): RecipePreparation {
  return {versionId,status:'partial',summary:partialSummary,gaps:[gap],checkedAt,cards:[{id,ingredientId,title,role:'prepared-ingredient',status:'undisclosed',inputs:[],steps:[],gaps:[gap],sources:[source]}]};
}

const penicillinIba = namedPartial('penicillin-iba','penicillin-iba-honey-syrup','honey-syrup',L('Honey syrup','蜂蜜糖浆','Sirop de miel','Honigsirup','Sirope de miel','허니 시럽','ハニーシロップ','Sciroppo di miele'),penicillinIbaSource);
const missionary = namedPartial('missionarys-downfall-iba','missionary-honey-mix','honey-syrup',L('Honey Mix','蜂蜜混合液','Honey Mix','Honey Mix','Honey Mix','허니 믹스','ハニーミックス','Honey Mix'),missionarySource);

const vento: RecipePreparation = {
  versionId:'ve-n-to-iba',status:'partial',summary:partialSummary,gaps:[L(
    'The source says chamomile infusion may replace water in the honey mix, but gives no honey-to-liquid ratio; it also gives no formula for the chamomile cordial.',
    '来源说明蜂蜜混合液可用洋甘菊浸液代替水，但未给蜂蜜与液体比例；也未给洋甘菊柯迪尔配方。',
    'La source permet de remplacer l’eau du honey mix par une infusion de camomille, sans ratio, et ne donne pas la formule du cordial.',
    'Die Quelle erlaubt Kamillenaufguss statt Wasser im Honey Mix, nennt aber kein Verhältnis und keine Rezeptur für das Cordial.',
    'La fuente permite sustituir el agua del honey mix por infusión de manzanilla, sin proporción, y no da la fórmula del cordial.',
    '출처는 허니 믹스의 물을 캐모마일 차로 바꿀 수 있다고 하지만 비율과 캐모마일 코디얼 배합은 밝히지 않습니다.',
    'ハニーミックスの水をカモミール抽出液に替えられるとの記載はありますが、比率とカモミールコーディアルの配合は不明です。',
    'La fonte consente l’infuso di camomilla al posto dell’acqua nel honey mix, senza rapporto, e non dà la formula del cordial.',
  )],checkedAt,cards:[
    {id:'vento-honey-mix',ingredientId:'honey-syrup',title:L('Honey mix with optional chamomile infusion','任意使用洋甘菊浸液的蜂蜜混合液','Honey mix avec infusion de camomille facultative','Honey Mix mit optionalem Kamillenaufguss','Honey mix con infusión de manzanilla opcional','캐모마일 차 선택이 가능한 허니 믹스','カモミール抽出液を選べるハニーミックス','Honey mix con infuso di camomilla facoltativo'),role:'prepared-ingredient',status:'partial',inputs:[L('Honey and water; chamomile infusion may replace the water','蜂蜜与水；水可替换为洋甘菊浸液','Miel et eau ; l’infusion de camomille peut remplacer l’eau','Honig und Wasser; Kamillenaufguss kann das Wasser ersetzen','Miel y agua; la infusión de manzanilla puede sustituir el agua','꿀과 물. 물 대신 캐모마일 차를 쓸 수 있습니다','蜂蜜と水。水はカモミール抽出液に変更可','Miele e acqua; l’infuso di camomilla può sostituire l’acqua')],steps:[],gaps:[L('No ratio, infusion method, yield, or storage is disclosed.','未公开比例、浸泡方法、产量或保存方式。','Aucun ratio, mode d’infusion, rendement ou conservation n’est publié.','Kein Verhältnis, keine Aufgussmethode, Ausbeute oder Lagerung veröffentlicht.','No se publican proporción, método de infusión, rendimiento ni conservación.','비율, 우림법, 완성량, 보관법이 공개되지 않았습니다.','比率、抽出方法、出来上がり量、保存方法は不明です。','Non sono pubblicati rapporto, metodo d’infusione, resa o conservazione.')],sources:[ventoSource]},
    {id:'vento-chamomile-cordial',ingredientId:'chamomile-cordial',title:L('Chamomile cordial','洋甘菊柯迪尔','Cordial de camomille','Kamillen-Cordial','Cordial de manzanilla','캐모마일 코디얼','カモミールコーディアル','Cordial di camomilla'),role:'prepared-ingredient',status:'undisclosed',inputs:[],steps:[],gaps:[formulaMissing],sources:[ventoSource]},
  ],
};

const blueHawaii: RecipePreparation = {
  versionId:'blue-hawaii-batch-f',status:'disclosed',summary:disclosedSummary,gaps:[],checkedAt,cards:[{
    id:'blue-hawaii-sour-mix',ingredientId:'sweet-and-sour-mix',title:L('Lime sweet-and-sour mix','青柠酸甜液','Mélange aigre-doux au citron vert','Limetten-Sour-Mix','Mezcla agridulce de lima','라임 스위트 앤 사워 믹스','ライムのスイート＆サワーミックス','Mix agrodolce al lime'),role:'prepared-ingredient',status:'disclosed',
    inputs:[L('1 part simple syrup','糖浆 1 份','1 part de sirop simple','1 Teil Zuckersirup','1 parte de almíbar simple','심플 시럽 1파트','シンプルシロップ 1','1 parte di sciroppo semplice'),L('1 part fresh lime juice','鲜青柠汁 1 份','1 part de jus de citron vert frais','1 Teil frischer Limettensaft','1 parte de zumo de lima fresco','생 라임 주스 1파트','フレッシュライムジュース 1','1 parte di succo fresco di lime')],
    steps:[L('Combine equal parts simple syrup and fresh lime juice. For one drink, the source also permits replacing 1 oz sour mix with 1/2 oz of each component directly in the shaker.','将等份糖浆与鲜青柠汁混合。制作单杯时，来源也允许在摇壶中直接以两者各 1/2 盎司替代 1 盎司酸甜液。','Mélanger à parts égales sirop simple et citron vert. Pour un verre, la source permet aussi 15 ml de chaque directement au shaker.','Gleiche Teile Zuckersirup und frischen Limettensaft mischen. Für einen Drink sind auch je 1/2 oz direkt im Shaker erlaubt.','Combinar partes iguales de almíbar y lima fresca. Para una copa, la fuente también permite 1/2 oz de cada uno directamente en la coctelera.','심플 시럽과 생 라임 주스를 동량으로 섞습니다. 한 잔에는 각 1/2oz를 셰이커에 바로 넣어도 됩니다.','シンプルシロップとフレッシュライムジュースを同量で合わせる。1杯分は各1/2ozをシェーカーに直接入れてもよい。','Unire parti uguali di sciroppo semplice e lime fresco. Per un drink, sono ammessi anche 1/2 oz di ciascuno direttamente nello shaker.')],gaps:[],sources:[blueHawaiiSource],
  }],
};

export const recipePreparations: RecipePreparation[] = [
  ...competitionExtensionPreparations,
  ...barExtensionPreparations,
  ...patronExtensionPreparations,
  ...batchMPreparations,
  houmei,
  ...japanPartials,
  brownButter,
  pearlDiver,
  zombie,
  penicillinPunch,
  penicillinIba,
  missionary,
  vento,
  blueHawaii,
];
