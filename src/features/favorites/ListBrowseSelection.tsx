import React, {useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {router} from 'expo-router';
import type {Locale} from '../../domain/contracts';
import {catalogue} from '../../content/catalogue';
import {useFavorites} from '../../platform/FavoritesProvider';
import {favoriteCopy} from '../../i18n/favorites';
import {favoriteListText as copy} from '../../i18n/favorite-lists';
import {favoriteStyles as styles} from './favoritesStyles';
import {isSuccessfulMutation, mutationMessage, nowIso} from './favoriteListHelpers';

/** The catalogue stays the same; only its destination list is contextual. */
export function ListBrowseSelection({listId, locale}: {listId: string; locale: Locale}) {
  const favorites = useFavorites();
  const list = favorites.lists.find(item => item.id === listId);
  return <View style={{gap: 10, paddingVertical: 16}}>
    <Pressable accessibilityRole="link" onPress={() => router.replace({pathname: '/favorites', params: {listId, tab: 'lists'}} as never)} style={styles.quietButton}>
      <Text style={styles.quietButtonText}>← {list?.name ?? copy(locale, 'backToLists')}</Text>
    </Pressable>
    <Text accessibilityRole="header" style={styles.detailTitle}>{copy(locale, 'addDrink')}{list ? ` · ${list.name}` : ''}</Text>
    {!favorites.hydrated && !favorites.error ? <Text style={styles.statusText}>{favoriteCopy(locale).loading}</Text> : null}
    {favorites.hydrated && !list && !favorites.error ? <Text accessibilityRole="alert" style={styles.errorText}>{copy(locale, 'missingList')}</Text> : null}
    {favorites.error ? <View style={{gap: 8}}>
      <Text accessibilityRole="alert" style={styles.errorText}>{copy(locale, favorites.error === 'read' ? 'readFailed' : 'saveFailed')}</Text>
      <Pressable accessibilityRole="button" disabled={favorites.saving} onPress={() => void favorites.retry()} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{copy(locale, favorites.saving ? 'saving' : 'retry')}</Text></Pressable>
    </View> : null}
  </View>;
}

export function ListBrowseAddButton({listId, versionId, locale}: {listId: string; versionId: string; locale: Locale}) {
  const favorites = useFavorites();
  const list = favorites.lists.find(item => item.id === listId);
  const added = Boolean(list?.items.some(item => item.versionId === versionId));
  const version = catalogue.versions.find(item => item.id === versionId);
  const cocktail = catalogue.cocktails.find(item => item.id === version?.cocktailId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [writeFailed, setWriteFailed] = useState(false);
  const blocked = !favorites.hydrated || !list || Boolean(favorites.error) || favorites.saving || busy || added;
  const add = async () => {
    if (blocked) return;
    setBusy(true);
    setError('');
    try {
      const result = await favorites.addToList(listId, versionId, nowIso());
      setWriteFailed(result.status === 'write-failed');
      if (!isSuccessfulMutation(result) && result.status !== 'write-failed') setError(mutationMessage(locale, result));
    } finally {setBusy(false);}
  };
  // Optimistic entries aren't shown as saved while a write is pending/failed.
  const label = copy(locale, busy ? 'saving' : added && !favorites.error ? 'alreadyAdded' : 'addToList');
  return <View style={{gap: 6}}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} · ${cocktail?.name[locale] ?? versionId}`} accessibilityState={{disabled: blocked}} disabled={blocked} onPress={() => void add()} style={[styles.secondaryButton, blocked && {opacity: 0.6}]}><Text accessibilityLiveRegion="polite" style={styles.secondaryButtonText}>{label}</Text></Pressable>
    {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
    {writeFailed && favorites.error === 'write' ? <View style={{gap: 6}}>
      <Text accessibilityRole="alert" style={styles.errorText}>{copy(locale, 'saveFailed')}</Text>
      <Pressable accessibilityRole="button" disabled={favorites.saving} onPress={() => void favorites.retry()} style={styles.quietButton}><Text style={styles.quietButtonText}>{copy(locale, 'retry')}</Text></Pressable>
    </View> : null}
  </View>;
}
