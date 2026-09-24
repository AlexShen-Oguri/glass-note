import {CocktailOriginalName} from '../names/OriginalName';
import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Link} from 'expo-router';

import {catalogue} from '../../content/catalogue';
import {contextEvidence} from '../../content/context-evidence';
import type {Locale, SearchQuery} from '../../domain/contracts';
import {diversifyContextResults, rankForContext} from '../../domain/context';
import type {ContextSelection} from '../../domain/context/types';
import {emptyTasteState} from '../../domain/taste/types';
import {cardGrid} from '../../domain/discovery/card-grid';
import {contextText} from '../../i18n/context';
import {media} from '../../media';
import {colors, radii} from '../../theme/tokens';
import {PhotoFrame, serif, useViewport} from '../discovery/components';
import {ContextReasons} from './ContextReasons';
import {ContextSelector} from './ContextSelector';

const cocktailsById = new Map(catalogue.cocktails.map((cocktail) => [cocktail.id, cocktail]));
const versionsById = new Map(catalogue.versions.map((version) => [version.id, version]));

export function ContextPicks({locale, query}: {locale: Locale; query: SearchQuery}) {
  const [selection, setSelection] = useState<ContextSelection>({});
  const [rotation, setRotation] = useState(0);
  const viewport=useViewport();
  const [containerWidth,setContainerWidth]=useState<number|null>(null);
  const grid=cardGrid(containerWidth??Math.max(0,viewport.width-36),230,14);
  const hasSelection = Boolean(selection.occasion || selection.season);
  const ranked = useMemo(() => {
    if (!hasSelection) return [];
    return diversifyContextResults(catalogue, rankForContext(
      catalogue,
      {...query, locale},
      emptyTasteState(),
      selection,
      contextEvidence,
    ), 3);
  }, [hasSelection, locale, query, selection]);
  const highestScore = ranked[0]?.contextScore;
  const topTier = highestScore === undefined ? [] : ranked.filter((result) => result.contextScore === highestScore);
  const topSlots = Math.min(3, topTier.length);
  const results = [
    ...Array.from({length: topSlots}, (_, index) => topTier[(rotation + index) % topTier.length]!),
    ...ranked.filter((result) => result.contextScore !== highestScore).slice(0, 3 - topSlots),
  ];
  const canSwap = topTier.length > topSlots;

  useEffect(() => setRotation(0), [query, selection.occasion, selection.season]);

  return (
    <View style={styles.section}>
      <ContextSelector locale={locale} value={selection} onApply={setSelection} description={contextText(locale, 'picksHint')} />
      {hasSelection ? results.length ? (
        <>
          <View onLayout={event=>setContainerWidth(event.nativeEvent.layout.width)} style={styles.grid}>{results.map((result) => {
            const cocktail = cocktailsById.get(result.cocktailId);
            const version = versionsById.get(result.selectedVersionId);
            if (!cocktail || !version) return null;
            return (
              <View key={result.cocktailId} style={[styles.pick,{width:Math.min(380,grid.cardWidth)}]}>
                <Link href={{pathname: '/cocktails/[id]', params: {id: cocktail.id, version: version.id, from: 'discover'}} as never} asChild>
                  <Pressable accessibilityRole="link" accessibilityLabel={`${cocktail.name[locale]}. ${contextText(locale, 'viewRecipe')}`} style={styles.pickLink}>
                    <PhotoFrame asset={media[cocktail.id]} accent={cocktail.accent} locale={locale} height={148} borderRadius={radii.medium} />
                    <View style={styles.pickCopy}>
                      <Text style={styles.pickName}>{cocktail.name[locale] || cocktail.name.en}</Text><CocktailOriginalName cocktail={cocktail} locale={locale} />
                      <Text style={styles.version}>{version.label[locale] || version.label.en}</Text>
                      <Text style={styles.linkText}>{contextText(locale, 'viewRecipe')}</Text>
                    </View>
                  </Pressable>
                </Link>
                <ContextReasons locale={locale} reasons={result.contextReasons} />
              </View>
            );
          })}</View>
          {canSwap ? <Pressable accessibilityRole="button" onPress={() => setRotation((current) => (current + topSlots) % topTier.length)} style={({pressed}) => [styles.swap, pressed && styles.pressed]}><Text style={styles.swapText}>{contextText(locale, 'swapPicks')}</Text></Pressable> : null}
        </>
      ) : <Text accessibilityLiveRegion="polite" style={styles.empty}>{contextText(locale, 'picksEmpty')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {width: '100%'},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 20},
  pick: {flexGrow: 0, flexShrink:0, minWidth: 0, maxWidth: 380, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, borderRadius: radii.medium, backgroundColor: colors.panel},
  pickLink: {width: '100%'},
  pickCopy: {padding: 14},
  pickName: {color: colors.text, fontFamily: serif, fontSize: 21, lineHeight: 27},
  version: {color: colors.secondary, fontSize: 12, lineHeight: 18, marginTop: 4},
  linkText: {color: colors.accent, fontSize: 13, lineHeight: 19, fontWeight: '700', marginTop: 10},
  swap: {minHeight: 44, alignSelf: 'center', justifyContent: 'center', paddingHorizontal: 18, marginTop: 16, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill},
  swapText: {color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '700'},
  empty: {color: colors.secondary, fontSize: 14, lineHeight: 22, marginTop: 18},
  pressed: {opacity: 0.7},
});
