import React, {useMemo, useRef, useState} from 'react';
import {Link} from 'expo-router';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {catalogue} from '../../content/catalogue';
import {contextEvidence} from '../../content/context-evidence';
import {canonicalIngredientEntries} from '../../domain/ingredients/canonical';
import {materialDisplayName} from '../ingredients/materialDisplay';
import type {Locale, SearchQuery} from '../../domain/contracts';
import type {ContextSelection} from '../../domain/context/types';
import type {Pantry} from '../../domain/ingredients/types';
import {createCabinetPlanner, type CabinetPlan} from '../../domain/making/personalized-planning';
import {pantryText} from '../../i18n/pantry';
import {makingText} from '../../i18n/making';
import {colors} from '../../theme/tokens';
import {useApp} from '../../platform/AppProvider';
import {useTaste} from '../../platform/TasteProvider';
import {ContextSelector} from '../context/ContextSelector';
import FilterSheet from '../discovery/FilterSheet';
import {useMotionEnabled} from '../motion';
import {Heading} from '../navigation/Heading';
import {serif} from '../discovery/components';
import {Disclosure} from './ui';

const ingredients = new Map(canonicalIngredientEntries(catalogue).map(item => [item.ingredient.id, item]));
const cocktails = new Map(catalogue.cocktails.map(item => [item.id, item]));
const versions = new Map(catalogue.versions.map(item => [item.id, item]));
const sources = new Map(catalogue.sources.map(item => [item.id, item]));
const brands = new Map(catalogue.brands.map(item => [item.id, item]));
const ingredientName = materialDisplayName;
const normalized = (value: string) => value.normalize('NFKC').toLocaleLowerCase().replace(/[-_]/g, ' ');

