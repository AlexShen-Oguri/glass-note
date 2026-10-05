import React from 'react';
import {View, type ViewProps} from 'react-native';

export function MotionFavorite({selected: _selected, ...props}: ViewProps & {selected: boolean}) {
  return <View {...props} />;
}
