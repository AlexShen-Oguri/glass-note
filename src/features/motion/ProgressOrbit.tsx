import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {colors} from '../../theme/tokens';
import {useMotionEnabled} from './useMotionEnabled';

export function ProgressOrbit({step}: {step: number}) {
  const x = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);
  const enabled = useMotionEnabled();
  useEffect(() => {
    const target = width / 4 * Math.max(0, Math.min(3, step));
    x.stopAnimation();
    if (!enabled) {x.setValue(target); return;}
    const tween = Animated.timing(x, {toValue: target, duration: 450, easing: Easing.inOut(Easing.cubic), useNativeDriver: true});
    tween.start();
    return () => tween.stop();
  }, [step, width, enabled, x]);
  return <View pointerEvents="none" accessible={false} onLayout={event => setWidth(event.nativeEvent.layout.width)} style={styles.track}>
    <Animated.View style={[styles.dot, {transform: [{translateX: x}]}]} />
  </View>;
}
const styles = StyleSheet.create({track: {...StyleSheet.absoluteFill, bottom: undefined, height: 1}, dot: {position: 'absolute', top: -3, left: 0, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.amber}});
