import React, {useRef} from 'react';
import {View, type ViewProps} from 'react-native';
import {motionData} from './attributes';
import {element, gsap, useGSAP} from './gsap.web';
import {useMotionEnabled} from './useMotionEnabled';

/** Animate the confirmed state of the actual control, never a copied heart. */
export function MotionFavorite({selected, ...props}: ViewProps & {selected: boolean}) {
  const host = useRef<View>(null);
  const previous = useRef(selected);
  const enabled = useMotionEnabled();
  useGSAP(() => {
    const changed = previous.current !== selected;
    previous.current = selected;
    const node = element(host);
    if (!node || !changed || !enabled) return;
    gsap.set(node, {willChange: 'transform'});
    gsap.timeline()
      .to(node, {scale: 1.2, duration: 0.18, ease: 'power2.out'})
      .to(node, {scale: 1, duration: 0.32, ease: 'power3.out', clearProps: 'transform,willChange'});
  }, {scope: host, dependencies: [selected, enabled], revertOnUpdate: true});
  return <View ref={host} {...props} {...motionData({motionFavorite: ''})} />;
}
