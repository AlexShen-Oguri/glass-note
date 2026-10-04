import React, {useRef} from 'react';
import {View, type ViewProps} from 'react-native';
import {element, gsap, useGSAP} from './gsap.web';
import {useMotionEnabled} from './useMotionEnabled';

/** Delegate interactions to the current route; quickTo reuses each control's tween. */
export function MotionInteractions({changeKey, ...props}: ViewProps & {changeKey: string}) {
  const host = useRef<View>(null);
  const enabled = useMotionEnabled();
  useGSAP((_context, contextSafe) => {
    const root = element(host);
    if (!root || !enabled || !contextSafe) return;
    const controls = new WeakMap<HTMLElement, {y: (value: number) => void; scaleX: (value: number) => void; scaleY: (value: number) => void; baseY: number; baseScaleX: number; baseScaleY: number}>();
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const find = (target: EventTarget | null) => {
      const node = target instanceof Element ? target.closest<HTMLElement>('button,a,[role="button"],[role="link"]') : null;
      return node && root.contains(node) && !node.closest('[data-motion-loop]') && !node.style.willChange.includes('transform') && node.getAttribute('aria-disabled') !== 'true' && !node.hasAttribute('disabled') ? node : null;
    };
    const move = contextSafe((node: HTMLElement, lifted: boolean, pressed = false) => {
      let control = controls.get(node);
      if (!control) {
        // Foreground entrances temporarily own a control's transform. Their
        // intermediate pose must never become the permanent interaction base.
        const baseY = 0;
        const baseScaleX = 1;
        const baseScaleY = 1;
        control = {baseY, baseScaleX, baseScaleY,
          y: gsap.quickTo(node, 'y', {duration: 0.22, ease: 'power2.out'}),
          scaleX: gsap.quickTo(node, 'scaleX', {duration: 0.22, ease: 'power2.out'}),
          scaleY: gsap.quickTo(node, 'scaleY', {duration: 0.22, ease: 'power2.out'}),
        };
        controls.set(node, control);
      }
      control.y(control.baseY + (lifted && !pressed ? -2 : 0));
      control.scaleX(control.baseScaleX * (pressed ? 0.98 : 1));
      control.scaleY(control.baseScaleY * (pressed ? 0.98 : 1));
    });
    const over = (event: PointerEvent) => {
      if (!fine.matches || event.pointerType !== 'mouse') return;
      const node = find(event.target);
      if (node && !(event.relatedTarget instanceof Node && node.contains(event.relatedTarget))) move(node, true);
    };
    const out = (event: PointerEvent) => {
      const node = find(event.target);
      if (node && !(event.relatedTarget instanceof Node && node.contains(event.relatedTarget))) move(node, false);
    };
    const down = (event: PointerEvent) => {const node = find(event.target); if (node) move(node, false, true);};
    const up = (event: PointerEvent) => {const node = find(event.target); if (node) move(node, fine.matches && event.pointerType === 'mouse');};
    const focus = (event: FocusEvent) => {const node = find(event.target); if (node) move(node, true);};
    const blur = (event: FocusEvent) => {const node = find(event.target); if (node) move(node, false);};
    root.addEventListener('pointerover', over); root.addEventListener('pointerout', out);
    root.addEventListener('pointerdown', down); root.addEventListener('pointerup', up);
    root.addEventListener('pointercancel', out); root.addEventListener('focusin', focus); root.addEventListener('focusout', blur);
    return () => {
      root.removeEventListener('pointerover', over); root.removeEventListener('pointerout', out);
      root.removeEventListener('pointerdown', down); root.removeEventListener('pointerup', up);
      root.removeEventListener('pointercancel', out); root.removeEventListener('focusin', focus); root.removeEventListener('focusout', blur);
    };
  }, {scope: host, dependencies: [enabled, changeKey], revertOnUpdate: true});
  return <View {...props} ref={host} />;
}
