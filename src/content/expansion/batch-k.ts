import type {
  Approachability,Cocktail,Flavour,Ingredient,Localized,Locale,MixingMethod,
  RecipeIngredient,RecipeVersion,Source,Strength,Taste,
} from '../../domain/contracts';
import {L,S} from './localized';
import type {CatalogueBatch} from './types';

const checkedAt='2026-09-16';
const note=L;
const same=(value:string):Localized=>L(value,value,value,value,value,value,value,value);
const draftOrigin:NonNullable<Ingredient['guide']>['nameOrigin']={
  en:'source',zh:'draft',fr:'draft',de:'draft',es:'draft',ko:'draft',ja:'draft',it:'draft',
};

const ingredients:Ingredient[]=[
  {id:'connaught-vermouth-blend',name:L('Connaught vermouth blend','Connaught 味美思调和液','Assemblage de vermouths du Connaught','Connaught-Wermutmischung','Mezcla de vermuts del Connaught','코넛 베르무트 블렌드','コノートのベルモットブレンド','Miscela di vermouth del Connaught'),exclusionTags:[],compositionKnown:false,
    guide:{family:'wine',parents:['vermouth'],aliases:['vermouth blend','Connaught vermouth blend'],nameOrigin:draftOrigin}},
  {id:'connaught-bitters-selection',name:L('Connaught bitters selection','Connaught 苦精选择','Sélection de bitters du Connaught','Connaught-Bitters-Auswahl','Selección de bitters del Connaught','코넛 비터스 셀렉션','コノートのビターズセレクション','Selezione di bitter del Connaught'),exclusionTags:[],compositionKnown:false,
    guide:{family:'bitters',parents:['bitters'],aliases:['bitters of choice','Connaught bitters'],nameOrigin:draftOrigin}},
  {id:'pineapple-cordial',name:L('Pineapple cordial','菠萝柯迪尔','Cordial d’ananas','Ananas-Cordial','Cordial de piña','파인애플 코디얼','パイナップルコーディアル','Cordial all’ananas'),exclusionTags:[],compositionKnown:false,
    guide:{family:'syrup',parents:['pineapple'],aliases:['pineapple cordial'],nameOrigin:draftOrigin}},
  {id:'coconut-sorbet',name:L('Coconut sorbet','椰子雪葩','Sorbet coco','Kokossorbet','Sorbete de coco','코코넛 소르베','ココナッツソルベ','Sorbetto al cocco'),exclusionTags:[],compositionKnown:false,
    guide:{family:'coconut',parents:['coconut','sorbet'],aliases:['coconut sorbet'],nameOrigin:draftOrigin}},
  {id:'pineapple-lapsang-infused-gin',name:L('Pineapple and Lapsang Souchong-infused gin','菠萝正山小种浸泡金酒','Gin infusé à l’ananas et au Lapsang Souchong','Gin mit Ananas und Lapsang Souchong','Ginebra infusionada con piña y Lapsang Souchong','파인애플·랍상 수숑 인퓨즈드 진','パイナップルとラプサンスーチョンのインフューズドジン','Gin infuso con ananas e Lapsang Souchong'),base:'gin',exclusionTags:['gin'],compositionKnown:false,
    guide:{family:'spirit',parents:['gin','pineapple','tea'],aliases:['pineapple lapsang gin'],nameOrigin:draftOrigin}},
  {id:'rhubarb-puree',name:L('Sweetened rhubarb purée','加糖大黄泥','Purée de rhubarbe sucrée','Gesüßtes Rhabarberpüree','Puré de ruibarbo endulzado','가당 루바브 퓌레','加糖ルバーブピューレ','Purea di rabarbaro zuccherata'),exclusionTags:[],compositionKnown:true,
    guide:{family:'vegetable',parents:['rhubarb'],aliases:['rhubarb purée','rhubarb puree'],nameOrigin:draftOrigin}},
];

