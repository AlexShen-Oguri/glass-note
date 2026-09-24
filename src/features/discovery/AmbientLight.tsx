import React, {useEffect, useRef, useState} from 'react';
import {Animated, AppState, Easing, StyleSheet, View} from 'react-native';

const CYCLE_MS = 32000;

export interface AmbientLightProps {
  paused: boolean;
  reduceMotion?: boolean;
}

function useAppIsActive() {
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => subscription.remove();
  }, []);
  return active;
}

/** A quiet, non-interactive light layer for the page shell. */
export function AmbientLight({paused, reduceMotion = false}: AmbientLightProps) {
  const drift = useRef(new Animated.Value(0.35)).current;
  const breathe = useRef(new Animated.Value(0.35)).current;
  const appIsActive = useAppIsActive();

  useEffect(() => {
    drift.stopAnimation();
    breathe.stopAnimation();

    if (reduceMotion) {
      drift.setValue(0.45);
      breathe.setValue(0.3);
      return;
    }
    if (paused || !appIsActive) return;

    const animation = Animated.loop(Animated.parallel([
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: CYCLE_MS * 0.55,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: CYCLE_MS * 0.45,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: CYCLE_MS * 0.48,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: CYCLE_MS * 0.52,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ]), {resetBeforeIteration: false});
    animation.start();
    return () => animation.stop();
  }, [appIsActive, breathe, drift, paused, reduceMotion]);

  const warmTransform = [
    {translateX: drift.interpolate({inputRange: [0, 1], outputRange: [-68, 52]})},
    {translateY: drift.interpolate({inputRange: [0, 1], outputRange: [-18, 34]})},
    {rotate: '-9deg'},
  ];
  const sageTransform = [
    {translateX: drift.interpolate({inputRange: [0, 1], outputRange: [62, -54]})},
    {translateY: drift.interpolate({inputRange: [0, 1], outputRange: [26, -24]})},
    {rotate: '11deg'},
  ];
  const warmOpacity = breathe.interpolate({inputRange: [0, 1], outputRange: [0.52, 0.78]});
  const sageOpacity = breathe.interpolate({inputRange: [0, 1], outputRange: [0.74, 0.48]});
  const amberOpacity = breathe.interpolate({inputRange: [0, 1], outputRange: [0.38, 0.58]});

  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      style={styles.root}
    >
      <Animated.View style={[styles.warmArc, {opacity: warmOpacity, transform: warmTransform}]} />
      <Animated.View style={[styles.sageArc, {opacity: sageOpacity, transform: sageTransform}]} />
      <Animated.View style={[styles.amberVeil, {opacity: amberOpacity, transform: sageTransform}]} />
    </View>
  );
}

export default AmbientLight;

const styles = StyleSheet.create({
  root: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden'},
  warmArc: {
    position: 'absolute',
    width: '88%',
    height: 290,
    top: -118,
    left: '-18%',
    borderRadius: 220,
    experimental_backgroundImage: 'radial-gradient(ellipse 72% 108% at 24% 122%, transparent 50%, rgba(55,139,104,0.035) 54%, rgba(105,194,139,0.17) 58%, rgba(55,145,113,0.08) 63%, transparent 70%)',
  },
  sageArc: {
    position: 'absolute',
    width: '94%',
    height: 270,
    right: '-24%',
    bottom: -112,
    borderRadius: 220,
    experimental_backgroundImage: 'radial-gradient(ellipse 72% 105% at 72% -21%, transparent 49%, rgba(35,128,124,0.03) 53%, rgba(65,166,151,0.15) 57%, rgba(53,132,120,0.07) 62%, transparent 70%)',
  },
  amberVeil: {
    position: 'absolute',
    width: '54%',
    height: '70%',
    top: '14%',
    right: '-31%',
    borderRadius: 260,
    experimental_backgroundImage: 'radial-gradient(ellipse 69% 102% at 102% 52%, transparent 48%, rgba(138,94,137,0.018) 51%, rgba(157,112,145,0.065) 55%, rgba(180,133,88,0.035) 59%, transparent 67%)',
  },
});
