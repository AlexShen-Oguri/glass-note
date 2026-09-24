import type {Locale} from '../domain/contracts';

/**
 * Copy for the private-list surface. Keep this separate from the heart
 * button copy so the collection can grow without making the existing save
 * action harder to scan.
 */
const en = {
  favoritesTab: 'All favorites',
  listsTab: 'My lists',
  listIntro: 'Keep exact source versions together for a night, a menu, or the next drink.',
  listCount: 'lists',
  versionCount: 'versions',
  drinkCount: 'drinks',
  newList: 'New list',
  defaultListName: 'My list',
  nameLabel: 'List name',
  namePlaceholder: 'Give this list a name',
  createList: 'Create list',
  saveChanges: 'Save changes',
  cancel: 'Cancel',
  close: 'Close',
  chooseList: 'Add to a list',
  addToList: 'Add to list',
  addDrink: 'Add drinks',
  manage: 'Manage list',
  listVersion: 'Source version',
  added: 'Added to this list',
  alreadyAdded: 'Already in this list',
  saving: 'Saving',
  retry: 'Try again',
  saveFailed: 'This change is not saved yet. Your input is still here.',
  readFailed: 'Your saved lists could not be opened. Nothing was cleared.',
  unavailable: 'This saved source is no longer in the catalogue.',
  unavailableDetail: 'The saved reference is kept, but its current source page is unavailable.',
  emptyLists: 'No private lists yet',
  emptyListsHint: 'Create a list when you want to keep a few exact source versions together.',
  emptyList: 'This list is empty',
  emptyListHint: 'Add an exact source version from the catalogue.',
  searchCatalogue: 'Search the catalogue',
  noMatches: 'No source versions match this search.',
  snapshot: 'Saved recipe snapshot',
  source: 'Source',
  materials: 'Materials',
  method: 'Method',
  preparedComponents: 'Prepared components',
  optional: 'optional',
  readSnapshot: 'Read saved recipe',
  hideSnapshot: 'Hide saved recipe',
  openSource: 'Open source',
  viewRecipe: 'View current recipe',
  backToLists: 'Back to lists',
  rename: 'Rename',
  removeVersion: 'Remove version',
  deleteList: 'Delete list',
  deleteListTitle: 'Delete this list?',
  deleteListBody: 'This removes the private list only. Your favorites and public recipes stay safe.',
  confirmDelete: 'Delete list',
  deleteCancelled: 'Delete cancelled',
  addVersionHint: 'Choose the exact source version to save.',
  sourceVersionHint: 'This label identifies the source version you are adding.',
  oldFavorites: 'Some older favorites are unavailable',
  oldFavoritesDetail: 'They remain in your backup, but their current catalogue entries are not available.',
  duplicate: 'Already saved here',
  missingList: 'That list is no longer available.',
  limit: 'This device list limit has been reached.',
  invalid: 'That list change could not be accepted.',
  notFound: 'The saved list or version could not be found.',
  listCreated: 'List created',
  listRenamed: 'List renamed',
  versionRemoved: 'Version removed',
  listDeleted: 'List deleted',
  unavailableAction: 'Unavailable',
} as const;

type FavoriteListCopy = Record<keyof typeof en, string>;

