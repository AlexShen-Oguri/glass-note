import {useGSAP} from '@gsap/react';
import {gsap} from 'gsap';
import {useEffect, useState, type RefObject} from 'react';
import type {View} from 'react-native';

gsap.registerPlugin(useGSAP);
export {gsap, useGSAP};

/** React Native Web exposes the host element through its View ref. */
export function element(ref: RefObject<View | null>) {
  return ref.current as unknown as HTMLElement | null;
}

/** Read geometry once, before tween writes; never animate a whole catalogue. */
export function visibleItems(root: HTMLElement, selector = '[data-motion-item]', limit = 8) {
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(node => {
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
  }).slice(0, limit);
}

/** Keep loop playheads intact while a tab, route or scroll region is inactive. */
export function useVisibleMotion(ref: RefObject<View | null>, paused: boolean) {
  const [visible, setVisible] = useState(false);
  const [foreground, setForeground] = useState(false);
  useEffect(() => {
    const update = () => setForeground(!document.hidden);
    update();
    document.addEventListener('visibilitychange', update);
    const node = element(ref);
    const observer = new IntersectionObserver(entries => setVisible(Boolean(entries[0]?.isIntersecting)));
    if (node) observer.observe(node);
    return () => {observer.disconnect(); document.removeEventListener('visibilitychange', update);};
  }, [ref]);
  return visible && foreground && !paused;
}
