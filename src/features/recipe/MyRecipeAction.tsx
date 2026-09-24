import React from 'react';
import {Link} from 'expo-router';
import {Pressable, StyleSheet, Text} from 'react-native';

import type {Locale} from '../../domain/contracts';
import {backupText} from '../../i18n/backup';
import {colors, radii} from '../../theme/tokens';

export function MyRecipeAction({versionId, locale}: {versionId: string; locale: Locale}) {
  return (
    <Link href={{pathname: '/my-recipes', params: {fromVersion: versionId}} as never} asChild>
      <Pressable accessibilityRole="link" style={StyleSheet.flatten([styles.action])}>
        <Text style={styles.text}>{backupText(locale, 'adapt')}</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  action: {alignSelf: 'stretch', minHeight: 46, justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radii.small},
  text: {color: colors.accent, fontSize: 14, fontWeight: '700'},
  pressed: {opacity: 0.7},
});
