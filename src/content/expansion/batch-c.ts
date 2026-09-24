import type {
  Approachability,
  Flavour,
  Ingredient,
  Localized,
  RecipeIngredient,
  Strength,
  Taste,
} from '../../domain/contracts';
import {ibaLabel, L, S} from './localized';
import type {CatalogueBatch} from './types';

const checkedAt = '2026-09-05';
const iba = 'International Bartenders Association';

const ingredients: Ingredient[] = [
  {id: 'neutral-white-rum', name: L('White rum', '白朗姆酒', 'Rhum blanc', 'Weißer Rum', 'Ron blanco', '화이트 럼', 'ホワイトラム', 'Rum bianco'), base: 'rum', exclusionTags: ['rum'], compositionKnown: true},
  {id: 'apricot-brandy', name: L('Apricot brandy', '杏味白兰地', 'Brandy d’abricot', 'Aprikosenbrandy', 'Brandy de albaricoque', '살구 브랜디', 'アプリコットブランデー', 'Brandy all’albicocca'), exclusionTags: [], compositionKnown: false},
  {id: 'calvados', name: L('Calvados', '卡尔瓦多斯苹果白兰地', 'Calvados', 'Calvados', 'Calvados', '칼바도스', 'カルヴァドス', 'Calvados'), base: 'brandy', exclusionTags: ['brandy'], compositionKnown: true},
  {id: 'white-peach-puree', name: L('White peach puree', '白桃果泥', 'Purée de pêche blanche', 'Weißes Pfirsichpüree', 'Puré de melocotón blanco', '백도 퓌레', '白桃ピューレ', 'Purea di pesca bianca'), exclusionTags: [], compositionKnown: true},
  {id: 'aromatic-bitters', name: L('Aromatic bitters', '芳香苦精', 'Bitters aromatiques', 'Aromatic Bitters', 'Bitters aromáticos', '아로마틱 비터스', 'アロマティックビターズ', 'Bitter aromatico'), exclusionTags: [], compositionKnown: false},
  {id: 'cachaca', name: L('Cachaça', '卡莎萨', 'Cachaça', 'Cachaça', 'Cachaça', '카샤사', 'カシャッサ', 'Cachaça'), base: 'cachaca', exclusionTags: ['cachaca'], compositionKnown: true},
  {id: 'cuban-aguardiente', name: L('Cuban aguardiente', '古巴甘蔗烈酒', 'Aguardiente cubain', 'Kubanischer Aguardiente', 'Aguardiente cubano', '쿠바 아과르디엔테', 'キューバン・アグアルディエンテ', 'Aguardiente cubano'), exclusionTags: [], compositionKnown: true},
  {id: 'old-tom-gin', name: L('Old Tom gin', '老汤姆金酒', 'Gin Old Tom', 'Old Tom Gin', 'Ginebra Old Tom', '올드 톰 진', 'オールド・トム・ジン', 'Gin Old Tom'), base: 'gin', exclusionTags: ['gin'], compositionKnown: true},
  {id: 'orange-bitters', name: L('Orange bitters', '橙味苦精', 'Bitters à l’orange', 'Orangenbitter', 'Bitters de naranja', '오렌지 비터스', 'オレンジビターズ', 'Bitter all’arancia'), exclusionTags: [], compositionKnown: false},
  {id: 'grand-marnier', name: L('Grand Marnier orange liqueur', 'Grand Marnier 橙味利口酒', 'Liqueur d’orange Grand Marnier', 'Grand-Marnier-Orangenlikör', 'Licor de naranja Grand Marnier', '그랑 마니에 오렌지 리큐어', 'グラン・マルニエ オレンジリキュール', 'Liquore all’arancia Grand Marnier'), exclusionTags: [], compositionKnown: false, brandIds: ['brand-grand-marnier']},
  {id: 'falernum', name: L('Falernum', '法勒纳姆利口酒', 'Falernum', 'Falernum', 'Falernum', '팔레넘', 'ファレルナム', 'Falernum'), exclusionTags: [], compositionKnown: false},
  {id: 'lillet-blanc', name: L('Lillet Blanc', '丽蕾白开胃酒', 'Lillet Blanc', 'Lillet Blanc', 'Lillet Blanc', '릴레 블랑', 'リレ・ブラン', 'Lillet Blanc'), exclusionTags: [], compositionKnown: false, brandIds: ['brand-lillet']},
  {id: 'gold-jamaican-rum', name: L('Gold Jamaican rum', '金色牙买加朗姆酒', 'Rhum jamaïcain doré', 'Goldener jamaikanischer Rum', 'Ron jamaicano dorado', '골드 자메이카 럼', 'ゴールド・ジャマイカンラム', 'Rum giamaicano dorato'), base: 'rum', exclusionTags: ['rum'], compositionKnown: true},
  {id: 'passion-fruit-syrup', name: L('Passion fruit syrup', '百香果糖浆', 'Sirop de fruit de la passion', 'Passionsfruchtsirup', 'Sirope de maracuyá', '패션프루트 시럽', 'パッションフルーツシロップ', 'Sciroppo al frutto della passione'), exclusionTags: [], compositionKnown: false},
  {id: 'fernet', name: L('Fernet', '费奈特苦味酒', 'Fernet', 'Fernet', 'Fernet', '페르넷', 'フェルネット', 'Fernet'), exclusionTags: [], compositionKnown: false, brandIds: ['brand-fernet-branca']},
  {id: 'amaretto', name: L('Amaretto', '杏仁利口酒', 'Amaretto', 'Amaretto', 'Amaretto', '아마레토', 'アマレット', 'Amaretto'), exclusionTags: [], compositionKnown: false},
  {id: 'raspberry-liqueur', name: L('Raspberry liqueur', '覆盆子利口酒', 'Liqueur de framboise', 'Himbeerlikör', 'Licor de frambuesa', '라즈베리 리큐어', 'ラズベリーリキュール', 'Liquore al lampone'), exclusionTags: [], compositionKnown: false},
  {id: 'basil-leaves', name: L('Italian basil leaves', '意大利罗勒叶', 'Feuilles de basilic italien', 'Italienische Basilikumblätter', 'Hojas de albahaca italiana', '이탈리안 바질 잎', 'イタリアンバジルの葉', 'Foglie di basilico italiano'), exclusionTags: [], compositionKnown: true},
  {id: 'creme-de-menthe', name: L('Green crème de menthe', '绿色薄荷利口酒', 'Crème de menthe verte', 'Grüne Crème de Menthe', 'Crema de menta verde', '그린 크렘 드 멘트', 'グリーン・クレーム・ド・マント', 'Crème de menthe verde'), exclusionTags: [], compositionKnown: false},
  {id: 'grapefruit-juice', name: L('Grapefruit juice', '葡萄柚汁', 'Jus de pamplemousse', 'Grapefruitsaft', 'Zumo de pomelo', '자몽 주스', 'グレープフルーツジュース', 'Succo di pompelmo'), exclusionTags: [], compositionKnown: true},
  {id: 'ginger-ale', name: L('Ginger ale', '姜汁汽水', 'Ginger ale', 'Ginger Ale', 'Ginger ale', '진저에일', 'ジンジャーエール', 'Ginger ale'), exclusionTags: [], compositionKnown: false},
  {id: 'cuban-rum', name: L('Cuban rum', '古巴朗姆酒', 'Rhum cubain', 'Kubanischer Rum', 'Ron cubano', '쿠바 럼', 'キューバンラム', 'Rum cubano'), base: 'rum', exclusionTags: ['rum'], compositionKnown: true, brandIds: ['brand-havana-club']},
  {id: 'smoky-rum', name: L('Smoky rum', '烟熏朗姆酒', 'Rhum fumé', 'Rauchiger Rum', 'Ron ahumado', '스모키 럼', 'スモーキーラム', 'Rum affumicato'), base: 'rum', exclusionTags: ['rum'], compositionKnown: true, brandIds: ['brand-havana-club']},
  {id: 'frangelico', name: L('Frangelico hazelnut liqueur', 'Frangelico 榛子利口酒', 'Liqueur de noisette Frangelico', 'Frangelico-Haselnusslikör', 'Licor de avellana Frangelico', '프란젤리코 헤이즐넛 리큐어', 'フランジェリコ ヘーゼルナッツリキュール', 'Liquore alla nocciola Frangelico'), exclusionTags: [], compositionKnown: false, brandIds: ['brand-frangelico']},
  {id: 'passion-fruit-puree', name: L('Passion fruit puree', '百香果果泥', 'Purée de fruit de la passion', 'Passionsfruchtpüree', 'Puré de maracuyá', '패션프루트 퓌레', 'パッションフルーツピューレ', 'Purea di frutto della passione'), exclusionTags: [], compositionKnown: true},
  {id: 'espadin-mezcal', name: L('Espadín mezcal', 'Espadín 梅斯卡尔', 'Mezcal Espadín', 'Espadín-Mezcal', 'Mezcal espadín', '에스파딘 메스칼', 'エスパディン・メスカル', 'Mezcal Espadín'), base: 'mezcal', exclusionTags: ['mezcal'], compositionKnown: true},
  {id: 'jamaican-overproof-white-rum', name: L('Jamaican overproof white rum', '牙买加高酒精度白朗姆酒', 'Rhum blanc jamaïcain overproof', 'Jamaikanischer weißer Overproof-Rum', 'Ron blanco jamaicano overproof', '자메이카 오버프루프 화이트 럼', 'ジャマイカン・オーバープルーフ・ホワイトラム', 'Rum bianco giamaicano overproof'), base: 'rum', exclusionTags: ['rum'], compositionKnown: true},
  {id: 'irish-whiskey', name: L('Irish whiskey', '爱尔兰威士忌', 'Whiskey irlandais', 'Irischer Whiskey', 'Whiskey irlandés', '아이리시 위스키', 'アイリッシュウイスキー', 'Whiskey irlandese'), base: 'whiskey', exclusionTags: ['whiskey'], compositionKnown: true},
  {id: 'hot-coffee', name: L('Hot coffee', '热咖啡', 'Café chaud', 'Heißer Kaffee', 'Café caliente', '뜨거운 커피', 'ホットコーヒー', 'Caffè caldo'), exclusionTags: [], compositionKnown: true},
  {id: 'blackstrap-rum', name: L('Blackstrap rum', '黑糖蜜朗姆酒', 'Rhum blackstrap', 'Blackstrap-Rum', 'Ron blackstrap', '블랙스트랩 럼', 'ブラックストラップラム', 'Rum blackstrap'), base: 'rum', exclusionTags: ['rum'], compositionKnown: true},
  {id: 'demerara-syrup', name: L('Demerara sugar syrup', '德梅拉拉糖浆', 'Sirop de sucre demerara', 'Demerara-Zuckersirup', 'Sirope de azúcar demerara', '데메라라 슈거 시럽', 'デメララシュガーシロップ', 'Sciroppo di zucchero demerara'), exclusionTags: [], compositionKnown: false},
  {id: 'dry-white-wine', name: L('Dry white wine', '干白葡萄酒', 'Vin blanc sec', 'Trockener Weißwein', 'Vino blanco seco', '드라이 화이트 와인', '辛口白ワイン', 'Vino bianco secco'), exclusionTags: [], compositionKnown: false},
  {id: 'creme-de-cassis', name: L('Crème de cassis', '黑加仑利口酒', 'Crème de cassis', 'Crème de Cassis', 'Crema de cassis', '크렘 드 카시스', 'クレーム・ド・カシス', 'Crème de cassis'), exclusionTags: [], compositionKnown: false},
  {id: 'grenadine-syrup', name: L('Grenadine syrup', '红石榴糖浆', 'Sirop de grenadine', 'Grenadinesirup', 'Sirope de granadina', '그레나딘 시럽', 'グレナデンシロップ', 'Sciroppo di granatina'), exclusionTags: [], compositionKnown: false},
  {id: 'sugar', name: L('Sugar', '糖', 'Sucre', 'Zucker', 'Azúcar', '설탕', '砂糖', 'Zucchero'), exclusionTags: [], compositionKnown: true},
  {id: 'rum', name: L('Rum, style unspecified', '朗姆酒（未指定类型）', 'Rhum, style non précisé', 'Rum, Stil nicht angegeben', 'Ron, estilo no especificado', '럼, 스타일 미지정', 'ラム（スタイル指定なし）', 'Rum, stile non specificato'), base: 'rum', exclusionTags: ['rum'], compositionKnown: true},
];

const brands = [
  {id: 'brand-grand-marnier', name: 'Grand Marnier', ingredientIds: ['grand-marnier']},
  {id: 'brand-lillet', name: 'Lillet', ingredientIds: ['lillet-blanc']},
  {id: 'brand-fernet-branca', name: 'Fernet-Branca', ingredientIds: ['fernet']},
  {id: 'brand-havana-club', name: 'Havana Club', ingredientIds: ['cuban-rum', 'smoky-rum']},
  {id: 'brand-frangelico', name: 'Frangelico', ingredientIds: ['frangelico']},
];

