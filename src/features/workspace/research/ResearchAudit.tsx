import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import type {Locale} from '../../../domain/contracts';
import type {DisclosureWorkReview} from '../../../content/source-disclosure';
import {disclosureDimensionText, disclosureEditorialText, disclosureNoteText, disclosureStatusText, sourceDisclosureText} from '../../../i18n/source-disclosure';
import {colors, radii} from '../../../theme/tokens';
import {Fold, ws} from '../ui';

export default function ResearchAudit({locale, review}: {locale: Locale; review: DisclosureWorkReview}) {
  return (
    <Fold title={sourceDisclosureText(locale, 'reviewTitle')}>
      <Text style={styles.boundary}>{sourceDisclosureText(locale, 'researchOnly')}</Text>
      <Text style={styles.translation}>{sourceDisclosureText(locale, 'translationReview')}</Text>
      <View style={styles.section}>
        <Text style={ws.label}>{sourceDisclosureText(locale, 'factLayer')} · {sourceDisclosureText(locale, 'completeness')}</Text>
        {review.dimensions.map((item) => (
          <View key={item.dimension} style={styles.dimension}>
            <View style={styles.dimensionTop}>
              <Text style={styles.dimensionName}>{disclosureDimensionText(locale, item.dimension)}</Text>
              <Text style={[styles.status, item.status === 'published' && styles.published, item.status === 'partial' && styles.partial]}>{disclosureStatusText(locale, item.status)}</Text>
            </View>
            <Text style={ws.muted}>{disclosureNoteText(locale, item.note)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.editorial}>
        <Text style={ws.label}>{sourceDisclosureText(locale, 'editorialLayer')}</Text>
        <Text style={ws.body}>{disclosureEditorialText(locale, review.editorialNote)}</Text>
      </View>
    </Fold>
  );
}

const styles = StyleSheet.create({
  boundary: {color: colors.text, fontSize: 13, lineHeight: 21, padding: 12, borderRadius: radii.small, backgroundColor: colors.accentDark},
  translation: {color: colors.muted, fontSize: 12, lineHeight: 19},
  section: {gap: 9},
  dimension: {gap: 4, paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.border},
  dimensionTop: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8},
  dimensionName: {color: colors.text, fontSize: 13, lineHeight: 19, fontWeight: '700'},
  status: {color: colors.muted, fontSize: 11, lineHeight: 17, fontWeight: '800', textTransform: 'uppercase'},
  published: {color: colors.accent},
  partial: {color: colors.amber},
  source: {gap: 4, padding: 11, borderRadius: radii.small, borderWidth: 1, borderColor: colors.border},
  sourceTitle: {color: colors.text, fontSize: 13, lineHeight: 19, fontWeight: '700'},
  available: {color: colors.accent, fontSize: 12, lineHeight: 18},
  unavailable: {color: colors.amber, fontSize: 12, lineHeight: 18},
  sourceLink: {minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', paddingRight: 8},
  sourceLinkText: {color: colors.accent, fontSize: 12, lineHeight: 18, fontWeight: '700'},
  editorial: {gap: 7, padding: 12, borderRadius: radii.small, backgroundColor: colors.raised},
});
