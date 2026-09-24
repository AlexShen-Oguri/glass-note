import {recipeDisplayName} from '../../content/localization/display';
import {CocktailOriginalName} from '../names/OriginalName';
import {plainVersionLabel} from '../recipe/versionLabel';
import React, {useEffect, useMemo, useState} from 'react';
import {Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {FavoriteList, FavoriteListMutationResult} from '../../domain/favorites';
import type {Locale} from '../../domain/contracts';
import {catalogue} from '../../content/catalogue';
import {matchVersion} from '../../domain/search';
import {favoriteCopy} from '../../i18n/favorites';
import {favoriteListText} from '../../i18n/favorite-lists';
import {persistenceText} from '../../i18n/local-persistence';
import {t} from '../../i18n/ui';
import {media} from '../../media';
import {useApp} from '../../platform/AppProvider';
import {useFavorites} from '../../platform/FavoritesProvider';
import {colors, radii} from '../../theme/tokens';
import {BrandToolbar, PhotoFrame, serif} from '../discovery/components';
import {useMotionEnabled} from '../motion';
import {FavoriteButton} from './FavoriteButton';
import {FavoriteListDetail} from './FavoriteListDetail';
import {favoriteStyles as styles} from './favoritesStyles';
import {countDrinks, createStableListId, isSuccessfulMutation, mutationMessage, nowIso} from './favoriteListHelpers';

function localize(value: Record<Locale, string> | undefined, locale: Locale): string {
  return value?.[locale] || value?.en || '';
}

type FavoritesApi = ReturnType<typeof useFavorites>;

function CreateListModal({locale, visible, favorites, onClose, onCreated}: {locale: Locale; visible: boolean; favorites: FavoritesApi; onClose: () => void; onCreated: (id: string) => void}) {
  const {hydrated, error, saving} = favorites;
  const [name, setName] = useState(favoriteListText(locale, 'defaultListName'));
  const [pending, setPending] = useState<{id: string; name: string; now: string} | null>(null);
  const [busy, setBusy] = useState(false);
  const [failedWrite, setFailedWrite] = useState(false);
  const [feedback, setFeedback] = useState<{kind: 'success' | 'error'; text: string} | null>(null);
  const motionEnabled = useMotionEnabled();
  const readBlocked = !hydrated || error === 'read';
  useEffect(() => {
    if (visible && !pending && !busy) setName(favoriteListText(locale, 'defaultListName'));
  }, [busy, locale, pending, visible]);
  const close = () => {
    if (!busy) onClose();
  };
  const create = async () => {
    if (busy || readBlocked || saving) return;
    const payload = pending ?? {id: createStableListId(), name: name.trim(), now: nowIso()};
    if (!payload.name) return;
    setPending(payload);
    setBusy(true);
    setFeedback(null);
    setFailedWrite(false);
    const result = await favorites.createList(payload);
    if (isSuccessfulMutation(result)) {
      setFeedback({kind: 'success', text: favoriteListText(locale, 'listCreated')});
      setPending(null);
      setFailedWrite(false);
      onCreated(result.listId ?? payload.id);
      onClose();
    } else {
      setFeedback({kind: 'error', text: mutationMessage(locale, result)});
      setFailedWrite(result.status === 'write-failed');
    }
    setBusy(false);
  };
  const retryPendingWrite = async () => {
    if (!pending || busy || readBlocked || saving || !failedWrite) return;
    setBusy(true);
    const ok = await favorites.retry();
    if (ok) {
      setFeedback({kind: 'success', text: favoriteListText(locale, 'listCreated')});
      setFailedWrite(false);
      onCreated(pending.id);
      setPending(null);
      onClose();
    } else setFeedback({kind: 'error', text: favoriteListText(locale, 'saveFailed')});
    setBusy(false);
  };
  return <Modal visible={visible} transparent animationType={motionEnabled ? 'fade' : 'none'} onRequestClose={close}>
    <View style={styles.modalBackdrop}>
      <KeyboardAvoidingView pointerEvents="box-none" style={modalFrame.center} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View accessibilityViewIsModal style={[styles.modalPanel, {zIndex: 1}]}>
          <View style={styles.modalHeadingRow}>
            <Text style={styles.modalHeading}>{favoriteListText(locale, 'newList')}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={favoriteListText(locale, 'close')} onPress={close} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable>
          </View>
          {readBlocked ? <View style={styles.alertPanel}><Text style={styles.alertTitle}>{error === 'read' ? favoriteListText(locale, 'readFailed') : favoriteCopy(locale).loading}</Text><Text style={styles.alertText}>{error === 'read' ? favoriteListText(locale, 'readFailed') : favoriteListText(locale, 'emptyListsHint')}</Text>{error === 'read' ? <Pressable accessibilityRole="button" disabled={busy} onPress={() => void favorites.retry()} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{favoriteListText(locale, 'retry')}</Text></Pressable> : null}</View> : <>
            <Text style={styles.fieldLabel}>{favoriteListText(locale, 'nameLabel')}</Text>
            <TextInput accessibilityLabel={favoriteListText(locale, 'nameLabel')} value={pending?.name ?? name} onChangeText={setName} editable={!pending && !busy && !saving} placeholder={favoriteListText(locale, 'namePlaceholder')} placeholderTextColor={colors.muted} maxLength={100} autoFocus style={styles.nameInput} />
            {failedWrite ? <Text style={styles.modalHint}>{favoriteListText(locale, 'saveFailed')}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable accessibilityRole="button" disabled={!((pending?.name ?? name).trim()) || busy || saving} onPress={failedWrite ? () => void retryPendingWrite() : () => void create()} style={[styles.primaryButton, (!((pending?.name ?? name).trim()) || busy || saving) && {opacity: 0.5}]}><Text style={styles.primaryButtonText}>{busy || saving ? favoriteListText(locale, 'saving') : pending ? favoriteListText(locale, 'retry') : favoriteListText(locale, 'createList')}</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={busy} onPress={close} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{favoriteListText(locale, 'cancel')}</Text></Pressable>
            </View>
            {feedback ? <Text accessibilityRole={feedback.kind === 'error' ? 'alert' : 'text'} style={feedback.kind === 'error' ? styles.errorText : styles.statusText}>{feedback.text}</Text> : null}
          </>}
        </View>
      </KeyboardAvoidingView>
      <Pressable accessible={false} focusable={false} accessibilityElementsHidden importantForAccessibility="no" tabIndex={-1} onPress={close} style={[StyleSheet.absoluteFill, {zIndex: 0}]} />
    </View>
  </Modal>;
}

export default function FavoritesScreen() {
  const app = useApp();
  const {locale, unit} = app;
  const favorites = useFavorites();
  const {versionIds, unknownVersionIds, lists, hydrated, storageAvailable, error, retry, saving} = favorites;
  const params = useLocalSearchParams<{listId?: string | string[]; tab?: string}>();
  const selectedListId = (Array.isArray(params.listId) ? params.listId[0] : params.listId) || null;
  const tab = selectedListId || params.tab === 'lists' ? 'lists' : 'favorites';
  const setTab = (value: 'favorites' | 'lists') => router.setParams({tab: value});
  const setSelectedListId = (value: string | null) => router.setParams({listId: value ?? ''});
  const [selectedListCache, setSelectedListCache] = useState<FavoriteList | null>(null);
  const [text, setText] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const copy = favoriteCopy(locale);
  const selectedList = selectedListId ? lists.find((list) => list.id === selectedListId) ?? (selectedListCache?.id === selectedListId ? selectedListCache : undefined) : undefined;
  useEffect(() => {
    if (!selectedListId) return;
    const liveList = lists.find((list) => list.id === selectedListId);
    if (liveList) setSelectedListCache(liveList);
  }, [lists, selectedListId]);

  const favoriteGroups = useMemo(() => {
    const byCocktail = new Map<string, {cocktail: (typeof catalogue.cocktails)[number]; versions: (typeof catalogue.versions)[number][]}>();
    for (const id of versionIds) {
      const version = catalogue.versions.find((item) => item.id === id);
      const cocktail = version ? catalogue.cocktails.find((item) => item.id === version.cocktailId) : undefined;
      if (!version || !cocktail || !matchVersion(catalogue, version, {text, locale})) continue;
      const group = byCocktail.get(cocktail.id);
      if (group) group.versions.push(version);
      else byCocktail.set(cocktail.id, {cocktail, versions: [version]});
    }
    return [...byCocktail.values()];
  }, [locale, text, versionIds]);

  const retryStorage = async () => {
    if (retrying) return;
    setRetrying(true);
    await retry();
    setRetrying(false);
  };

  const selectList = (id: string) => {
    router.setParams({tab: 'lists', listId: id});
    setSelectedListCache(lists.find((list) => list.id === id) ?? null);
  };

  return <SafeAreaView style={screenStyles.screen} edges={['top']}>
    <ScrollView contentContainerStyle={screenStyles.page} keyboardShouldPersistTaps="handled">
      <View style={screenStyles.shell}>
        <BrandToolbar {...app} />
        <Pressable accessibilityRole="link" onPress={() => router.replace('/discover' as never)} style={screenStyles.back}><Text style={screenStyles.link}>← {copy.browse}</Text></Pressable>
        <View style={screenStyles.heading}>
          <Text style={screenStyles.eyebrow}>{copy.local}</Text>
          <Text style={screenStyles.title}>{copy.title}</Text>
          <Text style={screenStyles.subtitle}>{tab === 'lists' ? favoriteListText(locale, 'listIntro') : copy.subtitle}</Text>
        </View>
        <View accessibilityRole="tablist" style={styles.tabs}>
          <Pressable accessibilityRole="tab" accessibilityState={{selected: tab === 'favorites'}} onPress={() => {router.setParams({tab: 'favorites', listId: ''}); setSelectedListCache(null);}} style={[styles.tab, tab === 'favorites' && styles.tabActive]}><Text style={[styles.tabText, tab === 'favorites' && styles.tabTextActive]}>{favoriteListText(locale, 'favoritesTab')} {hydrated ? `(${versionIds.length + unknownVersionIds.length})` : ''}</Text></Pressable>
          <Pressable accessibilityRole="tab" accessibilityState={{selected: tab === 'lists'}} onPress={() => setTab('lists')} style={[styles.tab, tab === 'lists' && styles.tabActive]}><Text style={[styles.tabText, tab === 'lists' && styles.tabTextActive]}>{favoriteListText(locale, 'listsTab')} {hydrated ? `(${lists.length})` : ''}</Text></Pressable>
        </View>
        {!storageAvailable && <View accessibilityRole="alert" style={styles.alertPanel}>
          <Text style={styles.alertTitle}>{persistenceText(locale, error === 'read' ? 'readTitle' : 'writeTitle')}</Text>
          <Text style={styles.alertText}>{persistenceText(locale, error === 'read' ? 'favoritesRead' : 'favoritesWrite')}</Text>
          <Pressable accessibilityRole="button" disabled={retrying} onPress={() => void retryStorage()} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{retrying ? favoriteListText(locale, 'saving') : favoriteListText(locale, 'retry')}</Text></Pressable>
        </View>}
        {!hydrated ? <Text style={screenStyles.subtitle}>{copy.loading}</Text> : tab === 'favorites' ? <View>
          {unknownVersionIds.length ? <View accessibilityRole="alert" style={styles.alertPanel}><Text style={styles.alertTitle}>{favoriteListText(locale, 'oldFavorites')} ({unknownVersionIds.length})</Text><Text style={styles.alertText}>{favoriteListText(locale, 'oldFavoritesDetail')}</Text></View> : null}
          <TextInput accessibilityLabel={copy.search} placeholder={copy.search} placeholderTextColor={colors.muted} value={text} onChangeText={setText} autoCorrect={false} autoCapitalize="none" style={styles.search} />
          {!favoriteGroups.length && versionIds.length === 0 && unknownVersionIds.length === 0 ? <View style={styles.emptyPanel}><Text style={styles.emptyTitle}>{copy.empty}</Text><Text style={styles.emptyHint}>{copy.emptyHint}</Text><Pressable accessibilityRole="link" onPress={() => router.push('/discover' as never)} style={[styles.primaryButton, {alignSelf: 'flex-start', marginTop: 18}]}><Text style={styles.primaryButtonText}>{copy.browse} ↗</Text></Pressable></View> : null}
          {!favoriteGroups.length && (versionIds.length > 0 || unknownVersionIds.length > 0) ? <Text style={styles.emptyHint}>{copy.noMatch}</Text> : null}
          <View style={screenStyles.favoriteStack}>{favoriteGroups.map(({cocktail, versions}) => <View key={cocktail.id} style={screenStyles.favoriteCard}>
            <View style={screenStyles.favoriteHeader}>
              <View style={screenStyles.favoritePhoto}><PhotoFrame asset={media[cocktail.id]} accent={cocktail.accent} locale={locale} height={120} preserveAspect borderRadius={12} /></View>
              <View style={screenStyles.favoriteCopy}><Text style={screenStyles.cardTitle}>{localize(cocktail.name, locale)}</Text><CocktailOriginalName cocktail={cocktail} locale={locale} /><Text style={screenStyles.cardMeta}>{versions.length} {favoriteListText(locale, 'versionCount')}</Text></View>
            </View>
            <View style={screenStyles.versionStack}>{versions.map((version) => <View key={version.id} style={screenStyles.versionRow}>
              <View style={screenStyles.versionText}><Text style={screenStyles.versionTitle}>{plainVersionLabel(version.id, locale)}</Text></View>
              <View style={screenStyles.versionActions}><Pressable accessibilityRole="link" accessibilityLabel={`${localize(cocktail.name, locale)}. ${plainVersionLabel(version.id, locale)}. ${t(locale, 'viewRecipe')}`} onPress={() => router.push({pathname: '/cocktails/[id]', params: {id: cocktail.id, version: version.id, from: 'favorites'}} as never)} style={styles.quietButton}><Text style={styles.quietButtonText}>{t(locale, 'viewRecipe')} ↗</Text></Pressable><FavoriteButton versionId={version.id} locale={locale} compact /></View>
            </View>)}</View>
          </View>)}</View>
        </View> : selectedList ? <FavoriteListDetail list={selectedList} locale={locale} unit={unit} onBack={() => {setSelectedListId(null); setSelectedListCache(null);}} onDeleted={() => {setSelectedListId(null); setSelectedListCache(null);}} /> : <View>
          <View style={styles.toolbarRow}><View style={{flex: 1}} /><Pressable accessibilityRole="button" onPress={() => setCreateOpen(true)} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{favoriteListText(locale, 'newList')}</Text></Pressable></View>
          {!lists.length ? <View style={styles.emptyPanel}><Text style={styles.emptyTitle}>{favoriteListText(locale, 'emptyLists')}</Text><Text style={styles.emptyHint}>{favoriteListText(locale, 'emptyListsHint')}</Text></View> : <View style={styles.listStack}>{lists.map((list) => <Pressable key={list.id} accessibilityRole="button" onPress={() => selectList(list.id)} style={({pressed}) => [styles.listCard, pressed && styles.listCardPress]}><View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:12}}>{[...new Map(list.items.map(item=>[item.cocktailId,item])).values()].slice(0,4).map(item=>{const asset=media[item.cocktailId];return asset?<Image key={item.cocktailId} source={{uri:asset.thumbnailUri??asset.uri}} accessibilityLabel={recipeDisplayName(item.recipe,locale)} style={{width:52,height:64,borderRadius:10}}/>:null;})}</View><Text style={styles.listName}>{list.name}</Text><Text style={styles.listMeta}>{countDrinks(list)} {favoriteListText(locale, 'drinkCount')} · {list.items.length} {favoriteListText(locale, 'versionCount')}</Text><Text style={styles.listArrow}>→</Text></Pressable>)}</View>}
        </View>}
      </View>
    </ScrollView>
    <CreateListModal locale={locale} visible={createOpen} favorites={favorites} onClose={() => setCreateOpen(false)} onCreated={selectList} />
  </SafeAreaView>;
}

