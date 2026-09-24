import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import type {Locale} from '../../../domain/contracts';
import {topicDirectoryText} from '../../../i18n/topic-directory';
import {colors, radii} from '../../../theme/tokens';

export default function TopicSelector({locale, onBack}: {locale: Locale; onBack: () => void}) {
  return (
    <View style={styles.navigation}>
      <Pressable accessibilityRole="button" accessibilityLabel={topicDirectoryText(locale, 'backToDirectory')}
        onPress={onBack} style={({pressed}) => [styles.back, pressed && styles.pressed]}>
        <Text style={styles.backText}>{topicDirectoryText(locale, 'backToDirectory')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  navigation:{flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderColor:colors.border,paddingBottom:8},
  back:{minHeight:44,justifyContent:'center',paddingVertical:10,paddingHorizontal:10,borderRadius:radii.small},
  backText:{color:colors.accent,fontSize:13,lineHeight:19,fontWeight:'700'},
  pressed:{opacity:0.72},
});
