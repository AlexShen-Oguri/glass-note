import type {Localized} from '../../domain/contracts';
import type {ResearchMaterialOverlay, ResearchPreparationOverlay, ResearchWorkOverlay} from './research';

const L = (en: string, zh: string, fr: string, de: string, es: string, ko: string, ja: string, it: string): Localized => ({en, zh, fr, de, es, ko, ja, it});
const same = (value: string): Localized => L(value, value, value, value, value, value, value, value);
const material = (name: Localized | string, amount: Localized | string): ResearchMaterialOverlay => ({
  name: typeof name === 'string' ? same(name) : name,
  amount: typeof amount === 'string' ? same(amount) : amount,
});
const preparation = (id: string, name: Localized, ingredients: ResearchMaterialOverlay[], method: Localized[]): ResearchPreparationOverlay => ({id, name, ingredients, method});

const ingredient = {
  honey: L('Honey', '蜂蜜', 'Miel', 'Honig', 'Miel', '꿀', 'はちみつ', 'Miele'),
  lemon: L('Lemon juice', '柠檬汁', 'Jus de citron', 'Zitronensaft', 'Zumo de limón', '레몬 주스', 'レモンジュース', 'Succo di limone'),
  lime: L('Lime juice', '青柠汁', 'Jus de citron vert', 'Limettensaft', 'Zumo de lima', '라임 주스', 'ライムジュース', 'Succo di lime'),
  limeZest: L('Lime zest', '青柠皮', 'Zeste de citron vert', 'Limettenzeste', 'Ralladura de lima', '라임 제스트', 'ライムの皮', 'Scorza di lime'),
  oliveOil: L('Olive oil', '橄榄油', 'Huile d’olive', 'Olivenöl', 'Aceite de oliva', '올리브 오일', 'オリーブオイル', 'Olio d’oliva'),
  eggWhite: L('Egg white', '蛋清', 'Blanc d’œuf', 'Eiweiß', 'Clara de huevo', '달걀흰자', '卵白', 'Albume'),
  eggYolk: L('Egg yolk', '蛋黄', 'Jaune d’œuf', 'Eigelb', 'Yema de huevo', '달걀노른자', '卵黄', 'Tuorlo'),
  thyme: L('Thyme', '百里香', 'Thym', 'Thymian', 'Tomillo', '타임', 'タイム', 'Timo'),
  pollen: L('Bee pollen', '蜂花粉', 'Pollen d’abeille', 'Bienenpollen', 'Polen de abeja', '벌 화분', 'ビーポーレン', 'Polline d’api'),
  fino: L('Fino sherry', 'Fino 雪莉酒', 'Xérès fino', 'Fino-Sherry', 'Jerez fino', '피노 셰리', 'フィノシェリー', 'Sherry fino'),
  whey: L('Whey', '乳清', 'Petit-lait', 'Molke', 'Suero de leche', '유청', 'ホエイ', 'Siero di latte'),
  marigold: L("Whole Marigold flowers (source term; species unspecified)", "完整 Marigold 花（来源名称；植物种未注明）", "Fleurs entières de « Marigold » (terme de la source ; espèce non précisée)", "Ganze „Marigold“-Blüten (Quellenbegriff; Art nicht angegeben)", "Flores enteras de «Marigold» (término original; especie no indicada)", "Marigold 꽃 전체(원문 명칭, 종 미지정)", "Marigoldの花全体（原文名称、種は未記載）", "Fiori interi di «Marigold» (termine della fonte; specie non precisata)"),
  pineapple: L('Pineapple juice', '菠萝汁', 'Jus d’ananas', 'Ananassaft', 'Zumo de piña', '파인애플 주스', 'パイナップルジュース', 'Succo d’ananas'),
  vanillaSyrup: L('Vanilla syrup', '香草糖浆', 'Sirop de vanille', 'Vanillesirup', 'Jarabe de vainilla', '바닐라 시럽', 'バニラシロップ', 'Sciroppo di vaniglia'),
  mead: L('Mead', '蜂蜜酒', 'Hydromel', 'Met', 'Hidromiel', '미드', 'ミード', 'Idromele'),
  manzanilla: L('Manzanilla sherry', 'Manzanilla 雪莉酒', 'Xérès manzanilla', 'Manzanilla-Sherry', 'Jerez manzanilla', '만사니야 셰리', 'マンサニージャシェリー', 'Sherry manzanilla'),
  greenTea: L('Green tea', '绿茶', 'Thé vert', 'Grüner Tee', 'Té verde', '녹차', '緑茶', 'Tè verde'),
  pineapplePuree: L('Pineapple purée', '菠萝果泥', 'Purée d’ananas', 'Ananaspüree', 'Puré de piña', '파인애플 퓌레', 'パイナップルピューレ', 'Purea d’ananas'),
  water: L('Water', '水', 'Eau', 'Wasser', 'Agua', '물', '水', 'Acqua'),
  sugar: L('Sugar', '糖', 'Sucre', 'Zucker', 'Azúcar', '설탕', '砂糖', 'Zucchero'),
  whiteSugar: L('White sugar', '白糖', 'Sucre blanc', 'Weißer Zucker', 'Azúcar blanco', '백설탕', '白砂糖', 'Zucchero bianco'),
  fineGranulatedWhiteSugar: L('Fine granulated white sugar', '细颗粒白砂糖', 'Sucre blanc granulé fin', 'Feiner weißer Kristallzucker', 'Azúcar blanco granulado fino', '고운 과립 백설탕', '細かい白いグラニュー糖', 'Zucchero bianco granulato fine'),
  granulatedWhiteSugar: L('Granulated white sugar', '颗粒白砂糖', 'Sucre blanc granulé', 'Weißer Kristallzucker', 'Azúcar blanco granulado', '과립 백설탕', '白いグラニュー糖', 'Zucchero bianco granulato'),
  blackSugar: L('Black sugar', '黑糖', 'Sucre noir', 'Schwarzer Zucker', 'Azúcar negro', '흑설탕', '黒糖', 'Zucchero nero'),
  ginger: L('Ginger', '生姜', 'Gingembre', 'Ingwer', 'Jengibre', '생강', '生姜', 'Zenzero'),
  cardamom: L('Cardamom', '小豆蔻', 'Cardamome', 'Kardamom', 'Cardamomo', '카다멈', 'カルダモン', 'Cardamomo'),
  spruce: L('Albertan spruce tips', '艾伯塔云杉嫩枝', 'Pousses d’épicéa de l’Alberta', 'Fichtentriebe aus Alberta', 'Brotes de pícea de Alberta', '앨버타 가문비나무 새순', 'アルバータのトウヒの新芽', 'Germogli di abete rosso dell’Alberta'),
  salt: L('Salt', '盐', 'Sel', 'Salz', 'Sal', '소금', '塩', 'Sale'),
  szechuanPepper: L('Dried whole Szechuan peppercorns', '干燥完整花椒粒', 'Grains entiers de poivre du Sichuan séchés', 'Getrocknete ganze Szechuanpfefferkörner', 'Granos enteros secos de pimienta de Sichuan', '말린 쓰촨 후추 알갱이(통알)', '乾燥させた丸ごとの花椒', 'Grani interi essiccati di pepe di Sichuan'),
  whitePepper: L('Whole white peppercorns', '完整白胡椒粒', 'Grains entiers de poivre blanc', 'Ganze weiße Pfefferkörner', 'Granos enteros de pimienta blanca', '백후추 알갱이(통알)', 'ホール白胡椒', 'Grani interi di pepe bianco'),
  citricAcid: L('Citric acid', '柠檬酸', 'Acide citrique', 'Zitronensäure', 'Ácido cítrico', '구연산', 'クエン酸', 'Acido citrico'),
  blueColour: L('Blue food colouring', '蓝色食用色素', 'Colorant alimentaire bleu', 'Blaue Lebensmittelfarbe', 'Colorante alimentario azul', '파란 식용 색소', '青い食用色素', 'Colorante alimentare blu'),
  sake: L('Sake', '清酒', 'Saké', 'Sake', 'Sake', '사케', '日本酒', 'Sakè'),
  simpleSyrup: L('Simple syrup', '糖浆', 'Sirop simple', 'Zuckersirup', 'Jarabe simple', '심플 시럽', 'シュガーシロップ', 'Sciroppo semplice'),
  driedFern: L('Dried maidenhair fern (source term; species unspecified)', '干燥 maidenhair fern（来源名称；植物种未注明）', '« maidenhair fern » séchée (terme de la source ; espèce non précisée)', 'Getrockneter „maidenhair fern“ (Quellenbegriff; Art nicht angegeben)', '«maidenhair fern» seco (término original; especie no indicada)', '말린 maidenhair fern(원문 명칭, 종 미지정)', '乾燥maidenhair fern（原文名称、種は未記載）', '«maidenhair fern» essiccato (termine della fonte; specie non precisata)'),
  orangeBlossom: L('Orange blossom water', '橙花水', 'Eau de fleur d’oranger', 'Orangenblütenwasser', 'Agua de azahar', '오렌지 꽃수', 'オレンジフラワーウォーター', 'Acqua di fiori d’arancio'),
  bergamotOil: L('Bergamot oil', '佛手柑油', 'Huile de bergamote', 'Bergamotteöl', 'Aceite de bergamota', '베르가모트 오일', 'ベルガモットオイル', 'Olio di bergamotto'),
  smokedSalt: L('Smoked fleur de sel', '烟熏盐之花', 'Fleur de sel fumée', 'Geräucherte Fleur de Sel', 'Flor de sal ahumada', '훈연 플뢰르 드 셀', 'スモークしたフルール・ド・セル', 'Fleur de sel affumicato'),
  pinkPepper: L('Pink peppercorns', '粉红胡椒粒', 'Baies roses', 'Rosa Pfefferkörner', 'Pimienta rosa en grano', '핑크 페퍼콘', 'ピンクペッパー', 'Pepe rosa in grani'),
  papaya: L('Papaya juice', '木瓜汁', 'Jus de papaye', 'Papayasaft', 'Zumo de papaya', '파파야 주스', 'パパイヤジュース', 'Succo di papaya'),
  pineapplePeel: L('Organic pineapple peel', '有机菠萝皮', 'Peau d’ananas biologique', 'Bio-Ananasschale', 'Cáscara de piña ecológica', '유기농 파인애플 껍질', '有機パイナップルの皮', 'Buccia d’ananas biologico'),
  keyLime: L('Key lime juice', 'Key lime 青柠汁', 'Jus de lime des Keys', 'Saft von Key-Limetten', 'Zumo de lima de los Cayos', '키 라임 주스', 'キーライムジュース', 'Succo di lime dei Keys'),
  guava: L('Guava juice', '番石榴汁', 'Jus de goyave', 'Guavensaft', 'Zumo de guayaba', '구아바 주스', 'グアバジュース', 'Succo di guava'),
  orgeat: L('Orgeat syrup', '杏仁糖浆', 'Sirop d’orgeat', 'Mandelsirup', 'Jarabe de orgeat', '오르제 시럽', 'オルジェーシロップ', 'Sciroppo d’orzata'),
  apple: L('Pressed apple juice', '压榨苹果汁', 'Jus de pomme pressé', 'Gepresster Apfelsaft', 'Zumo de manzana prensado', '압착 사과 주스', '搾ったアップルジュース', 'Succo di mela spremuto'),
  creamSoda: L('Cream soda', '奶油苏打水', 'Soda à la crème', 'Cream Soda', 'Refresco de crema', '크림 소다', 'クリームソーダ', 'Soda alla crema'),
  whisky: L('Scotch whisky', '苏格兰威士忌', 'Whisky écossais', 'Scotch Whisky', 'Whisky escocés', '스카치 위스키', 'スコッチウイスキー', 'Whisky scozzese'),
  madeira: L('Madeira wine', '马德拉酒', 'Vin de Madère', 'Madeirawein', 'Vino de Madeira', '마데이라 와인', 'マデイラワイン', 'Vino di Madeira'),
  blackCherries: L('Black cherries', '黑樱桃', 'Cerises noires', 'Schwarze Kirschen', 'Cerezas negras', '블랙 체리', 'ブラックチェリー', 'Ciliegie nere'),
  sesame: L('Toasted sesame seeds', '烘烤芝麻', 'Graines de sésame grillées', 'Geröstete Sesamsamen', 'Semillas de sésamo tostadas', '볶은 참깨', '炒りゴマ', 'Semi di sesamo tostati'),
  treacle: L('Treacle', '糖蜜', 'Mélasse', 'Zuckersirupmelasse', 'Melaza', '당밀', 'トリークル', 'Melassa'),
  citrus: L('Lemon or lime juice', '柠檬汁或青柠汁', 'Jus de citron ou de citron vert', 'Zitronen- oder Limettensaft', 'Zumo de limón o de lima', '레몬 또는 라임 주스', 'レモンまたはライムジュース', 'Succo di limone o lime'),
  pineappleSyrup: L('Pineapple syrup', '菠萝糖浆', 'Sirop d’ananas', 'Ananassirup', 'Jarabe de piña', '파인애플 시럽', 'パイナップルシロップ', 'Sciroppo d’ananas'),
  coffeeLiqueur: L('Coffee liqueur', '咖啡利口酒', 'Liqueur de café', 'Kaffeelikör', 'Licor de café', '커피 리큐어', 'コーヒーリキュール', 'Liquore al caffè'),
  aromaticBitters: L('Angostura aromatic bitters', 'Angostura 芳香苦精', 'Bitters aromatiques Angostura', 'Angostura Aromatic Bitters', 'Amargos aromáticos Angostura', 'Angostura 아로마틱 비터스', 'Angosturaアロマティックビターズ', 'Bitter aromatici Angostura'),
  orangeBitters: L('Angostura orange bitters', 'Angostura 橙味苦精', 'Bitters à l’orange Angostura', 'Angostura Orange Bitters', 'Amargos de naranja Angostura', 'Angostura 오렌지 비터스', 'Angosturaオレンジビターズ', 'Bitter all’arancia Angostura'),
  seaSalt: L('Sea salt', '海盐', 'Sel marin', 'Meersalz', 'Sal marina', '바다 소금', '海塩', 'Sale marino'),
  agedMadeira: L('Aged Madeira', '陈年马德拉酒', 'Madère vieilli', 'Gereifter Madeira', 'Madeira envejecido', '숙성 마데이라', '熟成マデイラ', 'Madeira invecchiato'),
  freshCherries: L('Fresh black cherries', '新鲜黑樱桃', 'Cerises noires fraîches', 'Frische schwarze Kirschen', 'Cerezas negras frescas', '신선한 블랙 체리', 'フレッシュブラックチェリー', 'Ciliegie nere fresche'),
  mozart: L('Mozart Dark chocolate liqueur', 'Mozart Dark 巧克力利口酒', 'Liqueur de chocolat Mozart Dark', 'Mozart Dark Schokoladenlikör', 'Licor de chocolate Mozart Dark', 'Mozart Dark 초콜릿 리큐어', 'Mozart Darkチョコレートリキュール', 'Liquore al cioccolato Mozart Dark'),
  freshCitrus: L('Fresh lemon or lime juice', '新鲜柠檬汁或青柠汁', 'Jus de citron ou de citron vert frais', 'Frischer Zitronen- oder Limettensaft', 'Zumo de limón o lima fresco', '신선한 레몬 또는 라임 주스', 'フレッシュレモンまたはライムジュース', 'Succo fresco di limone o lime'),
  freshPineapple: L('Fresh pineapple juice', '新鲜菠萝汁', 'Jus d’ananas frais', 'Frischer Ananassaft', 'Zumo de piña fresco', '신선한 파인애플 주스', 'フレッシュパイナップルジュース', 'Succo d’ananas fresco'),
  freshLemon: L('Fresh lemon juice', '新鲜柠檬汁', 'Jus de citron frais', 'Frischer Zitronensaft', 'Zumo de limón fresco', '신선한 레몬 주스', 'フレッシュレモンジュース', 'Succo di limone fresco'),
};

