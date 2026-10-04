import {motionData} from './attributes';
import React, {useEffect, useRef, useState} from 'react';
import {Modal, View} from 'react-native';
import type {EntranceProps, FadeProps, FloatProps, MotionModalProps, PhotoProps} from './primitives';
import {element, gsap, useGSAP, useVisibleMotion} from './gsap.web';
import {useMotionEnabled} from './useMotionEnabled';

// The reveal timeline animates the outer photo ref directly on the web.
export function MotionPhoto({opacity: _opacity, ...props}: PhotoProps) {return <View {...props} />;}

export function MotionEntrance({active = true, ...props}: EntranceProps) {
  const host = useRef<View>(null);
  const enabled = useMotionEnabled();
  useGSAP(() => {
    const node = element(host);
    if (!node || !enabled || !active) return;
    const targets = Array.from(node.children);
    if (!targets.length) return;
    gsap.set(targets, {willChange: 'transform, opacity'});
    gsap.fromTo(targets, {y: 24, opacity: 0.18}, {
      y: 0, opacity: 1, duration: 0.62, stagger: 0.035, ease: 'power3.out',
      clearProps: 'transform,opacity,willChange',
    });
  }, {scope: host, dependencies: [enabled, active], revertOnUpdate: true});
  return <View {...props} ref={host} {...motionData({motionEntrance: ''})} />;
}

export function MotionFade({visible, disabled = false, ...props}: FadeProps) {
  const host = useRef<View>(null);
  const enabled = useMotionEnabled() && !disabled;
  const previous = useRef(visible);
  useGSAP(() => {
    const node = element(host);
    if (!node) return;
    const changed = previous.current !== visible;
    previous.current = visible;
    gsap.to(node, {autoAlpha: visible ? 1 : 0, duration: enabled && changed ? 0.4 : 0, ease: 'power2.out', overwrite: 'auto'});
  }, {scope: host, dependencies: [enabled, visible]});
  return <View {...props} ref={host} />;
}

export function MotionFloat({index, paused, reduceMotion, ...props}: FloatProps) {
  const host = useRef<View>(null);
  const loop = useRef<gsap.core.Tween | null>(null);
  const running = useVisibleMotion(host, paused || reduceMotion);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const node = element(host);
      if (!node || reduceMotion) return;
      loop.current = gsap.to(node, {y: index % 2 ? 18 : -18, duration: 10 + index * 1.1, ease: 'sine.inOut', repeat: -1, yoyo: true, paused: true});
    });
    return () => {media.revert(); loop.current = null;};
  }, {scope: host, dependencies: [index, reduceMotion], revertOnUpdate: true});
  useEffect(() => {loop.current?.paused(!running);}, [running, index, reduceMotion]);
  return <View {...props} ref={host} />;
}

/** The reference opens dialogs directly; RN Web retains its real focus trap. */
export function MotionModal({visible = false, motionDisabled: _motionDisabled = false, children, onShow, ...props}: MotionModalProps) {
  const [present, setPresent] = useState(visible);
  const [node, setNode] = useState<HTMLElement | null>(null);
  const latestVisible = useRef(visible);
  latestVisible.current = visible;
  const show = useRef(onShow);
  show.current = onShow;
  const showEvent = useRef<Parameters<NonNullable<MotionModalProps['onShow']>>[0] | undefined>(undefined);
  const shown = useRef(false);
  const lastOpen = useRef(false);
  useEffect(() => {if (visible) setPresent(true);}, [visible]);
  useEffect(() => {
    if (visible && !lastOpen.current) shown.current = false;
    lastOpen.current = visible;
    if (!node) {if (!visible) setPresent(false); return;}
    const panel = node.querySelector<HTMLElement>('[data-motion-surface]') ?? node.firstElementChild?.firstElementChild;
    if (!visible) {setPresent(false); return;}
    const frame = requestAnimationFrame(() => {
      if (!latestVisible.current || shown.current) return;
      shown.current = true;
      if (panel && !panel.contains(document.activeElement)) {
        panel.querySelector<HTMLElement>('button,input,textarea,select,a[href],[role="button"],[tabindex="0"]')?.focus({preventScroll: true});
      }
      show.current?.(showEvent.current as never);
    });
    return () => cancelAnimationFrame(frame);
  }, [node, visible]);
  return <Modal {...props} visible={present} animationType="none" onShow={event => {showEvent.current = event;}}>
    <View ref={setNode as never} style={{flex: 1}} {...motionData({motionModal: ''})}>{children}</View>
  </Modal>;
}
