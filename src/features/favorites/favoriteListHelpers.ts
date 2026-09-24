import type {FavoriteList, FavoriteListItem, FavoriteListMutationResult} from '../../domain/favorites';
import type {Locale} from '../../domain/contracts';
import {favoriteListText} from '../../i18n/favorite-lists';

export type FavoriteMutationResult = FavoriteListMutationResult;

export function nowIso(): string {
  return new Date().toISOString();
}

export function createStableListId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `list-${Date.now().toString(36)}-${random}`;
}

export function countDrinks(list: FavoriteList): number {
  return new Set(list.items.map((item) => item.cocktailId)).size;
}

export function groupListItems(list: FavoriteList): FavoriteListItem[][] {
  const groups = new Map<string, FavoriteListItem[]>();
  for (const item of list.items) {
    const group = groups.get(item.cocktailId);
    if (group) group.push(item);
    else groups.set(item.cocktailId, [item]);
  }
  return [...groups.values()];
}

export function mutationMessage(locale: Locale, result: FavoriteMutationResult): string {
  switch (result.status) {
    case 'duplicate': return favoriteListText(locale, 'duplicate');
    case 'not-found': return favoriteListText(locale, 'notFound');
    case 'read-failed': return favoriteListText(locale, 'readFailed');
    case 'limit-exceeded': return favoriteListText(locale, 'limit');
    case 'invalid': return favoriteListText(locale, 'invalid');
    case 'write-failed': return favoriteListText(locale, 'saveFailed');
    case 'saved': return favoriteListText(locale, 'added');
  }
}

export function isSuccessfulMutation(result: FavoriteMutationResult): boolean {
  return result.status === 'saved' || result.status === 'duplicate';
}
