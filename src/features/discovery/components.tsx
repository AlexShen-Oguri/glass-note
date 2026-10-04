import {motionData} from '../motion/attributes';
import {MotionModal, MotionFloat} from '../motion/primitives';
import React, {useEffect, useState, useSyncExternalStore} from 'react';
import {Link} from 'expo-router';
import {
  AccessibilityInfo,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import {LOCALES, type Locale, type MediaAsset, type UnitPreference} from '../../domain/contracts';
import type {UiKey} from '../../i18n/keys';
import {t} from '../../i18n/ui';
import {appNavigationText} from '../../i18n/app-navigation';
import {colors, radii, typography} from '../../theme/tokens';
import {BrandLockup} from '../brand/BrandIdentity';

export const serif = typography.display;
export const nativeDriver = Platform.OS !== 'web';
export function isAiMedia(asset?: MediaAsset) {
  return asset?.origin === 'ai-generated' || asset?.origin === 'ai-styled';
}

const subscribeToClient = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
const serverViewport = {width: 390, height: 844};

export function useViewport() {
  const live = useWindowDimensions();
  // Preserve the static export during hydration, but use real dimensions on every client navigation.
  const client = useSyncExternalStore(subscribeToClient, clientSnapshot, serverSnapshot);
  return client ? live : serverViewport;
}

export function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => active && setReduceMotion(value)).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduceMotion;
}

