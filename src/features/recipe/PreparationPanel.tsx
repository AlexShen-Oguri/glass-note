import React, {useState} from 'react';
import {Linking, Pressable, StyleSheet, Text, View} from 'react-native';

import type {Locale} from '../../domain/contracts';
import {getRecipePreparation} from '../../domain/preparations';
import {preparationCopy} from '../../i18n/preparations';
import {colors, radii} from '../../theme/tokens';
import {serif} from '../discovery/components';

export interface PreparationPanelProps {
  versionId: string;
  locale: Locale;
  showSources?: boolean;
}

export function PreparationPanel({versionId, locale, showSources=false}: PreparationPanelProps) {
  const preparation = getRecipePreparation(versionId);
  const copy = preparationCopy(locale);
  const [open, setOpen] = useState(false);
  const [openCards, setOpenCards] = useState<Set<string>>(() => new Set());

  if (!preparation) return null;

  const toggleCard = (id: string) => {
    setOpenCards(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <View style={styles.panel}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{expanded: open}}
        accessibilityLabel={open ? copy.hide : copy.show}
        onPress={() => setOpen(value => !value)}
        style={({pressed}) => [styles.heading, pressed && styles.pressed]}
      >
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>{copy.title}</Text>
          <Text style={styles.summary}>{preparation.summary[locale] || preparation.summary.en}</Text>
        </View>
        <View style={styles.headingMeta}>
          <Text style={[styles.status, preparation.status === 'partial' && styles.statusPartial]}>
            {copy[preparation.status]}
          </Text>
          <Text style={styles.chevron}>{open ? '−' : '+'}</Text>
        </View>
      </Pressable>

      {open ? (
        <View style={styles.body}>
          {preparation.gaps.length ? (
            <View style={styles.recipeGaps}>
              <Text style={styles.label}>{copy.gaps}</Text>
              {preparation.gaps.map((gap, index) => <Text key={index} style={styles.gap}>• {gap[locale] || gap.en}</Text>)}
            </View>
          ) : null}

          {preparation.cards.map(card => {
            const cardOpen = openCards.has(card.id);
            const text = (value: Record<Locale, string>) => value[locale] || value.en;
            return (
              <View key={card.id} style={styles.card}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{expanded: cardOpen}}
                  accessibilityLabel={`${text(card.title)} · ${cardOpen ? copy.closeCard : copy.openCard}`}
                  onPress={() => toggleCard(card.id)}
                  style={({pressed}) => [styles.cardHeading, pressed && styles.pressed]}
                >
                  <View style={styles.cardHeadingCopy}>
                    <Text style={styles.cardTitle}>{text(card.title)}</Text>
                    <Text style={styles.cardRole}>{card.role === 'process' ? copy.process : copy.preparedIngredient}</Text>
                  </View>
                  <Text style={styles.chevron}>{cardOpen ? '−' : '+'}</Text>
                </Pressable>

                {cardOpen ? (
                  <View style={styles.cardBody}>
                    {card.inputs.length ? <Detail label={card.role === 'process' ? copy.processInputs : copy.inputs} values={card.inputs.map(text)} /> : null}
                    {card.steps.length ? <Detail label={copy.method} values={card.steps.map(text)} ordered /> : null}
                    {card.equipment ? <Single label={copy.equipment} value={text(card.equipment)} /> : null}
                    {card.timing ? <Single label={copy.timing} value={text(card.timing)} /> : null}
                    {card.temperature ? <Single label={copy.temperature} value={text(card.temperature)} /> : null}
                    {card.yield ? <Single label={copy.yield} value={text(card.yield)} /> : null}
                    {card.gaps.length ? <Detail label={copy.gaps} values={card.gaps.map(text)} /> : null}
                    {showSources ? <View style={styles.sources}>
                      <Text style={styles.label}>{copy.source}</Text>
                      {card.sources.map(source => (
                        <Pressable key={source.url} accessibilityRole="link" onPress={() => Linking.openURL(source.url)} style={styles.sourceLink}>
                          <Text style={styles.sourceText}>{source.title} ↗</Text>
                        </Pressable>
                      ))}
                    </View> : null}
                  </View>
                ) : null}
              </View>
            );
          })}
          {showSources ? <Text style={styles.sourceNote}>{copy.sourceNote}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

function Detail({label, values, ordered = false}: {label: string; values: string[]; ordered?: boolean}) {
  return <View style={styles.detail}><Text style={styles.label}>{label}</Text>{values.map((value, index) => <Text key={index} style={styles.value}>{ordered ? `${index + 1}.` : '•'} {value}</Text>)}</View>;
}

function Single({label, value}: {label: string; value: string}) {
  return <View style={styles.detail}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  panel: {marginTop: 34, borderWidth: 1, borderColor: colors.border, borderRadius: radii.large, backgroundColor: colors.panel, overflow: 'hidden'},
  heading: {minHeight: 76, paddingHorizontal: 18, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 16},
  headingCopy: {flex: 1},
  eyebrow: {color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase'},
  summary: {color: colors.secondary, fontSize: 13, lineHeight: 19, marginTop: 5},
  headingMeta: {alignItems: 'flex-end', gap: 7},
  status: {color: colors.accent, fontSize: 11, fontWeight: '700'},
  statusPartial: {color: colors.amber},
  chevron: {color: colors.accent, fontFamily: serif, fontSize: 23, lineHeight: 24},
  body: {paddingHorizontal: 14, paddingBottom: 16, gap: 10},
  recipeGaps: {borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 4, paddingTop: 14, paddingBottom: 4},
  gap: {color: colors.secondary, fontSize: 13, lineHeight: 20, marginTop: 5},
  card: {borderWidth: 1, borderColor: colors.border, borderRadius: radii.medium, backgroundColor: colors.background},
  cardHeading: {minHeight: 58, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12},
  cardHeadingCopy: {flex: 1},
  cardTitle: {color: colors.text, fontFamily: serif, fontSize: 17, lineHeight: 22},
  cardRole: {color: colors.muted, fontSize: 11, marginTop: 3},
  cardBody: {borderTopWidth: 1, borderTopColor: colors.border, padding: 14, gap: 15},
  detail: {gap: 5},
  label: {color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase'},
  value: {color: colors.secondary, fontSize: 13, lineHeight: 20},
  sources: {gap: 3},
  sourceLink: {minHeight: 34, justifyContent: 'center', alignSelf: 'flex-start'},
  sourceText: {color: colors.accent, fontSize: 13, lineHeight: 19},
  sourceNote: {color: colors.muted, fontSize: 11, lineHeight: 17, paddingHorizontal: 4, paddingTop: 4},
  pressed: {opacity: 0.7},
});

export default PreparationPanel;