const screenStyles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: 'transparent'}, page: {minHeight: '100%', paddingHorizontal: 18, paddingBottom: 70}, shell: {width: '100%', maxWidth: 1080, alignSelf: 'center'}, back: {minHeight: 44, justifyContent: 'center'}, link: {color: colors.accent, fontSize: 13}, heading: {paddingTop: 32, paddingBottom: 26}, eyebrow: {color: colors.accent, fontSize: 12}, title: {fontFamily: serif, fontSize: 38, lineHeight: 48, color: colors.text, marginTop: 12}, subtitle: {color: colors.secondary, fontSize: 15, lineHeight: 23, marginTop: 8}, favoriteStack: {gap: 12}, favoriteCard: {borderWidth: 1, borderColor: colors.border, borderRadius: radii.medium, backgroundColor: colors.panel, padding: 12, gap: 10}, favoriteHeader: {flexDirection: 'row', gap: 14, alignItems: 'center'}, favoritePhoto: {width: 154, maxWidth: '32%'}, favoriteCopy: {flex: 1, gap: 7}, cardTitle: {fontFamily: serif, color: colors.text, fontSize: 23, lineHeight: 29}, cardMeta: {color: colors.muted, fontSize: 12}, versionStack: {gap: 0}, versionRow: {borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 9, paddingBottom: 2, flexDirection: 'row', alignItems: 'center', gap: 8}, versionText: {flex: 1, minWidth: 0}, versionTitle: {color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '700'}, source: {color: colors.secondary, fontSize: 12, lineHeight: 18, marginTop: 3}, versionActions: {flexDirection: 'row', alignItems: 'center', gap: 4},
});

const modalFrame = StyleSheet.create({center: {flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', zIndex: 1, position: 'relative'}});
