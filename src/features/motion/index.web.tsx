import {motionData} from './attributes';
import React, {useRef} from 'react';
import {View, type StyleProp, type ViewStyle} from 'react-native';
import {transitionDuration} from '../../domain/discovery/motion';
import {element, gsap, useGSAP, visibleItems} from './gsap.web';
import {useMotionEnabled} from './useMotionEnabled';
export {useMotionEnabled} from './useMotionEnabled';
export {MotionPhotoRelay} from './PhotoRelay';

/** Animate the live subtree. No DOM copies, style walks or duplicate images. */
export function MotionTransition({children, changeKey, kind = 'page', style, disabled = false}: {
  children: React.ReactNode; changeKey: string | number; kind?: keyof typeof transitionDuration;
  style?: StyleProp<ViewStyle>; disabled?: boolean;
}) {
  const host = useRef<View>(null);
  const previous = useRef(changeKey);
  const enabled = useMotionEnabled() && !disabled;
  useGSAP(() => {
    const before = previous.current;
    const changed = before !== changeKey;
    previous.current = changeKey;
    const node = element(host);
    if (!node || !enabled || !changed) return;
    // Guided results have their own live-card timeline. The route frame never
    // competes with it or animates the persistent progress/actions around it.
    if (node.querySelector('[data-motion-reveal]')) return;
    const items = kind === 'card' ? visibleItems(node) : [];
    const parts = kind !== 'card' ? Array.from(node.querySelectorAll<HTMLElement>('[data-motion-part]')).filter(part => !part.parentElement?.closest('[data-motion-part]')) : [];
    const targets = items.length ? items : parts.length ? parts : [node];
    gsap.set(targets, {willChange: 'transform, opacity'});
    const duration = kind === 'step' ? 0.48 : kind === 'completion' ? 0.65 : 0.62;
    const beforeStep = String(before).match(/choosing:(\d+)/)?.[1];
    const nextStep = String(changeKey).match(/choosing:(\d+)/)?.[1];
    const direction = beforeStep !== undefined && nextStep !== undefined && Number(nextStep) < Number(beforeStep) ? -1 : 1;
    const options = parts.filter(part => part.dataset.motionPart === 'options');
    const content = targets.filter(target => !options.includes(target));
    const timeline = gsap.timeline({defaults: {ease: 'power3.out'}});
    if (content.length) timeline.fromTo(content, {opacity: 0.18, y: kind === 'card' ? 24 : 18}, {
      opacity: 1, y: 0, duration, stagger: items.length ? 0.035 : 0.035,
      overwrite: 'auto', clearProps: 'transform,opacity,willChange',
    }, 0);
    if (options.length) {
      // Keep the option frame measurable and its newly committed controls live.
      const controls = options.flatMap(frame => Array.from(frame.children));
      gsap.set(controls, {willChange: 'transform,opacity'});
      timeline.fromTo(controls, {opacity: 0.12, x: 22 * direction}, {opacity: 1, x: 0, duration: 0.58, stagger: 0.025, clearProps: 'transform,opacity,willChange'}, 0.015);
      gsap.set(options, {clearProps: 'willChange'});
    }
  }, {scope: host, dependencies: [changeKey, enabled], revertOnUpdate: true});
  return <View ref={host} {...motionData({motionTransition: kind})} style={style}>{children}</View>;
}
