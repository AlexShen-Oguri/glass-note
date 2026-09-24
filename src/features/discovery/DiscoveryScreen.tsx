import {CocktailOriginalName} from '../names/OriginalName';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {Link, useFocusEffect, useLocalSearchParams} from 'expo-router';
import {ListBrowseAddButton, ListBrowseSelection} from '../favorites/ListBrowseSelection';
import {SafeAreaView} from 'react-native-safe-area-context';

import {ingredientTaxonomy} from '../../content/ingredients';
import {Fold} from '../workspace/ui';
import {catalogue} from '../../content/catalogue';
import type {Cocktail, Locale, SearchQuery, SearchResult} from '../../domain/contracts';
import {createDiscoveryRows, getDiscoveryColumnCount} from '../../domain/discovery/layout';
import {
  type DiscoveryPaginationState,
  discoveryQueryFingerprint,
  hasDiscoveryFilters,
  loadMoreDiscoveryPage,
  paginationForQuery,
} from '../../domain/discovery/pagination';
import {searchCocktails} from '../../domain/search';
import {t} from '../../i18n/ui';
import type {UiKey} from '../../i18n/keys';
import {media} from '../../media';
import {useApp} from '../../platform/AppProvider';
import {colors, radii} from '../../theme/tokens';
import {BrandToolbar, PhotoFrame, nativeDriver, serif, useReduceMotion, useViewport} from './components';
import FilterSheet from './FilterSheet';
import {FavoriteButton} from '../favorites/FavoriteButton';
import {favoriteCopy} from '../../i18n/favorites';
import {SelectionChip} from './components';
import {lib} from '../../i18n/library';
import {BrandMark} from '../brand/BrandIdentity';
import {Heading} from '../navigation/Heading';
import {p02DiscoveryText, p02ResultCount} from '../../i18n/p02-discovery';
import {ContextPicks} from '../context/ContextPicks';
import {recipeCategoryText} from '../../i18n/recipe-categories';

let discoveryPagination: DiscoveryPaginationState | undefined;

function preferenceCount(query: SearchQuery) {
  return [query.bases, query.brandIds, query.ingredientIds, query.excludedIngredientIds, query.methods, query.flavours, query.tastes, query.strengths, query.approachability, query.excluded]
    .reduce<number>((sum, values) => sum + (values?.length ?? 0), Number(Boolean(query.preparationDisclosed)));
}

function CocktailCard({
  cocktail,
  result,
  locale,
  leaving,
  exitOpacity,
  listId,
}: {
  cocktail: Cocktail;
  result: SearchResult;
  locale: Locale;
  leaving: boolean;
  exitOpacity: Animated.Value;
  listId?: string;
}) {
  const asset = media[cocktail.id];
  const origin = catalogue.versions.find(version => version.id === result.selectedVersionId)?.origin;
  return (
    <Animated.View style={[styles.cardCellContent, {opacity: leaving ? exitOpacity : 1}]}>
      <Link
        asChild
        href={{
          pathname: '/cocktails/[id]',
          params: {id: cocktail.id, version: result.selectedVersionId, from: 'discover', ...(listId ? {listId} : {})},
        } as never}
      >
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`${cocktail.name[locale]}. ${t(locale, 'viewRecipe')}`}
          style={styles.card}
        >
          <PhotoFrame asset={asset} accent={cocktail.accent} locale={locale} height={260} preserveAspect borderRadius={radii.medium} />
          <View style={styles.cardCopy}>
            <Text style={styles.cardCategory}>{origin ? recipeCategoryText(locale,origin.kind) : t(locale, cocktail.category as UiKey)}</Text>
            <Text style={styles.cardTitle}>{cocktail.name[locale]}</Text><CocktailOriginalName cocktail={cocktail} locale={locale} />
          </View>
        </Pressable>
      </Link>
      {listId ? <ListBrowseAddButton key={result.selectedVersionId} listId={listId} versionId={result.selectedVersionId} locale={locale} /> : null}
      <View style={{position: 'absolute', top: 10, right: 10}}>
        <FavoriteButton versionId={result.selectedVersionId} locale={locale} compact />
      </View>
      {asset?.origin === 'ai-generated' || asset?.origin === 'ai-styled' ? null : asset ? <Text style={styles.credit}>{asset.author}{asset.license ? ` · ${asset.license}` : ''}</Text> : null}
    </Animated.View>
  );
}