export function PantryRestockPlanner({pantry}: {pantry: Pantry}) {
  const {locale} = useApp();
  const taste = useTaste();
  const motionEnabled = useMotionEnabled();
  const [planner] = useState(createCabinetPlanner);
  const [goal, setGoal] = useState<'coverage' | 'taste'>('coverage');
  const [count, setCount] = useState<1 | 2>(1);
  const [query, setQuery] = useState('');
  const [recipeQuery, setRecipeQuery] = useState<SearchQuery>({});
  const [recipeDraft, setRecipeDraft] = useState<SearchQuery>({});
  const [context, setContext] = useState<ContextSelection>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const filterTrigger = useRef<{focus?: () => void} | null>(null);
  const [limit, setLimit] = useState(6);
  const p = (key: Parameters<typeof pantryText>[1], values?: Record<string, string | number>) => pantryText(locale, key, values);
  const effectiveGoal = goal === 'taste' && taste.hydrated && taste.error !== 'read' ? 'taste' : 'coverage';
  const result = useMemo(() => planner.plan(catalogue, pantry, count, {
    goal: effectiveGoal, taste: taste.savedState, query: recipeQuery, context, evidence: contextEvidence,
  }), [planner, pantry, count, effectiveGoal, taste.savedState, recipeQuery, context]);
  const plans = result.plans;
  const activeFilters = [recipeQuery.bases, recipeQuery.brandIds, recipeQuery.ingredientIds, recipeQuery.excludedIngredientIds,
    recipeQuery.methods, recipeQuery.flavours, recipeQuery.tastes, recipeQuery.strengths, recipeQuery.approachability, recipeQuery.excluded]
    .reduce<number>((total, values) => total + (values?.length ?? 0), Number(Boolean(recipeQuery.preparationDisclosed)));
  const closeFilters = () => {
    setFilterOpen(false);
    setTimeout(() => filterTrigger.current?.focus?.(), 0);
  };
  const retry = async () => {
    setRetrying(true);
    try {await taste.retry();} finally {setRetrying(false);}
  };
  const tasteNotice = goal !== 'taste' ? undefined
    : taste.error === 'read' ? 'plannerTasteReadError'
    : !taste.hydrated ? 'plannerTasteLoading'
    : result.status === 'cold-start' ? 'plannerTasteCold'
    : result.status === 'unavailable' ? 'plannerTasteUnavailable' : undefined;
  const filtered = useMemo(() => {
    const terms = normalized(query).trim().split(/\s+/).filter(Boolean);
    return plans.filter(plan => {
      const haystack = normalized(plan.ingredientIds.map(id => `${id} ${(ingredients.get(id)?.searchNames ?? []).join(' ')}`).join(' '));
      return terms.every(term => haystack.includes(term));
    });
  }, [plans, query]);
  return <View testID="personalized-planner" style={styles.root}>
    <Heading level={2} style={styles.title}>{p('restockTitle')}</Heading>
    <Text style={styles.body}>{p('plannerHint')}</Text>
    <View style={styles.choiceGroup}>{(['coverage', 'taste'] as const).map(value => <Pressable key={value} accessibilityRole="button" aria-pressed={goal === value}
      onPress={() => {setGoal(value); setLimit(6);}} style={({pressed}) => [styles.button, styles.choiceButton, goal === value && styles.selected, pressed && styles.pressed]}>
      <Text style={styles.buttonText}>{p(value === 'coverage' ? 'plannerGoalCoverage' : 'plannerGoalTaste')}</Text>
    </Pressable>)}</View>
    <View style={styles.choiceGroup}>{([1, 2] as const).map(value => <Pressable key={value} accessibilityRole="button" aria-pressed={count === value}
      onPress={() => {setCount(value); setLimit(6);}} style={({pressed}) => [styles.button, styles.choiceButton, count === value && styles.selected, pressed && styles.pressed]}>
      <Text style={styles.buttonText}>{p(value === 1 ? 'planOne' : 'planTwo')}</Text>
    </Pressable>)}</View>
    {tasteNotice ? <Text accessibilityRole={tasteNotice === 'plannerTasteReadError' || tasteNotice === 'plannerTasteUnavailable' ? 'alert' : undefined}
      accessibilityLiveRegion="polite" style={styles.body}>{p(tasteNotice)}</Text> : null}
    {taste.error ? <View style={styles.notice}>
      {taste.error === 'write' ? <Text accessibilityRole="alert" style={styles.body}>{p('plannerTasteWriteError')}</Text> : null}
      <Pressable accessibilityRole="button" disabled={retrying || taste.saving} accessibilityState={{disabled: retrying || taste.saving}}
        onPress={() => void retry()} style={({pressed}) => [styles.button, (retrying || taste.saving) && styles.disabled, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>{p(retrying || taste.saving ? 'plannerTasteRetrying' : 'plannerTasteRetry')}</Text>
      </Pressable>
    </View> : null}
    <View style={styles.controls}>
      <Pressable ref={filterTrigger as never} accessibilityRole="button" aria-expanded={filterOpen}
        onPress={() => {setRecipeDraft(recipeQuery); setFilterOpen(true);}} style={({pressed}) => [styles.button, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>{p('plannerRecipeFilters')}{activeFilters ? ` · ${p('plannerFilterCount', {count: activeFilters})}` : ''}</Text>
      </Pressable>
      {activeFilters ? <Pressable accessibilityRole="button" onPress={() => {setRecipeQuery({}); setRecipeDraft({}); setLimit(6);}}
        style={({pressed}) => [styles.button, pressed && styles.pressed]}><Text style={styles.buttonText}>{p('plannerResetFilters')}</Text></Pressable> : null}
    </View>
    <ContextSelector locale={locale} value={context} onApply={value => {setContext(value); setLimit(6);}} />
    <TextInput accessibilityLabel={p('plannerSearch')} placeholder={p('plannerSearch')} placeholderTextColor={colors.muted}
      value={query} onChangeText={value => {setQuery(value); setLimit(6);}} style={styles.search}/>
    <Text accessibilityLiveRegion="polite" style={styles.meta}>{p('plannerCount', {count: filtered.length})}</Text>
    {filtered.length ? filtered.slice(0, limit).map(plan => <PlanRow key={plan.ingredientIds.join(':')} plan={plan} locale={locale}/>)
      : <View style={styles.empty}><Heading level={3} style={styles.drinkTitle}>{p('plannerEmpty')}</Heading><Text style={styles.body}>{p('plannerEmptyHint')}</Text></View>}
    {filtered.length > limit ? <Pressable accessibilityRole="button" onPress={() => setLimit(value => value + 6)} style={styles.button}>
      <Text style={styles.buttonText}>{makingText(locale, 'more')} ↓</Text>
    </Pressable> : null}
    <FilterSheet visible={filterOpen} locale={locale} draft={recipeDraft} onChange={setRecipeDraft}
      onApply={() => {setRecipeQuery(recipeDraft); setLimit(6); closeFilters();}}
      onReset={() => setRecipeDraft({})} onClose={closeFilters} pauseMotion={!motionEnabled}/>
  </View>;
}

function PlanRow({plan, locale}: {plan: CabinetPlan; locale: Locale}) {
  const p = (key: Parameters<typeof pantryText>[1], values?: Record<string, string | number>) => pantryText(locale, key, values);
  const ready = plan.cocktails.filter(item => item.readyVersions.length).length;
  const together = plan.cocktails.filter(item => item.jointlyUnlocked).length;
  return <View testID={`restock-plan-${plan.ingredientIds.join(':')}`} style={styles.plan}>
    <View style={styles.lead}>
      <View style={styles.grow}><Heading level={3} style={styles.planTitle}>{plan.ingredientIds.map(id => ingredientName(id, locale)).join(' + ')}</Heading>
        <View style={styles.controls}>{plan.ingredientIds.map(id => <Link key={id} href={{pathname: '/ingredients/[id]', params: {id}}} asChild>
          <Pressable accessibilityRole="link" style={linkStyle}><Text style={styles.linkText}>{ingredientName(id, locale)} ↗</Text></Pressable>
        </Link>)}</View>
      </View>
      <Text style={styles.gain}>{p('planGain', {count: plan.cocktails.length})}</Text>
    </View>
    <View style={styles.controls}><Text style={styles.ready}>{p('planReady', {count: ready})}</Text><Text style={styles.review}>{p('planReview', {count: plan.cocktails.length - ready})}</Text></View>
    {plan.ingredientIds.length === 2 ? <Text style={styles.meta}>{p('planTogether', {count: together})}</Text> : null}
    <Disclosure title={p('planDetails', {count: plan.cocktails.length})}>
      {plan.cocktails.map(drink => {
        const cocktail = cocktails.get(drink.cocktailId)!;
        const name = cocktail.name[locale] || cocktail.name.en;
        return <View key={drink.cocktailId} style={styles.drink}>
          <Heading level={4} style={styles.drinkTitle}>{name}</Heading>
          {[...drink.readyVersions, ...drink.needsReviewVersions].map(match => {
            const version = versions.get(match.versionId)!;
            const label = version.label[locale] || version.label.en;
            return <View key={match.versionId} style={styles.version}>
              <Link href={{pathname: '/cocktails/[id]', params: {id: drink.cocktailId, version: match.versionId, from: 'pantry'}}} asChild>
                <Pressable accessibilityRole="link" accessibilityLabel={`${name} · ${label}`} style={linkStyle}><Text style={styles.linkText}>{label} ↗</Text></Pressable>
              </Link>
              {plan.preference?.versionIds.includes(match.versionId) ? <Text style={styles.ready}>{p('plannerTasteMatch')}</Text> : null}
              <Text style={styles.meta}>{sources.get(version.sourceId)?.title}</Text>
              {match.unconfirmedBrands.map(brand => <Text key={`${brand.ingredientId}:${brand.brandId}`} style={styles.review}>
                {p('planBrand')} · {ingredientName(brand.ingredientId, locale)} · {brands.get(brand.brandId)?.name || brand.brandId}
              </Text>)}
              {match.preparationNeedsReview ? <Text style={styles.review}>{p('planPreparation')}</Text> : null}
              {match.optionalMissingIngredientIds.length ? <Text style={styles.meta}>{p('planOptional')} · {match.optionalMissingIngredientIds.map(id => ingredientName(id, locale)).join(', ')}</Text> : null}
            </View>;
          })}
        </View>;
      })}
    </Disclosure>
  </View>;
}

const styles = StyleSheet.create({
  root: {gap: 18}, title: {fontFamily: serif, color: colors.text, fontSize: 32, lineHeight: 42},
  body: {color: colors.secondary, fontSize: 16, lineHeight: 26, maxWidth: 820}, meta: {color: colors.muted, fontSize: 13, lineHeight: 21},
  controls: {flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center'},
  choiceGroup: {flexDirection: 'row', gap: 12, alignItems: 'stretch'}, choiceButton: {flex: 1, minWidth: 0, alignSelf: 'stretch'},
  button: {minHeight: 44, paddingHorizontal: 16, paddingVertical: 11, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start', alignItems: 'center', justifyContent: 'center'},
  selected: {backgroundColor: colors.accentDark, borderColor: colors.accent}, buttonText: {fontSize: 14, lineHeight: 22, color: colors.accent, textAlign: 'center'}, pressed: {opacity: 0.7},
  notice: {gap: 10, alignItems: 'flex-start'}, disabled: {opacity: 0.5},
  search: {fontSize: 16, lineHeight: 24, color: colors.text, borderWidth: 1, borderColor: colors.border, minHeight: 48, paddingHorizontal: 13, paddingVertical: 11, backgroundColor: colors.background},
  plan: {paddingVertical: 26, gap: 12, borderTopWidth: 1, borderTopColor: colors.border}, lead: {flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 16},
  grow: {flexGrow: 1, flexShrink: 1, minWidth: 0, gap: 8}, planTitle: {fontFamily: serif, color: colors.text, fontSize: 26, lineHeight: 36},
  gain: {fontSize: 18, lineHeight: 28, color: colors.accent}, ready: {fontSize: 14, lineHeight: 23, color: colors.accent}, review: {fontSize: 14, lineHeight: 23, color: colors.amber},
  link: {minHeight: 44, justifyContent: 'center', paddingVertical: 8}, linkText: {fontSize: 15, lineHeight: 24, color: colors.accent},
  drink: {gap: 8, paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.border}, drinkTitle: {fontFamily: serif, color: colors.text, fontSize: 22, lineHeight: 32},
  version: {gap: 6, paddingBottom: 12}, empty: {gap: 12, paddingVertical: 24},
});
const linkStyle = StyleSheet.flatten(styles.link);
