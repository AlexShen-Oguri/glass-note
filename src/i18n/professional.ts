import type {Locale} from '../domain/contracts';

const text = {
  title: [
    'Professional functions',
    '专业功能',
    'Fonctions professionnelles',
    'Professionelle Funktionen',
    'Funciones profesionales',
    '전문 기능',
    'プロ向け機能',
    'Funzioni professionali',
  ],
  description: [
    'Recipes, research and bottles for a closer look.',
    '配方、研究与瓶款，集中深入查看。',
    'Recettes, recherches et bouteilles à approfondir.',
    'Rezepte, Forschung und Flaschen für den genaueren Blick.',
    'Recetas, investigación y botellas para profundizar.',
    '레시피·연구·보틀을 더 깊이 살펴보세요.',
    'レシピ・研究・ボトルを深く見るために。',
    'Ricette, ricerche e bottiglie da esplorare più a fondo.',
  ],
  lab: [
    'My laboratory',
    '我的实验室',
    'Mon laboratoire',
    'Mein Labor',
    'Mi laboratorio',
    '내 실험실',
    'マイラボ',
    'Il mio laboratorio',
  ],
  labDescription: [
    'Test versions and record each pour.',
    '试调版本，记录每次变化。',
    'Testez vos versions et notez chaque essai.',
    'Versionen testen und jeden Versuch festhalten.',
    'Prueba versiones y registra cada ajuste.',
    '버전을 시험하고 매번의 변화를 기록하세요.',
    '版を試し、変化を記録する。',
    'Prova le versioni e annota ogni assaggio.',
  ],
  topics: [
    'Research collections',
    '专题研究',
    'Collections de recherche',
    'Forschungssammlungen',
    'Colecciones de estudio',
    '연구 컬렉션',
    '研究コレクション',
    'Raccolte di ricerca',
  ],
  topicsDescription: [
    'Study the places, years and ideas behind a drink.',
    '研究一杯酒背后的年份、酒吧与思路。',
    'Explorez les lieux, années et idées derrière un verre.',
    'Orte, Jahre und Ideen hinter einem Drink erforschen.',
    'Estudia los lugares, años e ideas detrás de un trago.',
    '한 잔 뒤의 장소·연도·아이디어를 탐구하세요.',
    '一杯の背景にある場所・年・発想を探る。',
    'Studia luoghi, anni e idee dietro un drink.',
  ],
  bottles: [
    'Bottle library',
    '瓶款档案',
    'Bibliothèque de bouteilles',
    'Flaschenarchiv',
    'Biblioteca de botellas',
    '보틀 라이브러리',
    'ボトルライブラリ',
    'Archivio bottiglie',
  ],
  bottlesDescription: [
    'Compare products and keep your bottles in view.',
    '比较具体瓶款，记录手边拥有的酒。',
    'Comparez les produits et gardez vos bouteilles en vue.',
    'Produkte vergleichen und eigene Flaschen im Blick behalten.',
    'Compara productos y mantén tus botellas a la vista.',
    '제품을 비교하고 보유 보틀을 관리하세요.',
    '製品を比べ、手元のボトルを記録する。',
    'Confronta i prodotti e tieni sotto controllo le tue bottiglie.',
  ],
} satisfies Record<string, [string, string, string, string, string, string, string, string]>;

export type ProfessionalKey = keyof typeof text;

const locales: Locale[] = ['en', 'zh', 'fr', 'de', 'es', 'ko', 'ja', 'it'];

export function professionalText(locale: Locale, key: ProfessionalKey) {
  return text[key][locales.indexOf(locale)] ?? text[key][0];
}
