import type {Brand, Ingredient} from "../../domain/contracts";
import {L} from "./localized";

/**
 * Materials used by the first expansion batches. Recipe evidence and source
 * verification live with each recipe version; this registry only describes
 * the material itself and keeps unresolved compounds conservative.
 */
export const expansionIngredients: Ingredient[] = [
  {
    id: "maraschino-liqueur",
    name: L("Maraschino liqueur", "马拉斯奇诺利口酒", "Liqueur de marasquin", "Maraschino-Likör", "Licor de maraschino", "마라스키노 리큐어", "マラスキーノ・リキュール", "Liquore al maraschino"),
    exclusionTags: [], compositionKnown: false, brandIds: ["brand-luxardo"],
  },
  {
    id: "creme-de-violette",
    name: L("Crème de violette", "紫罗兰利口酒", "Liqueur de violette", "Veilchenlikör", "Licor de violeta", "크렘 드 바이올렛", "クレーム・ド・バイオレット", "Crème de violette"),
    exclusionTags: [], compositionKnown: false,
  },
  {
    id: "raspberry-syrup",
    name: L("Raspberry syrup", "覆盆子糖浆", "Sirop de framboise", "Himbeersirup", "Almíbar de frambuesa", "라즈베리 시럽", "ラズベリーシロップ", "Sciroppo di lampone"),
    exclusionTags: [], compositionKnown: false,
  },
  {
    id: "honey-syrup",
    name: L("Honey syrup", "蜂蜜糖浆", "Sirop de miel", "Honigsirup", "Almíbar de miel", "허니 시럽", "ハニーシロップ", "Sciroppo di miele"),
    exclusionTags: [], compositionKnown: false,
  },
  {
    id: "honey-ginger-syrup",
    name: L("Honey-ginger syrup", "蜂蜜姜糖浆", "Sirop de miel et de gingembre", "Honig-Ingwersirup", "Almíbar de miel y jengibre", "허니 진저 시럽", "ハニー・ジンジャーシロップ", "Sciroppo di miele e zenzero"),
    exclusionTags: [], compositionKnown: false,
  },
  {
    id: "creme-de-mure",
    name: L("Crème de mûre", "黑莓利口酒", "Liqueur de mûre", "Brombeerlikör", "Licor de mora", "크렘 드 뮈르", "クレーム・ド・ミュール", "Crème de mûre"),
    exclusionTags: [], compositionKnown: false,
  },
  {
    id: "green-chartreuse",
    name: L("Green Chartreuse", "绿色查特酒", "Chartreuse verte", "Grüne Chartreuse", "Chartreuse verde", "그린 샤르트뢰즈", "グリーン・シャルトリューズ", "Chartreuse verde"),
    exclusionTags: [], compositionKnown: false, brandIds: ["brand-chartreuse"],
  },
  {
    id: "champagne",
    name: L("Champagne", "香槟", "Champagne", "Champagner", "Champán", "샴페인", "シャンパン", "Champagne"),
    exclusionTags: [], compositionKnown: false,
  },
  {
    id: "rye-whiskey",
    name: L("Rye whiskey", "黑麦威士忌", "Whiskey de seigle", "Rye-Whiskey", "Whiskey de centeno", "라이 위스키", "ライウイスキー", "Whiskey rye"),
    base: "whiskey", exclusionTags: ["whiskey"], compositionKnown: true,
  },
  {
    id: "cognac",
    name: L("Cognac", "干邑", "Cognac", "Cognac", "Coñac", "코냑", "コニャック", "Cognac"),
    base: "brandy", exclusionTags: ["brandy"], compositionKnown: true,
  },
  {
    id: "absinthe",
    name: L("Absinthe", "苦艾酒", "Absinthe", "Absinth", "Absenta", "압생트", "アブサン", "Assenzio"),
    exclusionTags: [], compositionKnown: false,
  },
  {
    id: "peychauds-bitters",
    name: L("Peychaud’s bitters", "Peychaud’s 苦精", "Bitters Peychaud’s", "Peychaud’s Bitters", "Bitters de Peychaud", "페이쇼드 비터스", "ペイショーズ・ビターズ", "Bitter Peychaud’s"),
    exclusionTags: [], compositionKnown: false,
  },
  {
    id: "scotch-whisky",
    name: L("Blended Scotch whisky", "调和苏格兰威士忌", "Whisky écossais blended", "Blended Scotch Whisky", "Whisky escocés blended", "블렌디드 스카치 위스키", "ブレンデッド・スコッチ・ウイスキー", "Scotch whisky blended"),
    base: "whiskey", exclusionTags: ["whiskey"], compositionKnown: true,
  },
  {
    id: "islay-whisky",
    name: L("Islay single malt whisky", "艾雷单一麦芽威士忌", "Single malt d’Islay", "Islay Single Malt Whisky", "Whisky single malt de Islay", "아일라 싱글 몰트 위스키", "アイラ・シングルモルト・ウイスキー", "Single malt di Islay"),
    base: "whiskey", exclusionTags: ["whiskey"], compositionKnown: true, brandIds: ["brand-lagavulin"],
  },
  {
    id: "ginger",
    name: L("Fresh ginger", "新鲜生姜", "Gingembre frais", "Frischer Ingwer", "Jengibre fresco", "생강", "生姜", "Zenzero fresco"),
    exclusionTags: [], compositionKnown: true,
  },
  {
    id: "honey",
    name: L("Honey", "蜂蜜", "Miel", "Honig", "Miel", "꿀", "はちみつ", "Miele"),
    exclusionTags: [], compositionKnown: true,
  },
  {
    id: "aperol",
    name: L("Aperol", "Aperol", "Aperol", "Aperol", "Aperol", "아페롤", "アペロール", "Aperol"),
    exclusionTags: [], compositionKnown: false, brandIds: ["brand-aperol"],
  },
  {
    id: "amaro-nonino",
    name: L("Amaro Nonino", "Amaro Nonino", "Amaro Nonino", "Amaro Nonino", "Amaro Nonino", "아마로 노니노", "アマーロ・ノニーノ", "Amaro Nonino"),
    exclusionTags: [], compositionKnown: false, brandIds: ["brand-nonino"],
  },
  {
    id: "brandy",
    name: L("Brandy", "白兰地", "Brandy", "Brandy", "Brandy", "브랜디", "ブランデー", "Brandy"),
    base: "brandy", exclusionTags: ["brandy"], compositionKnown: true,
  },
  {
    id: "creme-de-cacao",
    name: L("Crème de cacao", "可可利口酒", "Crème de cacao", "Kakaolikör", "Licor de cacao", "크렘 드 카카오", "クレーム・ド・カカオ", "Crème de cacao"),
    exclusionTags: [], compositionKnown: false,
  },
  {
    id: "cream",
    name: L("Cream", "淡奶油", "Crème", "Sahne", "Nata", "크림", "クリーム", "Panna"),
    exclusionTags: ["dairy"], compositionKnown: true,
  },
  {
    id: "pisco",
    name: L("Pisco", "皮斯科", "Pisco", "Pisco", "Pisco", "피스코", "ピスコ", "Pisco"),
    base: "brandy", exclusionTags: ["brandy"], compositionKnown: true,
  },
  {
    id: "citron-vodka",
    name: L("Citron vodka", "柠檬伏特加", "Vodka citron", "Zitronenwodka", "Vodka de limón", "시트론 보드카", "シトロンウォッカ", "Vodka al limone"),
    base: "vodka", exclusionTags: ["vodka"], compositionKnown: true,
  },
  {
    id: "cranberry-juice",
    name: L("Cranberry juice", "蔓越莓汁", "Jus de cranberry", "Cranberrysaft", "Zumo de arándano rojo", "크랜베리 주스", "クランベリージュース", "Succo di cranberry"),
    exclusionTags: [], compositionKnown: true,
  },
  {
    id: "ginger-beer",
    name: L("Ginger beer", "姜汁汽水", "Bière de gingembre", "Gingerbier", "Cerveza de jengibre", "진저 비어", "ジンジャービール", "Ginger beer"),
    exclusionTags: [], compositionKnown: false,
  },
  {
    id: "lime-wedges",
    name: L("Lime wedges", "青柠角", "Quartiers de citron vert", "Limettenstücke", "Gajos de lima", "라임 웨지", "ライムのくし形切り", "Spicchi di lime"),
    exclusionTags: [], compositionKnown: true,
  },
  {
    id: "tomato-juice",
    name: L("Tomato juice", "番茄汁", "Jus de tomate", "Tomatensaft", "Zumo de tomate", "토마토 주스", "トマトジュース", "Succo di pomodoro"),
    exclusionTags: [], compositionKnown: true,
  },
  {
    id: "worcestershire-sauce",
    name: L("Worcestershire sauce", "Worcestershire 酱", "Sauce Worcestershire", "Worcestershiresauce", "Salsa Worcestershire", "우스터소스", "ウスターソース", "Salsa Worcestershire"),
    exclusionTags: [], compositionKnown: false,
  },
  {
    id: "tabasco",
    name: L("Tabasco", "Tabasco 辣椒酱", "Tabasco", "Tabasco", "Tabasco", "타바스코", "タバスコ", "Tabasco"),
    exclusionTags: [], compositionKnown: false, brandIds: ["brand-tabasco"],
  },
  {
    id: "celery-salt",
    name: L("Celery salt", "芹盐", "Sel de céleri", "Selleriesalz", "Sal de apio", "셀러리 솔트", "セロリソルト", "Sale di sedano"),
    exclusionTags: [], compositionKnown: false,
  },
  {
    id: "black-pepper",
    name: L("Black pepper", "黑胡椒", "Poivre noir", "Schwarzer Pfeffer", "Pimienta negra", "후추", "黒こしょう", "Pepe nero"),
    exclusionTags: [], compositionKnown: true,
  },
  {
    id: "light-rum",
    name: L("Light rum", "淡色朗姆酒", "Rhum léger", "Heller Rum", "Ron ligero", "라이트 럼", "ライトラム", "Rum chiaro"),
    base: "rum", exclusionTags: ["rum"], compositionKnown: true,
  },
  {
    id: "coconut-cream",
    name: L("Coconut cream", "椰浆", "Crème de coco", "Kokoscreme", "Crema de coco", "코코넛 크림", "ココナッツクリーム", "Crema di cocco"),
    exclusionTags: [], compositionKnown: false,
  },
  {
    id: "jamaican-rum",
    name: L("Jamaican rum", "牙买加朗姆酒", "Rhum jamaïcain", "Jamaikanischer Rum", "Ron jamaicano", "자메이카 럼", "ジャマイカンラム", "Rum giamaicano"),
    base: "rum", exclusionTags: ["rum"], compositionKnown: true,
  },
  {
    id: "martinique-rum",
    name: L("Martinique rum", "马提尼克朗姆酒", "Rhum martiniquais", "Martinique-Rum", "Ron de Martinica", "마르티니크 럼", "マルティニークラム", "Rum della Martinica"),
    base: "rum", exclusionTags: ["rum"], compositionKnown: true,
  },
  {
    id: "orange-curacao",
    name: L("Orange curaçao", "橙味库拉索利口酒", "Curaçao orange", "Orangen-Curaçao", "Curaçao de naranja", "오렌지 큐라소", "オレンジ・キュラソー", "Curaçao all’arancia"),
    exclusionTags: [], compositionKnown: false,
  },
  {
    id: "orgeat",
    name: L("Orgeat", "杏仁糖浆", "Sirop d’orgeat", "Orgeatsirup", "Sirope de orgeat", "오르제 시럽", "オルジェシロップ", "Sciroppo d’orzata"),
    exclusionTags: [], compositionKnown: false,
  },
  {
    id: "cola",
    name: L("Cola", "可乐", "Cola", "Cola", "Cola", "콜라", "コーラ", "Cola"),
    exclusionTags: [], compositionKnown: false,
  },
  {
    id: "dark-rum",
    name: L("Dark rum", "深色朗姆酒", "Rhum ambré", "Dunkler Rum", "Ron oscuro", "다크 럼", "ダークラム", "Rum scuro"),
    base: "rum", exclusionTags: ["rum"], compositionKnown: true, brandIds: ["brand-goslings"],
  },
  {
    id: "prosecco",
    name: L("Prosecco", "普罗塞克", "Prosecco", "Prosecco", "Prosecco", "프로세코", "プロセッコ", "Prosecco"),
    exclusionTags: [], compositionKnown: false,
  },
  {
    id: "orange-juice",
    name: L("Orange juice", "橙汁", "Jus d’orange", "Orangensaft", "Zumo de naranja", "오렌지 주스", "オレンジジュース", "Succo d’arancia"),
    exclusionTags: [], compositionKnown: true,
  },
  {
    id: "powdered-sugar",
    name: L("Powdered sugar", "糖粉", "Sucre glace", "Puderzucker", "Azúcar glas", "슈거파우더", "粉砂糖", "Zucchero a velo"),
    exclusionTags: [], compositionKnown: true,
  },
  {
    id: "amargo-bitters",
    name: L("Amargo bitters", "Amargo 苦精", "Bitters Amargo", "Amargo Bitters", "Bitters Amargo", "아마르고 비터스", "アマルゴ・ビターズ", "Bitter Amargo"),
    exclusionTags: [], compositionKnown: false,
  },
];

/** Brands explicitly named by the checked recipe authors; generic materials stay unbranded. */
export const expansionBrands: Brand[] = [
  { id: "brand-luxardo", name: "Luxardo", ingredientIds: ["maraschino-liqueur"] },
  { id: "brand-chartreuse", name: "Chartreuse", ingredientIds: ["green-chartreuse"] },
  { id: "brand-lagavulin", name: "Lagavulin", ingredientIds: ["islay-whisky"] },
  { id: "brand-nonino", name: "Nonino", ingredientIds: ["amaro-nonino"] },
  { id: "brand-goslings", name: "Goslings", ingredientIds: ["dark-rum"] },
  { id: "brand-aperol", name: "Aperol", ingredientIds: ["aperol"] },
  { id: "brand-tabasco", name: "Tabasco", ingredientIds: ["tabasco"] },
  { id: "brand-smirnoff", name: "Smirnoff", ingredientIds: ["vodka"] },
  { id: "brand-cointreau", name: "Cointreau", ingredientIds: ["triple-sec"] },
  { id: "brand-peychauds", name: "Peychaud’s", ingredientIds: ["peychauds-bitters"] },
];
