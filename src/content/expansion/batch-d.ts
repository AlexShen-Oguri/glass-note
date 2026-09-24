import type {
  Approachability, Brand, Cocktail, Flavour, Ingredient, Localized,
  RecipeIngredient, RecipeVersion, Source, Strength, Taste,
} from '../../domain/contracts';
import {ibaLabel, L, S} from './localized';
import type {CatalogueBatch} from './types';

const checkedAt = '2026-09-05';

const ingredient = (
  id: string,
  name: Localized,
  options: Pick<Ingredient, 'base' | 'exclusionTags' | 'compositionKnown' | 'brandIds'>,
): Ingredient => ({id, name, ...options});

const known = (exclusionTags: Ingredient['exclusionTags'] = []): Pick<Ingredient, 'exclusionTags' | 'compositionKnown'> => ({exclusionTags, compositionKnown: true});
const unknown = (brandIds?: string[]): Pick<Ingredient, 'exclusionTags' | 'compositionKnown' | 'brandIds'> => ({exclusionTags: [], compositionKnown: false, brandIds});

const ingredients: Ingredient[] = [
  ingredient('peach-brandy', L('Peach brandy', '桃味白兰地利口酒', 'Brandy de pêche', 'Pfirsichbrandy', 'Brandy de melocotón', '피치 브랜디', 'ピーチブランデー', 'Brandy alla pesca'), unknown()),
  ingredient('fresh-pineapple', L('Fresh pineapple', '新鲜菠萝', 'Ananas frais', 'Frische Ananas', 'Piña fresca', '생파인애플', '生パイナップル', 'Ananas fresco'), known()),
  ingredient('grenadine-syrup', L('Grenadine syrup', '红石榴糖浆', 'Sirop de grenadine', 'Grenadinesirup', 'Granadina', '그레나딘 시럽', 'グレナデンシロップ', 'Sciroppo di granatina'), unknown()),
  ingredient('mezcal', L('Mezcal', '梅斯卡尔', 'Mezcal', 'Mezcal', 'Mezcal', '메스칼', 'メスカル', 'Mezcal'), {...known(['mezcal']), base: 'mezcal'}),
  ingredient('yellow-chartreuse', L('Yellow Chartreuse', '黄色查特酒', 'Chartreuse jaune', 'Gelbe Chartreuse', 'Chartreuse amarillo', '옐로 샤르트뢰즈', 'イエロー・シャルトリューズ', 'Chartreuse gialla'), unknown(['brand-chartreuse'])),
  ingredient('red-wine', L('Red wine', '红葡萄酒', 'Vin rouge', 'Rotwein', 'Vino tinto', '레드 와인', '赤ワイン', 'Vino rosso'), unknown()),
  ingredient('aged-rum', L('Aged rum', '陈年朗姆酒', 'Rhum vieux', 'Gereifter Rum', 'Ron añejo', '에이지드 럼', '熟成ラム', 'Rum invecchiato'), {...known(['rum']), base: 'rum'}),
  ingredient('dry-white-wine', L('Dry white wine', '干白葡萄酒', 'Vin blanc sec', 'Trockener Weißwein', 'Vino blanco seco', '드라이 화이트 와인', '辛口白ワイン', 'Vino bianco secco'), unknown()),
  ingredient('cloves', L('Cloves', '丁香', 'Clous de girofle', 'Gewürznelken', 'Clavos de olor', '정향', 'クローブ', 'Chiodi di garofano'), known()),
  ingredient('sugar-cane-juice', L('Sugar-cane juice', '甘蔗汁', 'Jus de canne à sucre', 'Zuckerrohrsaft', 'Jugo de caña de azúcar', '사탕수수 주스', 'サトウキビジュース', 'Succo di canna da zucchero'), known()),
  ingredient('vanilla-vodka', L('Vanilla vodka', '香草伏特加', 'Vodka vanille', 'Vanillewodka', 'Vodka de vainilla', '바닐라 보드카', 'バニラウォッカ', 'Vodka alla vaniglia'), {...known(['vodka']), base: 'vodka'}),
  ingredient('passion-fruit-liqueur', L('Passion-fruit liqueur', '百香果利口酒', 'Liqueur de fruit de la passion', 'Passionsfruchtlikör', 'Licor de maracuyá', '패션프루트 리큐어', 'パッションフルーツリキュール', 'Liquore al frutto della passione'), unknown()),
  ingredient('passion-fruit-puree', L('Passion-fruit purée', '百香果果泥', 'Purée de fruit de la passion', 'Passionsfruchtpüree', 'Puré de maracuyá', '패션프루트 퓌레', 'パッションフルーツピューレ', 'Purea di frutto della passione'), known()),
  ingredient('vanilla-sugar', L('Vanilla sugar', '香草糖', 'Sucre vanillé', 'Vanillezucker', 'Azúcar de vainilla', '바닐라 설탕', 'バニラシュガー', 'Zucchero vanigliato'), known()),
  ingredient('tawny-port', L('Tawny Port', '茶色波特酒', 'Porto tawny', 'Tawny Port', 'Oporto tawny', '토니 포트', 'トウニー・ポート', 'Porto tawny'), unknown()),
  ingredient('egg-yolk', L('Egg yolk', '蛋黄', 'Jaune d’œuf', 'Eigelb', 'Yema de huevo', '달걀노른자', '卵黄', 'Tuorlo'), {exclusionTags: ['egg'], compositionKnown: true}),
  ingredient('cachaca', L('Cachaça', '卡莎萨', 'Cachaça', 'Cachaça', 'Cachaça', '카샤사', 'カシャッサ', 'Cachaça'), {...known(['cachaca']), base: 'cachaca'}),
  ingredient('cynar', L('Cynar', 'Cynar 苦味酒', 'Cynar', 'Cynar', 'Cynar', '치나르', 'チナール', 'Cynar'), unknown(['brand-cynar'])),
  ingredient('orange-flower-water', L('Orange-flower water', '橙花水', 'Eau de fleur d’oranger', 'Orangenblütenwasser', 'Agua de azahar', '오렌지 플라워 워터', 'オレンジフラワーウォーター', 'Acqua di fiori d’arancio'), known()),
  ingredient('vanilla-extract', L('Vanilla extract', '香草精', 'Extrait de vanille', 'Vanilleextrakt', 'Extracto de vainilla', '바닐라 추출물', 'バニラエキス', 'Estratto di vaniglia'), unknown()),
  ingredient('creme-de-cassis', L('Crème de cassis', '黑加仑利口酒', 'Crème de cassis', 'Cassislikör', 'Crème de cassis', '크렘 드 카시스', 'クレーム・ド・カシス', 'Crème de cassis'), unknown()),
  ingredient('sparkling-wine', L('Dry sparkling wine', '干型起泡酒', 'Vin effervescent brut', 'Trockener Schaumwein', 'Vino espumoso seco', '드라이 스파클링 와인', '辛口スパークリングワイン', 'Spumante secco'), unknown()),
  ingredient('drambuie', L('Drambuie', 'Drambuie 利口酒', 'Drambuie', 'Drambuie', 'Drambuie', '드람뷔', 'ドランブイ', 'Drambuie'), unknown(['brand-drambuie'])),
  ingredient('grapefruit-juice', L('Grapefruit juice', '葡萄柚汁', 'Jus de pamplemousse', 'Grapefruitsaft', 'Zumo de pomelo', '자몽 주스', 'グレープフルーツジュース', 'Succo di pompelmo'), known()),
  ingredient('peach-schnapps', L('Peach schnapps', '桃味利口酒', 'Schnaps de pêche', 'Pfirsichschnaps', 'Licor de melocotón', '피치 슈냅스', 'ピーチシュナップス', 'Schnapps alla pesca'), unknown()),
  ingredient('amontillado-sherry', L('Amontillado sherry', '阿蒙提拉多雪莉酒', 'Xérès amontillado', 'Amontillado-Sherry', 'Jerez amontillado', '아몬티야도 셰리', 'アモンティリャード・シェリー', 'Sherry amontillado'), unknown()),
  ingredient('palo-cortado-sherry', L('Palo Cortado sherry', '帕洛科塔多雪莉酒', 'Xérès palo cortado', 'Palo-Cortado-Sherry', 'Jerez palo cortado', '팔로 코르타도 셰리', 'パロ・コルタド・シェリー', 'Sherry palo cortado'), unknown()),
  ingredient('cherry-brandy', L('Cherry brandy', '樱桃白兰地利口酒', 'Cherry brandy', 'Kirschbrandy', 'Brandy de cereza', '체리 브랜디', 'チェリーブランデー', 'Brandy alla ciliegia'), unknown(['brand-luxardo'])),
  ingredient('benedictine', L('Bénédictine', '本尼迪克丁利口酒', 'Bénédictine', 'Bénédictine', 'Bénédictine', '베네딕틴', 'ベネディクティン', 'Bénédictine'), unknown(['brand-benedictine'])),
  ingredient('elderflower-cordial', L('Elderflower cordial', '接骨木花糖浆', 'Cordial de fleur de sureau', 'Holunderblüten-Cordial', 'Cordial de flor de saúco', '엘더플라워 코디얼', 'エルダーフラワーコーディアル', 'Cordial ai fiori di sambuco'), unknown()),
  ingredient('red-chilli', L('Red chilli pepper', '红辣椒', 'Piment rouge', 'Rote Chilischote', 'Chile rojo', '홍고추', '赤唐辛子', 'Peperoncino rosso'), known()),
  ingredient('white-creme-de-menthe', L('White crème de menthe', '白色薄荷利口酒', 'Crème de menthe blanche', 'Weiße Crème de Menthe', 'Crème de menthe blanca', '화이트 크렘 드 멘트', 'ホワイト・クレーム・ド・マント', 'Crème de menthe bianca'), unknown()),
  ingredient('irish-whiskey', L('Irish whiskey', '爱尔兰威士忌', 'Whiskey irlandais', 'Irischer Whiskey', 'Whiskey irlandés', '아이리시 위스키', 'アイリッシュウイスキー', 'Whiskey irlandese'), {...known(['whiskey']), base: 'whiskey'}),
  ingredient('agave-nectar', L('Agave nectar', '龙舌兰糖浆', 'Nectar d’agave', 'Agavendicksaft', 'Néctar de agave', '아가베 넥타', 'アガベネクター', 'Nettare d’agave'), known()),
  ingredient('martinique-agricole-rhum', L('Martinique agricole rhum', '马提尼克农业朗姆', 'Rhum agricole martiniquais', 'Martinique Rhum Agricole', 'Rhum agricole de Martinica', '마르티니크 아그리콜 럼', 'マルティニーク・アグリコールラム', 'Rhum agricole della Martinica'), {...known(['rum']), base: 'rum'}),
  ingredient('blended-aged-rum', L('Blended aged rum', '调和陈年朗姆', 'Rhum vieux assemblé', 'Verschnittener gereifter Rum', 'Ron añejo mezclado', '블렌디드 에이지드 럼', 'ブレンデッド熟成ラム', 'Rum invecchiato blended'), {...known(['rum']), base: 'rum'}),
  ingredient('falernum', L('Falernum', '法勒纳姆利口酒', 'Falernum', 'Falernum', 'Falernum', '팔레넘', 'ファレナム', 'Falernum'), unknown()),
  ingredient('allspice-dram', L('Allspice dram', '多香果利口酒', 'Liqueur de piment de la Jamaïque', 'Pimentlikör', 'Licor de pimienta de Jamaica', '올스파이스 드람', 'オールスパイス・ドラム', 'Liquore al pimento'), unknown(['brand-st-elizabeth'])),
  ingredient('grappa', L('White grappa', '白格拉帕', 'Grappa blanche', 'Weißer Grappa', 'Grappa blanca', '화이트 그라파', 'ホワイトグラッパ', 'Grappa bianca'), {...known(['grappa']), base: 'grappa'}),
  ingredient('chamomile-cordial', L('Chamomile cordial', '洋甘菊糖浆', 'Cordial de camomille', 'Kamillen-Cordial', 'Cordial de manzanilla', '캐모마일 코디얼', 'カモミールコーディアル', 'Cordial alla camomilla'), unknown()),
  ingredient('lillet-blanc', L('Lillet Blanc', '白丽叶酒', 'Lillet Blanc', 'Lillet Blanc', 'Lillet Blanc', '릴레 블랑', 'リレ・ブラン', 'Lillet Blanc'), unknown(['brand-lillet'])),
  ingredient('puerto-rican-rum', L('Gold Puerto Rican rum', '金色波多黎各朗姆', 'Rhum portoricain doré', 'Goldener puerto-ricanischer Rum', 'Ron dorado puertorriqueño', '골드 푸에르토리코 럼', 'ゴールド・プエルトリコラム', 'Rum portoricano dorato'), {...known(['rum']), base: 'rum'}),
  ingredient('demerara-rum', L('Demerara rum', '德梅拉拉朗姆', 'Rhum Demerara', 'Demerara-Rum', 'Ron Demerara', '데메라라 럼', 'デメラララム', 'Rum Demerara'), {...known(['rum']), base: 'rum'}),
  ingredient('donns-mix', L("Donn’s Mix", 'Donn’s Mix 预调液', "Donn’s Mix", "Donn’s Mix", "Donn’s Mix", '돈스 믹스', 'ドンズ・ミックス', "Donn’s Mix"), unknown()),
  ingredient('pernod', L('Pernod', '培诺茴香酒', 'Pernod', 'Pernod', 'Pernod', '페르노', 'ペルノ', 'Pernod'), unknown(['brand-pernod'])),
  ingredient('apricot-brandy', L('Apricot brandy', '杏味白兰地利口酒', 'Brandy d’abricot', 'Aprikosenbrandy', 'Brandy de albaricoque', '애프리콧 브랜디', 'アプリコットブランデー', 'Brandy all’albicocca'), unknown()),
  ingredient('orange-wheel', L('Orange wheel', '橙片', 'Rondelle d’orange', 'Orangenscheibe', 'Rueda de naranja', '오렌지 휠', 'オレンジホイール', 'Ruota d’arancia'), known()),
  ingredient('lemon-wheel', L('Lemon wheel', '柠檬片', 'Rondelle de citron', 'Zitronenscheibe', 'Rueda de limón', '레몬 휠', 'レモンホイール', 'Ruota di limone'), known()),
  ingredient('orange-bitters', L('Orange bitters', '橙味苦精', 'Bitters à l’orange', 'Orange Bitters', 'Bitters de naranja', '오렌지 비터스', 'オレンジビターズ', 'Bitter all’arancia'), unknown()),
];

