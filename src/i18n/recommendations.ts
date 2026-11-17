import type {Locale} from '../domain/contracts';

type EightLocales = readonly [string, string, string, string, string, string, string, string];

/** English, Simplified Chinese, French, German, Spanish, Korean, Japanese, Italian. */
const text = {
  forYou: ['For you', '为你推荐', 'Pour vous', 'Für dich', 'Para ti', '나를 위한 추천', 'あなたへのおすすめ', 'Per te'],
  coldTitle: ['A place to start', '从这里开始', 'Un point de départ', 'Ein guter Anfang', 'Por dónde empezar', '여기서 시작해 보세요', 'まずはここから', 'Un punto da cui iniziare'],
  coldHint: [
    'Discover different styles. Saved feedback will help future picks.',
    '探索不同风格。保存的评价会帮助之后的推荐。',
    'Découvrez différents styles. Vos avis enregistrés aideront les prochaines sélections.',
    'Entdecke verschiedene Stile. Gespeichertes Feedback hilft bei künftigen Empfehlungen.',
    'Descubre distintos estilos. Los comentarios guardados ayudarán a orientar las próximas recomendaciones.',
    '다양한 스타일을 만나 보세요. 저장한 평가는 다음 추천에 도움이 됩니다.',
    'さまざまなスタイルを試しましょう。保存した評価は今後のおすすめに役立ちます。',
    'Scopri stili diversi. I giudizi salvati aiuteranno le prossime selezioni.',
  ],
  personalizedHint: ['Five likely matches and one new direction.', '五款可能合口味的选择，加一个新方向。', 'Cinq choix proches de vos goûts et une nouvelle piste.', 'Fünf mögliche Treffer und eine neue Richtung.', 'Cinco opciones afines a tus gustos y una nueva dirección.', '취향에 맞을 만한 다섯 잔과 새로운 방향 하나를 추천합니다.', '好みに合いそうな5杯と、新しい方向の1杯。', 'Cinque proposte vicine ai tuoi gusti e una nuova direzione.'],
  limitedHint: ['Showing the available matches for these filters.', '按当前筛选条件展示可用选择。', 'Voici les choix disponibles avec ces filtres.', 'Angezeigt werden die verfügbaren Treffer für diese Filter.', 'Se muestran las opciones disponibles con estos filtros.', '현재 필터에 맞는 선택지를 보여 줍니다.', 'この条件で見つかる候補を表示しています。', 'Ecco le proposte disponibili con questi filtri.'],
  familiar: ['Likely your taste', '可能合口味', 'Proche de vos goûts', 'Könnte dir gefallen', 'Afín a tus gustos', '취향에 맞을 만한 선택', '好みに合いそう', 'Vicino ai tuoi gusti'],
  explore: ['Try something new', '尝试新口味', 'Essayez autre chose', 'Etwas Neues probieren', 'Prueba algo nuevo', '새로운 맛 도전', '新しい味を試す', 'Prova qualcosa di nuovo'],
  why: ['Why this pick', '为什么推荐这杯', 'Pourquoi ce choix', 'Warum diese Auswahl', 'Por qué esta opción', '추천 이유', 'おすすめの理由', 'Perché questa scelta'],
  exploreAnother: ['Explore another', '换个方向探索', 'Explorer une autre piste', 'Eine andere Richtung entdecken', 'Explora otra opción', '다른 선택 탐색', '別の候補を探す', 'Esplora un’altra proposta'],
  evidence: ['View saved feedback', '查看已保存的评价', 'Voir les avis enregistrés', 'Gespeichertes Feedback ansehen', 'Ver comentarios guardados', '저장한 평가 보기', '保存した評価を見る', 'Vedi i giudizi salvati'],
  learnedReason: [
    'Similar to recipe combinations you rated positively.',
    '与你曾给予好评的配方组合相似。',
    'Proche de combinaisons de recettes que vous avez appréciées.',
    'Ähnelt Rezeptkombinationen, die du positiv bewertet hast.',
    'Similar a combinaciones de recetas que valoraste positivamente.',
    '좋게 평가한 레시피 조합과 비슷합니다.',
    '高く評価したレシピの組み合わせに似ています。',
    'Simile a combinazioni di ricette che hai valutato positivamente.',
  ],
  explicitFlavourReason: ['Matches your saved flavour preferences.', '符合你已保存的风味偏好。', 'Correspond à vos préférences de saveurs enregistrées.', 'Passt zu deinen gespeicherten Aromenvorlieben.', 'Coincide con tus preferencias de sabores guardadas.', '저장한 풍미 선호와 맞습니다.', '保存した風味の好みに合っています。', 'Corrisponde alle tue preferenze di aromi salvate.'],
  exactReason: ['You liked this exact recipe version.', '你曾喜欢这个确切配方版本。', 'Vous avez aimé cette version exacte de la recette.', 'Diese genaue Rezeptversion hat dir gefallen.', 'Te gustó esta versión exacta de la receta.', '이 정확한 레시피 버전을 좋아했어요.', 'この正確なレシピ版を気に入っていました。', 'Ti è piaciuta questa versione esatta della ricetta.'],
  explorationReason: [
    'An unrated direction near your preferences, selected to explore.',
    '从与你偏好相近、尚未评价的方向中挑选，供你探索。',
    'Une piste non évaluée, proche de vos préférences, choisie pour explorer.',
    'Eine noch unbewertete Richtung nahe deinen Vorlieben, zum Entdecken ausgewählt.',
    'Una dirección sin valorar, cercana a tus preferencias, elegida para explorar.',
    '취향과 가까운 아직 평가하지 않은 방향을 탐색용으로 골랐습니다.',
    '好みに近く、まだ評価していない方向を探索用に選びました。',
    'Una direzione non ancora valutata, vicina alle tue preferenze, scelta da esplorare.',
  ],
  diversityReason: ['A different combination within your saved preferences.', '在你已保存的偏好中，尝试不同的配方组合。', 'Une autre combinaison dans vos préférences enregistrées.', 'Eine andere Kombination innerhalb deiner gespeicherten Vorlieben.', 'Una combinación distinta dentro de tus preferencias guardadas.', '저장한 선호 안에서 다른 조합을 골랐습니다.', '保存した好みの範囲で、異なる組み合わせを選びました。', 'Una combinazione diversa nell’ambito delle tue preferenze salvate.'],
  cautiousReason: ['Takes your sweetness or intensity feedback into account.', '参考了你对甜度或强度的反馈。', 'Tient compte de vos avis sur le sucre ou l’intensité.', 'Berücksichtigt dein Feedback zu Süße oder Intensität.', 'Tiene en cuenta tus comentarios sobre dulzor o intensidad.', '단맛이나 강도에 대한 평가를 고려했습니다.', '甘さや強さについての評価を考慮しています。', 'Tiene conto dei tuoi giudizi su dolcezza o intensità.'],
  readError: [
    'Taste memory is unavailable. You can still browse the catalogue.',
    '口味记忆暂不可用。你仍可浏览酒库。',
    'La mémoire gustative est indisponible. Vous pouvez toujours parcourir le catalogue.',
    'Der Geschmacksspeicher ist nicht verfügbar. Du kannst weiter im Katalog stöbern.',
    'La memoria de gustos no está disponible. Puedes seguir explorando el catálogo.',
    '취향 기억을 불러올 수 없습니다. 주류 목록은 계속 둘러볼 수 있습니다.',
    '好みの記録を利用できません。カタログは引き続き閲覧できます。',
    'La memoria dei gusti non è disponibile. Puoi comunque sfogliare il catalogo.',
  ],
  writeError: [
    'Using your last saved feedback. Retry to save your changes.',
    '正在使用你上次保存的评价。请重试以保存更改。',
    'Vos derniers avis enregistrés sont utilisés. Réessayez pour enregistrer vos modifications.',
    'Dein zuletzt gespeichertes Feedback wird verwendet. Versuche es erneut, um deine Änderungen zu speichern.',
    'Se usan tus últimos comentarios guardados. Reinténtalo para guardar los cambios.',
    '마지막으로 저장한 평가를 사용합니다. 변경 내용을 저장하려면 다시 시도하세요.',
    '最後に保存した評価を使っています。変更を保存するには再試行してください。',
    'Vengono usati gli ultimi giudizi salvati. Riprova per salvare le modifiche.',
  ],
  retry: ['Retry', '重试', 'Réessayer', 'Erneut versuchen', 'Reintentar', '다시 시도', '再試行', 'Riprova'],
  retrying: ['Retrying…', '正在重试…', 'Nouvelle tentative…', 'Neuer Versuch…', 'Reintentando…', '다시 시도하는 중…', '再試行中…', 'Nuovo tentativo…'],
  loading: ['Loading taste memory…', '正在加载口味记忆…', 'Chargement de la mémoire gustative…', 'Geschmacksspeicher wird geladen…', 'Cargando la memoria de gustos…', '취향 기억을 불러오는 중…', '好みの記録を読み込み中…', 'Caricamento della memoria dei gusti…'],
  unavailable: [
    'Personal picks are unavailable. You can still browse the catalogue.',
    '个性化推荐暂不可用。你仍可浏览酒库。',
    'Les sélections personnelles sont indisponibles. Vous pouvez toujours parcourir le catalogue.',
    'Persönliche Empfehlungen sind nicht verfügbar. Du kannst weiter im Katalog stöbern.',
    'Las recomendaciones personales no están disponibles. Puedes seguir explorando el catálogo.',
    '맞춤 추천을 이용할 수 없습니다. 주류 목록은 계속 둘러볼 수 있습니다.',
    'あなたへのおすすめを利用できません。カタログは引き続き閲覧できます。',
    'Le selezioni personali non sono disponibili. Puoi comunque sfogliare il catalogo.',
  ],
  memory: ['Taste memory', '口味记忆', 'Mémoire gustative', 'Geschmacksspeicher', 'Memoria de gustos', '취향 기억', '好みの記録', 'Memoria dei gusti'],
  allCocktails: ['All cocktails', '全部鸡尾酒', 'Tous les cocktails', 'Alle Cocktails', 'Todos los cócteles', '모든 칵테일', 'すべてのカクテル', 'Tutti i cocktail'],
  trainingBudget: [
    'Combination learning uses the latest {count} rated recipe snapshots. Older records are kept.',
    '配方组合学习使用最近 {count} 份已评价的配方快照。更早的记录仍会保留。',
    'L’apprentissage des combinaisons utilise les {count} dernières versions de recettes évaluées. Les enregistrements plus anciens sont conservés.',
    'Das Lernen von Rezeptkombinationen nutzt die letzten {count} bewerteten Rezeptstände. Ältere Einträge bleiben erhalten.',
    'El aprendizaje de combinaciones usa las {count} últimas versiones de recetas valoradas. Se conservan los registros anteriores.',
    '조합 학습에는 최근 평가한 레시피 스냅샷 {count}개를 사용합니다. 이전 기록도 보관됩니다.',
    '組み合わせの学習には、直近の評価済みレシピ保存版 {count} 件を使います。以前の記録も保持されます。',
    'L’apprendimento delle combinazioni usa le ultime {count} versioni di ricette valutate. I dati precedenti vengono conservati.',
  ],
  noMoreExploration: ['No other new picks match these filters.', '没有其他符合当前筛选条件的新推荐。', 'Aucun autre nouveau choix ne correspond à ces filtres.', 'Keine weiteren neuen Empfehlungen passen zu diesen Filtern.', 'No hay otras opciones nuevas que coincidan con estos filtros.', '이 필터에 맞는 다른 새로운 추천이 없습니다.', 'この条件に合う別の新しい候補はありません。', 'Non ci sono altre nuove proposte con questi filtri.'],
} satisfies Record<string, EightLocales>;

export type RecommendationKey = keyof typeof text;

type LocaleIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
const localeIndex: Record<Locale, LocaleIndex> = {en: 0, zh: 1, fr: 2, de: 3, es: 4, ko: 5, ja: 6, it: 7};

/** Return localized recommendation copy with only supplied values interpolated. */
export function recommendationText(locale: Locale, key: RecommendationKey, values?: Record<string, string | number>): string {
  const template = text[key][localeIndex[locale]];
  if (!values) return template;
  return Object.entries(values).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
    template,
  );
}