const component = {
  eternalYouth: L('Eternal Youth mixture', 'Eternal Youth 混合液', 'Mélange Eternal Youth', 'Eternal-Youth-Mischung', 'Mezcla Eternal Youth', 'Eternal Youth 혼합물', 'Eternal Youthミックス', 'Miscela Eternal Youth'),
  pollenSpray: L('Bee-pollen-infused Patrón Reposado', '蜂花粉浸泡的 Patrón Reposado', 'Patrón Reposado infusé au pollen d’abeille', 'Mit Bienenpollen infundierter Patrón Reposado', 'Patrón Reposado infusionado con polen de abeja', '벌 화분을 인퓨즈한 Patrón Reposado', 'ビーポーレンをインフューズしたPatrón Reposado', 'Patrón Reposado infuso al polline d’api'),
  marigoldTincture: L("Marigold tincture", "Marigold 花酊剂", "Teinture de fleurs « Marigold »", "„Marigold“-Blütentinktur", "Tintura de flores «Marigold»", "Marigold 꽃 팅크", "Marigoldの花のティンクチャー", "Tintura di fiori «Marigold»"),
  tepache: L('Tepache syrup', 'Tepache 糖浆', 'Sirop de tepache', 'Tepache-Sirup', 'Jarabe de tepache', '테파체 시럽', 'テパチェシロップ', 'Sciroppo di tepache'),
  oleo: L('Szechuan pepper and lime oleo saccharum', '花椒青柠皮油糖液', 'Oleo saccharum de poivre du Sichuan et citron vert', 'Oleo Saccharum aus Szechuanpfeffer und Limette', 'Oleo saccharum de pimienta de Sichuan y lima', '쓰촨 후추·라임 올레오 사카럼', '花椒とライムのオレオサッカラム', 'Oleo saccharum di pepe di Sichuan e lime'),
  blueCitronge: L('Blue Citrónge', '蓝色 Citrónge', 'Citrónge bleu', 'Blauer Citrónge', 'Citrónge azul', '블루 Citrónge', 'ブルーCitrónge', 'Citrónge blu'),
  capillaire: L('Sirop capillaire', '蕨叶橙花糖浆', 'Sirop capillaire', 'Farn-Orangenblüten-Sirup', 'Jarabe capilar de helecho', '양치식물·오렌지 꽃 시럽', 'シダとオレンジの花のシロップ', 'Sciroppo capillare'),
  bergamot: L('Bergamot essence', '佛手柑香精', 'Essence de bergamote', 'Bergamotteessenz', 'Esencia de bergamota', '베르가모트 에센스', 'ベルガモットエッセンス', 'Essenza di bergamotto'),
  pepperTequila: L('Pink-peppercorn-infused Patrón Silver', '粉红胡椒浸泡的 Patrón Silver', 'Patrón Silver infusé aux baies roses', 'Mit rosa Pfeffer infundierter Patrón Silver', 'Patrón Silver infusionado con pimienta rosa', '핑크 페퍼콘을 인퓨즈한 Patrón Silver', 'ピンクペッパーをインフューズしたPatrón Silver', 'Patrón Silver infuso al pepe rosa'),
  fermentedPapaya: L('Fermented papaya juice', '发酵木瓜汁', 'Jus de papaye fermenté', 'Fermentierter Papayasaft', 'Zumo de papaya fermentado', '발효 파파야 주스', '発酵パパイヤジュース', 'Succo di papaya fermentato'),
  guavaCordial: L('Guava cordial', '番石榴糖液', 'Cordial de goyave', 'Guaven-Cordial', 'Cordial de guayaba', '구아바 코디얼', 'グアバコーディアル', 'Cordial di guava'),
};

const quantity = {
  egg: L('1 egg', '1 个鸡蛋', '1 œuf', '1 Ei', '1 huevo', '달걀 1개', '卵1個分', '1 uovo'),
  pinch: L('1 pinch', '1 撮', '1 pincée', '1 Prise', '1 pizca', '1꼬집', '1つまみ', '1 pizzico'),
  barSpoon: L('1 bar spoon', '1 吧匙', '1 cuillère de bar', '1 Barlöffel', '1 cuchara de bar', '1 바 스푼', 'バースプーン1杯', '1 cucchiaino da bar'),
  quarterBarSpoon: L('0.25 bar spoon', '0.25 吧匙', '0.25 cuillère de bar', '0.25 Barlöffel', '0.25 cuchara de bar', '0.25 바 스푼', 'バースプーン0.25杯', '0.25 cucchiaino da bar'),
  teaspoon: L('1 tsp', '1 tsp（茶匙）', '1 tsp (c. à café)', '1 tsp (TL)', '1 tsp (cucharadita)', '1 tsp (티스푼)', '1 tsp（小さじ）', '1 tsp (cucchiaino)'),
  twoTeaspoons: L('2 tsp', '2 tsp（茶匙）', '2 tsp (c. à café)', '2 tsp (TL)', '2 tsp (cucharaditas)', '2 tsp (티스푼)', '2 tsp（小さじ）', '2 tsp (cucchiaini)'),
  flatTeaspoon: L('1 flat tsp', '1 平 tsp（茶匙）', '1 tsp rase (c. à café)', '1 gestrichener tsp (TL)', '1 tsp rasa (cucharadita)', '깎아서 1 tsp (티스푼)', 'すり切り1 tsp（小さじ）', '1 tsp raso (cucchiaino)'),
  tablespoon: L('1 tbsp', '1 tbsp（汤匙）', '1 tbsp (c. à soupe)', '1 tbsp (EL)', '1 tbsp (cucharada)', '1 tbsp (테이블스푼)', '1 tbsp（大さじ）', '1 tbsp (cucchiaio)'),
  twoTablespoons: L('2 tbsp', '2 tbsp（汤匙）', '2 tbsp (c. à soupe)', '2 tbsp (EL)', '2 tbsp (cucharadas)', '2 tbsp (테이블스푼)', '2 tbsp（大さじ）', '2 tbsp (cucchiai)'),
  fourTablespoons: L('4 tbsp', '4 tbsp（汤匙）', '4 tbsp (c. à soupe)', '4 tbsp (EL)', '4 tbsp (cucharadas)', '4 tbsp (테이블스푼)', '4 tbsp（大さじ）', '4 tbsp (cucchiai)'),
  halfTeaspoon: L('0.5 tsp', '0.5 tsp（茶匙）', '0.5 tsp (c. à café)', '0.5 tsp (TL)', '0.5 tsp (cucharadita)', '0.5 tsp (티스푼)', '0.5 tsp（小さじ）', '0.5 tsp (cucchiaino)'),
  fiveDashes: L('5 dashes', '5 dash', '5 traits', '5 Spritzer', '5 golpes', '5대시', '5ダッシュ', '5 dash'),
  sixDashes: L('6 dashes', '6 dash', '6 traits', '6 Spritzer', '6 golpes', '6대시', '6ダッシュ', '6 dash'),
  twoDashes: L('2 dashes', '2 dash', '2 traits', '2 Spritzer', '2 golpes', '2대시', '2ダッシュ', '2 dash'),
};

