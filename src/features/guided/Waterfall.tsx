import {CocktailOriginalName} from '../names/OriginalName';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Link, useIsFocused} from 'expo-router';
import {Animated, Easing, Platform, Pressable, StyleSheet, Text, View} from 'react-native';

import {catalogue} from '../../content/catalogue';
import type {Cocktail, Locale} from '../../domain/contracts';
import {waterfallPreview} from '../../domain/guided/waterfall';
import type {UiKey} from '../../i18n/keys';
import {t} from '../../i18n/ui';
import {media} from '../../media';
import {colors, radii} from '../../theme/tokens';
import {isAiMedia, nativeDriver, PhotoFrame, serif, useViewport} from '../discovery/components';
import {WaterfallTrack} from './WaterfallTrack';

export interface WaterfallProps {
  locale: Locale;
  paused: boolean;
  reduceMotion?: boolean;
  visibleCocktailIds?: readonly string[];
  onCocktailPress?: (cocktail: Cocktail) => void;
  decorative?: boolean;
  height?: number;
}

const TILE_HEIGHT = 216;
const TILE_GAP = 12;

function WaterfallTile({
  cocktail,
  locale,
  clone,
  decorative,
  visible,
  paused,
  onPress,
}: {
  cocktail: Cocktail;
  locale: Locale;
  clone: boolean;
  decorative: boolean;
  visible: boolean;
  paused: boolean;
  onPress?: (cocktail: Cocktail) => void;
}) {
  // New reveal trees must paint the full collection once before non-matches leave.
  const opacity = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);
  const previousVisibility = useRef(true);
  useEffect(() => {
    opacity.stopAnimation();
    const changed = previousVisibility.current !== visible;
    previousVisibility.current = visible;
    if (paused) {
      opacity.setValue(visible ? 1 : 0);
      return;
    }
    // Ordinary browsing starts at opacity 1: don't schedule 48 no-op JS fades.
    if (!changed) {
      opacity.setValue(visible ? 1 : 0);
      return;
    }
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 1550,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: nativeDriver,
    }).start();
    return () => opacity.stopAnimation();
  }, [opacity, paused, visible]);

  const hidden = decorative || !visible;
  const inaccessible = hidden || clone;
  const interactive = Boolean(onPress) && !hidden;
  const accessible = interactive && !clone;
  const asset = media[cocktail.id];
  const defaultVersion = catalogue.versions.find((version) => version.id === cocktail.defaultVersionId && version.cocktailId === cocktail.id);
  const linkLabel = defaultVersion
    ? `${cocktail.name[locale]}. ${t(locale, 'viewRecipe')}`
    : `${cocktail.name[locale]}. ${t(locale, 'viewRecipe')}`;
  const pressable = (
    <Pressable
      accessibilityRole={accessible ? 'link' : undefined}
      accessibilityLabel={accessible ? linkLabel : undefined}
      tabIndex={accessible ? 0 : -1}
      disabled={!interactive}
      onPress={interactive && (Platform.OS !== 'web' || clone) ? () => onPress?.(cocktail) : undefined}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={StyleSheet.flatten([styles.tile, pressed && styles.tilePressed])}
    >
      <PhotoFrame
        asset={asset}
        accent={cocktail.accent}
        locale={locale}
        height={142}
        borderRadius={radii.medium}
      />
      <View style={styles.tileCopy}>
        <Text style={styles.tileName} numberOfLines={1}>{cocktail.name[locale]}</Text><CocktailOriginalName cocktail={cocktail} locale={locale} numberOfLines={1} />
        {asset && !isAiMedia(asset) ? (
          <Text style={styles.tileCredit} numberOfLines={1}>
            {isAiMedia(asset) ? t(locale, 'aiImage' as UiKey) : `${asset.author}${asset.license ? ` · ${asset.license}` : ''}`}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
  return (
    <Animated.View
      aria-hidden={inaccessible}
      accessibilityElementsHidden={inaccessible}
      importantForAccessibility={inaccessible ? 'no-hide-descendants' : 'auto'}
      pointerEvents={interactive ? 'auto' : 'none'}
      style={[styles.tileWrap, {opacity}]}
    >
      {accessible && Platform.OS === 'web' ? (
        <Link
          asChild
          href={{
            pathname: '/cocktails/[id]',
            params: {id: cocktail.id, version: cocktail.defaultVersionId, from: 'welcome'},
          } as never}
        >
          {pressable}
        </Link>
      ) : pressable}
    </Animated.View>
  );
}

function MovingColumn({
  cocktails,
  columnIndex,
  locale,
  paused,
  reduceMotion,
  visibleIds,
  decorative,
  onCocktailPress,
}: {
  cocktails: Cocktail[];
  columnIndex: number;
  locale: Locale;
  paused: boolean;
  reduceMotion: boolean;
  visibleIds?: Set<string>;
  decorative: boolean;
  onCocktailPress?: (cocktail: Cocktail) => void;
}) {
  const distance = cocktails.length * (TILE_HEIGHT + TILE_GAP);

  const renderSet = (clone: boolean) => cocktails.map((cocktail) => (
    <WaterfallTile
      key={`${clone ? 'clone' : 'original'}-${cocktail.id}`}
      cocktail={cocktail}
      locale={locale}
      clone={clone}
      decorative={decorative}
      visible={!visibleIds || visibleIds.has(cocktail.id)}
      paused={paused || reduceMotion}
      onPress={onCocktailPress}
    />
  ));

  return (
    <View style={styles.column}>
      <WaterfallTrack {...{columnIndex, distance, paused, reduceMotion}}>
        <View style={styles.trackSet}>{renderSet(false)}</View>
        <View style={styles.trackSet}>{renderSet(true)}</View>
      </WaterfallTrack>
    </View>
  );
}

export default function Waterfall({
  locale,
  paused,
  reduceMotion = false,
  visibleCocktailIds,
  onCocktailPress,
  decorative = false,
  height = 520,
}: WaterfallProps) {
  const isFocused = useIsFocused();
  const {width} = useViewport();
  const columnCount = width >= 920 ? 3 : 2;
  const columns = useMemo(() => {
    const result = Array.from({length: columnCount}, () => [] as Cocktail[]);
    waterfallPreview(catalogue.cocktails, visibleCocktailIds).forEach((cocktail, index) => result[index % columnCount]?.push(cocktail));
    return result;
  }, [columnCount, visibleCocktailIds]);
  const visibleIds = useMemo(
    () => visibleCocktailIds ? new Set(visibleCocktailIds) : undefined,
    [visibleCocktailIds],
  );
  return (
    <View style={styles.frame}>
      <View style={[styles.viewport, {height}]}>
        <View style={styles.columns}>
          {columns.map((cocktails, columnIndex) => (
            <MovingColumn
              key={columnIndex}
              {...{cocktails, columnIndex, locale, reduceMotion, visibleIds, decorative, onCocktailPress}}
              paused={paused || !isFocused}
            />
          ))}
        </View>
        <View pointerEvents="none" style={styles.topVeil} />
        <View pointerEvents="none" style={styles.bottomVeil} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {width: '100%'},
  viewport: {width: '100%', overflow: 'hidden', backgroundColor: colors.background},
  columns: {flex: 1, flexDirection: 'row', gap: 12, transform: [{rotate: '-1.5deg'}], marginHorizontal: -8},
  column: {flex: 1, overflow: 'hidden'},
  trackSet: {gap: TILE_GAP, paddingBottom: TILE_GAP},
  tileWrap: {height: TILE_HEIGHT},
  tile: {height: TILE_HEIGHT, overflow: 'hidden', backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: radii.medium},
  tilePressed: {opacity: 0.74},
  tileCopy: {height: 74, paddingHorizontal: 12, justifyContent: 'center'},
  tileName: {color: colors.text, fontFamily: serif, fontSize: 16},
  tileCredit: {color: colors.muted, fontSize: 11, marginTop: 2},
  topVeil: {position: 'absolute', left: 0, right: 0, top: 0, height: 38, backgroundColor: 'rgba(16,23,20,0.42)'},
  bottomVeil: {position: 'absolute', left: 0, right: 0, bottom: 0, height: 44, backgroundColor: 'rgba(16,23,20,0.48)'},
});
