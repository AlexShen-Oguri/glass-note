import {LOCALES, type Locale} from '../domain/contracts';

type Eight = readonly [string,string,string,string,string,string,string,string];

const copy = {
  directoryTitle:['Research directory','专业资料目录','Répertoire de recherche','Rechercheverzeichnis','Directorio de investigación','전문 자료 목록','リサーチ一覧','Indice di ricerca'],
  directoryIntro:['Browse competitions and bar collections without opening every work at once.','按赛事或知名酒吧浏览，不必一次展开所有作品。','Parcourez concours et collections de bars sans ouvrir toutes les œuvres à la fois.','Wettbewerbe und Barsammlungen durchsuchen, ohne alle Werke zugleich zu öffnen.','Explora concursos y colecciones de bares sin abrir todas las obras a la vez.','대회와 바 컬렉션을 둘러보되 모든 작품을 한꺼번에 펼치지 않습니다.','大会やバーのコレクションを、全作品を一度に開かずに探せます。','Esplora concorsi e raccolte di bar senza aprire tutte le opere insieme.'],
  categoryLabel:['Collection type','专题类型','Type de collection','Sammlungstyp','Tipo de colección','자료 유형','特集の種類','Tipo di raccolta'],
  allTopics:['All','全部','Tout','Alle','Todo','전체','すべて','Tutte'],
  competitions:['Competitions','赛事','Concours','Wettbewerbe','Concursos','대회','大会','Concorsi'],
  bars:['Bars','酒吧','Bars','Bars','Bares','바','バー','Bar'],
  countryLabel:['Country or region','国家或地区','Pays ou région','Land oder Region','País o región','국가 또는 지역','国・地域','Paese o area'],
  allCountries:['All countries','所有国家','Tous les pays','Alle Länder','Todos los países','모든 국가','すべての国','Tutti i paesi'],
  chooseCountry:['Choose country','选择国家','Choisir un pays','Land wählen','Elegir país','국가 선택','国を選ぶ','Scegli il paese'],
  closeCountries:['Close country list','收起国家列表','Fermer la liste des pays','Länderliste schließen','Cerrar la lista de países','국가 목록 닫기','国一覧を閉じる','Chiudi l’elenco dei paesi'],
  searchLabel:['Search the directory','搜索专题目录','Rechercher dans le répertoire','Verzeichnis durchsuchen','Buscar en el directorio','목록 검색','一覧を検索','Cerca nell’indice'],
  searchPlaceholder:['Competition, year, bar, city, or work','赛事、年份、酒吧、城市或作品','Concours, année, bar, ville ou œuvre','Wettbewerb, Jahr, Bar, Stadt oder Werk','Concurso, año, bar, ciudad u obra','대회, 연도, 바, 도시 또는 작품','大会・年・バー・都市・作品','Concorso, anno, bar, città o opera'],
  resultSummary:['Topics: {topics} · Unique works: {works}','专题：{topics} · 不重复作品：{works}','Sujets : {topics} · Œuvres uniques : {works}','Themen: {topics} · Eindeutige Werke: {works}','Temas: {topics} · Obras únicas: {works}','주제 {topics}개 · 고유 작품 {works}개','特集 {topics}件 · 重複なし {works}作品','Argomenti: {topics} · Opere uniche: {works}'],
  competitionGroup:['Competitions: {topics} · Works: {works}','赛事：{topics} · 作品：{works}','Concours : {topics} · Œuvres : {works}','Wettbewerbe: {topics} · Werke: {works}','Concursos: {topics} · Obras: {works}','대회 {topics}개 · 작품 {works}개','大会 {topics}件 · {works}作品','Concorsi: {topics} · Opere: {works}'],
  barGroup:['Bars: {topics} · Works: {works}','酒吧：{topics} · 作品：{works}','Bars : {topics} · Œuvres : {works}','Bars: {topics} · Werke: {works}','Bares: {topics} · Obras: {works}','바 {topics}개 · 작품 {works}개','バー {topics}件 · {works}作品','Bar: {topics} · Opere: {works}'],
  workCount:['Works: {count}','作品：{count}','Œuvres : {count}','Werke: {count}','Obras: {count}','작품 {count}개','{count}作品','Opere: {count}'],
  openTopic:['Open topic','打开专题','Ouvrir le sujet','Thema öffnen','Abrir tema','주제 열기','特集を開く','Apri argomento'],
  showMore:['Load more','加载更多','Afficher plus','Mehr laden','Cargar más','더 보기','さらに表示','Mostra altro'],
  emptyTitle:['No matching topics','没有符合条件的专题','Aucun sujet correspondant','Keine passenden Themen','No hay temas coincidentes','일치하는 주제 없음','一致する特集はありません','Nessun argomento corrispondente'],
  emptyBody:['Try another search, type, or country.','可更换搜索词、专题类型或国家。','Essayez une autre recherche, un autre type ou un autre pays.','Versuche eine andere Suche, einen anderen Typ oder ein anderes Land.','Prueba otra búsqueda, tipo o país.','검색어, 유형 또는 국가를 바꿔 보세요.','検索語、種類、国を変えてください。','Prova un’altra ricerca, tipo o paese.'],
  clearFilters:['Clear filters','清除筛选','Effacer les filtres','Filter löschen','Borrar filtros','필터 지우기','絞り込みを解除','Azzera filtri'],
  currentTopic:['Current topic','当前专题','Sujet actuel','Aktuelles Thema','Tema actual','현재 주제','現在の特集','Argomento attuale'],
  backToDirectory:['Back to directory','返回专题目录','Retour au répertoire','Zurück zum Verzeichnis','Volver al directorio','목록으로 돌아가기','一覧に戻る','Torna all’indice'],
  barSelectionNote:['Selected public recipes from this bar. See each recipe for its source and disclosure status.','酒吧公开配方选录；具体来源与披露状态请查看各配方。','Sélection de recettes publiques de ce bar. Consultez chaque recette pour sa source et son état de divulgation.','Auswahl öffentlich zugänglicher Rezepte dieser Bar. Quelle und Offenlegungsstatus stehen beim jeweiligen Rezept.','Selección de recetas públicas de este bar. Consulta la fuente y el estado de divulgación en cada receta.','이 바가 공개한 레시피 중 일부입니다. 출처와 공개 범위는 각 레시피에서 확인하세요.','このバーが公開したレシピの選集です。出典と開示状況は各レシピでご確認ください。','Selezione di ricette pubbliche di questo bar. Consulta ogni ricetta per fonte e stato di divulgazione.'],
  competitionSelectionNote:['Selected works from this competition. See each work for its source and disclosure status.','赛事专题选录；具体来源与披露状态请查看各作品。','Sélection d’œuvres de ce concours. Consultez chaque œuvre pour sa source et son état de divulgation.','Auswahl von Beiträgen aus diesem Wettbewerb. Quelle und Offenlegungsstatus stehen beim jeweiligen Beitrag.','Selección de obras de este concurso. Consulta la fuente y el estado de divulgación de cada obra.','이 대회 작품 중 일부를 선별했습니다. 출처와 공개 범위는 각 작품에서 확인하세요.','この大会から選んだ作品です。出典と開示状況は各作品でご確認ください。','Selezione di opere di questo concorso. Consulta ogni opera per fonte e stato di divulgazione.'],
} satisfies Record<string, Eight>;

