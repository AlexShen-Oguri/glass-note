import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {router} from 'expo-router';

import type {Locale} from '../../domain/contracts';
import {collectionCountState} from '../../domain/discovery/navigation-state';
import {lib} from '../../i18n/library';
import {nav, pantryCountLabel} from '../../i18n/navigation';
import {colors, radii} from '../../theme/tokens';
import {serif} from '../discovery/components';
import {useFavorites} from '../../platform/FavoritesProvider';
import {favoriteCopy} from '../../i18n/favorites';
import {appNavigationText} from '../../i18n/app-navigation';
import {usePantry} from '../../platform/PantryProvider';
import {ProfessionalLinks} from './ProfessionalLinks';
import {usePrivateRecipes} from '../../platform/PrivateRecipesProvider';
import {privateRecipeText} from '../private-recipes/copy';

export interface LibraryLinksProps {
  locale: Locale;
  pantryCount?: number;
  variant?: 'full' | 'compact';
}

export function LibraryLinks(props: LibraryLinksProps) {
  const favorites = useFavorites();
  const pantry = usePantry();
  const recipes = usePrivateRecipes();
  const copy = favoriteCopy(props.locale);
  const favoriteCount = readableCount(props.locale, favorites.hydrated, favorites.storageAvailable && !favorites.error, favorites.versionIds.length);
  const pantryState = collectionCountState(pantry.hydrated, pantry.storageAvailable && !pantry.error);
  const pantrySummary = pantryState === 'value'
    ? pantryCountLabel(props.locale, pantry.pantry.ingredientIds.length)
    : appNavigationText(props.locale, pantryState === 'loading' ? 'countLoading' : 'countUnavailable');
  return <View>
    <LibraryDestinations {...props} pantrySummary={pantrySummary} />
    <Pressable accessibilityRole="link" accessibilityLabel={copy.title} onPress={() => router.push('/favorites' as never)} style={({pressed}) => [styles.favorites, pressed && styles.pressed]}>
      <Text style={styles.favoriteHeart}>♡</Text><Text style={styles.favoriteTitle}>{copy.title}</Text>
      <Text style={styles.favoriteCount}>{favoriteCount}</Text><Text style={styles.arrow}>↗</Text>
    </Pressable>
    <Pressable accessibilityRole="link" accessibilityLabel={privateRecipeText(props.locale,'title')} onPress={() => router.push('/my-recipes' as never)} style={({pressed}) => [styles.favorites, pressed && styles.pressed]}>
      <Text style={styles.favoriteHeart}>＋</Text><Text style={styles.favoriteTitle}>{privateRecipeText(props.locale,'title')}</Text>
      <Text style={styles.favoriteCount}>{readableCount(props.locale,recipes.hydrated&&recipes.storageAvailable&&!recipes.error,recipes.storageAvailable&&!recipes.error,recipes.recipes.length)}</Text><Text style={styles.arrow}>↗</Text>
    </Pressable>
    <ProfessionalLinks locale={props.locale} variant={props.variant === 'compact' ? 'compact' : 'full'} />
  </View>;
}
function readableCount(locale: Locale, hydrated: boolean, storageAvailable: boolean, count: number) {
  const state = collectionCountState(hydrated, storageAvailable);
  if (state === 'value') return String(count);
  return appNavigationText(locale, state === 'loading' ? 'countLoading' : 'countUnavailable');
}
function LibraryDestinations({locale, variant='full', pantrySummary}: LibraryLinksProps & {pantrySummary: string}) {
  if(variant==='compact') return <View style={styles.compactLinks}>
    {(['library','pantry'] as const).map(kind=><Pressable key={kind} accessibilityRole="link" accessibilityLabel={`${lib(locale,kind)}. ${nav(locale,kind==='library'?'libraryDescription':'pantryDescription')}`} onPress={()=>router.push((kind==='library'?'/ingredients':'/pantry') as never)} style={({pressed})=>[styles.compactCard,kind==='pantry'&&styles.pantryCard,pressed&&styles.pressed]}>
      <View style={styles.compactIcon}><Text style={styles.iconText}>{kind==='library'?'◫':'＋'}</Text></View><View style={styles.copy}><Text style={styles.compactTitle}>{lib(locale,kind)}</Text><Text style={styles.compactNote}>{kind==='library'?nav(locale,'libraryKicker'):pantrySummary}</Text></View>
    </Pressable>)}
  </View>;
  return (
    <View style={styles.links}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${lib(locale, 'library')}. ${nav(locale, 'libraryDescription')}`}
        onPress={() => router.push('/ingredients' as never)}
        style={({pressed}) => [styles.card, pressed && styles.pressed]}
      >
        <View style={styles.icon}><Text style={styles.iconText}>◫</Text></View>
        <View style={styles.copy}>
          <Text style={styles.kicker}>{nav(locale, 'libraryKicker')}</Text>
          <Text style={styles.title}>{lib(locale, 'library')}</Text>
          <Text style={styles.description}>{nav(locale, 'libraryDescription')}</Text>
        </View>
        <Text style={styles.arrow}>↗</Text>
      </Pressable>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${lib(locale, 'pantry')}. ${nav(locale, 'pantryDescription')}`}
        onPress={() => router.push('/pantry' as never)}
        style={({pressed}) => [styles.card, styles.pantryCard, pressed && styles.pressed]}
      >
        <View style={[styles.icon, styles.pantryIcon]}><Text style={styles.iconText}>＋</Text></View>
        <View style={styles.copy}>
          <Text style={styles.kicker}>{nav(locale, 'pantryKicker')}</Text>
          <Text style={styles.title}>{lib(locale, 'pantry')}</Text>
          <Text style={styles.description}>{nav(locale, 'pantryDescription')}</Text>
          <Text style={styles.count}>{pantrySummary}</Text>
        </View>
        <Text style={styles.arrow}>↗</Text>
      </Pressable>
    </View>
  );
}

