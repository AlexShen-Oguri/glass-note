import React, {useEffect, useRef} from 'react';
import {Animated, Easing, View, type ViewProps} from 'react-native';
import {useMotionEnabled} from './useMotionEnabled';

type SelectionProps = ViewProps & {selected: boolean; feedbackKey?: string};

export function MotionSelection({selected, feedbackKey: _feedbackKey, ...props}: SelectionProps) {
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

export function MotionSelectionRule({selected, feedbackKey: _feedbackKey, ...props}: SelectionProps) {
  return <View {...props} style={[props.style, {opacity: selected ? 1 : 0}]} />;
}

export function MotionSelectionSummary({changeKey: _changeKey, ...props}: ViewProps & {changeKey: string}) {
  return <View {...props} />;
}
