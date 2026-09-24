import type {Locale} from '../domain/contracts';
import type {ContextReasonCode, Occasion, Season} from '../domain/context/types';

export interface ContextCopy {
  disclosureTitle: string;
  optional: string;
  summaryOpen: string;
  occasion: string;
  season: string;
  anyOccasion: string;
  anySeason: string;
  apply: string;
  cancel: string;
  change: string;
  details: string;
  closeDetails: string;
  editorialBasis: string;
  noSpecificBasis: string;
  reasonTitle: string;
  notThisOne: string;
  picksTitle: string;
  picksHint: string;
  picksEmpty: string;
  viewRecipe: string;
  showAll: string;
  showLess: string;
  swapPicks: string;
  contextRankedMatch: string;
  contextBaseMatch: string;
  baseResultCount: string;
  contextPriorityNote: string;
  hiddenAllTitle: string;
  hiddenAllHint: string;
  restoreHidden: string;
}

const copy: Record<Locale, ContextCopy> = {
  en: {
    disclosureTitle: 'Occasion & season', optional: 'Optional', summaryOpen: 'Leave both open', occasion: 'Occasion', season: 'Season', anyOccasion: 'Any occasion', anySeason: 'Any season', apply: 'Use these choices', cancel: 'Cancel', change: 'Change', details: 'Details', closeDetails: 'Close', editorialBasis: 'Editorial suggestion based on this recipe.', noSpecificBasis: 'No reviewed basis for this exact choice.', reasonTitle: 'Recommendation notes', notThisOne: 'Not this one', picksTitle: 'Pick for the moment', picksHint: 'Choose an occasion or season for three suggestions. Your filters stay as they are.', picksEmpty: 'No reviewed suggestions fit these choices.', viewRecipe: 'View this recipe', showAll: 'See more', showLess: 'Show fewer', swapPicks: 'Try other picks', contextRankedMatch: 'Prioritized for the occasion or season you chose.', contextBaseMatch: 'Matches the basic filters.', baseResultCount: 'Results matching the basic filters', contextPriorityNote: 'Your occasion or season choice sets the order; other candidates remain available.', hiddenAllTitle: 'All recommendations are hidden for this round', hiddenAllHint: 'Restore them to review this set again.', restoreHidden: 'Restore this round',
  },
  zh: {
    disclosureTitle: '场合与季节', optional: '可选', summaryOpen: '均不限', occasion: '场合', season: '季节', anyOccasion: '不限场合', anySeason: '不限季节', apply: '应用选择', cancel: '取消', change: '修改', details: '查看原因', closeDetails: '收起', editorialBasis: '编辑建议，依据此配方。', noSpecificBasis: '没有针对这项具体选择的审阅依据。', reasonTitle: '推荐说明', notThisOne: '这杯不合适', picksTitle: '为此刻选一杯', picksHint: '选择场合或季节，查看三杯建议。原有筛选不会改变。', picksEmpty: '暂无符合这些选择且经过审阅的建议。', viewRecipe: '查看此配方', showAll: '查看更多', showLess: '收起', swapPicks: '换几杯', contextRankedMatch: '依据所选场合或季节优先排序。', contextBaseMatch: '符合基础筛选条件。', baseResultCount: '符合基础条件的结果', contextPriorityNote: '所选场合或季节仅用于优先排序，其他候选仍可查看。', hiddenAllTitle: '本次推荐已全部隐藏', hiddenAllHint: '恢复后可重新查看这一组推荐。', restoreHidden: '恢复本次推荐',
  },
  fr: {
    disclosureTitle: 'Occasion et saison', optional: 'Facultatif', summaryOpen: 'Laisser les deux ouverts', occasion: 'Occasion', season: 'Saison', anyOccasion: 'Toute occasion', anySeason: 'Toute saison', apply: 'Appliquer ces choix', cancel: 'Annuler', change: 'Modifier', details: 'Détails', closeDetails: 'Fermer', editorialBasis: 'Suggestion éditoriale fondée sur cette recette.', noSpecificBasis: 'Aucune base vérifiée pour ce choix précis.', reasonTitle: 'Notes de recommandation', notThisOne: 'Pas celui-ci', picksTitle: 'Un verre pour ce moment', picksHint: 'Choisissez une occasion ou une saison pour voir trois suggestions. Vos filtres restent inchangés.', picksEmpty: 'Aucune suggestion vérifiée ne correspond à ces choix.', viewRecipe: 'Voir cette recette', showAll: 'Voir plus', showLess: 'Réduire', swapPicks: 'D’autres choix', contextRankedMatch: 'Classé en priorité selon l’occasion ou la saison choisie.', contextBaseMatch: 'Correspond aux filtres de base.', baseResultCount: 'Résultats correspondant aux filtres de base', contextPriorityNote: 'L’occasion ou la saison choisie détermine l’ordre ; les autres suggestions restent disponibles.', hiddenAllTitle: 'Toutes les suggestions de cette sélection sont masquées', hiddenAllHint: 'Restaurez-les pour revoir cette sélection.', restoreHidden: 'Restaurer cette sélection',
  },
  de: {
    disclosureTitle: 'Anlass und Jahreszeit', optional: 'Optional', summaryOpen: 'Beides offenlassen', occasion: 'Anlass', season: 'Jahreszeit', anyOccasion: 'Jeder Anlass', anySeason: 'Jede Jahreszeit', apply: 'Auswahl übernehmen', cancel: 'Abbrechen', change: 'Ändern', details: 'Details', closeDetails: 'Schließen', editorialBasis: 'Redaktionelle Empfehlung auf Grundlage dieses Rezepts.', noSpecificBasis: 'Keine geprüfte Grundlage für genau diese Auswahl.', reasonTitle: 'Hinweise zur Empfehlung', notThisOne: 'Dieser nicht', picksTitle: 'Ein Drink für den Moment', picksHint: 'Wähle einen Anlass oder eine Jahreszeit für drei Vorschläge. Deine Filter bleiben unverändert.', picksEmpty: 'Keine geprüften Vorschläge passen zu dieser Auswahl.', viewRecipe: 'Dieses Rezept ansehen', showAll: 'Mehr anzeigen', showLess: 'Weniger anzeigen', swapPicks: 'Andere Vorschläge', contextRankedMatch: 'Nach dem gewählten Anlass oder der Jahreszeit priorisiert.', contextBaseMatch: 'Entspricht den Basisfiltern.', baseResultCount: 'Ergebnisse für die Basisfilter', contextPriorityNote: 'Der gewählte Anlass oder die Jahreszeit bestimmt die Reihenfolge; weitere Treffer bleiben verfügbar.', hiddenAllTitle: 'Alle Empfehlungen dieser Runde sind ausgeblendet', hiddenAllHint: 'Stelle sie wieder her, um diese Auswahl erneut anzusehen.', restoreHidden: 'Diese Runde wiederherstellen',
  },
  es: {
    disclosureTitle: 'Ocasión y temporada', optional: 'Opcional', summaryOpen: 'Dejar ambas abiertas', occasion: 'Ocasión', season: 'Temporada', anyOccasion: 'Cualquier ocasión', anySeason: 'Cualquier temporada', apply: 'Aplicar opciones', cancel: 'Cancelar', change: 'Cambiar', details: 'Detalles', closeDetails: 'Cerrar', editorialBasis: 'Sugerencia editorial basada en esta receta.', noSpecificBasis: 'No hay una base revisada para esta elección exacta.', reasonTitle: 'Notas de la recomendación', notThisOne: 'Este no', picksTitle: 'Una copa para el momento', picksHint: 'Elige una ocasión o temporada para ver tres sugerencias. Tus filtros no cambian.', picksEmpty: 'No hay sugerencias revisadas para estas opciones.', viewRecipe: 'Ver esta receta', showAll: 'Ver más', showLess: 'Ver menos', swapPicks: 'Ver otras opciones', contextRankedMatch: 'Priorizado según la ocasión o temporada elegida.', contextBaseMatch: 'Coincide con los filtros básicos.', baseResultCount: 'Resultados que coinciden con los filtros básicos', contextPriorityNote: 'La ocasión o temporada elegida determina el orden; las demás opciones siguen disponibles.', hiddenAllTitle: 'Todas las recomendaciones de esta ronda están ocultas', hiddenAllHint: 'Restáuralas para revisar de nuevo este grupo.', restoreHidden: 'Restaurar esta ronda',
  },
  ko: {
    disclosureTitle: '자리와 계절', optional: '선택 사항', summaryOpen: '모두 제한 없음', occasion: '자리', season: '계절', anyOccasion: '모든 자리', anySeason: '모든 계절', apply: '선택 적용', cancel: '취소', change: '변경', details: '이유 보기', closeDetails: '닫기', editorialBasis: '이 레시피를 바탕으로 한 편집 제안입니다.', noSpecificBasis: '이 선택과 정확히 맞는 검토 근거는 없습니다.', reasonTitle: '추천 설명', notThisOne: '이 잔은 제외', picksTitle: '지금에 맞는 한 잔', picksHint: '자리나 계절을 고르면 세 가지를 제안합니다. 기존 필터는 바뀌지 않습니다.', picksEmpty: '이 선택에 맞는 검토된 제안이 없습니다.', viewRecipe: '이 레시피 보기', showAll: '더 보기', showLess: '접기', swapPicks: '다른 잔 보기', contextRankedMatch: '선택한 자리나 계절을 기준으로 우선 정렬했습니다.', contextBaseMatch: '기본 필터에 맞습니다.', baseResultCount: '기본 필터에 맞는 결과', contextPriorityNote: '선택한 자리나 계절은 순서에만 반영되며 다른 후보도 계속 볼 수 있습니다.', hiddenAllTitle: '이번 추천을 모두 숨겼습니다', hiddenAllHint: '복원하면 이 추천을 다시 볼 수 있습니다.', restoreHidden: '이번 추천 복원',
  },
  ja: {
    disclosureTitle: 'シーンと季節', optional: '任意', summaryOpen: 'どちらも指定しない', occasion: 'シーン', season: '季節', anyOccasion: 'シーンを問わない', anySeason: '季節を問わない', apply: '選択を反映', cancel: 'キャンセル', change: '変更', details: '理由を見る', closeDetails: '閉じる', editorialBasis: 'このレシピに基づく編集提案です。', noSpecificBasis: 'この選択そのものを裏づける確認済みの根拠はありません。', reasonTitle: '提案の説明', notThisOne: 'この一杯は外す', picksTitle: '今に合う一杯', picksHint: 'シーンか季節を選ぶと、3杯を提案します。現在の絞り込みは変わりません。', picksEmpty: 'この選択に合う確認済みの提案はありません。', viewRecipe: 'このレシピを見る', showAll: 'さらに見る', showLess: '少なく表示', swapPicks: '別の候補を見る', contextRankedMatch: '選んだシーンや季節をもとに優先表示しています。', contextBaseMatch: '基本の絞り込み条件に合います。', baseResultCount: '基本条件に合う結果', contextPriorityNote: 'シーンや季節の選択は表示順に反映され、ほかの候補も引き続き確認できます。', hiddenAllTitle: '今回の候補はすべて非表示です', hiddenAllHint: '元に戻すと、この候補をもう一度確認できます。', restoreHidden: '今回の候補を元に戻す',
  },
  it: {
    disclosureTitle: 'Occasione e stagione', optional: 'Facoltativo', summaryOpen: 'Lascia entrambe aperte', occasion: 'Occasione', season: 'Stagione', anyOccasion: 'Qualsiasi occasione', anySeason: 'Qualsiasi stagione', apply: 'Applica le scelte', cancel: 'Annulla', change: 'Modifica', details: 'Dettagli', closeDetails: 'Chiudi', editorialBasis: 'Suggerimento editoriale basato su questa ricetta.', noSpecificBasis: 'Non ci sono basi verificate per questa scelta precisa.', reasonTitle: 'Note sulla proposta', notThisOne: 'Non questo', picksTitle: 'Un drink per il momento', picksHint: 'Scegli un’occasione o una stagione per vedere tre proposte. I filtri non cambiano.', picksEmpty: 'Nessuna proposta verificata corrisponde a queste scelte.', viewRecipe: 'Vedi questa ricetta', showAll: 'Vedi altro', showLess: 'Mostra meno', swapPicks: 'Altre proposte', contextRankedMatch: 'In evidenza per l’occasione o la stagione scelta.', contextBaseMatch: 'Corrisponde ai filtri di base.', baseResultCount: 'Risultati che corrispondono ai filtri di base', contextPriorityNote: 'L’occasione o la stagione scelta determina l’ordine; le altre proposte restano disponibili.', hiddenAllTitle: 'Tutte le proposte di questo giro sono nascoste', hiddenAllHint: 'Ripristinale per rivedere questa selezione.', restoreHidden: 'Ripristina questo giro',
  },
};