const copy: Record<Locale, FavoriteListCopy> = {
  en,
  zh: {
    favoritesTab: '全部收藏', listsTab: '我的酒单', listIntro: '把确切的来源版本放在一起，留给今晚、菜单或下一杯。', listCount: '个酒单', versionCount: '个版本', drinkCount: '款酒', newList: '新建酒单', defaultListName: '我的酒单', nameLabel: '酒单名称', namePlaceholder: '给酒单取个名字', createList: '创建酒单', saveChanges: '保存修改', cancel: '取消', close: '关闭', chooseList: '加入酒单', addToList: '加入酒单', addDrink: '添加酒款', manage: '管理酒单', listVersion: '来源版本', added: '已加入这个酒单', alreadyAdded: '这个版本已在酒单中', saving: '正在保存', retry: '再试一次', saveFailed: '这项修改还没有保存。你输入的内容仍在这里。', readFailed: '暂时无法打开已保存的酒单，没有内容被清空。', unavailable: '这个保存的来源已不在当前目录中。', unavailableDetail: '已保留来源引用，但当前来源页面暂不可用。', emptyLists: '还没有私人酒单', emptyListsHint: '想把几款确切来源版本放在一起时，就新建一个酒单。', emptyList: '这个酒单还是空的', emptyListHint: '从目录添加一个确切的来源版本。', searchCatalogue: '搜索酒库', noMatches: '没有符合搜索的来源版本。', snapshot: '保存时的配方', source: '来源', materials: '材料', method: '做法', preparedComponents: '提前准备', optional: '可选', readSnapshot: '查看保存的配方', hideSnapshot: '收起保存的配方', openSource: '打开来源', viewRecipe: '查看当前配方', backToLists: '返回酒单', rename: '重命名', removeVersion: '移出版本', deleteList: '删除酒单', deleteListTitle: '删除这个酒单？', deleteListBody: '只会删除私人酒单，不会影响收藏或公共配方。', confirmDelete: '删除酒单', deleteCancelled: '已取消删除', addVersionHint: '选择要保存的确切来源版本。', sourceVersionHint: '这个标签用于确认你正在添加的来源版本。', oldFavorites: '有些旧收藏暂时不可用', oldFavoritesDetail: '它们仍保留在备份中，但当前目录中没有对应条目。', duplicate: '已在此酒单中', missingList: '这个酒单已不存在。', limit: '已达到设备酒单上限。', invalid: '这项酒单修改无法接受。', notFound: '找不到这个酒单或版本。', listCreated: '酒单已创建', listRenamed: '酒单已重命名', versionRemoved: '版本已移出', listDeleted: '酒单已删除', unavailableAction: '暂不可用',
  },
  fr: {
    favoritesTab: 'Tous les favoris', listsTab: 'Mes listes', listIntro: 'Rassemblez des versions exactes d’une source pour ce soir, un menu ou le prochain verre.', listCount: 'listes', versionCount: 'versions', drinkCount: 'cocktails', newList: 'Nouvelle liste', defaultListName: 'Ma liste', nameLabel: 'Nom de la liste', namePlaceholder: 'Nommer cette liste', createList: 'Créer la liste', saveChanges: 'Enregistrer', cancel: 'Annuler', close: 'Fermer', chooseList: 'Ajouter à une liste', addToList: 'Ajouter à la liste', addDrink: 'Ajouter des cocktails', manage: 'Gérer la liste', listVersion: 'Version source', added: 'Ajouté à cette liste', alreadyAdded: 'Déjà dans cette liste', saving: 'Enregistrement', retry: 'Réessayer', saveFailed: 'Cette modification n’est pas encore enregistrée. Votre saisie est conservée.', readFailed: 'Vos listes n’ont pas pu être ouvertes. Rien n’a été effacé.', unavailable: 'Cette source enregistrée n’est plus dans le catalogue.', unavailableDetail: 'La référence reste conservée, mais sa page source actuelle est indisponible.', emptyLists: 'Aucune liste privée', emptyListsHint: 'Créez une liste pour garder ensemble quelques versions exactes.', emptyList: 'Cette liste est vide', emptyListHint: 'Ajoutez une version source exacte du catalogue.', searchCatalogue: 'Rechercher dans le catalogue', noMatches: 'Aucune version source ne correspond.', snapshot: 'Instantané de recette enregistré', source: 'Source', materials: 'Ingrédients', method: 'Méthode', preparedComponents: 'Composants préparés', optional: 'facultatif', readSnapshot: 'Lire la recette enregistrée', hideSnapshot: 'Masquer la recette enregistrée', openSource: 'Ouvrir la source', viewRecipe: 'Voir la recette actuelle', backToLists: 'Retour aux listes', rename: 'Renommer', removeVersion: 'Retirer la version', deleteList: 'Supprimer la liste', deleteListTitle: 'Supprimer cette liste ?', deleteListBody: 'Seule la liste privée est supprimée. Vos favoris et les recettes publiques restent intacts.', confirmDelete: 'Supprimer la liste', deleteCancelled: 'Suppression annulée', addVersionHint: 'Choisissez la version exacte de la source à conserver.', sourceVersionHint: 'Ce libellé identifie la version source ajoutée.', oldFavorites: 'Certains anciens favoris sont indisponibles', oldFavoritesDetail: 'Ils restent dans votre sauvegarde, mais leur entrée actuelle n’est plus disponible.', duplicate: 'Déjà enregistrée ici', missingList: 'Cette liste n’est plus disponible.', limit: 'La limite de listes de cet appareil est atteinte.', invalid: 'Cette modification de liste n’a pas pu être acceptée.', notFound: 'Liste ou version introuvable.', listCreated: 'Liste créée', listRenamed: 'Liste renommée', versionRemoved: 'Version retirée', listDeleted: 'Liste supprimée', unavailableAction: 'Indisponible',
  },
  de: {
    favoritesTab: 'Alle Favoriten', listsTab: 'Meine Listen', listIntro: 'Bewahre genaue Quellversionen für heute, ein Menü oder den nächsten Drink zusammen auf.', listCount: 'Listen', versionCount: 'Versionen', drinkCount: 'Drinks', newList: 'Neue Liste', defaultListName: 'Meine Liste', nameLabel: 'Listenname', namePlaceholder: 'Liste benennen', createList: 'Liste erstellen', saveChanges: 'Änderungen speichern', cancel: 'Abbrechen', close: 'Schließen', chooseList: 'Zu einer Liste hinzufügen', addToList: 'Zur Liste hinzufügen', addDrink: 'Drinks hinzufügen', manage: 'Liste verwalten', listVersion: 'Quellversion', added: 'Zur Liste hinzugefügt', alreadyAdded: 'Bereits in dieser Liste', saving: 'Wird gespeichert', retry: 'Erneut versuchen', saveFailed: 'Diese Änderung ist noch nicht gespeichert. Deine Eingabe bleibt erhalten.', readFailed: 'Deine Listen konnten nicht geöffnet werden. Es wurde nichts gelöscht.', unavailable: 'Diese gespeicherte Quelle ist nicht mehr im Katalog.', unavailableDetail: 'Die Referenz bleibt erhalten, aber die aktuelle Quellseite ist nicht verfügbar.', emptyLists: 'Noch keine privaten Listen', emptyListsHint: 'Erstelle eine Liste, wenn du genaue Quellversionen zusammenhalten möchtest.', emptyList: 'Diese Liste ist leer', emptyListHint: 'Füge eine genaue Quellversion aus dem Katalog hinzu.', searchCatalogue: 'Katalog durchsuchen', noMatches: 'Keine Quellversion passt zu dieser Suche.', snapshot: 'Gespeicherter Rezept-Snapshot', source: 'Quelle', materials: 'Zutaten', method: 'Methode', preparedComponents: 'Vorbereitete Komponenten', optional: 'optional', readSnapshot: 'Gespeichertes Rezept lesen', hideSnapshot: 'Gespeichertes Rezept ausblenden', openSource: 'Quelle öffnen', viewRecipe: 'Aktuelles Rezept ansehen', backToLists: 'Zurück zu Listen', rename: 'Umbenennen', removeVersion: 'Version entfernen', deleteList: 'Liste löschen', deleteListTitle: 'Diese Liste löschen?', deleteListBody: 'Nur die private Liste wird gelöscht. Favoriten und öffentliche Rezepte bleiben erhalten.', confirmDelete: 'Liste löschen', deleteCancelled: 'Löschen abgebrochen', addVersionHint: 'Wähle die genaue Quellversion zum Speichern.', sourceVersionHint: 'Dieses Label zeigt die hinzugefügte Quellversion.', oldFavorites: 'Einige ältere Favoriten sind nicht verfügbar', oldFavoritesDetail: 'Sie bleiben in deinem Backup, aber der aktuelle Katalogeintrag fehlt.', duplicate: 'Bereits hier gespeichert', missingList: 'Diese Liste ist nicht mehr verfügbar.', limit: 'Das Listenlimit dieses Geräts ist erreicht.', invalid: 'Diese Listenänderung wurde nicht akzeptiert.', notFound: 'Liste oder Version nicht gefunden.', listCreated: 'Liste erstellt', listRenamed: 'Liste umbenannt', versionRemoved: 'Version entfernt', listDeleted: 'Liste gelöscht', unavailableAction: 'Nicht verfügbar',
  },
  es: {
    favoritesTab: 'Todos los favoritos', listsTab: 'Mis listas', listIntro: 'Reúne versiones exactas de una fuente para esta noche, un menú o la próxima copa.', listCount: 'listas', versionCount: 'versiones', drinkCount: 'copas', newList: 'Nueva lista', defaultListName: 'Mi lista', nameLabel: 'Nombre de la lista', namePlaceholder: 'Ponle nombre a esta lista', createList: 'Crear lista', saveChanges: 'Guardar cambios', cancel: 'Cancelar', close: 'Cerrar', chooseList: 'Añadir a una lista', addToList: 'Añadir a la lista', addDrink: 'Añadir copas', manage: 'Gestionar lista', listVersion: 'Versión de la fuente', added: 'Añadido a esta lista', alreadyAdded: 'Ya está en esta lista', saving: 'Guardando', retry: 'Intentar de nuevo', saveFailed: 'Este cambio aún no está guardado. Tu texto sigue aquí.', readFailed: 'No se han podido abrir tus listas. No se ha borrado nada.', unavailable: 'Esta fuente guardada ya no está en el catálogo.', unavailableDetail: 'La referencia se conserva, pero su página actual no está disponible.', emptyLists: 'Aún no hay listas privadas', emptyListsHint: 'Crea una lista para mantener juntas algunas versiones exactas.', emptyList: 'Esta lista está vacía', emptyListHint: 'Añade una versión exacta de la fuente desde el catálogo.', searchCatalogue: 'Buscar en el catálogo', noMatches: 'No hay versiones de fuente que coincidan.', snapshot: 'Instantánea de receta guardada', source: 'Fuente', materials: 'Ingredientes', method: 'Método', preparedComponents: 'Componentes preparados', optional: 'opcional', readSnapshot: 'Leer receta guardada', hideSnapshot: 'Ocultar receta guardada', openSource: 'Abrir fuente', viewRecipe: 'Ver receta actual', backToLists: 'Volver a las listas', rename: 'Cambiar nombre', removeVersion: 'Quitar versión', deleteList: 'Eliminar lista', deleteListTitle: '¿Eliminar esta lista?', deleteListBody: 'Solo se elimina la lista privada. Tus favoritos y las recetas públicas permanecen.', confirmDelete: 'Eliminar lista', deleteCancelled: 'Eliminación cancelada', addVersionHint: 'Elige la versión exacta de la fuente que quieres guardar.', sourceVersionHint: 'Esta etiqueta identifica la versión de la fuente que añades.', oldFavorites: 'Algunos favoritos antiguos no están disponibles', oldFavoritesDetail: 'Siguen en tu copia de seguridad, pero falta su entrada actual en el catálogo.', duplicate: 'Ya está guardado aquí', missingList: 'Esta lista ya no está disponible.', limit: 'Se ha alcanzado el límite de listas de este dispositivo.', invalid: 'No se ha podido aceptar este cambio de lista.', notFound: 'No se encuentra la lista o la versión.', listCreated: 'Lista creada', listRenamed: 'Lista renombrada', versionRemoved: 'Versión retirada', listDeleted: 'Lista eliminada', unavailableAction: 'No disponible',
  },
  ko: {
    favoritesTab: '전체 즐겨찾기', listsTab: '내 술 목록', listIntro: '오늘 밤, 메뉴, 다음 잔을 위해 정확한 출처 버전을 함께 보관하세요.', listCount: '개 목록', versionCount: '개 버전', drinkCount: '잔', newList: '새 목록', defaultListName: '내 술 목록', nameLabel: '목록 이름', namePlaceholder: '목록 이름 입력', createList: '목록 만들기', saveChanges: '변경 저장', cancel: '취소', close: '닫기', chooseList: '목록에 추가', addToList: '목록에 추가', addDrink: '술 추가', manage: '목록 관리', listVersion: '출처 버전', added: '이 목록에 추가됨', alreadyAdded: '이 목록에 이미 있음', saving: '저장 중', retry: '다시 시도', saveFailed: '변경 사항이 아직 저장되지 않았습니다. 입력한 내용은 남아 있습니다.', readFailed: '저장된 목록을 열 수 없습니다. 아무것도 지우지 않았습니다.', unavailable: '저장한 출처가 현재 카탈로그에 없습니다.', unavailableDetail: '저장된 참조는 남아 있지만 현재 출처 페이지를 사용할 수 없습니다.', emptyLists: '아직 개인 목록이 없습니다', emptyListsHint: '정확한 출처 버전을 함께 보관하고 싶을 때 목록을 만드세요.', emptyList: '이 목록은 비어 있습니다', emptyListHint: '카탈로그에서 정확한 출처 버전을 추가하세요.', searchCatalogue: '카탈로그 검색', noMatches: '일치하는 출처 버전이 없습니다.', snapshot: '저장된 레시피 스냅샷', source: '출처', materials: '재료', method: '방법', preparedComponents: '준비된 구성 요소', optional: '선택', readSnapshot: '저장된 레시피 읽기', hideSnapshot: '저장된 레시피 숨기기', openSource: '출처 열기', viewRecipe: '현재 레시피 보기', backToLists: '목록으로', rename: '이름 변경', removeVersion: '버전 제거', deleteList: '목록 삭제', deleteListTitle: '이 목록을 삭제할까요?', deleteListBody: '개인 목록만 삭제됩니다. 즐겨찾기와 공개 레시피는 그대로 남습니다.', confirmDelete: '목록 삭제', deleteCancelled: '삭제 취소', addVersionHint: '저장할 정확한 출처 버전을 선택하세요.', sourceVersionHint: '이 라벨로 추가할 출처 버전을 확인할 수 있습니다.', oldFavorites: '일부 오래된 즐겨찾기를 사용할 수 없습니다', oldFavoritesDetail: '백업에는 남아 있지만 현재 카탈로그 항목이 없습니다.', duplicate: '이미 이 목록에 저장됨', missingList: '이 목록은 더 이상 없습니다.', limit: '이 기기의 목록 한도에 도달했습니다.', invalid: '목록 변경을 적용할 수 없습니다.', notFound: '목록 또는 버전을 찾을 수 없습니다.', listCreated: '목록 생성됨', listRenamed: '목록 이름 변경됨', versionRemoved: '버전 제거됨', listDeleted: '목록 삭제됨', unavailableAction: '사용할 수 없음',
  },
  ja: {
    favoritesTab: 'すべてのお気に入り', listsTab: 'マイリスト', listIntro: '今夜の一杯、メニュー、次の一杯のために、正確な出典版をまとめます。', listCount: '件のリスト', versionCount: '件の版', drinkCount: '杯', newList: '新しいリスト', defaultListName: 'マイリスト', nameLabel: 'リスト名', namePlaceholder: 'リストに名前を付ける', createList: 'リストを作成', saveChanges: '変更を保存', cancel: 'キャンセル', close: '閉じる', chooseList: 'リストに追加', addToList: 'リストに追加', addDrink: 'ドリンクを追加', manage: 'リストを管理', listVersion: '出典版', added: 'このリストに追加しました', alreadyAdded: 'このリストにすでにあります', saving: '保存中', retry: 'もう一度試す', saveFailed: 'この変更はまだ保存されていません。入力内容は残っています。', readFailed: '保存したリストを開けませんでした。内容は削除していません。', unavailable: '保存した出典が現在のカタログにありません。', unavailableDetail: '保存した参照は残っていますが、現在の出典ページは利用できません。', emptyLists: 'プライベートリストはまだありません', emptyListsHint: '正確な出典版をまとめたいときにリストを作成します。', emptyList: 'このリストは空です', emptyListHint: 'カタログから正確な出典版を追加してください。', searchCatalogue: 'カタログを検索', noMatches: '一致する出典版はありません。', snapshot: '保存したレシピスナップショット', source: '出典', materials: '材料', method: '作り方', preparedComponents: '準備済みの材料', optional: '任意', readSnapshot: '保存したレシピを読む', hideSnapshot: '保存したレシピを隠す', openSource: '出典を開く', viewRecipe: '現在のレシピを見る', backToLists: 'リストに戻る', rename: '名前を変更', removeVersion: '版を外す', deleteList: 'リストを削除', deleteListTitle: 'このリストを削除しますか？', deleteListBody: 'プライベートリストだけを削除します。お気に入りと公開レシピは残ります。', confirmDelete: 'リストを削除', deleteCancelled: '削除をキャンセル', addVersionHint: '保存する正確な出典版を選びます。', sourceVersionHint: '追加する出典版をこのラベルで確認できます。', oldFavorites: '一部の古いお気に入りは利用できません', oldFavoritesDetail: 'バックアップには残っていますが、現在のカタログ項目がありません。', duplicate: 'このリストに保存済み', missingList: 'このリストはもうありません。', limit: 'この端末のリスト上限に達しました。', invalid: 'リストの変更を受け付けられませんでした。', notFound: 'リストまたは版が見つかりません。', listCreated: 'リストを作成しました', listRenamed: 'リスト名を変更しました', versionRemoved: '版を外しました', listDeleted: 'リストを削除しました', unavailableAction: '利用できません',
  },
  it: {
    favoritesTab: 'Tutti i preferiti', listsTab: 'Le mie liste', listIntro: 'Riunisci versioni esatte della fonte per questa sera, un menu o il prossimo drink.', listCount: 'liste', versionCount: 'versioni', drinkCount: 'drink', newList: 'Nuova lista', defaultListName: 'La mia lista', nameLabel: 'Nome della lista', namePlaceholder: 'Dai un nome alla lista', createList: 'Crea lista', saveChanges: 'Salva modifiche', cancel: 'Annulla', close: 'Chiudi', chooseList: 'Aggiungi a una lista', addToList: 'Aggiungi alla lista', addDrink: 'Aggiungi drink', manage: 'Gestisci lista', listVersion: 'Versione della fonte', added: 'Aggiunto a questa lista', alreadyAdded: 'Già in questa lista', saving: 'Salvataggio', retry: 'Riprova', saveFailed: 'Questa modifica non è ancora salvata. Il testo resta qui.', readFailed: 'Non è stato possibile aprire le liste salvate. Non è stato cancellato nulla.', unavailable: 'Questa fonte salvata non è più nel catalogo.', unavailableDetail: 'Il riferimento resta salvato, ma la pagina attuale della fonte non è disponibile.', emptyLists: 'Nessuna lista privata', emptyListsHint: 'Crea una lista quando vuoi riunire alcune versioni esatte della fonte.', emptyList: 'Questa lista è vuota', emptyListHint: 'Aggiungi una versione esatta della fonte dal catalogo.', searchCatalogue: 'Cerca nel catalogo', noMatches: 'Nessuna versione della fonte corrisponde.', snapshot: 'Snapshot della ricetta salvato', source: 'Fonte', materials: 'Ingredienti', method: 'Metodo', preparedComponents: 'Componenti preparati', optional: 'facoltativo', readSnapshot: 'Leggi la ricetta salvata', hideSnapshot: 'Nascondi la ricetta salvata', openSource: 'Apri la fonte', viewRecipe: 'Vedi la ricetta attuale', backToLists: 'Torna alle liste', rename: 'Rinomina', removeVersion: 'Rimuovi versione', deleteList: 'Elimina lista', deleteListTitle: 'Eliminare questa lista?', deleteListBody: 'Viene eliminata solo la lista privata. Preferiti e ricette pubbliche restano intatti.', confirmDelete: 'Elimina lista', deleteCancelled: 'Eliminazione annullata', addVersionHint: 'Scegli la versione esatta della fonte da salvare.', sourceVersionHint: 'Questa etichetta identifica la versione della fonte che aggiungi.', oldFavorites: 'Alcuni preferiti meno recenti non sono disponibili', oldFavoritesDetail: 'Restano nel backup, ma la voce attuale del catalogo non è disponibile.', duplicate: 'Già salvato qui', missingList: 'Questa lista non è più disponibile.', limit: 'È stato raggiunto il limite di liste del dispositivo.', invalid: 'La modifica della lista non è stata accettata.', notFound: 'Lista o versione non trovata.', listCreated: 'Lista creata', listRenamed: 'Lista rinominata', versionRemoved: 'Versione rimossa', listDeleted: 'Lista eliminata', unavailableAction: 'Non disponibile',
  },
};

export type FavoriteListKey = keyof FavoriteListCopy;
export function favoriteListText(locale: Locale, key: FavoriteListKey, values?: Record<string, string | number>): string {
  const template = copy[locale][key];
  if (!values) return template;
  return Object.entries(values).reduce((result: string, [name, value]) => result.replaceAll(`{${name}}`, String(value)), template);
}

export function favoriteListCopy(locale: Locale): FavoriteListCopy {
  return copy[locale];
}

export const FAVORITE_LIST_LOCALES = Object.keys(copy) as Locale[];
