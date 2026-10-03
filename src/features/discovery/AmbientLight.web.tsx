import {motionData} from '../motion/attributes';
import React, {useEffect, useRef} from 'react';
import {StyleSheet, View} from 'react-native';
import {element, gsap, useGSAP, useVisibleMotion} from '../motion/gsap.web';
import type {AmbientLightProps} from './AmbientLight';

/** Static light textures drift as three composited layers; no animated gradients or blur. */
export function AmbientLight({paused, reduceMotion = false}: AmbientLightProps) {
  const host = useRef<View>(null);
  const loops = useRef<gsap.core.Tween[]>([]);
  const running = useVisibleMotion(host, paused || reduceMotion);
  useGSAP(() => {
    const node = element(host);
    if (!node || reduceMotion) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const layers = Array.from(node.children);
      gsap.set(layers, {willChange: 'transform, opacity'});
      loops.current = layers.map((layer, index) => gsap.to(layer, {
        xPercent: index % 2 ? -4 : 4, yPercent: index % 2 ? 3 : -3,
        rotation: index === 2 ? -9 : index % 2 ? 5 : -4,
        opacity: index === 2 ? 0.45 : 0.85, duration: 24 + index * 5,
        ease: 'sine.inOut', repeat: -1, yoyo: true, paused: true,
      }));
    });
    return () => {media.revert(); loops.current = [];};
  }, {scope: host, dependencies: [reduceMotion], revertOnUpdate: true});
  useEffect(() => {loops.current.forEach(loop => loop.paused(!running));}, [running, reduceMotion]);
  return <View ref={host} {...motionData({motionLoop: 'ambient'})} pointerEvents="none" accessible={false}
    importantForAccessibility="no-hide-descendants" aria-hidden style={styles.root}>
    <View style={[styles.curtain, styles.northCurtain]} />
    <View style={[styles.curtain, styles.tealCurtain]} />
    <View style={[styles.curtain, styles.edgeCurtain]} />
  </View>;
}
export default AmbientLight;

const styles = StyleSheet.create({
  root: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden'},
  curtain: {
    position: 'absolute',
    // Feather the layer bounds so the off-centre light arcs never expose a hard cut edge.
    maskImage: 'radial-gradient(ellipse at center, black 28%, rgba(0,0,0,0.9) 48%, transparent 74%)',
  } as never,
  northCurtain: {
    width: '108%',
    height: '74%',
    top: '-18%',
    left: '-12%',
    backgroundImage: 'radial-gradient(ellipse 74% 108% at 24% 122%, transparent 51%, rgba(55, 139, 104, 0.035) 54%, rgba(105, 194, 139, 0.17) 58%, rgba(55, 145, 113, 0.09) 62%, transparent 70%), radial-gradient(ellipse 62% 92% at 76% 116%, transparent 49%, rgba(56, 136, 111, 0.025) 52%, rgba(91, 180, 138, 0.12) 56%, rgba(49, 126, 105, 0.055) 61%, transparent 68%)',
    transform: 'translate3d(1%, 0, 0) rotate(-7deg) scaleY(0.94)',
    opacity: 0.76,
  } as never,
  tealCurtain: {
    width: '108%',
    height: '78%',
    right: '-18%',
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
});