interface Profile {
  id:string;name:Localized;description:Localized;accent:string;
  flavours:Flavour[];tastes:Taste[];strength:Strength;approachability:Approachability;aliases?:string[];
}
const profiles:Profile[]=[
  {id:'connaught-martini',name:same('The Connaught Martini'),aliases:['Connaught Martini'],accent:'#B7A57A',flavours:['citrus','herbal','spice'],tastes:['dry','bitter'],strength:'strong',approachability:'bold',description:L(
    'The Connaught Bar’s tableside Martini combines gin, its unpublished vermouth blend, chosen bitters, and a lemon twist.',
    'Connaught Bar 的桌边马天尼以金酒、未公开配方的味美思调和液、所选苦精与柠檬皮卷调制。',
    'Le Martini servi à table du Connaught Bar associe gin, assemblage de vermouths non publié, bitters choisis et zeste de citron.',
    'Der am Tisch servierte Martini der Connaught Bar verbindet Gin, eine unveröffentlichte Wermutmischung, gewählte Bitters und Zitronenzeste.',
    'El Martini servido en mesa del Connaught Bar combina ginebra, su mezcla de vermuts no publicada, bitters elegidos y piel de limón.',
    '코넛 바의 테이블사이드 마티니는 진, 비공개 베르무트 블렌드, 선택한 비터스와 레몬 트위스트를 조합합니다.',
    'コノート・バーのテーブルサイド・マティーニは、ジン、非公開のベルモットブレンド、選んだビターズ、レモンツイストを合わせます。',
    'Il Martini al tavolo del Connaught Bar unisce gin, miscela di vermouth non pubblicata, bitter scelti e scorza di limone.',
  )},
  {id:'champagne-pina-colada',name:same('Champagne Piña Colada'),accent:'#E5C982',flavours:['fruit'],tastes:['sweet','creamy','refreshing'],strength:'medium',approachability:'balanced',description:L(
    'Coupette’s frozen-style Piña Colada layers three rums, pineapple, coconut sorbet, and Champagne.',
    'Coupette 的冰冻风格 Piña Colada 叠加三种朗姆、菠萝、椰子雪葩与香槟。',
    'La Piña Colada façon frozen de Coupette réunit trois rhums, ananas, sorbet coco et Champagne.',
    'Coupette verbindet in dieser Frozen Piña Colada drei Rums, Ananas, Kokossorbet und Champagner.',
    'La Piña Colada estilo frozen de Coupette combina tres rones, piña, sorbete de coco y champán.',
    '쿠페트의 프로즌 스타일 피냐 콜라다는 세 가지 럼, 파인애플, 코코넛 소르베와 샴페인을 겹칩니다.',
    'クーペットのフローズン風ピニャ・コラーダは、3種のラム、パイナップル、ココナッツソルベ、シャンパンを重ねます。',
    'La Piña Colada frozen di Coupette unisce tre rum, ananas, sorbetto al cocco e Champagne.',
  )},
  {id:'vicuna',name:same('Vicuña'),accent:'#D38C52',flavours:['fruit','citrus'],tastes:['sour','sweet','refreshing'],strength:'strong',approachability:'bold',description:L(
    'Limantour’s Vicuña balances pisco and cupreata mezcal with pineapple, lemon, and agave.',
    'Limantour 的 Vicuña 以皮斯科与 Cupreata 梅斯卡尔搭配菠萝、柠檬和龙舌兰糖浆。',
    'Le Vicuña de Limantour équilibre pisco et mezcal cupreata avec ananas, citron et agave.',
    'Limantours Vicuña balanciert Pisco und Cupreata-Mezcal mit Ananas, Zitrone und Agave.',
    'El Vicuña de Limantour equilibra pisco y mezcal cupreata con piña, limón y agave.',
    '리만투르의 Vicuña는 피스코와 쿠프레아타 메스칼에 파인애플, 레몬, 아가베를 맞춥니다.',
    'リマンツールのVicuñaは、ピスコとクプレアータ・メスカルにパイナップル、レモン、アガベを合わせます。',
    'Il Vicuña di Limantour bilancia pisco e mezcal cupreata con ananas, limone e agave.',
  )},
  {id:'left-hand',name:same('Left Hand'),accent:'#8F3431',flavours:['herbal','spice'],tastes:['bitter','sweet'],strength:'strong',approachability:'bold',description:L(
    'Sam Ross’s Left Hand stirs bourbon, sweet vermouth, Campari, and mole chocolate bitters.',
    'Sam Ross 的 Left Hand 将波本、甜味美思、Campari 与 Mole 巧克力苦精搅拌调和。',
    'Le Left Hand de Sam Ross mêle bourbon, vermouth doux, Campari et bitters chocolat mole.',
    'Sam Ross’ Left Hand rührt Bourbon, süßen Wermut, Campari und Mole-Schokoladenbitters.',
    'El Left Hand de Sam Ross mezcla bourbon, vermut dulce, Campari y bitters de chocolate mole.',
    '샘 로스의 Left Hand는 버번, 스위트 베르무트, 캄파리와 몰레 초콜릿 비터스를 젓습니다.',
    'サム・ロスのLeft Handは、バーボン、スイートベルモット、カンパリ、モレ・チョコレートビターズをステアします。',
    'Il Left Hand di Sam Ross mescola bourbon, vermouth dolce, Campari e bitter mole al cioccolato.',
  )},
  {id:'maggie-smith',name:same('Maggie Smith'),accent:'#D6A45A',flavours:['citrus','fruit'],tastes:['sour','sweet'],strength:'strong',approachability:'balanced',description:L(
    'Death & Co’s Maggie Smith combines pisco, white rum, orange liqueur, lime, orgeat, and honey.',
    'Death & Co 的 Maggie Smith 结合皮斯科、白朗姆、橙味利口酒、青柠、杏仁糖浆和蜂蜜。',
    'Le Maggie Smith de Death & Co associe pisco, rhum blanc, liqueur d’orange, citron vert, orgeat et miel.',
    'Death & Cos Maggie Smith verbindet Pisco, weißen Rum, Orangenlikör, Limette, Orgeat und Honig.',
    'El Maggie Smith de Death & Co combina pisco, ron blanco, licor de naranja, lima, orgeat y miel.',
    '데스 앤 코의 Maggie Smith는 피스코, 화이트 럼, 오렌지 리큐어, 라임, 오르제와 꿀을 조합합니다.',
    'デス＆カンパニーのMaggie Smithは、ピスコ、ホワイトラム、オレンジリキュール、ライム、オルジェ、蜂蜜を合わせます。',
    'Il Maggie Smith di Death & Co unisce pisco, rum bianco, liquore all’arancia, lime, orzata e miele.',
  )},
  {id:'trasatlantico-fizz',name:same('Trasatlántico Fizz'),accent:'#E0B878',flavours:['citrus','fruit'],tastes:['sour','sweet','creamy','refreshing'],strength:'strong',approachability:'balanced',description:L(
    'Florería Atlántico’s citrus fizz joins gin, sherry, orange liqueur, egg white, soda, and a peated Scotch mist.',
    'Florería Atlántico 的柑橘菲士结合金酒、雪莉、橙味利口酒、蛋清、苏打与泥煤苏格兰威士忌喷雾。',
    'Le fizz aux agrumes de Florería Atlántico réunit gin, xérès, liqueur d’orange, blanc d’œuf, soda et brume de Scotch tourbé.',
    'Florería Atlánticos Zitrus-Fizz verbindet Gin, Sherry, Orangenlikör, Eiweiß, Soda und einen Sprühstoß torfigen Scotch.',
    'El fizz cítrico de Florería Atlántico combina ginebra, jerez, licor de naranja, clara, soda y una bruma de Scotch ahumado.',
    '플로레리아 아틀란티코의 시트러스 피즈는 진, 셰리, 오렌지 리큐어, 달걀흰자, 소다와 피티드 스카치 미스트를 조합합니다.',
    'フロレリア・アトランティコのシトラス・フィズは、ジン、シェリー、オレンジリキュール、卵白、ソーダ、ピーテッドスコッチのミストを合わせます。',
    'Il fizz agrumato di Florería Atlántico unisce gin, sherry, liquore all’arancia, albume, soda e una nebulizzazione di Scotch torbato.',
  )},
  {id:'belafonte-spritz',name:same('Belafonte Spritz'),accent:'#D6C36F',flavours:['citrus','herbal'],tastes:['dry','sour','refreshing'],strength:'medium',approachability:'gentle',description:L(
    'This Must Be the Place’s spritz builds gin, fino, lemon, syrup, and Prosecco over ice with basil.',
    'This Must Be the Place 的 Spritz 将金酒、菲诺雪莉、柠檬、糖浆与 Prosecco 加冰直调，并饰以罗勒。',
    'Le spritz de This Must Be the Place assemble gin, fino, citron, sirop et Prosecco sur glace avec du basilic.',
    'Der Spritz von This Must Be the Place baut Gin, Fino, Zitrone, Sirup und Prosecco über Eis mit Basilikum.',
    'El spritz de This Must Be the Place combina ginebra, fino, limón, almíbar y Prosecco sobre hielo con albahaca.',
    '디스 머스트 비 더 플레이스의 스프리츠는 진, 피노, 레몬, 시럽과 프로세코를 얼음 위에 빌드하고 바질을 더합니다.',
    'This Must Be the Placeのスプリッツは、ジン、フィノ、レモン、シロップ、プロセッコを氷上でビルドし、バジルを添えます。',
    'Lo spritz di This Must Be the Place costruisce gin, fino, limone, sciroppo e Prosecco su ghiaccio con basilico.',
  )},
];

const sourceDefs=[
  {id:'connaught-martini',title:'How to make the Connaught Bar Martini — Club Oenologique',url:'https://cluboenologique.com/story/how-to-make-the-connaught-bar-martini/',author:'Joel Harrison and Agostino Perrone'},
  {id:'champagne-pina-colada',title:'Three contemporary autumn cocktail recipes to try now — MR PORTER',url:'https://www.mrporter.com/en-ca/journal/lifestyle/three-contemporary-autumn-cocktail-recipes-to-try-now-568978',author:'Heather Taylor'},
  {id:'vicuna',title:'Vicuña from Limantour — Imbibe',url:'https://imbibemagazine.com/recipe/vicuna-from-limantour/',author:'Imbibe'},
  {id:'singapore-sling-jigger-pony',title:'Jigger & Pony Singapore Sling — Imbibe',url:'https://imbibemagazine.com/recipe/jigger-pony-singapore-sling/',author:'Imbibe'},
  {id:'left-hand',title:'Left Hand / Right Hand Cocktail — Imbibe',url:'https://imbibemagazine.com/recipe/left-hand-right-hand-cocktail/',author:'Imbibe'},
  {id:'maggie-smith',title:'Maggie Smith — Death & Co Market',url:'https://www.deathandcompanymarket.com/blogs/recipes/maggie-smith',author:'Death & Co'},
  {id:'trasatlantico-fizz',title:'Trasatlántico Fizz from Florería Atlántico — Imbibe',url:'https://imbibemagazine.com/recipe/trasatlantico-fizz-from-floreria-atlantico/',author:'Imbibe'},
  {id:'belafonte-spritz',title:'Belafonte Spritz — Imbibe',url:'https://imbibemagazine.com/recipe/belafonte-spritz-recipe/',author:'Imbibe'},
] as const;
const sources:Source[]=sourceDefs.map(source=>({id:'bar-k-'+source.id,title:source.title,url:source.url,author:source.author,checkedAt}));

