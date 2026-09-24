import React from 'react';
import {Image, type ImageSourcePropType, StyleSheet, View} from 'react-native';

const markSource = require('../../../assets/brand/mark-ivory.png') as ImageSourcePropType;
const lockupSource = require('../../../assets/brand/lockup-ivory.png') as ImageSourcePropType;

export function BrandMark({size, decorative = false}: {size: number; decorative?: boolean}) {
  return (
    <Image
      accessibilityElementsHidden={decorative}
      accessibilityLabel={decorative ? undefined : 'Glass Notes'}
      accessibilityRole={decorative ? undefined : 'image'}
      accessible={!decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      resizeMode="contain"
      source={markSource}
      style={{width: size, height: size}}
    />
  );
}

export function BrandLockup({compact = false}: {compact?: boolean}) {
  return (
    <View style={[styles.lockup, compact && styles.lockupCompact]}>
      <Image
        accessibilityLabel="Glass Notes"
        accessibilityRole="image"
        resizeMode="contain"
        source={lockupSource}
        style={styles.lockupImage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: {width: 160, height: 42.96875, flexShrink: 0},
  lockupCompact: {width: 112, height: 30.078125},
  lockupImage: {width: '100%', height: '100%'},
});
