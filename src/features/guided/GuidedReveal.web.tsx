import {motionData} from '../motion/attributes';
import React, {useRef, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {t} from '../../i18n/ui';
import {colors} from '../../theme/tokens';
import {element, gsap, useGSAP, visibleItems} from '../motion/gsap.web';
import type {GuidedRevealProps} from './GuidedReveal';
import {useMotionEnabled} from '../motion/useMotionEnabled';

/** The live results arrive together; interaction never waits for presentation. */
export function GuidedReveal({revealing, motionAllowed, activeWindow, children, locale, onFinish}: GuidedRevealProps) {
  const enabled = useMotionEnabled() && motionAllowed && activeWindow;
  const host = useRef<View>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const finish = useRef(onFinish);
  const issued = useRef(false);
  const started = useRef(revealing);
  const [complete, setComplete] = useState(!revealing);
  finish.current = onFinish;
  const finishOnce = () => {
    setComplete(true);
  };
  useGSAP((_context, contextSafe) => {
    const node = element(host);
    if (!node || !contextSafe || !started.current || complete) return;
    // Result state is committed before the first visible frame. Navigating away
    // during the texture/geometry tail cannot leave a pending reveal session.
    if (!issued.current) {issued.current = true; finish.current();}
    if (!enabled || document.hidden) {finishOnce(); return;}
    // Let the owning ScrollView restore its question/result position before
    // the single visible-card geometry read. Business state is already ready.
    const frame = requestAnimationFrame(contextSafe(() => {
      const cards = visibleItems(node);
      const lead = node.querySelector<HTMLElement>('[data-motion-results-lead]');
      const targets = [...(lead ? [lead] : []), ...cards];
      if (!targets.length) {finishOnce(); return;}
      gsap.set(targets, {willChange: 'transform,opacity'});
      const tl = gsap.timeline({defaults: {ease: 'power3.out'}, onComplete: finishOnce});
      timeline.current = tl;
      if (lead) tl.fromTo(lead, {y: 28, opacity: 0.08}, {y: 0, opacity: 1, duration: 0.62, clearProps: 'transform,opacity,willChange'}, 0);
      if (cards.length) tl.fromTo(cards, {y: 18, opacity: 0.38}, {y: 0, opacity: 1, duration: 0.62, stagger: 0.035, clearProps: 'transform,opacity,willChange'}, 0);
    }));
    return () => {cancelAnimationFrame(frame); timeline.current = null;};
  }, {scope: host, dependencies: [complete, enabled], revertOnUpdate: true});
  return <View ref={host} collapsable={false} style={styles.container} {...motionData({motionReveal: ''})}>
    <View {...motionData({revealResults: ''})} testID="guided-results-layer">{children()}</View>
    {started.current && !complete ? <Pressable testID="guided-reveal-stage" accessibilityRole="button" onPress={() => {timeline.current?.progress(1); finishOnce();}} style={styles.skip}>
      <Text style={styles.skipText}>{t(locale, 'guidedSkipAnimation')} →</Text>
    </Pressable> : null}
  </View>;
}

const styles = StyleSheet.create({
  container: {position: 'relative', width: '100%'},
  skip: {alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, marginTop: 10},
  skipText: {color: colors.amber, fontSize: 12, letterSpacing: 0.4},
});
