import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import type {Locale} from '../../domain/contracts';
import {favoriteCopy} from '../../i18n/favorites';
import {favoriteListText} from '../../i18n/favorite-lists';
import {useFavorites} from '../../platform/FavoritesProvider';
import {colors, radii} from '../../theme/tokens';

export function FavoriteButton({versionId, locale, compact = false}: {versionId: string; locale: Locale; compact?: boolean}) {
  const {versionIds, toggle, storageAvailable, saving, error, retry} = useFavorites();
  const saved = versionIds.includes(versionId);
  const [pendingIntent, setPendingIntent] = useState<{versionId: string; saved: boolean} | null>(null);
  const currentIntent = pendingIntent?.versionId === versionId ? pendingIntent : null;
  useEffect(() => {
    if (pendingIntent && pendingIntent.versionId !== versionId) setPendingIntent(null);
  }, [pendingIntent, versionId]);
  useEffect(() => {
    if (!saving && !error && currentIntent && saved === currentIntent.saved) setPendingIntent(null);
  }, [currentIntent, error, saved, saving]);
  const confirmedSaved = saved && storageAvailable && !error && (!saving || !currentIntent) && currentIntent?.saved !== false;
  const retryable = error === 'write' && !saving;
  const copy = favoriteCopy(locale);
  const label = confirmedSaved ? copy.saved : retryable ? favoriteListText(locale, 'retry') : saving && currentIntent ? favoriteListText(locale, 'saving') : copy.save;
  return <View>
    <Pressable accessibilityRole="button" accessibilityLabel={label === copy.saved ? copy.remove : label} accessibilityHint={retryable ? favoriteListText(locale, 'saveFailed') : undefined}
      accessibilityState={{selected: saved, busy: saving}} disabled={saving} onPress={() => retryable ? void retry() : (setPendingIntent({versionId, saved: !saved}), toggle(versionId))}
      style={({pressed}) => [styles.button, compact && styles.compact, confirmedSaved && styles.saved, pressed && {opacity: 0.7}, saving && {opacity: 0.7}]}>
      <Text style={[styles.heart, confirmedSaved && styles.active]}>{confirmedSaved ? '♥' : '♡'}</Text>
      {!compact && <Text style={[styles.label, confirmedSaved && styles.active]}>{label}</Text>}
    </Pressable>
    {!compact && (!storageAvailable || retryable) && <Text accessibilityRole="alert" style={styles.warning}>{retryable ? favoriteListText(locale, 'saveFailed') : copy.storage}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  button: {minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 18, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel},
  compact: {width: 44, height: 44, minHeight: 44, paddingHorizontal: 0, backgroundColor: 'rgba(16,23,20,0.90)'},
  saved: {backgroundColor: colors.accent, borderColor: colors.accent},
  heart: {fontSize: 24, lineHeight: 28, color: colors.accent},
  label: {fontSize: 14, fontWeight: '700', color: colors.text},
  active: {color: colors.background},
  warning: {color: colors.amber, fontSize: 12, lineHeight: 18, marginTop: 8},
});
