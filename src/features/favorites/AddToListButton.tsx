import React, {useMemo, useState} from 'react';
import {KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import type {Locale} from '../../domain/contracts';
import {catalogue} from '../../content/catalogue';
import {favoriteCopy} from '../../i18n/favorites';
import {favoriteListText} from '../../i18n/favorite-lists';
import {useFavorites} from '../../platform/FavoritesProvider';
import {colors} from '../../theme/tokens';
import {useMotionEnabled} from '../motion';
import {favoriteStyles as styles} from './favoritesStyles';
import {createStableListId, isSuccessfulMutation, mutationMessage, nowIso} from './favoriteListHelpers';

function localize(value: Record<Locale, string> | undefined, locale: Locale): string {
  return value?.[locale] || value?.en || '';
}

function ModalFrame({visible, motionEnabled, onClose, children}: {visible: boolean; motionEnabled: boolean; onClose: () => void; children: React.ReactNode}) {
  return <Modal visible={visible} transparent animationType={motionEnabled ? 'fade' : 'none'} onRequestClose={onClose}>
    <View style={styles.modalBackdrop}>
      <KeyboardAvoidingView pointerEvents="box-none" style={frameStyles.center} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View accessibilityViewIsModal style={[styles.modalPanel, {zIndex: 1}]}>{children}</View>
      </KeyboardAvoidingView>
      <Pressable accessible={false} focusable={false} accessibilityElementsHidden importantForAccessibility="no" tabIndex={-1} onPress={onClose} style={[StyleSheet.absoluteFill, {zIndex: 0}]} />
    </View>
  </Modal>;
}

export function AddToListButton({versionId, locale}: {versionId: string; locale: Locale}) {
  const favorites = useFavorites();
  const {lists, saving, hydrated, error} = favorites;
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [pendingCreate, setPendingCreate] = useState<{id: string; name: string; now: string; versionId: string} | null>(null);
  const [pendingAdd, setPendingAdd] = useState<{listId: string; versionId: string; now: string} | null>(null);
  const [busy, setBusy] = useState(false);
  const [retryingRead, setRetryingRead] = useState(false);
  const [failedWrite, setFailedWrite] = useState<'add' | 'create' | null>(null);
  const [feedback, setFeedback] = useState<{kind: 'success' | 'error'; text: string} | null>(null);
  const motionEnabled = useMotionEnabled();
  const sourceVersion = useMemo(() => catalogue.versions.find((item) => item.id === versionId), [versionId]);
  const cocktail = useMemo(() => sourceVersion ? catalogue.cocktails.find((item) => item.id === sourceVersion.cocktailId) : undefined, [sourceVersion]);
  const displayName = localize(cocktail?.name, locale) || versionId;
  const versionLabel = localize(sourceVersion?.label, locale) || versionId;
  const readBlocked = !hydrated || error === 'read';
  const mutationBlocked = readBlocked || Boolean(saving);

  const handleClose = () => {
    if (busy || retryingRead) return;
    setOpen(false);
  };

  const openPicker = () => {
    setOpen(true);
    if (pendingCreate) {
      setCreateOpen(true);
      setName(pendingCreate.name);
    }
  };

  const retryRead = async () => {
    if (retryingRead) return;
    setRetryingRead(true);
    const ok = await favorites.retry();
    if (!ok) setFeedback({kind: 'error', text: favoriteListText(locale, 'readFailed')});
    setRetryingRead(false);
  };

  const performAdd = async (payload: {listId: string; versionId: string; now: string}) => {
    if (busy || mutationBlocked) return;
    setBusy(true);
    setFeedback(null);
    setPendingAdd(payload);
    setFailedWrite(null);
    const result = await favorites.addToList(payload.listId, payload.versionId, payload.now);
    if (isSuccessfulMutation(result)) {
      setFeedback({kind: 'success', text: result.status === 'duplicate' ? favoriteListText(locale, 'alreadyAdded') : favoriteListText(locale, 'added')});
      setPendingAdd(null);
      setFailedWrite(null);
    } else {
      setFeedback({kind: 'error', text: mutationMessage(locale, result)});
      setFailedWrite(result.status === 'write-failed' ? 'add' : null);
    }
    setBusy(false);
  };

  const addToList = (listId: string) => void performAdd(pendingAdd && pendingAdd.listId === listId ? pendingAdd : {listId, versionId, now: nowIso()});

  const performCreate = async (payload: {id: string; name: string; now: string; versionId: string}) => {
    if (busy || mutationBlocked) return;
    setBusy(true);
    setFeedback(null);
    setPendingCreate(payload);
    setFailedWrite(null);
    const result = await favorites.createList(payload);
    if (isSuccessfulMutation(result)) {
      setFeedback({kind: 'success', text: result.status === 'duplicate' ? favoriteListText(locale, 'duplicate') : favoriteListText(locale, 'added')});
      setPendingCreate(null);
      setFailedWrite(null);
      setCreateOpen(false);
    } else {
      setFeedback({kind: 'error', text: mutationMessage(locale, result)});
      setFailedWrite(result.status === 'write-failed' ? 'create' : null);
    }
    setBusy(false);
  };

  const createAndAdd = () => {
    if (pendingCreate) return void performCreate(pendingCreate);
    const cleanName = name.trim();
    if (!cleanName) return;
    void performCreate({id: createStableListId(), name: cleanName, now: nowIso(), versionId});
  };

  const retryPendingWrite = async () => {
    if (!failedWrite || busy || mutationBlocked) return;
    setBusy(true);
    const ok = await favorites.retry();
    if (ok) {
      setFeedback({kind: 'success', text: failedWrite === 'create' ? favoriteListText(locale, 'listCreated') : favoriteListText(locale, 'added')});
      if (failedWrite === 'create') {
        setPendingCreate(null);
        setCreateOpen(false);
      } else setPendingAdd(null);
      setFailedWrite(null);
    } else setFeedback({kind: 'error', text: favoriteListText(locale, 'saveFailed')});
    setBusy(false);
  };

  if (!sourceVersion) return null;
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={favoriteListText(locale, 'addToList')} onPress={openPicker} style={({pressed}) => [styles.secondaryButton, pressed && {opacity: 0.68}]}>
      <Text style={styles.secondaryButtonText}>{favoriteListText(locale, 'addToList')}</Text>
    </Pressable>
    <ModalFrame visible={open} motionEnabled={motionEnabled} onClose={handleClose}>
      <View style={styles.modalHeadingRow}>
        <View style={{flex: 1, gap: 4}}>
          <Text style={styles.modalHeading}>{favoriteListText(locale, 'chooseList')}</Text>
          <Text style={styles.modalHint}>{displayName}</Text>
          <Text style={styles.listMeta}>{favoriteListText(locale, 'listVersion')}: {versionLabel}</Text>
          <Text style={styles.modalHint}>{favoriteListText(locale, 'sourceVersionHint')}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={favoriteListText(locale, 'close')} onPress={handleClose} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable>
      </View>
      <ScrollView style={styles.modalScroll} contentContainerStyle={{gap: 9}} keyboardShouldPersistTaps="handled">
        {readBlocked ? <View style={styles.alertPanel}>
          <Text style={styles.alertTitle}>{error === 'read' ? favoriteListText(locale, 'readFailed') : favoriteCopy(locale).loading}</Text>
          {error === 'read' ? <><Text style={styles.alertText}>{favoriteListText(locale, 'readFailed')}</Text><Pressable accessibilityRole="button" disabled={retryingRead} onPress={() => void retryRead()} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{retryingRead ? favoriteListText(locale, 'saving') : favoriteListText(locale, 'retry')}</Text></Pressable></> : null}
        </View> : null}
        {!readBlocked && lists.length ? lists.map((list) => <Pressable key={list.id} accessibilityRole="button" disabled={busy || mutationBlocked || Boolean(pendingCreate)} onPress={() => addToList(list.id)} style={({pressed}) => [styles.catalogueGroup, pressed && {opacity: 0.68}]}>
          <Text style={styles.catalogueName}>{list.name}</Text>
          <Text style={styles.listMeta}>{new Set(list.items.map((item) => item.cocktailId)).size} {favoriteListText(locale, 'drinkCount')} · {list.items.length} {favoriteListText(locale, 'versionCount')}</Text>
        </Pressable>) : null}
        {!readBlocked && !createOpen ? <Pressable accessibilityRole="button" disabled={mutationBlocked || Boolean(pendingAdd)} onPress={() => {setCreateOpen(true); setName(pendingCreate?.name ?? favoriteListText(locale, 'defaultListName')); setFeedback(null);}} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>{pendingCreate ? favoriteListText(locale, 'retry') : favoriteListText(locale, 'newList')}</Text>
        </Pressable> : null}
        {!readBlocked && createOpen ? <View style={{gap: 8}}>
          <Text style={styles.fieldLabel}>{favoriteListText(locale, 'nameLabel')}</Text>
          <TextInput accessibilityLabel={favoriteListText(locale, 'nameLabel')} value={pendingCreate?.name ?? name} onChangeText={setName} editable={!pendingCreate && !busy && !saving} placeholder={favoriteListText(locale, 'namePlaceholder')} placeholderTextColor={colors.muted} maxLength={100} autoFocus style={styles.nameInput} />
          {failedWrite === 'create' ? <Text style={styles.modalHint}>{favoriteListText(locale, 'saveFailed')}</Text> : null}
          <View style={styles.modalActions}>
            <Pressable accessibilityRole="button" disabled={!((pendingCreate?.name ?? name).trim()) || busy || mutationBlocked} onPress={failedWrite === 'create' ? () => void retryPendingWrite() : createAndAdd} style={[styles.primaryButton, (!((pendingCreate?.name ?? name).trim()) || busy || mutationBlocked) && {opacity: 0.5}]}>
              <Text style={styles.primaryButtonText}>{busy || saving ? favoriteListText(locale, 'saving') : pendingCreate ? favoriteListText(locale, 'retry') : favoriteListText(locale, 'createList')}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => setCreateOpen(false)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{favoriteListText(locale, 'cancel')}</Text></Pressable>
          </View>
        </View> : null}
        {pendingAdd && failedWrite === 'add' ? <Pressable accessibilityRole="button" disabled={busy || mutationBlocked} onPress={() => void retryPendingWrite()} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{favoriteListText(locale, 'retry')}</Text></Pressable> : null}
        {feedback ? <Text accessibilityRole={feedback.kind === 'error' ? 'alert' : 'text'} style={feedback.kind === 'error' ? styles.errorText : styles.statusText}>{feedback.text}</Text> : null}
      </ScrollView>
    </ModalFrame>
  </>;
}

const frameStyles = StyleSheet.create({center: {flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', zIndex: 1, position: 'relative'}});
