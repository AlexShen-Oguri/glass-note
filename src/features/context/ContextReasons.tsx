import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import type {Locale} from '../../domain/contracts';
import type {ContextReason} from '../../domain/context/types';
import {contextReasonLabel, contextText, occasionLabel, seasonLabel} from '../../i18n/context';
import {colors} from '../../theme/tokens';

export function ContextReasons({locale, reasons}: {locale: Locale; reasons: readonly ContextReason[]}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrap}>
      <Pressable aria-expanded={open} accessibilityRole="button" accessibilityState={{expanded: open}} onPress={() => setOpen((current) => !current)} style={({pressed}) => [styles.trigger, pressed && styles.pressed]}>
        <Text style={styles.triggerText}>{contextText(locale, 'reasonTitle')}</Text>
        <Text style={styles.action}>{contextText(locale, open ? 'closeDetails' : 'details')}</Text>
      </Pressable>
      {open ? (
        <View style={styles.details}>
          <Text style={styles.basis}>{contextText(locale, 'editorialBasis')}</Text>
          {reasons.length ? reasons.map((reason, index) => {
            const value = reason.dimension === 'occasion'
              ? occasionLabel(locale, reason.value as Parameters<typeof occasionLabel>[1])
              : seasonLabel(locale, reason.value as Parameters<typeof seasonLabel>[1]);
            return <Text key={`${reason.dimension}-${reason.value}-${reason.code}-${index}`} style={styles.reason}>{value} · {contextReasonLabel(locale, reason.code)}</Text>;
          }) : <Text style={styles.reason}>{contextText(locale, 'noSpecificBasis')}</Text>}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {borderTopWidth: 1, borderTopColor: colors.border},
  trigger: {minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 14},
  triggerText: {color: colors.amber, fontSize: 12, lineHeight: 18, fontWeight: '700'},
  action: {color: colors.accent, fontSize: 12, lineHeight: 18, fontWeight: '700'},
  details: {gap: 7, paddingHorizontal: 14, paddingBottom: 14},
  basis: {color: colors.muted, fontSize: 12, lineHeight: 18},
  reason: {color: colors.secondary, fontSize: 13, lineHeight: 19},
  pressed: {opacity: 0.7},
});