const brands: Brand[] = [
  {id: 'brand-chartreuse', name: 'Chartreuse', ingredientIds: ['yellow-chartreuse']},
  {id: 'brand-luxardo', name: 'Luxardo', ingredientIds: ['cherry-brandy']},
  {id: 'brand-cinzano', name: 'Cinzano', ingredientIds: ['sweet-red-vermouth']},
  {id: 'brand-cynar', name: 'Cynar', ingredientIds: ['cynar']},
  {id: 'brand-monin', name: 'Monin', ingredientIds: ['honey-syrup']},
  {id: 'brand-st-elizabeth', name: 'St Elizabeth', ingredientIds: ['allspice-dram']},
  {id: 'brand-lillet', name: 'Lillet', ingredientIds: ['lillet-blanc']},
  {id: 'brand-drambuie', name: 'Drambuie', ingredientIds: ['drambuie']},
  {id: 'brand-pernod', name: 'Pernod', ingredientIds: ['pernod']},
  {id: 'brand-benedictine', name: 'Bénédictine', ingredientIds: ['benedictine']},
];

interface ProfileRecord {
  id: string;
  name: Localized;
  aliases?: string[];
  accent: string;
  profile: Localized;
  flavours: Flavour[];
  tastes: Taste[];
  strength: Strength;
  approachability: Approachability;
}

