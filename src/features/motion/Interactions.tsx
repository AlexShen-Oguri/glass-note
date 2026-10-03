import React from 'react';
import {View, type ViewProps} from 'react-native';

export function MotionInteractions({changeKey: _changeKey, ...props}: ViewProps & {changeKey: string}) {
  return <View {...props} />;
}
