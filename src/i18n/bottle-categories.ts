import type {Locale, Localized} from '../domain/contracts';
import type {Bottle, BottleFamily} from '../domain/bottles/types';

/** Keep sake explicit in this table so it cannot be confused with shochu or soju. */
type BottleFamilyLabelKey = BottleFamily | 'sake';

const familyLabels = {
  gin: {
    en: 'Gin', zh: '金酒', fr: 'Gin', de: 'Gin', es: 'Ginebra', ko: '진', ja: 'ジン', it: 'Gin',
  },
  rum: {
    en: 'Rum', zh: '朗姆酒', fr: 'Rhum', de: 'Rum', es: 'Ron', ko: '럼', ja: 'ラム', it: 'Rum',
  },
  tequila: {
    en: 'Tequila', zh: '龙舌兰酒', fr: 'Tequila', de: 'Tequila', es: 'Tequila', ko: '데킬라', ja: 'テキーラ', it: 'Tequila',
  },
  whiskey: {
    en: 'Whiskey', zh: '威士忌', fr: 'Whisky', de: 'Whisky', es: 'Whisky', ko: '위스키', ja: 'ウイスキー', it: 'Whisky',
  },
  vodka: {
    en: 'Vodka', zh: '伏特加', fr: 'Vodka', de: 'Wodka', es: 'Vodka', ko: '보드카', ja: 'ウォッカ', it: 'Vodka',
  },
  brandy: {
    en: 'Brandy', zh: '白兰地', fr: 'Brandy', de: 'Brandy', es: 'Brandy', ko: '브랜디', ja: 'ブランデー', it: 'Brandy',
  },
  mezcal: {
    en: 'Mezcal', zh: '梅斯卡尔', fr: 'Mezcal', de: 'Mezcal', es: 'Mezcal', ko: '메스칼', ja: 'メスカル', it: 'Mezcal',
  },
  cachaca: {
    en: 'Cachaça', zh: '卡莎萨', fr: 'Cachaça', de: 'Cachaça', es: 'Cachaça', ko: '카샤사', ja: 'カシャッサ', it: 'Cachaça',
  },
  grappa: {
    en: 'Grappa', zh: '格拉帕', fr: 'Grappa', de: 'Grappa', es: 'Grappa', ko: '그라파', ja: 'グラッパ', it: 'Grappa',
  },
  liqueur: {
    en: 'Liqueur', zh: '利口酒', fr: 'Liqueur', de: 'Likör', es: 'Licor', ko: '리큐르', ja: 'リキュール', it: 'Liquore',
  },
  wine: {
    en: 'Wine / aromatized or fortified wine', zh: '葡萄酒／加香强化酒', fr: 'Vin / vin aromatisé ou muté', de: 'Wein / aromatisierter oder aufgespriteter Wein',
    es: 'Vino / vino aromatizado o fortificado', ko: '와인(포도주·가향/주정강화 와인)', ja: 'ワイン（葡萄酒／加香・酒精強化ワイン）', it: 'Vino / vino aromatizzato o liquoroso',
  },
  bitters: {
    en: 'Bitters', zh: '苦精', fr: 'Bitters', de: 'Bitters', es: 'Bíteres', ko: '비터스', ja: 'ビターズ', it: 'Bitter',
  },
  pisco: {
    en: 'Pisco', zh: '皮斯科', fr: 'Pisco', de: 'Pisco', es: 'Pisco', ko: '피스코', ja: 'ピスコ', it: 'Pisco',
  },
  absinthe: {
    en: 'Absinthe', zh: '苦艾酒', fr: 'Absinthe', de: 'Absinth', es: 'Absenta', ko: '압생트', ja: 'アブサン', it: 'Assenzio',
  },
  aquavit: {
    en: 'Aquavit', zh: '阿夸维特', fr: 'Aquavit', de: 'Aquavit', es: 'Aquavit', ko: '아쿠아비트', ja: 'アクアビット', it: 'Aquavit',
  },
  genever: {
    en: 'Genever', zh: '荷兰金酒', fr: 'Genièvre', de: 'Genever', es: 'Genever', ko: '제네버', ja: 'ジュネヴァ', it: 'Genever',
  },
  baijiu: {
    en: 'Baijiu', zh: '中国白酒', fr: 'Baijiu (spiritueux chinois)', de: 'Baijiu (chinesische Spirituose)', es: 'Baijiu (destilado chino)',
    ko: '바이주(중국 백주)', ja: '白酒（バイジュウ）', it: 'Baijiu (distillato cinese)',
  },
  shochu: {
    en: 'Shochu (Japan)', zh: '日本烧酎', fr: 'Shōchū (Japon)', de: 'Shōchū (Japan)', es: 'Shōchū (Japón)',
    ko: '쇼추(일본 증류주)', ja: '焼酎（日本）', it: 'Shōchū (Giappone)',
  },
  soju: {
    en: 'Soju (Korea)', zh: '韩国烧酒', fr: 'Soju (Corée)', de: 'Soju (Korea)', es: 'Soju (Corea)',
    ko: '소주(한국)', ja: 'ソジュ（韓国焼酎）', it: 'Soju (Corea)',
  },
  arrack: {
    en: 'Arrack', zh: '阿拉克酒', fr: 'Arak', de: 'Arrak', es: 'Arrack', ko: '아락', ja: 'アラック', it: 'Arrack',
  },
  sake: {
    en: 'Sake (Japan)', zh: '清酒', fr: 'Saké (Japon)', de: 'Sake (Japan)', es: 'Sake (Japón)',
    ko: '사케(일본 청주)', ja: '清酒（日本酒）', it: 'Sake (Giappone)',
  },
} satisfies Record<BottleFamilyLabelKey, Localized>;