const profiles: ProfileRecord[] = [
  {id: 'missionarys-downfall', name: L("Missionary’s Downfall", '传教士的覆灭', "Missionary’s Downfall", "Missionary’s Downfall", "Missionary’s Downfall", '미셔너리스 다운폴', 'ミッショナリーズ・ダウンフォール', "Missionary’s Downfall"), accent: '#8AA567', profile: L('Rum, peach, pineapple, honey, and mint in a frozen tropical mix.', '朗姆、桃、菠萝、蜂蜜与薄荷组成的冰沙式热带混合。', 'Rhum, pêche, ananas, miel et menthe en mélange tropical glacé.', 'Rum, Pfirsich, Ananas, Honig und Minze als tropischer Frozen Drink.', 'Ron, melocotón, piña, miel y menta en una mezcla tropical helada.', '럼, 복숭아, 파인애플, 꿀, 민트가 어우러진 프로즌 트로피컬 드링크.', 'ラム、桃、パイナップル、蜂蜜、ミントのフローズン・トロピカルドリンク。', 'Rum, pesca, ananas, miele e menta in un mix tropicale ghiacciato.'), flavours: ['fruit','herbal'], tastes: ['sweet','sour','refreshing'], strength: 'medium', approachability: 'gentle'},
  {id: 'monkey-gland', name: L('Monkey Gland', '猴腺', 'Monkey Gland', 'Monkey Gland', 'Monkey Gland', '몽키 글랜드', 'モンキー・グランド', 'Monkey Gland'), accent: '#D3753B', profile: L('Gin and orange with sweet grenadine and an anise edge.', '金酒与橙汁配上甜石榴糖浆和茴香气息。', 'Gin et orange, grenadine douce et pointe anisée.', 'Gin und Orange mit süßer Grenadine und Aniskante.', 'Ginebra y naranja con granadina dulce y un toque anisado.', '진과 오렌지에 달콤한 그레나딘과 아니스 향을 더합니다.', 'ジンとオレンジに甘いグレナデンとアニスの輪郭を添えます。', 'Gin e arancia con granatina dolce e un bordo d’anice.'), flavours: ['fruit','herbal'], tastes: ['sweet','dry'], strength: 'strong', approachability: 'bold'},
  {id: 'naked-and-famous', name: L('Naked and Famous', '赤裸与名望', 'Naked and Famous', 'Naked and Famous', 'Naked and Famous', '네이키드 앤 페이머스', 'ネイキッド・アンド・フェイマス', 'Naked and Famous'), accent: '#E4803D', profile: L('Smoky mezcal meets yellow Chartreuse, Aperol, and lime.', '烟熏梅斯卡尔与黄色查特、阿佩罗和青柠相遇。', 'Le mezcal fumé rencontre Chartreuse jaune, Aperol et citron vert.', 'Rauchiger Mezcal trifft gelbe Chartreuse, Aperol und Limette.', 'Mezcal ahumado con Chartreuse amarillo, Aperol y lima.', '스모키한 메스칼에 옐로 샤르트뢰즈, 아페롤, 라임을 맞춥니다.', 'スモーキーなメスカルにイエロー・シャルトリューズ、アペロール、ライム。', 'Mezcal affumicato con Chartreuse gialla, Aperol e lime.'), flavours: ['citrus','herbal','spice'], tastes: ['sour','bitter'], strength: 'strong', approachability: 'bold'},
  {id: 'new-york-sour', name: L('New York Sour', '纽约酸', 'New York Sour', 'New York Sour', 'New York Sour', '뉴욕 사워', 'ニューヨーク・サワー', 'New York Sour'), accent: '#8D3042', profile: L('A rye-and-lemon sour finished with a floating layer of red wine.', '黑麦威士忌柠檬酸酒上覆一层红葡萄酒。', 'Un sour seigle-citron coiffé d’une couche de vin rouge.', 'Ein Rye-Zitronen-Sour mit einer Schicht Rotwein.', 'Un sour de centeno y limón coronado con vino tinto.', '라이 위스키와 레몬 사워 위에 레드 와인을 띄웁니다.', 'ライとレモンのサワーに赤ワインを浮かべます。', 'Un sour di rye e limone rifinito con uno strato di vino rosso.'), flavours: ['citrus','fruit'], tastes: ['sour','sweet','dry'], strength: 'strong', approachability: 'balanced'},
  {id: 'old-cuban', name: L('Old Cuban', '老古巴', 'Old Cuban', 'Old Cuban', 'Old Cuban', '올드 쿠반', 'オールド・キューバン', 'Old Cuban'), accent: '#B99A55', profile: L('Aged rum, mint, lime, bitters, and dry sparkling wine.', '陈年朗姆、薄荷、青柠、苦精与干型起泡酒。', 'Rhum vieux, menthe, citron vert, bitters et vin effervescent brut.', 'Gereifter Rum, Minze, Limette, Bitters und trockener Schaumwein.', 'Ron añejo, menta, lima, bitters y espumoso seco.', '에이지드 럼, 민트, 라임, 비터스, 드라이 스파클링 와인.', '熟成ラム、ミント、ライム、ビターズ、辛口スパークリングワイン。', 'Rum invecchiato, menta, lime, bitter e spumante secco.'), flavours: ['citrus','herbal'], tastes: ['sour','sweet','refreshing'], strength: 'medium', approachability: 'balanced'},
  {id: 'paradise', name: L('Paradise', '天堂', 'Paradise', 'Paradise', 'Paradise', '파라다이스', 'パラダイス', 'Paradise'), accent: '#DEA34C', profile: L('Gin, apricot brandy, and orange in a compact fruit-led classic.', '金酒、杏味白兰地与橙汁组成紧凑果香经典。', 'Gin, brandy d’abricot et orange dans un classique fruité et compact.', 'Gin, Aprikosenbrandy und Orange in einem kompakten Fruchtklassiker.', 'Ginebra, brandy de albaricoque y naranja en un clásico frutal.', '진, 애프리콧 브랜디, 오렌지가 만든 응축된 과일 클래식.', 'ジン、アプリコットブランデー、オレンジの凝縮したフルーツクラシック。', 'Gin, brandy all’albicocca e arancia in un classico fruttato compatto.'), flavours: ['fruit'], tastes: ['sweet','dry'], strength: 'strong', approachability: 'balanced'},
  {id: 'pisco-punch', name: L('Pisco Punch', '皮斯科宾治', 'Pisco Punch', 'Pisco Punch', 'Pisco Punch', '피스코 펀치', 'ピスコ・パンチ', 'Pisco Punch'), accent: '#D5B258', profile: L('Pisco, pineapple, lemon, white wine, and clove.', '皮斯科、菠萝、柠檬、白葡萄酒与丁香。', 'Pisco, ananas, citron, vin blanc et girofle.', 'Pisco, Ananas, Zitrone, Weißwein und Nelke.', 'Pisco, piña, limón, vino blanco y clavo.', '피스코, 파인애플, 레몬, 화이트 와인, 정향.', 'ピスコ、パイナップル、レモン、白ワイン、クローブ。', 'Pisco, ananas, limone, vino bianco e chiodi di garofano.'), flavours: ['fruit','citrus','spice'], tastes: ['sour','sweet'], strength: 'medium', approachability: 'balanced'},
  {id: 'planters-punch', name: L('Planters Punch', '种植园宾治', 'Planters Punch', 'Planters Punch', 'Planters Punch', '플랜터스 펀치', 'プランターズ・パンチ', 'Planters Punch'), accent: '#A55B35', profile: L('Jamaican rum, lime, and sugar-cane juice with adjustable dilution.', '牙买加朗姆、青柠与甘蔗汁，可按口味稀释。', 'Rhum jamaïcain, citron vert et jus de canne, à diluer selon le goût.', 'Jamaikanischer Rum, Limette und Zuckerrohrsaft mit freier Verdünnung.', 'Ron jamaicano, lima y jugo de caña con dilución al gusto.', '자메이카 럼, 라임, 사탕수수 주스에 원하는 만큼 희석을 더합니다.', 'ジャマイカンラム、ライム、サトウキビジュースを好みで希釈。', 'Rum giamaicano, lime e succo di canna con diluizione a piacere.'), flavours: ['citrus','fruit'], tastes: ['sour','sweet','refreshing'], strength: 'medium', approachability: 'bold'},
  {id: 'porn-star-martini', name: L('Porn Star Martini', '色情明星马天尼', 'Porn Star Martini', 'Porn Star Martini', 'Porn Star Martini', '폰 스타 마티니', 'ポーンスター・マティーニ', 'Porn Star Martini'), accent: '#F0A42B', profile: L('Vanilla vodka and passion fruit with Champagne served alongside.', '香草伏特加与百香果，另配一杯香槟。', 'Vodka vanille et fruit de la passion, avec Champagne à côté.', 'Vanillewodka und Passionsfrucht mit Champagne separat.', 'Vodka de vainilla y maracuyá con Champagne aparte.', '바닐라 보드카와 패션프루트에 샴페인을 곁들입니다.', 'バニラウォッカとパッションフルーツにシャンパンを添えます。', 'Vodka alla vaniglia e frutto della passione con Champagne a parte.'), flavours: ['fruit','floral'], tastes: ['sweet','sour'], strength: 'medium', approachability: 'gentle'},
  {id: 'porto-flip', name: L('Porto Flip', '波特翻转', 'Porto Flip', 'Porto Flip', 'Porto Flip', '포르토 플립', 'ポルト・フリップ', 'Porto Flip'), accent: '#71333D', profile: L('Tawny Port, brandy, and egg yolk under fresh nutmeg.', '茶色波特、白兰地与蛋黄，上覆现磨肉豆蔻。', 'Porto tawny, brandy et jaune d’œuf sous la muscade fraîche.', 'Tawny Port, Brandy und Eigelb unter frischem Muskat.', 'Oporto tawny, brandy y yema bajo nuez moscada fresca.', '토니 포트, 브랜디, 달걀노른자 위에 육두구를 갈아 올립니다.', 'トウニー・ポート、ブランデー、卵黄にナツメグを重ねます。', 'Porto tawny, brandy e tuorlo sotto noce moscata fresca.'), flavours: ['fruit','spice'], tastes: ['sweet','creamy'], strength: 'medium', approachability: 'gentle'},
  {id: 'rabo-de-galo', name: L('Rabo de Galo', '公鸡尾', 'Rabo de Galo', 'Rabo de Galo', 'Rabo de Galo', '하보 지 갈루', 'ハボ・ジ・ガロ', 'Rabo de Galo'), accent: '#8B3C2F', profile: L('Cachaça, sweet vermouth, Cynar, and optional aromatic bitters.', '卡莎萨、甜味美思、Cynar 与可选芳香苦精。', 'Cachaça, vermouth doux, Cynar et bitters aromatiques facultatifs.', 'Cachaça, süßer Wermut, Cynar und optionale Aromatic Bitters.', 'Cachaça, vermut dulce, Cynar y bitters aromáticos opcionales.', '카샤사, 스위트 베르무트, 치나르, 선택 가능한 아로마틱 비터스.', 'カシャッサ、スイートベルモット、チナール、任意のアロマティックビターズ。', 'Cachaça, vermouth dolce, Cynar e bitter aromatici facoltativi.'), flavours: ['herbal','spice'], tastes: ['bitter','sweet'], strength: 'strong', approachability: 'bold'},
  {id: 'ramos-fizz', name: L('Ramos Fizz', '拉莫斯金菲士', 'Ramos Fizz', 'Ramos Fizz', 'Ramos Fizz', '라모스 피즈', 'ラモス・フィズ', 'Ramos Fizz'), accent: '#E5DDC4', profile: L('Gin, two citruses, cream, egg white, florals, vanilla, and soda.', '金酒、双柑橘、奶油、蛋白、花香、香草与苏打。', 'Gin, deux agrumes, crème, blanc d’œuf, fleurs, vanille et soda.', 'Gin, zwei Zitrusfrüchte, Sahne, Eiweiß, Blüten, Vanille und Soda.', 'Ginebra, dos cítricos, nata, clara, flores, vainilla y soda.', '진, 두 시트러스, 크림, 달걀흰자, 꽃향, 바닐라, 소다.', 'ジン、2種の柑橘、クリーム、卵白、花、バニラ、ソーダ。', 'Gin, due agrumi, panna, albume, fiori, vaniglia e soda.'), flavours: ['citrus','floral'], tastes: ['sour','sweet','creamy','refreshing'], strength: 'medium', approachability: 'gentle'},
  {id: 'remember-the-maine', name: L('Remember the Maine', '缅因号铭记', 'Remember the Maine', 'Remember the Maine', 'Remember the Maine', '리멤버 더 메인', 'リメンバー・ザ・メイン', 'Remember the Maine'), accent: '#6E342F', profile: L('Rye, sweet vermouth, cherry brandy, and an absinthe rinse.', '黑麦威士忌、甜味美思、樱桃白兰地与苦艾酒洗杯。', 'Seigle, vermouth doux, cherry brandy et rinçage à l’absinthe.', 'Rye, süßer Wermut, Kirschbrandy und Absinth-Rinse.', 'Centeno, vermut dulce, brandy de cereza y enjuague de absenta.', '라이, 스위트 베르무트, 체리 브랜디, 압생트 린스.', 'ライ、スイートベルモット、チェリーブランデー、アブサンリンス。', 'Rye, vermouth dolce, brandy alla ciliegia e risciacquo d’assenzio.'), flavours: ['fruit','herbal','spice'], tastes: ['sweet','dry','bitter'], strength: 'strong', approachability: 'bold'},
  {id: 'russian-spring-punch', name: L('Russian Spring Punch', '俄罗斯春日宾治', 'Russian Spring Punch', 'Russian Spring Punch', 'Russian Spring Punch', '러시안 스프링 펀치', 'ロシアン・スプリング・パンチ', 'Russian Spring Punch'), accent: '#9D355C', profile: L('Vodka, lemon, blackcurrant, and sparkling wine over ice.', '伏特加、柠檬、黑加仑与起泡酒加冰饮用。', 'Vodka, citron, cassis et vin effervescent sur glace.', 'Wodka, Zitrone, Cassis und Schaumwein auf Eis.', 'Vodka, limón, cassis y espumoso con hielo.', '보드카, 레몬, 카시스, 스파클링 와인을 얼음 위에.', 'ウォッカ、レモン、カシス、スパークリングワインを氷と。', 'Vodka, limone, cassis e spumante su ghiaccio.'), flavours: ['fruit','citrus'], tastes: ['sour','sweet','refreshing'], strength: 'low', approachability: 'gentle'},
  {id: 'rusty-nail', name: L('Rusty Nail', '锈钉', 'Rusty Nail', 'Rusty Nail', 'Rusty Nail', '러스티 네일', 'ラスティ・ネイル', 'Rusty Nail'), accent: '#8A5A2F', profile: L('Scotch whisky and honeyed herbal Drambuie over ice.', '苏格兰威士忌与蜜香草本 Drambuie 加冰。', 'Whisky écossais et Drambuie miellé aux herbes sur glace.', 'Scotch Whisky und honig-kräuteriger Drambuie auf Eis.', 'Whisky escocés y Drambuie meloso y herbal con hielo.', '스카치위스키와 꿀·허브 향의 드람뷔를 얼음 위에.', 'スコッチと蜂蜜やハーブ香るドランブイを氷と。', 'Scotch whisky e Drambuie mielato ed erbaceo con ghiaccio.'), flavours: ['spice','herbal'], tastes: ['sweet'], strength: 'strong', approachability: 'bold'},
  {id: 'sea-breeze', name: L('Sea Breeze', '海风', 'Sea Breeze', 'Sea Breeze', 'Sea Breeze', '시 브리즈', 'シーブリーズ', 'Sea Breeze'), accent: '#C65369', profile: L('Vodka, cranberry, and grapefruit in a tall fruit cooler.', '伏特加、蔓越莓与葡萄柚组成高杯果味清饮。', 'Vodka, cranberry et pamplemousse dans un long drink fruité.', 'Wodka, Cranberry und Grapefruit als fruchtiger Longdrink.', 'Vodka, arándano y pomelo en un trago largo frutal.', '보드카, 크랜베리, 자몽의 과일 하이볼.', 'ウォッカ、クランベリー、グレープフルーツのフルーツロングドリンク。', 'Vodka, cranberry e pompelmo in un long drink fruttato.'), flavours: ['fruit'], tastes: ['sour','refreshing'], strength: 'low', approachability: 'gentle'},
  {id: 'sex-on-the-beach', name: L('Sex on the Beach', '性感海滩', 'Sex on the Beach', 'Sex on the Beach', 'Sex on the Beach', '섹스 온 더 비치', 'セックス・オン・ザ・ビーチ', 'Sex on the Beach'), accent: '#EE754A', profile: L('Vodka, peach, orange, and cranberry in a juicy highball.', '伏特加、桃、橙与蔓越莓组成多汁高球。', 'Vodka, pêche, orange et cranberry dans un highball juteux.', 'Wodka, Pfirsich, Orange und Cranberry als saftiger Highball.', 'Vodka, melocotón, naranja y arándano en un highball jugoso.', '보드카, 복숭아, 오렌지, 크랜베리의 주시한 하이볼.', 'ウォッカ、桃、オレンジ、クランベリーのジューシーなハイボール。', 'Vodka, pesca, arancia e cranberry in un highball succoso.'), flavours: ['fruit'], tastes: ['sweet','refreshing'], strength: 'low', approachability: 'gentle'},
  {id: 'sherry-cobbler', name: L('Sherry Cobbler', '雪莉考伯乐', 'Sherry Cobbler', 'Sherry Cobbler', 'Sherry Cobbler', '셰리 코블러', 'シェリー・コブラー', 'Sherry Cobbler'), accent: '#A85A3F', profile: L('Two dry sherries, sugar, citrus wheels, berries, and crushed ice.', '两种干型雪莉、糖、柑橘片、莓果与碎冰。', 'Deux xérès secs, sucre, agrumes, baies et glace pilée.', 'Zwei trockene Sherrys, Zucker, Zitrusräder, Beeren und Crushed Ice.', 'Dos jereces secos, azúcar, cítricos, bayas y hielo picado.', '두 드라이 셰리, 설탕, 시트러스, 베리, 크러시드 아이스.', '2種の辛口シェリー、砂糖、柑橘、ベリー、クラッシュドアイス。', 'Due sherry secchi, zucchero, agrumi, frutti di bosco e ghiaccio tritato.'), flavours: ['fruit','citrus'], tastes: ['sweet','refreshing'], strength: 'low', approachability: 'gentle'},
  {id: 'singapore-sling', name: L('Singapore Sling', '新加坡司令', 'Singapore Sling', 'Singapore Sling', 'Singapore Sling', '싱가포르 슬링', 'シンガポール・スリング', 'Singapore Sling'), accent: '#D34B5D', profile: L('Gin layered with cherry, herbs, pineapple, lime, and grenadine.', '金酒叠加樱桃、草本、菠萝、青柠与石榴糖浆。', 'Gin avec cerise, herbes, ananas, citron vert et grenadine.', 'Gin mit Kirsche, Kräutern, Ananas, Limette und Grenadine.', 'Ginebra con cereza, hierbas, piña, lima y granadina.', '진에 체리, 허브, 파인애플, 라임, 그레나딘을 겹칩니다.', 'ジンにチェリー、ハーブ、パイナップル、ライム、グレナデン。', 'Gin con ciliegia, erbe, ananas, lime e granatina.'), flavours: ['fruit','citrus','herbal'], tastes: ['sweet','sour'], strength: 'medium', approachability: 'balanced'},
  {id: 'south-side', name: L('South Side', '南区', 'South Side', 'South Side', 'South Side', '사우스 사이드', 'サウスサイド', 'South Side'), accent: '#86A469', profile: L('London dry gin, lemon, mint, and syrup; egg white is optional.', '伦敦干金酒、柠檬、薄荷与糖浆，可选蛋白。', 'Gin London dry, citron, menthe et sirop ; blanc d’œuf facultatif.', 'London Dry Gin, Zitrone, Minze und Sirup; Eiweiß optional.', 'Ginebra London dry, limón, menta y almíbar; clara opcional.', '런던 드라이 진, 레몬, 민트, 시럽에 달걀흰자는 선택 사항.', 'ロンドンドライジン、レモン、ミント、シロップ。卵白は任意。', 'London dry gin, limone, menta e sciroppo; albume facoltativo.'), flavours: ['citrus','herbal'], tastes: ['sour','sweet','refreshing'], strength: 'strong', approachability: 'balanced'},
  {id: 'spicy-fifty', name: L('Spicy Fifty', '辛辣五十', 'Spicy Fifty', 'Spicy Fifty', 'Spicy Fifty', '스파이시 피프티', 'スパイシー・フィフティ', 'Spicy Fifty'), accent: '#B8B05D', profile: L('Vanilla vodka, elderflower, lime, honey, and red chilli.', '香草伏特加、接骨木花、青柠、蜂蜜与红辣椒。', 'Vodka vanille, fleur de sureau, citron vert, miel et piment rouge.', 'Vanillewodka, Holunderblüte, Limette, Honig und rote Chili.', 'Vodka de vainilla, saúco, lima, miel y chile rojo.', '바닐라 보드카, 엘더플라워, 라임, 꿀, 홍고추.', 'バニラウォッカ、エルダーフラワー、ライム、蜂蜜、赤唐辛子。', 'Vodka alla vaniglia, sambuco, lime, miele e peperoncino.'), flavours: ['citrus','floral','spice'], tastes: ['sour','sweet'], strength: 'medium', approachability: 'bold'},
  {id: 'stinger', name: L('Stinger', '毒刺', 'Stinger', 'Stinger', 'Stinger', '스팅어', 'スティンガー', 'Stinger'), accent: '#D9E0C5', profile: L('Cognac and white mint liqueur in a cold, spirit-led duet.', '干邑与白色薄荷利口酒组成冰冷而酒体突出的二重奏。', 'Cognac et liqueur de menthe blanche en duo froid et spiritueux.', 'Cognac und weißer Minzlikör als kaltes, kräftiges Duo.', 'Coñac y licor de menta blanco en un dúo frío y espirituoso.', '코냑과 화이트 민트 리큐어의 차갑고 도수감 있는 듀엣.', 'コニャックとホワイトミントリキュールの冷たく力強いデュオ。', 'Cognac e liquore alla menta bianca in un duo freddo e deciso.'), flavours: ['herbal'], tastes: ['sweet'], strength: 'strong', approachability: 'bold'},
  {id: 'suffering-bastard', name: L('Suffering Bastard', '受难者', 'Suffering Bastard', 'Suffering Bastard', 'Suffering Bastard', '서퍼링 바스타드', 'サファリング・バスタード', 'Suffering Bastard'), accent: '#B58C47', profile: L('Brandy and gin lengthened with lime, bitters, and ginger beer.', '白兰地与金酒以青柠、苦精和姜汁啤酒延展。', 'Brandy et gin allongés de citron vert, bitters et ginger beer.', 'Brandy und Gin, verlängert mit Limette, Bitters und Ginger Beer.', 'Brandy y ginebra alargados con lima, bitters y cerveza de jengibre.', '브랜디와 진을 라임, 비터스, 진저 비어로 길게 펼칩니다.', 'ブランデーとジンをライム、ビターズ、ジンジャービアで伸ばします。', 'Brandy e gin allungati con lime, bitter e ginger beer.'), flavours: ['citrus','spice'], tastes: ['sour','refreshing'], strength: 'medium', approachability: 'bold'},
  {id: 'tequila-sunrise', name: L('Tequila Sunrise', '龙舌兰日出', 'Tequila Sunrise', 'Tequila Sunrise', 'Tequila Sunrise', '테킬라 선라이즈', 'テキーラ・サンライズ', 'Tequila Sunrise'), accent: '#EE7F36', profile: L('Tequila and orange with an unstirred grenadine sunrise.', '龙舌兰与橙汁中落入未搅拌的石榴糖浆日出层。', 'Tequila et orange avec un lever de grenadine non remué.', 'Tequila und Orange mit ungerührtem Grenadine-Sonnenaufgang.', 'Tequila y naranja con un amanecer de granadina sin remover.', '테킬라와 오렌지에 젓지 않은 그레나딘 선라이즈 층.', 'テキーラとオレンジに、混ぜないグレナデンのサンライズ。', 'Tequila e arancia con un’alba di granatina non mescolata.'), flavours: ['fruit'], tastes: ['sweet','refreshing'], strength: 'medium', approachability: 'gentle'},
  {id: 'three-dots-and-a-dash', name: L('Three Dots and a Dash', '三点一线', 'Three Dots and a Dash', 'Three Dots and a Dash', 'Three Dots and a Dash', '쓰리 닷츠 앤 어 대시', 'スリー・ドッツ・アンド・ア・ダッシュ', 'Three Dots and a Dash'), accent: '#9F5D32', profile: L('Two rums with falernum, allspice, citrus, honey, and bitters.', '两种朗姆配法勒纳姆、多香果、柑橘、蜂蜜与苦精。', 'Deux rhums avec falernum, piment, agrumes, miel et bitters.', 'Zwei Rums mit Falernum, Piment, Zitrus, Honig und Bitters.', 'Dos rones con falernum, pimienta de Jamaica, cítricos, miel y bitters.', '두 럼에 팔레넘, 올스파이스, 시트러스, 꿀, 비터스.', '2種のラムにファレナム、オールスパイス、柑橘、蜂蜜、ビターズ。', 'Due rum con falernum, pimento, agrumi, miele e bitter.'), flavours: ['fruit','citrus','spice'], tastes: ['sour','sweet'], strength: 'strong', approachability: 'bold'},
  {id: 'tipperary', name: L('Tipperary', '蒂珀雷里', 'Tipperary', 'Tipperary', 'Tipperary', '티퍼레리', 'ティペラリー', 'Tipperary'), accent: '#5E4E2B', profile: L('Irish whiskey, sweet vermouth, green Chartreuse, and bitters.', '爱尔兰威士忌、甜味美思、绿色查特与苦精。', 'Whiskey irlandais, vermouth doux, Chartreuse verte et bitters.', 'Irischer Whiskey, süßer Wermut, grüne Chartreuse und Bitters.', 'Whiskey irlandés, vermut dulce, Chartreuse verde y bitters.', '아이리시 위스키, 스위트 베르무트, 그린 샤르트뢰즈, 비터스.', 'アイリッシュウイスキー、スイートベルモット、グリーン・シャルトリューズ、ビターズ。', 'Whiskey irlandese, vermouth dolce, Chartreuse verde e bitter.'), flavours: ['herbal','spice'], tastes: ['sweet','bitter','dry'], strength: 'strong', approachability: 'bold'},
  {id: 'tommys-margarita', name: L("Tommy’s Margarita", '汤米玛格丽特', "Margarita de Tommy", "Tommy’s Margarita", "Margarita de Tommy", '토미스 마가리타', 'トミーズ・マルガリータ', "Tommy’s Margarita"), accent: '#B6A547', profile: L('Agave tequila, lime, and agave nectar in a direct sour.', '百分百龙舌兰特基拉、青柠与龙舌兰糖浆组成直接酸酒。', 'Tequila 100 % agave, citron vert et nectar d’agave en sour direct.', '100%-Agave-Tequila, Limette und Agavendicksaft als direkter Sour.', 'Tequila 100 % agave, lima y néctar de agave en un sour directo.', '100% 아가베 테킬라, 라임, 아가베 넥타의 직선적인 사워.', '100％アガベテキーラ、ライム、アガベネクターのストレートなサワー。', 'Tequila 100% agave, lime e nettare d’agave in un sour diretto.'), flavours: ['citrus'], tastes: ['sour','sweet'], strength: 'strong', approachability: 'balanced'},
  {id: 'trinidad-sour', name: L('Trinidad Sour', '特立尼达酸', 'Trinidad Sour', 'Trinidad Sour', 'Trinidad Sour', '트리니다드 사워', 'トリニダード・サワー', 'Trinidad Sour'), accent: '#9C3F2F', profile: L('A large measure of aromatic bitters with orgeat, lemon, and rye.', '大量芳香苦精配杏仁糖浆、柠檬与黑麦威士忌。', 'Une forte mesure de bitters aromatiques avec orgeat, citron et seigle.', 'Eine große Menge Aromatic Bitters mit Orgeat, Zitrone und Rye.', 'Una medida amplia de bitters aromáticos con orgeat, limón y centeno.', '많은 아로마틱 비터스에 오르자, 레몬, 라이를 더합니다.', 'たっぷりのアロマティックビターズにオルジェ、レモン、ライ。', 'Una dose generosa di bitter aromatici con orzata, limone e rye.'), flavours: ['spice','citrus'], tastes: ['bitter','sour','sweet'], strength: 'strong', approachability: 'bold'},
  {id: 'tuxedo', name: L('Tuxedo', '礼服', 'Tuxedo', 'Tuxedo', 'Tuxedo', '턱시도', 'タキシード', 'Tuxedo'), accent: '#C7BE9C', profile: L('Old Tom gin and dry vermouth accented with maraschino, absinthe, and orange bitters.', '老汤姆金酒与干味美思，以马拉斯奇诺、苦艾和橙味苦精点缀。', 'Old Tom gin et vermouth sec, marasquin, absinthe et bitters orange.', 'Old Tom Gin und trockener Wermut mit Maraschino, Absinth und Orange Bitters.', 'Old Tom gin y vermut seco con maraschino, absenta y bitters de naranja.', '올드 톰 진과 드라이 베르무트에 마라스키노, 압생트, 오렌지 비터스.', 'オールドトムジンとドライベルモットにマラスキーノ、アブサン、オレンジビターズ。', 'Old Tom gin e vermouth dry con maraschino, assenzio e bitter all’arancia.'), flavours: ['herbal'], tastes: ['dry','bitter'], strength: 'strong', approachability: 'bold'},
  {id: 've-n-to', name: L('Ve.N.To', '威内托', 'Ve.N.To', 'Ve.N.To', 'Ve.N.To', '베엔토', 'ヴェント', 'Ve.N.To'), accent: '#D7C879', profile: L('White grappa, lemon, honey, chamomile, and optional egg white.', '白格拉帕、柠檬、蜂蜜、洋甘菊与可选蛋白。', 'Grappa blanche, citron, miel, camomille et blanc d’œuf facultatif.', 'Weißer Grappa, Zitrone, Honig, Kamille und optional Eiweiß.', 'Grappa blanca, limón, miel, manzanilla y clara opcional.', '화이트 그라파, 레몬, 꿀, 캐모마일, 선택 가능한 달걀흰자.', 'ホワイトグラッパ、レモン、蜂蜜、カモミール、任意の卵白。', 'Grappa bianca, limone, miele, camomilla e albume facoltativo.'), flavours: ['citrus','floral'], tastes: ['sour','sweet','creamy'], strength: 'medium', approachability: 'gentle'},
  {id: 'vesper', name: L('Vesper', '维斯帕', 'Vesper', 'Vesper', 'Vesper', '베스퍼', 'ヴェスパー', 'Vesper'), accent: '#D9D1A6', profile: L('Gin, vodka, and Lillet Blanc in a cold, dry aperitif.', '金酒、伏特加与白丽叶组成冰冷干爽的开胃酒。', 'Gin, vodka et Lillet Blanc dans un apéritif froid et sec.', 'Gin, Wodka und Lillet Blanc als kalter, trockener Aperitif.', 'Ginebra, vodka y Lillet Blanc en un aperitivo frío y seco.', '진, 보드카, 릴레 블랑의 차갑고 드라이한 아페리티프.', 'ジン、ウォッカ、リレ・ブランの冷たくドライなアペリティフ。', 'Gin, vodka e Lillet Blanc in un aperitivo freddo e secco.'), flavours: ['floral','herbal'], tastes: ['dry','bitter'], strength: 'strong', approachability: 'bold'},
  {id: 'vieux-carre', name: L('Vieux Carré', '老广场', 'Vieux Carré', 'Vieux Carré', 'Vieux Carré', '뷰 카레', 'ヴュー・カレ', 'Vieux Carré'), accent: '#75412E', profile: L('Rye, Cognac, sweet vermouth, Bénédictine, and Peychaud’s bitters.', '黑麦威士忌、干邑、甜味美思、本尼迪克丁与 Peychaud’s 苦精。', 'Seigle, Cognac, vermouth doux, Bénédictine et bitters Peychaud’s.', 'Rye, Cognac, süßer Wermut, Bénédictine und Peychaud’s Bitters.', 'Centeno, coñac, vermut dulce, Bénédictine y bitters Peychaud’s.', '라이, 코냑, 스위트 베르무트, 베네딕틴, 페이쇼드 비터스.', 'ライ、コニャック、スイートベルモット、ベネディクティン、ペイショーズ。', 'Rye, Cognac, vermouth dolce, Bénédictine e bitter Peychaud’s.'), flavours: ['herbal','spice'], tastes: ['sweet','bitter'], strength: 'strong', approachability: 'bold'},
  {id: 'white-lady', name: L('White Lady', '白色佳人', 'White Lady', 'White Lady', 'White Lady', '화이트 레이디', 'ホワイト・レディ', 'White Lady'), accent: '#E4D8AD', profile: L('Gin, triple sec, and lemon in a lean citrus sour.', '金酒、橙味利口酒与柠檬组成轻盈柑橘酸酒。', 'Gin, triple sec et citron dans un sour d’agrumes élancé.', 'Gin, Triple Sec und Zitrone als schlanker Zitrus-Sour.', 'Ginebra, triple sec y limón en un sour cítrico limpio.', '진, 트리플 섹, 레몬의 가늘고 선명한 시트러스 사워.', 'ジン、トリプルセック、レモンの端正なシトラスサワー。', 'Gin, triple sec e limone in un sour agrumato e snello.'), flavours: ['citrus'], tastes: ['sour','dry'], strength: 'strong', approachability: 'balanced'},
  {id: 'zombie', name: L('Zombie', '僵尸', 'Zombie', 'Zombie', 'Zombie', '좀비', 'ゾンビ', 'Zombie'), accent: '#8C4A2E', profile: L('Three rums, citrus, spice, and Donn’s Mix in a potent tiki blend.', '三种朗姆、柑橘、香料与 Donn’s Mix 组成强劲提基混合。', 'Trois rhums, agrumes, épices et Donn’s Mix dans un tiki puissant.', 'Drei Rums, Zitrus, Gewürze und Donn’s Mix als kräftiger Tiki-Blend.', 'Tres rones, cítricos, especias y Donn’s Mix en un tiki potente.', '세 가지 럼, 시트러스, 향신료, 돈스 믹스의 강렬한 티키 블렌드.', '3種のラム、柑橘、スパイス、ドンズ・ミックスの力強いティキ。', 'Tre rum, agrumi, spezie e Donn’s Mix in un tiki potente.'), flavours: ['fruit','citrus','spice'], tastes: ['sour','sweet'], strength: 'strong', approachability: 'bold'},
];