interface Recipe {
  id:string;cocktailId:string;topicId:string;venue:string;countryCodes:string[];year?:number;label:Localized;
  ingredients:RecipeIngredient[];steps:Record<Locale,string[]>;originalSteps:string[];
  methods:Array<{method:MixingMethod;stepIndexes:number[]}>;
  glass:Localized;garnish:Localized;
}
const recipes:Recipe[]=[
  {
    id:'connaught-martini',cocktailId:'connaught-martini',topicId:'bar-connaught-london',venue:'The Connaught Bar',countryCodes:['GB'],
    label:L('Connaught Bar public recipe','Connaught Bar 公开配方','Recette publique du Connaught Bar','Öffentliches Rezept der Connaught Bar','Receta pública del Connaught Bar','코넛 바 공개 레시피','コノート・バー公開レシピ','Ricetta pubblica del Connaught Bar'),
    ingredients:[
      {ingredientId:'connaught-bitters-selection',amount:2,unit:'ml',note:note('Bitters of choice; the source does not disclose the formulas of the available bitters.','苦精任选；来源未公开可选苦精的配方。','Bitters au choix ; la source ne publie pas leurs formules.','Bitters nach Wahl; die Rezepturen der Auswahl sind nicht veröffentlicht.','Bitters a elegir; la fuente no publica sus fórmulas.','비터스는 선택하며, 출처는 선택 가능한 비터스의 배합을 공개하지 않습니다.','ビターズは選択式で、各配合は公開されていません。','Bitter a scelta; la fonte non ne pubblica le formule.')},
      {ingredientId:'connaught-vermouth-blend',amount:15,unit:'ml',note:note('The house vermouth-blend formula is not published.','店内味美思调和液配方未公开。','La formule de l’assemblage maison n’est pas publiée.','Die Rezeptur der Haus-Wermutmischung ist nicht veröffentlicht.','La fórmula de la mezcla de vermuts de la casa no está publicada.','하우스 베르무트 블렌드 배합은 공개되지 않았습니다.','ハウス・ベルモットブレンドの配合は非公開です。','La formula della miscela di vermouth della casa non è pubblicata.')},
      {ingredientId:'gin',amount:75,unit:'ml',note:note('This stored version selects gin and a lemon twist. The source independently offers gin or vodka as the spirit and a lemon twist or green olive as the garnish.','当前记录选择金酒与柠檬皮卷；来源允许基酒在金酒或伏特加间选择，装饰则独立选择柠檬皮卷或绿橄榄。','Cette version choisit gin et zeste de citron. La source propose séparément gin ou vodka pour le spiritueux, et zeste de citron ou olive verte pour la garniture.','Diese Version wählt Gin und Zitronenzeste. Die Quelle bietet unabhängig Gin oder Wodka als Spirituose sowie Zitronenzeste oder grüne Olive als Garnitur an.','Esta versión elige ginebra y piel de limón. La fuente permite elegir por separado ginebra o vodka como destilado y piel de limón o aceituna verde como guarnición.','현재 기록은 진과 레몬 트위스트를 선택합니다. 출처는 베이스를 진 또는 보드카에서, 장식을 레몬 트위스트 또는 그린 올리브에서 각각 독립적으로 선택하도록 합니다.','この保存版はジンとレモンツイストを選択。出典ではベースをジンまたはウォッカから、ガーニッシュをレモンツイストまたはグリーンオリーブからそれぞれ選べます。','Questa versione sceglie gin e scorza di limone. La fonte consente di scegliere separatamente gin o vodka come distillato e scorza di limone o oliva verde come guarnizione.')},
    ],
    steps:S(
      ['Use a dropper to run the selected bitters around the rim of a frozen Martini glass or coupette.','Stir the vermouth blend and gin with large ice until very cold, then strain from a raised mixing glass. Express lemon oil through the falling stream and garnish with the twist.'],
      ['用滴管将所选苦精沿冰冻马天尼杯或碟形杯杯口绕一圈。','味美思调和液与金酒加大冰搅至极冷，从抬高的调酒杯滤入；让柠檬油穿过落下的酒流，并以柠檬皮卷装饰。'],
      ['Faire courir les bitters choisis sur le bord d’un verre Martini ou d’une coupe gelés à l’aide d’un compte-gouttes.','Remuer l’assemblage de vermouths et le gin avec de gros glaçons jusqu’à très froid, puis filtrer depuis le verre à mélange levé. Exprimer le citron dans le filet et garnir du zeste.'],
      ['Die gewählten Bitters mit einer Pipette am Rand eines gefrorenen Martini- oder Coupetteglases verteilen.','Wermutmischung und Gin mit großen Eiswürfeln sehr kalt rühren und aus erhöhtem Rührglas abseihen. Zitronenöl durch den fallenden Strahl ausdrücken und mit der Zeste garnieren.'],
      ['Recorre el borde de una copa Martini o coupe congelada con los bitters elegidos usando un cuentagotas.','Remueve la mezcla de vermuts y la ginebra con hielo grande hasta enfriar mucho; cuela desde el vaso mezclador elevado. Exprime el limón a través del chorro y adorna con la piel.'],
      ['드로퍼로 선택한 비터스를 얼린 마티니 또는 쿠페 잔 테두리에 둘러줍니다.','베르무트 블렌드와 진을 큰 얼음과 매우 차가워질 때까지 저은 뒤 믹싱 글라스를 들어 올려 거릅니다. 떨어지는 술줄기에 레몬 오일을 짜고 트위스트로 장식합니다.'],
      ['スポイトで選んだビターズを凍らせたマティーニグラスまたはクープの縁に回しかける。','ベルモットブレンドとジンを大きな氷で十分冷えるまでステアし、高く掲げたミキシンググラスから注ぐ。落ちる液体にレモンオイルを搾り、ツイストを飾る。'],
      ['Con un contagocce distribuire i bitter scelti sul bordo di una coppa Martini o coupette congelata.','Mescolare miscela di vermouth e gin con ghiaccio grande fino a molto freddo, poi filtrare dal mixing glass sollevato. Esprimere l’olio di limone attraverso il flusso e guarnire con la scorza.'],
    ),
    originalSteps:['Run the selected bitters around the frozen glass rim.','Stir the vermouth blend and gin with large ice until very cold, strain from a raised mixing glass, and express lemon oil through the stream.'],
    methods:[{method:'stir',stepIndexes:[1]}],
    glass:L('Frozen Martini glass or coupette','冰冻马天尼杯或碟形杯','Verre Martini ou coupe gelés','Gefrorenes Martini- oder Coupetteglas','Copa Martini o coupe congelada','얼린 마티니 또는 쿠페 잔','凍らせたマティーニグラスまたはクープ','Coppa Martini o coupette congelata'),
    garnish:L('Lemon twist','柠檬皮卷','Zeste de citron','Zitronenzeste','Piel de limón','레몬 트위스트','レモンツイスト','Scorza di limone'),
  },
  {
    id:'champagne-pina-colada',cocktailId:'champagne-pina-colada',topicId:'bar-coupette-london',venue:'Coupette',countryCodes:['GB'],
    label:L('Coupette public recipe','Coupette 公开配方','Recette publique de Coupette','Öffentliches Rezept von Coupette','Receta pública de Coupette','쿠페트 공개 레시피','クーペット公開レシピ','Ricetta pubblica di Coupette'),
    ingredients:[
      {ingredientId:'white-rum',amount:10,unit:'ml',brandId:'brand-bacardi',note:note('Bacardi Superior Heritage Rum, as specified by the source.','来源指定 Bacardi Superior Heritage Rum。','Rhum Bacardi Superior Heritage, comme indiqué par la source.','Bacardi Superior Heritage Rum laut Quelle.','Ron Bacardi Superior Heritage, según la fuente.','출처가 지정한 Bacardi Superior Heritage Rum.','出典指定のBacardi Superior Heritage Rum。','Bacardi Superior Heritage Rum, come indicato dalla fonte.')},
      {ingredientId:'white-rum',amount:10,unit:'ml',brandId:'brand-bacardi',note:note('Bacardi Carta Blanca Rum, as specified by the source.','来源指定 Bacardi Carta Blanca Rum。','Rhum Bacardi Carta Blanca, comme indiqué par la source.','Bacardi Carta Blanca Rum laut Quelle.','Ron Bacardi Carta Blanca, según la fuente.','출처가 지정한 Bacardi Carta Blanca Rum.','出典指定のBacardi Carta Blanca Rum。','Bacardi Carta Blanca Rum, come indicato dalla fonte.')},
      {ingredientId:'rhum-agricole',amount:5,unit:'ml',note:note('White agricole rhum; no brand is specified.','白色农业朗姆；未指定品牌。','Rhum agricole blanc ; aucune marque précisée.','Weißer Rhum Agricole; keine Marke genannt.','Rhum agricole blanco; sin marca indicada.','화이트 럼 아그리콜이며 브랜드는 지정되지 않았습니다.','ホワイト・ラム・アグリコール。ブランド指定なし。','Rhum agricole bianco; nessuna marca specificata.')},
      {ingredientId:'pineapple-juice',amount:35,unit:'ml',note:note('Freshly squeezed pineapple juice.','鲜榨菠萝汁。','Jus d’ananas fraîchement pressé.','Frisch gepresster Ananassaft.','Zumo de piña recién exprimido.','갓 짠 파인애플 주스.','搾りたてのパイナップルジュース。','Succo d’ananas appena spremuto.')},
      {ingredientId:'pineapple-cordial',amount:30,unit:'ml',note:note('House cordial: two parts pineapple juice, one part caster sugar, and citric acid to taste; the full method is not published.','自制柯迪尔：菠萝汁 2 份、细砂糖 1 份，柠檬酸调味；完整方法未公开。','Cordial maison : deux parts de jus d’ananas, une part de sucre semoule et acide citrique au goût ; méthode complète non publiée.','Haus-Cordial: zwei Teile Ananassaft, ein Teil feiner Zucker und Zitronensäure nach Geschmack; vollständige Methode nicht veröffentlicht.','Cordial de la casa: dos partes de zumo de piña, una de azúcar fino y ácido cítrico al gusto; método completo no publicado.','하우스 코디얼: 파인애플 주스 2, 캐스터 슈거 1, 구연산은 맛에 맞게. 전체 제조법은 공개되지 않았습니다.','自家製コーディアルはパイナップルジュース2、上白糖1、クエン酸は味を見て加える。全工程は非公開。','Cordial della casa: due parti di succo d’ananas, una di zucchero semolato e acido citrico a gusto; metodo completo non pubblicato.')},
      {ingredientId:'coconut-sorbet',amount:2,unit:'piece',note:note('Two small scoops; the source gives neither the sorbet formula nor scoop mass.','两小勺；来源未给雪葩配方或单勺质量。','Deux petites boules ; la formule du sorbet et leur masse ne sont pas données.','Zwei kleine Kugeln; weder Sorbetrezeptur noch Kugelmasse sind angegeben.','Dos bolas pequeñas; no se publican fórmula ni peso.','작은 스쿱 2개. 소르베 배합과 스쿱 무게는 공개되지 않았습니다.','小さなスクープ2杯。ソルベの配合と重量は不明。','Due piccole palline; formula del sorbetto e peso non pubblicati.')},
      {ingredientId:'champagne',amount:35,unit:'ml',note:note('Moët & Chandon NV Champagne, as specified by the source.','来源指定 Moët & Chandon NV 香槟。','Champagne Moët & Chandon NV, comme indiqué par la source.','Moët & Chandon NV Champagne laut Quelle.','Champán Moët & Chandon NV, según la fuente.','출처가 지정한 Moët & Chandon NV 샴페인.','出典指定のMoët & Chandon NVシャンパン。','Champagne Moët & Chandon NV, come indicato dalla fonte.')},
    ],
    steps:S(
      ['Blend both white rums, agricole rhum, pineapple juice, pineapple cordial, and coconut sorbet with crushed ice equal to about two-thirds of the serving glass.','Put the Champagne in the glass, pour the blended mixture over it, and finish with raw coconut chips.'],
      ['两种白朗姆、农业朗姆、菠萝汁、菠萝柯迪尔与椰子雪葩，加入约相当于成杯容量三分之二的碎冰搅打。','先将香槟倒入杯中，再覆上搅打混合物，最后放生椰子片。'],
      ['Mixer les deux rhums blancs, le rhum agricole, le jus et le cordial d’ananas, le sorbet coco et une quantité de glace pilée équivalant à environ deux tiers du verre.','Verser le Champagne dans le verre, ajouter le mélange mixé par-dessus et finir avec des chips de coco cru.'],
      ['Beide weißen Rums, Rhum Agricole, Ananassaft, Ananas-Cordial und Kokossorbet mit zerstoßenem Eis von etwa zwei Dritteln des Glasvolumens mixen.','Champagner ins Glas geben, die gemixte Mischung daraufgießen und mit rohen Kokoschips abschließen.'],
      ['Licua los dos rones blancos, rhum agricole, zumo y cordial de piña y sorbete de coco con hielo picado equivalente a unos dos tercios del vaso.','Pon el champán en el vaso, vierte encima la mezcla licuada y termina con chips de coco crudo.'],
      ['두 화이트 럼, 럼 아그리콜, 파인애플 주스와 코디얼, 코코넛 소르베를 서빙 잔 약 3분의 2 부피의 크러시드 아이스와 블렌딩합니다.','잔에 샴페인을 먼저 붓고 블렌딩한 혼합물을 올린 뒤 생 코코넛 칩으로 마무리합니다.'],
      ['2種のホワイトラム、ラム・アグリコール、パイナップルジュースとコーディアル、ココナッツソルベを、グラス容量の約3分の2のクラッシュアイスとブレンドする。','グラスにシャンパンを入れ、ブレンドした液体を重ね、生のココナッツチップで仕上げる。'],
      ['Frullare i due rum bianchi, rhum agricole, succo e cordial d’ananas e sorbetto al cocco con ghiaccio tritato pari a circa due terzi del bicchiere.','Versare lo Champagne nel bicchiere, aggiungere sopra la miscela frullata e finire con scaglie di cocco crudo.'],
    ),
    originalSteps:['Blend everything except Champagne and coconut chips with crushed ice equal to about two-thirds of the glass.','Put Champagne in the glass, pour the blend over it, and garnish with raw coconut chips.'],
    methods:[{method:'blend',stepIndexes:[0]},{method:'build',stepIndexes:[1]}],
    glass:L('Serving glass; style not stated by the source','成杯；来源未说明杯型','Verre de service ; type non précisé','Servierglas; Glasform nicht angegeben','Vaso de servicio; tipo no indicado','서빙 잔. 출처에 잔 종류가 없습니다','提供グラス。形状は出典に記載なし','Bicchiere di servizio; tipo non indicato'),
    garnish:L('Raw coconut chips','生椰子片','Chips de coco cru','Rohe Kokoschips','Chips de coco crudo','생 코코넛 칩','生のココナッツチップ','Scaglie di cocco crudo'),
  },
  {
    id:'vicuna',cocktailId:'vicuna',topicId:'bar-limantour-mexico-city',venue:'Licorería Limantour',countryCodes:['MX'],
    label:L('Limantour public recipe','Limantour 公开配方','Recette publique de Limantour','Öffentliches Limantour-Rezept','Receta pública de Limantour','리만투르 공개 레시피','リマンツール公開レシピ','Ricetta pubblica di Limantour'),
    ingredients:[
      {ingredientId:'pisco',amount:1,unit:'oz',note:note('Pisco style and brand are not specified.','未指定皮斯科风格或品牌。','Style et marque de pisco non précisés.','Pisco-Stil und Marke nicht angegeben.','No se especifican estilo ni marca de pisco.','피스코 스타일과 브랜드는 지정되지 않았습니다.','ピスコの種類とブランドは指定なし。','Stile e marca del pisco non specificati.')},
      {ingredientId:'mezcal',amount:1.5,unit:'oz',note:note('The source specifies cupreata mezcal.','来源指定 Cupreata 梅斯卡尔。','La source précise un mezcal cupreata.','Die Quelle nennt Cupreata-Mezcal.','La fuente especifica mezcal cupreata.','출처는 쿠프레아타 메스칼을 지정합니다.','出典はクプレアータ・メスカルを指定。','La fonte specifica mezcal cupreata.')},
      {ingredientId:'pineapple-juice',amount:2,unit:'oz'},{ingredientId:'lemon-juice',amount:.75,unit:'oz'},
      {ingredientId:'agave-nectar',amount:.5,unit:'oz',note:note('One-to-one agave syrup.','1:1 龙舌兰糖浆。','Sirop d’agave un pour un.','Agavensirup im Verhältnis eins zu eins.','Sirope de agave uno a uno.','1:1 아가베 시럽.','1対1のアガベシロップ。','Sciroppo d’agave uno a uno.')},
    ],
    steps:S(
      ['Shake all measured ingredients with ice.','Strain into a Collins glass filled with fresh ice and add the optional dehydrated produce garnish.'],
      ['所有定量材料加冰摇匀。','滤入装有新冰的柯林杯，并按需加入脱水果蔬装饰。'],
      ['Shaker tous les ingrédients mesurés avec de la glace.','Filtrer dans un Collins rempli de glace fraîche et ajouter, si désiré, la garniture déshydratée.'],
      ['Alle abgemessenen Zutaten mit Eis shaken.','In ein mit frischem Eis gefülltes Collinsglas abseihen und optional die getrocknete Garnitur zugeben.'],
      ['Agita con hielo todos los ingredientes medidos.','Cuela en un Collins con hielo fresco y añade, si deseas, la guarnición deshidratada.'],
      ['계량한 모든 재료를 얼음과 흔듭니다.','새 얼음을 채운 콜린스 잔에 거르고 선택 사항인 건조 과채 장식을 더합니다.'],
      ['計量した全材料を氷とシェイクする。','新しい氷を入れたコリンズグラスにこし、任意で乾燥野菜と果物を飾る。'],
      ['Shakerare con ghiaccio tutti gli ingredienti misurati.','Filtrare in un Collins con ghiaccio fresco e aggiungere, se desiderato, la guarnizione disidratata.'],
    ),
    originalSteps:['Shake all measured ingredients with ice.','Strain into a Collins over fresh ice and add the optional dehydrated garnish.'],
    methods:[{method:'shake',stepIndexes:[0]}],
    glass:L('Collins glass over fresh ice','加新冰的柯林杯','Verre Collins sur glace fraîche','Collinsglas mit frischem Eis','Vaso Collins con hielo fresco','새 얼음을 채운 콜린스 잔','新しい氷を入れたコリンズグラス','Collins con ghiaccio fresco'),
    garnish:L('Optional dehydrated carrot, beet, and pineapple','可选脱水胡萝卜、甜菜与菠萝','Carotte, betterave et ananas déshydratés, facultatifs','Optional getrocknete Karotte, Rote Bete und Ananas','Zanahoria, remolacha y piña deshidratadas, opcionales','선택 사항인 건조 당근, 비트, 파인애플','任意の乾燥ニンジン、ビーツ、パイナップル','Carota, barbabietola e ananas disidratati, facoltativi'),
  },
  {
    id:'singapore-sling-jigger-pony',cocktailId:'singapore-sling',topicId:'bar-jigger-pony-singapore',venue:'Jigger & Pony',countryCodes:['SG'],
    label:L('Jigger & Pony bar riff','Jigger & Pony 酒吧版本','Riff du bar Jigger & Pony','Bar-Riff von Jigger & Pony','Versión de bar de Jigger & Pony','지거 앤 포니 바 리프','ジガー＆ポニーのバーリフ','Riff del bar Jigger & Pony'),
    ingredients:[
      {ingredientId:'pineapple-lapsang-infused-gin',amount:1.5,unit:'oz',note:note('House gin infused with one pineapple and 0.75 g Lapsang Souchong per 750 ml London dry gin.','自制浸泡金酒：每 750 毫升伦敦干金酒加入 1 个菠萝与 0.75 克正山小种。','Gin maison infusé avec un ananas et 0,75 g de Lapsang Souchong pour 750 ml de London dry gin.','Haus-Gin mit einer Ananas und 0,75 g Lapsang Souchong je 750 ml London Dry Gin.','Ginebra de la casa infusionada con una piña y 0,75 g de Lapsang Souchong por 750 ml de London dry gin.','런던 드라이 진 750ml당 파인애플 1개와 랍상 수숑 0.75g을 인퓨징한 하우스 진.','ロンドンドライジン750mlにパイナップル1個とラプサンスーチョン0.75gを漬けた自家製ジン。','Gin della casa infuso con un ananas e 0,75 g di Lapsang Souchong per 750 ml di London dry gin.')},
      {ingredientId:'cherry-brandy',amount:.5,unit:'oz',brandId:'brand-cherry-heering',note:note('Cherry Heering, as specified by the source.','来源指定 Cherry Heering。','Cherry Heering, comme indiqué par la source.','Cherry Heering laut Quelle.','Cherry Heering, según la fuente.','출처가 지정한 Cherry Heering.','出典指定のCherry Heering。','Cherry Heering, come indicato dalla fonte.')},
      {ingredientId:'lime-juice',amount:.5,unit:'oz'},{ingredientId:'rhubarb-puree',amount:.75,unit:'oz'},
      {ingredientId:'soda-water',amount:null,unit:'top',note:note('Top with soda; the source gives no quantity.','加苏打至满；来源未给用量。','Compléter de soda ; quantité non publiée.','Mit Soda auffüllen; Menge nicht angegeben.','Completar con soda; cantidad no publicada.','소다로 채우며 양은 공개되지 않았습니다.','ソーダで満たす。量は不明。','Colmare con soda; quantità non pubblicata.')},
    ],
    steps:S(
      ['Shake the infused gin, Cherry Heering, lime juice, and rhubarb purée with ice.','Strain into an ice-filled highball, top with soda, stir briefly, and garnish.'],
      ['浸泡金酒、Cherry Heering、青柠汁与大黄泥加冰摇匀。','滤入装冰高球杯，补苏打，短暂搅拌后装饰。'],
      ['Shaker le gin infusé, le Cherry Heering, le citron vert et la purée de rhubarbe avec glace.','Filtrer dans un highball rempli de glace, compléter de soda, remuer brièvement et garnir.'],
      ['Infundierten Gin, Cherry Heering, Limettensaft und Rhabarberpüree mit Eis shaken.','In ein eisgefülltes Highballglas abseihen, Soda auffüllen, kurz rühren und garnieren.'],
      ['Agita con hielo la ginebra infusionada, Cherry Heering, lima y puré de ruibarbo.','Cuela en un highball con hielo, completa con soda, remueve brevemente y decora.'],
      ['인퓨즈드 진, 체리 히어링, 라임 주스와 루바브 퓌레를 얼음과 흔듭니다.','얼음 채운 하이볼에 거르고 소다를 채운 뒤 짧게 저어 장식합니다.'],
      ['インフューズドジン、チェリーヒーリング、ライムジュース、ルバーブピューレを氷とシェイクする。','氷入りハイボールにこし、ソーダを注ぎ、軽く混ぜて飾る。'],
      ['Shakerare con ghiaccio gin infuso, Cherry Heering, lime e purea di rabarbaro.','Filtrare in un highball con ghiaccio, colmare con soda, mescolare brevemente e guarnire.'],
    ),
    originalSteps:['Shake everything except soda with ice.','Strain into an ice-filled highball, top with soda, stir briefly, and garnish.'],
    methods:[{method:'shake',stepIndexes:[0]},{method:'build',stepIndexes:[1]}],
    glass:L('Ice-filled highball','装冰高球杯','Highball rempli de glace','Highballglas mit Eis','Highball con hielo','얼음 채운 하이볼','氷入りハイボール','Highball con ghiaccio'),
    garnish:L('Cherry, orange slice, and mint sprig','樱桃、橙片与薄荷枝','Cerise, tranche d’orange et brin de menthe','Kirsche, Orangenscheibe und Minzzweig','Cereza, rodaja de naranja y rama de menta','체리, 오렌지 슬라이스, 민트 가지','チェリー、オレンジスライス、ミントの枝','Ciliegia, fetta d’arancia e rametto di menta'),
  },
  {
    id:'left-hand',cocktailId:'left-hand',topicId:'bar-milk-honey-attaboy-new-york',venue:'Milk & Honey / Attaboy',countryCodes:['US'],
    label:L('Milk & Honey / Attaboy public recipe','Milk & Honey / Attaboy 公开配方','Recette publique Milk & Honey / Attaboy','Öffentliches Rezept von Milk & Honey / Attaboy','Receta pública de Milk & Honey / Attaboy','밀크 앤 허니 / 애터보이 공개 레시피','Milk & Honey / Attaboy公開レシピ','Ricetta pubblica Milk & Honey / Attaboy'),
    ingredients:[
      {ingredientId:'bourbon-whiskey',amount:1.5,unit:'oz'},{ingredientId:'sweet-red-vermouth',amount:.75,unit:'oz'},
      {ingredientId:'campari',amount:.75,unit:'oz',brandId:'brand-campari'},
      {ingredientId:'cocoa-bitters',amount:2,unit:'dash',note:note('Mole chocolate bitters; the source does not specify a brand.','Mole 巧克力苦精；来源未指定品牌。','Bitters chocolat mole ; aucune marque précisée.','Mole-Schokoladenbitters; keine Marke genannt.','Bitters de chocolate mole; sin marca indicada.','몰레 초콜릿 비터스이며 브랜드는 지정되지 않았습니다.','モレ・チョコレートビターズ。ブランド指定なし。','Bitter mole al cioccolato; nessuna marca specificata.')},
    ],
    steps:S(
      ['Stir all ingredients with ice.','Strain into a chilled coupe and garnish with a cherry.'],
      ['所有材料加冰搅拌。','滤入冰镇碟形杯，以樱桃装饰。'],
      ['Remuer tous les ingrédients avec glace.','Filtrer dans une coupe froide et garnir d’une cerise.'],
      ['Alle Zutaten mit Eis rühren.','In eine gekühlte Coupette abseihen und mit einer Kirsche garnieren.'],
      ['Remueve todos los ingredientes con hielo.','Cuela en una coupe fría y adorna con una cereza.'],
      ['모든 재료를 얼음과 젓습니다.','차가운 쿠페에 거르고 체리로 장식합니다.'],
      ['全材料を氷とステアする。','冷やしたクープにこし、チェリーを飾る。'],
      ['Mescolare tutti gli ingredienti con ghiaccio.','Filtrare in una coppa fredda e guarnire con una ciliegia.'],
    ),
    originalSteps:['Stir all ingredients with ice.','Strain into a chilled coupe and garnish with a cherry.'],
    methods:[{method:'stir',stepIndexes:[0]}],
    glass:L('Chilled coupe','冰镇碟形杯','Coupe froide','Gekühlte Coupette','Coupe fría','차가운 쿠페','冷やしたクープ','Coppa fredda'),
    garnish:L('Cherry','樱桃','Cerise','Kirsche','Cereza','체리','チェリー','Ciliegia'),
  },
  {
    id:'maggie-smith',cocktailId:'maggie-smith',topicId:'bar-death-co-new-york',venue:'Death & Co',countryCodes:['US'],year:2009,
    label:L('Death & Co official recipe','Death & Co 官方配方','Recette officielle de Death & Co','Offizielles Rezept von Death & Co','Receta oficial de Death & Co','데스 앤 코 공식 레시피','Death & Co公式レシピ','Ricetta ufficiale di Death & Co'),
    ingredients:[
      {ingredientId:'pisco',amount:1,unit:'oz',note:note('Campo de Encanto acholado pisco, as specified by the source.','来源指定 Campo de Encanto Acholado 皮斯科。','Pisco acholado Campo de Encanto, comme indiqué par la source.','Campo de Encanto Acholado Pisco laut Quelle.','Pisco acholado Campo de Encanto, según la fuente.','출처가 지정한 Campo de Encanto 아촐라도 피스코.','出典指定のCampo de Encantoアチョラード・ピスコ。','Pisco acholado Campo de Encanto, come indicato dalla fonte.')},
      {ingredientId:'white-rum',amount:1,unit:'oz',note:note('Banks 5-Island white rum, as specified by the source.','来源指定 Banks 5-Island 白朗姆。','Rhum blanc Banks 5-Island, comme indiqué par la source.','Banks 5-Island White Rum laut Quelle.','Ron blanco Banks 5-Island, según la fuente.','출처가 지정한 Banks 5-Island 화이트 럼.','出典指定のBanks 5-Islandホワイトラム。','Rum bianco Banks 5-Island, come indicato dalla fonte.')},
      {ingredientId:'orange-liqueur',amount:.5,unit:'oz',note:note('Santa Teresa orange liqueur, as specified by the source.','来源指定 Santa Teresa 橙味利口酒。','Liqueur d’orange Santa Teresa, comme indiqué par la source.','Santa Teresa Orangenlikör laut Quelle.','Licor de naranja Santa Teresa, según la fuente.','출처가 지정한 Santa Teresa 오렌지 리큐어.','出典指定のSanta Teresaオレンジリキュール。','Liquore all’arancia Santa Teresa, come indicato dalla fonte.')},
      {ingredientId:'lime-juice',amount:.75,unit:'oz'},{ingredientId:'orgeat',amount:.25,unit:'oz'},
      {ingredientId:'honey-syrup',amount:1,unit:'tsp',note:note('Two parts wildflower honey to one part hot water; whether measured by mass or volume is not stated.','野花蜂蜜 2 份兑热水 1 份；未说明按质量还是体积计量。','Deux parts de miel de fleurs pour une d’eau chaude ; masse ou volume non précisé.','Zwei Teile Wildblütenhonig auf einen Teil heißes Wasser; Gewicht oder Volumen nicht angegeben.','Dos partes de miel de flores por una de agua caliente; no se indica peso o volumen.','야생화 꿀 2 대 뜨거운 물 1이며 중량과 부피 중 무엇인지 명시되지 않았습니다.','ワイルドフラワーハニー2に熱湯1。重量比か容量比かは不明。','Due parti di miele millefiori e una di acqua calda; peso o volume non specificato.')},
    ],
    steps:S(
      ['Shake all ingredients with ice.','Double-strain into a chilled coupe and finish with an orange peel.'],
      ['所有材料加冰摇匀。','双重过滤入冰镇碟形杯，以橙皮装饰。'],
      ['Shaker tous les ingrédients avec glace.','Filtrer deux fois dans une coupe froide et finir avec un zeste d’orange.'],
      ['Alle Zutaten mit Eis shaken.','Doppelt in eine gekühlte Coupette abseihen und mit Orangenzeste abschließen.'],
      ['Agita todos los ingredientes con hielo.','Cuela doble en una coupe fría y termina con piel de naranja.'],
      ['모든 재료를 얼음과 흔듭니다.','차가운 쿠페에 더블 스트레인하고 오렌지 필로 마무리합니다.'],
      ['全材料を氷とシェイクする。','冷やしたクープへダブルストレインし、オレンジピールで仕上げる。'],
      ['Shakerare tutti gli ingredienti con ghiaccio.','Filtrare due volte in una coppa fredda e finire con scorza d’arancia.'],
    ),
    originalSteps:['Shake all ingredients with ice.','Double-strain into a chilled coupe and garnish with an orange peel.'],
    methods:[{method:'shake',stepIndexes:[0]}],
    glass:L('Chilled coupe','冰镇碟形杯','Coupe froide','Gekühlte Coupette','Coupe fría','차가운 쿠페','冷やしたクープ','Coppa fredda'),
    garnish:L('Orange peel; the original lime wheel remains a source-listed alternative','橙皮；最初使用的青柠轮片仍是来源列出的替代装饰','Zeste d’orange ; la rondelle de citron vert d’origine reste une alternative citée','Orangenzeste; das ursprüngliche Limettenrad bleibt eine von der Quelle genannte Alternative','Piel de naranja; la rueda de lima original sigue como alternativa citada','오렌지 필. 원래 라임 휠도 출처에 대안으로 남아 있습니다','オレンジピール。元のライムホイールも出典記載の別案','Scorza d’arancia; la ruota di lime originale resta un’alternativa citata'),
  },
  {
    id:'trasatlantico-fizz',cocktailId:'trasatlantico-fizz',topicId:'bar-floreria-atlantico-buenos-aires',venue:'Florería Atlántico',countryCodes:['AR'],year:2013,
    label:L('Florería Atlántico public recipe','Florería Atlántico 公开配方','Recette publique de Florería Atlántico','Öffentliches Rezept von Florería Atlántico','Receta pública de Florería Atlántico','플로레리아 아틀란티코 공개 레시피','フロレリア・アトランティコ公開レシピ','Ricetta pubblica di Florería Atlántico'),
    ingredients:[
      {ingredientId:'gin',amount:1.25,unit:'oz'},{ingredientId:'manzanilla-sherry',amount:.5,unit:'oz'},
      {ingredientId:'grand-marnier',amount:.5,unit:'oz',brandId:'brand-grand-marnier'},
      {ingredientId:'grapefruit-juice',amount:.5,unit:'oz'},{ingredientId:'food-tangerine-juice',amount:.5,unit:'oz',note:note('Fresh tangerine juice.','鲜橘汁。','Jus de mandarine frais.','Frischer Mandarinensaft.','Zumo de mandarina fresco.','생 탠저린 주스.','フレッシュタンジェリンジュース。','Succo fresco di mandarino.')},
      {ingredientId:'egg-white',amount:.5,unit:'oz',note:note('Fresh egg white; the source permits pasteurized egg white.','鲜蛋清；来源允许使用巴氏杀菌蛋清。','Blanc d’œuf frais ; la source permet un blanc pasteurisé.','Frisches Eiweiß; pasteurisiertes Eiweiß ist laut Quelle erlaubt.','Clara fresca; la fuente permite clara pasteurizada.','생 달걀흰자이며 출처는 저온살균 흰자도 허용합니다.','生卵白。出典は殺菌済み卵白も可としています。','Albume fresco; la fonte consente albume pastorizzato.')},
      {ingredientId:'lemon-juice',amount:1/3,unit:'oz'},
      {ingredientId:'simple-syrup',amount:1/3,unit:'oz',note:note('The source does not state the syrup ratio.','来源未说明糖浆比例。','La source ne précise pas le ratio du sirop.','Die Quelle nennt das Sirupverhältnis nicht.','La fuente no indica la proporción del almíbar.','출처는 시럽 비율을 밝히지 않습니다.','シロップの比率は不明。','La fonte non indica il rapporto dello sciroppo.')},
      {ingredientId:'soda-water',amount:null,unit:'top',note:note('Club soda to top; quantity not stated.','苏打水加满；未说明用量。','Club soda pour compléter ; quantité non indiquée.','Club Soda zum Auffüllen; Menge nicht angegeben.','Club soda para completar; cantidad no indicada.','클럽 소다로 채우며 양은 명시되지 않았습니다.','クラブソーダで満たす。量は不明。','Club soda per colmare; quantità non indicata.')},
      {ingredientId:'scotch-whisky',amount:null,unit:'spray',note:note('A spritz of peated Scotch; identity and quantity are not disclosed.','喷少量泥煤苏格兰威士忌；未公开具体酒款与用量。','Une pulvérisation de Scotch tourbé ; identité et quantité non publiées.','Ein Sprühstoß torfiger Scotch; Identität und Menge nicht veröffentlicht.','Una pulverización de Scotch ahumado; identidad y cantidad no publicadas.','피티드 스카치 스프리츠이며 제품과 양은 공개되지 않았습니다.','ピーテッドスコッチをひと吹き。銘柄と量は非公開。','Una spruzzata di Scotch torbato; identità e quantità non pubblicate.')},
    ],
    steps:S(
      ['Dry-shake the measured gin, sherry, orange liqueur, citrus juices, egg white, and syrup for 10 seconds. Add ice and shake for another 10 seconds.','Strain over ice into a short highball, top with soda, then add the orange wedge and peated-Scotch spritz.'],
      ['将量取的金酒、雪莉、橙味利口酒、柑橘汁、蛋清与糖浆干摇 10 秒；加冰再摇 10 秒。','滤入装冰的短高球杯，补苏打，再加入橙角与泥煤苏格兰威士忌喷雾。'],
      ['Shaker à sec 10 secondes le gin, le xérès, la liqueur d’orange, les jus d’agrumes, le blanc d’œuf et le sirop mesurés. Ajouter de la glace et shaker encore 10 secondes.','Filtrer sur glace dans un highball court, compléter de soda, puis ajouter le quartier d’orange et la pulvérisation de Scotch tourbé.'],
      ['Abgemessenen Gin, Sherry, Orangenlikör, Zitrussäfte, Eiweiß und Sirup 10 Sekunden trocken shaken. Eis zugeben und weitere 10 Sekunden shaken.','Über Eis in ein kurzes Highballglas abseihen, Soda auffüllen und Orangenspalte sowie torfigen Scotch-Sprühstoß zugeben.'],
      ['Agita en seco 10 segundos la ginebra, el jerez, el licor de naranja, los zumos cítricos, la clara y el almíbar medidos. Añade hielo y agita otros 10 segundos.','Cuela sobre hielo en un highball corto, completa con soda y añade la cuña de naranja y la bruma de Scotch ahumado.'],
      ['계량한 진, 셰리, 오렌지 리큐어, 시트러스 주스, 달걀흰자와 시럽을 10초 드라이 셰이크합니다. 얼음을 넣고 10초 더 흔듭니다.','얼음 든 짧은 하이볼에 거르고 소다를 채운 뒤 오렌지 웨지와 피티드 스카치 스프리츠를 더합니다.'],
      ['計量したジン、シェリー、オレンジリキュール、柑橘果汁、卵白、シロップを10秒ドライシェイクし、氷を加えてさらに10秒シェイクする。','氷入りのショートハイボールにこし、ソーダを注ぎ、オレンジウェッジとピーテッドスコッチのスプレーを加える。'],
      ['Shakerare a secco per 10 secondi gin, sherry, liquore all’arancia, succhi di agrumi, albume e sciroppo misurati. Aggiungere ghiaccio e shakerare altri 10 secondi.','Filtrare su ghiaccio in un highball corto, colmare con soda, poi aggiungere spicchio d’arancia e spruzzo di Scotch torbato.'],
    ),
    originalSteps:['Dry-shake the measured gin, sherry, orange liqueur, citrus juices, egg white, and syrup for 10 seconds; add ice and shake another 10 seconds.','Strain over ice into a short highball, top with soda, and add the orange wedge and peated-Scotch spritz.'],
    methods:[{method:'shake',stepIndexes:[0]},{method:'build',stepIndexes:[1]}],
    glass:L('Short highball over ice','装冰短高球杯','Highball court sur glace','Kurzes Highballglas mit Eis','Highball corto con hielo','얼음 든 짧은 하이볼','氷入りショートハイボール','Highball corto con ghiaccio'),
    garnish:L('Orange wedge and peated-Scotch spritz','橙角与泥煤苏格兰威士忌喷雾','Quartier d’orange et pulvérisation de Scotch tourbé','Orangenspalte und Sprühstoß torfiger Scotch','Cuña de naranja y bruma de Scotch ahumado','오렌지 웨지와 피티드 스카치 스프리츠','オレンジウェッジとピーテッドスコッチのスプレー','Spicchio d’arancia e spruzzo di Scotch torbato'),
  },
  {
    id:'belafonte-spritz',cocktailId:'belafonte-spritz',topicId:'bar-this-must-be-the-place-sydney',venue:'This Must Be the Place',countryCodes:['AU'],
    label:L('This Must Be the Place public recipe','This Must Be the Place 公开配方','Recette publique de This Must Be the Place','Öffentliches Rezept von This Must Be the Place','Receta pública de This Must Be the Place','디스 머스트 비 더 플레이스 공개 레시피','This Must Be the Place公開レシピ','Ricetta pubblica di This Must Be the Place'),
    ingredients:[
      {ingredientId:'gin',amount:.5,unit:'oz'},
      {ingredientId:'simple-syrup',amount:.5,unit:'oz',note:note('One-to-one simple syrup.','1:1 糖浆。','Sirop simple un pour un.','Zuckersirup im Verhältnis eins zu eins.','Almíbar simple uno a uno.','1:1 심플 시럽.','1対1のシンプルシロップ。','Sciroppo semplice uno a uno.')},
      {ingredientId:'fino-sherry',amount:2/3,unit:'oz'},{ingredientId:'lemon-juice',amount:2/3,unit:'oz'},
      {ingredientId:'prosecco',amount:2.5,unit:'oz',note:note('Chilled Prosecco.','冰镇 Prosecco。','Prosecco frais.','Gekühlter Prosecco.','Prosecco frío.','차가운 프로세코.','冷やしたプロセッコ。','Prosecco freddo.')},
    ],
    steps:S(
      ['Combine all measured ingredients directly in an ice-filled wine glass.','Add a fresh basil sprig. The source does not say whether to stir the finished drink.'],
      ['所有定量材料直接倒入装冰葡萄酒杯。','加入新鲜罗勒枝；来源未说明成杯是否搅拌。'],
      ['Verser tous les ingrédients mesurés directement dans un verre à vin rempli de glace.','Ajouter un brin de basilic frais. La source ne précise pas si le verre est remué.'],
      ['Alle abgemessenen Zutaten direkt in ein mit Eis gefülltes Weinglas geben.','Einen frischen Basilikumzweig zugeben. Ob gerührt wird, sagt die Quelle nicht.'],
      ['Combina todos los ingredientes medidos directamente en una copa de vino con hielo.','Añade una rama de albahaca fresca. La fuente no indica si se remueve.'],
      ['계량한 모든 재료를 얼음 채운 와인 잔에 바로 넣습니다.','신선한 바질 가지를 더합니다. 완성 후 저어 주는지는 출처에 없습니다.'],
      ['計量した全材料を氷入りワイングラスに直接入れる。','生のバジルを添える。完成後に混ぜるかは出典に記載なし。'],
      ['Unire tutti gli ingredienti misurati direttamente in un calice da vino con ghiaccio.','Aggiungere un rametto di basilico fresco. La fonte non dice se mescolare.'],
    ),
    originalSteps:['Combine all measured ingredients directly in an ice-filled wine glass.','Add a fresh basil sprig; the source does not state whether to stir.'],
    methods:[{method:'build',stepIndexes:[0]}],
    glass:L('Ice-filled wine glass','装冰葡萄酒杯','Verre à vin rempli de glace','Weinglas mit Eis','Copa de vino con hielo','얼음 채운 와인 잔','氷入りワイングラス','Calice da vino con ghiaccio'),
    garnish:L('Fresh basil sprig','新鲜罗勒枝','Brin de basilic frais','Frischer Basilikumzweig','Rama de albahaca fresca','신선한 바질 가지','フレッシュバジル','Rametto di basilico fresco'),
  },
];

