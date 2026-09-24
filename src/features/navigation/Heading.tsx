import React from 'react';
import {Platform, Text, type TextProps} from 'react-native';

/** Native heading traits and a real, leveled heading on React Native Web. */
export function Heading({level = 1, ...props}: TextProps & {level?: 1 | 2 | 3}) {
  return <Text {...props} accessibilityRole="header" {...(Platform.OS === 'web' ? {'aria-level': level} : {})} />;
}