const cocktails: Cocktail[] = profiles.map(({id, name, aliases = [], accent, profile}) => ({
  id,
  name,
  aliases,
  category: 'classic',
  description: profile,
  versionIds: [`${id}-iba`],
  defaultVersionId: `${id}-iba`,
  accent,
}));

const editorial = (text: Localized): Localized => L(
  `Editorial guide: ${text.en}`,
  `编辑提示：${text.zh}`,
  `Repère éditorial : ${text.fr}`,
  `Redaktioneller Hinweis: ${text.de}`,
  `Guía editorial: ${text.es}`,
  `편집 안내: ${text.ko}`,
  `編集メモ：${text.ja}`,
  `Nota editoriale: ${text.it}`,
);

const noGarnish = L('None specified', '未指定', 'Aucune garniture indiquée', 'Keine Garnitur angegeben', 'Sin guarnición indicada', '지정 없음', '指定なし', 'Nessuna guarnizione indicata');
const cocktailGlass = L('Chilled cocktail glass', '冰镇鸡尾酒杯', 'Verre à cocktail refroidi', 'Gekühltes Cocktailglas', 'Copa de cóctel fría', '차가운 칵테일 글라스', '冷やしたカクテルグラス', 'Coppetta da cocktail fredda');
const highball = L('Highball glass', '高球杯', 'Verre highball', 'Highball-Glas', 'Vaso highball', '하이볼 글라스', 'ハイボールグラス', 'Bicchiere highball');
const rocks = L('Rocks glass', '岩石杯', 'Verre rocks', 'Tumbler', 'Vaso bajo', '록스 글라스', 'ロックグラス', 'Tumbler basso');

const shakeStrain = S(
  ['Shake all ingredients well with ice and strain into the chilled glass.'],
  ['将所有材料加冰充分摇匀，滤入冰镇杯中。'],
  ['Shaker tous les ingrédients avec des glaçons et filtrer dans le verre refroidi.'],
  ['Alle Zutaten mit Eis kräftig shaken und in das gekühlte Glas abseihen.'],
  ['Agita bien todos los ingredientes con hielo y cuela en la copa fría.'],
  ['모든 재료를 얼음과 충분히 흔들고 차가운 잔에 거릅니다.'],
  ['全材料を氷とよくシェイクし、冷やしたグラスにこします。'],
  ['Shakerare bene tutti gli ingredienti con ghiaccio e filtrare nel bicchiere freddo.'],
);
const stirStrain = S(
  ['Stir all ingredients with ice and strain into the chilled glass.'],
  ['将所有材料加冰搅拌，滤入冰镇杯中。'],
  ['Remuer tous les ingrédients avec des glaçons et filtrer dans le verre refroidi.'],
  ['Alle Zutaten mit Eis rühren und in das gekühlte Glas abseihen.'],
  ['Remueve todos los ingredientes con hielo y cuela en la copa fría.'],
  ['모든 재료를 얼음과 저어 차가운 잔에 거릅니다.'],
  ['全材料を氷とステアし、冷やしたグラスにこします。'],
  ['Mescolare tutti gli ingredienti con ghiaccio e filtrare nel bicchiere freddo.'],
);
const buildHighball = S(
  ['Build all ingredients in a highball glass filled with ice.'],
  ['将所有材料直接加入装冰的高球杯。'],
  ['Monter tous les ingrédients dans un highball rempli de glace.'],
  ['Alle Zutaten in einem mit Eis gefüllten Highball-Glas aufbauen.'],
  ['Monta todos los ingredientes en un highball lleno de hielo.'],
  ['얼음을 채운 하이볼 글라스에 모든 재료를 바로 넣습니다.'],
  ['氷を満たしたハイボールグラスに全材料を注ぎます。'],
  ['Costruire tutti gli ingredienti in un highball pieno di ghiaccio.'],
);

const shakeIntoHurricane = S(
  ['Shake all ingredients well with ice and strain into a Hurricane glass.'],
  ['将所有材料加冰充分摇匀，滤入飓风杯。'],
  ['Shaker tous les ingrédients avec des glaçons et filtrer dans un verre hurricane.'],
  ['Alle Zutaten mit Eis kräftig shaken und in ein Hurricane-Glas abseihen.'],
  ['Agita bien todos los ingredientes con hielo y cuela en una copa hurricane.'],
  ['모든 재료를 얼음과 충분히 흔들어 허리케인 글라스에 거릅니다.'],
  ['全材料を氷とよくシェイクし、ハリケーングラスにこします。'],
  ['Shakerare bene tutti gli ingredienti con ghiaccio e filtrare in un hurricane.'],
);
const noteFewDrops = L('A few drops; the source gives no fixed count.', '几滴；来源未给固定数量。', 'Quelques gouttes ; la source ne donne pas de nombre précis.', 'Einige Tropfen; die Quelle nennt keine feste Zahl.', 'Unas gotas; la fuente no da una cantidad fija.', '몇 방울이며 출처에 정확한 수량은 없습니다.', '数滴。出典に固定数はありません。', 'Alcune gocce; la fonte non indica un numero preciso.');
const noteOptional = L('Optional in the source recipe.', '来源配方注明可选。', 'Facultatif dans la recette source.', 'Im Quellenrezept optional.', 'Opcional en la receta fuente.', '출처 레시피에서 선택 사항입니다.', '出典レシピでは任意です。', 'Facoltativo nella ricetta fonte.');

const recipe = (
  id: string,
  recipeIngredients: RecipeIngredient[],
  steps: RecipeVersion['steps'],
  glass: Localized,
  garnish: Localized,
): RecipeVersion => {
  const profile = profiles.find((item) => item.id === id);
  if (!profile) throw new Error(`Missing D-batch profile for ${id}`);
  return {
    id: `${id}-iba`, cocktailId: id, label: ibaLabel, sourceId: `iba-${id}`, servings: 1,
    ingredients: recipeIngredients, steps, originalLanguage: 'en', originalSteps: steps.en,
    glass, garnish, flavours: profile.flavours, tastes: profile.tastes,
    strength: profile.strength, approachability: profile.approachability,
    profileBasis: 'editorial', profileNote: editorial(profile.profile),
    sourceChecked: true, translationStatus: 'draft',
  };
};