export default LibraryLinks;

const styles = StyleSheet.create({
  favorites: {minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 12, marginTop: 4},
  favoriteHeart: {color: colors.accent, fontSize: 24}, favoriteTitle: {color: colors.text, fontSize: 14, flex: 1}, favoriteCount: {color: colors.accent, fontSize: 12},
  compactLinks:{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:22},
  compactCard:{flexGrow:1,flexBasis:145,minHeight:84,padding:12,borderWidth:1,borderColor:colors.border,borderRadius:radii.medium,backgroundColor:'rgba(25,35,30,0.88)',flexDirection:'row',alignItems:'center',gap:10},
  compactIcon:{width:28,height:32,alignItems:'center',justifyContent:'center'},
  compactTitle:{fontFamily:serif,color:colors.text,fontSize:17,lineHeight:23},
  compactNote:{fontSize:10,lineHeight:16,color:colors.accent,marginTop:4},
  links: {flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 24},
  card: {
    flexGrow: 1,
    flexBasis: 250,
    minHeight: 154,
    padding: 18,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(25,35,30,0.88)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
  },
  pantryCard: {borderColor: '#4a5b4d', backgroundColor: 'rgba(34,48,40,0.90)'},
  icon: {width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.raised, borderWidth: 1, borderColor: colors.border},
  pantryIcon: {backgroundColor: colors.accentDark, borderColor: colors.accent},
  iconText: {color: colors.accent, fontSize: 18, lineHeight: 22},
  copy: {flex: 1},
  kicker: {color: colors.muted, fontSize: 10, lineHeight: 14, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase'},
  title: {color: colors.text, fontFamily: serif, fontSize: 20, lineHeight: 26, marginTop: 4},
  description: {color: colors.secondary, fontSize: 12, lineHeight: 18, marginTop: 6},
  count: {color: colors.accent, fontSize: 11, lineHeight: 16, marginTop: 9, fontWeight: '700'},
  arrow: {color: colors.accent, fontSize: 19, lineHeight: 24},
  pressed: {opacity: 0.74, transform: [{scale: 0.994}]},
});
