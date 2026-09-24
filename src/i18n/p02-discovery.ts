import type {Locale} from '../domain/contracts';

const localeIndex: Record<Locale, number> = {en: 0, zh: 1, fr: 2, de: 3, es: 4, ko: 5, ja: 6, it: 7};

const copy = {
  collectionTitle: ['Cocktails', '酒单', 'Cocktails', 'Cocktails', 'Cócteles', '칵테일', 'カクテル', 'Cocktail'],
  filters: ['Filters', '筛选', 'Filtres', 'Filter', 'Filtros', '필터', '絞り込み', 'Filtri'],
  ingredientLibrary: ['Ingredient library', '材料库', 'Bibliothèque des ingrédients', 'Zutatenbibliothek', 'Biblioteca de ingredientes', '재료 라이브러리', '材料ライブラリ', 'Guida agli ingredienti'],
  collections: ['Collections', '专题', 'Collections', 'Sammlungen', 'Colecciones', '컬렉션', 'コレクション', 'Collezioni'],
  showCollections: ['Show collections', '展开专题', 'Afficher les collections', 'Sammlungen anzeigen', 'Mostrar colecciones', '컬렉션 보기', 'コレクションを表示', 'Mostra collezioni'],
  hideCollections: ['Hide collections', '收起专题', 'Masquer les collections', 'Sammlungen ausblenden', 'Ocultar colecciones', '컬렉션 숨기기', 'コレクションを隠す', 'Nascondi collezioni'],
  loadMore: ['Load more', '加载更多', 'Afficher plus', 'Mehr laden', 'Cargar más', '더 보기', 'さらに表示', 'Carica altri'],
  filterTitle: ['Choose filters', '选择筛选条件', 'Choisir des filtres', 'Filter auswählen', 'Elegir filtros', '필터 선택', '絞り込みを選択', 'Scegli i filtri'],
  filterHint: ['Start with a base or aroma. Open another group when you need it.', '先选基酒或香气，需要时再展开其他条件。', 'Commencez par une base ou un arôme. Ouvrez les autres groupes au besoin.', 'Beginne mit Basisspirituose oder Aroma. Öffne weitere Gruppen bei Bedarf.', 'Empieza por una base o un aroma. Abre otros grupos cuando los necesites.', '베이스나 향부터 고르고 필요할 때 다른 조건을 여세요.', 'ベースや香りから選び、必要な条件だけ開いてください。', 'Parti dalla base o dall’aroma. Apri gli altri gruppi quando servono.'],
  showOptions: ['Show', '展开', 'Afficher', 'Anzeigen', 'Mostrar', '보기', '表示', 'Mostra'],
  hideOptions: ['Hide', '收起', 'Masquer', 'Ausblenden', 'Ocultar', '숨기기', '隠す', 'Nascondi'],
  preparation: ['Preparation records', '制备资料', 'Préparation', 'Vorbereitung', 'Preparación', '준비 기록', '仕込み資料', 'Preparazione'],
  selected: ['selected', '项已选', 'sélectionné(s)', 'ausgewählt', 'seleccionado(s)', '개 선택됨', '件選択中', 'selezionati'],
} as const;

export type P02DiscoveryKey = keyof typeof copy;

export function p02DiscoveryText(locale: Locale, key: P02DiscoveryKey) {
  return copy[key][localeIndex[locale]]!;
}

export function p02ResultCount(locale: Locale, visible: number, total: number) {
  if (locale === 'zh') return `已显示 ${visible} / ${total} 杯`;
  if (locale === 'fr') return `${visible} sur ${total} affichés`;
  if (locale === 'de') return `${visible} von ${total} angezeigt`;
  if (locale === 'es') return `Se muestran ${visible} de ${total}`;
  if (locale === 'ko') return `${total}개 중 ${visible}개 표시`;
  if (locale === 'ja') return `${total}件中${visible}件を表示`;
  if (locale === 'it') return `${visible} di ${total} mostrati`;
  return `Showing ${visible} of ${total}`;
}
