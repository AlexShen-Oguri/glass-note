import React, {useRef} from 'react';
import {View, type ViewProps} from 'react-native';
import {element, gsap, useGSAP} from './gsap.web';
import {useMotionEnabled} from './useMotionEnabled';

/** The reference reveals more actions downward when their live view mounts. */
export function MotionDisclosure(props: ViewProps) {
  const host = useRef<View>(null);
  const enabled = useMotionEnabled();
  const revealed = useRef(false);
  useGSAP(() => {
    const node = element(host);
    if (!node || !enabled || revealed.current) return;
    revealed.current = true;
    gsap.fromTo(node, {y: -10, opacity: 0}, {y: 0, opacity: 1, duration: 0.4, ease: 'power1.out', clearProps: 'transform,opacity'});
  }, {scope: host, dependencies: [enabled], revertOnUpdate: true});
  return <View {...props} ref={host} />;
}