const occasionLabels: Record<Occasion, Record<Locale, string>> = {
  aperitif: {en: 'Aperitif', zh: '餐前', fr: 'Apéritif', de: 'Aperitif', es: 'Aperitivo', ko: '식전', ja: '食前', it: 'Aperitivo'},
  meal: {en: 'With a meal', zh: '佐餐', fr: 'Avec un repas', de: 'Zum Essen', es: 'Con una comida', ko: '식사와 함께', ja: '食事と一緒に', it: 'Con un pasto'},
  'after-dinner': {en: 'After dinner', zh: '餐后', fr: 'Après le dîner', de: 'Nach dem Essen', es: 'Después de cenar', ko: '식후', ja: '食後', it: 'Dopo cena'},
  gathering: {en: 'Gathering', zh: '聚会', fr: 'Réunion entre amis', de: 'Gesellige Runde', es: 'Reunión', ko: '모임', ja: '集まり', it: 'In compagnia'},
  'slow-sip': {en: 'Slow sip', zh: '慢慢独饮', fr: 'À savourer lentement', de: 'In Ruhe genießen', es: 'Para beber despacio', ko: '천천히 즐기기', ja: 'ゆっくり味わう', it: 'Da sorseggiare'},
  celebration: {en: 'Celebration', zh: '庆祝', fr: 'Célébration', de: 'Feier', es: 'Celebración', ko: '축하', ja: 'お祝い', it: 'Festa'},
};

