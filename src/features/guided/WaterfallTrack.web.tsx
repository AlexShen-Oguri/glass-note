import {motionData} from '../motion/attributes';
import React, {useEffect, useRef} from 'react';
import {View} from 'react-native';
import {element, gsap, useGSAP, useVisibleMotion} from '../motion/gsap.web';
import type {WaterfallTrackProps} from './WaterfallTrack';

/** One transform per duplicated column, at constant speed with a seamless wrap. */
export function WaterfallTrack({children, columnIndex, distance, paused, reduceMotion}: WaterfallTrackProps) {
  const host = useRef<View>(null);
  const loop = useRef<gsap.core.Tween | null>(null);
  const running = useVisibleMotion(host, paused || reduceMotion);
  useGSAP(() => {
    const node = element(host);
    if (!node || !distance || reduceMotion) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const reverse = columnIndex % 2 === 1;
      gsap.set(node, {willChange: 'transform'});
      loop.current = gsap.fromTo(node, {y: reverse ? -distance : 0}, {
        y: reverse ? 0 : -distance, duration: Math.max(32, distance / 23 + columnIndex * 3),
        ease: 'none', repeat: -1, paused: true, force3D: true,
      });
      loop.current.progress(0.11 + columnIndex * 0.17);
    });
    return () => {media.revert(); loop.current = null;};
  }, {scope: host, dependencies: [columnIndex, distance, reduceMotion], revertOnUpdate: true});
  useEffect(() => {loop.current?.paused(!running);}, [running, columnIndex, distance, reduceMotion]);
  return <View ref={host} {...motionData({motionLoop: 'waterfall'})} style={{gap: 0}}>{children}</View>;
}
