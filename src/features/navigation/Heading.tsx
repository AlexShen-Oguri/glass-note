import React from 'react';
import {Platform, StyleSheet, Text, type TextProps} from 'react-native';
import {useViewport} from '../discovery/components';

/** Native heading traits and a real, leveled heading on React Native Web. */
export function Heading({level = 1, style, ...props}: TextProps & {level?: 1 | 2 | 3}) {
  const {width} = useViewport();
  const declared = StyleSheet.flatten(style);
  const minimum = width >= 1024 ? 64 : width >= 760 ? 54 : 38;
  const size = Math.max(declared?.fontSize ?? minimum, minimum);
  const display = level === 1 ? {fontSize:size, lineHeight:Math.ceil(size * 1.18), fontWeight:'400' as const} : undefined;
  return <Text {...props} style={[style, display]} accessibilityRole="header" {...(Platform.OS === 'web' ? {'aria-level': level} : {})} />;
}
