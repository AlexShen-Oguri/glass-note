import React, {useEffect, useRef} from 'react';
import {Animated, Easing, type ViewProps} from 'react-native';
import {useMotionEnabled} from './useMotionEnabled';

export function MotionSelection({selected, ...props}: ViewProps & {selected: boolean}) {
  const value = useRef(new Animated.Value(1)).current;
  const previous = useRef(selected);
  const enabled = useMotionEnabled();
  useEffect(() => {
    const changed = previous.current !== selected;
    previous.current = selected;
    value.stopAnimation();
    if (!changed || !enabled) {value.setValue(1); return;}
    value.setValue(selected ? 0.72 : 1.08);
    const tween = Animated.timing(value, {toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true});
    tween.start();
    return () => tween.stop();
  }, [selected, enabled, value]);
  return <Animated.View {...props} style={[props.style, {transform: [{scale: value}]}]} />;
}