export default function DiscoveryScreen() {
  const params = useLocalSearchParams<{listId?: string | string[]}>();
  const listId = (Array.isArray(params.listId) ? params.listId[0] : params.listId) || undefined;
  const {locale, setLocale, unit, setUnit, query, setQuery, motionPaused, setMotionPaused} = useApp();
  const {width} = useViewport();
  const reduceMotion = useReduceMotion();
  const scrollRef = useRef<ScrollView>(null);
  const resultsOpacity = useRef(new Animated.Value(1)).current;
  const exitOpacity = useRef(new Animated.Value(1)).current;
  const filterTriggerRef = useRef<{focus?: () => void} | null>(null);
  const transitionToken = useRef(0);
  const mounted = useRef(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draft, setDraft] = useState<SearchQuery>(query);
  const [searchFocused, setSearchFocused] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(Boolean(query.collection || query.preparationDisclosed));
  const fingerprint = useMemo(() => discoveryQueryFingerprint(query, locale), [locale, query]);
  const [pagination, setPagination] = useState(() => {
    const initial = paginationForQuery(discoveryPagination, query, locale);
    discoveryPagination = initial;
    return initial;
  });
  const [departingIds, setDepartingIds] = useState<Set<string>>(() => new Set());
  const [committing, setCommitting] = useState(false);

  const results = useMemo(() => searchCocktails(catalogue, {...query, locale}), [locale, query]);
  const filtered = hasDiscoveryFilters(query);
  const hasClassic = results.some((result) => catalogue.cocktails.find((item) => item.id === result.cocktailId)?.category === 'classic');
  const activePagination = pagination.fingerprint === fingerprint
    ? pagination
    : paginationForQuery(undefined, query, locale);
  const visibleResults = results.slice(0, activePagination.limit);
  const columns = getDiscoveryColumnCount(width);
  const cardData = visibleResults.flatMap((result) => {
    const cocktail = catalogue.cocktails.find((item) => item.id === result.cocktailId);
    return cocktail ? [{cocktail, result}] : [];
  });
  const resultRows = createDiscoveryRows(cardData, columns);
  const collectionCount = Number(Boolean(query.collection)) + Number(Boolean(query.preparationDisclosed));

  useFocusEffect(useCallback(() => {
    const restored = paginationForQuery(discoveryPagination, query, locale);
    discoveryPagination = restored;
    setPagination(restored);
    const timer = setTimeout(() => scrollRef.current?.scrollTo({y: restored.scrollY, animated: false}), 0);
    return () => clearTimeout(timer);
  }, [fingerprint, locale, query]));

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      transitionToken.current += 1;
      exitOpacity.stopAnimation();
      resultsOpacity.stopAnimation();
    };
  }, [exitOpacity, resultsOpacity]);

  const openFilters = () => {
    setDraft(query);
    setFilterOpen(true);
  };
  const closeFilters = () => {
    setFilterOpen(false);
    setTimeout(() => filterTriggerRef.current?.focus?.(), 0);
  };
  const applyFilters = () => {
    const nextQuery = {...draft, text: query.text};
    if (reduceMotion || motionPaused) {
      setQuery(nextQuery);
      closeFilters();
      return;
    }
    const token = ++transitionToken.current;
    const nextIds = new Set(searchCocktails(catalogue, {...nextQuery, locale}).map((result) => result.cocktailId));
    const leavingIds = results.filter((result) => !nextIds.has(result.cocktailId)).map((result) => result.cocktailId);
    setCommitting(true);
    closeFilters();
    if (!leavingIds.length) {
      resultsOpacity.setValue(0.58);
      setQuery(nextQuery);
      Animated.timing(resultsOpacity, {toValue: 1, duration: 460, useNativeDriver: nativeDriver}).start(() => {
        if (mounted.current && transitionToken.current === token) setCommitting(false);
      });
      return;
    }
    setDepartingIds(new Set(leavingIds));
    exitOpacity.setValue(1);
    Animated.timing(exitOpacity, {toValue: 0, duration: 360, useNativeDriver: nativeDriver}).start(() => {
      if (!mounted.current || transitionToken.current !== token) return;
      resultsOpacity.setValue(0.58);
      setQuery(nextQuery);
      setDepartingIds(new Set());
      exitOpacity.setValue(1);
      Animated.timing(resultsOpacity, {toValue: 1, duration: 460, useNativeDriver: nativeDriver}).start(() => {
        if (mounted.current && transitionToken.current === token) setCommitting(false);
      });
    });
  };
  const resetFilters = () => setDraft({text: query.text});
  const clearFilters = () => {
    transitionToken.current += 1;
    exitOpacity.stopAnimation();
    resultsOpacity.stopAnimation();
    exitOpacity.setValue(1);
    resultsOpacity.setValue(1);
    setCommitting(false);
    setDepartingIds(new Set());
    setDraft({});
    setQuery({});
  };
  const loadMore = () => {
    const current = discoveryPagination?.fingerprint === fingerprint
      ? discoveryPagination
      : activePagination;
    const next = loadMoreDiscoveryPage(current, results.length);
    discoveryPagination = next;
    setPagination(next);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={80}
        onScroll={(event) => {
          discoveryPagination = {
            ...activePagination,
            scrollY: Math.max(0, event.nativeEvent.contentOffset.y),
          };
        }}
      >
        <View style={styles.shell} pointerEvents={committing ? 'none' : 'auto'}>
          <BrandToolbar {...{locale, setLocale, unit, setUnit, motionPaused, setMotionPaused}} showUnits={false} />
          {listId ? <ListBrowseSelection listId={listId} locale={locale} /> : <Heading level={1} style={[styles.pageTitle, width < 520 && styles.pageTitleCompact]}>{p02DiscoveryText(locale, 'collectionTitle')}</Heading>}
          <View style={styles.collectionFilters}>
            {(['all','classic','competition','bar'] as const).map(category=><SelectionChip key={category} label={recipeCategoryText(locale,category)} selected={category==='all'?!query.recipeCategory:query.recipeCategory===category} onPress={()=>setQuery({...query,recipeCategory:category==='all'?undefined:category})}/>)}
          </View>
          <View style={styles.searchPanel}>
              <View style={[styles.searchField, searchFocused && styles.searchFieldFocused]}>
                <Text style={styles.searchGlyph}>⌕</Text>
                <TextInput
                  accessibilityLabel={t(locale, 'searchPlaceholder')}
                  autoCapitalize="none"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                  onChangeText={(text) => {
                    setQuery({...query, text: text || undefined});
                  }}
                  onBlur={() => setSearchFocused(false)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder={t(locale, 'searchPlaceholder')}
                  placeholderTextColor={colors.muted}
                  returnKeyType="search"
                  style={styles.searchInput}
                  value={query.text ?? ''}
                />
              </View>
              <Pressable ref={filterTriggerRef as never} aria-expanded={filterOpen} accessibilityRole="button" accessibilityState={{expanded: filterOpen}} accessibilityLabel={p02DiscoveryText(locale, 'filters')} onPress={openFilters} style={({pressed}) => [styles.filterButton, pressed && styles.pressed]}>
                <Text style={styles.filterIcon}>≋</Text>
                <Text numberOfLines={1} style={styles.filterButtonText}>{p02DiscoveryText(locale, 'filters')}</Text>
                {preferenceCount(query) > 0 ? <View style={styles.filterCount}><Text style={styles.filterCountText}>{preferenceCount(query)}</Text></View> : null}
              </Pressable>
          </View>
          <View style={styles.secondaryActions}>
            <Link href="/ingredients" asChild>
              <Pressable accessibilityRole="link" style={styles.secondaryLink}>
                <Text style={styles.secondaryLinkText}>{p02DiscoveryText(locale, 'ingredientLibrary')}</Text>
              </Pressable>
            </Link>
            <Pressable
              aria-expanded={collectionsOpen}
              accessibilityRole="button"
              accessibilityState={{expanded: collectionsOpen}}
              onPress={() => setCollectionsOpen((open) => !open)}
              style={({pressed}) => [styles.secondaryLink, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryLinkText}>{collectionsOpen ? p02DiscoveryText(locale, 'hideCollections') : p02DiscoveryText(locale, 'showCollections')}</Text>
              {collectionCount ? <Text style={styles.secondaryCount}>{collectionCount}</Text> : null}
            </Pressable>
          </View>
          {collectionsOpen ? (
            <View style={styles.collectionFilters}>
              <SelectionChip label={favoriteCopy(locale).all} selected={!query.collection} onPress={() => setQuery({...query, collection: undefined})} />
              <SelectionChip label={favoriteCopy(locale).japan} selected={query.collection === 'japan'} onPress={() => setQuery({...query, collection: 'japan'})} />
              <SelectionChip label={lib(locale,'documented')} selected={Boolean(query.preparationDisclosed)} onPress={()=>setQuery({...query,preparationDisclosed:!query.preparationDisclosed})}/>
            </View>
          ) : null}
          {!filtered && !listId ? <ContextPicks locale={locale} query={query} /> : null}
          <View style={styles.resultsHeader}>
            <View>
              <Heading level={2} style={styles.resultsEyebrow}>{filtered ? t(locale, 'topPicks') : t(locale, 'explore')}</Heading>
              <Text style={styles.resultsTitle}>{p02ResultCount(locale, visibleResults.length, results.length)}</Text>
            </View>
            {filtered ? (
              <Pressable accessibilityRole="button" onPress={clearFilters} style={styles.clearButton}>
                <Text style={styles.clearText}>{t(locale, 'clear')}</Text>
              </Pressable>
            ) : null}
          </View>

          {filtered && results.length > 0 && !hasClassic && !query.recipeCategory ? (
            <View style={styles.notice}><Text style={styles.noticeText}>{t(locale, 'noClassics')}</Text></View>
          ) : null}

          {results.length ? (
            <Animated.View style={[styles.grid, {opacity: resultsOpacity}]}>
              {resultRows.map((items, rowIndex) => (
                <View key={items[0]?.cocktail.id ?? `row-${rowIndex}`} style={styles.gridRow}>
                  {items.map(({cocktail, result}) => (
                    <View key={cocktail.id} style={styles.gridCell}>
                      <CocktailCard {...{cocktail, result, locale, exitOpacity, listId}} leaving={departingIds.has(cocktail.id)} />
                    </View>
                  ))}
                  {Array.from({length: columns - items.length}, (_, spacerIndex) => (
                    <View key={`spacer-${spacerIndex}`} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.gridSpacer} />
                  ))}
                </View>
              ))}
            </Animated.View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyOrnament}>◇</Text>
              <Text style={styles.emptyTitle}>{t(locale, 'noResults')}</Text>
              <Text style={styles.emptyHint}>{t(locale, 'noResultsHint')}</Text>
              <Pressable accessibilityRole="button" onPress={openFilters} style={({pressed}) => [styles.emptyButton, pressed && styles.pressed]}>
                <Text style={styles.emptyButtonText}>{t(locale, 'refine')}</Text>
              </Pressable>
              {query.text ? (
                <Pressable accessibilityRole="button" onPress={clearFilters} style={styles.emptyClearButton}>
                  <Text style={styles.clearText}>{t(locale, 'clear')}</Text>
                </Pressable>
              ) : null}
            </View>
          )}

          {visibleResults.length < results.length ? (
            <Pressable accessibilityRole="button" onPress={loadMore} style={({pressed}) => [styles.loadMoreButton, pressed && styles.pressed]}>
              <Text style={styles.loadMoreText}>{p02DiscoveryText(locale, 'loadMore')}</Text>
            </Pressable>
          ) : null}
          <View style={styles.endMark}><View style={styles.endRule} /><View style={styles.endLogo}><BrandMark size={20} decorative /></View><View style={styles.endRule} /></View>
          <Fold title={t(locale,'credits')}><Pressable accessibilityRole="link" onPress={()=>void Linking.openURL(ingredientTaxonomy.url)} style={styles.secondaryLink}><Text style={styles.secondaryLinkText}>{ingredientTaxonomy.title} ↗</Text></Pressable><Pressable accessibilityRole="link" onPress={()=>void Linking.openURL(ingredientTaxonomy.licenseUrl)} style={styles.secondaryLink}><Text style={styles.secondaryLinkText}>{ingredientTaxonomy.license} ↗</Text></Pressable></Fold>
        </View>
      </ScrollView>
      <FilterSheet visible={filterOpen} locale={locale} draft={draft} onChange={setDraft} onApply={applyFilters} onReset={resetFilters} onClose={closeFilters} pauseMotion={motionPaused || reduceMotion} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: 'transparent'},
  page: {minHeight: '100%', paddingHorizontal: 18, paddingBottom: 56},
  shell: {width: '100%', maxWidth: 1400, alignSelf: 'center'},
  pageTitle: {color: colors.text, fontFamily: serif, fontSize: 34, lineHeight: 40, letterSpacing: -0.7, marginTop: 22, marginBottom: 14},
  pageTitleCompact: {fontSize: 30, lineHeight: 36, marginTop: 16},
  searchPanel: {width: '100%', flexDirection: 'row', gap: 10},
  searchField: {height: 54, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: radii.pill, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 18},
  searchFieldFocused: {borderColor: colors.accent, outlineColor: colors.accent, outlineStyle: 'solid', outlineWidth: 2, outlineOffset: 2} as never,
  searchGlyph: {color: colors.accent, fontSize: 24, marginTop: -3},
  searchInput: {flex: 1, minWidth: 0, height: 52, color: colors.text, fontSize: 16},
  filterButton: {height: 54, minWidth: 96, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: colors.accent, borderRadius: radii.pill},
  filterIcon: {color: colors.background, fontSize: 20, transform: [{rotate: '90deg'}]},
  filterButtonText: {color: colors.background, fontSize: 14, fontWeight: '800'},
  filterCount: {width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.background},
  filterCountText: {color: colors.accent, fontSize: 10, fontWeight: '800'},
  secondaryActions: {minHeight: 46, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 4},
  secondaryLink: {minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, gap: 7},
  secondaryLinkText: {color: colors.accent, fontSize: 13, lineHeight: 18, fontWeight: '700'},
  secondaryCount: {minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, textAlign: 'center', color: colors.background, backgroundColor: colors.accent, fontSize: 11, lineHeight: 20, fontWeight: '800'},
  collectionFilters: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 10},
  resultsHeader: {minHeight: 70, paddingVertical: 15, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  resultsEyebrow: {color: colors.text, fontFamily: serif, fontSize: 19},
  resultsTitle: {color: colors.muted, fontSize: 12, marginTop: 4},
  clearButton: {minHeight: 44, justifyContent: 'center', paddingHorizontal: 12},
  clearText: {color: colors.accent, fontSize: 14, fontWeight: '700'},
  notice: {marginBottom: 6, borderLeftWidth: 2, borderLeftColor: colors.amber, paddingVertical: 11, paddingHorizontal: 14, backgroundColor: colors.panel},
  noticeText: {color: colors.secondary, fontSize: 14, lineHeight: 20},
  grid: {gap: 24, paddingVertical: 32},
  gridRow: {flexDirection: 'row', gap: 14, alignItems: 'stretch'},
  gridCell: {flex: 1},
  gridSpacer: {flex: 1},
  cardCellContent: {flex: 1},
  card: {flex: 1, backgroundColor: colors.panel, borderRadius: radii.medium, borderWidth: 1, borderColor: colors.border, overflow: 'hidden'},
  cardCopy: {flex: 1, paddingHorizontal: 15, paddingTop: 13, paddingBottom: 16},
  cardCategory: {color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', flexShrink: 1},
  cardTitle: {color: colors.text, fontFamily: serif, fontSize: 22, lineHeight: 27, marginTop: 9},
  credit: {color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 7, marginHorizontal: 4},
  emptyState: {minHeight: 350, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radii.large, padding: 30},
  emptyOrnament: {color: colors.accent, fontSize: 25},
  emptyTitle: {color: colors.text, fontFamily: serif, fontSize: 27, marginTop: 14, textAlign: 'center'},
  emptyHint: {color: colors.secondary, fontSize: 14, lineHeight: 21, maxWidth: 400, textAlign: 'center', marginTop: 9},
  emptyButton: {minHeight: 48, borderRadius: radii.pill, backgroundColor: colors.accent, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', marginTop: 20},
  emptyButtonText: {color: colors.background, fontSize: 14, fontWeight: '800'},
  emptyClearButton: {minHeight: 44, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8},
  loadMoreButton: {minHeight: 54, marginTop: 32, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, alignSelf: 'center', paddingHorizontal: 28, flexDirection: 'row', alignItems: 'center'},
  loadMoreText: {color: colors.text, fontSize: 14, fontWeight: '700'},
  endMark: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 13, marginTop: 56},
  endRule: {height: 1, width: 36, backgroundColor: colors.border},
  endLogo: {opacity: 0.55},
  pressed: {opacity: 0.7},
});