const cocktailGlass = L('Chilled cocktail glass', '冰镇鸡尾酒杯', 'Verre à cocktail refroidi', 'Gekühltes Cocktailglas', 'Copa de cóctel fría', '차갑게 식힌 칵테일 글라스', '冷やしたカクテルグラス', 'Coppetta da cocktail fredda');
const largeCocktailGlass = L('Chilled large cocktail glass', '冰镇大号鸡尾酒杯', 'Grand verre à cocktail refroidi', 'Gekühltes großes Cocktailglas', 'Copa de cóctel grande y fría', '차갑게 식힌 대형 칵테일 글라스', '冷やした大型カクテルグラス', 'Coppetta da cocktail grande e fredda');
const rocksGlass = L('Rocks glass', '岩石杯', 'Verre rocks', 'Rocks-Glas', 'Vaso rocks', '록스 글라스', 'ロックグラス', 'Bicchiere rocks');
const oldFashionedGlass = L('Old fashioned glass', '古典杯', 'Verre old fashioned', 'Old-Fashioned-Glas', 'Vaso old fashioned', '올드 패션드 글라스', 'オールドファッションドグラス', 'Bicchiere old fashioned');
const highballGlass = L('Highball glass', '高球杯', 'Verre highball', 'Highballglas', 'Vaso highball', '하이볼 글라스', 'ハイボールグラス', 'Bicchiere highball');
const fluteGlass = L('Chilled flute', '冰镇笛形杯', 'Flûte refroidie', 'Gekühlte Flöte', 'Copa flauta fría', '차갑게 식힌 플루트', '冷やしたフルートグラス', 'Flute freddo');
const unspecifiedGlass = L('Serving glass; source does not specify the style', '盛酒杯；来源未指定杯型', 'Verre de service ; style non précisé par la source', 'Servierglas; Stil von der Quelle nicht angegeben', 'Vaso de servicio; la fuente no especifica el estilo', '서빙 글라스, 출처에 형태 미지정', '提供用グラス（出典に形式の指定なし）', 'Bicchiere di servizio; stile non indicato dalla fonte');
const noGarnish = L('No garnish specified', '来源未指定装饰', 'Aucune garniture indiquée', 'Keine Garnitur angegeben', 'Sin guarnición indicada', '출처에 가니시가 명시되지 않음', '出典にガーニッシュの指定なし', 'Nessuna guarnizione indicata');
const lemonZest = L('Lemon zest', '柠檬皮', 'Zeste de citron', 'Zitronenzeste', 'Piel de limón', '레몬 제스트', 'レモンゼスト', 'Zest di limone');
const orangeZest = L('Orange zest', '橙皮', 'Zeste d’orange', 'Orangenzeste', 'Piel de naranja', '오렌지 제스트', 'オレンジゼスト', 'Zest d’arancia');
const orangeWedge = L('Orange wedge', '橙角', 'Quartier d’orange', 'Orangenspalte', 'Gajo de naranja', '오렌지 웨지', 'オレンジウェッジ', 'Spicchio d’arancia');
const limeSlice = L('Lime slice', '青柠片', 'Rondelle de citron vert', 'Limettenscheibe', 'Rodaja de lima', '라임 슬라이스', 'ライムスライス', 'Fetta di lime');

const descSour = L('A bright source-checked sour with fresh citrus and a clean finish.', '以新鲜柑橘构成、收尾利落的明亮酸酒。', 'Un sour vif et vérifié, aux agrumes frais et à la finale nette.', 'Ein heller, geprüfter Sour mit frischen Zitrusnoten und klarem Abgang.', 'Un sour vivo y verificado, con cítricos frescos y final limpio.', '신선한 시트러스와 깔끔한 피니시를 지닌 밝은 사워입니다.', 'フレッシュな柑橘とすっきりした余韻を持つ、明るいサワーです。', 'Un sour vivace e verificato, con agrumi freschi e finale pulito.');
const descSpirit = L('A concentrated stirred or short drink led by its base spirits and aromatic modifiers.', '以基酒与芳香修饰酒为主导的浓缩型短饮。', 'Un verre court et concentré, mené par ses spiritueux et modificateurs aromatiques.', 'Ein konzentrierter Shortdrink, geführt von Basisspirituosen und aromatischen Modifiern.', 'Un trago corto y concentrado, guiado por destilados y modificadores aromáticos.', '기주와 향긋한 부재료가 중심인 농축된 쇼트 드링크입니다.', 'ベーススピリッツと香り高い副材料が主役の、凝縮したショートドリンクです。', 'Un drink corto e concentrato, guidato da distillati e modificatori aromatici.');
const descFruit = L('A fruit-led cocktail with rounded sweetness and an easy aromatic lift.', '以果味为主，甜感圆润并带轻盈香气的鸡尾酒。', 'Un cocktail fruité, à la douceur ronde et au parfum léger.', 'Ein fruchtbetonter Cocktail mit runder Süße und leichtem Aroma.', 'Un cóctel frutal, de dulzor redondo y aroma ligero.', '과일 풍미와 둥근 단맛, 가벼운 향을 지닌 칵테일입니다.', '果実味を中心に、丸い甘さと軽やかな香りを持つカクテルです。', 'Un cocktail fruttato, dalla dolcezza rotonda e dal profumo leggero.');
const descBitter = L('A bittersweet cocktail with a firm herbal backbone and a lingering finish.', '草本骨架鲜明、余味持久的苦甜鸡尾酒。', 'Un cocktail doux-amer à l’ossature végétale ferme et à la finale persistante.', 'Ein bittersüßer Cocktail mit festem Kräuterkern und langem Abgang.', 'Un cóctel agridulce con base herbal firme y final persistente.', '단단한 허브 중심과 긴 피니시를 지닌 쌉싸름한 칵테일입니다.', 'しっかりしたハーブの骨格と長い余韻を持つ、甘苦いカクテルです。', 'Un cocktail agrodolce con solida struttura erbacea e finale persistente.');
const descRefreshing = L('A tall or iced drink built for freshness, gentle dilution, and an aromatic finish.', '以清爽、柔和稀释与芳香收尾为核心的加冰或长饮。', 'Un long drink ou cocktail sur glace axé sur la fraîcheur, la dilution douce et une finale aromatique.', 'Ein Longdrink oder Eisdrink mit Frische, sanfter Verdünnung und aromatischem Abgang.', 'Un trago largo o con hielo centrado en frescura, dilución suave y final aromático.', '상쾌함과 부드러운 희석, 향긋한 피니시에 초점을 둔 롱 또는 아이스 드링크입니다.', '爽快さ、穏やかな希釈、香り高い余韻を重視したロングまたはアイスドリンクです。', 'Un long drink o drink con ghiaccio centrato su freschezza, diluizione gentile e finale aromatico.');
const descCreamy = L('A smooth cream cocktail with a rich, dessert-like texture.', '质地浓郁如甜点般的柔滑奶油鸡尾酒。', 'Un cocktail crémeux et lisse, à la texture riche de dessert.', 'Ein weicher Sahnecocktail mit üppiger Desserttextur.', 'Un cóctel cremoso y suave, con rica textura de postre.', '진하고 디저트 같은 질감의 부드러운 크림 칵테일입니다.', '濃厚でデザートのような質感を持つ、なめらかなクリームカクテルです。', 'Un cocktail cremoso e morbido, dalla ricca consistenza da dessert.');

const shakeCocktail = S(
  ['Shake all ingredients with ice.', 'Strain into the chilled cocktail glass.'],
  ['将所有材料加冰摇匀。', '滤入冰镇鸡尾酒杯。'],
  ['Shaker tous les ingrédients avec de la glace.', 'Filtrer dans le verre à cocktail refroidi.'],
  ['Alle Zutaten mit Eis shaken.', 'In das gekühlte Cocktailglas abseihen.'],
  ['Agita todos los ingredientes con hielo.', 'Cuela en la copa de cóctel fría.'],
  ['모든 재료를 얼음과 함께 흔듭니다.', '차갑게 식힌 칵테일 글라스에 거릅니다.'],
  ['すべての材料を氷とシェイクします。', '冷やしたカクテルグラスにこします。'],
  ['Shakerare tutti gli ingredienti con ghiaccio.', 'Filtrare nella coppetta da cocktail fredda.'],
);
const stirCocktail = S(
  ['Stir all ingredients with ice in a mixing glass.', 'Strain into the chilled cocktail glass.'],
  ['将所有材料在调酒杯中加冰搅拌。', '滤入冰镇鸡尾酒杯。'],
  ['Remuer tous les ingrédients avec de la glace dans un verre à mélange.', 'Filtrer dans le verre à cocktail refroidi.'],
  ['Alle Zutaten im Rührglas mit Eis rühren.', 'In das gekühlte Cocktailglas abseihen.'],
  ['Remueve todos los ingredientes con hielo en un vaso mezclador.', 'Cuela en la copa de cóctel fría.'],
  ['모든 재료를 믹싱 글라스에서 얼음과 함께 젓습니다.', '차갑게 식힌 칵테일 글라스에 거릅니다.'],
  ['すべての材料をミキシンググラスで氷とステアします。', '冷やしたカクテルグラスにこします。'],
  ['Mescolare tutti gli ingredienti con ghiaccio nel mixing glass.', 'Filtrare nella coppetta da cocktail fredda.'],
);
const buildOldFashioned = S(
  ['Build the ingredients over ice cubes in the old fashioned glass.', 'Stir gently.'],
  ['将材料直接倒入装有冰块的古典杯。', '轻轻搅拌。'],
  ['Verser les ingrédients directement sur des glaçons dans le verre old fashioned.', 'Remuer doucement.'],
  ['Die Zutaten direkt über Eiswürfel in das Old-Fashioned-Glas geben.', 'Vorsichtig rühren.'],
  ['Vierte los ingredientes directamente sobre hielo en el vaso old fashioned.', 'Remueve suavemente.'],
  ['재료를 얼음을 담은 올드 패션드 글라스에 바로 붓습니다.', '부드럽게 젓습니다.'],
  ['材料を氷入りのオールドファッションドグラスに直接注ぎます。', '軽く混ぜます。'],
  ['Versare gli ingredienti direttamente su ghiaccio nel bicchiere old fashioned.', 'Mescolare delicatamente.'],
);

const profileBright = L('Editorial guide: bright acidity keeps the drink lively and focused.', '编辑提示：明亮酸度让酒体保持活泼而集中。', 'Repère éditorial : une acidité vive garde le verre net et dynamique.', 'Redaktioneller Hinweis: Lebhafte Säure hält den Drink klar und dynamisch.', 'Guía editorial: una acidez viva mantiene el trago ágil y definido.', '편집 안내: 선명한 산미가 칵테일을 생기 있고 또렷하게 유지합니다.', '編集メモ：明るい酸味が、いきいきと輪郭のある味わいを保ちます。', 'Nota editoriale: un’acidità vivace mantiene il drink dinamico e definito.');
const profileSpirit = L('Editorial guide: the concentrated, spirit-forward structure finishes dry and aromatic.', '编辑提示：浓缩且酒体突出的结构，收尾干爽芳香。', 'Repère éditorial : une structure concentrée et dominée par les spiritueux, à la finale sèche et aromatique.', 'Redaktioneller Hinweis: Die konzentrierte, spirituosenbetonte Struktur endet trocken und aromatisch.', 'Guía editorial: la estructura concentrada y espirituosa termina seca y aromática.', '편집 안내: 농축된 술 중심 구조가 드라이하고 향긋하게 마무리됩니다.', '編集メモ：凝縮した酒主体の構成で、ドライかつ香り高く終わります。', 'Nota editoriale: la struttura concentrata e alcolica chiude secca e aromatica.');
const profileFruit = L('Editorial guide: ripe fruit and measured sweetness make the drink rounded and approachable.', '编辑提示：成熟果味与适量甜感让口感圆润易饮。', 'Repère éditorial : fruit mûr et douceur mesurée donnent un profil rond et accessible.', 'Redaktioneller Hinweis: Reife Frucht und maßvolle Süße machen den Drink rund und zugänglich.', 'Guía editorial: la fruta madura y un dulzor medido dan un perfil redondo y amable.', '편집 안내: 잘 익은 과일 풍미와 절제된 단맛이 둥글고 편안한 맛을 만듭니다.', '編集メモ：熟した果実味と控えめな甘さで、丸く親しみやすい味わいです。', 'Nota editoriale: frutta matura e dolcezza misurata rendono il drink rotondo e accessibile.');
const profileBitter = L('Editorial guide: herbal bitterness gives the drink a firm, lingering finish.', '编辑提示：草本苦味带来坚定而持久的收尾。', 'Repère éditorial : l’amertume végétale donne une finale ferme et persistante.', 'Redaktioneller Hinweis: Kräuterbitterkeit sorgt für einen festen, langen Abgang.', 'Guía editorial: el amargor herbal aporta un final firme y persistente.', '편집 안내: 허브의 쓴맛이 단단하고 긴 피니시를 만듭니다.', '編集メモ：ハーブの苦味が、力強く長い余韻を作ります。', 'Nota editoriale: l’amaro erbaceo crea un finale deciso e persistente.');
const profileCreamy = L('Editorial guide: cream softens the liqueurs into a rich dessert-like texture.', '编辑提示：奶油把利口酒柔化成浓郁的甜点般质感。', 'Repère éditorial : la crème fond les liqueurs dans une texture riche de dessert.', 'Redaktioneller Hinweis: Sahne verbindet die Liköre zu einer üppigen Desserttextur.', 'Guía editorial: la nata suaviza los licores en una textura rica de postre.', '편집 안내: 크림이 리큐어를 부드럽고 진한 디저트 같은 질감으로 묶습니다.', '編集メモ：クリームがリキュールを包み、濃厚なデザートのような質感にします。', 'Nota editoriale: la panna ammorbidisce i liquori in una ricca consistenza da dessert.');
const profileRefreshing = L('Editorial guide: generous dilution and fresh fruit keep the longer drink refreshing.', '编辑提示：充分稀释与新鲜果味让长饮保持清爽。', 'Repère éditorial : une dilution généreuse et le fruit frais gardent ce long drink rafraîchissant.', 'Redaktioneller Hinweis: Reichliche Verdünnung und frische Frucht halten den Longdrink erfrischend.', 'Guía editorial: la dilución amplia y la fruta fresca mantienen refrescante el trago largo.', '편집 안내: 충분한 희석과 신선한 과일이 긴 음료를 상쾌하게 유지합니다.', '編集メモ：十分な希釈とフレッシュな果実味で、ロングドリンクらしい爽快さを保ちます。', 'Nota editoriale: diluizione generosa e frutta fresca mantengono rinfrescante il long drink.');