const region = {
  spain: L('Spain', '西班牙', 'Espagne', 'Spanien', 'España', '스페인', 'スペイン', 'Spagna'),
  southAfrica: L('South Africa', '南非', 'Afrique du Sud', 'Südafrika', 'Sudáfrica', '남아프리카공화국', '南アフリカ', 'Sudafrica'),
  japan: L('Japan', '日本', 'Japon', 'Japan', 'Japón', '일본', '日本', 'Giappone'),
  canada: L('Canada', '加拿大', 'Canada', 'Kanada', 'Canadá', '캐나다', 'カナダ', 'Canada'),
  unitedKingdom: L('United Kingdom', '英国', 'Royaume-Uni', 'Vereinigtes Königreich', 'Reino Unido', '영국', 'イギリス', 'Regno Unito'),
  mexico: L('Mexico', '墨西哥', 'Mexique', 'Mexiko', 'México', '멕시코', 'メキシコ', 'Messico'),
  australia: L('Australia', '澳大利亚', 'Australie', 'Australien', 'Australia', '호주', 'オーストラリア', 'Australia'),
  greece: L('Greece', '希腊', 'Grèce', 'Griechenland', 'Grecia', '그리스', 'ギリシャ', 'Grecia'),
  unitedStates: L('United States', '美国', 'États-Unis', 'Vereinigte Staaten', 'Estados Unidos', '미국', 'アメリカ合衆国', 'Stati Uniti'),
  newZealand: L('New Zealand', '新西兰', 'Nouvelle-Zélande', 'Neuseeland', 'Nueva Zelanda', '뉴질랜드', 'ニュージーランド', 'Nuova Zelanda'),
  europe: L('Europe', '欧洲', 'Europe', 'Europa', 'Europa', '유럽', 'ヨーロッパ', 'Europa'),
};

const patronStage = L('2018 global finalist', '2018 全球决赛入围者', 'Finaliste mondial 2018', 'Globaler Finalist 2018', 'Finalista mundial de 2018', '2018년 글로벌 결선 진출자', '2018年世界大会ファイナリスト', 'Finalista mondiale 2018');
const angosturaStage = (year: number): Localized => L(`Global winner recipe · ${year}`, `全球冠军作品 · ${year}`, `Recette du vainqueur mondial · ${year}`, `Rezept des globalen Siegers · ${year}`, `Receta del ganador mundial · ${year}`, `글로벌 우승 레시피 · ${year}`, `世界大会優勝者のレシピ · ${year}`, `Ricetta del vincitore mondiale · ${year}`);

