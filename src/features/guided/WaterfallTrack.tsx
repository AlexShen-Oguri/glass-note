import React, {useEffect, useRef, useState} from 'react';
import {Animated, AppState, Easing, StyleSheet} from 'react-native';

export interface WaterfallTrackProps {
  children: React.ReactNode;
  columnIndex: number;
  distance: number;
  paused: boolean;
  reduceMotion: boolean;
}

function useAppIsActive() {
  const [active, setActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setActive(state === 'active'));
    return () => subscription.remove();
  }, []);

  return active;
}

/** Native waterfall motion stays on the UI thread and stops while the app is backgrounded. */
export function WaterfallTrack({
  children,
  columnIndex,
  distance,
  paused,
  reduceMotion,
}: WaterfallTrackProps) {
  const offset = useRef(new Animated.Value(0)).current;
  const geometry = useRef('');
  const appIsActive = useAppIsActive();

  useEffect(() => {
    if (!distance || reduceMotion) {
      offset.stopAnimation();
      offset.setValue(0);
      geometry.current = '';
      return;
    }

    const reverse = columnIndex % 2 === 1;
    const start = reverse ? -distance : 0;
    const end = reverse ? 0 : -distance;
    const duration = Math.max(26000, distance * 38 + columnIndex * 2500);
    const nextGeometry = `${columnIndex}:${distance}`;
    const geometryChanged = geometry.current !== nextGeometry;
    geometry.current = nextGeometry;
    let cancelled = false;

    const run = (value: number) => {
      if (cancelled) return;
      if (Math.abs(end - value) < 0.5) {
        offset.setValue(start);
        value = start;
      }
      const segmentDuration = Math.max(1, Math.round(duration * Math.abs(end - value) / distance));
      Animated.timing(offset, {
        toValue: end,
        duration: segmentDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({finished}) => {
        if (!finished || cancelled) return;
        offset.setValue(start);
        run(start);
      });
    };

    offset.stopAnimation(value => {
      if (cancelled) return;
      const resumeAt = geometryChanged ? start : value;
      if (geometryChanged) offset.setValue(start);
      if (!paused && appIsActive) run(resumeAt);
    });
    return () => {
      cancelled = true;
      offset.stopAnimation();
    };
  }, [appIsActive, columnIndex, distance, offset, paused, reduceMotion]);

  return <Animated.View style={[styles.track, {transform: [{translateY: offset}]}]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  track: {gap: 0},
});
