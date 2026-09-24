import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';

import {catalogue} from '../../content/catalogue';
import type {Ingredient, Locale, SearchQuery} from '../../domain/contracts';
import {ingredientEntries, type IngredientEntry} from '../../domain/ingredients';
import {scoreTextSearch} from '../../domain/search';
import {findText} from '../../i18n/find';
import {colors, radii} from '../../theme/tokens';
import {IngredientPicture} from '../ingredients/IngredientPicture';

const PAGE_SIZE = 24;
const ENTRIES = ingredientEntries(catalogue);
const INGREDIENTS_BY_ID = new Map(ENTRIES.map((entry) => [entry.ingredient.id, entry.ingredient]));
const BRANDS_BY_ID = new Map(catalogue.brands.map((brand) => [brand.id, brand]));

function ingredientName(ingredient: Ingredient, locale: Locale): string {
  return ingredient.name[locale] || ingredient.name.en || ingredient.id;
}

function searchableFields(entry: IngredientEntry): string[] {
  const brandNames = entry.brandIds.flatMap((id) => {
    const brand = BRANDS_BY_ID.get(id);
    return brand ? [brand.name] : [];
  });
  return [
    ...Object.values(entry.ingredient.name),
    entry.ingredient.id,
    ...(entry.ingredient.guide?.aliases ?? []),
    ...brandNames,
  ].filter(Boolean);
}

