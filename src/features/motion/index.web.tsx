import {motionData} from './attributes';
import React, {useRef} from 'react';
import {View, type StyleProp, type ViewStyle} from 'react-native';
import {transitionDuration} from '../../domain/discovery/motion';
import {element, gsap, useGSAP, visibleItems} from './gsap.web';
import {useMotionEnabled} from './useMotionEnabled';
export {useMotionEnabled} from './useMotionEnabled';

/** Animate the live subtree. No DOM copies, style walks or duplicate images. */
export function MotionTransition({children, changeKey, kind = 'page', style, disabled = false}: {
  children: React.ReactNode; changeKey: string | number; kind?: keyof typeof transitionDuration;
  style?: StyleProp<ViewStyle>; disabled?: boolean;
}) {
  const host = useRef<View>(null);
  const previous = useRef(changeKey);
  const enabled = useMotionEnabled() && !disabled;
  useGSAP(() => {
    const changed = previous.current !== changeKey;
    previous.current = changeKey;
    const node = element(host);
    if (!node || !enabled || !changed) return;
    const items = kind === 'card' ? visibleItems(node) : [];
    const targets = items.length ? items : [node];
    gsap.set(targets, {willChange: 'transform, opacity'});
    gsap.fromTo(targets, {autoAlpha: 0.35, y: kind === 'card' ? 14 : 8}, {
      autoAlpha: 1, y: 0, duration: transitionDuration[kind] / 1000,
      ease: 'power3.out', stagger: items.length ? {amount: 0.12} : 0,
      overwrite: 'auto', clearProps: 'transform,opacity,visibility,willChange',
    });
  }, {scope: host, dependencies: [changeKey, enabled], revertOnUpdate: true});
  return <View ref={host} {...motionData({motionTransition: kind})} style={style}>{children}</View>;
}
