import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing, Pressable, StyleSheet, Text, View} from 'react-native';
import type {Cocktail, Locale, MediaAsset} from '../../domain/contracts';
import {t} from '../../i18n/ui';
import {colors} from '../../theme/tokens';
import {useMotionEnabled} from '../motion/useMotionEnabled';

export interface GuidedRevealCandidate extends Pick<Cocktail, 'id' | 'name' | 'accent'> {asset?: MediaAsset;}
export interface GuidedRevealProps {
  revealing: boolean;
  motionAllowed: boolean;
  activeWindow: boolean;
  locale: Locale;
  candidates: GuidedRevealCandidate[];
  resultPhotoRefs: React.MutableRefObject<Map<string, View>>;
  onFinish: () => void;
  children: (resultPhotoOpacity?: Animated.Value) => React.ReactNode;
}

/** Native presentation follows the same immediate, interruptible result handoff. */
export function GuidedReveal({revealing, motionAllowed, activeWindow, children, locale, onFinish}: GuidedRevealProps) {
  const enabled = useMotionEnabled() && motionAllowed && activeWindow;
  const progress = useRef(new Animated.Value(1)).current;
  const animation = useRef<Animated.CompositeAnimation | null>(null);
  const issued = useRef(false);
  const started = useRef(revealing);
  const finish = useRef(onFinish);
  const [complete, setComplete] = useState(!revealing);
  finish.current = onFinish;
  const finishOnce = () => {
    progress.setValue(1);
    setComplete(true);
  };
  useEffect(() => {
    if (!started.current || complete) return;
    if (!issued.current) {issued.current = true; finish.current();}
    if (!enabled) {finishOnce(); return;}
    progress.setValue(0);
    const tween = Animated.timing(progress, {toValue: 1, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: true});
    animation.current = tween;
    tween.start(({finished}) => {if (finished) finishOnce();});
    return () => {tween.stop(); animation.current = null;};
  }, [complete, enabled, progress]);
  return <View style={styles.container}>
    <Animated.View testID="guided-results-layer" style={{opacity: progress.interpolate({inputRange: [0, 1], outputRange: [0.18, 1]}), transform: [{translateY: progress.interpolate({inputRange: [0, 1], outputRange: [24, 0]})}]}}>{children()}</Animated.View>
    {started.current && !complete ? <Pressable testID="guided-reveal-stage" accessibilityRole="button" onPress={() => {animation.current?.stop(); finishOnce();}} style={styles.skip}><Text style={styles.skipText}>{t(locale, 'guidedSkipAnimation')} →</Text></Pressable> : null}
  </View>;
}
const styles = StyleSheet.create({
  container: {position: 'relative', width: '100%'},
  skip: {alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, marginTop: 10},
  skipText: {color: colors.amber, fontSize: 12},
});