function SelectedIngredients({locale, ids, title, onRemove}: {locale: Locale; ids: readonly string[]; title: string; onRemove: (id: string) => void}) {
  if (!ids.length) return null;
  return (
    <View style={styles.selectedGroup}>
      <Text style={styles.selectedLabel}>{title}</Text>
      <View style={styles.chips}>
        {ids.map((id) => {
          const ingredient = INGREDIENTS_BY_ID.get(id);
          const name = ingredient ? ingredientName(ingredient, locale) : id;
          return (
            <Pressable key={id} accessibilityRole="button" accessibilityLabel={findText(locale, 'remove', {name})}
              onPress={() => onRemove(id)} style={({pressed}) => [styles.selectedChip, pressed && styles.pressed]}>
              <Text numberOfLines={1} style={styles.selectedChipText}>{name}</Text>
              <Text aria-hidden style={styles.removeGlyph}>×</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ModeChoice({label, selected, onPress}: {label: string; selected: boolean; onPress: () => void}) {
  return (
    <Pressable aria-checked={selected} accessibilityRole="radio" accessibilityState={{checked: selected}}
      onPress={onPress} style={({pressed}) => [styles.modeChoice, selected && styles.modeChoiceSelected, pressed && styles.pressed]}>
      <Text style={[styles.modeChoiceText, selected && styles.modeChoiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function IngredientOption({entry, locale, included, excluded, onChoose}: {entry: IngredientEntry; locale: Locale; included: boolean; excluded: boolean; onChoose: (id: string, side: 'include' | 'exclude') => void}) {
  const {ingredient} = entry;
  const name = ingredientName(ingredient, locale);
  return (
    <View style={styles.ingredientRow}>
      <View style={styles.ingredientTop}>
        <IngredientPicture ingredient={ingredient} size={40} />
        <View style={styles.ingredientCopy}>
          <Text numberOfLines={2} style={styles.ingredientName}>{name}</Text>
          {locale !== 'en' && ingredient.name.en && ingredient.name.en !== name ? <Text numberOfLines={1} style={styles.ingredientEnglish}>{ingredient.name.en}</Text> : null}
        </View>
      </View>
      <View style={styles.ingredientActions}>
        <Pressable aria-pressed={included} accessibilityRole="button" accessibilityState={{selected: included}}
          accessibilityLabel={`${findText(locale, 'include')} ${name}`} onPress={() => onChoose(ingredient.id, 'include')}
          style={({pressed}) => [styles.ingredientAction, included && styles.ingredientActionIncluded, pressed && styles.pressed]}>
          <Text style={[styles.ingredientActionText, included && styles.ingredientActionTextActive]}>{findText(locale, 'include')}</Text>
        </Pressable>
        <Pressable aria-pressed={excluded} accessibilityRole="button" accessibilityState={{selected: excluded}}
          accessibilityLabel={`${findText(locale, 'exclude')} ${name}`} onPress={() => onChoose(ingredient.id, 'exclude')}
          style={({pressed}) => [styles.ingredientAction, excluded && styles.ingredientActionExcluded, pressed && styles.pressed]}>
          <Text style={[styles.ingredientActionText, excluded && styles.ingredientActionTextActive]}>{findText(locale, 'exclude')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function selectedIngredientSummary(query: SearchQuery, locale: Locale): string[] {
  return [
    ...(query.ingredientIds ?? []).map((id) => {
      const ingredient = INGREDIENTS_BY_ID.get(id);
      return ingredient ? ingredientName(ingredient, locale) : id;
    }),
    ...(query.excludedIngredientIds ?? []).map((id) => {
      const ingredient = INGREDIENTS_BY_ID.get(id);
      const name = ingredient ? ingredientName(ingredient, locale) : id;
      return `${findText(locale, 'exclude')}: ${name}`;
    }),
  ];
}

export default function IngredientFilters({locale, query, onChange}: {locale: Locale; query: SearchQuery; onChange: (query: SearchQuery) => void}) {
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [focused, setFocused] = useState(false);
  const included = query.ingredientIds ?? [];
  const excluded = query.excludedIngredientIds ?? [];
  const results = useMemo(() => {
    const needle = search.trim();
    return ENTRIES
      .map((entry) => ({entry, score: needle ? scoreTextSearch(needle, searchableFields(entry)) : 0}))
      .filter(({score}) => !needle || score > 0)
      .sort((left, right) => right.score - left.score
        || right.entry.versions.length - left.entry.versions.length
        || ingredientName(left.entry.ingredient, locale).localeCompare(ingredientName(right.entry.ingredient, locale), locale))
      .map(({entry}) => entry);
  }, [locale, search]);

  const choose = (id: string, side: 'include' | 'exclude') => {
    if (side === 'include') {
      const nextIncluded = included.includes(id) ? included.filter((item) => item !== id) : [...included, id];
      const nextExcluded = excluded.filter((item) => item !== id);
      onChange({...query, ingredientIds: nextIncluded.length ? nextIncluded : undefined,
        ingredientMode: nextIncluded.length ? (query.ingredientMode ?? 'all') : undefined,
        excludedIngredientIds: nextExcluded.length ? nextExcluded : undefined});
      return;
    }
    const nextExcluded = excluded.includes(id) ? excluded.filter((item) => item !== id) : [...excluded, id];
    const nextIncluded = included.filter((item) => item !== id);
    onChange({...query, ingredientIds: nextIncluded.length ? nextIncluded : undefined,
      ingredientMode: nextIncluded.length ? (query.ingredientMode ?? 'all') : undefined,
      excludedIngredientIds: nextExcluded.length ? nextExcluded : undefined});
  };
  const remove = (id: string, side: 'include' | 'exclude') => {
    if (side === 'include') {
      const next = included.filter((item) => item !== id);
      onChange({...query, ingredientIds: next.length ? next : undefined, ingredientMode: next.length ? (query.ingredientMode ?? 'all') : undefined});
      return;
    }
    const next = excluded.filter((item) => item !== id);
    onChange({...query, excludedIngredientIds: next.length ? next : undefined});
  };

  return (
    <View>
      <Text style={styles.scopeNote}>{findText(locale, 'ingredientScope')}</Text>
      <Text style={styles.scopeNote}>{findText(locale, 'excludeScope')}</Text>
      <SelectedIngredients locale={locale} ids={included} title={findText(locale, 'includeSelected')} onRemove={(id) => remove(id, 'include')} />
      <SelectedIngredients locale={locale} ids={excluded} title={findText(locale, 'excludeSelected')} onRemove={(id) => remove(id, 'exclude')} />
      <View accessibilityRole="radiogroup" accessibilityLabel={findText(locale, 'ingredientMode')} style={styles.modeGroup}>
        <Text style={styles.groupTitle}>{findText(locale, 'ingredientMode')}</Text>
        <View style={styles.chips}>
          <ModeChoice label={findText(locale, 'allIngredients')} selected={(query.ingredientMode ?? 'all') === 'all'} onPress={() => onChange({...query, ingredientMode: 'all'})} />
          <ModeChoice label={findText(locale, 'anyIngredient')} selected={query.ingredientMode === 'any'} onPress={() => onChange({...query, ingredientMode: 'any'})} />
        </View>
      </View>
      <Text style={styles.conflictNote}>{findText(locale, 'ingredientConflictNote')}</Text>
      <Text style={styles.fieldLabel}>{findText(locale, 'ingredientSearch')}</Text>
      <View style={[styles.searchField, focused && styles.searchFieldFocused]}>
        <TextInput accessibilityLabel={findText(locale, 'ingredientSearch')} autoCapitalize="none" autoCorrect={false}
          onBlur={() => setFocused(false)} onFocus={() => setFocused(true)}
          onChangeText={(value) => { setSearch(value); setLimit(PAGE_SIZE); }}
          placeholder={findText(locale, 'ingredientSearch')} placeholderTextColor={colors.muted}
          style={styles.searchInput} value={search} />
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.resultCount}>{findText(locale, 'ingredientResults', {count: results.length})}</Text>
      <View style={styles.listViewport}>
        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator contentContainerStyle={styles.list}>
          {results.slice(0, limit).map((entry) => <IngredientOption key={entry.ingredient.id} entry={entry} locale={locale}
            included={included.includes(entry.ingredient.id)} excluded={excluded.includes(entry.ingredient.id)} onChoose={choose} />)}
          {!results.length ? <Text style={styles.emptyText}>{findText(locale, 'noIngredientResults')}</Text> : null}
        </ScrollView>
      </View>
      {results.length > limit ? <Pressable accessibilityRole="button" onPress={() => setLimit((current) => current + PAGE_SIZE)}
        style={({pressed}) => [styles.moreButton, pressed && styles.pressed]}>
        <Text style={styles.moreButtonText}>{findText(locale, 'showMoreIngredients')}</Text>
      </Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scopeNote: {color: colors.secondary, fontSize: 13, lineHeight: 20, marginBottom: 12},
  selectedGroup: {gap: 8, marginBottom: 14},
  selectedLabel: {color: colors.muted, fontSize: 12, lineHeight: 18, fontWeight: '700'},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  selectedChip: {minHeight: 44, maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.accentDark},
  selectedChipText: {maxWidth: 230, color: colors.text, fontSize: 13, fontWeight: '600'},
  removeGlyph: {color: colors.accent, fontSize: 18, lineHeight: 18},
  modeGroup: {gap: 10, marginTop: 4, marginBottom: 6},
  groupTitle: {color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '700'},
  modeChoice: {minHeight: 44, maxWidth: '100%', justifyContent: 'center', paddingHorizontal: 13, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border},
  modeChoiceSelected: {borderColor: colors.accent, backgroundColor: colors.accentDark},
  modeChoiceText: {color: colors.secondary, fontSize: 13, lineHeight: 18},
  modeChoiceTextSelected: {color: colors.text, fontWeight: '700'},
  conflictNote: {color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 16},
  fieldLabel: {color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '700', marginBottom: 7},
  searchField: {minHeight: 50, borderWidth: 1, borderColor: colors.border, borderRadius: radii.small, backgroundColor: colors.background, paddingHorizontal: 14, justifyContent: 'center'},
  searchFieldFocused: {borderColor: colors.accent, outlineColor: colors.accent, outlineStyle: 'solid', outlineWidth: 2, outlineOffset: 2} as never,
  searchInput: {minHeight: 48, color: colors.text, fontSize: 15, outlineStyle: 'none'} as never,
  resultCount: {color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 9, marginBottom: 9},
  listViewport: {maxHeight: 320},
  list: {gap: 7},
  ingredientRow: {gap: 7, paddingVertical: 7, paddingHorizontal: 7, borderRadius: radii.small, backgroundColor: colors.raised},
  ingredientTop: {width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8},
  ingredientCopy: {flex: 1, minWidth: 0},
  ingredientName: {color: colors.text, fontSize: 14, lineHeight: 19, fontWeight: '600'},
  ingredientEnglish: {color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 1},
  ingredientActions: {width: '100%', flexDirection: 'row', gap: 8, paddingLeft: 48},
  ingredientAction: {flex: 1, minHeight: 44, minWidth: 0, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center', borderRadius: radii.small, borderWidth: 1, borderColor: colors.border},
  ingredientActionIncluded: {backgroundColor: colors.accent, borderColor: colors.accent},
  ingredientActionExcluded: {backgroundColor: colors.danger, borderColor: colors.danger},
  ingredientActionText: {color: colors.secondary, fontSize: 11, lineHeight: 15, fontWeight: '700', textAlign: 'center'},
  ingredientActionTextActive: {color: colors.background},
  emptyText: {color: colors.secondary, fontSize: 14, lineHeight: 21, paddingVertical: 16},
  moreButton: {minHeight: 44, marginTop: 12, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border},
  moreButtonText: {color: colors.accent, fontSize: 13, fontWeight: '700'},
  pressed: {opacity: 0.7},
});
