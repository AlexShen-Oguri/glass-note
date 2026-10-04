import React, {useRef} from 'react';
import {View, type ViewProps} from 'react-native';
import {element, gsap, useGSAP} from './gsap.web';
import {useMotionEnabled} from './useMotionEnabled';

type SelectionProps = ViewProps & {selected: boolean; feedbackKey?: string};

export function MotionSelection({selected, feedbackKey, ...props}: SelectionProps) {
  const host = useRef<View>(null);
  const previous = useRef({selected, feedbackKey});
  const enabled = useMotionEnabled();
  useGSAP(() => {
    const changed = previous.current.selected !== selected || previous.current.feedbackKey !== feedbackKey;
    previous.current = {selected, feedbackKey};
    const node = element(host);
    if (!node || !changed || !enabled) return;
    if (!selected) return;
    gsap.fromTo(node, {scale: 0.72}, {scale: 1, duration: 0.4, ease: 'power3.out', clearProps: 'transform'});
  }, {scope: host, dependencies: [selected, feedbackKey, enabled], revertOnUpdate: true});
  return <View ref={host} {...props} />;
}

/** Keep the rule mounted so deselection can retract the same live underline. */
export function MotionSelectionRule({selected, feedbackKey, ...props}: SelectionProps) {
  const host = useRef<View>(null);
  const previous = useRef({selected, feedbackKey});
  const enabled = useMotionEnabled();
  useGSAP(() => {
    const node = element(host);
    if (!node) return;
    const changed = previous.current.selected !== selected || previous.current.feedbackKey !== feedbackKey;
    previous.current = {selected, feedbackKey};
    gsap.to(node, {scaleX: selected ? 1 : 0, transformOrigin: 'left center', duration: changed && enabled ? 0.38 : 0, ease: 'power3.out', overwrite: 'auto'});
  }, {scope: host, dependencies: [selected, feedbackKey, enabled]});
  return <View ref={host} {...props} />;
}

/** Refresh each existing taste sample when the chosen values change. */
export function MotionSelectionSummary({changeKey, ...props}: ViewProps & {changeKey: string}) {
  const host = useRef<View>(null);
  const previous = useRef(changeKey);
  const enabled = useMotionEnabled();
  useGSAP(() => {
    const changed = previous.current !== changeKey;
    previous.current = changeKey;
    const node = element(host);
    if (!node || !changed || !enabled) return;
    const samples = Array.from(node.children);
    if (samples.length) gsap.fromTo(samples, {y: 8, opacity: 0.5}, {y: 0, opacity: 1, duration: 0.45, stagger: 0.025, ease: 'power3.out', clearProps: 'transform,opacity'});
  }, {scope: host, dependencies: [changeKey, enabled], revertOnUpdate: true});
  return <View ref={host} {...props} />;
}
