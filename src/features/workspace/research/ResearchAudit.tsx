import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import type {Locale} from '../../../domain/contracts';
import type {Round17WorkReview} from '../../../content/round17-research';
import {round17DimensionText, round17EditorialText, round17NoteText, round17StatusText, round17Text} from '../../../i18n/round17-research';
import {colors, radii} from '../../../theme/tokens';
import {Fold, ws} from '../ui';

export default function ResearchAudit({locale, review}: {locale: Locale; review: Round17WorkReview}) {
  return (
    <Fold title={round17Text(locale, 'reviewTitle')}>
      <Text style={styles.boundary}>{round17Text(locale, 'researchOnly')}</Text>
      <Text style={styles.translation}>{round17Text(locale, 'translationReview')}</Text>
      <View style={styles.section}>
        <Text style={ws.label}>{round17Text(locale, 'factLayer')} · {round17Text(locale, 'completeness')}</Text>
        {review.dimensions.map((item) => (
          <View key={item.dimension} style={styles.dimension}>
            <View style={styles.dimensionTop}>
              <Text style={styles.dimensionName}>{round17DimensionText(locale, item.dimension)}</Text>
              <Text style={[styles.status, item.status === 'published' && styles.published, item.status === 'partial' && styles.partial]}>{round17StatusText(locale, item.status)}</Text>
            </View>
            <Text style={ws.muted}>{round17NoteText(locale, item.note)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.editorial}>
        <Text style={ws.label}>{round17Text(locale, 'editorialLayer')}</Text>
        <Text style={ws.body}>{round17EditorialText(locale, review.editorialNote)}</Text>
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