export const competitionRecipeLocalization: Record<string, ResearchWorkOverlay> = {
  'patron-2018-wind': {
    region: region.spain,
    stage: patronStage,
    materials: [
      material('Patrón Silver', '60 ml'),
      material(component.eternalYouth, '60 ml'),
      material(ingredient.fino, '15 ml'),
      material(ingredient.eggWhite, '15 ml'),
      material(ingredient.thyme, L('3 branches', '3 枝', '3 branches', '3 Zweige', '3 ramas', '3가지', '3枝', '3 rametti')),
      material(component.pollenSpray, L('3 sprays', '喷洒 3 次', '3 pulvérisations', '3 Sprühstöße', '3 pulverizaciones', '3회 분사', '3回噴霧', '3 spruzzi')),
    ],
    method: [
      L('Shake all ingredients with ice until chilled and combined.', '将所有材料加冰摇匀，至冷却并混合均匀。', 'Shaker tous les ingrédients avec de la glace jusqu’à refroidissement et mélange homogène.', 'Alle Zutaten mit Eis shaken, bis sie gekühlt und vermischt sind.', 'Agitar todos los ingredientes con hielo hasta enfriar y mezclar.', '모든 재료를 얼음과 함께 차가워지고 잘 섞일 때까지 셰이크한다.', '全材料を氷とともに、冷えて混ざるまでシェイクする。', 'Shakerare tutti gli ingredienti con ghiaccio finché sono freddi e amalgamati.'),
      L('Double-strain into a chilled coupe.', '双重过滤入冰镇碟形杯。', 'Filtrer deux fois dans une coupe refroidie.', 'Doppelt in eine gekühlte Coupette abseihen.', 'Colar dos veces en una copa coupé fría.', '차갑게 한 쿠페 글라스에 더블 스트레인한다.', '冷やしたクープにダブルストレインする。', 'Filtrare due volte in una coppetta raffreddata.'),
      L('Finish with a fresh thyme sprig.', '以一枝新鲜百里香收尾。', 'Terminer avec un brin de thym frais.', 'Mit einem frischen Thymianzweig abschließen.', 'Terminar con una ramita de tomillo fresco.', '신선한 타임 한 가지로 마무리한다.', 'フレッシュタイムの枝を飾って仕上げる。', 'Finire con un rametto di timo fresco.'),
    ],
    preparations: [
      preparation('eternal-youth-mixture', component.eternalYouth, [
        material(ingredient.honey, '2 oz'), material(ingredient.lemon, '2 oz'), material(ingredient.oliveOil, '1.25 oz'),
      ], [
        L('Blend the honey, lemon juice and olive oil together.', '将蜂蜜、柠檬汁与橄榄油一起搅打均匀。', 'Mixer ensemble le miel, le jus de citron et l’huile d’olive.', 'Honig, Zitronensaft und Olivenöl zusammen mixen.', 'Batir la miel, el zumo de limón y el aceite de oliva juntos.', '꿀, 레몬 주스와 올리브 오일을 함께 블렌딩한다.', 'はちみつ、レモンジュース、オリーブオイルを一緒にブレンドする。', 'Frullare insieme miele, succo di limone e olio d’oliva.'),
      ]),
      preparation('pollen-reposado-spray', component.pollenSpray, [
        material(ingredient.pollen, '10 g'), material('Patrón Reposado', '3.5 oz'),
      ], [
        L('Soak the bee pollen in the Reposado for 1 hour.', '将蜂花粉浸泡于 Reposado 中 1 小时。', 'Faire macérer le pollen d’abeille dans le Reposado pendant 1 heure.', 'Den Bienenpollen 1 Stunde im Reposado ziehen lassen.', 'Macerar el polen de abeja en el Reposado durante 1 hora.', '벌 화분을 Reposado에 1시간 담가 둔다.', 'ビーポーレンをReposadoに1時間浸す。', 'Lasciare il polline d’api nel Reposado per 1 ora.'),
        L('Filter and transfer to a spray bottle.', '过滤后装入喷雾瓶。', 'Filtrer et transférer dans un flacon pulvérisateur.', 'Filtern und in eine Sprühflasche füllen.', 'Filtrar y pasar a un pulverizador.', '거른 뒤 스프레이 병에 담는다.', 'ろ過してスプレーボトルに移す。', 'Filtrare e trasferire in un flacone spray.'),
      ]),
    ],
    summary: L('The official recipe includes both custom preparations. It gives no shaking time or measured garnish dose.', '官方配方公开两项自制材料；未注明摇和时间或装饰的定量。', 'La recette officielle fournit les deux préparations maison, sans durée de shaker ni dose mesurée de garniture.', 'Das offizielle Rezept enthält beide eigenen Zubereitungen; Shakedauer und genaue Garniturmenge fehlen.', 'La receta oficial incluye ambas preparaciones propias; no indica tiempo de agitado ni una dosis medida de decoración.', '공식 레시피는 두 가지 자체 제조법을 제공하며, 셰이크 시간과 정확한 가니시 분량은 명시하지 않습니다.', '公式レシピは二つの自家製材料の調製法を示しています。シェイク時間と飾りの定量は記載されていません。', 'La ricetta ufficiale include entrambe le preparazioni; non indica il tempo di shakerata né una dose misurata della guarnizione.'),
  },
  'patron-2018-harmony': {
    region: region.southAfrica,
    stage: patronStage,
    materials: [
      material('Patrón Añejo', '52.5 ml'), material(ingredient.whey, '22.5 ml'), material(component.marigoldTincture, '15 ml'),
      material('Italicus', '15 ml'), material(ingredient.pineapple, '15 ml'), material(ingredient.lemon, '15 ml'),
      material(ingredient.vanillaSyrup, '15 ml'), material('Galliano L’Aperitivo', '7.5 ml'), material(ingredient.pollen, quantity.quarterBarSpoon),
    ],
    method: [
      L('Shake the listed ingredients with ice for at least 10 seconds.', '将所列材料加冰摇匀至少 10 秒。', 'Shaker les ingrédients indiqués avec de la glace pendant au moins 10 secondes.', 'Die aufgeführten Zutaten mit Eis mindestens 10 Sekunden shaken.', 'Agitar los ingredientes indicados con hielo durante al menos 10 segundos.', '표시된 재료를 얼음과 함께 최소 10초간 셰이크한다.', '記載の材料を氷とともに10秒以上シェイクする。', 'Shakerare gli ingredienti elencati con ghiaccio per almeno 10 secondi.'),
      L("Double-strain into a stemless wine glass; garnish with dried Marigold flowers and a sprinkle of bee pollen.", "双重过滤入无脚葡萄酒杯，以干燥 Marigold 花和少量蜂花粉装饰。", "Filtrer deux fois dans un verre à vin sans pied ; garnir de fleurs séchées « Marigold » et d’un peu de pollen d’abeille.", "Doppelt in ein stielloses Weinglas abseihen; mit getrockneten „Marigold“-Blüten und etwas Bienenpollen garnieren.", "Colar dos veces en una copa de vino sin tallo; decorar con flores secas «Marigold» y un poco de polen de abeja.", "스템리스 와인 글라스에 더블 스트레인하고 말린 Marigold 꽃과 소량의 벌 화분으로 가니시한다.", "脚のないワイングラスにダブルストレインし、乾燥したMarigoldの花と少量のビーポーレンを飾る。", "Filtrare due volte in un bicchiere da vino senza stelo; guarnire con fiori secchi «Marigold» e un poco di polline d’api."),
    ],
    preparations: [
      preparation('marigold-tincture', component.marigoldTincture, [
        material(ingredient.marigold, L('4 flowers', '4 朵', '4 fleurs', '4 Blüten', '4 flores', '꽃 4송이', '4輪', '4 fiori')), material('Patrón Añejo', '3 oz'),
      ], [
        L("Steep 4 whole Marigold flowers in the Añejo for 24 hours; the source does not specify the flower species.", "将 4 朵完整 Marigold 花浸泡于 Añejo 中 24 小时；来源未注明植物种。", "Faire macérer 4 fleurs entières « Marigold » dans l’Añejo pendant 24 heures ; l’espèce n’est pas précisée.", "4 ganze „Marigold“-Blüten 24 Stunden im Añejo ziehen lassen; die Pflanzenart ist nicht angegeben.", "Macerar 4 flores enteras «Marigold» en el Añejo durante 24 horas; no se indica la especie.", "Marigold 꽃 4송이를 통째로 Añejo에 24시간 담가 둔다. 원문은 꽃의 종을 지정하지 않는다.", "Marigoldの花4輪を丸ごとAñejoに24時間浸す。花の種は原文に記載されていない。", "Lasciare 4 fiori interi «Marigold» nell’Añejo per 24 ore; la specie non è precisata."),
      ]),
    ],
    summary: L("The source publishes the Marigold tincture without specifying its flower species. Vanilla syrup has no specified brand or extra formula; garnish quantities are unspecified.", "来源公开 Marigold 花酊剂，但未注明植物种。香草糖浆未指定品牌或额外公式；装饰用量未定量。", "La source publie la teinture de fleurs « Marigold » sans préciser l’espèce. Le sirop de vanille n’a ni marque ni formule supplémentaire ; les quantités de garniture ne sont pas précisées.", "Die Quelle veröffentlicht die „Marigold“-Blütentinktur ohne Pflanzenart. Für Vanillesirup fehlen Marke und weitere Rezeptur; Garniturmengen sind nicht angegeben.", "La fuente publica la tintura de «Marigold» sin precisar la especie. El jarabe de vainilla no tiene marca ni fórmula adicional; las cantidades de decoración no se indican.", "원문은 꽃의 종을 지정하지 않고 Marigold 팅크를 공개합니다. 바닐라 시럽은 브랜드나 추가 제조법이 없으며 가니시 분량도 미지정입니다.", "出典は花の種を指定せずにMarigoldのティンクチャーを公開しています。バニラシロップのブランドや追加の配合、飾りの量は未記載です。", "La fonte pubblica la tintura di «Marigold» senza precisare la specie. Lo sciroppo di vaniglia non ha marca né formula aggiuntiva; le quantità di guarnizione non sono indicate."),
  },
  'patron-2018-best-promise': {
    region: region.japan,
    stage: patronStage,
    materials: [
      material('Patrón Reposado', '60 ml'), material(ingredient.mead, '15 ml'), material(ingredient.manzanilla, '15 ml'),
      material(component.tepache, '7.5 ml'), material(ingredient.lime, '7.5 ml'), material(ingredient.greenTea, quantity.twoTeaspoons),
    ],
    method: [
      L('Whisk the ingredients together in a tea bowl, then transfer to a shaker with ice and shake.', '在茶碗中将材料搅打混合，再倒入装冰的摇壶摇匀。', 'Fouetter les ingrédients dans un bol à thé, puis transférer dans un shaker avec de la glace et shaker.', 'Die Zutaten in einer Teeschale verquirlen, dann in einen Shaker mit Eis geben und shaken.', 'Batir los ingredientes en un cuenco de té, pasarlos a una coctelera con hielo y agitar.', '차 사발에서 재료를 휘저어 섞은 뒤 얼음이 든 셰이커에 옮겨 셰이크한다.', '茶碗で材料を泡立て器で混ぜ、氷を入れたシェイカーに移してシェイクする。', 'Sbattere gli ingredienti in una ciotola da tè, trasferire in uno shaker con ghiaccio e shakerare.'),
      L('Strain into a paper glass and garnish with a pineapple leaf.', '过滤入纸杯，以菠萝叶装饰。', 'Filtrer dans un gobelet en papier et garnir d’une feuille d’ananas.', 'In einen Papierbecher abseihen und mit einem Ananasblatt garnieren.', 'Colar en un vaso de papel y decorar con una hoja de piña.', '종이컵에 스트레인하고 파인애플 잎으로 가니시한다.', '紙のカップにこし、パイナップルの葉を飾る。', 'Filtrare in un bicchiere di carta e guarnire con una foglia d’ananas.'),
    ],
    preparations: [
      preparation('tepache-syrup', component.tepache, [
        material(ingredient.pineapplePuree, '5.25 oz'), material(ingredient.water, '2.75 oz'),
        material(ingredient.blackSugar, L('0.75 cup', '0.75 杯', '0.75 tasse', '0.75 Tasse', '0.75 taza', '0.75컵', '0.75カップ', '0.75 tazza')),
        material(ingredient.whiteSugar, L('1 cup', '1 杯', '1 tasse', '1 Tasse', '1 taza', '1컵', '1カップ', '1 tazza')),
        material(ingredient.ginger, L('16 slices', '16 片', '16 tranches', '16 Scheiben', '16 rodajas', '16조각', '16枚', '16 fette')),
        material(ingredient.cardamom, L('30 pieces', '30 颗', '30 pièces', '30 Stück', '30 unidades', '30개', '30個', '30 pezzi')),
      ], [
        L('Combine the pineapple purée, water and both sugars; heat until the sugars dissolve.', '混合菠萝果泥、水和两种糖，加热至糖溶解。', 'Mélanger la purée d’ananas, l’eau et les deux sucres ; chauffer jusqu’à dissolution des sucres.', 'Ananaspüree, Wasser und beide Zuckersorten vermischen; erhitzen, bis der Zucker gelöst ist.', 'Mezclar el puré de piña, el agua y ambos azúcares; calentar hasta disolverlos.', '파인애플 퓌레, 물과 두 종류의 설탕을 섞고 설탕이 녹을 때까지 가열한다.', 'パイナップルピューレ、水、2種類の砂糖を合わせ、砂糖が溶けるまで加熱する。', 'Unire purea d’ananas, acqua ed entrambi gli zuccheri; scaldare finché si sciolgono.'),
        L('Add the ginger and cardamom, keep on low heat for 60 minutes, then strain.', '加入生姜和小豆蔻，小火保持 60 分钟后过滤。', 'Ajouter le gingembre et la cardamome, laisser à feu doux pendant 60 minutes, puis filtrer.', 'Ingwer und Kardamom zugeben, 60 Minuten bei niedriger Hitze halten und anschließend abseihen.', 'Añadir el jengibre y el cardamomo, mantener a fuego bajo durante 60 minutos y colar.', '생강과 카다멈을 넣고 약한 불로 60분 유지한 뒤 거른다.', '生姜とカルダモンを加え、弱火で60分加熱してからこす。', 'Aggiungere zenzero e cardamomo, mantenere a fuoco basso per 60 minuti e filtrare.'),
      ]),
    ],
    summary: L("The source calls for green tea without specifying its form. The tepache syrup is heated; no fermentation is inferred. Cup and spoon measures are retained without conversion.", "来源写作绿茶，未注明形态。Tepache 糖浆采用加热法，不推定发酵；杯量和匙量保留原文，不作换算。", "La source demande du thé vert sans préciser sa forme. Le sirop de tepache est chauffé, sans fermentation déduite. Les mesures en tasses et cuillères sont conservées sans conversion.", "Die Quelle nennt grünen Tee ohne Formangabe. Der Tepache-Sirup wird erhitzt; eine Fermentation wird nicht abgeleitet. Tassen- und Löffelmaße bleiben ohne Umrechnung erhalten.", "La fuente indica té verde sin precisar su forma. El jarabe de tepache se calienta, sin inferir fermentación. Las medidas en tazas y cucharas se conservan sin conversión.", "원문은 형태를 지정하지 않고 녹차를 사용합니다. 테파체 시럽은 가열하며 발효는 추정하지 않습니다. 컵과 스푼 단위는 환산하지 않고 유지합니다.", "原文は緑茶の形態を指定していません。テパチェシロップは加熱するため、発酵は推定していません。カップとスプーンの単位は換算せずに保持しています。", "La fonte indica tè verde senza precisarne la forma. Lo sciroppo di tepache viene scaldato; non si deduce una fermentazione. Le misure in tazze e cucchiai restano senza conversione."),
  },
  'patron-2018-cyanocitta': {
    region: region.canada,
    stage: patronStage,
    materials: [
      material('Patrón Silver', '37.5 ml'), material('Martini Extra Dry Vermouth', '15 ml'), material(component.oleo, '30 ml'),
      material(component.blueCitronge, '7.5 ml'), material(ingredient.lime, '7.5 ml'),
      material(ingredient.spruce, L('8 branches', '8 枝', '8 branches', '8 Zweige', '8 ramas', '8가지', '8枝', '8 rametti')),
      material(ingredient.salt, quantity.pinch),
    ],
    method: [
      L('Muddle 6 spruce branches, add the other ingredients and ice, and shake for 20 seconds.', '捣压 6 枝云杉，加入其余材料和冰，摇匀 20 秒。', 'Piler 6 branches d’épicéa, ajouter les autres ingrédients et la glace, puis shaker pendant 20 secondes.', '6 Fichtenzweige zerdrücken, die übrigen Zutaten und Eis zugeben und 20 Sekunden shaken.', 'Majar 6 ramas de pícea, añadir los demás ingredientes y hielo y agitar durante 20 segundos.', '가문비나무 가지 6개를 머들링하고 나머지 재료와 얼음을 넣어 20초간 셰이크한다.', 'トウヒの枝6本をマドルし、残りの材料と氷を加えて20秒シェイクする。', 'Pestare 6 rametti di abete rosso, aggiungere gli altri ingredienti e ghiaccio e shakerare per 20 secondi.'),
      L('Double-strain into a rocks glass over pebble ice; crushed ice is the source’s alternative.', '双重过滤入装有颗粒冰的岩石杯；来源也允许使用碎冰。', 'Filtrer deux fois dans un verre rocks sur de la glace en petits galets ; la source permet aussi la glace pilée.', 'Doppelt in ein Rocks-Glas über Pebble-Eis abseihen; die Quelle erlaubt auch zerstoßenes Eis.', 'Colar dos veces en un vaso rocks con hielo en pequeños trozos redondeados; la fuente permite hielo picado como alternativa.', '페블 아이스를 담은 록스 글라스에 더블 스트레인한다. 원문은 크러시드 아이스도 허용한다.', 'ペブルアイスを入れたロックグラスにダブルストレインする。原文ではクラッシュドアイスも選択肢としている。', 'Filtrare due volte in un bicchiere rocks con ghiaccio a piccoli ciottoli; la fonte ammette anche ghiaccio tritato.'),
      L('Garnish with the remaining 2 spruce branches; the source permits rosemary if spruce is unavailable.', '以剩余 2 枝云杉装饰；来源允许在没有云杉时使用迷迭香。', 'Garnir des 2 branches d’épicéa restantes ; la source autorise le romarin si l’épicéa manque.', 'Mit den übrigen 2 Fichtenzweigen garnieren; falls Fichte nicht verfügbar ist, erlaubt die Quelle Rosmarin.', 'Decorar con las 2 ramas de pícea restantes; la fuente permite romero si no se dispone de pícea.', '남은 가문비나무 가지 2개로 가니시한다. 원문은 가문비나무가 없으면 로즈메리를 허용한다.', '残りのトウヒの枝2本を飾る。原文ではトウヒが入手できない場合、ローズマリーを認めている。', 'Guarnire con i 2 rametti di abete rosso rimasti; la fonte ammette il rosmarino se l’abete rosso non è disponibile.'),
    ],
    preparations: [
      preparation('szechuan-lime-oleo', component.oleo, [
        material(ingredient.limeZest, L('zest of 12 limes', '12 个青柠的皮', 'zestes de 12 citrons verts', 'Schale von 12 Limetten', 'ralladura de 12 limas', '라임 12개의 제스트', 'ライム12個分の皮', 'scorza di 12 lime')),
        material(ingredient.szechuanPepper, quantity.fourTablespoons), material(ingredient.whitePepper, quantity.tablespoon),
        material(ingredient.citricAcid, quantity.halfTeaspoon), material(ingredient.fineGranulatedWhiteSugar, '300 g'),
        material(ingredient.lime, L('juice of 6 limes', '6 个青柠的汁', 'jus de 6 citrons verts', 'Saft von 6 Limetten', 'zumo de 6 limas', '라임 6개의 즙', 'ライム6個分の果汁', 'succo di 6 lime')),
      ], [
        L('Put the lime zest, both peppers and sugar in a bag and muddle together.', '将青柠皮、两种胡椒与糖装入袋中，一起捣压。', 'Mettre les zestes de citron vert, les deux poivres et le sucre dans un sac et piler ensemble.', 'Limettenzesten, beide Pfeffersorten und Zucker in einen Beutel geben und zusammen zerdrücken.', 'Poner la ralladura de lima, ambas pimientas y el azúcar en una bolsa y majar juntos.', '라임 제스트, 두 종류의 후추와 설탕을 봉투에 넣고 함께 머들링한다.', 'ライムの皮、2種類のコショウ、砂糖を袋に入れて一緒にマドルする。', 'Mettere scorza di lime, entrambi i pepi e zucchero in un sacchetto e pestare insieme.'),
        L('Seal the bag and place it in warm, non-boiling water until the sugar dissolves; the source allows up to 12 hours.', '密封袋子，放入温而不沸的水中至糖溶解；来源允许最长 12 小时。', 'Fermer le sac et le placer dans de l’eau tiède non bouillante jusqu’à dissolution du sucre ; la source prévoit jusqu’à 12 heures.', 'Den Beutel verschließen und in warmes, nicht kochendes Wasser legen, bis der Zucker gelöst ist; laut Quelle kann dies bis zu 12 Stunden dauern.', 'Sellar la bolsa y colocarla en agua tibia, sin hervir, hasta disolver el azúcar; la fuente permite hasta 12 horas.', '봉투를 밀봉하여 끓지 않는 따뜻한 물에 넣고 설탕을 녹인다. 원문은 최대 12시간을 허용한다.', '袋を密閉し、沸騰していない温水に砂糖が溶けるまで入れる。原文では最大12時間としている。', 'Sigillare il sacchetto e metterlo in acqua tiepida non bollente finché lo zucchero si scioglie; la fonte prevede fino a 12 ore.'),
        L('Fine-filter through cheesecloth, dissolve the citric acid and stir in the juice of 6 limes.', '用纱布细滤，溶解柠檬酸，再搅入 6 个青柠的汁。', 'Filtrer finement à travers une étamine, dissoudre l’acide citrique et incorporer le jus de 6 citrons verts.', 'Durch ein Käsetuch fein filtern, die Zitronensäure auflösen und den Saft von 6 Limetten einrühren.', 'Filtrar finamente con una gasa, disolver el ácido cítrico e incorporar el zumo de 6 limas.', '치즈클로스로 곱게 거르고 구연산을 녹인 뒤 라임 6개의 즙을 섞는다.', 'チーズクロスで細かくろ過し、クエン酸を溶かしてライム6個分の果汁を混ぜる。', 'Filtrare finemente con una garza, sciogliere l’acido citrico e incorporare il succo di 6 lime.'),
      ]),
      preparation('blue-citronge', component.blueCitronge, [
        material('Citrónge', '0.25 oz'), material(ingredient.blueColour, L('3 drops', '3 滴', '3 gouttes', '3 Tropfen', '3 gotas', '3방울', '3滴', '3 gocce')),
      ], [
        L('Blend the Citrónge with 3 drops of blue food colouring.', '将 Citrónge 与 3 滴蓝色食用色素混合均匀。', 'Mixer le Citrónge avec 3 gouttes de colorant alimentaire bleu.', 'Citrónge mit 3 Tropfen blauer Lebensmittelfarbe vermischen.', 'Mezclar el Citrónge con 3 gotas de colorante alimentario azul.', 'Citrónge와 파란 식용 색소 3방울을 섞는다.', 'Citróngeと青い食用色素3滴を混ぜる。', 'Mescolare il Citrónge con 3 gocce di colorante alimentare blu.'),
      ]),
    ],
    summary: L("The official recipe publishes both preparations and permits crushed ice and rosemary alternatives. The warm, non-boiling bath may take up to 12 hours; no precise temperature is given.", "官方公开两项制备，并允许碎冰和迷迭香替代。水浴要求温而不沸，最长可能需 12 小时；未给出精确温度。", "La recette officielle publie les deux préparations et permet la glace pilée et le romarin. Le bain tiède, non bouillant, peut durer jusqu’à 12 heures ; aucune température précise n’est donnée.", "Das offizielle Rezept veröffentlicht beide Zubereitungen und erlaubt zerstoßenes Eis und Rosmarin. Das warme, nicht kochende Wasserbad kann bis zu 12 Stunden dauern; eine genaue Temperatur fehlt.", "La receta oficial publica ambas preparaciones y permite hielo picado y romero. El baño tibio, sin hervir, puede durar hasta 12 horas; no indica una temperatura precisa.", "공식 레시피는 두 제조법과 크러시드 아이스·로즈메리 대안을 공개합니다. 중탕은 끓지 않는 따뜻한 물로 최대 12시간 걸릴 수 있으며 정확한 온도는 없습니다.", "公式レシピは二つの調製法とクラッシュドアイス・ローズマリーの代用を示しています。湯せんは沸騰しない温水で最大12時間かかる場合があり、正確な温度は未記載です。", "La ricetta ufficiale pubblica entrambe le preparazioni e ammette ghiaccio tritato e rosmarino. Il bagno tiepido, non bollente, può richiedere fino a 12 ore; non indica una temperatura precisa."),
  },
  'patron-2018-balancing-act': {
    region: L('United States · Chicago', '美国 · 芝加哥', 'États-Unis · Chicago', 'Vereinigte Staaten · Chicago', 'Estados Unidos · Chicago', '미국 · 시카고', 'アメリカ合衆国 · シカゴ', 'Stati Uniti · Chicago'),
    stage: patronStage,
    materials: [
      material('Patrón Reposado', '45 ml'), material('Kikusui Funaguchi Nama Genshu sake', '15 ml'), material('Rabarbaro', '15 ml'),
      material('Dolin Genepy de Alpes', '7.5 ml'), material(ingredient.lemon, '22.5 ml'), material(component.capillaire, '15 ml'), material(ingredient.eggWhite, quantity.egg),
    ],
    method: [
      L('Dry-shake the ingredients for 45 seconds.', '将材料无冰摇和 45 秒。', 'Shaker les ingrédients sans glace pendant 45 secondes.', 'Die Zutaten 45 Sekunden ohne Eis shaken.', 'Agitar los ingredientes sin hielo durante 45 segundos.', '재료를 얼음 없이 45초간 드라이 셰이크한다.', '材料を氷なしで45秒ドライシェイクする。', 'Shakerare gli ingredienti senza ghiaccio per 45 secondi.'),
      L("Add a 1.25-inch ice cube and shake again.", "加入一块边长 1.25 英寸的冰块，再次摇匀。", "Ajouter un glaçon de 1.25 pouce et shaker à nouveau.", "Einen Eiswürfel von 1.25 Zoll zugeben und erneut shaken.", "Añadir un cubo de hielo de 1.25 pulgadas y agitar de nuevo.", "1.25인치 각얼음 한 개를 넣고 다시 셰이크한다.", "1.25インチの角氷を一つ加え、再びシェイクする。", "Aggiungere un cubetto di ghiaccio da 1.25 pollici e shakerare di nuovo."),
      L("Strain into a chilled Collins glass; garnish with a shaped orange peel and a mist of bergamot essence.", "过滤入冰镇柯林杯，以修整成形的橙皮和佛手柑香精喷雾装饰。", "Filtrer dans un verre Collins refroidi ; garnir d’une écorce d’orange façonnée et d’une brume d’essence de bergamote.", "In ein gekühltes Collins-Glas abseihen; mit einer geformten Orangenschale und einem Sprühnebel Bergamotteessenz garnieren.", "Colar en un vaso Collins frío; decorar con piel de naranja recortada y una bruma de esencia de bergamota.", "차갑게 한 콜린스 글라스에 스트레인하고 모양을 다듬은 오렌지 껍질과 베르가모트 에센스 미스트로 가니시한다.", "冷やしたコリンズグラスにこし、形を整えたオレンジピールとベルガモットエッセンスのミストを添える。", "Filtrare in un bicchiere Collins raffreddato; guarnire con scorza d’arancia sagomata e una nebulizzazione di essenza di bergamotto."),
    ],
    preparations: [
      preparation('sirop-capillaire', component.capillaire, [
        material(ingredient.water, '32 oz'), material(ingredient.sugar, '32 oz'), material(ingredient.driedFern, '15 g'), material(ingredient.orangeBlossom, '3 g'),
      ], [
        L('Bring the water to a boil, remove from the heat, then add the sugar and dissolve it.', '将水煮沸，离火后加入糖并使其溶解。', 'Porter l’eau à ébullition, retirer du feu, puis ajouter le sucre et le dissoudre.', 'Das Wasser aufkochen, vom Herd nehmen, dann Zucker zugeben und auflösen.', 'Hervir el agua, retirar del fuego, añadir el azúcar y disolverlo.', '물을 끓여 불에서 내린 뒤 설탕을 넣어 녹인다.', '水を沸騰させて火から外し、砂糖を加えて溶かす。', 'Portare l’acqua a bollore, togliere dal fuoco, aggiungere lo zucchero e scioglierlo.'),
        L('Add the dried fern and steep for 45 minutes.', '加入干蕨叶，浸泡 45 分钟。', 'Ajouter la fougère séchée et laisser infuser 45 minutes.', 'Den getrockneten Farn zugeben und 45 Minuten ziehen lassen.', 'Añadir el helecho seco y dejar infusionar 45 minutos.', '말린 양치식물을 넣고 45분간 우린다.', '乾燥シダを加えて45分浸す。', 'Aggiungere la felce essiccata e lasciare in infusione per 45 minuti.'),
        L("Add the orange blossom water, then filter and bottle.", "加入橙花水，过滤后装瓶。", "Ajouter l’eau de fleur d’oranger, puis filtrer et mettre en bouteille.", "Orangenblütenwasser zugeben, dann filtern und abfüllen.", "Añadir el agua de azahar, filtrar y embotellar.", "오렌지 꽃수를 넣고 거른 뒤 병에 담는다.", "オレンジフラワーウォーターを加え、ろ過して瓶に詰める。", "Aggiungere l’acqua di fiori d’arancio, poi filtrare e imbottigliare."),
      ]),
      preparation('bergamot-essence', component.bergamot, [
        material('Patrón Reposado', '6.5 oz'), material(ingredient.bergamotOil, '0.3 oz'), material(ingredient.smokedSalt, '3.5 g'),
      ], [
        L('Mix the Reposado, bergamot oil and smoked fleur de sel together.', '将 Reposado、佛手柑油和烟熏盐之花混合。', 'Mélanger le Reposado, l’huile de bergamote et la fleur de sel fumée.', 'Reposado, Bergamotteöl und geräucherte Fleur de Sel vermischen.', 'Mezclar el Reposado, el aceite de bergamota y la flor de sal ahumada.', 'Reposado, 베르가모트 오일과 훈연 플뢰르 드 셀을 섞는다.', 'Reposado、ベルガモットオイル、スモークしたフルール・ド・セルを混ぜる。', 'Mescolare Reposado, olio di bergamotto e fleur de sel affumicato.'),
      ]),
    ],
    summary: L("Both preparations are published. Garnish mist dose, fern species and oil grade are unspecified. The source’s 32 oz water and 32 oz sugar retain an unstated weight/volume basis.", "两项制备均已公开。装饰喷雾用量、蕨类植物种和油品等级未注明；原文 32 oz 水与 32 oz 糖的重量／体积基准不明确。", "Les deux préparations sont publiées. Dose de brume, espèce de fougère et qualité de l’huile ne sont pas précisées. Les 32 oz d’eau et 32 oz de sucre gardent une base massique ou volumique indéfinie.", "Beide Zubereitungen sind veröffentlicht. Sprühmenge, Farnart und Ölqualität fehlen. Für 32 oz Wasser und 32 oz Zucker ist nicht angegeben, ob Gewicht oder Volumen gemeint ist.", "Se publican ambas preparaciones. No se indican dosis de bruma, especie de helecho ni grado del aceite. Las 32 oz de agua y 32 oz de azúcar mantienen una base de peso o volumen no definida.", "두 제조법이 공개되어 있습니다. 미스트 분량, 양치식물 종과 오일 등급은 없으며 물 32 oz와 설탕 32 oz의 중량·부피 기준도 미지정입니다.", "二つの調製法が公開されています。ミストの量、シダの種、油のグレードは未記載です。水32 ozと砂糖32 ozの重量・体積の基準も不明のまま保持しています。", "Entrambe le preparazioni sono pubblicate. Dose del nebulizzato, specie di felce e grado dell’olio non sono indicati. Le 32 oz d’acqua e 32 oz di zucchero mantengono una base di peso o volume non definita."),
  },
  'patron-2018-maestranza': {
    region: L('United States · Washington, D.C.', '美国 · 华盛顿特区', 'États-Unis · Washington, D.C.', 'Vereinigte Staaten · Washington, D.C.', 'Estados Unidos · Washington D. C.', '미국 · 워싱턴 D.C.', 'アメリカ合衆国 · ワシントンD.C.', 'Stati Uniti · Washington, D.C.'),
    stage: patronStage,
    materials: [
      material(component.pepperTequila, '45 ml'), material('Rubino Vermouth di Torino', '15 ml'), material(component.fermentedPapaya, '60 ml'),
      material(ingredient.keyLime, '22.5 ml'), material(component.guavaCordial, '15 ml'),
    ],
    method: [
      L('Shake everything except the fermented papaya juice with a large ice cube for 8–10 seconds.', '除发酵木瓜汁外，将所有材料与大冰块摇匀 8–10 秒。', 'Shaker tous les ingrédients sauf le jus de papaye fermenté avec un gros glaçon pendant 8–10 secondes.', 'Alles außer dem fermentierten Papayasaft mit einem großen Eiswürfel 8–10 Sekunden shaken.', 'Agitar todo salvo el zumo de papaya fermentado con un cubo de hielo grande durante 8–10 segundos.', '발효 파파야 주스를 제외한 재료를 큰 얼음과 함께 8–10초간 셰이크한다.', '発酵パパイヤジュース以外の材料を大きな氷とともに8～10秒シェイクする。', 'Shakerare tutto tranne il succo di papaya fermentato con un grosso cubetto di ghiaccio per 8–10 secondi.'),
      L('Double-strain into a double old-fashioned glass over a large ice cube.', '双重过滤入装有大冰块的大号古典杯。', 'Filtrer deux fois dans un grand verre old-fashioned sur un gros glaçon.', 'Doppelt in ein Double-Old-Fashioned-Glas über einen großen Eiswürfel abseihen.', 'Colar dos veces en un vaso double old-fashioned sobre un cubo de hielo grande.', '큰 얼음을 담은 더블 올드패션드 글라스에 더블 스트레인한다.', '大きな氷を入れたダブル・オールドファッションドグラスにダブルストレインする。', 'Filtrare due volte in un bicchiere double old-fashioned con un grosso cubetto di ghiaccio.'),
      L('Top with the fermented papaya juice and finish with ground pink peppercorn.', '补入发酵木瓜汁，以研磨粉红胡椒收尾。', 'Compléter de jus de papaye fermenté et terminer avec des baies roses moulues.', 'Mit fermentiertem Papayasaft auffüllen und mit gemahlenem rosa Pfeffer abschließen.', 'Completar con el zumo de papaya fermentado y terminar con pimienta rosa molida.', '발효 파파야 주스를 채우고 간 핑크 페퍼콘으로 마무리한다.', '発酵パパイヤジュースを注ぎ足し、挽いたピンクペッパーで仕上げる。', 'Colmare con succo di papaya fermentato e finire con pepe rosa macinato.'),
    ],
    preparations: [
      preparation('pink-peppercorn-tequila', component.pepperTequila, [material(ingredient.pinkPepper, quantity.tablespoon), material('Patrón Silver', '16 oz')], [
        L('Steep the pink peppercorns in the Silver for 48 hours, shaking periodically.', '将粉红胡椒浸泡于 Silver 中 48 小时，期间不时摇动。', 'Faire macérer les baies roses dans le Silver pendant 48 heures en secouant régulièrement.', 'Rosa Pfefferkörner 48 Stunden im Silver ziehen lassen und gelegentlich schütteln.', 'Macerar la pimienta rosa en el Silver durante 48 horas, agitando periódicamente.', '핑크 페퍼콘을 Silver에 48시간 담가 두고 주기적으로 흔든다.', 'ピンクペッパーをSilverに48時間浸し、時々振る。', 'Lasciare il pepe rosa nel Silver per 48 ore, agitando periodicamente.'),
        L("Filter out the peppercorns and rebottle.", "滤除胡椒粒后重新装瓶。", "Filtrer les baies roses et remettre en bouteille.", "Die Pfefferkörner herausfiltern und neu abfüllen.", "Filtrar los granos de pimienta y volver a embotellar.", "페퍼콘을 걸러 낸 뒤 다시 병에 담는다.", "ペッパーをろ過して取り除き、瓶に詰め直す。", "Filtrare i grani di pepe e imbottigliare di nuovo."),
      ]),
      preparation('fermented-papaya-juice', component.fermentedPapaya, [
        material(ingredient.papaya, L('juice of 2 papayas', '2 个木瓜的汁', 'jus de 2 papayes', 'Saft von 2 Papayas', 'zumo de 2 papayas', '파파야 2개의 즙', 'パパイヤ2個分の果汁', 'succo di 2 papaya')),
        material(ingredient.honey, quantity.twoTablespoons),
        material(ingredient.pineapplePeel, L('peel of 1 pineapple', '1 个菠萝的皮', 'peau de 1 ananas', 'Schale von 1 Ananas', 'cáscara de 1 piña', '파인애플 1개의 껍질', 'パイナップル1個分の皮', 'buccia di 1 ananas')),
      ], [
        L('The source records 3 days of fermentation for the papaya juice, honey and pineapple peel.', '原文记载木瓜汁、蜂蜜和菠萝皮混合后发酵 3 天。', 'La source indique 3 jours de fermentation pour le jus de papaye, le miel et la peau d’ananas.', 'Laut Quelle fermentieren Papayasaft, Honig und Ananasschale 3 Tage lang.', 'La fuente describe 3 días de fermentación del zumo de papaya con miel y cáscara de piña.', '원문에는 파파야 주스, 꿀, 파인애플 껍질을 섞어 3일간 발효했다고 기록되어 있다.', '原文ではパパイヤジュース、はちみつ、パイナップルの皮を合わせて3日間発酵させている。', 'La fonte riporta 3 giorni di fermentazione per il succo di papaya, il miele e la buccia d’ananas.'),
        L('The source describes filtering and holding the mixture in bottles for another 2 days. Fermentation pressure can rupture bottles.', '原文记载过滤装瓶后再放置 2 天。发酵产生的压力可能使瓶子爆裂。', 'La source décrit une filtration suivie de 2 jours en bouteille. La pression de la fermentation peut faire éclater les bouteilles.', 'Die Quelle beschreibt das Filtern und weitere 2 Tage in Flaschen. Durch den bei der Gärung entstehenden Druck können Flaschen platzen.', 'La fuente describe el filtrado y otros 2 días en botella. La presión de la fermentación puede hacer reventar las botellas.', '원문에는 거른 액체를 병에 담아 2일 더 두었다고 기록되어 있다. 발효 압력으로 병이 파열될 수 있다.', '原文には、ろ過して瓶に詰め、さらに2日間置くとある。発酵で生じる圧力により瓶が破裂するおそれがある。', 'La fonte descrive la filtrazione e altri 2 giorni in bottiglia. La pressione della fermentazione può far scoppiare le bottiglie.'),
        L('The source describes periodically opening bottles to release gas and gives no validated controls for safe bottling.', '原文提到定期排气，未提供经过验证的安全装瓶条件。', 'La source mentionne un dégazage périodique sans préciser de mesures validées pour un embouteillage sûr.', 'Die Quelle nennt regelmäßiges Entlüften und gibt keine geprüften Maßnahmen für eine sichere Abfüllung an.', 'La fuente menciona liberar el gas periódicamente sin indicar controles validados para un embotellado seguro.', '원문은 주기적인 가스 배출을 언급하지만, 안전한 병입을 위한 검증된 관리 조건은 제시하지 않는다.', '原文は定期的なガス抜きに言及しているが、安全な瓶詰めのための検証済みの管理条件は示していない。', 'La fonte menziona lo sfiato periodico senza indicare controlli validati per un imbottigliamento sicuro.'),
      ]),
      preparation('guava-cordial', component.guavaCordial, [
        material(ingredient.guava, L('4 parts', '4 份', '4 parts', '4 Teile', '4 partes', '4부분', '4部', '4 parti')),
        material(ingredient.granulatedWhiteSugar, L('3 parts', '3 份', '3 parts', '3 Teile', '3 partes', '3부분', '3部', '3 parti')),
      ], [
        L('Stir 4 parts guava juice with 3 parts sugar until the sugar dissolves.', '将 4 份番石榴汁与 3 份糖搅拌至糖溶解。', 'Remuer 4 parts de jus de goyave avec 3 parts de sucre jusqu’à dissolution du sucre.', '4 Teile Guavensaft mit 3 Teilen Zucker verrühren, bis der Zucker gelöst ist.', 'Remover 4 partes de zumo de guayaba con 3 partes de azúcar hasta disolverlo.', '구아바 주스 4부분과 설탕 3부분을 설탕이 녹을 때까지 젓는다.', 'グアバジュース4部と砂糖3部を、砂糖が溶けるまで混ぜる。', 'Mescolare 4 parti di succo di guava con 3 parti di zucchero finché lo zucchero si scioglie.'),
      ]),
    ],
    summary: L("The archive publishes all three preparations. Guava cordial retains the original parts because their measurement basis is unstated. Fermentation temperature and validated food-safety controls are not provided.", "档案公开三项制备。番石榴糖液保留原文份数，因为未注明计量基准；未提供发酵温度或经过验证的食品安全控制。", "L’archive publie les trois préparations. Le cordial conserve les parts originales dont la base de mesure est indéfinie. Température de fermentation et contrôles validés de sécurité alimentaire ne sont pas fournis.", "Das Archiv veröffentlicht alle drei Zubereitungen. Der Cordial behält die Originalteile ohne angegebene Messbasis. Fermentationstemperatur und validierte Kontrollen zur Lebensmittelsicherheit fehlen.", "El archivo publica las tres preparaciones. El cordial mantiene las partes originales sin base de medida indicada. No proporciona temperatura de fermentación ni controles validados de seguridad alimentaria.", "기록은 세 제조법을 공개합니다. 구아바 코디얼은 측정 기준이 없어 원문의 비율 단위를 유지합니다. 발효 온도와 검증된 식품 안전 관리 기준은 제공되지 않습니다.", "アーカイブは三つの調製法を公開しています。グアバコーディアルは計量基準が不明のため原文の部数を保持しています。発酵温度や検証済みの食品安全管理は示されていません。", "L’archivio pubblica tutte e tre le preparazioni. Il cordial conserva le parti originali senza base di misura indicata. Non fornisce temperatura di fermentazione né controlli validati di sicurezza alimentare."),
  },
  'angostura-2008-narrow-minded': {
    region: region.europe,
    stage: angosturaStage(2008),
    materials: [material(ingredient.aromaticBitters, quantity.fiveDashes), material(ingredient.orgeat, '15 ml'), material(ingredient.apple, '70 ml'), material(ingredient.creamSoda, '60 ml')],
    method: [
      L('Shake all four ingredients with ice.', '将全部四种材料加冰摇匀。', 'Shaker les quatre ingrédients avec de la glace.', 'Alle vier Zutaten mit Eis shaken.', 'Agitar los cuatro ingredientes con hielo.', '네 가지 재료를 모두 얼음과 함께 셰이크한다.', '4種類すべての材料を氷とともにシェイクする。', 'Shakerare tutti e quattro gli ingredienti con ghiaccio.'),
      L('Filter into a highball filled with cubed ice and finish with apple slices.', '过滤入装满方冰的高球杯，以苹果片收尾。', 'Filtrer dans un highball rempli de glaçons et terminer avec des tranches de pomme.', 'In ein mit Eiswürfeln gefülltes Highball-Glas abseihen und mit Apfelscheiben abschließen.', 'Colar en un vaso highball lleno de hielo en cubos y terminar con rodajas de manzana.', '각얼음을 채운 하이볼 글라스에 스트레인하고 사과 슬라이스로 마무리한다.', '角氷を満たしたハイボールグラスにこし、りんごのスライスで仕上げる。', 'Filtrare in un highball pieno di ghiaccio a cubetti e finire con fette di mela.'),
    ],
    summary: L('The published method shakes all four ingredients, including cream soda. The source does not establish that the serve is alcohol-free.', '公开手法将四种材料（包括奶油苏打水）一起摇匀；来源未认定该成品为无酒精饮品。', 'La méthode publiée shake les quatre ingrédients, y compris le soda à la crème. La source n’établit pas que le service soit sans alcool.', 'Die veröffentlichte Methode shakt alle vier Zutaten einschließlich Cream Soda. Die Quelle belegt keinen alkoholfreien Drink.', 'El método publicado agita los cuatro ingredientes, incluido el refresco de crema. La fuente no establece que el servicio sea sin alcohol.', '공개된 방법은 크림 소다를 포함한 네 재료를 모두 셰이크합니다. 원문은 무알코올 서브라고 명시하지 않습니다.', '公開された方法ではクリームソーダを含む4材料すべてをシェイクします。原文はノンアルコールのサーブとは確認していません。', 'Il metodo pubblicato shakera i quattro ingredienti, soda alla crema compresa. La fonte non stabilisce che il servizio sia analcolico.'),
  },
  'angostura-2011-scarlet-ibis': {
    region: region.australia,
    stage: angosturaStage(2011),
    materials: [
      material('Bunnahabhain 12 Year Old', '60 ml'), material(ingredient.agedMadeira, '15 ml'), material('Yellow Chartreuse', '10 ml'),
      material(ingredient.freshCherries, L('2 cherries', '2 颗樱桃', '2 cerises', '2 Kirschen', '2 cerezas', '체리 2개', 'チェリー2個', '2 ciliegie')),
      material(ingredient.aromaticBitters, quantity.fiveDashes), material(ingredient.seaSalt, quantity.pinch),
    ],
    method: [
      L('Pit the cherries and muddle them with the salt in a mixing vessel.', '将樱桃去核，在搅拌容器中与盐一起捣压。', 'Dénoyauter les cerises et les piler avec le sel dans un récipient de mélange.', 'Die Kirschen entsteinen und mit dem Salz in einem Mischgefäß zerdrücken.', 'Deshuesar las cerezas y majarlas con la sal en un recipiente de mezcla.', '체리 씨를 제거하고 믹싱 용기에서 소금과 함께 머들링한다.', 'チェリーの種を取り、ミキシング容器で塩とともにマドルする。', 'Snocciolare le ciliegie e pestarle con il sale in un recipiente da miscelazione.'),
      L('Add the other ingredients and leave to infuse; no duration is given. Stir with large pieces of ice.', '加入其余材料并浸泡，来源未注明时长；再加大块冰搅拌。', 'Ajouter les autres ingrédients et laisser infuser, sans durée indiquée. Remuer avec de gros morceaux de glace.', 'Die übrigen Zutaten zugeben und ziehen lassen; eine Dauer fehlt. Mit großen Eisstücken rühren.', 'Añadir los demás ingredientes y dejar infusionar; no se indica duración. Remover con trozos grandes de hielo.', '나머지 재료를 넣고 우린다. 시간은 명시되지 않았다. 큰 얼음 조각을 넣어 스터한다.', '残りの材料を加えて浸す。時間の記載はない。大きな氷を入れてステアする。', 'Aggiungere gli altri ingredienti e lasciare in infusione; la durata non è indicata. Mescolare con grossi pezzi di ghiaccio.'),
      L('Filter into a chilled martini glass; present the remaining cherry pieces with a little whisky and salt as the source garnish.', '过滤入冰镇马提尼杯，按来源装饰方式，将剩余樱桃碎块配少量威士忌和盐呈上。', 'Filtrer dans un verre à martini refroidi ; présenter les morceaux de cerise restants avec un peu de whisky et de sel, selon la garniture de la source.', 'In ein gekühltes Martiniglas abseihen; die übrigen Kirschstücke mit etwas Whisky und Salz als Garnitur der Quelle präsentieren.', 'Colar en una copa de martini fría; presentar los trozos de cereza restantes con un poco de whisky y sal, como decoración de la fuente.', '차갑게 한 마티니 글라스에 스트레인하고 원문 가니시대로 남은 체리 조각에 소량의 위스키와 소금을 곁들여 낸다.', '冷やしたマティーニグラスにこす。原文の飾りとして、残ったチェリーのかけらに少量のウイスキーと塩を添えて供する。', 'Filtrare in una coppetta martini raffreddata; presentare i pezzi di ciliegia rimasti con un po’ di whisky e sale come guarnizione della fonte.'),
    ],
    summary: L('The source specifies aged Madeira without a product name. It leaves the infusion time and extra garnish whisky quantity unstated.', '来源注明陈年马德拉酒，未指定产品；浸泡时间和装饰另加威士忌的用量未注明。', 'La source indique un Madère vieilli sans nom de produit. La durée d’infusion et la quantité de whisky supplémentaire pour la garniture ne sont pas précisées.', 'Die Quelle nennt gereiften Madeira ohne Produktnamen. Infusionsdauer und zusätzliche Whiskymenge für die Garnitur bleiben offen.', 'La fuente indica Madeira envejecido sin un producto concreto. No especifica el tiempo de infusión ni el whisky adicional de la decoración.', '원문은 제품명 없이 숙성 마데이라를 지정합니다. 인퓨전 시간과 가니시용 추가 위스키 분량은 명시하지 않습니다.', '原文は製品名を指定せず熟成マデイラを挙げています。浸す時間と飾りに追加するウイスキーの量は不明です。', 'La fonte indica Madeira invecchiato senza un prodotto specifico. Non precisa il tempo d’infusione né il whisky aggiuntivo della guarnizione.'),
  },
  'angostura-2011-orinoco-flip': {
    region: region.australia,
    stage: angosturaStage(2011),
    materials: [material('Angostura Rum', '60 ml'), material(ingredient.sesame, quantity.teaspoon), material(ingredient.treacle, quantity.flatTeaspoon), material(ingredient.aromaticBitters, quantity.fiveDashes), material(ingredient.eggYolk, quantity.egg), material(ingredient.mozart, '10 ml')],
    method: [
      L('Muddle the toasted sesame seeds and put them in the shaker.', '捣压烘烤芝麻后放入摇壶。', 'Piler les graines de sésame grillées et les mettre dans le shaker.', 'Die gerösteten Sesamsamen zerdrücken und in den Shaker geben.', 'Majar las semillas de sésamo tostadas y ponerlas en la coctelera.', '볶은 참깨를 머들링한 뒤 셰이커에 넣는다.', '炒りゴマをマドルしてシェイカーに入れる。', 'Pestare i semi di sesamo tostati e metterli nello shaker.'),
      L('Add the remaining ingredients and stir until the treacle dissolves.', '加入其余材料，搅拌至糖蜜溶解。', 'Ajouter les autres ingrédients et remuer jusqu’à dissolution de la mélasse.', 'Die übrigen Zutaten zugeben und rühren, bis die Melasse gelöst ist.', 'Añadir los demás ingredientes y remover hasta disolver la melaza.', '나머지 재료를 넣고 당밀이 녹을 때까지 젓는다.', '残りの材料を加え、トリークルが溶けるまで混ぜる。', 'Aggiungere gli altri ingredienti e mescolare finché la melassa si scioglie.'),
      L('Shake vigorously, double-strain into a chilled wine glass and serve dark chocolate alongside.', '用力摇匀，双重过滤入冰镇葡萄酒杯，旁配黑巧克力。', 'Shaker vigoureusement, filtrer deux fois dans un verre à vin refroidi et servir du chocolat noir à côté.', 'Kräftig shaken, doppelt in ein gekühltes Weinglas abseihen und dunkle Schokolade daneben servieren.', 'Agitar vigorosamente, colar dos veces en una copa de vino fría y servir chocolate negro al lado.', '강하게 셰이크하여 차갑게 한 와인 글라스에 더블 스트레인하고 다크 초콜릿을 곁들인다.', '力強くシェイクし、冷やしたワイングラスにダブルストレインして、ダークチョコレートを添える。', 'Shakerare energicamente, filtrare due volte in un bicchiere da vino raffreddato e servire cioccolato fondente a fianco.'),
    ],
    summary: L('The archive names Angostura Rum without an age expression and specifies Mozart Dark chocolate liqueur.', '档案注明 Angostura Rum，未注明酒龄，并指定 Mozart Dark 巧克力利口酒。', 'L’archive nomme Angostura Rum sans mention d’âge et précise la liqueur de chocolat Mozart Dark.', 'Das Archiv nennt Angostura Rum ohne Altersangabe und spezifiziert Mozart Dark Schokoladenlikör.', 'El archivo nombra Angostura Rum sin indicación de edad y especifica licor de chocolate Mozart Dark.', '기록은 숙성 연수 없이 Angostura Rum을 지정하고 Mozart Dark 초콜릿 리큐어를 명시합니다.', 'アーカイブは年数表示なしのAngostura Rumを挙げ、Mozart Darkチョコレートリキュールを指定しています。', 'L’archivio indica Angostura Rum senza dichiarazione d’età e specifica il liquore al cioccolato Mozart Dark.'),
  },
  'angostura-2014-big-bird': {
    region: region.australia,
    stage: angosturaStage(2014),
    materials: [material('Angostura 7 Year Old Rum', '45 ml'), material('Fernet Branca', '7.5 ml'), material(ingredient.freshCitrus, '20 ml'), material("Crawley's Spiced Honey Apple", '20 ml'), material(ingredient.freshPineapple, '40 ml'), material(ingredient.aromaticBitters, quantity.sixDashes)],
    method: [
      L('Shake the ingredients with ice.', '将材料加冰摇匀。', 'Shaker les ingrédients avec de la glace.', 'Die Zutaten mit Eis shaken.', 'Agitar los ingredientes con hielo.', '재료를 얼음과 함께 셰이크한다.', '材料を氷とともにシェイクする。', 'Shakerare gli ingredienti con ghiaccio.'),
      L('Double-strain and serve without ice; present pineapple chips and a liquorice aroma alongside.', '双重过滤后无冰呈上，旁配菠萝脆片及甘草香气。', 'Filtrer deux fois et servir sans glace ; présenter des chips d’ananas et un arôme de réglisse à côté.', 'Doppelt abseihen und ohne Eis servieren; Ananaschips und ein Lakritzaroma daneben präsentieren.', 'Colar dos veces y servir sin hielo; presentar chips de piña y un aroma de regaliz al lado.', '더블 스트레인하여 얼음 없이 내고 파인애플 칩과 감초 향을 곁들인다.', 'ダブルストレインして氷なしで供し、パイナップルチップとリコリスの香りを添える。', 'Filtrare due volte e servire senza ghiaccio; presentare chips d’ananas e un aroma di liquirizia a fianco.'),
    ],
    summary: L('The named Crawley’s product and the source’s lemon-or-lime choice are retained. No homemade substitute is inferred.', '保留所指定的 Crawley’s 产品及来源的柠檬汁或青柠汁选择，不推定自制替代品。', 'Le produit Crawley’s nommé et le choix citron ou citron vert de la source sont conservés. Aucun substitut maison n’est déduit.', 'Das genannte Crawley’s-Produkt und die Wahl zwischen Zitrone und Limette bleiben erhalten. Ein eigener Ersatz wird nicht abgeleitet.', 'Se conservan el producto Crawley’s indicado y la elección de limón o lima de la fuente. No se infiere un sustituto casero.', '명시된 Crawley’s 제품과 원문의 레몬·라임 선택을 유지합니다. 자체 제조 대안은 추정하지 않습니다.', '指定されたCrawley’s製品と、原文のレモンまたはライムという選択を保持しています。自家製の代用品は推定していません。', 'Si conservano il prodotto Crawley’s indicato e la scelta limone o lime della fonte. Non si deduce un sostituto fatto in casa.'),
  },
  'angostura-2014-olympia': {
    region: region.australia,
    stage: angosturaStage(2014),
    materials: [material('Hine Cigar Reserve', '45 ml'), material('Lustau San Emilio Pedro Ximénez', '15 ml'), material(ingredient.freshLemon, '15 ml'), material(ingredient.eggWhite, '15 ml'), material('Paul Simon Fig & Lemon Jam', quantity.barSpoon), material(ingredient.aromaticBitters, quantity.sixDashes)],
    method: [
      L('Shake the other ingredients with ice and 1 dash of the bitters.', '将其余材料加冰与 1 dash 苦精摇匀。', 'Shaker les autres ingrédients avec de la glace et 1 trait de bitters.', 'Die übrigen Zutaten mit Eis und 1 Spritzer Bitters shaken.', 'Agitar los demás ingredientes con hielo y 1 golpe de amargos.', '나머지 재료를 얼음과 비터스 1대시와 함께 셰이크한다.', '残りの材料を氷とビターズ1ダッシュでシェイクする。', 'Shakerare gli altri ingredienti con ghiaccio e 1 dash di bitter.'),
      L('Double-strain into a tumbler over ice.', '双重过滤入装冰的平底杯。', 'Filtrer deux fois dans un tumbler sur de la glace.', 'Doppelt in einen Tumbler über Eis abseihen.', 'Colar dos veces en un vaso tumbler con hielo.', '얼음을 담은 텀블러에 더블 스트레인한다.', '氷を入れたタンブラーにダブルストレインする。', 'Filtrare due volte in un tumbler con ghiaccio.'),
      L('Float the remaining 5 dashes of bitters. The source presents grapes and tobacco leaves beside the glass.', '将剩余 5 dash 苦精浮于表面。来源在杯旁摆放葡萄与烟草叶。', 'Faire flotter les 5 traits de bitters restants. La source présente des raisins et des feuilles de tabac à côté du verre.', 'Die übrigen 5 Spritzer Bitters obenauf geben. Die Quelle präsentiert Trauben und Tabakblätter neben dem Glas.', 'Flotar los 5 golpes de amargos restantes. La fuente presenta uvas y hojas de tabaco al lado del vaso.', '남은 비터스 5대시를 표면에 띄운다. 원문은 글라스 옆에 포도와 담뱃잎을 놓는다.', '残りのビターズ5ダッシュをフロートする。原文ではグラスの横にブドウとタバコの葉を添える。', 'Far galleggiare i 5 dash di bitter rimasti. La fonte presenta uva e foglie di tabacco accanto al bicchiere.'),
    ],
    summary: L('The 6 dashes are split between shaking and the float. Tobacco leaves are part of the source presentation beside the glass.', '6 dash 苦精分用于摇和与浮层；烟草叶属于来源中杯旁的展示。', 'Les 6 traits sont répartis entre le shaker et la couche flottante. Les feuilles de tabac font partie de la présentation de la source à côté du verre.', 'Die 6 Spritzer verteilen sich auf Shaken und Float. Tabakblätter gehören zur Präsentation der Quelle neben dem Glas.', 'Los 6 golpes se reparten entre el agitado y la capa flotante. Las hojas de tabaco forman parte de la presentación de la fuente junto al vaso.', '비터스 6대시는 셰이크와 플로트에 나누어 사용합니다. 담뱃잎은 원문의 글라스 옆 연출에 해당합니다.', '6ダッシュはシェイクとフロートに分けて使います。タバコの葉は原文のグラス横の演出です。', 'I 6 dash sono divisi tra shakerata e strato galleggiante. Le foglie di tabacco fanno parte della presentazione della fonte accanto al bicchiere.'),
  },
  'angostura-2018-deliciousness': {
    region: region.newZealand,
    stage: angosturaStage(2018),
    materials: [material('Amaro di Angostura', '30 ml'), material(ingredient.pineappleSyrup, '10 ml'), material(ingredient.orangeBitters, quantity.twoDashes), material(ingredient.coffeeLiqueur, '20 ml'), material(ingredient.eggWhite, quantity.egg)],
    method: [
      L('Whip the egg white until stiff, fold in the coffee liqueur and set the foam aside.', '将蛋清打发至硬性发泡，轻拌入咖啡利口酒，将泡沫放在一旁。', 'Monter le blanc d’œuf en neige ferme, incorporer délicatement la liqueur de café et réserver la mousse.', 'Das Eiweiß steif schlagen, den Kaffeelikör unterheben und den Schaum beiseitestellen.', 'Montar la clara a punto de nieve firme, incorporar suavemente el licor de café y reservar la espuma.', '달걀흰자를 단단하게 휘핑하고 커피 리큐어를 가볍게 섞어 폼을 따로 둔다.', '卵白を角が立つまで泡立て、コーヒーリキュールをさっくり混ぜ、フォームを置いておく。', 'Montare l’albume a neve ferma, incorporare delicatamente il liquore al caffè e tenere da parte la schiuma.'),
      L('Stir the remaining ingredients in a rocks glass over a large ice cube.', '在岩石杯中将其余材料与大冰块搅拌。', 'Remuer les autres ingrédients dans un verre rocks sur un gros glaçon.', 'Die übrigen Zutaten in einem Rocks-Glas über einem großen Eiswürfel rühren.', 'Remover los demás ingredientes en un vaso rocks con un cubo de hielo grande.', '록스 글라스에서 나머지 재료를 큰 얼음 위에 스터한다.', 'ロックグラスで残りの材料を大きな氷とともにステアする。', 'Mescolare gli altri ingredienti in un bicchiere rocks con un grosso cubetto di ghiaccio.'),
      L('Layer the coffee foam on top, lightly torch its surface and serve immediately.', '将咖啡泡沫铺在上层，用喷枪轻炙表面后立即呈上。', 'Déposer la mousse au café sur le dessus, passer légèrement la surface au chalumeau et servir immédiatement.', 'Den Kaffeeschaum obenauf schichten, die Oberfläche leicht mit dem Brenner abflämmen und sofort servieren.', 'Colocar la espuma de café encima, pasar ligeramente un soplete por la superficie y servir de inmediato.', '커피 폼을 위에 올리고 표면을 토치로 가볍게 그을려 즉시 낸다.', 'コーヒーフォームを上に重ね、表面をトーチで軽くあぶり、すぐに供する。', 'Stendere la schiuma al caffè sopra, passare leggermente la superficie con un cannello e servire subito.'),
    ],
    summary: L('Pineapple syrup and coffee liqueur have no specified brands or additional formulas. The coffee liqueur is incorporated into the foam.', '菠萝糖浆和咖啡利口酒未指定品牌或附加配方；咖啡利口酒用于泡沫中。', 'Le sirop d’ananas et la liqueur de café n’ont ni marque précisée ni formule supplémentaire. La liqueur de café est incorporée à la mousse.', 'Für Ananassirup und Kaffeelikör sind weder Marken noch zusätzliche Rezepturen angegeben. Der Kaffeelikör wird in den Schaum eingearbeitet.', 'El jarabe de piña y el licor de café no tienen marcas ni fórmulas adicionales indicadas. El licor de café se incorpora a la espuma.', '파인애플 시럽과 커피 리큐어는 브랜드나 추가 제조법이 명시되지 않습니다. 커피 리큐어는 폼에 넣습니다.', 'パイナップルシロップとコーヒーリキュールのブランドや追加の配合は記載されていません。コーヒーリキュールはフォームに混ぜます。', 'Sciroppo d’ananas e liquore al caffè non hanno marche né formule aggiuntive indicate. Il liquore al caffè viene incorporato nella schiuma.'),
  },
};
