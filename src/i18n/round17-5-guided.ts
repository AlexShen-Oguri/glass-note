import type {Locale} from '../domain/contracts';

export type Guided175Key =
  | 'modeTitle'
  | 'modeHint'
  | 'drink'
  | 'drinkHint'
  | 'make'
  | 'makeHint'
  | 'changeMode'
  | 'pantryLoading'
  | 'pantryError'
  | 'retry'
  | 'emptyTitle'
  | 'emptyBody'
  | 'addIngredients'
  | 'chooseFirst'
  | 'fallbackNote'
  | 'makeResultHint'
  | 'ready'
  | 'missing'
  | 'baseReady'
  | 'baseMissing'
  | 'reviewDetails'
  | 'noMakeTitle'
  | 'noMakeBody'
  | 'openPantry'
  | 'switchDrink';

type EightLocales = Record<Locale, string>;

const copy: Record<Guided175Key, EightLocales> = {
  modeTitle: {
    en: 'How would you like to drink today?', zh: '今天想怎么喝？', fr: 'Comment voulez-vous boire aujourd’hui ?', de: 'Wie möchtest du heute trinken?', es: '¿Cómo te apetece beber hoy?', ko: '오늘은 어떻게 마시고 싶나요?', ja: '今日はどう飲みたい？', it: 'Come vuoi bere oggi?',
  },
  modeHint: {
    en: 'Choose by taste, or start with what is in your cabinet.', zh: '按口味挑一杯，或优先用酒柜里已有的材料。', fr: 'Choisissez selon vos goûts ou commencez par ce que vous avez.', de: 'Wähle nach Geschmack oder beginne mit dem, was in deinem Schrank steht.', es: 'Elige por sabor o empieza con lo que tienes en el mueble bar.', ko: '취향으로 고르거나 술장에 있는 재료부터 활용해 보세요.', ja: '好みで選ぶか、家にある材料から探せます。', it: 'Scegli in base al gusto oppure parti da ciò che hai nel mobile bar.',
  },
  drink: {
    en: 'Have a drink', zh: '喝一杯', fr: 'Boire un verre', de: 'Einen Drink genießen', es: 'Tomar una copa', ko: '한 잔 마시기', ja: '一杯飲む', it: 'Bere un drink',
  },
  drinkHint: {
    en: 'Find a drink you will like by taste.', zh: '按口味找一杯喜欢的酒', fr: 'Trouvez un verre à votre goût.', de: 'Finde einen Drink, der zu deinem Geschmack passt.', es: 'Encuentra una copa que te guste según el sabor.', ko: '취향에 맞는 한 잔을 찾아보세요.', ja: '好みに合う一杯を探します。', it: 'Trova un drink che ti piaccia in base al gusto.',
  },
  make: {
    en: 'Mix it myself', zh: '自己调', fr: 'Le préparer moi-même', de: 'Selbst mixen', es: 'Prepararlo yo', ko: '직접 만들기', ja: '自分で作る', it: 'Prepararlo io',
  },
  makeHint: {
    en: 'Start with ingredients in your cabinet.', zh: '优先用酒柜里的材料', fr: 'Utilisez d’abord les ingrédients de votre bar.', de: 'Nutze zuerst die Zutaten aus deinem Schrank.', es: 'Da prioridad a los ingredientes de tu mueble bar.', ko: '술장에 있는 재료를 우선 활용합니다.', ja: '家にある材料を優先します。', it: 'Dai priorità agli ingredienti del tuo mobile bar.',
  },
  changeMode: {
    en: 'Change mode', zh: '更换模式', fr: 'Changer de mode', de: 'Modus wechseln', es: 'Cambiar modo', ko: '모드 변경', ja: 'モードを変更', it: 'Cambia modalità',
  },
  pantryLoading: {
    en: 'Reading your cabinet…', zh: '正在读取酒柜…', fr: 'Lecture de votre bar…', de: 'Dein Schrank wird gelesen…', es: 'Leyendo tu mueble bar…', ko: '술장을 불러오는 중…', ja: '材料リストを読み込み中…', it: 'Lettura del mobile bar…',
  },
  pantryError: {
    en: 'Your cabinet could not be read. Try again.', zh: '无法读取酒柜，请重试。', fr: 'Impossible de lire votre bar. Réessayez.', de: 'Dein Schrank konnte nicht gelesen werden. Versuche es erneut.', es: 'No se pudo leer tu mueble bar. Inténtalo de nuevo.', ko: '술장을 읽지 못했습니다. 다시 시도해 주세요.', ja: '材料リストを読み込めませんでした。もう一度お試しください。', it: 'Impossibile leggere il mobile bar. Riprova.',
  },
  retry: {
    en: 'Try again', zh: '重试', fr: 'Réessayer', de: 'Erneut versuchen', es: 'Reintentar', ko: '다시 시도', ja: '再試行', it: 'Riprova',
  },
  emptyTitle: {
    en: 'Your cabinet is empty', zh: '酒柜还是空的', fr: 'Votre bar est vide', de: 'Dein Schrank ist leer', es: 'Tu mueble bar está vacío', ko: '술장이 비어 있습니다', ja: '材料がまだ登録されていません', it: 'Il mobile bar è vuoto',
  },
  emptyBody: {
    en: 'Add ingredients, or choose a drink by taste first.', zh: '先添加材料，或先按口味选酒。', fr: 'Ajoutez des ingrédients ou choisissez d’abord selon vos goûts.', de: 'Füge Zutaten hinzu oder wähle zuerst nach Geschmack.', es: 'Añade ingredientes o elige primero una copa por sabor.', ko: '재료를 추가하거나 먼저 취향으로 한 잔을 골라보세요.', ja: '材料を追加するか、まず好みで一杯を選びましょう。', it: 'Aggiungi ingredienti oppure scegli prima un drink in base al gusto.',
  },
  addIngredients: {
    en: 'Add ingredients', zh: '添加材料', fr: 'Ajouter des ingrédients', de: 'Zutaten hinzufügen', es: 'Añadir ingredientes', ko: '재료 추가', ja: '材料を追加', it: 'Aggiungi ingredienti',
  },
  chooseFirst: {
    en: 'Choose a drink first', zh: '先选酒', fr: 'Choisir d’abord un verre', de: 'Zuerst einen Drink wählen', es: 'Elegir primero una copa', ko: '먼저 한 잔 고르기', ja: '先に一杯を選ぶ', it: 'Scegli prima un drink',
  },
  fallbackNote: {
    en: 'This set has not been filtered by your cabinet. Get the ingredients you need before making it.', zh: '这次尚未按酒柜筛选，制作前请补齐所需材料。', fr: 'Cette sélection n’est pas filtrée selon votre bar. Complétez les ingrédients avant de préparer.', de: 'Diese Auswahl wurde nicht nach deinem Schrank gefiltert. Besorge vor dem Mixen die benötigten Zutaten.', es: 'Esta selección no se ha filtrado por tu mueble bar. Completa los ingredientes antes de prepararla.', ko: '이번 결과는 술장 기준으로 거르지 않았습니다. 만들기 전에 필요한 재료를 준비하세요.', ja: '今回は手持ちの材料で絞り込んでいません。作る前に必要な材料をそろえてください。', it: 'Questa selezione non è filtrata in base al mobile bar. Procurati gli ingredienti necessari prima di prepararla.',
  },
  makeResultHint: {
    en: 'Base spirits ready first; within each group, fewer missing ingredients come first.', zh: '基酒齐全优先，同组按缺料数量排列。', fr: 'Bases disponibles d’abord ; dans chaque groupe, les recettes avec le moins d’ingrédients manquants passent en premier.', de: 'Vollständige Basisspirituosen zuerst; innerhalb jeder Gruppe stehen weniger fehlende Zutaten weiter oben.', es: 'Primero las bases disponibles; dentro de cada grupo, se muestran antes las recetas con menos ingredientes por comprar.', ko: '베이스 스피릿이 갖춰진 레시피를 먼저, 같은 그룹에서는 부족한 재료가 적은 순서로 보여 줍니다.', ja: 'ベーススピリッツがそろうレシピを優先し、同じグループでは不足材料が少ない順に並べます。', it: 'Prima i distillati base disponibili; in ogni gruppo vengono mostrate prima le ricette con meno ingredienti mancanti.',
  },
  ready: {
    en: 'Ingredients ready', zh: '材料已齐全', fr: 'Tous les ingrédients sont disponibles', de: 'Alle Zutaten vorhanden', es: 'Ingredientes listos', ko: '재료 준비 완료', ja: '材料はそろっています', it: 'Ingredienti pronti',
  },
  missing: {
    en: 'Missing {count}: {ingredients}', zh: '缺少 {count} 种：{ingredients}', fr: 'Il manque {count} ingrédient(s) : {ingredients}', de: 'Es fehlen {count}: {ingredients}', es: 'Faltan {count}: {ingredients}', ko: '{count}가지 부족: {ingredients}', ja: '不足 {count} 種：{ingredients}', it: 'Mancano {count}: {ingredients}',
  },
  baseReady: {
    en: 'Base spirits ready', zh: '基酒齐全', fr: 'Bases disponibles', de: 'Basisspirituosen vorhanden', es: 'Bases listas', ko: '베이스 스피릿 준비 완료', ja: 'ベーススピリッツあり', it: 'Distillati base pronti',
  },
  baseMissing: {
    en: 'Missing a base spirit', zh: '缺基酒', fr: 'Base manquante', de: 'Basisspirituose fehlt', es: 'Falta una base', ko: '베이스 스피릿 부족', ja: 'ベーススピリッツ不足', it: 'Manca un distillato base',
  },
  reviewDetails: {
    en: 'Check the recipe for specified bottles and preparation.', zh: '指定瓶款与预制请查看配方确认。', fr: 'Vérifiez la recette pour les bouteilles imposées et les préparations.', de: 'Prüfe das Rezept auf vorgegebene Flaschen und Vorbereitungen.', es: 'Consulta la receta para confirmar botellas específicas y preparaciones previas.', ko: '지정 보틀과 사전 준비는 레시피에서 확인하세요.', ja: '指定ボトルと事前準備はレシピで確認してください。', it: 'Controlla la ricetta per le bottiglie indicate e le preparazioni preliminari.',
  },
  noMakeTitle: {
    en: 'No suitable recipe yet', zh: '暂时没有合适的配方', fr: 'Aucune recette adaptée pour le moment', de: 'Noch kein passendes Rezept', es: 'Aún no hay una receta adecuada', ko: '아직 맞는 레시피가 없습니다', ja: '条件に合うレシピがありません', it: 'Nessuna ricetta adatta per ora',
  },
  noMakeBody: {
    en: 'Under these choices, no recipe is missing two ingredients or fewer.', zh: '当前条件下，没有缺料不超过 2 种的配方。', fr: 'Avec ces choix, aucune recette ne manque de deux ingrédients ou moins.', de: 'Mit dieser Auswahl fehlt bei keinem Rezept höchstens eine oder zwei Zutaten.', es: 'Con estas opciones, ninguna receta tiene dos ingredientes faltantes o menos.', ko: '현재 조건에서는 부족한 재료가 2가지 이하인 레시피가 없습니다.', ja: '現在の条件では、不足材料が2種類以内のレシピはありません。', it: 'Con queste scelte non ci sono ricette a cui manchino due ingredienti o meno.',
  },
  openPantry: {
    en: 'Update cabinet', zh: '更新酒柜', fr: 'Mettre à jour mon bar', de: 'Schrank aktualisieren', es: 'Actualizar mueble bar', ko: '술장 업데이트', ja: '材料リストを更新', it: 'Aggiorna il mobile bar',
  },
  switchDrink: {
    en: 'Switch to Have a drink', zh: '切换到喝一杯', fr: 'Passer à « Boire un verre »', de: 'Zu „Einen Drink genießen“ wechseln', es: 'Cambiar a «Tomar una copa»', ko: '한 잔 마시기로 전환', ja: '「一杯飲む」に切り替える', it: 'Passa a “Bere un drink”',
  },
};

export function g175(
  locale: Locale,
  key: Guided175Key,
  params: Record<string, string | number> = {},
): string {
  return copy[key][locale].replace(/\{([^}]+)\}/g, (token, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : token);
}