export function BrandToolbar({
  locale,
  setLocale,
  unit,
  setUnit,
  motionPaused,
  setMotionPaused,
  showUnits = true,
}: {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  unit: UnitPreference;
  setUnit: (unit: UnitPreference) => void;
  motionPaused: boolean;
  setMotionPaused: (paused: boolean) => void;
  showUnits?: boolean;
}) {
  const [languageOpen, setLanguageOpen] = useState(false);
  const reduceMotion = useReduceMotion();
  const {width, height} = useViewport();
  const compact = width < 520;
  return (
    <View {...motionData({nightToolbar: ''})} testID="night-toolbar" style={[styles.toolbar, compact && styles.toolbarCompact, Platform.OS === 'web' && styles.toolbarWeb]}>
      <Link href="/" asChild>
        <Pressable accessibilityRole="link" accessibilityLabel={appNavigationText(locale, 'returnHome')} style={{minHeight: 44, justifyContent: 'center', flexShrink: 0}}>
          <BrandLockup compact={compact} />
        </Pressable>
      </Link>
      <View style={[styles.toolbarActions, compact && styles.toolbarActionsCompact]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(locale, 'language')}
          onPress={() => setLanguageOpen(true)}
          style={({pressed}) => [styles.toolButton, compact && styles.toolButtonCompact, pressed && styles.pressed]}
        >
          <Text style={styles.toolButtonText}>{locale.toUpperCase()}</Text>
        </Pressable>
        {showUnits && <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(locale, 'units')}
          onPress={() => setUnit(unit === 'ml' ? 'oz' : 'ml')}
          style={({pressed}) => [styles.toolButton, compact && styles.toolButtonCompact, pressed && styles.pressed]}
        >
          <Text style={styles.toolButtonText}>{unit === 'ml' ? 'ML' : 'FL OZ'}</Text>
        </Pressable>}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(locale, motionPaused ? 'resume' : 'pause')}
          onPress={() => setMotionPaused(!motionPaused)}
          style={({pressed}) => [styles.toolButton, compact && styles.toolButtonCompact, styles.motionButton, pressed && styles.pressed]}
        >
          <Text style={styles.motionGlyph}>{motionPaused ? '▶' : 'Ⅱ'}</Text>
        </Pressable>
      </View>
      <MotionModal transparent visible={languageOpen} animationType={motionPaused || reduceMotion ? 'none' : 'fade'} onRequestClose={() => setLanguageOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setLanguageOpen(false)}>
          <Pressable {...motionData({motionSurface: ''})} style={styles.languagePanel} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeadingRow}>
              <Text style={styles.modalHeading}>{t(locale, 'language')}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={t(locale, 'close')} onPress={() => setLanguageOpen(false)} style={styles.closeButton}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            <ScrollView style={{maxHeight: Math.min(height * 0.65, 480)}} contentContainerStyle={styles.languageGrid} showsVerticalScrollIndicator={false}>
                {LOCALES.map((choice) => (
                  <Pressable
                    key={choice}
                    accessibilityRole="button"
                    accessibilityState={{selected: choice === locale}}
                    onPress={() => {
                      setLocale(choice);
                      setLanguageOpen(false);
                    }}
                    style={[styles.languageChoice, choice === locale && styles.languageChoiceActive]}
                  >
                    <Text style={[styles.languageCode, choice === locale && styles.languageCodeActive]}>{choice.toUpperCase()}</Text>
                    <Text style={[styles.languageName, choice === locale && styles.languageCodeActive]}>{languageNames[choice]}</Text>
                  </Pressable>
                ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </MotionModal>
    </View>
  );
}

const languageNames: Record<Locale, string> = {
  en: 'English', zh: '中文', fr: 'Français', de: 'Deutsch', es: 'Español', ko: '한국어', ja: '日本語', it: 'Italiano',
};

export function PhotoFrame({
  asset,
  accent,
  locale,
  height,
  borderRadius = radii.small,
  showIllustrationLabel = false,
  preserveAspect = false,
}: {
  asset?: MediaAsset;
  accent: string;
  locale: Locale;
  height: number;
  borderRadius?: number;
  showIllustrationLabel?: boolean;
  preserveAspect?: boolean;
}) {
  const imageAccessibilityLabel = isAiMedia(asset)
    ? t(locale, 'aiImage' as UiKey)
    : t(locale, asset?.kind === 'drink-illustration' ? 'photoIllustration' : 'photograph');
  return (
    <View style={[styles.photoFrame, {height: preserveAspect ? undefined : height, aspectRatio: preserveAspect ? 4 / 3 : undefined, borderRadius, backgroundColor: accent}]}>
      {asset ? (
        <Image source={{uri: height <= 300 ? asset.thumbnailUri ?? asset.uri : asset.uri}} resizeMode="cover" style={StyleSheet.absoluteFill} accessibilityLabel={imageAccessibilityLabel} />
      ) : (
        <View style={styles.photoPending}>
          <View style={styles.photoRule} />
          <Text style={styles.photoPendingEyebrow}>GLASS NOTES</Text>
          <Text style={styles.photoPendingText}>{t(locale, 'photoPending')}</Text>
        </View>
      )}
      {showIllustrationLabel && !isAiMedia(asset) && asset?.kind === 'drink-illustration' ? (
        <View style={styles.illustrationLabel}><Text style={styles.illustrationText}>{t(locale, 'photoIllustration')}</Text></View>
      ) : null}
    </View>
  );
}

export function FloatingColumn({
  children,
  index,
  paused,
  reduceMotion,
}: {
  children: React.ReactNode;
  index: number;
  paused: boolean;
  reduceMotion: boolean;
}) {
  return <MotionFloat {...{index, paused, reduceMotion}} style={styles.ambientColumn}>{children}</MotionFloat>;
}

export function SelectionChip({label, selected, onPress}: {label: string; selected: boolean; onPress: () => void}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{selected}}
      aria-pressed={selected}
      onPress={onPress}
      style={({pressed}) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
      {selected && <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.chipMark}/>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toolbar: {minHeight: 92, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 22},
  toolbarWeb: {position: 'sticky' as never, top: 0, zIndex: 12, backgroundColor: colors.background},
  toolbarCompact: {minHeight: 78, gap: 8},
  toolbarActions: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10},
  toolbarActionsCompact: {gap: 7},
  toolButton: {height: 44, width: 44, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center'},
  toolButtonCompact: {width: 44},
  toolButtonText: {color: colors.secondary, fontSize: 11, fontWeight: '500', letterSpacing: 0.5},
  motionButton: {flexDirection: 'row'},
  motionGlyph: {color: colors.accent, fontSize: 13},
  pressed: {opacity: 0.68},
  modalBackdrop: {flex: 1, backgroundColor: 'rgba(4,8,6,0.72)', justifyContent: 'center', alignItems: 'center', padding: 22},
  languagePanel: {width: '100%', maxWidth: 480, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: radii.small, padding: 28},
  modalHeadingRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18},
  modalHeading: {color: colors.text, fontFamily: serif, fontSize: 34, fontWeight: '400'},
  closeButton: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
  closeText: {color: colors.secondary, fontSize: 28, fontWeight: '300'},
  languageGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  languageChoice: {width: '48%', minHeight: 68, borderRadius: radii.small, borderWidth: 1, borderColor: colors.border, padding: 14, justifyContent: 'center'},
  languageChoiceActive: {backgroundColor: colors.accent, borderColor: colors.accent},
  languageCode: {fontSize: 12, color: colors.muted, fontWeight: '800', letterSpacing: 1},
  languageName: {color: colors.text, fontSize: 15, marginTop: 4},
  languageCodeActive: {color: colors.background},
  photoFrame: {overflow: 'hidden', width: '100%', borderWidth: 1, borderColor: colors.border},
  photoPending: {flex: 1, padding: 22, justifyContent: 'flex-end', backgroundColor: 'rgba(16,23,20,0.30)'},
  photoRule: {height: 1, width: 38, backgroundColor: 'rgba(243,240,232,0.65)', marginBottom: 12},
  photoPendingEyebrow: {color: 'rgba(243,240,232,0.62)', fontSize: 12, letterSpacing: 1.5, fontWeight: '800'},
  photoPendingText: {color: colors.text, fontFamily: serif, fontSize: 17, marginTop: 4},
  illustrationLabel: {position: 'absolute', left: 10, right: 10, bottom: 10, backgroundColor: 'rgba(16,23,20,0.78)', paddingHorizontal: 9, paddingVertical: 6, borderRadius: radii.small},
  illustrationText: {color: colors.secondary, fontSize: 12, lineHeight: 17},
  ambientColumn: {flex: 1, gap: 24},
  chip: {minHeight: 44, paddingVertical: 11, paddingHorizontal: 15, borderRadius: radii.small, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10},
  chipSelected: {backgroundColor: colors.accentDark, borderColor: colors.accent},
  chipText: {color: colors.secondary, fontSize: 14, lineHeight: 21, fontWeight: '400', flexShrink: 1},
  chipTextSelected: {color: colors.text},
  chipMark: {width: 5, height: 5, borderRadius: 3, backgroundColor: colors.amber},
});