const countryNames: Record<string, Eight> = {
  JP:['Japan','日本','Japon','Japan','Japón','일본','日本','Giappone'],
  US:['United States','美国','États-Unis','Vereinigte Staaten','Estados Unidos','미국','アメリカ','Stati Uniti'],
  GB:['United Kingdom','英国','Royaume-Uni','Vereinigtes Königreich','Reino Unido','영국','イギリス','Regno Unito'],
  DE:['Germany','德国','Allemagne','Deutschland','Alemania','독일','ドイツ','Germania'],
  FR:['France','法国','France','Frankreich','Francia','프랑스','フランス','Francia'],
  IT:['Italy','意大利','Italie','Italien','Italia','이탈리아','イタリア','Italia'],
  ES:['Spain','西班牙','Espagne','Spanien','España','스페인','スペイン','Spagna'],
  SG:['Singapore','新加坡','Singapour','Singapur','Singapur','싱가포르','シンガポール','Singapore'],
  MX:['Mexico','墨西哥','Mexique','Mexiko','México','멕시코','メキシコ','Messico'],
  HK:['Hong Kong','中国香港','Hong Kong','Hongkong','Hong Kong','홍콩','香港','Hong Kong'],
  AU:['Australia','澳大利亚','Australie','Australien','Australia','호주','オーストラリア','Australia'],
  KR:['South Korea','韩国','Corée du Sud','Südkorea','Corea del Sur','대한민국','韓国','Corea del Sud'],
  BE:['Belgium','比利时','Belgique','Belgien','Bélgica','벨기에','ベルギー','Belgio'],
  NL:['Netherlands','荷兰','Pays-Bas','Niederlande','Países Bajos','네덜란드','オランダ','Paesi Bassi'],
  TH:['Thailand','泰国','Thaïlande','Thailand','Tailandia','태국','タイ','Thailandia'],
  AR:['Argentina','阿根廷','Argentine','Argentinien','Argentina','아르헨티나','アルゼンチン','Argentina'],
  AE:['United Arab Emirates','阿联酋','Émirats arabes unis','Vereinigte Arabische Emirate','Emiratos Árabes Unidos','아랍에미리트','アラブ首長国連邦','Emirati Arabi Uniti'],
  ZA:['South Africa','南非','Afrique du Sud','Südafrika','Sudáfrica','남아프리카 공화국','南アフリカ','Sudafrica'],
};

export type TopicDirectoryKey = keyof typeof copy;
export const TOPIC_DIRECTORY_KEYS = Object.keys(copy) as TopicDirectoryKey[];
const pick = (values: Eight, locale: Locale) => values[LOCALES.indexOf(locale)] ?? values[0];
const format = (value: string, values?: Record<string, string | number>) => values
  ? value.replace(/\{([A-Za-z0-9_]+)\}/g, (match, key: string) => values[key] === undefined ? match : String(values[key]))
  : value;

export function topicDirectoryText(locale: Locale, key: TopicDirectoryKey, values?: Record<string, string | number>): string {
  return format(pick(copy[key], locale), values);
}

export function topicCountryText(locale: Locale, code: string): string {
  const normalized = code.trim().toUpperCase();
  return countryNames[normalized] ? pick(countryNames[normalized], locale) : normalized;
}