const profileById=new Map(profiles.map(profile=>[profile.id,profile]));
const barAddresses:Record<string,string>={
  'bar-connaught-london':'London, United Kingdom',
  'bar-coupette-london':'London, United Kingdom',
  'bar-limantour-mexico-city':'Mexico City, Mexico',
  'bar-jigger-pony-singapore':'Singapore',
  'bar-milk-honey-attaboy-new-york':'New York City, United States',
  'bar-death-co-new-york':'New York City, United States',
  'bar-floreria-atlantico-buenos-aires':'Buenos Aires, Argentina',
  'bar-this-must-be-the-place-sydney':'Sydney, Australia',
};
const versions:RecipeVersion[]=recipes.map(recipe=>{
  const profile=profileById.get(recipe.cocktailId);
  if(!profile&&recipe.cocktailId!=='singapore-sling')throw new Error('Missing Batch K profile: '+recipe.cocktailId);
  const fallback={flavours:['fruit','herbal'] as Flavour[],tastes:['sour','sweet','refreshing'] as Taste[],strength:'medium' as Strength,approachability:'balanced' as Approachability,
    description:L('Jigger & Pony’s Singapore Sling riff combines pineapple-tea gin, cherry, lime, rhubarb, and soda.','Jigger & Pony 的新加坡司令变奏结合菠萝茶浸金酒、樱桃、青柠、大黄与苏打。','Le riff Singapore Sling de Jigger & Pony associe gin ananas-thé, cerise, citron vert, rhubarbe et soda.','Jigger & Ponys Singapore-Sling-Riff verbindet Ananas-Tee-Gin, Kirsche, Limette, Rhabarber und Soda.','El riff Singapore Sling de Jigger & Pony combina ginebra de piña y té, cereza, lima, ruibarbo y soda.','지거 앤 포니의 싱가포르 슬링 리프는 파인애플 티 진, 체리, 라임, 루바브와 소다를 조합합니다.','ジガー＆ポニーのシンガポールスリング・リフは、パイナップルティージン、チェリー、ライム、ルバーブ、ソーダを合わせます。','Il riff Singapore Sling di Jigger & Pony unisce gin all’ananas e tè, ciliegia, lime, rabarbaro e soda.')};
  const data=profile??fallback;
  const sourceId='bar-k-'+recipe.id;
  return {
    id:recipe.id+'-bar-k',cocktailId:recipe.cocktailId,label:recipe.label,sourceId,servings:1,
    origin:{kind:'bar',topicId:recipe.topicId,countryCodes:recipe.countryCodes,...(recipe.year?{year:recipe.year}:{}),venue:recipe.venue},
    ingredients:recipe.ingredients,steps:recipe.steps,originalLanguage:'en',originalSteps:recipe.originalSteps,
    mixingMethods:recipe.methods.map(method=>({...method,sourceId,reviewedAt:checkedAt})),
    glass:recipe.glass,garnish:recipe.garnish,flavours:data.flavours,tastes:data.tastes,strength:data.strength,
    approachability:data.approachability,profileBasis:'editorial',profileNote:data.description,
    sourceChecked:true,translationStatus:'draft',
    bar:{name:recipe.venue,address:barAddresses[recipe.topicId]??recipe.countryCodes.join(', ')},
  };
});

const cocktails:Cocktail[]=profiles.map(profile=>({
  id:profile.id,name:profile.name,aliases:profile.aliases??[],category:'curated',description:profile.description,
  versionIds:[profile.id+'-bar-k'],defaultVersionId:profile.id+'-bar-k',accent:profile.accent,
}));

export const batchK:CatalogueBatch={cocktails,versions,sources,ingredients,brands:[]};
export default batchK;
