import {motionData} from '../motion/attributes';
import React, {useRef, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {revealLayout} from '../../domain/guided/reveal-layout';
import {t} from '../../i18n/ui';
import {colors, radii} from '../../theme/tokens';
import {PhotoFrame, serif, useViewport} from '../discovery/components';
import {Heading} from '../navigation/Heading';
import {element, gsap, useGSAP, useVisibleMotion} from '../motion/gsap.web';
import type {GuidedRevealProps} from './GuidedReveal';

/** Read each destination once, then hand off photos using only transforms and opacity. */
export function GuidedReveal({revealing, motionAllowed, activeWindow, locale, candidates, resultPhotoRefs, children, onFinish}: GuidedRevealProps) {
  const viewport = useViewport();
  const host = useRef<View>(null);
  const foreground = useVisibleMotion(host, !activeWindow);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const finish = useRef(onFinish);
  finish.current = onFinish;
  const issued = useRef(false);
  const [complete, setComplete] = useState(!revealing);
  const [geometry, setGeometry] = useState({width: Math.max(288, viewport.width - 36), height: Math.max(64, viewport.height - 140)});
  const selected = candidates.slice(0, 6);
  const selectedKey = selected.map(item => item.id).join('|');
  const layout = revealLayout(geometry.width, geometry.height, selected.length);
  const ready = !revealing || complete;
  const finishOnce = () => {
    setComplete(true);
    if (!issued.current) {issued.current = true; finish.current();}
  };

  useGSAP((_context, contextSafe) => {
    const node = element(host);
    if (!node || !contextSafe) return;
    const results = node.querySelector<HTMLElement>('[data-reveal-results]');
    if (!revealing || complete) {
      if (results) gsap.set(results, {clearProps: 'opacity,visibility,transform'});
      return;
    }
    if (!foreground) return;
    if (!motionAllowed || !selected.length || geometry.height < 340) {finishOnce(); return;}
    const rect = node.getBoundingClientRect();
    const height = Math.max(64, viewport.height - Math.max(0, rect.top));
    if (Math.abs(rect.width - geometry.width) > 1 || Math.abs(height - geometry.height) > 1) {
      setGeometry({width: rect.width, height});
      return;
    }
    if (results) gsap.set(results, {autoAlpha: 0});
    // Wait one paint for the final card grid; the callback belongs to this GSAP context.
    const frame = requestAnimationFrame(contextSafe(() => {
      const cards = Array.from(node.querySelectorAll<HTMLElement>('[data-reveal-card]'));
      const message = node.querySelector<HTMLElement>('[data-reveal-message]');
      const photos = selected.map(candidate => resultPhotoRefs.current.get(candidate.id) as unknown as HTMLElement | undefined);
      const destinations = photos.map(photo => photo?.getBoundingClientRect());
      const local = node.getBoundingClientRect();
      const targets = destinations.map(frame => frame && frame.width > 0 && frame.height > 0
        && frame.left >= 0 && frame.right <= viewport.width
        && Math.min(frame.bottom, viewport.height) - Math.max(frame.top, local.top) >= Math.min(56, frame.height)
        ? frame : undefined);
      const matchedPhotos = photos.filter((photo, index): photo is HTMLElement => Boolean(photo && targets[index]));
      const tl = gsap.timeline({defaults: {ease: 'power3.out'}, onComplete: finishOnce});
      timeline.current = tl;
      gsap.set(cards, {willChange: 'transform, opacity', transformOrigin: '50% 50%'});
      gsap.set(matchedPhotos, {autoAlpha: 0});
      cards.forEach((card, index) => {
        const slot = layout.slots[index];
        if (!slot) return;
        tl.fromTo(card, {x: slot.fromX - slot.x, y: slot.fromY - slot.y, scale: 0.9, autoAlpha: 0},
          {x: 0, y: 0, scale: 1, autoAlpha: 1, duration: 0.65}, index * 0.045);
        const target = targets[index];
        const photo = photos[index];
        if (target && photo) {
          tl.to(card, {
            x: target.left - local.left + target.width / 2 - slot.x - layout.cardWidth / 2,
            y: target.top - local.top + target.height / 2 - slot.y - layout.cardHeight / 2,
            scaleX: target.width / layout.cardWidth, scaleY: target.height / layout.cardHeight,
            duration: 0.5, ease: 'power3.inOut',
          }, 1.02);
          tl.to(card, {autoAlpha: 0, duration: 0.16}, 1.42);
          tl.to(photo, {autoAlpha: 1, duration: 0.16, clearProps: 'opacity,visibility'}, 1.42);
        } else tl.to(card, {autoAlpha: 0, y: -12, duration: 0.32}, 1.02);
      });
      const captions = Array.from(node.querySelectorAll<HTMLElement>('[data-reveal-caption]'));
      if (captions.length) tl.to(captions, {autoAlpha: 0, duration: 0.15}, 1.02);
      if (message) tl.to(message, {autoAlpha: 0, y: -8, duration: 0.22}, 0.97);
      if (results) tl.to(results, {autoAlpha: 1, duration: 0.35, clearProps: 'opacity,visibility'}, 1.1);
    }));
    return () => {cancelAnimationFrame(frame); timeline.current = null;};
  }, {scope: host, dependencies: [revealing, complete, foreground, activeWindow, motionAllowed, selectedKey, geometry.width, geometry.height, viewport.width, viewport.height], revertOnUpdate: true});

  const skip = () => {timeline.current?.progress(1); finishOnce();};
  return <View ref={host} collapsable={false} style={[styles.container, {minHeight: geometry.height}]}>
    <View {...motionData({revealResults: ''})} testID="guided-results-layer" aria-hidden={!ready}
      accessibilityElementsHidden={!ready} importantForAccessibility={ready ? 'auto' : 'no-hide-descendants'}
      pointerEvents={ready ? 'auto' : 'none'} style={{opacity: ready ? 1 : 0}}>{children()}</View>
    {revealing && !complete ? <View testID="guided-reveal-stage" style={[styles.stage, {height: layout.height}]}>
      <View {...motionData({revealMessage: ''})} style={styles.message}>
        <Heading level={1} accessibilityLiveRegion="polite" style={styles.title}>{t(locale, 'guidedRevealing')}</Heading>
        {geometry.width >= 440 ? <Text style={styles.hint}>{t(locale, 'guidedRevealHint')}</Text> : null}
        <Pressable accessibilityRole="button" onPress={skip} style={styles.skip}><Text style={styles.skipText}>{t(locale, 'guidedSkipAnimation')}</Text></Pressable>
      </View>
      <View aria-hidden accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none" style={StyleSheet.absoluteFill}>
        {selected.map((candidate, index) => {
          const slot = layout.slots[index];
          return slot ? <View key={candidate.id} {...motionData({revealCard: candidate.id})} testID={`guided-reveal-card-${candidate.id}`}
            style={[styles.candidate, {left: slot.x, top: slot.y, width: layout.cardWidth, height: layout.cardHeight}]}>
            <PhotoFrame asset={candidate.asset} accent={candidate.accent} locale={locale} height={layout.cardHeight} preserveAspect borderRadius={radii.medium} />
            {layout.cardHeight >= 52 ? <View {...motionData({revealCaption: ''})} style={styles.caption}><Text numberOfLines={1} style={styles.captionText}>{candidate.name[locale]}</Text></View> : null}
          </View> : null;
        })}
      </View>
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  container: {position: 'relative', width: '100%', backgroundColor: colors.background},
  stage: {position: 'absolute', left: 0, right: 0, top: 0, overflow: 'hidden', borderRadius: radii.large},
  message: {position: 'absolute', zIndex: 2, left: 16, right: 16, top: 14, height: 118, alignItems: 'center', justifyContent: 'center'},
  title: {color: colors.text, fontFamily: serif, fontSize: 27, lineHeight: 34, textAlign: 'center'},
  hint: {color: colors.secondary, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 4},
  skip: {minWidth: 96, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, marginTop: 4},
  skipText: {color: colors.accent, fontSize: 14, fontWeight: '700'},
  candidate: {position: 'absolute', overflow: 'hidden', borderRadius: radii.medium, backgroundColor: colors.panel},
  caption: {position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 24, justifyContent: 'center', paddingHorizontal: 7, backgroundColor: 'rgba(16,23,20,0.78)'},
  captionText: {color: colors.text, fontFamily: serif, fontSize: 11, lineHeight: 15},
});
