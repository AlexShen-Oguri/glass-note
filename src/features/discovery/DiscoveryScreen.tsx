import {motionData} from '../motion/attributes';
import {CocktailOriginalName} from '../names/OriginalName';
import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
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
import {BrandToolbar, PhotoFrame, serif, useReduceMotion, useViewport} from './components';
import FilterSheet from './FilterSheet';
import {MotionTransition} from '../motion';
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
  listId,
  index,
  photoHeight,
  compact,
}: {
  cocktail: Cocktail;
  result: SearchResult;
  locale: Locale;
  listId?: string;
  index: number;
  photoHeight: number;
  compact: boolean;
}) {
  const asset = media[cocktail.id];
  const [hovered, setHovered] = useState(false);
  const origin = catalogue.versions.find(version => version.id === result.selectedVersionId)?.origin;
  return (
    <View {...motionData({motionItem: cocktail.id})} style={styles.cardCellContent}>
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
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          style={({pressed}) => [styles.card, hovered && styles.cardHovered, pressed && styles.pressed]}
        >
          <View {...motionData({motionPhoto: cocktail.id})} style={styles.cardPhoto}>
            <PhotoFrame asset={asset} accent={cocktail.accent} locale={locale} height={photoHeight} borderRadius={radii.small} />
            <Text aria-hidden style={styles.cardNumber}>{String(index + 1).padStart(2, '0')}</Text>
          </View>
          <View style={styles.cardCopy}>
            <Text style={styles.cardCategory}>{origin ? recipeCategoryText(locale,origin.kind) : t(locale, cocktail.category as UiKey)}</Text>
            <Text style={[styles.cardTitle, compact && styles.cardTitleCompact]}>{cocktail.name[locale]}</Text><CocktailOriginalName cocktail={cocktail} locale={locale} />
          </View>
        </Pressable>
      </Link>
      {listId ? <ListBrowseAddButton key={result.selectedVersionId} listId={listId} versionId={result.selectedVersionId} locale={locale} /> : null}
      <View style={styles.cardFavorite}>
        <FavoriteButton versionId={result.selectedVersionId} locale={locale} compact />
      </View>
      {asset?.origin === 'ai-generated' || asset?.origin === 'ai-styled' ? null : asset ? <Text style={styles.credit}>{asset.author}{asset.license ? ` · ${asset.license}` : ''}</Text> : null}
    </View>
  );
}

