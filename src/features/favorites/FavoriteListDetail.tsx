import {recipeDisplayName} from '../../content/localization/display';
import {CocktailOriginalName} from '../names/OriginalName';
import {plainVersionLabel} from '../recipe/versionLabel';
import React, {useMemo, useState} from 'react';
import {KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {router} from 'expo-router';
import type {FavoriteList, FavoriteListMutationResult} from '../../domain/favorites';
import type {Locale, UnitPreference} from '../../domain/contracts';
import {catalogue} from '../../content/catalogue';
import {favoriteCopy} from '../../i18n/favorites';
import {favoriteListText} from '../../i18n/favorite-lists';
import {useFavorites} from '../../platform/FavoritesProvider';
import {media} from '../../media';
import {colors} from '../../theme/tokens';
import {PhotoFrame} from '../discovery/components';
import {useMotionEnabled} from '../motion';
import {favoriteStyles as styles} from './favoritesStyles';
import {groupListItems, isSuccessfulMutation, mutationMessage, nowIso} from './favoriteListHelpers';
import {SavedRecipeReader} from './SavedRecipeReader';

function resultText(locale: Locale, result: FavoriteListMutationResult, success: string): string {
  return isSuccessfulMutation(result) ? success : mutationMessage(locale, result);
}
function ManageListModal({list, locale, visible, onClose, onDeleted}: {list: FavoriteList; locale: Locale; visible: boolean; onClose: () => void; onDeleted: () => void}) {
  const favorites = useFavorites();
  const [name, setName] = useState(list.name);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [failedWrite, setFailedWrite] = useState<'rename' | 'remove' | 'delete' | null>(null);
  const motionEnabled = useMotionEnabled();

  const mutate = async (run: () => Promise<FavoriteListMutationResult>, success: string, action: 'rename' | 'remove' | 'delete') => {
    if (busy || favorites.saving) return;
    setBusy(true);
    setFeedback(null);
    setFailedWrite(null);
    const result = await run();
    if (isSuccessfulMutation(result)) setFeedback(success);
    else {
      setFeedback(mutationMessage(locale, result));
      setFailedWrite(result.status === 'write-failed' ? action : null);
    }
    setBusy(false);
  };
  const retryWrite = async () => {
    if (!failedWrite || busy || favorites.saving) return;
    setBusy(true);
    const ok = await favorites.retry();
    if (ok) {
      if (failedWrite === 'delete') onDeleted();
      else setFeedback(failedWrite === 'rename' ? favoriteListText(locale, 'listRenamed') : favoriteListText(locale, 'versionRemoved'));
      setFailedWrite(null);
    } else setFeedback(favoriteListText(locale, 'saveFailed'));
    setBusy(false);
  };

  return <Modal visible={visible} transparent animationType={motionEnabled ? 'fade' : 'none'} onRequestClose={onClose}>
    <View style={styles.modalBackdrop}>
      <KeyboardAvoidingView pointerEvents="box-none" style={modalFrame.center} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View accessibilityViewIsModal style={[styles.modalPanel, {zIndex: 1}]}>
        <View style={styles.modalHeadingRow}>
          <Text style={styles.modalHeading}>{favoriteListText(locale, 'manage')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={favoriteListText(locale, 'close')} onPress={onClose} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable>
        </View>
        {!confirmDelete ? <ScrollView style={styles.modalScroll} contentContainerStyle={{gap: 8}} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>{favoriteListText(locale, 'nameLabel')}</Text>
          <TextInput accessibilityLabel={favoriteListText(locale, 'nameLabel')} value={name} onChangeText={setName} maxLength={100} style={styles.nameInput} />
          <Pressable accessibilityRole="button" disabled={!name.trim() || busy || favorites.saving} onPress={() => void mutate(() => favorites.renameList(list.id, name.trim(), nowIso()), favoriteListText(locale, 'listRenamed'), 'rename')} style={[styles.primaryButton, (!name.trim() || busy || favorites.saving) && {opacity: 0.5}]}>
            <Text style={styles.primaryButtonText}>{favoriteListText(locale, 'saveChanges')}</Text>
          </Pressable>
          <View style={{marginTop: 8}}>
            {list.items.map((item) => {
              const title = recipeDisplayName(item.recipe, locale) || item.cocktailId;
              const label = plainVersionLabel(item.versionId, locale);
              return <View key={item.versionId} style={styles.manageRow}>
                <Text style={styles.manageRowTitle}>{title}</Text>
                <CocktailOriginalName recipe={item.recipe} locale={locale} />
                <Text style={styles.manageRowMeta}>{label}</Text>
                <Pressable accessibilityRole="button" disabled={busy || favorites.saving} onPress={() => void mutate(() => favorites.removeFromList(list.id, item.versionId, nowIso()), favoriteListText(locale, 'versionRemoved'), 'remove')} style={styles.quietButton}>
                  <Text style={styles.quietButtonText}>{favoriteListText(locale, 'removeVersion')}</Text>
                </Pressable>
              </View>;
            })}
          </View>
          <Pressable accessibilityRole="button" disabled={busy || favorites.saving} onPress={() => setConfirmDelete(true)} style={[styles.dangerButton, (busy || favorites.saving) && {opacity: 0.5}]}>
            <Text style={styles.dangerText}>{favoriteListText(locale, 'deleteList')}</Text>
          </Pressable>
          {feedback ? <Text accessibilityRole="alert" style={feedback === favoriteListText(locale, 'listRenamed') || feedback === favoriteListText(locale, 'versionRemoved') ? styles.statusText : styles.errorText}>{feedback}</Text> : null}
          {failedWrite ? <Pressable accessibilityRole="button" disabled={busy || favorites.saving} onPress={() => void retryWrite()} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{favoriteListText(locale, 'retry')}</Text></Pressable> : null}
        </ScrollView> : <View style={{gap: 12}}>
          <Text style={styles.emptyTitle}>{favoriteListText(locale, 'deleteListTitle')}</Text>
          <Text style={styles.modalHint}>{favoriteListText(locale, 'deleteListBody')}</Text>
          <View style={styles.modalActions}>
            <Pressable accessibilityRole="button" disabled={busy || favorites.saving} onPress={() => void mutate(async () => {
              const result = await favorites.deleteList(list.id);
              if (isSuccessfulMutation(result)) onDeleted();
              return result;
            }, favoriteListText(locale, 'listDeleted'), 'delete')} style={styles.dangerButton}><Text style={styles.dangerText}>{favoriteListText(locale, 'confirmDelete')}</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => setConfirmDelete(false)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{favoriteListText(locale, 'cancel')}</Text></Pressable>
          </View>
          {feedback ? <Text accessibilityRole="alert" style={styles.errorText}>{feedback}</Text> : null}
          {failedWrite ? <Pressable accessibilityRole="button" disabled={busy || favorites.saving} onPress={() => void retryWrite()} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{favoriteListText(locale, 'retry')}</Text></Pressable> : null}
        </View>}
      </View>
      </KeyboardAvoidingView>
      <Pressable accessible={false} focusable={false} accessibilityElementsHidden importantForAccessibility="no" tabIndex={-1} onPress={onClose} style={[StyleSheet.absoluteFill, {zIndex: 0}]} />
    </View>
  </Modal>;
}

export function FavoriteListDetail({list, locale, unit, onBack, onDeleted}: {list: FavoriteList; locale: Locale; unit: UnitPreference; onBack: () => void; onDeleted: () => void}) {
  const [manageOpen, setManageOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const groups = useMemo(() => groupListItems(list), [list]);
  return <View style={styles.listDetail}>
    <Pressable accessibilityRole="button" onPress={onBack} style={styles.quietButton}><Text style={styles.quietButtonText}>← {favoriteListText(locale, 'backToLists')}</Text></Pressable>
    <View style={styles.detailHeader}>
      <Text style={styles.detailTitle}>{list.name}</Text>
      <Text style={styles.detailMeta}>{new Set(list.items.map((item) => item.cocktailId)).size} {favoriteListText(locale, 'drinkCount')} · {list.items.length} {favoriteListText(locale, 'versionCount')}</Text>
      <View style={styles.actionRow}>
        <Pressable accessibilityRole="link" onPress={() => router.push({pathname: '/discover', params: {listId: list.id}} as never)} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{favoriteListText(locale, 'addDrink')}</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setManageOpen(true)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{favoriteListText(locale, 'manage')}</Text></Pressable>
      </View>
    </View>
    {!groups.length ? <View style={styles.emptyPanel}><Text style={styles.emptyTitle}>{favoriteListText(locale, 'emptyList')}</Text><Text style={styles.emptyHint}>{favoriteListText(locale, 'emptyListHint')}</Text></View> : groups.map((items) => {
      const first = items[0]!;
      const cocktail = catalogue.cocktails.find((item) => item.id === first.cocktailId);
      const title = recipeDisplayName(first.recipe, locale) || first.cocktailId;
      return <View key={first.cocktailId} style={styles.drinkCard}>
        {cocktail ? <View style={styles.detailPhoto}><PhotoFrame asset={media[cocktail.id]} accent={cocktail.accent} locale={locale} height={150} preserveAspect borderRadius={12} /></View> : null}
        <Text style={styles.drinkCardTitle}>{title}</Text><CocktailOriginalName recipe={first.recipe} locale={locale} />
        <View style={styles.versionStack}>{items.map((item) => {
          const key = `${list.id}:${item.versionId}`;
          const label = plainVersionLabel(item.versionId, locale);
          const open = expanded === key;
          return <View key={item.versionId} style={styles.versionRow}>
            <Text style={styles.versionLabel}>{label}</Text>
            <View style={styles.actionRow}>
              <Pressable accessibilityRole="button" onPress={() => setExpanded(open ? null : key)} style={styles.quietButton}><Text style={styles.quietButtonText}>{favoriteListText(locale, open ? 'hideSnapshot' : 'readSnapshot')}</Text></Pressable>
              {catalogue.versions.some((version) => version.id === item.versionId) ? <Pressable accessibilityRole="link" onPress={() => router.push({pathname: '/cocktails/[id]', params: {id: item.cocktailId, version: item.versionId, from: 'favorites'}} as never)} style={styles.quietButton}><Text style={styles.quietButtonText}>{favoriteListText(locale, 'viewRecipe')} ↗</Text></Pressable> : null}
            </View>
            {open ? <SavedRecipeReader recipe={item.recipe} locale={locale} unit={unit} listId={list.id} /> : null}
          </View>;
        })}</View>
      </View>;
    })}
    <ManageListModal list={list} locale={locale} visible={manageOpen} onClose={() => setManageOpen(false)} onDeleted={() => {setManageOpen(false); onDeleted();}} />
  </View>;
}

const modalFrame = StyleSheet.create({center: {flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', zIndex: 1, position: 'relative'}});
