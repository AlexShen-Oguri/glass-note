import React, {useRef} from 'react';
import {View, type ViewProps} from 'react-native';
import {element, gsap, useGSAP} from './gsap.web';
import {useMotionEnabled} from './useMotionEnabled';
import {colors} from '../../theme/tokens';
import {CustomEase} from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

/** Match the reference's ruled entries and photographs on the actual controls. */
export function MotionInteractions({changeKey, ...props}: ViewProps & {changeKey: string}) {
  const host = useRef<View>(null);
  const enabled = useMotionEnabled();
  useGSAP((_context, contextSafe) => {
    const root = element(host);
    if (!root || !enabled || !contextSafe) return;
    const editorial = new WeakMap<HTMLElement, {rule:HTMLElement|null;arrow:HTMLElement|null;glyph:Element|null;photo:HTMLElement|null;background:string;color:string;photoScale:number}>();
    const editorialEase = CustomEase.create('nightEditorialHover', '0.22,1,0.36,1');
    const arrowEase = CustomEase.create('nightEditorialArrow', '0.25,0.1,0.25,1');
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const find = (target: EventTarget | null) => {
      if(!(target instanceof Element))return null;
      const node=target.closest<HTMLElement>('button,a,[role="button"],[role="link"]');
      if(!node||!root.contains(node)||node.closest('[data-motion-loop],[data-motion-favorite]')||node.style.willChange.includes('transform')||node.getAttribute('aria-disabled')==='true'||node.hasAttribute('disabled'))return null;
      if(node.querySelector('[data-night-arrow]'))return node;
      // The reference zooms a gallery photograph, not its entire caption link.
      const photo=target.closest<HTMLElement>('[data-motion-photo]');
      return photo&&node.contains(photo)&&!photo.querySelector('[data-motion-photo-hover="owned"]')?photo:null;
    };
    const move = contextSafe((node: HTMLElement, lifted: boolean) => {
      let visual=editorial.get(node);
      if(!visual){
        const arrow=node.querySelector<HTMLElement>('[data-night-arrow]');
        const photo=node.matches('[data-motion-photo]')?node.querySelector<HTMLElement>('img'):node.querySelector<HTMLElement>('[data-motion-photo] img');
        if(photo?.closest('[data-motion-photo-hover="owned"]'))return;
        if(!arrow&&!photo)return;
        const glyph=arrow?.firstElementChild??null;
        visual={arrow,photo,glyph,rule:node.querySelector<HTMLElement>('[data-night-rule]'),background:arrow?getComputedStyle(arrow).backgroundColor:'',color:glyph?getComputedStyle(glyph).color:'',photoScale:node.closest('[data-motion-item]')?1.07:1.1};
        editorial.set(node,visual);
      }
      const {arrow,photo,glyph,rule}=visual;
      // Separate property tweens mirror independent CSS transitions: reversing
      // a .55s arrow must not delay the .45s colour feedback by another .1s.
      if(arrow){
        const ruleActive=lifted||node.matches(':focus-visible');
        if(rule)gsap.to(rule,{scaleX:ruleActive?1:0,duration:.55,ease:editorialEase,overwrite:'auto',clearProps:ruleActive?undefined:'transform'});
        gsap.to(arrow,{rotation:lifted?-40:0,duration:.55,ease:arrowEase,overwrite:'auto',clearProps:lifted?undefined:'transform'});
        gsap.to(arrow,{backgroundColor:lifted?colors.accent:visual.background,duration:.45,ease:arrowEase,overwrite:'auto',clearProps:lifted?undefined:'backgroundColor'});
        if(glyph)gsap.to(glyph,{color:lifted?colors.background:visual.color,duration:.45,ease:arrowEase,overwrite:'auto',clearProps:lifted?undefined:'color'});
      }else if(photo)gsap.to(photo,{scale:lifted?visual.photoScale:1,duration:1.2,ease:editorialEase,overwrite:'auto',clearProps:lifted?undefined:'transform'});
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
    const focus = (event: FocusEvent) => {const node = find(event.target); if (node) move(node, node.matches(':hover'));};
    const blur = (event: FocusEvent) => {const node = find(event.target); if (node) move(node, node.matches(':hover'));};
    root.addEventListener('pointerover', over); root.addEventListener('pointerout', out);
    root.addEventListener('pointercancel', out); root.addEventListener('focusin', focus); root.addEventListener('focusout', blur);
    return () => {
      root.removeEventListener('pointerover', over); root.removeEventListener('pointerout', out);
      root.removeEventListener('pointercancel', out); root.removeEventListener('focusin', focus); root.removeEventListener('focusout', blur);
    };
  }, {scope: host, dependencies: [enabled, changeKey], revertOnUpdate: true});
  return <View {...props} ref={host} />;
}