export default function DiscoveryScreen() {
  const params = useLocalSearchParams<{listId?: string | string[]}>();
  const listId = (Array.isArray(params.listId) ? params.listId[0] : params.listId) || undefined;
  const {locale, setLocale, unit, setUnit, query, setQuery, motionPaused, setMotionPaused} = useApp();
  const {width} = useViewport();
  const reduceMotion = useReduceMotion();
  const scrollRef = useRef<ScrollView>(null);
  const filterTriggerRef = useRef<{focus?: () => void} | null>(null);
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

  const results = useMemo(() => searchCocktails(catalogue, {...query, locale}), [locale, query]);
  const filtered = hasDiscoveryFilters(query);
  const hasClassic = results.some((result) => catalogue.cocktails.find((item) => item.id === result.cocktailId)?.category === 'classic');
  const activePagination = pagination.fingerprint === fingerprint
    ? pagination
    : paginationForQuery(undefined, query, locale);
  const visibleResults = results.slice(0, activePagination.limit);
  const compact = width < 520;
  const gutter = compact ? 22 : width < 900 ? 36 : 64;
  const columns = Math.min(3, getDiscoveryColumnCount(width)) as 2 | 3;
  const columnGap = compact ? 14 : 28;
  const photoHeight = Math.max(140, Math.min(330, Math.round((Math.min(width - gutter * 2, 1260) - columnGap * (columns - 1)) / columns * (compact ? 0.96 : 0.79))));
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

  const openFilters = () => {
    setDraft(query);
    setFilterOpen(true);
  };
  const closeFilters = () => {
    setFilterOpen(false);
    setTimeout(() => filterTriggerRef.current?.focus?.(), 0);
  };
  const applyFilters = () => {
    setQuery({...draft, text: query.text});
    closeFilters();
  };
  const resetFilters = () => setDraft({text: query.text});
  const clearFilters = () => {
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
        contentContainerStyle={[styles.page, {paddingHorizontal: gutter}]}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={80}
        onScroll={(event) => {
          discoveryPagination = {
            ...activePagination,
            scrollY: Math.max(0, event.nativeEvent.contentOffset.y),
          };
        }}
      >
        <View style={styles.shell}>
          <BrandToolbar {...{locale, setLocale, unit, setUnit, motionPaused, setMotionPaused}} showUnits={false} />
          <View {...motionData({motionPart: 'title'})} style={styles.collectionHeading}>
            <View style={styles.editionLine}><View style={styles.editionRule} /><Text style={styles.editionText}>GLASS NOTES / COLLECTION</Text></View>
            {listId ? <ListBrowseSelection listId={listId} locale={locale} /> : <Heading level={1} style={[styles.pageTitle, compact && styles.pageTitleCompact]}>{p02DiscoveryText(locale, 'collectionTitle')}</Heading>}
          </View>
          <View style={styles.collectionFilters}>
            {(['all','classic','competition','bar'] as const).map(category=><SelectionChip key={category} label={recipeCategoryText(locale,category)} selected={category==='all'?!query.recipeCategory:query.recipeCategory===category} onPress={()=>setQuery({...query,recipeCategory:category==='all'?undefined:category})}/>)}
          </View>
          <View {...motionData({motionPart: 'copy'})} style={styles.searchPanel}>
              <View style={[styles.searchField, searchFocused && styles.searchFieldFocused]}>
                <Text aria-hidden style={styles.searchGlyph}>⌕</Text>
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
                <Text aria-hidden style={styles.filterIcon}>≋</Text>
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

          <MotionTransition changeKey={`${fingerprint}:${activePagination.limit}`} kind="card" disabled={Boolean(query.text)}>{results.length ? (
            <View style={styles.grid}>
              {resultRows.map((items, rowIndex) => (
                <View key={items[0]?.cocktail.id ?? `row-${rowIndex}`} style={[styles.gridRow, {gap: columnGap}]}>
                  {items.map(({cocktail, result}, columnIndex) => (
                    <View key={cocktail.id} style={[styles.gridCell, {paddingTop: columnIndex * (compact ? 28 : 42)}]}>
                      <CocktailCard {...{cocktail, result, locale, listId, photoHeight, compact}} index={rowIndex * columns + columnIndex} />
                    </View>
                  ))}
                  {Array.from({length: columns - items.length}, (_, spacerIndex) => (
                    <View key={`spacer-${spacerIndex}`} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.gridSpacer} />
                  ))}
                </View>
              ))}
            </View>
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

          </MotionTransition>
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
  page: {minHeight: '100%', paddingBottom: 80},
  shell: {width: '100%', maxWidth: 1260, alignSelf: 'center'},
  collectionHeading: {marginTop: 32, marginBottom: 12},
  editionLine: {flexDirection: 'row', alignItems: 'center', gap: 14},
  editionRule: {width: 32, height: 1, backgroundColor: colors.accent},
  editionText: {color: colors.accent, fontSize: 11, letterSpacing: 2.2},
  pageTitle: {color: colors.text, fontFamily: serif, fontSize: 94, lineHeight: 108, fontWeight: '400', letterSpacing: -4, marginTop: 18, marginBottom: 16},
  pageTitleCompact: {fontSize: 56, lineHeight: 67, letterSpacing: -2, marginTop: 18, marginBottom: 10},
  searchPanel: {width: '100%', flexDirection: 'row', gap: 12, marginTop: 16},
  searchField: {height: 62, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.accent, paddingHorizontal: 2},
  searchFieldFocused: {borderBottomColor: colors.text, outlineColor: colors.accent, outlineStyle: 'solid', outlineWidth: 2, outlineOffset: 4} as never,
  searchGlyph: {color: colors.accent, fontSize: 28, marginTop: -3},
  searchInput: {flex: 1, minWidth: 0, height: 58, color: colors.text, fontSize: 16},
  filterButton: {minHeight: 62, minWidth: 96, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: colors.accent, borderRadius: radii.small},
  filterIcon: {color: colors.background, fontSize: 20, transform: [{rotate: '90deg'}]},
  filterButtonText: {color: colors.background, fontSize: 14, fontWeight: '700'},
  filterCount: {width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.background},
  filterCountText: {color: colors.accent, fontSize: 10, fontWeight: '800'},
  secondaryActions: {minHeight: 48, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 8},
  secondaryLink: {minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2, gap: 7},
  secondaryLinkText: {color: colors.accent, fontSize: 13, lineHeight: 18},
  secondaryCount: {minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, textAlign: 'center', color: colors.background, backgroundColor: colors.accent, fontSize: 11, lineHeight: 20, fontWeight: '800'},
  collectionFilters: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingVertical: 10},
  resultsHeader: {minHeight: 88, marginTop: 20, paddingVertical: 20, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  resultsEyebrow: {color: colors.text, fontFamily: serif, fontSize: 28, lineHeight: 35, fontWeight: '400'},
  resultsTitle: {color: colors.muted, fontSize: 12, marginTop: 7, letterSpacing: 0.5},
  clearButton: {minHeight: 44, justifyContent: 'center', paddingHorizontal: 12},
  clearText: {color: colors.accent, fontSize: 14},
  notice: {marginBottom: 6, borderLeftWidth: 2, borderLeftColor: colors.amber, paddingVertical: 11, paddingHorizontal: 14, backgroundColor: colors.panel},
  noticeText: {color: colors.secondary, fontSize: 14, lineHeight: 20},
  grid: {gap: 36, paddingTop: 16, paddingBottom: 32},
  gridRow: {flexDirection: 'row', alignItems: 'flex-start'},
  gridCell: {flex: 1, minWidth: 0},
  gridSpacer: {flex: 1},
  cardCellContent: {flex: 1},
  card: {flex: 1, backgroundColor: 'transparent', borderRadius: radii.small, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 4},
  cardHovered: {borderBottomColor: colors.accent},
  cardPhoto: {width: '100%'},
  cardNumber: {position: 'absolute', top: 12, left: 14, color: colors.text, fontFamily: serif, fontStyle: 'italic', fontSize: 20, textShadowColor: colors.background, textShadowRadius: 8},
  cardFavorite: {position: 'absolute', top: 8, right: 8},
  cardCopy: {paddingTop: 16, paddingBottom: 18, minHeight: 112},
  cardCategory: {color: colors.muted, fontSize: 11, lineHeight: 16, letterSpacing: 1.1, textTransform: 'uppercase', flexShrink: 1},
  cardTitle: {color: colors.text, fontFamily: serif, fontSize: 32, lineHeight: 39, fontWeight: '400', marginTop: 8},
  cardTitleCompact: {fontSize: 23, lineHeight: 30},
  credit: {color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 7},
  emptyState: {minHeight: 350, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, padding: 30},
  emptyOrnament: {color: colors.accent, fontSize: 25},
  emptyTitle: {color: colors.text, fontFamily: serif, fontSize: 36, lineHeight: 43, marginTop: 14, textAlign: 'center'},
  emptyHint: {color: colors.secondary, fontSize: 14, lineHeight: 21, maxWidth: 400, textAlign: 'center', marginTop: 9},
  emptyButton: {minHeight: 48, borderRadius: radii.small, backgroundColor: colors.accent, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', marginTop: 20},
  emptyButtonText: {color: colors.background, fontSize: 14, fontWeight: '700'},
  emptyClearButton: {minHeight: 44, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8},
  loadMoreButton: {minHeight: 54, minWidth: 180, marginTop: 32, borderRadius: radii.small, borderWidth: 1, borderColor: colors.border, alignSelf: 'center', paddingHorizontal: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'},
  loadMoreText: {color: colors.text, fontSize: 14},
  endMark: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 13, marginTop: 64},
  endRule: {height: 1, width: 48, backgroundColor: colors.border},
  endLogo: {opacity: 0.55},
  pressed: {opacity: 0.7},
});