const seasonLabels: Record<Season, Record<Locale, string>> = {
  spring: {en: 'Spring', zh: '春季', fr: 'Printemps', de: 'Frühling', es: 'Primavera', ko: '봄', ja: '春', it: 'Primavera'},
  summer: {en: 'Summer', zh: '夏季', fr: 'Été', de: 'Sommer', es: 'Verano', ko: '여름', ja: '夏', it: 'Estate'},
  autumn: {en: 'Autumn', zh: '秋季', fr: 'Automne', de: 'Herbst', es: 'Otoño', ko: '가을', ja: '秋', it: 'Autunno'},
  winter: {en: 'Winter', zh: '冬季', fr: 'Hiver', de: 'Winter', es: 'Invierno', ko: '겨울', ja: '冬', it: 'Inverno'},
};

const reasonLabels: Record<ContextReasonCode, Record<Locale, string>> = {
  'bitter-dry': {en: 'Bitter or dry profile', zh: '苦味或干爽轮廓', fr: 'Profil amer ou sec', de: 'Bitteres oder trockenes Profil', es: 'Perfil amargo o seco', ko: '쌉쌀하거나 드라이한 맛', ja: '苦味またはドライな味わい', it: 'Profilo amaro o secco'},
  sparkling: {en: 'Sparkling serve', zh: '带气泡的呈现', fr: 'Service pétillant', de: 'Prickelnd serviert', es: 'Servicio espumoso', ko: '탄산감 있는 구성', ja: '発泡感のある仕上がり', it: 'Servizio frizzante'},
  'citrus-refreshing': {en: 'Citrus and a refreshing profile', zh: '柑橘与清爽轮廓', fr: 'Agrumes et profil rafraîchissant', de: 'Zitrus und erfrischendes Profil', es: 'Cítricos y perfil refrescante', ko: '시트러스와 산뜻한 맛', ja: '柑橘と爽やかな味わい', it: 'Agrumi e profilo rinfrescante'},
  'floral-fruit': {en: 'Floral or fruit notes', zh: '花香或果香', fr: 'Notes florales ou fruitées', de: 'Florale oder fruchtige Noten', es: 'Notas florales o frutales', ko: '꽃이나 과일 향', ja: '花や果実の香り', it: 'Note floreali o fruttate'},
  'herbal-fresh': {en: 'Fresh herbal or mint profile', zh: '清新草本或薄荷风味', fr: 'Profil végétal frais ou mentholé', de: 'Frisches Kräuter- oder Minzprofil', es: 'Perfil fresco de hierbas o menta', ko: '신선한 허브 또는 민트 향', ja: 'フレッシュなハーブやミントの風味', it: 'Profilo fresco di erbe o menta'},
  'spice-depth': {en: 'Spice and depth', zh: '香料感与深度', fr: 'Épices et profondeur', de: 'Würze und Tiefe', es: 'Especias y profundidad', ko: '향신료와 깊이', ja: 'スパイスと奥行き', it: 'Spezie e profondità'},
  'warm-serve': {en: 'Served warm', zh: '温热呈现', fr: 'Servi chaud', de: 'Warm serviert', es: 'Se sirve caliente', ko: '따뜻하게 제공', ja: '温かい仕上がり', it: 'Servito caldo'},
  'rich-finish': {en: 'A rich finish', zh: '饱满的收尾', fr: 'Une finale ample', de: 'Voller Nachklang', es: 'Final pleno', ko: '풍부한 여운', ja: '厚みのある余韻', it: 'Finale pieno'},
  'spirit-forward': {en: 'Spirit-forward profile', zh: '基酒感鲜明', fr: 'Profil dominé par le spiritueux', de: 'Spirituosenbetontes Profil', es: 'Perfil con el destilado al frente', ko: '기주가 선명한 맛', ja: 'ベーススピリッツが主役', it: 'Profilo incentrato sul distillato'},
  'simple-build': {en: 'Built in the serving glass in this recipe', zh: '此配方在上桌酒杯中直接调和', fr: 'Préparé dans le verre de service dans cette recette', de: 'In diesem Rezept direkt im Servierglas zubereitet', es: 'Preparado en el vaso de servicio en esta receta', ko: '이 레시피는 서빙 잔에서 바로 조주', ja: 'このレシピは提供するグラスで直接仕上げる', it: 'Preparato nel bicchiere di servizio in questa ricetta'},
  'long-refreshing': {en: 'A long, refreshing serve', zh: '清爽的长饮呈现', fr: 'Un long drink rafraîchissant', de: 'Langer, erfrischender Drink', es: 'Trago largo y refrescante', ko: '길고 산뜻하게 즐기는 구성', ja: '爽やかなロングスタイル', it: 'Un long drink rinfrescante'},
};

export type ContextKey = keyof ContextCopy;

export function contextText(locale: Locale, key: ContextKey): string {
  return copy[locale][key];
}

export function occasionLabel(locale: Locale, value: Occasion): string {
  return occasionLabels[value][locale];
}

export function seasonLabel(locale: Locale, value: Season): string {
  return seasonLabels[value][locale];
}

export function contextReasonLabel(locale: Locale, code: ContextReasonCode): string {
  return reasonLabels[code][locale];
}
