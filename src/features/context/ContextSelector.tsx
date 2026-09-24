import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import type {Locale} from '../../domain/contracts';
import {OCCASIONS, SEASONS, type ContextSelection, type Occasion, type Season} from '../../domain/context/types';
import {contextText, occasionLabel, seasonLabel} from '../../i18n/context';
import {colors, radii} from '../../theme/tokens';

function selectionSummary(locale: Locale, value: ContextSelection): string {
  const labels = [
    value.occasion ? occasionLabel(locale, value.occasion) : null,
    value.season ? seasonLabel(locale, value.season) : null,
  ].filter((label): label is string => Boolean(label));
  return labels.length ? labels.join(' · ') : contextText(locale, 'summaryOpen');
}

function ContextChoice({label, selected, onPress}: {label: string; selected: boolean; onPress: () => void}) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      aria-checked={selected}
      accessibilityRole="radio"
      accessibilityState={{checked: selected}}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onPress={onPress}
      style={({pressed}) => [styles.choice, selected && styles.choiceSelected, focused && styles.focused, pressed && styles.pressed]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function ContextSelector({locale, value, onApply, description}: {locale: Locale; value: ContextSelection; onApply: (value: ContextSelection) => void; description?: string}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ContextSelection>(value);
  const openEditor = () => {
    setDraft(value);
    setOpen(true);
  };
  const cancel = () => {
    setDraft(value);
    setOpen(false);
  };
  const apply = () => {
    onApply(draft);
    setOpen(false);
  };
  const selectOccasion = (occasion?: Occasion) => setDraft((current) => ({...current, occasion}));
  const selectSeason = (season?: Season) => setDraft((current) => ({...current, season}));

  return (
    <View style={styles.selector}>
      <Pressable
        aria-expanded={open}
        accessibilityRole="button"
        accessibilityState={{expanded: open}}
        onPress={open ? cancel : openEditor}
        style={({pressed}) => [styles.disclosure, pressed && styles.pressed]}
      >
        <View style={styles.disclosureCopy}>
          <View style={styles.titleLine}>
            <Text style={styles.title}>{contextText(locale, 'disclosureTitle')}</Text>
            <Text style={styles.optional}>{contextText(locale, 'optional')}</Text>
          </View>
          <Text style={styles.summary}>{selectionSummary(locale, value)}</Text>
        </View>
        <Text style={styles.disclosureAction}>{contextText(locale, open ? 'cancel' : 'change')}</Text>
      </Pressable>
      {open ? (
        <View style={styles.editor}>
          {description ? <Text style={styles.description}>{description}</Text> : null}
          <View style={styles.fieldGroup} accessibilityRole="radiogroup" accessibilityLabel={contextText(locale, 'occasion')}>
            <Text style={styles.fieldLabel}>{contextText(locale, 'occasion')}</Text>
            <View style={styles.choices}>
              <ContextChoice label={contextText(locale, 'anyOccasion')} selected={!draft.occasion} onPress={() => selectOccasion(undefined)} />
              {OCCASIONS.map((occasion) => <ContextChoice key={occasion} label={occasionLabel(locale, occasion)} selected={draft.occasion === occasion} onPress={() => selectOccasion(occasion)} />)}
            </View>
          </View>
          <View style={styles.fieldGroup} accessibilityRole="radiogroup" accessibilityLabel={contextText(locale, 'season')}>
            <Text style={styles.fieldLabel}>{contextText(locale, 'season')}</Text>
            <View style={styles.choices}>
              <ContextChoice label={contextText(locale, 'anySeason')} selected={!draft.season} onPress={() => selectSeason(undefined)} />
              {SEASONS.map((season) => <ContextChoice key={season} label={seasonLabel(locale, season)} selected={draft.season === season} onPress={() => selectSeason(season)} />)}
            </View>
          </View>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={cancel} style={({pressed}) => [styles.cancel, pressed && styles.pressed]}><Text style={styles.cancelText}>{contextText(locale, 'cancel')}</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={apply} style={({pressed}) => [styles.apply, pressed && styles.pressed]}><Text style={styles.applyText}>{contextText(locale, 'apply')}</Text></Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  selector: {width: '100%', marginTop: 20, borderTopWidth: 1, borderTopColor: colors.border, borderBottomWidth: 1, borderBottomColor: colors.border},
  disclosure: {minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingVertical: 9},
  disclosureCopy: {flex: 1, minWidth: 0},
  titleLine: {flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 8, rowGap: 2},
  title: {color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: '700'},
  optional: {color: colors.muted, fontSize: 12, lineHeight: 18},
  summary: {color: colors.secondary, fontSize: 13, lineHeight: 19, marginTop: 2},
  disclosureAction: {color: colors.accent, fontSize: 13, lineHeight: 19, fontWeight: '700'},
  editor: {paddingBottom: 18, gap: 20},
  description: {color: colors.secondary, fontSize: 14, lineHeight: 22, maxWidth: 650},
  fieldGroup: {gap: 8},
  fieldLabel: {color: colors.text, fontSize: 13, lineHeight: 19, fontWeight: '800'},
  choices: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  choice: {minHeight: 44, maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radii.small},
  choiceSelected: {borderColor: colors.accent, backgroundColor: colors.accentDark},
  focused: {borderColor: colors.amber},
  pressed: {opacity: 0.7},
  radio: {width: 16, height: 16, borderWidth: 1, borderColor: colors.secondary, borderRadius: 8, alignItems: 'center', justifyContent: 'center'},
  radioSelected: {borderColor: colors.accent},
  radioDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent},
  choiceText: {color: colors.secondary, fontSize: 13, lineHeight: 19, flexShrink: 1},
  choiceTextSelected: {color: colors.text, fontWeight: '700'},
  actions: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8, paddingTop: 2},
  cancel: {minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: radii.pill},
  cancelText: {color: colors.secondary, fontSize: 14, lineHeight: 20, fontWeight: '700'},
  apply: {minHeight: 44, justifyContent: 'center', paddingHorizontal: 18, borderRadius: radii.pill, backgroundColor: colors.accent},
  applyText: {color: colors.background, fontSize: 14, lineHeight: 20, fontWeight: '800'},
});