interface Entry {
  id: string;
  name: Localized;
  aliases?: string[];
  description: Localized;
  accent: string;
  ingredients: RecipeIngredient[];
  steps: ReturnType<typeof S>;
  glass: Localized;
  garnish: Localized;
  flavours: Flavour[];
  tastes: Taste[];
  strength: Strength;
  approachability: Approachability;
  profileNote: Localized;
}

const entries: Entry[] = [
  {
    id: 'angel-face', name: L('Angel Face', '天使之颜', 'Angel Face', 'Angel Face', 'Angel Face', '엔젤 페이스', 'エンジェル・フェイス', 'Angel Face'),
    description: descSpirit, accent: '#C89A68',
    ingredients: [{ingredientId: 'gin', amount: 30, unit: 'ml'}, {ingredientId: 'apricot-brandy', amount: 30, unit: 'ml'}, {ingredientId: 'calvados', amount: 30, unit: 'ml'}],
    steps: shakeCocktail, glass: cocktailGlass, garnish: noGarnish,
    flavours: ['fruit', 'floral'], tastes: ['sweet', 'dry'], strength: 'strong', approachability: 'bold', profileNote: profileSpirit,
  },
  {
    id: 'bellini', name: L('Bellini', '贝里尼', 'Bellini', 'Bellini', 'Bellini', '벨리니', 'ベリーニ', 'Bellini'),
    description: descFruit, accent: '#E3B38F',
    ingredients: [{ingredientId: 'prosecco', amount: 100, unit: 'ml'}, {ingredientId: 'white-peach-puree', amount: 50, unit: 'ml'}],
    steps: S(
      ['Add peach puree to a mixing glass with ice, then add Prosecco.', 'Stir gently and pour into the chilled flute.'],
      ['将白桃果泥加入装冰的调酒杯，再倒入普罗塞克。', '轻轻搅拌后倒入冰镇笛形杯。'],
      ['Mettre la purée de pêche avec de la glace dans un verre à mélange, puis ajouter le Prosecco.', 'Remuer doucement et verser dans la flûte refroidie.'],
      ['Pfirsichpüree mit Eis in ein Rührglas geben und Prosecco hinzufügen.', 'Vorsichtig rühren und in die gekühlte Flöte gießen.'],
      ['Pon el puré de melocotón con hielo en un vaso mezclador y añade Prosecco.', 'Remueve suavemente y vierte en la flauta fría.'],
      ['복숭아 퓌레를 얼음과 함께 믹싱 글라스에 넣고 프로세코를 더합니다.', '부드럽게 저어 차가운 플루트에 붓습니다.'],
      ['白桃ピューレを氷入りのミキシンググラスに入れ、プロセッコを加えます。', '軽く混ぜ、冷やしたフルートに注ぎます。'],
      ['Mettere purea di pesca e ghiaccio nel mixing glass, poi aggiungere Prosecco.', 'Mescolare delicatamente e versare nel flute freddo.'],
    ),
    glass: fluteGlass, garnish: noGarnish,
    flavours: ['fruit', 'floral'], tastes: ['sweet', 'refreshing'], strength: 'low', approachability: 'gentle', profileNote: profileFruit,
  },
  {
    id: 'between-the-sheets', name: L('Between the Sheets', '床笫之间', 'Between the Sheets', 'Between the Sheets', 'Between the Sheets', '비트윈 더 시츠', 'ビトウィーン・ザ・シーツ', 'Between the Sheets'),
    description: descSour, accent: '#D3A56A',
    ingredients: [{ingredientId: 'neutral-white-rum', amount: 30, unit: 'ml'}, {ingredientId: 'cognac', amount: 30, unit: 'ml'}, {ingredientId: 'triple-sec', amount: 30, unit: 'ml'}, {ingredientId: 'lemon-juice', amount: 20, unit: 'ml'}],
    steps: shakeCocktail, glass: cocktailGlass, garnish: noGarnish,
    flavours: ['citrus'], tastes: ['sour', 'sweet', 'dry'], strength: 'strong', approachability: 'bold', profileNote: profileBright,
  },
  {
    id: 'black-russian', name: L('Black Russian', '黑俄罗斯', 'Black Russian', 'Black Russian', 'Ruso Negro', '블랙 러시안', 'ブラック・ルシアン', 'Black Russian'),
    description: L('Vodka and coffee liqueur make a dark, direct after-dinner drink.', '伏特加与咖啡利口酒组成深色而直接的餐后酒。', 'Vodka et liqueur de café composent un digestif sombre et direct.', 'Wodka und Kaffeelikör ergeben einen dunklen, direkten Drink nach dem Essen.', 'Vodka y licor de café forman un trago oscuro y directo de sobremesa.', '보드카와 커피 리큐어가 짙고 직선적인 식후주를 만듭니다.', 'ウォッカとコーヒーリキュールで作る、濃く直線的な食後酒です。', 'Vodka e liquore al caffè formano un dopocena scuro e diretto.'), accent: '#5C4639',
    ingredients: [{ingredientId: 'vodka', amount: 50, unit: 'ml'}, {ingredientId: 'coffee-liqueur', amount: 20, unit: 'ml'}],
    steps: buildOldFashioned, glass: oldFashionedGlass, garnish: noGarnish,
    flavours: ['coffee'], tastes: ['bitter', 'sweet'], strength: 'strong', approachability: 'balanced', profileNote: profileSpirit,
  },
  {
    id: 'brandy-crusta', name: L('Brandy Crusta', '白兰地糖边酒', 'Brandy Crusta', 'Brandy Crusta', 'Brandy Crusta', '브랜디 크러스타', 'ブランデー・クラスタ', 'Brandy Crusta'),
    description: descSour, accent: '#C87945',
    ingredients: [
      {ingredientId: 'brandy', amount: 52.5, unit: 'ml'},
      {ingredientId: 'maraschino-liqueur', amount: 7.5, unit: 'ml', brandId: 'brand-luxardo'},
      {ingredientId: 'orange-curacao', amount: 1, unit: 'barspoon'},
      {ingredientId: 'lemon-juice', amount: 15, unit: 'ml'},
      {ingredientId: 'simple-syrup', amount: 1, unit: 'barspoon'},
      {ingredientId: 'aromatic-bitters', amount: 2, unit: 'dash'},
    ],
    steps: S(
      ['Prepare a slim cocktail glass with a citrus-rubbed sugar rim and a curled peel inside.', 'Stir all liquid ingredients with ice in a mixing glass and strain into the prepared glass.'],
      ['用柑橘擦拭细长鸡尾酒杯杯口并蘸糖，再把卷曲果皮放入杯内。', '将所有液体材料加冰搅拌，滤入准备好的杯中。'],
      ['Préparer un verre fin avec un bord sucré frotté aux agrumes et un zeste en spirale à l’intérieur.', 'Remuer les ingrédients liquides avec de la glace et filtrer dans le verre préparé.'],
      ['Ein schmales Cocktailglas mit Zitrus am Rand befeuchten, zuckern und eine gedrehte Schale hineinlegen.', 'Alle flüssigen Zutaten mit Eis rühren und in das vorbereitete Glas abseihen.'],
      ['Prepara una copa estrecha con borde de azúcar frotado con cítrico y una piel curvada dentro.', 'Remueve los líquidos con hielo y cuela en la copa preparada.'],
      ['가느다란 칵테일 글라스 가장자리에 시트러스를 문질러 설탕을 묻히고 말린 껍질을 안에 둡니다.', '모든 액체 재료를 얼음과 저어 준비한 글라스에 거릅니다.'],
      ['細身のグラスの縁を柑橘で湿らせて砂糖を付け、カールした皮を内側に置きます。', '液体材料を氷とステアし、準備したグラスにこします。'],
      ['Preparare una coppetta stretta con bordo zuccherato agli agrumi e una scorza arricciata all’interno.', 'Mescolare i liquidi con ghiaccio e filtrare nel bicchiere preparato.'],
    ),
    glass: L('Prepared slim cocktail glass', '准备好的细长鸡尾酒杯', 'Verre à cocktail fin préparé', 'Vorbereitetes schmales Cocktailglas', 'Copa de cóctel estrecha preparada', '준비한 슬림 칵테일 글라스', '準備した細身のカクテルグラス', 'Coppetta da cocktail stretta preparata'),
    garnish: L('Sugar crust and curled orange or lemon peel', '糖边与卷曲橙皮或柠檬皮', 'Croûte de sucre et zeste d’orange ou de citron en spirale', 'Zuckerrand und gedrehte Orangen- oder Zitronenschale', 'Borde de azúcar y piel curvada de naranja o limón', '슈거 림과 말린 오렌지 또는 레몬 껍질', 'シュガーリムとカールしたオレンジまたはレモンピール', 'Crosta di zucchero e scorza arricciata d’arancia o limone'),
    flavours: ['citrus', 'fruit'], tastes: ['sour', 'sweet', 'bitter'], strength: 'strong', approachability: 'bold', profileNote: profileBright,
  },
  {
    id: 'caipirinha', name: L('Caipirinha', '凯匹林纳', 'Caipirinha', 'Caipirinha', 'Caipirinha', '카이피리냐', 'カイピリーニャ', 'Caipirinha'),
    description: descRefreshing, accent: '#A8B84C',
    ingredients: [{ingredientId: 'cachaca', amount: 60, unit: 'ml'}, {ingredientId: 'lime-wedges', amount: 1, unit: 'piece', note: L('Cut into small wedges.', '切成小角。', 'Couper en petits quartiers.', 'In kleine Spalten schneiden.', 'Cortar en gajos pequeños.', '작은 웨지로 자릅니다.', '小さなくし形に切ります。', 'Tagliare in piccoli spicchi.')}, {ingredientId: 'white-cane-sugar', amount: 4, unit: 'tsp'}],
    steps: S(
      ['Gently muddle the lime and sugar in a double old fashioned glass.', 'Fill with cracked ice, add cachaça, and stir gently.'],
      ['在双份古典杯中轻轻捣压青柠与糖。', '加入碎裂冰块和卡莎萨，轻轻搅拌。'],
      ['Piler doucement le citron vert et le sucre dans un double old fashioned.', 'Remplir de glace concassée, ajouter la cachaça et remuer doucement.'],
      ['Limette und Zucker im Double-Old-Fashioned-Glas vorsichtig muddeln.', 'Mit gebrochenem Eis füllen, Cachaça zugeben und vorsichtig rühren.'],
      ['Machaca suavemente la lima y el azúcar en un vaso old fashioned doble.', 'Llena con hielo troceado, añade cachaça y remueve suavemente.'],
      ['더블 올드 패션드 글라스에서 라임과 설탕을 부드럽게 으깹니다.', '잘게 깬 얼음과 카샤사를 넣고 부드럽게 젓습니다.'],
      ['ダブル・オールドファッションドグラスでライムと砂糖をやさしくマドルします。', '砕いた氷を満たし、カシャッサを加えて軽く混ぜます。'],
      ['Pestare delicatamente lime e zucchero in un double old fashioned.', 'Riempire di ghiaccio spezzato, aggiungere cachaça e mescolare piano.'],
    ),
    glass: L('Double old fashioned glass', '双份古典杯', 'Verre double old fashioned', 'Double-Old-Fashioned-Glas', 'Vaso old fashioned doble', '더블 올드 패션드 글라스', 'ダブル・オールドファッションドグラス', 'Bicchiere double old fashioned'), garnish: noGarnish,
    flavours: ['citrus'], tastes: ['sour', 'sweet', 'refreshing'], strength: 'medium', approachability: 'balanced', profileNote: profileRefreshing,
  },
  {
    id: 'canchanchara', name: L('Canchanchara', '坎昌查拉', 'Canchanchara', 'Canchanchara', 'Canchanchara', '칸찬차라', 'カンチャンチャラ', 'Canchanchara'),
    description: descRefreshing, accent: '#C6A64E',
    ingredients: [{ingredientId: 'cuban-aguardiente', amount: 60, unit: 'ml'}, {ingredientId: 'lime-juice', amount: 15, unit: 'ml'}, {ingredientId: 'honey', amount: 15, unit: 'ml'}, {ingredientId: 'plain-water', amount: 50, unit: 'ml'}],
    steps: S(
      ['Mix honey, water, and lime juice across the bottom and sides of the glass.', 'Add cracked ice and the aguardiente, then stir energetically from bottom to top.'],
      ['把蜂蜜、水与青柠汁混合并涂布杯底和杯壁。', '加入碎裂冰块与古巴甘蔗烈酒，从杯底向上用力搅拌。'],
      ['Mélanger miel, eau et citron vert sur le fond et les parois du verre.', 'Ajouter glace concassée et aguardiente, puis remuer vivement de bas en haut.'],
      ['Honig, Wasser und Limettensaft am Boden und an den Wänden des Glases verteilen.', 'Gebrochenes Eis und Aguardiente zugeben und kräftig von unten nach oben rühren.'],
      ['Mezcla miel, agua y lima por el fondo y las paredes del vaso.', 'Añade hielo troceado y aguardiente; remueve con fuerza de abajo arriba.'],
      ['꿀과 물, 라임 주스를 글라스 바닥과 벽면에 섞어 바릅니다.', '잘게 깬 얼음과 아과르디엔테를 넣고 아래에서 위로 힘차게 젓습니다.'],
      ['蜂蜜、水、ライムジュースをグラスの底と側面に広げます。', '砕いた氷とアグアルディエンテを加え、底から上へ力強く混ぜます。'],
      ['Distribuire miele, acqua e lime sul fondo e sulle pareti del bicchiere.', 'Aggiungere ghiaccio spezzato e aguardiente, poi mescolare energicamente dal basso.'],
    ),
    glass: unspecifiedGlass, garnish: L('Lime wedge', '青柠角', 'Quartier de citron vert', 'Limettenspalte', 'Gajo de lima', '라임 웨지', 'ライムウェッジ', 'Spicchio di lime'),
    flavours: ['citrus'], tastes: ['sour', 'sweet', 'refreshing'], strength: 'medium', approachability: 'gentle', profileNote: profileRefreshing,
  },
  {
    id: 'cardinale', name: L('Cardinale', '卡迪纳莱', 'Cardinale', 'Cardinale', 'Cardinale', '카르디날레', 'カルディナーレ', 'Cardinale'),
    description: descBitter, accent: '#A13E35',
    ingredients: [{ingredientId: 'gin', amount: 40, unit: 'ml'}, {ingredientId: 'dry-vermouth', amount: 20, unit: 'ml'}, {ingredientId: 'campari', amount: 10, unit: 'ml', brandId: 'brand-campari'}],
    steps: stirCocktail, glass: cocktailGlass, garnish: lemonZest,
    flavours: ['herbal', 'citrus'], tastes: ['bitter', 'dry'], strength: 'strong', approachability: 'bold', profileNote: profileBitter,
  },
  {
    id: 'casino', name: L('Casino', '赌场', 'Casino', 'Casino', 'Casino', '카지노', 'カジノ', 'Casino'),
    description: descSour, accent: '#D3B05F',
    ingredients: [{ingredientId: 'old-tom-gin', amount: 40, unit: 'ml'}, {ingredientId: 'maraschino-liqueur', amount: 10, unit: 'ml', brandId: 'brand-luxardo'}, {ingredientId: 'lemon-juice', amount: 10, unit: 'ml'}, {ingredientId: 'orange-bitters', amount: 2, unit: 'dash'}],
    steps: S(
      ['Shake all ingredients well with ice.', 'Strain over ice into the chilled rocks glass.'],
      ['将所有材料加冰充分摇匀。', '滤入装冰的冰镇岩石杯。'],
      ['Bien shaker tous les ingrédients avec de la glace.', 'Filtrer sur glace dans le verre rocks refroidi.'],
      ['Alle Zutaten kräftig mit Eis shaken.', 'Über Eis in das gekühlte Rocks-Glas abseihen.'],
      ['Agita bien todos los ingredientes con hielo.', 'Cuela sobre hielo en el vaso rocks frío.'],
      ['모든 재료를 얼음과 충분히 흔듭니다.', '얼음을 담은 차가운 록스 글라스에 거릅니다.'],
      ['すべての材料を氷とよくシェイクします。', '氷入りの冷やしたロックグラスにこします。'],
      ['Shakerare bene tutti gli ingredienti con ghiaccio.', 'Filtrare su ghiaccio nel bicchiere rocks freddo.'],
    ),
    glass: rocksGlass, garnish: L('Lemon zest and maraschino cherry', '柠檬皮与马拉斯奇诺樱桃', 'Zeste de citron et cerise au marasquin', 'Zitronenzeste und Maraschinokirsche', 'Piel de limón y cereza al marrasquino', '레몬 제스트와 마라스키노 체리', 'レモンゼストとマラスキーノチェリー', 'Zest di limone e ciliegia al maraschino'),
    flavours: ['citrus', 'fruit'], tastes: ['sour', 'sweet', 'bitter'], strength: 'strong', approachability: 'balanced', profileNote: profileBright,
  },
  {
    id: 'champagne-cocktail', name: L('Champagne Cocktail', '香槟鸡尾酒', 'Champagne Cocktail', 'Champagner-Cocktail', 'Cóctel de Champán', '샴페인 칵테일', 'シャンパン・カクテル', 'Cocktail Champagne'),
    description: descFruit, accent: '#D7C57C',
    ingredients: [
      {ingredientId: 'champagne', amount: 90, unit: 'ml'}, {ingredientId: 'cognac', amount: 10, unit: 'ml'},
      {ingredientId: 'angostura-bitters', amount: 2, unit: 'dash', brandId: 'brand-angostura-aromatic'},
      {ingredientId: 'grand-marnier', amount: null, unit: 'drop', optional: true, brandId: 'brand-grand-marnier', note: L('IBA specifies a few optional drops.', 'IBA 标为可选数滴。', 'L’IBA indique quelques gouttes facultatives.', 'Die IBA nennt einige optionale Tropfen.', 'La IBA indica unas gotas opcionales.', 'IBA는 선택 사항인 몇 방울로 명시합니다.', 'IBAは任意の数滴と指定しています。', 'L’IBA indica alcune gocce facoltative.')},
      {ingredientId: 'sugar-cube', amount: 1, unit: 'piece'},
    ],
    steps: S(
      ['Place the sugar cube and bitters in a large Champagne glass, then add Cognac.', 'Pour in the chilled Champagne gently.'],
      ['把方糖与苦精放入大香槟杯，再加入干邑。', '轻轻倒入冰镇香槟。'],
      ['Mettre le sucre et les bitters dans un grand verre à Champagne, puis ajouter le cognac.', 'Verser doucement le Champagne refroidi.'],
      ['Zuckerwürfel und Bitters in ein großes Champagnerglas geben, dann Cognac hinzufügen.', 'Gekühlten Champagner vorsichtig eingießen.'],
      ['Pon el terrón y los bitters en una copa grande de champán y añade coñac.', 'Vierte suavemente el champán frío.'],
      ['큰 샴페인 글라스에 각설탕과 비터스를 넣고 코냑을 더합니다.', '차가운 샴페인을 부드럽게 붓습니다.'],
      ['大きなシャンパングラスに角砂糖とビターズを入れ、コニャックを加えます。', '冷やしたシャンパンを静かに注ぎます。'],
      ['Mettere zolletta e bitter in un grande bicchiere da Champagne, poi aggiungere cognac.', 'Versare delicatamente lo Champagne freddo.'],
    ),
    glass: L('Large Champagne glass', '大香槟杯', 'Grand verre à Champagne', 'Großes Champagnerglas', 'Copa grande de champán', '큰 샴페인 글라스', '大型シャンパングラス', 'Grande bicchiere da Champagne'),
    garnish: L('Orange zest and maraschino cherry', '橙皮与马拉斯奇诺樱桃', 'Zeste d’orange et cerise au marasquin', 'Orangenzeste und Maraschinokirsche', 'Piel de naranja y cereza al marrasquino', '오렌지 제스트와 마라스키노 체리', 'オレンジゼストとマラスキーノチェリー', 'Zest d’arancia e ciliegia al maraschino'),
    flavours: ['citrus', 'fruit'], tastes: ['sweet', 'bitter', 'refreshing'], strength: 'medium', approachability: 'gentle', profileNote: profileFruit,
  },
  {
    id: 'chartreuse-swizzle', name: L('Chartreuse Swizzle', '查特酒旋搅', 'Chartreuse Swizzle', 'Chartreuse Swizzle', 'Chartreuse Swizzle', '샤르트뢰즈 스위즐', 'シャルトリューズ・スウィズル', 'Chartreuse Swizzle'),
    description: descRefreshing, accent: '#7D9A41',
    ingredients: [{ingredientId: 'green-chartreuse', amount: 45, unit: 'ml', brandId: 'brand-chartreuse'}, {ingredientId: 'pineapple-juice', amount: 30, unit: 'ml'}, {ingredientId: 'lime-juice', amount: 22.5, unit: 'ml'}, {ingredientId: 'falernum', amount: 15, unit: 'ml'}],
    steps: S(
      ['Add all ingredients to a tall glass and add pebble ice.', 'Swizzle vigorously and fill with more pebble ice.'],
      ['把所有材料倒入高杯并加入小颗粒冰。', '用旋搅棒用力搅拌，再加满小颗粒冰。'],
      ['Verser tous les ingrédients dans un grand verre et ajouter de la glace en petits galets.', 'Swizzler vivement puis compléter avec davantage de glace.'],
      ['Alle Zutaten in ein hohes Glas geben und Pebble Ice hinzufügen.', 'Kräftig swizzeln und mit weiterem Pebble Ice auffüllen.'],
      ['Añade todo a un vaso alto y agrega hielo pebble.', 'Mezcla enérgicamente con swizzle y completa con más hielo.'],
      ['모든 재료를 긴 글라스에 붓고 페블 아이스를 넣습니다.', '힘차게 스위즐한 뒤 페블 아이스를 더 채웁니다.'],
      ['すべての材料を背の高いグラスに入れ、ペブルアイスを加えます。', '力強くスウィズルし、さらにペブルアイスを満たします。'],
      ['Versare tutto in un bicchiere alto e aggiungere pebble ice.', 'Mescolare energicamente con lo swizzle e colmare con altro ghiaccio.'],
    ),
    glass: L('Tall glass', '高杯', 'Grand verre', 'Hohes Glas', 'Vaso alto', '긴 글라스', '背の高いグラス', 'Bicchiere alto'),
    garnish: L('Mint leaves and grated nutmeg', '薄荷叶与现磨肉豆蔻', 'Feuilles de menthe et muscade râpée', 'Minzblätter und geriebene Muskatnuss', 'Hojas de menta y nuez moscada rallada', '민트 잎과 간 넛맥', 'ミントの葉とすりおろしたナツメグ', 'Foglie di menta e noce moscata grattugiata'),
    flavours: ['herbal', 'fruit', 'spice'], tastes: ['sweet', 'sour', 'refreshing'], strength: 'strong', approachability: 'balanced', profileNote: profileRefreshing,
  },
  {
    id: 'corpse-reviver-2', name: L('Corpse Reviver #2', '亡者复苏二号', 'Corpse Reviver No 2', 'Corpse Reviver Nr. 2', 'Corpse Reviver n.º 2', '콥스 리바이버 2', 'コープス・リバイバー No.2', 'Corpse Reviver n. 2'), aliases: ['Corpse Reviver No. 2', 'Corpse Reviver No 2'],
    description: descSour, accent: '#D3C47B',
    ingredients: [{ingredientId: 'gin', amount: 30, unit: 'ml'}, {ingredientId: 'triple-sec', amount: 30, unit: 'ml', brandId: 'brand-cointreau'}, {ingredientId: 'lillet-blanc', amount: 30, unit: 'ml', brandId: 'brand-lillet'}, {ingredientId: 'lemon-juice', amount: 30, unit: 'ml'}, {ingredientId: 'absinthe', amount: 1, unit: 'dash'}],
    steps: shakeCocktail, glass: cocktailGlass, garnish: orangeZest,
    flavours: ['citrus', 'herbal'], tastes: ['sour', 'sweet', 'dry'], strength: 'strong', approachability: 'bold', profileNote: profileBright,
  },
  {
    id: 'dons-special-daiquiri', name: L("Don’s Special Daiquiri", '唐的特别代基里', "Daiquiri spécial de Don", "Don’s Special Daiquiri", "Daiquiri especial de Don", '돈스 스페셜 다이키리', 'ドンズ・スペシャル・ダイキリ', 'Daiquiri speciale di Don'), aliases: ["Don's Special Daiquiri"],
    description: descFruit, accent: '#C98445',
    ingredients: [{ingredientId: 'gold-jamaican-rum', amount: 30, unit: 'ml'}, {ingredientId: 'cuban-rum', amount: 15, unit: 'ml'}, {ingredientId: 'passion-fruit-syrup', amount: 15, unit: 'ml'}, {ingredientId: 'lime-juice', amount: 15, unit: 'ml'}, {ingredientId: 'honey-syrup', amount: 15, unit: 'ml'}],
    steps: S(
      ['Blend all ingredients briefly with crushed ice in a milkshake mixer.', 'Pour into a footed copo glass and fill with more crushed ice.'],
      ['把所有材料与碎冰在奶昔搅拌机中短暂搅打。', '倒入带脚 copo 杯，再加满碎冰。'],
      ['Mixer brièvement tous les ingrédients avec de la glace pilée.', 'Verser dans un verre copo à pied et compléter de glace pilée.'],
      ['Alle Zutaten kurz mit Crushed Ice im Mixer blenden.', 'In ein Copo-Stielglas gießen und mit weiterem Crushed Ice füllen.'],
      ['Tritura brevemente todos los ingredientes con hielo picado.', 'Vierte en una copa copo con pie y completa con más hielo picado.'],
      ['모든 재료를 으깬 얼음과 함께 블렌더에 짧게 돌립니다.', '스템이 있는 코포 글라스에 붓고 으깬 얼음을 더 채웁니다.'],
      ['すべての材料をクラッシュアイスと短時間ブレンドします。', '脚付きコポグラスに注ぎ、さらにクラッシュアイスを満たします。'],
      ['Frullare brevemente tutti gli ingredienti con ghiaccio tritato.', 'Versare in un calice copo e colmare con altro ghiaccio tritato.'],
    ),
    glass: L('Footed copo glass', '带脚 copo 杯', 'Verre copo à pied', 'Copo-Stielglas', 'Copa copo con pie', '스템 코포 글라스', '脚付きコポグラス', 'Calice copo'),
    garnish: L('Half a passion fruit', '半颗百香果', 'Demi-fruit de la passion', 'Eine halbe Passionsfrucht', 'Medio maracuyá', '패션프루트 반 개', 'パッションフルーツ半分', 'Mezzo frutto della passione'),
    flavours: ['fruit', 'citrus'], tastes: ['sweet', 'sour', 'refreshing'], strength: 'medium', approachability: 'gentle', profileNote: profileFruit,
  },
  {
    id: 'fernandito', name: L('Fernandito', '费尔南迪托', 'Fernandito', 'Fernandito', 'Fernandito', '페르난디토', 'フェルナンディート', 'Fernandito'),
    description: descBitter, accent: '#5C4535',
    ingredients: [{ingredientId: 'fernet', amount: 50, unit: 'ml', brandId: 'brand-fernet-branca'}, {ingredientId: 'cola', amount: null, unit: 'top'}],
    steps: S(
      ['Pour Fernet-Branca into an ice-filled double old fashioned glass.', 'Fill with cola and stir gently.'],
      ['把 Fernet-Branca 倒入装冰的双份古典杯。', '用可乐补满并轻轻搅拌。'],
      ['Verser le Fernet-Branca dans un double old fashioned rempli de glace.', 'Compléter de cola et remuer doucement.'],
      ['Fernet-Branca in ein mit Eis gefülltes Double-Old-Fashioned-Glas geben.', 'Mit Cola auffüllen und vorsichtig rühren.'],
      ['Vierte Fernet-Branca en un vaso old fashioned doble con hielo.', 'Completa con cola y remueve suavemente.'],
      ['얼음을 담은 더블 올드 패션드 글라스에 페르넷 브랑카를 붓습니다.', '콜라로 채우고 부드럽게 젓습니다.'],
      ['氷入りのダブル・オールドファッションドグラスにフェルネット・ブランカを注ぎます。', 'コーラで満たし、軽く混ぜます。'],
      ['Versare Fernet-Branca in un double old fashioned con ghiaccio.', 'Colmare con cola e mescolare delicatamente.'],
    ),
    glass: L('Double old fashioned glass', '双份古典杯', 'Verre double old fashioned', 'Double-Old-Fashioned-Glas', 'Vaso old fashioned doble', '더블 올드 패션드 글라스', 'ダブル・オールドファッションドグラス', 'Bicchiere double old fashioned'), garnish: noGarnish,
    flavours: ['herbal', 'spice'], tastes: ['bitter', 'sweet', 'refreshing'], strength: 'medium', approachability: 'bold', profileNote: profileBitter,
  },
  {
    id: 'french-connection', name: L('French Connection', '法国关系', 'French Connection', 'French Connection', 'French Connection', '프렌치 커넥션', 'フレンチ・コネクション', 'French Connection'),
    description: descSpirit, accent: '#9F673A',
    ingredients: [{ingredientId: 'cognac', amount: 35, unit: 'ml'}, {ingredientId: 'amaretto', amount: 35, unit: 'ml'}],
    steps: buildOldFashioned, glass: oldFashionedGlass, garnish: noGarnish,
    flavours: ['fruit', 'spice'], tastes: ['sweet'], strength: 'strong', approachability: 'balanced', profileNote: profileSpirit,
  },
  {
    id: 'french-martini', name: L('French Martini', '法式马天尼', 'French Martini', 'French Martini', 'Martini Francés', '프렌치 마티니', 'フレンチ・マティーニ', 'French Martini'),
    description: descFruit, accent: '#B34F70',
    ingredients: [{ingredientId: 'vodka', amount: 45, unit: 'ml'}, {ingredientId: 'raspberry-liqueur', amount: 15, unit: 'ml'}, {ingredientId: 'pineapple-juice', amount: 15, unit: 'ml'}],
    steps: shakeCocktail, glass: cocktailGlass,
    garnish: L('Express lemon-peel oil over the drink', '在酒面挤出柠檬皮油', 'Exprimer l’huile d’un zeste de citron sur le verre', 'Zitronenschalenöl über dem Drink ausdrücken', 'Exprime aceite de piel de limón sobre la bebida', '레몬 껍질 오일을 음료 위에 짭니다', 'レモンピールのオイルを酒面に搾る', 'Esprimere olio di scorza di limone sul drink'),
    flavours: ['fruit', 'citrus'], tastes: ['sweet', 'sour'], strength: 'medium', approachability: 'gentle', profileNote: profileFruit,
  },
  {
    id: 'garibaldi', name: L('Garibaldi', '加里波第', 'Garibaldi', 'Garibaldi', 'Garibaldi', '가리발디', 'ガリバルディ', 'Garibaldi'),
    description: descRefreshing, accent: '#D66A31',
    ingredients: [{ingredientId: 'campari', amount: 45, unit: 'ml', brandId: 'brand-campari'}, {ingredientId: 'orange-juice', amount: 120, unit: 'ml'}],
    steps: S(
      ['Build both ingredients in an ice-filled highball glass.'], ['把两种材料直接倒入装冰的高球杯。'], ['Monter les deux ingrédients dans un highball rempli de glace.'], ['Beide Zutaten in einem mit Eis gefüllten Highballglas bauen.'], ['Monta ambos ingredientes en un highball con hielo.'], ['두 재료를 얼음을 담은 하이볼 글라스에 바로 붓습니다.'], ['2つの材料を氷入りのハイボールグラスに直接注ぎます。'], ['Costruire i due ingredienti in un highball colmo di ghiaccio.'],
    ),
    glass: highballGlass, garnish: orangeWedge,
    flavours: ['citrus', 'fruit'], tastes: ['bitter', 'sweet', 'refreshing'], strength: 'low', approachability: 'gentle', profileNote: profileRefreshing,
  },
  {
    id: 'gin-basil-smash', name: L('Gin Basil Smash', '金酒罗勒撞击', 'Gin Basil Smash', 'Gin Basil Smash', 'Gin Basil Smash', '진 바질 스매시', 'ジン・バジル・スマッシュ', 'Gin Basil Smash'),
    description: descSour, accent: '#5D964F',
    ingredients: [{ingredientId: 'gin', amount: 60, unit: 'ml'}, {ingredientId: 'lemon-juice', amount: 22.5, unit: 'ml'}, {ingredientId: 'simple-syrup', amount: 22.5, unit: 'ml'}, {ingredientId: 'basil-leaves', amount: 10, unit: 'piece'}],
    steps: S(
      ['Add all ingredients to a shaker with ice.', 'Shake vigorously and pour into the chilled cocktail glass.'],
      ['把所有材料与冰块加入摇壶。', '用力摇匀后倒入冰镇鸡尾酒杯。'],
      ['Mettre tous les ingrédients et la glace dans un shaker.', 'Shaker vivement et verser dans le verre à cocktail refroidi.'],
      ['Alle Zutaten mit Eis in einen Shaker geben.', 'Kräftig shaken und in das gekühlte Cocktailglas gießen.'],
      ['Pon todos los ingredientes y hielo en una coctelera.', 'Agita con fuerza y vierte en la copa fría.'],
      ['모든 재료와 얼음을 셰이커에 넣습니다.', '힘차게 흔들어 차가운 칵테일 글라스에 붓습니다.'],
      ['すべての材料と氷をシェイカーに入れます。', '力強くシェイクし、冷やしたカクテルグラスに注ぎます。'],
      ['Mettere tutti gli ingredienti e il ghiaccio nello shaker.', 'Shakerare energicamente e versare nella coppetta fredda.'],
    ),
    glass: cocktailGlass, garnish: noGarnish,
    flavours: ['herbal', 'citrus'], tastes: ['sour', 'sweet', 'refreshing'], strength: 'medium', approachability: 'gentle', profileNote: profileBright,
  },
  {
    id: 'gin-fizz', name: L('Gin Fizz', '金酒菲士', 'Gin Fizz', 'Gin Fizz', 'Gin Fizz', '진 피즈', 'ジン・フィズ', 'Gin Fizz'),
    description: descRefreshing, accent: '#D4D0A0',
    ingredients: [{ingredientId: 'gin', amount: 45, unit: 'ml'}, {ingredientId: 'lemon-juice', amount: 30, unit: 'ml'}, {ingredientId: 'simple-syrup', amount: 10, unit: 'ml'}, {ingredientId: 'soda-water', amount: null, unit: 'top', note: L('IBA specifies a splash.', 'IBA 标为少量。', 'L’IBA indique une petite quantité.', 'Die IBA nennt einen Spritzer.', 'La IBA indica un toque.', 'IBA는 소량을 명시합니다.', 'IBAは少量と指定しています。', 'L’IBA indica una spruzzata.')}],
    steps: S(
      ['Shake the gin, lemon juice, and syrup with ice.', 'Pour into a thin tall tumbler without ice and top with a splash of soda water.'],
      ['将金酒、柠檬汁与糖浆加冰摇匀。', '倒入不加冰的细长高杯，以少量苏打水补足。'],
      ['Shaker gin, citron et sirop avec de la glace.', 'Verser sans glace dans un tumbler haut et fin, puis ajouter un trait de soda.'],
      ['Gin, Zitronensaft und Sirup mit Eis shaken.', 'Ohne Eis in einen schlanken hohen Tumbler gießen und mit einem Spritzer Soda vollenden.'],
      ['Agita ginebra, limón y sirope con hielo.', 'Vierte sin hielo en un vaso alto y fino y termina con un toque de soda.'],
      ['진, 레몬 주스, 시럽을 얼음과 흔듭니다.', '얼음 없이 가늘고 긴 텀블러에 붓고 소다수를 조금 더합니다.'],
      ['ジン、レモンジュース、シロップを氷とシェイクします。', '氷なしで細長いタンブラーに注ぎ、少量のソーダを加えます。'],
      ['Shakerare gin, limone e sciroppo con ghiaccio.', 'Versare senza ghiaccio in un tumbler alto e sottile e finire con poca soda.'],
    ),
    glass: L('Thin tall tumbler, no ice', '细长高杯，不加冰', 'Tumbler haut et fin, sans glace', 'Schlanker hoher Tumbler, ohne Eis', 'Vaso alto y fino, sin hielo', '가늘고 긴 텀블러, 얼음 없음', '細長いタンブラー、氷なし', 'Tumbler alto e sottile, senza ghiaccio'),
    garnish: L('Lemon slice; lemon zest optional', '柠檬片；可选柠檬皮', 'Rondelle de citron ; zeste facultatif', 'Zitronenscheibe; Zeste optional', 'Rodaja de limón; piel opcional', '레몬 슬라이스, 레몬 제스트는 선택', 'レモンスライス。ゼストは任意', 'Fetta di limone; zest facoltativo'),
    flavours: ['citrus'], tastes: ['sour', 'sweet', 'refreshing'], strength: 'medium', approachability: 'gentle', profileNote: profileRefreshing,
  },
  {
    id: 'grand-margarita', name: L('Grand Margarita', '至尊玛格丽特', 'Grand Margarita', 'Grand Margarita', 'Grand Margarita', '그랜드 마가리타', 'グランド・マルガリータ', 'Grand Margarita'),
    description: descSour, accent: '#C8A044',
    ingredients: [{ingredientId: 'tequila', amount: 45, unit: 'ml'}, {ingredientId: 'grand-marnier', amount: 30, unit: 'ml', brandId: 'brand-grand-marnier'}, {ingredientId: 'lime-juice', amount: 15, unit: 'ml'}],
    steps: S(
      ['Rim the rocks glass with sea salt and add ice to both glass and shaker.', 'Shake the ingredients hard for 10 seconds and strain into the glass.'],
      ['用优质海盐为岩石杯制作盐边，并在杯与摇壶中加冰。', '把材料用力摇 10 秒，滤入杯中。'],
      ['Border le verre rocks de sel marin et ajouter de la glace au verre et au shaker.', 'Shaker vivement dix secondes puis filtrer dans le verre.'],
      ['Das Rocks-Glas mit Meersalz umranden und Glas sowie Shaker mit Eis füllen.', 'Zehn Sekunden kräftig shaken und in das Glas abseihen.'],
      ['Escarcha el vaso rocks con sal marina y añade hielo al vaso y a la coctelera.', 'Agita fuerte diez segundos y cuela en el vaso.'],
      ['록스 글라스에 바다 소금 림을 만들고 글라스와 셰이커에 얼음을 넣습니다.', '재료를 10초간 세게 흔들어 글라스에 거릅니다.'],
      ['ロックグラスを海塩でリムし、グラスとシェイカーに氷を入れます。', '材料を10秒強くシェイクし、グラスにこします。'],
      ['Bordare il bicchiere rocks con sale marino e mettere ghiaccio nel bicchiere e nello shaker.', 'Shakerare forte per dieci secondi e filtrare nel bicchiere.'],
    ),
    glass: rocksGlass, garnish: limeSlice,
    flavours: ['citrus'], tastes: ['sour', 'sweet'], strength: 'strong', approachability: 'balanced', profileNote: profileBright,
  },
  {
    id: 'grasshopper', name: L('Grasshopper', '蚱蜢', 'Grasshopper', 'Grasshopper', 'Saltamontes', '그래스호퍼', 'グラスホッパー', 'Grasshopper'),
    description: descCreamy, accent: '#8CB989',
    ingredients: [{ingredientId: 'creme-de-cacao', amount: 20, unit: 'ml', note: L('The source specifies white crème de cacao.', '来源指定白可可利口酒。', 'La source précise la crème de cacao blanche.', 'Die Quelle nennt weiße Crème de Cacao.', 'La fuente especifica crema de cacao blanca.', '출처는 화이트 크렘 드 카카오를 명시합니다.', '出典はホワイト・クレーム・ド・カカオを指定しています。', 'La fonte specifica crème de cacao bianca.')}, {ingredientId: 'creme-de-menthe', amount: 20, unit: 'ml'}, {ingredientId: 'cream', amount: 20, unit: 'ml'}],
    steps: S(
      ['Shake all ingredients briskly with ice for a few seconds.', 'Strain into the chilled cocktail glass.'],
      ['把所有材料加冰快速摇几秒。', '滤入冰镇鸡尾酒杯。'],
      ['Shaker vivement tous les ingrédients avec de la glace pendant quelques secondes.', 'Filtrer dans le verre à cocktail refroidi.'],
      ['Alle Zutaten einige Sekunden zügig mit Eis shaken.', 'In das gekühlte Cocktailglas abseihen.'],
      ['Agita enérgicamente todos los ingredientes con hielo unos segundos.', 'Cuela en la copa de cóctel fría.'],
      ['모든 재료를 얼음과 몇 초간 빠르게 흔듭니다.', '차갑게 식힌 칵테일 글라스에 거릅니다.'],
      ['すべての材料を氷と数秒きびきびシェイクします。', '冷やしたカクテルグラスにこします。'],
      ['Shakerare vivacemente tutti gli ingredienti con ghiaccio per pochi secondi.', 'Filtrare nella coppetta fredda.'],
    ),
    glass: cocktailGlass, garnish: L('Optional mint leaf', '可选薄荷叶', 'Feuille de menthe facultative', 'Optionales Minzblatt', 'Hoja de menta opcional', '선택 사항인 민트 잎', 'お好みでミントの葉', 'Foglia di menta facoltativa'),
    flavours: ['herbal'], tastes: ['sweet', 'creamy'], strength: 'medium', approachability: 'gentle', profileNote: profileCreamy,
  },
  {
    id: 'hanky-panky', name: L('Hanky Panky', '汉基班基', 'Hanky Panky', 'Hanky Panky', 'Hanky Panky', '행키 팽키', 'ハンキー・パンキー', 'Hanky Panky'),
    description: descBitter, accent: '#8E4939',
    ingredients: [{ingredientId: 'gin', amount: 45, unit: 'ml', note: L('The source specifies London dry gin.', '来源指定伦敦干金酒。', 'La source précise un gin London dry.', 'Die Quelle nennt London Dry Gin.', 'La fuente especifica ginebra London dry.', '출처는 런던 드라이 진을 명시합니다.', '出典はロンドン・ドライ・ジンを指定しています。', 'La fonte specifica gin London dry.')}, {ingredientId: 'sweet-red-vermouth', amount: 45, unit: 'ml'}, {ingredientId: 'fernet', amount: 7.5, unit: 'ml'}],
    steps: stirCocktail, glass: cocktailGlass, garnish: orangeZest,
    flavours: ['herbal', 'spice'], tastes: ['bitter', 'sweet', 'dry'], strength: 'strong', approachability: 'bold', profileNote: profileBitter,
  },
  {
    id: 'hemingway-special', name: L('Hemingway Special', '海明威特调', 'Hemingway Special', 'Hemingway Special', 'Hemingway Special', '헤밍웨이 스페셜', 'ヘミングウェイ・スペシャル', 'Hemingway Special'), aliases: ['Papa Doble'],
    description: descSour, accent: '#D1A65D',
    ingredients: [{ingredientId: 'rum', amount: 60, unit: 'ml'}, {ingredientId: 'grapefruit-juice', amount: 40, unit: 'ml'}, {ingredientId: 'maraschino-liqueur', amount: 15, unit: 'ml', brandId: 'brand-luxardo'}, {ingredientId: 'lime-juice', amount: 15, unit: 'ml'}],
    steps: S(
      ['Shake all ingredients well with ice.', 'Strain into the chilled large cocktail glass.'],
      ['将所有材料加冰充分摇匀。', '滤入冰镇大号鸡尾酒杯。'],
      ['Bien shaker tous les ingrédients avec de la glace.', 'Filtrer dans le grand verre à cocktail refroidi.'],
      ['Alle Zutaten kräftig mit Eis shaken.', 'In das gekühlte große Cocktailglas abseihen.'],
      ['Agita bien todos los ingredientes con hielo.', 'Cuela en la copa de cóctel grande y fría.'],
      ['모든 재료를 얼음과 충분히 흔듭니다.', '차갑게 식힌 대형 칵테일 글라스에 거릅니다.'],
      ['すべての材料を氷とよくシェイクします。', '冷やした大型カクテルグラスにこします。'],
      ['Shakerare bene tutti gli ingredienti con ghiaccio.', 'Filtrare nella coppetta grande e fredda.'],
    ),
    glass: largeCocktailGlass, garnish: noGarnish,
    flavours: ['citrus', 'fruit'], tastes: ['sour', 'dry'], strength: 'medium', approachability: 'balanced', profileNote: profileBright,
  },
  {
    id: 'horses-neck', name: L('Horse’s Neck', '马颈', 'Horse’s Neck', 'Horse’s Neck', 'Cuello de Caballo', '호스 넥', 'ホーセズ・ネック', 'Horse’s Neck'), aliases: ["Horse's Neck"],
    description: descRefreshing, accent: '#B98942',
    ingredients: [{ingredientId: 'cognac', amount: 40, unit: 'ml'}, {ingredientId: 'ginger-ale', amount: 120, unit: 'ml'}, {ingredientId: 'angostura-bitters', amount: null, unit: 'dash', optional: true, brandId: 'brand-angostura-aromatic', note: L('Optional; the source gives no dash count.', '可选；来源未给出滴数。', 'Facultatif ; la source ne donne pas de nombre de traits.', 'Optional; die Quelle nennt keine Dash-Anzahl.', 'Opcional; la fuente no indica número de golpes.', '선택 사항이며 출처에 대시 수가 없습니다.', '任意。出典にダッシュ数の指定なし。', 'Facoltativo; la fonte non indica il numero di dash.')}],
    steps: S(
      ['Build the Cognac and ginger ale over ice in a highball glass and stir gently.', 'Add Angostura bitters only if desired.'],
      ['把干邑与姜汁汽水直接倒入装冰的高球杯并轻轻搅拌。', '仅在需要时加入安高斯图拉苦精。'],
      ['Verser cognac et ginger ale sur glace dans un highball et remuer doucement.', 'Ajouter les bitters Angostura seulement si désiré.'],
      ['Cognac und Ginger Ale über Eis in ein Highballglas geben und vorsichtig rühren.', 'Angostura Bitters nur nach Wunsch hinzufügen.'],
      ['Monta coñac y ginger ale sobre hielo en un highball y remueve suavemente.', 'Añade Angostura solo si se desea.'],
      ['코냑과 진저에일을 얼음을 담은 하이볼 글라스에 붓고 부드럽게 젓습니다.', '원할 때만 앙고스투라 비터스를 넣습니다.'],
      ['コニャックとジンジャーエールを氷入りのハイボールグラスに注ぎ、軽く混ぜます。', '好みでアンゴスチュラ・ビターズを加えます。'],
      ['Versare cognac e ginger ale su ghiaccio in un highball e mescolare piano.', 'Aggiungere Angostura solo se desiderato.'],
    ),
    glass: highballGlass, garnish: L('Spiral rind of one lemon', '一整条螺旋柠檬皮', 'Longue spirale de zeste d’un citron', 'Spirale aus der Schale einer Zitrone', 'Espiral de piel de un limón', '레몬 한 개의 나선형 껍질', 'レモン1個分のらせん状の皮', 'Spirale ricavata dalla scorza di un limone'),
    flavours: ['spice', 'citrus'], tastes: ['sweet', 'refreshing'], strength: 'medium', approachability: 'gentle', profileNote: profileRefreshing,
  },
  {
    id: 'iba-tiki', name: L('IBA Tiki', 'IBA 提基', 'IBA Tiki', 'IBA Tiki', 'IBA Tiki', 'IBA 티키', 'IBAティキ', 'IBA Tiki'),
    description: L('Two Havana Club rums, tropical fruit, nut liqueurs, lime, and ginger in a dense pebble-ice drink.', '两款 Havana Club 朗姆、热带水果、坚果利口酒、青柠与姜组成浓郁的颗粒冰饮。', 'Deux rhums Havana Club, fruits tropicaux, liqueurs de noix, citron vert et gingembre sur glace en petits galets.', 'Zwei Havana-Club-Rums, Tropenfrucht, Nussliköre, Limette und Ingwer auf Pebble Ice.', 'Dos rones Havana Club, fruta tropical, licores de frutos secos, lima y jengibre sobre hielo pebble.', '두 가지 하바나 클럽 럼과 열대 과일, 견과 리큐어, 라임, 생강을 페블 아이스에 담은 진한 칵테일입니다.', '2種のハバナクラブラム、トロピカルフルーツ、ナッツ系リキュール、ライム、生姜をペブルアイスでまとめます。', 'Due rum Havana Club, frutta tropicale, liquori alla frutta secca, lime e zenzero su pebble ice.'), accent: '#B86D39',
    ingredients: [
      {ingredientId: 'cuban-rum', amount: 30, unit: 'ml', brandId: 'brand-havana-club', note: L('Source names Ron Profundo.', '来源指定 Ron Profundo。', 'La source nomme Ron Profundo.', 'Die Quelle nennt Ron Profundo.', 'La fuente nombra Ron Profundo.', '출처는 Ron Profundo를 명시합니다.', '出典はRon Profundoを指定しています。', 'La fonte indica Ron Profundo.')},
      {ingredientId: 'smoky-rum', amount: 30, unit: 'ml', brandId: 'brand-havana-club', note: L('Source names Ron Smoky.', '来源指定 Ron Smoky。', 'La source nomme Ron Smoky.', 'Die Quelle nennt Ron Smoky.', 'La fuente nombra Ron Smoky.', '출처는 Ron Smoky를 명시합니다.', '出典はRon Smokyを指定しています。', 'La fonte indica Ron Smoky.')},
      {ingredientId: 'amaretto', amount: 15, unit: 'ml'}, {ingredientId: 'frangelico', amount: 5, unit: 'ml', brandId: 'brand-frangelico'},
      {ingredientId: 'maraschino-liqueur', amount: 5, unit: 'drop', brandId: 'brand-luxardo'}, {ingredientId: 'passion-fruit-puree', amount: 30, unit: 'ml'},
      {ingredientId: 'pineapple-juice', amount: 90, unit: 'ml', note: L('The live IBA page lists 90 without a unit; ml is retained from the surrounding liquid measures.', 'IBA 当前页面只写 90 未写单位；依据相邻液体计量按 ml 保存。', 'La page IBA affiche 90 sans unité ; ml est retenu d’après les autres mesures liquides.', 'Die IBA-Seite nennt 90 ohne Einheit; ml wird aus den umgebenden Flüssigmaßen übernommen.', 'La página IBA muestra 90 sin unidad; se conserva ml por las medidas líquidas contiguas.', 'IBA 페이지는 단위 없이 90으로 표시하며 주변 액체 계량에 따라 ml로 저장합니다.', 'IBAページは単位なしで90と記載。周囲の液体計量に合わせmlで保存します。', 'La pagina IBA indica 90 senza unità; si conserva ml dalle misure liquide circostanti.')},
      {ingredientId: 'lime-juice', amount: 30, unit: 'ml', note: L('The live IBA page lists 30 without a unit; ml is retained from the surrounding liquid measures.', 'IBA 当前页面只写 30 未写单位；依据相邻液体计量按 ml 保存。', 'La page IBA affiche 30 sans unité ; ml est retenu d’après les autres mesures liquides.', 'Die IBA-Seite nennt 30 ohne Einheit; ml wird aus den umgebenden Flüssigmaßen übernommen.', 'La página IBA muestra 30 sin unidad; se conserva ml por las medidas líquidas contiguas.', 'IBA 페이지는 단위 없이 30으로 표시하며 주변 액체 계량에 따라 ml로 저장합니다.', 'IBAページは単位なしで30と記載。周囲の液体計量に合わせmlで保存します。', 'La pagina IBA indica 30 senza unità; si conserva ml dalle misure liquide circostanti.')},
      {ingredientId: 'ginger', amount: 1, unit: 'piece'},
    ],
    steps: S(
      ['Muddle a thin ginger slice in a shaker, then add every other ingredient.', 'Shake vigorously with ice and strain into a chilled tiki glass filled with pebble ice.'],
      ['在摇壶中捣压一片薄姜，再加入其余材料。', '加冰用力摇匀，滤入装有颗粒冰的冰镇提基杯。'],
      ['Piler une fine tranche de gingembre dans un shaker, puis ajouter le reste.', 'Shaker vivement avec de la glace et filtrer dans un verre tiki froid rempli de pebble ice.'],
      ['Eine dünne Ingwerscheibe im Shaker muddeln und alle übrigen Zutaten zugeben.', 'Kräftig mit Eis shaken und in ein gekühltes, mit Pebble Ice gefülltes Tiki-Glas abseihen.'],
      ['Machaca una lámina fina de jengibre en la coctelera y añade lo demás.', 'Agita con fuerza con hielo y cuela en un vaso tiki frío con hielo pebble.'],
      ['셰이커에서 얇은 생강 한 조각을 으깨고 나머지 재료를 넣습니다.', '얼음과 세게 흔들어 페블 아이스를 담은 차가운 티키 글라스에 거릅니다.'],
      ['シェイカーで薄い生姜1枚をマドルし、ほかの材料を加えます。', '氷と力強くシェイクし、ペブルアイス入りの冷たいティキグラスにこします。'],
      ['Pestare una fettina di zenzero nello shaker e aggiungere il resto.', 'Shakerare forte con ghiaccio e filtrare in un tiki freddo con pebble ice.'],
    ),
    glass: L('Chilled tiki glass with pebble ice', '装颗粒冰的冰镇提基杯', 'Verre tiki refroidi avec pebble ice', 'Gekühltes Tiki-Glas mit Pebble Ice', 'Vaso tiki frío con hielo pebble', '페블 아이스를 담은 차가운 티키 글라스', 'ペブルアイス入りの冷たいティキグラス', 'Bicchiere tiki freddo con pebble ice'),
    garnish: L('Citrus and dehydrated pineapple slice', '柑橘与脱水菠萝片', 'Agrumes et tranche d’ananas déshydratée', 'Zitrus und getrocknete Ananasscheibe', 'Cítricos y rodaja de piña deshidratada', '시트러스와 말린 파인애플 슬라이스', '柑橘とドライパイナップルスライス', 'Agrumi e fetta di ananas disidratata'),
    flavours: ['fruit', 'citrus', 'spice'], tastes: ['sweet', 'sour', 'refreshing'], strength: 'strong', approachability: 'bold', profileNote: profileFruit,
  },
  {
    id: 'illegal', name: L('Illegal', '非法', 'Illegal', 'Illegal', 'Illegal', '일리걸', 'イリーガル', 'Illegal'),
    description: descSour, accent: '#A88655',
    ingredients: [
      {ingredientId: 'espadin-mezcal', amount: 30, unit: 'ml'}, {ingredientId: 'jamaican-overproof-white-rum', amount: 15, unit: 'ml'}, {ingredientId: 'falernum', amount: 15, unit: 'ml'},
      {ingredientId: 'maraschino-liqueur', amount: 1, unit: 'barspoon', brandId: 'brand-luxardo'}, {ingredientId: 'lime-juice', amount: 22.5, unit: 'ml'}, {ingredientId: 'simple-syrup', amount: 15, unit: 'ml'},
      {ingredientId: 'egg-white', amount: null, unit: 'drop', optional: true, note: L('IBA specifies a few optional drops.', 'IBA 标为可选数滴。', 'L’IBA indique quelques gouttes facultatives.', 'Die IBA nennt einige optionale Tropfen.', 'La IBA indica unas gotas opcionales.', 'IBA는 선택 사항인 몇 방울로 명시합니다.', 'IBAは任意の数滴と指定しています。', 'L’IBA indica alcune gocce facoltative.')},
    ],
    steps: S(
      ['Shake all ingredients vigorously with ice.', 'Strain into the chilled cocktail glass, or serve over ice in a traditional clay or terracotta mug.'],
      ['把所有材料加冰用力摇匀。', '滤入冰镇鸡尾酒杯，或加冰盛入传统陶杯。'],
      ['Shaker vivement tous les ingrédients avec de la glace.', 'Filtrer dans le verre froid, ou servir sur glace dans une tasse traditionnelle en terre cuite.'],
      ['Alle Zutaten kräftig mit Eis shaken.', 'In das gekühlte Cocktailglas abseihen oder auf Eis in einem traditionellen Tonbecher servieren.'],
      ['Agita con fuerza todos los ingredientes con hielo.', 'Cuela en la copa fría o sirve con hielo en una taza tradicional de barro.'],
      ['모든 재료를 얼음과 세게 흔듭니다.', '차가운 칵테일 글라스에 거르거나 전통 토기 머그에 얼음과 담습니다.'],
      ['すべての材料を氷と力強くシェイクします。', '冷やしたカクテルグラスにこすか、伝統的な陶器マグに氷と注ぎます。'],
      ['Shakerare energicamente tutti gli ingredienti con ghiaccio.', 'Filtrare nella coppetta fredda o servire su ghiaccio in una tazza tradizionale di terracotta.'],
    ),
    glass: L('Chilled cocktail glass, or clay mug over ice', '冰镇鸡尾酒杯，或加冰陶杯', 'Verre à cocktail froid, ou tasse en terre sur glace', 'Gekühltes Cocktailglas oder Tonbecher mit Eis', 'Copa fría o taza de barro con hielo', '차가운 칵테일 글라스 또는 얼음을 담은 토기 머그', '冷やしたカクテルグラス、または氷入りの陶器マグ', 'Coppetta fredda o tazza di terracotta con ghiaccio'), garnish: noGarnish,
    flavours: ['citrus', 'spice'], tastes: ['sour', 'sweet'], strength: 'strong', approachability: 'bold', profileNote: profileSpirit,
  },
  {
    id: 'irish-coffee', name: L('Irish Coffee', '爱尔兰咖啡', 'Irish Coffee', 'Irish Coffee', 'Café Irlandés', '아이리시 커피', 'アイリッシュ・コーヒー', 'Irish Coffee'),
    description: L('Hot coffee and Irish whiskey beneath a cool layer of floating cream.', '热咖啡与爱尔兰威士忌托住一层冰凉漂浮奶油。', 'Café chaud et whiskey irlandais sous une couche froide de crème flottante.', 'Heißer Kaffee und irischer Whiskey unter einer kühlen, schwimmenden Sahneschicht.', 'Café caliente y whiskey irlandés bajo una capa fría de nata flotante.', '뜨거운 커피와 아이리시 위스키 위에 차가운 크림층을 띄웁니다.', '熱いコーヒーとアイリッシュウイスキーに、冷たいクリームの層を浮かべます。', 'Caffè caldo e whiskey irlandese sotto uno strato freddo di panna galleggiante.'), accent: '#6C4936',
    ingredients: [{ingredientId: 'irish-whiskey', amount: 50, unit: 'ml'}, {ingredientId: 'hot-coffee', amount: 120, unit: 'ml'}, {ingredientId: 'cream', amount: 50, unit: 'ml', note: L('Use fresh, thick, chilled cream.', '使用新鲜、浓稠且冰镇的奶油。', 'Employer une crème fraîche, épaisse et froide.', 'Frische, dicke, gekühlte Sahne verwenden.', 'Usa nata fresca, espesa y fría.', '신선하고 진하며 차가운 크림을 사용합니다.', '新鮮で濃く冷たいクリームを使います。', 'Usare panna fresca, densa e fredda.')}, {ingredientId: 'sugar', amount: 1, unit: 'tsp', note: L('The method says at least one teaspoon.', '做法说明至少一茶匙。', 'La méthode indique au moins une cuillère à café.', 'Die Methode nennt mindestens einen Teelöffel.', 'El método indica al menos una cucharadita.', '방법에는 최소 한 티스푼이라고 적혀 있습니다.', '手順では少なくとも小さじ1としています。', 'Il metodo indica almeno un cucchiaino.')}],
    steps: S(
      ['Pour warm coffee into a preheated Irish coffee glass; add whiskey and sugar, then stir until dissolved.', 'Float thick chilled cream over the back of a spoon without mixing.'],
      ['把热咖啡倒入预热的爱尔兰咖啡杯；加入威士忌和糖并搅至溶解。', '沿勺背轻倒冰镇浓奶油，使其漂浮且不混合。'],
      ['Verser le café chaud dans un verre préchauffé ; ajouter whiskey et sucre, puis dissoudre.', 'Faire flotter la crème froide et épaisse sur le dos d’une cuillère sans mélanger.'],
      ['Warmen Kaffee in das vorgewärmte Glas geben; Whiskey und Zucker einrühren.', 'Dicke kalte Sahne über einen Löffelrücken aufschichten, ohne zu mischen.'],
      ['Vierte café caliente en el vaso precalentado; añade whiskey y azúcar y disuelve.', 'Haz flotar la nata fría y espesa sobre el dorso de una cuchara sin mezclar.'],
      ['따뜻한 커피를 데운 글라스에 붓고 위스키와 설탕을 넣어 녹을 때까지 젓습니다.', '진하고 차가운 크림을 숟가락 뒷면으로 부어 섞이지 않게 띄웁니다.'],
      ['温かいコーヒーを予熱したグラスに注ぎ、ウイスキーと砂糖を加えて溶かします。', '濃く冷たいクリームをスプーンの背から静かに注ぎ、混ぜずに浮かべます。'],
      ['Versare caffè caldo nel bicchiere preriscaldato; aggiungere whiskey e zucchero e sciogliere.', 'Far galleggiare la panna fredda e densa sul dorso di un cucchiaio senza mescolare.'],
    ),
    glass: L('Preheated Irish coffee glass', '预热爱尔兰咖啡杯', 'Verre à Irish coffee préchauffé', 'Vorgewärmtes Irish-Coffee-Glas', 'Vaso de café irlandés precalentado', '데운 아이리시 커피 글라스', '予熱したアイリッシュコーヒーグラス', 'Bicchiere da Irish coffee preriscaldato'), garnish: noGarnish,
    flavours: ['coffee'], tastes: ['bitter', 'sweet', 'creamy'], strength: 'medium', approachability: 'gentle', profileNote: profileCreamy,
  },
  {
    id: 'jungle-bird', name: L('Jungle Bird', '丛林鸟', 'Jungle Bird', 'Jungle Bird', 'Jungle Bird', '정글 버드', 'ジャングル・バード', 'Jungle Bird'),
    description: L('Blackstrap rum, pineapple, lime, and Campari make a dark tropical bittersweet sour.', '黑糖蜜朗姆、菠萝、青柠与 Campari 组成深色热带苦甜酸酒。', 'Rhum blackstrap, ananas, citron vert et Campari composent un sour tropical sombre et doux-amer.', 'Blackstrap-Rum, Ananas, Limette und Campari ergeben einen dunklen tropischen bittersüßen Sour.', 'Ron blackstrap, piña, lima y Campari forman un sour tropical oscuro y agridulce.', '블랙스트랩 럼과 파인애플, 라임, 캄파리가 짙고 열대적인 쌉싸름한 사워를 만듭니다.', 'ブラックストラップラム、パイナップル、ライム、カンパリで作る、濃色でトロピカルな甘苦いサワーです。', 'Rum blackstrap, ananas, lime e Campari formano un sour tropicale scuro e agrodolce.'), accent: '#A84E35',
    ingredients: [{ingredientId: 'blackstrap-rum', amount: 45, unit: 'ml'}, {ingredientId: 'campari', amount: 22.5, unit: 'ml', brandId: 'brand-campari'}, {ingredientId: 'pineapple-juice', amount: 45, unit: 'ml'}, {ingredientId: 'lime-juice', amount: 15, unit: 'ml'}, {ingredientId: 'demerara-syrup', amount: 15, unit: 'ml'}],
    steps: S(
      ['Shake all ingredients with ice.', 'Strain over ice into the rocks glass.'],
      ['将所有材料加冰摇匀。', '滤入装冰的岩石杯。'],
      ['Shaker tous les ingrédients avec de la glace.', 'Filtrer sur glace dans le verre rocks.'],
      ['Alle Zutaten mit Eis shaken.', 'Über Eis in das Rocks-Glas abseihen.'],
      ['Agita todos los ingredientes con hielo.', 'Cuela sobre hielo en el vaso rocks.'],
      ['모든 재료를 얼음과 흔듭니다.', '얼음을 담은 록스 글라스에 거릅니다.'],
      ['すべての材料を氷とシェイクします。', '氷入りのロックグラスにこします。'],
      ['Shakerare tutti gli ingredienti con ghiaccio.', 'Filtrare su ghiaccio nel bicchiere rocks.'],
    ),
    glass: rocksGlass, garnish: L('Pineapple wedge', '菠萝角', 'Quartier d’ananas', 'Ananasspalte', 'Gajo de piña', '파인애플 웨지', 'パイナップルウェッジ', 'Spicchio d’ananas'),
    flavours: ['fruit', 'citrus'], tastes: ['bitter', 'sweet', 'sour'], strength: 'medium', approachability: 'balanced', profileNote: profileBitter,
  },
  {
    id: 'kir', name: L('Kir', '基尔', 'Kir', 'Kir', 'Kir', '키르', 'キール', 'Kir'),
    description: descFruit, accent: '#9A445B',
    ingredients: [{ingredientId: 'dry-white-wine', amount: 90, unit: 'ml'}, {ingredientId: 'creme-de-cassis', amount: 10, unit: 'ml'}],
    steps: S(
      ['Pour crème de cassis into the glass.', 'Top with the dry white wine.'],
      ['把黑加仑利口酒倒入杯中。', '加入干白葡萄酒补足。'],
      ['Verser la crème de cassis dans le verre.', 'Compléter avec le vin blanc sec.'],
      ['Crème de Cassis in das Glas gießen.', 'Mit trockenem Weißwein auffüllen.'],
      ['Vierte la crema de cassis en el vaso.', 'Completa con vino blanco seco.'],
      ['크렘 드 카시스를 글라스에 붓습니다.', '드라이 화이트 와인으로 채웁니다.'],
      ['クレーム・ド・カシスをグラスに注ぎます。', '辛口白ワインを加えます。'],
      ['Versare la crème de cassis nel bicchiere.', 'Colmare con vino bianco secco.'],
    ),
    glass: unspecifiedGlass, garnish: noGarnish,
    flavours: ['fruit'], tastes: ['sweet', 'dry'], strength: 'low', approachability: 'gentle', profileNote: profileFruit,
  },
  {
    id: 'lemon-drop-martini', name: L('Lemon Drop Martini', '柠檬滴马天尼', 'Lemon Drop Martini', 'Lemon Drop Martini', 'Martini Lemon Drop', '레몬 드롭 마티니', 'レモン・ドロップ・マティーニ', 'Lemon Drop Martini'),
    description: descSour, accent: '#D8C447',
    ingredients: [{ingredientId: 'vodka', amount: 30, unit: 'ml'}, {ingredientId: 'triple-sec', amount: 20, unit: 'ml'}, {ingredientId: 'lemon-juice', amount: 15, unit: 'ml'}],
    steps: shakeCocktail, glass: cocktailGlass, garnish: noGarnish,
    flavours: ['citrus'], tastes: ['sour', 'sweet'], strength: 'medium', approachability: 'gentle', profileNote: profileBright,
  },
  {
    id: 'long-island-iced-tea', name: L('Long Island Iced Tea', '长岛冰茶', 'Long Island Iced Tea', 'Long Island Iced Tea', 'Té Helado Long Island', '롱 아일랜드 아이스 티', 'ロングアイランド・アイスティー', 'Long Island Iced Tea'), aliases: ['Long Island Ice Tea'],
    description: L('Five spirits, lemon, syrup, and cola make a deceptively easy-drinking highball.', '五种烈酒、柠檬、糖浆与可乐组成看似易饮的高球。', 'Cinq spiritueux, citron, sirop et cola composent un highball trompeusement facile à boire.', 'Fünf Spirituosen, Zitrone, Sirup und Cola ergeben einen überraschend leicht trinkbaren Highball.', 'Cinco destilados, limón, sirope y cola forman un highball engañosamente fácil de beber.', '다섯 가지 증류주와 레몬, 시럽, 콜라가 예상보다 편하게 넘어가는 하이볼을 만듭니다.', '5種のスピリッツ、レモン、シロップ、コーラで、一見飲みやすいハイボールに仕上げます。', 'Cinque distillati, limone, sciroppo e cola formano un highball ingannevolmente facile da bere.'), accent: '#7A5A3B',
    ingredients: [{ingredientId: 'vodka', amount: 15, unit: 'ml'}, {ingredientId: 'tequila', amount: 15, unit: 'ml'}, {ingredientId: 'neutral-white-rum', amount: 15, unit: 'ml'}, {ingredientId: 'gin', amount: 15, unit: 'ml'}, {ingredientId: 'triple-sec', amount: 15, unit: 'ml', brandId: 'brand-cointreau'}, {ingredientId: 'lemon-juice', amount: 25, unit: 'ml'}, {ingredientId: 'simple-syrup', amount: 30, unit: 'ml'}, {ingredientId: 'cola', amount: null, unit: 'top'}],
    steps: S(
      ['Build all ingredients over ice in a highball glass.', 'Stir gently.'],
      ['把所有材料直接倒入装冰的高球杯。', '轻轻搅拌。'],
      ['Verser tous les ingrédients sur glace dans un highball.', 'Remuer doucement.'],
      ['Alle Zutaten über Eis in ein Highballglas geben.', 'Vorsichtig rühren.'],
      ['Monta todos los ingredientes sobre hielo en un highball.', 'Remueve suavemente.'],
      ['모든 재료를 얼음을 담은 하이볼 글라스에 바로 붓습니다.', '부드럽게 젓습니다.'],
      ['すべての材料を氷入りのハイボールグラスに注ぎます。', '軽く混ぜます。'],
      ['Versare tutti gli ingredienti su ghiaccio in un highball.', 'Mescolare delicatamente.'],
    ),
    glass: highballGlass, garnish: L('Optional lemon slice', '可选柠檬片', 'Rondelle de citron facultative', 'Optionale Zitronenscheibe', 'Rodaja de limón opcional', '선택 사항인 레몬 슬라이스', 'お好みでレモンスライス', 'Fetta di limone facoltativa'),
    flavours: ['citrus'], tastes: ['sweet', 'sour', 'refreshing'], strength: 'strong', approachability: 'bold', profileNote: profileSpirit,
  },
  {
    id: 'martinez', name: L('Martinez', '马丁内斯', 'Martinez', 'Martinez', 'Martinez', '마르티네즈', 'マルティネス', 'Martinez'),
    description: descSpirit, accent: '#934B38',
    ingredients: [{ingredientId: 'gin', amount: 45, unit: 'ml', note: L('The source specifies London dry gin.', '来源指定伦敦干金酒。', 'La source précise un gin London dry.', 'Die Quelle nennt London Dry Gin.', 'La fuente especifica ginebra London dry.', '출처는 런던 드라이 진을 명시합니다.', '出典はロンドン・ドライ・ジンを指定しています。', 'La fonte specifica gin London dry.')}, {ingredientId: 'sweet-red-vermouth', amount: 45, unit: 'ml'}, {ingredientId: 'maraschino-liqueur', amount: 1, unit: 'barspoon', brandId: 'brand-luxardo'}, {ingredientId: 'orange-bitters', amount: 2, unit: 'dash'}],
    steps: stirCocktail, glass: cocktailGlass, garnish: lemonZest,
    flavours: ['herbal', 'citrus'], tastes: ['sweet', 'bitter', 'dry'], strength: 'strong', approachability: 'bold', profileNote: profileSpirit,
  },
  {
    id: 'mary-pickford', name: L('Mary Pickford', '玛丽·碧克馥', 'Mary Pickford', 'Mary Pickford', 'Mary Pickford', '메리 픽퍼드', 'メアリー・ピックフォード', 'Mary Pickford'),
    description: descFruit, accent: '#C46C63',
    ingredients: [{ingredientId: 'neutral-white-rum', amount: 45, unit: 'ml'}, {ingredientId: 'pineapple-juice', amount: 45, unit: 'ml'}, {ingredientId: 'maraschino-liqueur', amount: 7.5, unit: 'ml', brandId: 'brand-luxardo'}, {ingredientId: 'grenadine-syrup', amount: 5, unit: 'ml'}],
    steps: shakeCocktail, glass: cocktailGlass, garnish: noGarnish,
    flavours: ['fruit'], tastes: ['sweet', 'sour'], strength: 'medium', approachability: 'gentle', profileNote: profileFruit,
  },
  {
    id: 'mimosa', name: L('Mimosa', '含羞草', 'Mimosa', 'Mimosa', 'Mimosa', '미모사', 'ミモザ', 'Mimosa'), aliases: ["Buck's Fizz", 'Bucks Fizz'],
    description: descRefreshing, accent: '#E2B748',
    ingredients: [{ingredientId: 'orange-juice', amount: 75, unit: 'ml'}, {ingredientId: 'prosecco', amount: 75, unit: 'ml'}],
    steps: S(
      ['Pour orange juice into the flute and gently add Prosecco.', 'Stir gently.'],
      ['把橙汁倒入笛形杯，轻轻加入普罗塞克。', '轻轻搅拌。'],
      ['Verser le jus d’orange dans la flûte et ajouter doucement le Prosecco.', 'Remuer doucement.'],
      ['Orangensaft in die Flöte geben und Prosecco vorsichtig hinzufügen.', 'Vorsichtig rühren.'],
      ['Vierte el zumo de naranja en la flauta y añade Prosecco suavemente.', 'Remueve suavemente.'],
      ['오렌지 주스를 플루트에 붓고 프로세코를 부드럽게 더합니다.', '부드럽게 젓습니다.'],
      ['オレンジジュースをフルートに注ぎ、プロセッコを静かに加えます。', '軽く混ぜます。'],
      ['Versare il succo d’arancia nel flute e aggiungere delicatamente Prosecco.', 'Mescolare delicatamente.'],
    ),
    glass: fluteGlass, garnish: L('Optional orange twist', '可选橙皮卷', 'Twist d’orange facultatif', 'Optionaler Orangenzwist', 'Twist de naranja opcional', '선택 사항인 오렌지 트위스트', 'お好みでオレンジツイスト', 'Twist d’arancia facoltativo'),
    flavours: ['citrus', 'fruit'], tastes: ['sweet', 'refreshing'], strength: 'low', approachability: 'gentle', profileNote: profileRefreshing,
  },
];

export const batchC: CatalogueBatch = {
  cocktails: entries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    aliases: entry.aliases ?? [],
    category: 'classic',
    description: entry.description,
    versionIds: [`${entry.id}-iba`],
    defaultVersionId: `${entry.id}-iba`,
    accent: entry.accent,
  })),
  versions: entries.map((entry) => ({
    id: `${entry.id}-iba`,
    cocktailId: entry.id,
    label: ibaLabel,
    sourceId: `iba-${entry.id}`,
    servings: 1,
    ingredients: entry.ingredients,
    steps: entry.steps,
    originalLanguage: 'en',
    originalSteps: [...entry.steps.en],
    glass: entry.glass,
    garnish: entry.garnish,
    flavours: entry.flavours,
    tastes: entry.tastes,
    strength: entry.strength,
    approachability: entry.approachability,
    profileBasis: 'editorial',
    profileNote: entry.profileNote,
    sourceChecked: true,
    translationStatus: 'draft',
  })),
  sources: entries.map((entry) => ({
    id: `iba-${entry.id}`,
    title: `IBA — ${entry.name.en}`,
    url: `https://iba-world.com/iba-cocktail/${entry.id}/`,
    author: iba,
    checkedAt,
  })),
  ingredients,
  brands,
};
