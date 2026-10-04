import React from 'react';
import {Platform, StyleSheet, Text, type TextProps} from 'react-native';
import {motionData} from '../motion/attributes';
import {useViewport} from '../discovery/components';

/** Native heading traits and a real, leveled heading on React Native Web. */
export function Heading({level = 1, style, ...props}: TextProps & {level?: 1 | 2 | 3}) {
  const {width} = useViewport();
  const declared = StyleSheet.flatten(style);
  const minimum = width >= 1024 ? 64 : width >= 760 ? 54 : 38;
  const size = declared?.fontSize ?? minimum;
  const display = level === 1 ? {fontSize:size, lineHeight:declared?.lineHeight ?? Math.ceil(size * 1.13), fontWeight:declared?.fontWeight ?? '400' as const} : undefined;
  if(level===1&&Platform.OS==='web'){
    const {children,...rest}=props;
    return <Text {...rest} accessibilityRole="header" aria-level={level} style={[style,display,{overflow:'hidden',paddingBottom:size*.11,marginBottom:(declared?.marginBottom as number??0)-size*.11}]}><Text {...motionData({motionPart:'title-line'})} style={{display:'block'} as unknown as TextProps['style']}>{children}</Text></Text>;
  }
  return <Text {...props} style={[style, display]} accessibilityRole="header" {...(Platform.OS === 'web' ? {'aria-level': level} : {})} />;
}
