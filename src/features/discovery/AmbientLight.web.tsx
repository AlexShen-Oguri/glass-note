import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';

import type {AmbientLightProps} from './AmbientLight';

function useDocumentIsVisible() {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || document.visibilityState !== 'hidden');

  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  return visible;
}

/** Broad translucent curtains inspired by a quiet Norwegian aurora. */
export function AmbientLight({paused, reduceMotion = false}: AmbientLightProps) {
  const documentIsVisible = useDocumentIsVisible();
  const running = !paused && !reduceMotion && documentIsVisible;
  const playState = {animationPlayState: running ? 'running' : 'paused'} as never;

  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      style={styles.root}
    >
      <View style={[styles.curtain, styles.northCurtain, !reduceMotion && styles.northMotion, playState]} />
      <View style={[styles.curtain, styles.tealCurtain, !reduceMotion && styles.tealMotion, playState]} />
      <View style={[styles.curtain, styles.edgeCurtain, !reduceMotion && styles.edgeMotion, playState]} />
    </View>
  );
}

export default AmbientLight;

const looping = {
  animationIterationCount: 'infinite',
  animationTimingFunction: 'cubic-bezier(0.45, 0.05, 0.55, 0.95)',
  willChange: 'transform, opacity',
} as const;

const styles = StyleSheet.create({
  root: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden'},
  curtain: {
    position: 'absolute',
    // Feather the layer bounds so the off-centre light arcs never expose a hard cut edge.
    maskImage: 'radial-gradient(ellipse at center, black 28%, rgba(0,0,0,0.9) 48%, transparent 74%)',
  } as never,
  northCurtain: {
    width: '132%',
    height: '74%',
    top: '-18%',
    left: '-22%',
    backgroundImage: 'radial-gradient(ellipse 74% 108% at 24% 122%, transparent 51%, rgba(55, 139, 104, 0.035) 54%, rgba(105, 194, 139, 0.17) 58%, rgba(55, 145, 113, 0.09) 62%, transparent 70%), radial-gradient(ellipse 62% 92% at 76% 116%, transparent 49%, rgba(56, 136, 111, 0.025) 52%, rgba(91, 180, 138, 0.12) 56%, rgba(49, 126, 105, 0.055) 61%, transparent 68%)',
    transform: 'translate3d(1%, 0, 0) rotate(-7deg) scaleY(0.94)',
    opacity: 0.76,
  } as never,
  tealCurtain: {
    width: '128%',
    height: '78%',
    right: '-31%',
    bottom: '-29%',
    backgroundImage: 'radial-gradient(ellipse 72% 105% at 72% -21%, transparent 50%, rgba(35, 128, 124, 0.03) 53%, rgba(65, 166, 151, 0.15) 57%, rgba(53, 132, 120, 0.075) 62%, transparent 70%), radial-gradient(ellipse 58% 88% at 19% -12%, transparent 47%, rgba(49, 132, 119, 0.025) 51%, rgba(86, 163, 126, 0.10) 55%, transparent 65%)',
    transform: 'translate3d(-2%, 0, 0) rotate(8deg) scaleY(0.9)',
    opacity: 0.72,
  } as never,
  edgeCurtain: {
    width: '88%',
    height: '68%',
    top: '9%',
    right: '-39%',
    backgroundImage: 'radial-gradient(ellipse 69% 102% at 102% 52%, transparent 48%, rgba(138, 94, 137, 0.018) 51%, rgba(157, 112, 145, 0.065) 55%, rgba(180, 133, 88, 0.035) 59%, transparent 67%)',
    transform: 'translate3d(0, 1%, 0) rotate(-13deg)',
    opacity: 0.58,
  } as never,
  northMotion: {
    ...looping,
    animationDuration: '48s',
    animationDelay: '-17s',
    animationKeyframes: [{
      '0%': {transform: 'translate3d(-9%, -4%, 0) rotate(-9deg) scaleY(0.90)', opacity: 0.67},
      '48%': {transform: 'translate3d(9%, 6%, 0) rotate(-2deg) scaleY(1.07)', opacity: 0.94},
      '100%': {transform: 'translate3d(-9%, -4%, 0) rotate(-9deg) scaleY(0.90)', opacity: 0.67},
    }],
  } as never,
  tealMotion: {
    ...looping,
    animationDuration: '57s',
    animationDelay: '-31s',
    animationKeyframes: [{
      '0%': {transform: 'translate3d(10%, 6%, 0) rotate(11deg) scaleY(0.90)', opacity: 0.62},
      '52%': {transform: 'translate3d(-10%, -5%, 0) rotate(4deg) scaleY(1.06)', opacity: 0.90},
      '100%': {transform: 'translate3d(10%, 6%, 0) rotate(11deg) scaleY(0.90)', opacity: 0.62},
    }],
  } as never,
  edgeMotion: {
    ...looping,
    animationDuration: '65s',
    animationDelay: '-9s',
    animationKeyframes: [{
      '0%': {transform: 'translate3d(7%, -4%, 0) rotate(-14deg)', opacity: 0.38},
      '50%': {transform: 'translate3d(-8%, 6%, 0) rotate(-9deg)', opacity: 0.61},
      '100%': {transform: 'translate3d(7%, -4%, 0) rotate(-14deg)', opacity: 0.38},
    }],
  } as never,
});
