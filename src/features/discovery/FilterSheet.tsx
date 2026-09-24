import React, {useEffect, useRef, useState} from 'react';
import {Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

import {catalogue} from '../../content/catalogue';
import {MIXING_METHODS, type Approachability, type Base, type Exclusion, type Flavour, type Locale, type MixingMethod, type SearchQuery, type Strength, type Taste} from '../../domain/contracts';
import {findText} from '../../i18n/find';
import {t} from '../../i18n/ui';
import type {UiKey} from '../../i18n/keys';
import {colors, radii} from '../../theme/tokens';
import {serif, useViewport} from './components';
import {lib} from '../../i18n/library';
import {Heading} from '../navigation/Heading';
import {p02DiscoveryText} from '../../i18n/p02-discovery';
import IngredientFilters, {selectedIngredientSummary} from './IngredientFilters';

const flavours: Flavour[] = ['citrus', 'fruit', 'floral', 'herbal', 'spice', 'coffee'];
const tastes: Taste[] = ['sour', 'sweet', 'bitter', 'dry', 'creamy', 'refreshing'];
const bases: Base[] = ['gin', 'rum', 'tequila', 'whiskey', 'vodka', 'brandy', 'mezcal', 'cachaca', 'grappa', 'none'];
const strengths: Strength[] = ['none', 'low', 'medium', 'strong'];
const approaches: Approachability[] = ['gentle', 'balanced', 'bold'];
const exclusions: Exclusion[] = ['egg', 'dairy', 'gin', 'rum', 'tequila', 'whiskey', 'vodka', 'brandy', 'mezcal', 'cachaca', 'grappa'];
const methodCoverage = catalogue.versions.filter((version) => (version.mixingMethods?.length ?? 0) > 0).length;

function toggle<T extends string>(values: T[] | undefined, value: T): T[] | undefined {
  const current = values ?? [];
  const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
  return next.length ? next : undefined;
}

function FilterChoice({label, selected, onPress}: {label: string; selected: boolean; onPress: () => void}) {
  return (
    <Pressable aria-checked={selected} accessibilityRole="checkbox" accessibilityState={{checked: selected}}
      onPress={onPress} style={({pressed}) => [styles.choice, selected && styles.choiceSelected, pressed && styles.pressed]}>
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function Group<T extends string>({
  title,
  values,
  selected,
  label,
  onToggle,
}: {
  title: string;
  values: T[];
  selected?: T[];
  label: (value: T) => string;
  onToggle: (value: T) => void;
}) {
  return (
    <View style={styles.group}>
      <Heading level={3} style={styles.groupTitle}>{title}</Heading>
      <View style={styles.chips}>
        {values.map((value) => (
          <FilterChoice key={value} label={label(value)} selected={selected?.includes(value) ?? false} onPress={() => onToggle(value)} />
        ))}
      </View>
    </View>
  );
}

function OptionalGroup<T extends string>({
  title,
  values,
  selected,
  label,
  onToggle,
  expanded,
  onExpandedChange,
  locale,
  note,
}: {
  title: string;
  values: T[];
  selected?: T[];
  label: (value: T) => string;
  onToggle: (value: T) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  locale: Locale;
  note?: string;
}) {
  const selectedLabels = (selected ?? []).map(label);
  const action = p02DiscoveryText(locale, expanded ? 'hideOptions' : 'showOptions');
  return (
    <View style={styles.optionalGroup}>
      <Pressable
        aria-expanded={expanded}
        accessibilityRole="button"
        accessibilityState={{expanded}}
        accessibilityLabel={`${title}. ${selectedLabels.length} ${p02DiscoveryText(locale, 'selected')}. ${action}`}
        onPress={() => onExpandedChange(!expanded)}
        style={({pressed}) => [styles.groupToggle, pressed && styles.pressed]}
      >
        <View style={styles.groupToggleCopy}>
          <Heading level={3} style={styles.groupTitle}>{title}</Heading>
          {selectedLabels.length ? <Text numberOfLines={1} style={styles.selectionSummary}>{selectedLabels.join(', ')}</Text> : null}
        </View>
        <Text style={styles.groupAction}>{action}</Text>
      </Pressable>
      {expanded ? (
        <View style={styles.optionalContent}>
          <View style={styles.chips}>
            {values.map((value) => (
              <FilterChoice key={value} label={label(value)} selected={selected?.includes(value) ?? false} onPress={() => onToggle(value)} />
            ))}
          </View>
          {note ? <Text style={styles.exclusionNote}>{note}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

function DisclosureGroup({title, summary, expanded, onExpandedChange, locale, children}: {title: string; summary: readonly string[]; expanded: boolean; onExpandedChange: (expanded: boolean) => void; locale: Locale; children: React.ReactNode}) {
  const action = p02DiscoveryText(locale, expanded ? 'hideOptions' : 'showOptions');
  return (
    <View style={styles.optionalGroup}>
      <Pressable aria-expanded={expanded} accessibilityRole="button" accessibilityState={{expanded}}
        accessibilityLabel={`${title}. ${summary.length} ${p02DiscoveryText(locale, 'selected')}. ${action}`}
        onPress={() => onExpandedChange(!expanded)} style={({pressed}) => [styles.groupToggle, pressed && styles.pressed]}>
        <View style={styles.groupToggleCopy}>
          <Heading level={3} style={styles.groupTitle}>{title}</Heading>
          {summary.length ? <Text numberOfLines={2} style={styles.selectionSummary}>{summary.join(', ')}</Text> : null}
        </View>
        <Text style={styles.groupAction}>{action}</Text>
      </Pressable>
      {expanded ? <View style={styles.optionalContent}>{children}</View> : null}
    </View>
  );
}

function MethodOption({method, locale, selected, onToggle}: {method: MixingMethod; locale: Locale; selected: boolean; onToggle: () => void}) {
  return (
    <View style={styles.methodRow}>
      <FilterChoice label={findText(locale, `method_${method}`)} selected={selected} onPress={onToggle} />
      <Text style={styles.methodHint}>{findText(locale, `method_${method}Hint`)}</Text>
    </View>
  );
}

export default function FilterSheet({
  visible,
  locale,
  draft,
  onChange,
  onApply,
  onReset,
  onClose,
  pauseMotion,
}: {
  visible: boolean;
  locale: Locale;
  draft: SearchQuery;
  onChange: (query: SearchQuery) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
  pauseMotion: boolean;
}) {
  const {width} = useViewport();
  const compact = width < 720;
  const closeButtonRef = useRef<{focus?: () => void} | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [expanded, setExpanded] = useState({ingredients: false, methods: false, tastes: false, strength: false, approachability: false, excluded: false, preparation: false});
  const keyed = (prefix: string, value: string) => t(locale, `${prefix}.${value}` as UiKey);
  useEffect(() => {
    if (!visible) return;
    setExpanded({
      ingredients: Boolean(draft.ingredientIds?.length || draft.excludedIngredientIds?.length),
      methods: Boolean(draft.methods?.length),
      tastes: Boolean(draft.tastes?.length),
      strength: Boolean(draft.strengths?.length),
      approachability: Boolean(draft.approachability?.length),
      excluded: Boolean(draft.excluded?.length),
      preparation: Boolean(draft.preparationDisclosed),
    });
  }, [visible]);
  useEffect(() => {
    if (!visible || Platform.OS !== 'web' || typeof document === 'undefined') return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onCloseRef.current();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible]);
  const focusClose = () => setTimeout(() => closeButtonRef.current?.focus?.(), 0);
  const ingredientSummary = selectedIngredientSummary(draft, locale);
  const methodSummary = (draft.methods ?? []).map((method) => findText(locale, `method_${method}`));
  return (
    <Modal transparent={!compact} visible={visible} animationType={pauseMotion ? 'none' : compact ? 'slide' : 'fade'} onRequestClose={onClose} onShow={focusClose}>
      <View style={[styles.backdrop, compact && styles.compactBackdrop]}>
        <Pressable accessibilityRole="button" style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t(locale, 'close')} />
        <View accessibilityViewIsModal style={[styles.sheet, compact && styles.sheetCompact]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Heading level={2} style={styles.title}>{p02DiscoveryText(locale, 'filterTitle')}</Heading>
              <Text style={styles.hint}>{p02DiscoveryText(locale, 'filterHint')}</Text>
            </View>
            <Pressable ref={closeButtonRef as never} accessibilityRole="button" accessibilityLabel={t(locale, 'close')} onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Group title={t(locale, 'bases')} values={bases} selected={draft.bases} label={(value) => keyed('base', value)} onToggle={(value) => onChange({...draft, bases: toggle(draft.bases, value)})} />
            <Group title={t(locale, 'flavours')} values={flavours} selected={draft.flavours} label={(value) => keyed('flavour', value)} onToggle={(value) => onChange({...draft, flavours: toggle(draft.flavours, value)})} />
            <DisclosureGroup locale={locale} title={findText(locale, 'ingredients')} summary={ingredientSummary}
              expanded={expanded.ingredients} onExpandedChange={(value) => setExpanded((current) => ({...current, ingredients: value}))}>
              <IngredientFilters locale={locale} query={draft} onChange={onChange} />
            </DisclosureGroup>
            <DisclosureGroup locale={locale} title={findText(locale, 'methods')} summary={methodSummary}
              expanded={expanded.methods} onExpandedChange={(value) => setExpanded((current) => ({...current, methods: value}))}>
              <Text style={styles.exclusionNote}>{findText(locale, 'methodScope')}</Text>
              <View style={styles.methodList}>
                {MIXING_METHODS.map((method) => <MethodOption key={method} method={method} locale={locale}
                  selected={draft.methods?.includes(method) ?? false}
                  onToggle={() => onChange({...draft, methods: toggle(draft.methods, method)})} />)}
              </View>
              <Text style={styles.coverage}>{findText(locale, 'methodCoverage', {count: methodCoverage})}</Text>
            </DisclosureGroup>
            <OptionalGroup locale={locale} title={t(locale, 'tastes')} values={tastes} selected={draft.tastes} label={(value) => keyed('taste', value)} onToggle={(value) => onChange({...draft, tastes: toggle(draft.tastes, value)})} expanded={expanded.tastes} onExpandedChange={(value) => setExpanded((current) => ({...current, tastes: value}))} />
            <OptionalGroup locale={locale} title={t(locale, 'strength')} values={strengths} selected={draft.strengths} label={(value) => keyed('strength', value)} onToggle={(value) => onChange({...draft, strengths: toggle(draft.strengths, value)})} expanded={expanded.strength} onExpandedChange={(value) => setExpanded((current) => ({...current, strength: value}))} />
            <OptionalGroup locale={locale} title={t(locale, 'approachability')} values={approaches} selected={draft.approachability} label={(value) => keyed('approach', value)} onToggle={(value) => onChange({...draft, approachability: toggle(draft.approachability, value)})} expanded={expanded.approachability} onExpandedChange={(value) => setExpanded((current) => ({...current, approachability: value}))} />
            <OptionalGroup locale={locale} title={t(locale, 'exclude')} values={exclusions} selected={draft.excluded} label={(value) => value === 'egg' || value === 'dairy' ? keyed('exclude', value) : keyed('base', value)} onToggle={(value) => onChange({...draft, excluded: toggle(draft.excluded, value)})} expanded={expanded.excluded} onExpandedChange={(value) => setExpanded((current) => ({...current, excluded: value}))} note={t(locale, 'exclusionNote')} />
            <OptionalGroup locale={locale} title={p02DiscoveryText(locale, 'preparation')} values={['documented']} selected={draft.preparationDisclosed ? ['documented'] : undefined} label={() => lib(locale, 'documented')} onToggle={() => onChange({...draft, preparationDisclosed: !draft.preparationDisclosed})} expanded={expanded.preparation} onExpandedChange={(value) => setExpanded((current) => ({...current, preparation: value}))} />
          </ScrollView>
          <View style={styles.footer}>
            <Pressable accessibilityRole="button" onPress={onReset} style={({pressed}) => [styles.resetButton, pressed && styles.pressed]}>
              <Text style={styles.resetText}>{t(locale, 'reset')}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onApply} style={({pressed}) => [styles.applyButton, pressed && styles.pressed]}>
              <Text style={styles.applyText}>{t(locale, 'apply')}</Text>
              <Text style={styles.applyArrow}>→</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: 'rgba(4,8,6,0.74)', alignItems: 'center', justifyContent: 'center', padding: 24},
  compactBackdrop: {padding: 0, justifyContent: 'flex-end'},
  sheet: {width: '100%', maxWidth: 760, maxHeight: '90%', backgroundColor: colors.panel, borderRadius: radii.large, borderWidth: 1, borderColor: colors.border, overflow: 'hidden'},
  sheetCompact: {maxHeight: '96%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0},
  handle: {width: 42, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: 10},
  header: {paddingHorizontal: 24, paddingTop: 14, paddingBottom: 18, flexDirection: 'row', justifyContent: 'space-between', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border},
  headerCopy: {flex: 1},
  title: {color: colors.text, fontFamily: serif, fontSize: 28, lineHeight: 34},
  hint: {color: colors.secondary, fontSize: 14, lineHeight: 21, marginTop: 7},
  closeButton: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
  closeText: {color: colors.secondary, fontSize: 28, fontWeight: '300'},
  content: {padding: 24, paddingBottom: 30},
  group: {marginBottom: 24, gap: 10},
  groupTitle: {color: colors.text, fontSize: 15, lineHeight: 20, fontWeight: '700'},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  choice: {minHeight: 44, maxWidth: '100%', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill},
  choiceSelected: {borderColor: colors.accent, backgroundColor: colors.accentDark},
  choiceText: {color: colors.secondary, fontSize: 13, lineHeight: 18, flexShrink: 1},
  choiceTextSelected: {color: colors.text, fontWeight: '700'},
  optionalGroup: {borderTopWidth: 1, borderTopColor: colors.border},
  groupToggle: {minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingVertical: 10},
  groupToggleCopy: {flex: 1, minWidth: 0},
  groupAction: {color: colors.accent, fontSize: 13, lineHeight: 18, fontWeight: '700'},
  selectionSummary: {color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3},
  optionalContent: {paddingBottom: 20},
  exclusionNote: {color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 10},
  methodList: {gap: 14, marginTop: 14},
  methodRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  methodHint: {flex: 1, color: colors.secondary, fontSize: 13, lineHeight: 19},
  coverage: {color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 18},
  footer: {padding: 16, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', gap: 10},
  resetButton: {minHeight: 50, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border},
  resetText: {color: colors.secondary, fontSize: 14, fontWeight: '700'},
  applyButton: {minHeight: 50, flex: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12, borderRadius: radii.pill, backgroundColor: colors.accent},
  applyText: {color: colors.background, fontSize: 14, fontWeight: '800'},
  applyArrow: {color: colors.background, fontSize: 20},
  pressed: {opacity: 0.72},
});