const profileLabels = {
  producer: {
    en: 'Producer flavour description', zh: '生产商风味描述', fr: 'Description aromatique du producteur', de: 'Aromabeschreibung des Herstellers',
    es: 'Descripción de sabores del productor', ko: '생산자 풍미 설명', ja: '生産者による風味説明', it: 'Descrizione aromatica del produttore',
  },
  retailer: {
    en: 'Retailer product description', zh: '零售商产品描述', fr: 'Description du produit par le revendeur', de: 'Produktbeschreibung des Händlers',
    es: 'Descripción del producto del minorista', ko: '소매업체 제품 설명', ja: '小売業者による製品説明', it: 'Descrizione del prodotto del rivenditore',
  },
  identity: {
    en: 'Product type', zh: '产品类型', fr: 'Type de produit', de: 'Produkttyp',
    es: 'Tipo de producto', ko: '제품 종류', ja: '製品の種類', it: 'Tipologia del prodotto',
  },
} satisfies Record<Bottle['profileBasis'], Localized>;

type BottleSourceKind = Exclude<Bottle['sourceKind'], undefined>;

const sourceLabels = {
  producer: {
    en: 'Producer source', zh: '生产商来源', fr: 'Source du producteur', de: 'Herstellerquelle', es: 'Fuente del productor', ko: '생산자 출처', ja: '生産者の出典', it: 'Fonte del produttore',
  },
  retailer: {
    en: 'Retailer source', zh: '零售商来源', fr: 'Source du revendeur', de: 'Händlerquelle', es: 'Fuente del minorista', ko: '소매업체 출처', ja: '小売業者の出典', it: 'Fonte del rivenditore',
  },
  distributor: {
    en: 'Distributor source', zh: '经销商来源', fr: 'Source du distributeur', de: 'Vertriebsquelle', es: 'Fuente del distribuidor', ko: '유통업체 출처', ja: '卸売業者の出典', it: 'Fonte del distributore',
  },
} satisfies Record<BottleSourceKind, Localized>;

const labelFor = (labels: Localized, locale: Locale): string => labels[locale] ?? labels.en;

/** Localized bottle-family labels. Shochu, soju, sake, and baijiu stay explicit. */
export const bottleFamilyName = (family: BottleFamily, locale: Locale): string =>
  labelFor(familyLabels[family as BottleFamilyLabelKey] ?? familyLabels.gin, locale);

/**
 * Labels the provenance of a profile without presenting it as a common
 * tasting score. Identity deliberately says that only product type was
 * checked.
 */
export const bottleProfileLabel = (basis: Bottle['profileBasis'], locale: Locale): string =>
  labelFor(profileLabels[basis], locale);

/** An absent source kind is treated as the producer default. */
export const bottleSourceLabel = (
  kind: BottleSourceKind | undefined,
  locale: Locale,
): string => labelFor(sourceLabels[kind ?? 'producer'], locale);
