import React, {useEffect, useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';

import type {WaterfallTrackProps} from './WaterfallTrack';

function useDocumentIsVisible() {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || document.visibilityState !== 'hidden');

  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  return visible;
}

/** CSS transforms keep both duplicated tracks moving without a per-frame JavaScript loop. */
export function WaterfallTrack({
  children,
  columnIndex,
  distance,
  paused,
  reduceMotion,
}: WaterfallTrackProps) {
  const documentIsVisible = useDocumentIsVisible();
  const motionStyle = useMemo(() => {
    const duration = Math.max(26000, distance * 38 + columnIndex * 2500);
    return StyleSheet.create({
      motion: {
        animationDuration: `${duration}ms`,
        animationDirection: columnIndex % 2 === 1 ? 'reverse' : 'normal',
        animationDelay: `${-Math.round(duration * (0.11 + columnIndex * 0.17))}ms`,
        animationIterationCount: 'infinite',
        animationKeyframes: [{
          '0%': {transform: 'translate3d(0, 0, 0)'},
          '100%': {transform: `translate3d(0, ${-distance}px, 0)`},
        }],
        animationTimingFunction: 'linear',
        willChange: 'transform',
      } as never,
    }).motion;
  }, [columnIndex, distance]);

  if (!distance || reduceMotion) return <View style={styles.track}>{children}</View>;
  return <View style={[styles.track, motionStyle, paused || !documentIsVisible ? styles.paused : styles.running]}>{children}</View>;
}

const styles = StyleSheet.create({
  track: {gap: 0},
  paused: {animationPlayState: 'paused'} as never,
  running: {animationPlayState: 'running'} as never,
});
