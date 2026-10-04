import React, {useRef} from 'react';
import {View, type ViewProps} from 'react-native';
import {element, gsap, useGSAP} from './gsap.web';
import {useMotionEnabled} from './useMotionEnabled';

export function MotionSelection({selected, ...props}: ViewProps & {selected: boolean}) {
  const host = useRef<View>(null);
  const previous = useRef(selected);
  const enabled = useMotionEnabled();
  useGSAP(() => {
    const changed = previous.current !== selected;
    previous.current = selected;
    const node = element(host);
    if (!node || !changed || !enabled) return;
    gsap.fromTo(node, {scale: selected ? 0.72 : 1.08, opacity: 0.45}, {scale: 1, opacity: 1, duration: 0.4, ease: 'power3.out', clearProps: 'transform,opacity'});
  }, {scope: host, dependencies: [selected, enabled], revertOnUpdate: true});
  return <View ref={host} {...props} />;
}