const versions: RecipeVersion[] = [
  recipe('missionarys-downfall', [
    {ingredientId: 'neutral-white-rum', amount: 30, unit: 'ml'},
    {ingredientId: 'peach-brandy', amount: 15, unit: 'ml'},
    {ingredientId: 'lime-juice', amount: 15, unit: 'ml'},
    {ingredientId: 'honey-syrup', amount: 30, unit: 'ml', note: L('The source calls this Honey Mix.', '来源称其为 Honey Mix。', 'La source l’appelle Honey Mix.', 'Die Quelle nennt dies Honey Mix.', 'La fuente lo llama Honey Mix.', '출처는 이를 Honey Mix라고 부릅니다.', '出典では Honey Mix と記載されています。', 'La fonte lo chiama Honey Mix.')},
    {ingredientId: 'mint-leaves', amount: 10, unit: 'piece'},
    {ingredientId: 'fresh-pineapple', amount: null, unit: 'piece', note: L('Three to four chunks.', '3 至 4 块。', 'Trois à quatre morceaux.', 'Drei bis vier Stücke.', 'Tres o cuatro trozos.', '3~4조각.', '3〜4片。', 'Tre o quattro pezzi.')},
  ], S(
    ['Blend all ingredients with half a cup of crushed ice and serve in a large coupe.'],
    ['将所有材料与半杯碎冰搅打，倒入大号浅碟杯。'],
    ['Mixer tous les ingrédients avec une demi-tasse de glace pilée et servir dans une grande coupe.'],
    ['Alle Zutaten mit einer halben Tasse Crushed Ice mixen und in einer großen Coupette servieren.'],
    ['Bate todo con media taza de hielo picado y sirve en una copa grande.'],
    ['모든 재료를 크러시드 아이스 반 컵과 블렌딩해 큰 쿠페에 냅니다.'],
    ['全材料を半カップのクラッシュドアイスとブレンドし、大きなクープに注ぎます。'],
    ['Frullare tutto con mezza tazza di ghiaccio tritato e servire in una coppa grande.'],
  ), L('Large coupe', '大号浅碟杯', 'Grande coupe', 'Große Coupette', 'Copa grande', '큰 쿠페', '大きなクープ', 'Coppa grande'), L('Mint sprig and pineapple slice', '薄荷枝与菠萝片', 'Brin de menthe et tranche d’ananas', 'Minzzweig und Ananasscheibe', 'Ramita de menta y rodaja de piña', '민트 줄기와 파인애플 슬라이스', 'ミントの枝とパイナップルスライス', 'Rametto di menta e fetta d’ananas')),

  recipe('monkey-gland', [
    {ingredientId: 'gin', amount: 45, unit: 'ml'}, {ingredientId: 'orange-juice', amount: 45, unit: 'ml'},
    {ingredientId: 'absinthe', amount: 1, unit: 'tbsp'}, {ingredientId: 'grenadine-syrup', amount: 1, unit: 'tbsp'},
  ], shakeStrain, cocktailGlass, noGarnish),

  recipe('naked-and-famous', [
    {ingredientId: 'mezcal', amount: 22.5, unit: 'ml'},
    {ingredientId: 'yellow-chartreuse', amount: 22.5, unit: 'ml', brandId: 'brand-chartreuse'},
    {ingredientId: 'aperol', amount: 22.5, unit: 'ml', brandId: 'brand-aperol'},
    {ingredientId: 'lime-juice', amount: 22.5, unit: 'ml'},
  ], shakeStrain, cocktailGlass, noGarnish),

  recipe('new-york-sour', [
    {ingredientId: 'rye-whiskey', amount: 60, unit: 'ml', note: L('The source allows bourbon instead.', '来源也允许使用波本。', 'La source permet aussi le bourbon.', 'Die Quelle erlaubt alternativ Bourbon.', 'La fuente permite bourbon como alternativa.', '출처는 버번도 허용합니다.', '出典はバーボンも可としています。', 'La fonte consente anche il bourbon.')},
    {ingredientId: 'simple-syrup', amount: 22.5, unit: 'ml'}, {ingredientId: 'lemon-juice', amount: 30, unit: 'ml'},
    {ingredientId: 'egg-white', amount: null, unit: 'drop', note: noteFewDrops}, {ingredientId: 'red-wine', amount: 15, unit: 'ml', note: L('Shiraz or Malbec.', '西拉或马尔贝克。', 'Shiraz ou Malbec.', 'Shiraz oder Malbec.', 'Shiraz o Malbec.', '시라즈 또는 말벡.', 'シラーズまたはマルベック。', 'Shiraz o Malbec.')},
  ], S(
    ['Shake everything except the wine vigorously with ice.', 'Strain over ice into a chilled rocks glass and float the wine on top.'],
    ['除红酒外全部加冰用力摇匀。', '滤入装冰的冰镇岩石杯，将红酒浮在顶部。'],
    ['Shaker vivement tout sauf le vin avec des glaçons.', 'Filtrer sur glace dans un verre rocks refroidi et faire flotter le vin.'],
    ['Alles außer dem Wein kräftig mit Eis shaken.', 'Über Eis in einen gekühlten Tumbler abseihen und den Wein floaten.'],
    ['Agita con fuerza todo salvo el vino con hielo.', 'Cuela sobre hielo en un vaso bajo frío y haz flotar el vino.'],
    ['와인을 제외한 재료를 얼음과 세게 흔듭니다.', '얼음 든 차가운 록스 글라스에 거르고 와인을 띄웁니다.'],
    ['ワイン以外を氷と強くシェイクします。', '氷入りの冷やしたロックグラスにこし、ワインを浮かべます。'],
    ['Shakerare energicamente tutto tranne il vino con ghiaccio.', 'Filtrare su ghiaccio in un tumbler freddo e far galleggiare il vino.'],
  ), rocks, L('Lemon or orange zest with cherry', '柠檬或橙皮配樱桃', 'Zeste de citron ou d’orange avec cerise', 'Zitronen- oder Orangenzeste mit Kirsche', 'Piel de limón o naranja con cereza', '레몬 또는 오렌지 제스트와 체리', 'レモンまたはオレンジゼストとチェリー', 'Scorza di limone o arancia con ciliegia')),

  recipe('old-cuban', [
    {ingredientId: 'mint-leaves', amount: null, unit: 'piece', note: L('Six to eight leaves.', '6 至 8 片叶。', 'Six à huit feuilles.', 'Sechs bis acht Blätter.', 'Seis a ocho hojas.', '6~8장.', '6〜8枚。', 'Sei-otto foglie.')},
    {ingredientId: 'aged-rum', amount: 45, unit: 'ml'}, {ingredientId: 'lime-juice', amount: 22.5, unit: 'ml'},
    {ingredientId: 'simple-syrup', amount: 30, unit: 'ml'}, {ingredientId: 'angostura-bitters', amount: 2, unit: 'dash', brandId: 'brand-angostura-aromatic'},
    {ingredientId: 'sparkling-wine', amount: 60, unit: 'ml', note: L('Brut Champagne or Prosecco.', '干型香槟或普罗塞克。', 'Champagne brut ou Prosecco.', 'Brut Champagne oder Prosecco.', 'Champagne brut o Prosecco.', '브뤼 샴페인 또는 프로세코.', 'ブリュット・シャンパンまたはプロセッコ。', 'Champagne brut o Prosecco.')},
  ], S(
    ['Shake everything except the sparkling wine with ice and strain into a chilled elegant cocktail glass.', 'Top with the sparkling wine.'],
    ['除起泡酒外全部加冰摇匀，滤入冰镇的优雅鸡尾酒杯。', '以起泡酒补满。'],
    ['Shaker tout sauf le vin effervescent avec des glaçons et filtrer dans un verre élégant refroidi.', 'Compléter avec le vin effervescent.'],
    ['Alles außer dem Schaumwein mit Eis shaken und in ein elegantes gekühltes Cocktailglas abseihen.', 'Mit Schaumwein auffüllen.'],
    ['Agita todo salvo el espumoso con hielo y cuela en una copa elegante fría.', 'Completa con el espumoso.'],
    ['스파클링 와인을 제외한 재료를 얼음과 흔들어 차가운 우아한 칵테일 글라스에 거릅니다.', '스파클링 와인으로 채웁니다.'],
    ['スパークリングワイン以外を氷とシェイクし、冷やした上品なグラスにこします。', 'スパークリングワインで満たします。'],
    ['Shakerare tutto tranne lo spumante con ghiaccio e filtrare in una coppa elegante fredda.', 'Colmare con lo spumante.'],
  ), L('Chilled elegant cocktail glass', '冰镇优雅鸡尾酒杯', 'Verre à cocktail élégant refroidi', 'Elegantes gekühltes Cocktailglas', 'Copa de cóctel elegante fría', '차가운 우아한 칵테일 글라스', '冷やした上品なカクテルグラス', 'Coppa da cocktail elegante fredda'), L('Mint sprigs', '薄荷枝', 'Brins de menthe', 'Minzzweige', 'Ramitas de menta', '민트 줄기', 'ミントの枝', 'Rametti di menta')),

  recipe('paradise', [
    {ingredientId: 'gin', amount: 30, unit: 'ml'}, {ingredientId: 'apricot-brandy', amount: 20, unit: 'ml'}, {ingredientId: 'orange-juice', amount: 15, unit: 'ml'},
  ], shakeStrain, cocktailGlass, noGarnish),

  recipe('pisco-punch', [
    {ingredientId: 'pisco', amount: 60, unit: 'ml'}, {ingredientId: 'pineapple-juice', amount: 22.5, unit: 'ml'},
    {ingredientId: 'simple-syrup', amount: 15, unit: 'ml'}, {ingredientId: 'lemon-juice', amount: 15, unit: 'ml'},
    {ingredientId: 'dry-white-wine', amount: 30, unit: 'ml'}, {ingredientId: 'cloves', amount: 3, unit: 'piece'},
  ], S(
    ['Gently mash the syrup with the cloves, then add everything except the wine.', 'Shake hard, double-strain into a large goblet, top with wine, and stir gently.'],
    ['将糖浆与丁香轻轻捣压，再加入除白葡萄酒外的材料。', '用力摇匀并双重过滤入大高脚杯，加白葡萄酒后轻搅。'],
    ['Écraser doucement le sirop avec les clous, puis ajouter tout sauf le vin.', 'Shaker vivement, filtrer deux fois dans un grand gobelet, ajouter le vin et remuer.'],
    ['Sirup und Nelken sanft zerdrücken, dann alles außer Wein zugeben.', 'Kräftig shaken, doppelt in einen großen Kelch abseihen, Wein zugeben und rühren.'],
    ['Machaca suavemente el almíbar con los clavos y añade todo salvo el vino.', 'Agita fuerte, cuela dos veces en una copa grande, añade vino y remueve.'],
    ['시럽과 정향을 부드럽게 으깨고 와인을 제외한 재료를 넣습니다.', '세게 흔들어 큰 고블렛에 더블 스트레인하고 와인을 더해 젓습니다.'],
    ['シロップとクローブを軽くつぶし、ワイン以外を加えます。', '強くシェイクし大きなゴブレットにダブルストレイン、ワインを加えてステアします。'],
    ['Pestare piano sciroppo e chiodi, poi aggiungere tutto tranne il vino.', 'Shakerare forte, filtrare due volte in un grande calice, aggiungere vino e mescolare.'],
  ), L('Large goblet', '大高脚杯', 'Grand gobelet', 'Großer Kelch', 'Copa grande', '큰 고블렛', '大きなゴブレット', 'Grande calice'), noGarnish),

  recipe('planters-punch', [
    {ingredientId: 'jamaican-rum', amount: 45, unit: 'ml'}, {ingredientId: 'lime-juice', amount: 15, unit: 'ml'}, {ingredientId: 'sugar-cane-juice', amount: 30, unit: 'ml'},
  ], S(
    ['Pour directly into a small tumbler or traditional terracotta glass.', 'Dilute to taste with water, ice, or fresh juice.'],
    ['直接倒入小号平底杯或传统陶杯。', '按口味用水、冰或新鲜果汁稀释。'],
    ['Verser directement dans un petit tumbler ou verre en terre cuite.', 'Diluer au goût avec eau, glace ou jus frais.'],
    ['Direkt in einen kleinen Tumbler oder Terrakotta-Becher geben.', 'Nach Geschmack mit Wasser, Eis oder frischem Saft verdünnen.'],
    ['Vierte directamente en vaso pequeño o de terracota.', 'Diluye al gusto con agua, hielo o zumo fresco.'],
    ['작은 텀블러나 전통 테라코타 잔에 바로 붓습니다.', '물, 얼음 또는 신선한 주스로 입맛에 맞게 희석합니다.'],
    ['小さなタンブラーまたは伝統的な陶器グラスに直接注ぎます。', '水、氷、フレッシュジュースで好みに希釈します。'],
    ['Versare direttamente in un piccolo tumbler o bicchiere di terracotta.', 'Diluire a piacere con acqua, ghiaccio o succo fresco.'],
  ), L('Small tumbler or terracotta glass', '小号平底杯或陶杯', 'Petit tumbler ou verre en terre cuite', 'Kleiner Tumbler oder Terrakotta-Becher', 'Vaso pequeño o de terracota', '작은 텀블러 또는 테라코타 잔', '小さなタンブラーまたは陶器グラス', 'Piccolo tumbler o bicchiere di terracotta'), L('Orange zest', '橙皮', 'Zeste d’orange', 'Orangenzeste', 'Piel de naranja', '오렌지 제스트', 'オレンジゼスト', 'Scorza d’arancia')),

  recipe('porn-star-martini', [
    {ingredientId: 'vanilla-vodka', amount: 50, unit: 'ml'}, {ingredientId: 'passion-fruit-liqueur', amount: 20, unit: 'ml'},
    {ingredientId: 'passion-fruit-puree', amount: 50, unit: 'ml'}, {ingredientId: 'vanilla-sugar', amount: 2, unit: 'barspoon'},
    {ingredientId: 'champagne', amount: 50, unit: 'ml', note: L('Serve as a separate shot.', '另以一小杯单独上桌。', 'Servir en shot séparé.', 'Als separaten Shot servieren.', 'Servir como chupito aparte.', '별도의 샷으로 냅니다.', '別添えのショットで供します。', 'Servire come shot separato.')},
  ], S(
    ['Shake everything except Champagne with ice and double-strain into a large chilled cocktail glass.', 'Serve the Champagne as a shot on the side.'],
    ['除香槟外全部加冰摇匀，双重过滤入冰镇大鸡尾酒杯。', '香槟另以一小杯上桌。'],
    ['Shaker tout sauf le Champagne avec des glaçons et filtrer deux fois dans un grand verre refroidi.', 'Servir le Champagne en shot à côté.'],
    ['Alles außer Champagne mit Eis shaken und doppelt in ein großes gekühltes Cocktailglas abseihen.', 'Champagne als Shot daneben servieren.'],
    ['Agita todo salvo el Champagne con hielo y cuela dos veces en una copa grande fría.', 'Sirve el Champagne en un chupito aparte.'],
    ['샴페인을 제외한 재료를 얼음과 흔들어 큰 차가운 잔에 더블 스트레인합니다.', '샴페인은 옆에 샷으로 냅니다.'],
    ['シャンパン以外を氷とシェイクし、大きな冷却グラスにダブルストレインします。', 'シャンパンは別添えのショットで供します。'],
    ['Shakerare tutto tranne lo Champagne con ghiaccio e filtrare due volte in una grande coppa fredda.', 'Servire lo Champagne come shot a parte.'],
  ), L('Large chilled cocktail glass, plus shot glass', '冰镇大鸡尾酒杯及小杯', 'Grand verre refroidi et verre à shot', 'Großes gekühltes Cocktailglas plus Shotglas', 'Copa grande fría y vaso de chupito', '큰 차가운 칵테일 글라스와 샷 글라스', '大きな冷却カクテルグラスとショットグラス', 'Grande coppa fredda e bicchiere da shot'), L('Passion-fruit half and sugar', '半颗百香果与糖', 'Demi-fruit de la passion et sucre', 'Halbe Passionsfrucht und Zucker', 'Media fruta de la pasión y azúcar', '패션프루트 반쪽과 설탕', 'パッションフルーツ半分と砂糖', 'Mezzo frutto della passione e zucchero')),

  recipe('porto-flip', [
    {ingredientId: 'brandy', amount: 15, unit: 'ml'}, {ingredientId: 'tawny-port', amount: 45, unit: 'ml'}, {ingredientId: 'egg-yolk', amount: 10, unit: 'ml'},
  ], shakeStrain, cocktailGlass, L('Freshly ground nutmeg', '现磨肉豆蔻', 'Noix de muscade fraîchement râpée', 'Frisch geriebene Muskatnuss', 'Nuez moscada recién molida', '갓 간 육두구', '挽きたてのナツメグ', 'Noce moscata macinata al momento')),

  recipe('rabo-de-galo', [
    {ingredientId: 'cachaca', amount: 60, unit: 'ml'}, {ingredientId: 'sweet-red-vermouth', amount: 20, unit: 'ml', brandId: 'brand-cinzano'},
    {ingredientId: 'cynar', amount: 15, unit: 'ml', brandId: 'brand-cynar'}, {ingredientId: 'angostura-bitters', amount: 2, unit: 'drop', optional: true, brandId: 'brand-angostura-aromatic', note: noteOptional},
  ], S(
    ['Combine all ingredients in a rocks glass, add ice, and stir briefly.'],
    ['在岩石杯中加入全部材料，加冰后短暂搅拌。'],
    ['Réunir tous les ingrédients dans un verre rocks, ajouter de la glace et remuer brièvement.'],
    ['Alle Zutaten in einen Tumbler geben, Eis hinzufügen und kurz rühren.'],
    ['Combina todo en un vaso bajo, añade hielo y remueve brevemente.'],
    ['록스 글라스에 모든 재료를 넣고 얼음을 더해 짧게 젓습니다.'],
    ['ロックグラスに全材料を入れ、氷を加えて短くステアします。'],
    ['Unire tutto in un tumbler, aggiungere ghiaccio e mescolare brevemente.'],
  ), rocks, L('Orange twist', '橙皮卷', 'Zeste d’orange', 'Orangenzeste', 'Twist de naranja', '오렌지 트위스트', 'オレンジツイスト', 'Twist d’arancia')),

  recipe('ramos-fizz', [
    {ingredientId: 'gin', amount: 45, unit: 'ml'}, {ingredientId: 'lime-juice', amount: 15, unit: 'ml'}, {ingredientId: 'lemon-juice', amount: 15, unit: 'ml'},
    {ingredientId: 'simple-syrup', amount: 30, unit: 'ml'}, {ingredientId: 'cream', amount: 60, unit: 'ml'}, {ingredientId: 'egg-white', amount: 30, unit: 'ml'},
    {ingredientId: 'orange-flower-water', amount: 3, unit: 'dash'}, {ingredientId: 'vanilla-extract', amount: 2, unit: 'drop'}, {ingredientId: 'soda-water', amount: null, unit: 'top'},
  ], S(
    ['Shake everything except soda with ice for two minutes and double-strain.', 'Return to the shaker, dry-shake hard for one minute, strain into a highball, and top with soda.'],
    ['除苏打外全部加冰摇两分钟并双重过滤。', '倒回摇壶，无冰用力摇一分钟，滤入高球杯并以苏打补满。'],
    ['Shaker tout sauf le soda avec glace deux minutes et filtrer deux fois.', 'Remettre au shaker, shaker à sec une minute, filtrer en highball et compléter de soda.'],
    ['Alles außer Soda zwei Minuten mit Eis shaken und doppelt abseihen.', 'Zurück in den Shaker geben, eine Minute trocken hart shaken, in den Highball abseihen und Soda auffüllen.'],
    ['Agita todo salvo la soda con hielo dos minutos y cuela dos veces.', 'Devuelve a la coctelera, agita sin hielo un minuto, cuela en highball y completa con soda.'],
    ['소다를 제외한 재료를 얼음과 2분 흔들어 더블 스트레인합니다.', '다시 셰이커에 넣어 얼음 없이 1분 세게 흔들고 하이볼에 거른 뒤 소다로 채웁니다.'],
    ['ソーダ以外を氷と2分シェイクし、ダブルストレインします。', 'シェイカーに戻して氷なしで1分強く振り、ハイボールにこしてソーダで満たします。'],
    ['Shakerare tutto tranne la soda con ghiaccio per due minuti e filtrare due volte.', 'Rimettere nello shaker, shakerare a secco un minuto, filtrare in highball e colmare con soda.'],
  ), highball, noGarnish),

  recipe('remember-the-maine', [
    {ingredientId: 'rye-whiskey', amount: 60, unit: 'ml'}, {ingredientId: 'sweet-red-vermouth', amount: 22.5, unit: 'ml'},
    {ingredientId: 'cherry-brandy', amount: 15, unit: 'ml', brandId: 'brand-luxardo'}, {ingredientId: 'absinthe', amount: 7.5, unit: 'ml'},
  ], S(
    ['Coat a coupe with absinthe, discard the excess, and set it aside.', 'Stir the remaining ingredients with ice and strain into the rinsed glass.'],
    ['用苦艾酒润洗浅碟杯，倒掉多余液体并备用。', '其余材料加冰搅拌，滤入润洗后的杯中。'],
    ['Rincer une coupe à l’absinthe, jeter l’excédent et réserver.', 'Remuer le reste avec glace et filtrer dans le verre rincé.'],
    ['Eine Coupette mit Absinth ausschwenken, Überschuss verwerfen.', 'Die übrigen Zutaten mit Eis rühren und in das Glas abseihen.'],
    ['Enjuaga una copa coupe con absenta, desecha el exceso y reserva.', 'Remueve lo demás con hielo y cuela en la copa enjuagada.'],
    ['쿠페에 압생트를 둘러 코팅하고 남은 액체는 버립니다.', '나머지를 얼음과 저어 린스한 잔에 거릅니다.'],
    ['クープをアブサンでリンスし、余分を捨てます。', '残りを氷とステアし、リンスしたグラスにこします。'],
    ['Risciacquare una coppa con assenzio e scartare l’eccesso.', 'Mescolare il resto con ghiaccio e filtrare nella coppa.'],
  ), L('Coupe glass', '浅碟杯', 'Coupe', 'Coupette', 'Copa coupe', '쿠페 글라스', 'クープグラス', 'Coppa'), L('Lemon zest', '柠檬皮', 'Zeste de citron', 'Zitronenzeste', 'Piel de limón', '레몬 제스트', 'レモンゼスト', 'Scorza di limone')),

  recipe('russian-spring-punch', [
    {ingredientId: 'vodka', amount: 25, unit: 'ml'}, {ingredientId: 'lemon-juice', amount: 25, unit: 'ml'},
    {ingredientId: 'creme-de-cassis', amount: 15, unit: 'ml'}, {ingredientId: 'simple-syrup', amount: 10, unit: 'ml'},
    {ingredientId: 'sparkling-wine', amount: null, unit: 'top'},
  ], S(
    ['Shake everything except sparkling wine with ice.', 'Strain into an ice-filled chilled tall tumbler and top with sparkling wine.'],
    ['除起泡酒外全部加冰摇匀。', '滤入装冰的冰镇高杯，以起泡酒补满。'],
    ['Shaker tout sauf le vin effervescent avec des glaçons.', 'Filtrer dans un grand tumbler glacé et compléter de vin effervescent.'],
    ['Alles außer Schaumwein mit Eis shaken.', 'In einen gekühlten hohen Tumbler mit Eis abseihen und Schaumwein auffüllen.'],
    ['Agita todo salvo el espumoso con hielo.', 'Cuela en un vaso alto frío con hielo y completa con espumoso.'],
    ['스파클링 와인을 제외한 재료를 얼음과 흔듭니다.', '얼음 든 차가운 긴 잔에 거르고 스파클링 와인으로 채웁니다.'],
    ['スパークリングワイン以外を氷とシェイクします。', '氷入りの冷やしたトールタンブラーにこし、ワインで満たします。'],
    ['Shakerare tutto tranne lo spumante con ghiaccio.', 'Filtrare in un tumbler alto freddo con ghiaccio e colmare con spumante.'],
  ), L('Chilled tall tumbler', '冰镇高杯', 'Grand tumbler refroidi', 'Gekühlter hoher Tumbler', 'Vaso alto frío', '차가운 긴 텀블러', '冷やしたトールタンブラー', 'Tumbler alto freddo'), L('Blackberries; lemon slice optional', '黑莓；可选柠檬片', 'Mûres ; tranche de citron facultative', 'Brombeeren; Zitronenscheibe optional', 'Moras; rodaja de limón opcional', '블랙베리, 레몬 슬라이스는 선택', 'ブラックベリー。レモンスライスは任意', 'More; fetta di limone facoltativa')),

  recipe('rusty-nail', [
    {ingredientId: 'scotch-whisky', amount: 45, unit: 'ml'}, {ingredientId: 'drambuie', amount: 25, unit: 'ml', brandId: 'brand-drambuie'},
  ], S(
    ['Build both ingredients in an old fashioned glass filled with ice and stir gently.'],
    ['将两种材料直接加入装冰的古典杯，轻轻搅拌。'],
    ['Monter les deux ingrédients dans un old fashioned glacé et remuer doucement.'],
    ['Beide Zutaten in ein Old-Fashioned-Glas mit Eis geben und sanft rühren.'],
    ['Monta ambos ingredientes en un old fashioned con hielo y remueve suavemente.'],
    ['얼음을 채운 올드 패션드 글라스에 두 재료를 넣고 부드럽게 젓습니다.'],
    ['氷入りのオールドファッションドグラスに2材料を注ぎ、やさしくステアします。'],
    ['Costruire i due ingredienti in un old fashioned con ghiaccio e mescolare piano.'],
  ), L('Old fashioned glass', '古典杯', 'Verre old fashioned', 'Old-Fashioned-Glas', 'Vaso old fashioned', '올드 패션드 글라스', 'オールドファッションドグラス', 'Bicchiere old fashioned'), L('Lemon zest', '柠檬皮', 'Zeste de citron', 'Zitronenzeste', 'Piel de limón', '레몬 제스트', 'レモンゼスト', 'Scorza di limone')),

  recipe('sea-breeze', [
    {ingredientId: 'vodka', amount: 40, unit: 'ml'}, {ingredientId: 'cranberry-juice', amount: 120, unit: 'ml'}, {ingredientId: 'grapefruit-juice', amount: 30, unit: 'ml'},
  ], buildHighball, highball, L('Orange zest and cherry', '橙皮与樱桃', 'Zeste d’orange et cerise', 'Orangenzeste und Kirsche', 'Piel de naranja y cereza', '오렌지 제스트와 체리', 'オレンジゼストとチェリー', 'Scorza d’arancia e ciliegia')),

  recipe('sex-on-the-beach', [
    {ingredientId: 'vodka', amount: 40, unit: 'ml'}, {ingredientId: 'peach-schnapps', amount: 20, unit: 'ml'},
    {ingredientId: 'orange-juice', amount: 40, unit: 'ml'}, {ingredientId: 'cranberry-juice', amount: 40, unit: 'ml'},
  ], buildHighball, highball, L('Half orange slice', '半片橙', 'Demi-tranche d’orange', 'Halbe Orangenscheibe', 'Media rodaja de naranja', '오렌지 반쪽 슬라이스', 'オレンジの半月切り', 'Mezza fetta d’arancia')),

  recipe('sherry-cobbler', [
    {ingredientId: 'amontillado-sherry', amount: 45, unit: 'ml'}, {ingredientId: 'palo-cortado-sherry', amount: 45, unit: 'ml'},
    {ingredientId: 'superfine-sugar', amount: 1, unit: 'tsp'}, {ingredientId: 'orange-wheel', amount: 0.5, unit: 'piece'}, {ingredientId: 'lemon-wheel', amount: 0.5, unit: 'piece'},
  ], S(
    ['Shake the sherries, sugar, and two quarter-wheels each of orange and lemon briskly with ice.', 'Strain into a julep cup filled with crushed ice.'],
    ['将雪莉、糖及橙和柠檬各两枚四分之一圆片加冰快速摇匀。', '滤入装满碎冰的朱莉普杯。'],
    ['Shaker vivement les xérès, le sucre et deux quarts de rondelle de chaque agrume avec glace.', 'Filtrer dans une tasse julep remplie de glace pilée.'],
    ['Sherrys, Zucker und je zwei Viertelräder Orange und Zitrone mit Eis brisk shaken.', 'In einen Julep-Becher mit Crushed Ice abseihen.'],
    ['Agita los jereces, azúcar y dos cuartos de rueda de cada cítrico con hielo.', 'Cuela en una copa julep con hielo picado.'],
    ['셰리, 설탕, 오렌지와 레몬 각 1/4 휠 두 조각을 얼음과 빠르게 흔듭니다.', '크러시드 아이스를 채운 줄렙 컵에 거릅니다.'],
    ['シェリー、砂糖、オレンジとレモン各1/4輪切り2枚を氷と素早くシェイクします。', 'クラッシュドアイスを満たしたジュレップカップにこします。'],
    ['Shakerare vivacemente sherry, zucchero e due quarti di ruota per ogni agrume con ghiaccio.', 'Filtrare in una julep cup piena di ghiaccio tritato.'],
  ), L('Julep cup', '朱莉普杯', 'Tasse julep', 'Julep-Becher', 'Copa julep', '줄렙 컵', 'ジュレップカップ', 'Julep cup'), L('Fresh berries, orange and lemon quarter-wheels; straws', '新鲜莓果、橙和柠檬四分之一圆片；配吸管', 'Baies fraîches, quarts d’orange et de citron ; pailles', 'Frische Beeren, Orangen- und Zitronenviertel; Strohhalme', 'Bayas frescas, cuartos de naranja y limón; pajitas', '신선한 베리, 오렌지·레몬 1/4 휠, 빨대', 'フレッシュベリー、オレンジとレモンの1/4輪切り、ストロー', 'Frutti di bosco, quarti d’arancia e limone; cannucce')),

  recipe('singapore-sling', [
    {ingredientId: 'gin', amount: 30, unit: 'ml'}, {ingredientId: 'cherry-brandy', amount: 15, unit: 'ml', brandId: 'brand-luxardo'},
    {ingredientId: 'triple-sec', amount: 7.5, unit: 'ml', brandId: 'brand-cointreau'}, {ingredientId: 'benedictine', amount: 7.5, unit: 'ml', brandId: 'brand-benedictine'},
    {ingredientId: 'pineapple-juice', amount: 120, unit: 'ml'}, {ingredientId: 'lime-juice', amount: 15, unit: 'ml'},
    {ingredientId: 'grenadine-syrup', amount: 10, unit: 'ml'}, {ingredientId: 'angostura-bitters', amount: 1, unit: 'dash', brandId: 'brand-angostura-aromatic'},
  ], shakeIntoHurricane, L('Hurricane glass', '飓风杯', 'Verre hurricane', 'Hurricane-Glas', 'Copa hurricane', '허리케인 글라스', 'ハリケーングラス', 'Bicchiere hurricane'), L('Pineapple and maraschino cherry', '菠萝与马拉斯奇诺樱桃', 'Ananas et cerise au marasquin', 'Ananas und Maraschinokirsche', 'Piña y cereza al marrasquino', '파인애플과 마라스키노 체리', 'パイナップルとマラスキーノチェリー', 'Ananas e ciliegia al maraschino')),

  recipe('south-side', [
    {ingredientId: 'gin', amount: 60, unit: 'ml', note: L('London dry gin.', '伦敦干金酒。', 'Gin London dry.', 'London Dry Gin.', 'Ginebra London dry.', '런던 드라이 진.', 'ロンドンドライジン。', 'London dry gin.')},
    {ingredientId: 'lemon-juice', amount: 30, unit: 'ml'}, {ingredientId: 'simple-syrup', amount: 15, unit: 'ml'},
    {ingredientId: 'mint-leaves', amount: null, unit: 'piece', note: L('Five to six leaves.', '5 至 6 片叶。', 'Cinq à six feuilles.', 'Fünf bis sechs Blätter.', 'Cinco o seis hojas.', '5~6장.', '5〜6枚。', 'Cinque-sei foglie.')},
    {ingredientId: 'egg-white', amount: null, unit: 'drop', optional: true, note: L('A few drops, optional; shake vigorously if used.', '几滴，可选；使用时需用力摇匀。', 'Quelques gouttes, facultatives ; shaker vivement si utilisé.', 'Einige Tropfen, optional; bei Verwendung kräftig shaken.', 'Unas gotas, opcionales; agitar con fuerza si se usa.', '몇 방울, 선택 사항. 넣으면 세게 흔듭니다.', '数滴、任意。使う場合は強くシェイクします。', 'Alcune gocce, facoltative; shakerare forte se usate.')},
  ], S(
    ['Shake well with ice and double-strain into a chilled cocktail glass.', 'If using egg white, shake vigorously.'],
    ['加冰充分摇匀，双重过滤入冰镇鸡尾酒杯。', '若使用蛋白，请用力摇匀。'],
    ['Bien shaker avec glace et filtrer deux fois dans un verre refroidi.', 'Avec blanc d’œuf, shaker vigoureusement.'],
    ['Mit Eis gut shaken und doppelt in ein gekühltes Cocktailglas abseihen.', 'Mit Eiweiß kräftig shaken.'],
    ['Agita bien con hielo y cuela dos veces en una copa fría.', 'Con clara, agita vigorosamente.'],
    ['얼음과 잘 흔들어 차가운 칵테일 글라스에 더블 스트레인합니다.', '달걀흰자를 쓰면 세게 흔듭니다.'],
    ['氷とよくシェイクし、冷やしたグラスにダブルストレインします。', '卵白を使う場合は強く振ります。'],
    ['Shakerare bene con ghiaccio e filtrare due volte in una coppa fredda.', 'Con albume, shakerare energicamente.'],
  ), cocktailGlass, L('Mint sprigs', '薄荷枝', 'Brins de menthe', 'Minzzweige', 'Ramitas de menta', '민트 줄기', 'ミントの枝', 'Rametti di menta')),

  recipe('spicy-fifty', [
    {ingredientId: 'vanilla-vodka', amount: 50, unit: 'ml'}, {ingredientId: 'elderflower-cordial', amount: 15, unit: 'ml'},
    {ingredientId: 'lime-juice', amount: 15, unit: 'ml'}, {ingredientId: 'honey-syrup', amount: 10, unit: 'ml', brandId: 'brand-monin'},
    {ingredientId: 'red-chilli', amount: 2, unit: 'piece', note: L('Two thin slices.', '两片薄切。', 'Deux fines tranches.', 'Zwei dünne Scheiben.', 'Dos rodajas finas.', '얇은 조각 2개.', '薄切り2枚。', 'Due fettine sottili.')},
  ], S(
    ['Shake well with ice and double-strain into a chilled cocktail glass.'],
    ['加冰充分摇匀，双重过滤入冰镇鸡尾酒杯。'],
    ['Bien shaker avec glace et filtrer deux fois dans un verre refroidi.'],
    ['Mit Eis gut shaken und doppelt in ein gekühltes Cocktailglas abseihen.'],
    ['Agita bien con hielo y cuela dos veces en una copa fría.'],
    ['얼음과 잘 흔들어 차가운 칵테일 글라스에 더블 스트레인합니다.'],
    ['氷とよくシェイクし、冷やしたグラスにダブルストレインします。'],
    ['Shakerare bene con ghiaccio e filtrare due volte in una coppa fredda.'],
  ), cocktailGlass, L('Red chilli pepper', '红辣椒', 'Piment rouge', 'Rote Chilischote', 'Chile rojo', '홍고추', '赤唐辛子', 'Peperoncino rosso')),

  recipe('stinger', [
    {ingredientId: 'cognac', amount: 50, unit: 'ml'}, {ingredientId: 'white-creme-de-menthe', amount: 20, unit: 'ml'},
  ], stirStrain, L('Chilled martini glass', '冰镇马天尼杯', 'Verre à martini refroidi', 'Gekühltes Martiniglas', 'Copa martini fría', '차가운 마티니 글라스', '冷やしたマティーニグラス', 'Coppa Martini fredda'), L('Mint leaf, optional', '可选薄荷叶', 'Feuille de menthe facultative', 'Minzblatt, optional', 'Hoja de menta opcional', '민트 잎, 선택 사항', 'ミントの葉、任意', 'Foglia di menta facoltativa')),

  recipe('suffering-bastard', [
    {ingredientId: 'cognac', amount: 30, unit: 'ml', note: L('The source also allows brandy.', '来源也允许使用白兰地。', 'La source permet aussi le brandy.', 'Die Quelle erlaubt auch Brandy.', 'La fuente también permite brandy.', '출처는 브랜디도 허용합니다.', '出典はブランデーも可としています。', 'La fonte consente anche il brandy.')},
    {ingredientId: 'gin', amount: 30, unit: 'ml'}, {ingredientId: 'lime-juice', amount: 15, unit: 'ml'},
    {ingredientId: 'angostura-bitters', amount: 2, unit: 'dash', brandId: 'brand-angostura-aromatic'}, {ingredientId: 'ginger-beer', amount: null, unit: 'top'},
  ], S(
    ['Shake everything except ginger beer with ice.', 'Pour unstrained into a Collins glass or Suffering Bastard mug and top with ginger beer.'],
    ['除姜汁啤酒外全部加冰摇匀。', '不过滤倒入柯林杯或专用杯，以姜汁啤酒补满。'],
    ['Shaker tout sauf la ginger beer avec glace.', 'Verser sans filtrer dans un Collins ou mug dédié et compléter de ginger beer.'],
    ['Alles außer Ginger Beer mit Eis shaken.', 'Ungeseiht in Collinsglas oder Spezialbecher gießen und Ginger Beer auffüllen.'],
    ['Agita todo salvo la cerveza de jengibre con hielo.', 'Vierte sin colar en Collins o taza propia y completa con ginger beer.'],
    ['진저 비어를 제외한 재료를 얼음과 흔듭니다.', '거르지 않고 콜린스나 전용 머그에 부어 진저 비어로 채웁니다.'],
    ['ジンジャービア以外を氷とシェイクします。', 'こさずにコリンズまたは専用マグへ注ぎ、ジンジャービアで満たします。'],
    ['Shakerare tutto tranne la ginger beer con ghiaccio.', 'Versare senza filtrare in un Collins o mug dedicato e colmare con ginger beer.'],
  ), L('Collins glass or Suffering Bastard mug', '柯林杯或专用杯', 'Verre Collins ou mug Suffering Bastard', 'Collinsglas oder Suffering-Bastard-Becher', 'Vaso Collins o taza Suffering Bastard', '콜린스 글라스 또는 서퍼링 바스타드 머그', 'コリンズグラスまたは専用マグ', 'Collins o mug Suffering Bastard'), L('Mint sprig; orange slice optional', '薄荷枝；可选橙片', 'Brin de menthe ; tranche d’orange facultative', 'Minzzweig; Orangenscheibe optional', 'Ramita de menta; rodaja de naranja opcional', '민트 줄기, 오렌지 슬라이스는 선택', 'ミントの枝。オレンジスライスは任意', 'Rametto di menta; fetta d’arancia facoltativa')),

  recipe('tequila-sunrise', [
    {ingredientId: 'tequila', amount: 45, unit: 'ml'}, {ingredientId: 'orange-juice', amount: 90, unit: 'ml'}, {ingredientId: 'grenadine-syrup', amount: 15, unit: 'ml'},
  ], S(
    ['Pour tequila and orange juice into an ice-filled highball.', 'Add grenadine to create the sunrise effect; do not stir.'],
    ['将特基拉与橙汁倒入装冰的高球杯。', '加入石榴糖浆形成日出层次；不要搅拌。'],
    ['Verser tequila et orange dans un highball glacé.', 'Ajouter la grenadine pour l’effet lever de soleil ; ne pas remuer.'],
    ['Tequila und Orangensaft in einen Highball mit Eis geben.', 'Grenadine für den Sonnenaufgang zugeben; nicht rühren.'],
    ['Vierte tequila y naranja en un highball con hielo.', 'Añade granadina para el amanecer; no remuevas.'],
    ['얼음 든 하이볼에 테킬라와 오렌지 주스를 붓습니다.', '그레나딘을 넣어 일출 층을 만들고 젓지 않습니다.'],
    ['氷入りのハイボールにテキーラとオレンジ果汁を注ぎます。', 'グレナデンで日の出の層を作り、混ぜません。'],
    ['Versare tequila e arancia in un highball con ghiaccio.', 'Aggiungere granatina per l’alba; non mescolare.'],
  ), highball, L('Half orange slice or orange zest', '半片橙或橙皮', 'Demi-tranche ou zeste d’orange', 'Halbe Orangenscheibe oder Zeste', 'Media rodaja o piel de naranja', '오렌지 반쪽 슬라이스 또는 제스트', 'オレンジ半月切りまたはゼスト', 'Mezza fetta o scorza d’arancia')),


  recipe('three-dots-and-a-dash', [
    {ingredientId: 'martinique-agricole-rhum', amount: 45, unit: 'ml'}, {ingredientId: 'blended-aged-rum', amount: 15, unit: 'ml'},
    {ingredientId: 'falernum', amount: 7.5, unit: 'ml'}, {ingredientId: 'allspice-dram', amount: 7.5, unit: 'ml', brandId: 'brand-st-elizabeth'},
    {ingredientId: 'lime-juice', amount: 15, unit: 'ml'}, {ingredientId: 'orange-juice', amount: 15, unit: 'ml'},
    {ingredientId: 'honey-syrup', amount: 15, unit: 'ml'}, {ingredientId: 'angostura-bitters', amount: 2, unit: 'dash', brandId: 'brand-angostura-aromatic'},
  ], S(
    ['Flash-blend all ingredients with 12 oz of crushed ice.', 'Pour into a footed copo glass and fill with more crushed ice.'],
    ['将所有材料与 12 盎司碎冰快速搅打。', '倒入带脚 copo 杯，再加满碎冰。'],
    ['Mixer brièvement avec 12 oz de glace pilée.', 'Verser dans un copo à pied et ajouter encore de la glace pilée.'],
    ['Alles mit 12 oz Crushed Ice kurz blenden.', 'In ein Copo-Glas mit Fuß gießen und mit weiterem Crushed Ice füllen.'],
    ['Bate brevemente todo con 12 oz de hielo picado.', 'Vierte en una copa copo con pie y añade más hielo picado.'],
    ['모든 재료를 크러시드 아이스 12oz와 짧게 블렌딩합니다.', '풋티드 코포 글라스에 붓고 크러시드 아이스를 더 채웁니다.'],
    ['全材料を12ozのクラッシュドアイスと短くブレンドします。', '脚付きコポグラスに注ぎ、さらにクラッシュドアイスを加えます。'],
    ['Frullare brevemente tutto con 12 oz di ghiaccio tritato.', 'Versare in un copo con stelo e aggiungere altro ghiaccio tritato.'],
  ), L('Footed copo glass', '带脚 copo 杯', 'Verre copo à pied', 'Copo-Glas mit Fuß', 'Copa copo con pie', '풋티드 코포 글라스', '脚付きコポグラス', 'Copo con stelo'), L('Three cherries and a rectangular pineapple chunk', '三颗樱桃与长方形菠萝块', 'Trois cerises et morceau rectangulaire d’ananas', 'Drei Kirschen und rechteckiges Ananasstück', 'Tres cerezas y un trozo rectangular de piña', '체리 3개와 직사각형 파인애플 조각', 'チェリー3個と長方形のパイナップル', 'Tre ciliegie e un pezzo rettangolare d’ananas')),

  recipe('tipperary', [
    {ingredientId: 'irish-whiskey', amount: 50, unit: 'ml'}, {ingredientId: 'sweet-red-vermouth', amount: 25, unit: 'ml'},
    {ingredientId: 'green-chartreuse', amount: 15, unit: 'ml', brandId: 'brand-chartreuse'}, {ingredientId: 'angostura-bitters', amount: 2, unit: 'dash', brandId: 'brand-angostura-aromatic'},
  ], stirStrain, L('Chilled martini glass', '冰镇马天尼杯', 'Verre à martini refroidi', 'Gekühltes Martiniglas', 'Copa martini fría', '차가운 마티니 글라스', '冷やしたマティーニグラス', 'Coppa Martini fredda'), L('Orange slice', '橙片', 'Tranche d’orange', 'Orangenscheibe', 'Rodaja de naranja', '오렌지 슬라이스', 'オレンジスライス', 'Fetta d’arancia')),

  recipe('tommys-margarita', [
    {ingredientId: 'tequila', amount: 60, unit: 'ml', note: L('The source specifies 100% agave tequila.', '来源指定 100% 龙舌兰特基拉。', 'La source précise une tequila 100 % agave.', 'Die Quelle nennt 100 % Agave-Tequila.', 'La fuente especifica tequila 100 % agave.', '출처는 100% 아가베 테킬라를 지정합니다.', '出典は100％アガベテキーラを指定しています。', 'La fonte specifica tequila 100% agave.')},
    {ingredientId: 'lime-juice', amount: 30, unit: 'ml'}, {ingredientId: 'agave-nectar', amount: 30, unit: 'ml'},
  ], S(
    ['Shake well with ice and strain over ice into a chilled rocks glass.'],
    ['加冰充分摇匀，滤入装冰的冰镇岩石杯。'],
    ['Bien shaker avec glace et filtrer sur glace dans un verre rocks refroidi.'],
    ['Mit Eis gut shaken und über Eis in einen gekühlten Tumbler abseihen.'],
    ['Agita bien con hielo y cuela sobre hielo en un vaso bajo frío.'],
    ['얼음과 잘 흔들어 얼음 든 차가운 록스 글라스에 거릅니다.'],
    ['氷とよくシェイクし、氷入りの冷やしたロックグラスにこします。'],
    ['Shakerare bene con ghiaccio e filtrare su ghiaccio in un tumbler freddo.'],
  ), rocks, L('Lime slice', '青柠片', 'Tranche de citron vert', 'Limettenscheibe', 'Rodaja de lima', '라임 슬라이스', 'ライムスライス', 'Fetta di lime')),

  recipe('trinidad-sour', [
    {ingredientId: 'angostura-bitters', amount: 45, unit: 'ml', brandId: 'brand-angostura-aromatic'}, {ingredientId: 'orgeat', amount: 30, unit: 'ml'},
    {ingredientId: 'lemon-juice', amount: 22.5, unit: 'ml'}, {ingredientId: 'rye-whiskey', amount: 15, unit: 'ml'},
  ], shakeStrain, cocktailGlass, noGarnish),

  recipe('tuxedo', [
    {ingredientId: 'old-tom-gin', amount: 30, unit: 'ml', note: L('The source specifies Old Tom gin.', '来源指定老汤姆金酒。', 'La source précise un gin Old Tom.', 'Die Quelle nennt Old Tom Gin.', 'La fuente especifica ginebra Old Tom.', '출처는 올드 톰 진을 지정합니다.', '出典はオールドトムジンを指定しています。', 'La fonte specifica Old Tom gin.')},
    {ingredientId: 'dry-vermouth', amount: 30, unit: 'ml'}, {ingredientId: 'maraschino-liqueur', amount: 0.5, unit: 'barspoon', brandId: 'brand-luxardo'},
    {ingredientId: 'absinthe', amount: 0.25, unit: 'barspoon'}, {ingredientId: 'orange-bitters', amount: 3, unit: 'dash'},
  ], stirStrain, L('Chilled martini glass', '冰镇马天尼杯', 'Verre à martini refroidi', 'Gekühltes Martiniglas', 'Copa martini fría', '차가운 마티니 글라스', '冷やしたマティーニグラス', 'Coppa Martini fredda'), L('Cherry and lemon zest', '樱桃与柠檬皮', 'Cerise et zeste de citron', 'Kirsche und Zitronenzeste', 'Cereza y piel de limón', '체리와 레몬 제스트', 'チェリーとレモンゼスト', 'Ciliegia e scorza di limone')),

  recipe('ve-n-to', [
    {ingredientId: 'grappa', amount: 45, unit: 'ml'}, {ingredientId: 'lemon-juice', amount: 22.5, unit: 'ml'},
    {ingredientId: 'honey-syrup', amount: 15, unit: 'ml', note: L('Honey mix; the source permits chamomile infusion in place of water.', '蜂蜜混合液；来源允许以洋甘菊浸液代替水。', 'Honey mix ; la source permet de remplacer l’eau par une infusion de camomille.', 'Honey Mix; laut Quelle kann Wasser durch Kamillentee ersetzt werden.', 'Mezcla de miel; la fuente permite sustituir el agua por infusión de manzanilla.', '허니 믹스. 출처는 물 대신 캐모마일 우린 물을 허용합니다.', 'ハニーミックス。出典では水をカモミール浸出液に置換可。', 'Honey mix; la fonte permette di sostituire l’acqua con infuso di camomilla.')},
    {ingredientId: 'chamomile-cordial', amount: 15, unit: 'ml'}, {ingredientId: 'egg-white', amount: null, unit: 'drop', optional: true, note: noteFewDrops},
  ], S(
    ['Shake vigorously with ice and strain over ice into a chilled small tumbler.'],
    ['加冰用力摇匀，滤入装冰的冰镇小平底杯。'],
    ['Shaker vigoureusement avec glace et filtrer sur glace dans un petit tumbler refroidi.'],
    ['Kräftig mit Eis shaken und über Eis in einen gekühlten kleinen Tumbler abseihen.'],
    ['Agita con fuerza con hielo y cuela sobre hielo en un vaso bajo pequeño y frío.'],
    ['얼음과 세게 흔들어 얼음 든 차가운 작은 텀블러에 거릅니다.'],
    ['氷と強くシェイクし、氷入りの冷やした小さなタンブラーにこします。'],
    ['Shakerare forte con ghiaccio e filtrare su ghiaccio in un piccolo tumbler freddo.'],
  ), L('Chilled small tumbler', '冰镇小平底杯', 'Petit tumbler refroidi', 'Gekühlter kleiner Tumbler', 'Vaso bajo pequeño y frío', '차가운 작은 텀블러', '冷やした小さなタンブラー', 'Piccolo tumbler freddo'), L('Lemon zest and white grapes', '柠檬皮与白葡萄', 'Zeste de citron et raisins blancs', 'Zitronenzeste und weiße Trauben', 'Piel de limón y uvas blancas', '레몬 제스트와 청포도', 'レモンゼストと白ブドウ', 'Scorza di limone e uva bianca')),

  recipe('vesper', [
    {ingredientId: 'gin', amount: 45, unit: 'ml'}, {ingredientId: 'vodka', amount: 15, unit: 'ml'}, {ingredientId: 'lillet-blanc', amount: 7.5, unit: 'ml', brandId: 'brand-lillet'},
  ], shakeStrain, cocktailGlass, L('Lemon zest', '柠檬皮', 'Zeste de citron', 'Zitronenzeste', 'Piel de limón', '레몬 제스트', 'レモンゼスト', 'Scorza di limone')),

  recipe('vieux-carre', [
    {ingredientId: 'rye-whiskey', amount: 30, unit: 'ml'}, {ingredientId: 'cognac', amount: 30, unit: 'ml'}, {ingredientId: 'sweet-red-vermouth', amount: 30, unit: 'ml'},
    {ingredientId: 'benedictine', amount: 1, unit: 'barspoon', brandId: 'brand-benedictine'}, {ingredientId: 'peychauds-bitters', amount: 2, unit: 'dash', brandId: 'brand-peychauds'},
  ], stirStrain, cocktailGlass, L('Orange zest and maraschino cherry', '橙皮与马拉斯奇诺樱桃', 'Zeste d’orange et cerise au marasquin', 'Orangenzeste und Maraschinokirsche', 'Piel de naranja y cereza al marrasquino', '오렌지 제스트와 마라스키노 체리', 'オレンジゼストとマラスキーノチェリー', 'Scorza d’arancia e ciliegia al maraschino')),

  recipe('white-lady', [
    {ingredientId: 'gin', amount: 40, unit: 'ml'}, {ingredientId: 'triple-sec', amount: 30, unit: 'ml'}, {ingredientId: 'lemon-juice', amount: 20, unit: 'ml'},
  ], shakeStrain, cocktailGlass, noGarnish),

  recipe('zombie', [
    {ingredientId: 'jamaican-rum', amount: 45, unit: 'ml', note: L('The source specifies Jamaican dark rum.', '来源指定牙买加深色朗姆。', 'La source précise un rhum jamaïcain brun.', 'Die Quelle nennt dunklen jamaikanischen Rum.', 'La fuente especifica ron jamaicano oscuro.', '출처는 자메이카 다크 럼을 지정합니다.', '出典はジャマイカン・ダークラムを指定しています。', 'La fonte specifica rum giamaicano scuro.')},
    {ingredientId: 'puerto-rican-rum', amount: 45, unit: 'ml'}, {ingredientId: 'demerara-rum', amount: 30, unit: 'ml'},
    {ingredientId: 'lime-juice', amount: 20, unit: 'ml'}, {ingredientId: 'falernum', amount: 15, unit: 'ml'},
    {ingredientId: 'donns-mix', amount: 15, unit: 'ml', note: L('Donn’s Mix is two parts fresh yellow grapefruit juice to one part cinnamon syrup.', 'Donn’s Mix 由两份新鲜黄葡萄柚汁与一份肉桂糖浆组成。', 'Donn’s Mix contient deux parts de jus de pamplemousse jaune frais pour une part de sirop de cannelle.', 'Donn’s Mix besteht aus zwei Teilen frischem gelbem Grapefruitsaft und einem Teil Zimtsirup.', 'Donn’s Mix lleva dos partes de zumo fresco de pomelo amarillo y una de sirope de canela.', '돈스 믹스는 신선한 옐로 자몽 주스 2와 시나몬 시럽 1의 비율입니다.', 'ドンズ・ミックスはフレッシュなイエローグレープフルーツ果汁2にシナモンシロップ1です。', 'Donn’s Mix è due parti di succo fresco di pompelmo giallo e una di sciroppo alla cannella.')},
    {ingredientId: 'grenadine-syrup', amount: 1, unit: 'tsp'}, {ingredientId: 'angostura-bitters', amount: 1, unit: 'dash', brandId: 'brand-angostura-aromatic'},
    {ingredientId: 'pernod', amount: 6, unit: 'drop', brandId: 'brand-pernod'},
  ], S(
    ['Pulse-blend all ingredients briefly with 170 g of cracked ice.', 'Serve in a tall tumbler.'],
    ['将所有材料与 170 克碎裂冰短暂脉冲搅打。', '倒入高平底杯。'],
    ['Mixer brièvement par impulsions avec 170 g de glace concassée.', 'Servir dans un grand tumbler.'],
    ['Alle Zutaten mit 170 g gebrochenem Eis kurz pulsieren.', 'In einem hohen Tumbler servieren.'],
    ['Bate por pulsos unos segundos con 170 g de hielo quebrado.', 'Sirve en un vaso alto.'],
    ['모든 재료를 깨진 얼음 170g과 몇 초간 펄스 블렌딩합니다.', '긴 텀블러에 냅니다.'],
    ['全材料を170gのクラッシュアイスと数秒パルスブレンドします。', '背の高いタンブラーで供します。'],
    ['Frullare a impulsi per pochi secondi con 170 g di ghiaccio spezzato.', 'Servire in un tumbler alto.'],
  ), L('Tall tumbler', '高平底杯', 'Grand tumbler', 'Hoher Tumbler', 'Vaso alto', '긴 텀블러', '背の高いタンブラー', 'Tumbler alto'), L('Mint leaves', '薄荷叶', 'Feuilles de menthe', 'Minzblätter', 'Hojas de menta', '민트 잎', 'ミントの葉', 'Foglie di menta')),
];

const sources: Source[] = profiles.map(({id, name}) => ({
  id: `iba-${id}`,
  title: `IBA — ${name.en}`,
  url: `https://iba-world.com/iba-cocktail/${id}/`,
  author: 'International Bartenders Association',
  checkedAt,
}));

export const batchD: CatalogueBatch = {cocktails, versions, sources, ingredients, brands};



