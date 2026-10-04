import React, {useRef} from 'react';
import {StyleSheet, View, useWindowDimensions} from 'react-native';
import {colors} from '../../theme/tokens';
import {motionData} from './attributes';
import {element, gsap, useGSAP} from './gsap.web';
import {useMotionEnabled} from './useMotionEnabled';

/** A persistent playhead relays the four questions without moving the frame. */
export function ProgressOrbit({step}: {step: number}) {
  const dot = useRef<View>(null);
  const enabled = useMotionEnabled();
  const {width} = useWindowDimensions();
  useGSAP(() => {
    const node = element(dot);
    const track = node?.parentElement;
    if (!node || !track) return;
    const x = track.getBoundingClientRect().width / 4 * Math.max(0, Math.min(3, step));
    gsap.to(node, {x, duration: enabled ? 0.45 : 0, ease: 'power3.inOut', overwrite: true});
  }, {scope: dot, dependencies: [step, enabled, width]});
  return <View ref={dot} pointerEvents="none" accessible={false} {...motionData({motionProgress: ''})} style={styles.dot} />;
}
const styles = StyleSheet.create({dot: {position: 'absolute', top: -3, left: 0, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.amber}});
