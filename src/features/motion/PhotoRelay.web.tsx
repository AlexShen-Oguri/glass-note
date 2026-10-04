import React, {useEffect, useRef} from 'react';
import {View} from 'react-native';
import {motionData} from './attributes';
import {element, gsap, useGSAP} from './gsap.web';
import {useMotionEnabled} from './useMotionEnabled';

type Frame = {left: number; top: number; width: number; height: number};
type Shape = {rx: number; ry: number; cx: number; cy: number; ellipse: boolean};
type PhotoFlight = {
  id: string; frame: Frame; shape: Shape; canvas: HTMLCanvasElement;
  width: number; height: number; source: HTMLElement; gate: HTMLStyleElement;
  target?: HTMLElement; ready?: boolean; landed?: boolean; observer?: MutationObserver;
  paint?: number; timeline?: gsap.core.Timeline; timeout?: ReturnType<typeof setTimeout>;
};

const size = (value: string, reference: number) => {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number * (value.includes('%') ? reference / 100 : 1) : 0;
};
const readFrame = (node: HTMLElement): Frame => {
  const rect = node.getBoundingClientRect();
  return {left: rect.left, top: rect.top, width: rect.width, height: rect.height};
};
const readShape = (node: HTMLElement, frame: Frame): Shape => {
  const style = getComputedStyle(node);
  const ellipse = style.clipPath.match(/^ellipse\(\s*([\d.]+(?:%|px))\s+([\d.]+(?:%|px))(?:\s+at\s+([^\)]+))?\s*\)$/);
  if (ellipse) {
    const center = (ellipse[3] ?? '50% 50%').split(/\s+/);
    return {ellipse: true, rx: size(ellipse[1]!, frame.width), ry: size(ellipse[2]!, frame.height), cx: size(center[0]!, frame.width), cy: size(center[1] ?? center[0]!, frame.height)};
  }
  const radius = style.borderTopLeftRadius.split(/\s+/);
  return {ellipse: false, rx: size(radius[0]!, frame.width), ry: size(radius[1] ?? radius[0]!, frame.height), cx: frame.width / 2, cy: frame.height / 2};
};
const pose = (flight: PhotoFlight, frame: Frame, shape: Shape, zoom = 1) => {
  const scale = Math.max(frame.width / flight.width, frame.height / flight.height) * zoom;
  const horizontal = (flight.width - frame.width / scale) / 2;
  const vertical = (flight.height - frame.height / scale) / 2;
  const top = vertical + (shape.ellipse ? (shape.cy - shape.ry) / scale : 0);
  const right = horizontal + (shape.ellipse ? (frame.width - shape.cx - shape.rx) / scale : 0);
  const bottom = vertical + (shape.ellipse ? (frame.height - shape.cy - shape.ry) / scale : 0);
  const left = horizontal + (shape.ellipse ? (shape.cx - shape.rx) / scale : 0);
  return {
    x: frame.left - horizontal * scale,
    y: frame.top - vertical * scale,
    scale,
    clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px round ${shape.rx / scale}px / ${shape.ry / scale}px)`,
  };
};

/** A single captured texture bridges routes while both React image trees stay owned. */
export function MotionPhotoRelay({changeKey}: {changeKey: string}) {
  const host = useRef<View>(null);
  const pending = useRef<PhotoFlight | null>(null);
  const launch = useRef<(() => void) | null>(null);
  const deferLaunch=useRef<(()=>void)|null>(null);
  const enabled = useMotionEnabled();
  const settle = () => {
    const flight = pending.current;
    if (!flight) return;
    pending.current = null;
    if (flight.timeout) clearTimeout(flight.timeout);
    flight.timeline?.kill();
    flight.observer?.disconnect();
    if (flight.paint !== undefined) cancelAnimationFrame(flight.paint);
    flight.gate.remove();
    flight.canvas.remove();
  };
  useGSAP((_context, contextSafe) => {
    const root = element(host);
    if (!root || !contextSafe) return;
    if (!enabled) {settle(); return;}
    const recipePhoto = () => Array.from(document.querySelectorAll<HTMLElement>('[data-motion-photo-target]'))
      .find(node => !node.closest('[inert],[aria-hidden="true"]') && readFrame(node).width > 0) ?? null;
    const capture = (source: HTMLElement | null) => {
      settle();
      const image = source?.querySelector<HTMLImageElement>('img');
      if (!source || !image?.complete || !image.naturalWidth || !image.naturalHeight) return;
      const frame = readFrame(source);
      if (!frame.width || !frame.height || frame.top >= window.innerHeight || frame.top + frame.height <= 0) return;
      const shape = readShape(source, frame);
      // RN Web paints the background of the Image view; its <img> is transparent.
      // Retain the visible hover crop rather than snapping back to the raw photo.
      let zoom = 1, visual = image.parentElement;
      while (visual && visual !== source) {
        const transform = getComputedStyle(visual).transform;
        if (transform !== 'none') zoom *= new DOMMatrixReadOnly(transform).m11;
        visual = visual.parentElement;
      }
      let opacity = 1;
      for (let node: HTMLElement | null = source; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity);
      const canvas = document.createElement('canvas');
      const pixelScale = Math.min(1, 1600 / image.naturalWidth, 1600 / image.naturalHeight);
      canvas.width = Math.max(1, Math.round(image.naturalWidth * pixelScale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * pixelScale));
      const context = canvas.getContext('2d');
      if (!context) return;
      try {context.drawImage(image, 0, 0, canvas.width, canvas.height);} catch {return;}
      canvas.setAttribute('aria-hidden', 'true');
      canvas.dataset.motionPhotoRelay = source.dataset.motionPhoto ?? '';
      Object.assign(canvas.style, {position: 'fixed', left: '0', top: '0', width: `${canvas.width}px`, height: `${canvas.height}px`, transformOrigin: '0 0', pointerEvents: 'none', zIndex: '40', willChange: 'transform,clip-path'});
      const id = source.dataset.motionPhoto ?? '';
      // Install before navigation: even a cold destination's first paint is
      // concealed, while the captured texture supplies its continuous pixels.
      const gate = document.createElement('style');
      gate.dataset.motionPhotoGate = id;
      gate.textContent = `[data-motion-photo="${CSS.escape(id)}"]{opacity:0!important}`;
      const flight: PhotoFlight = {id, frame, shape, canvas, source, gate, width: canvas.width, height: canvas.height};
      pending.current = flight;
      gsap.set(canvas, {...pose(flight, frame, shape, zoom), opacity});
      root.appendChild(canvas);
      document.head.appendChild(gate);
      // A cancelled link or unchanged route must never leave a captured photo.
      flight.timeout = setTimeout(settle, 5000);
    };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const node = event.target instanceof Element ? event.target : null;
      const returned = node?.closest('[data-motion-photo-return]');
      if (returned) {capture(recipePhoto()); return;}
      const link = node?.closest<HTMLAnchorElement>('a[href]');
      if (!link || link.origin !== window.location.origin) return;
      if (!link.pathname.startsWith('/cocktails/')) {settle(); return;}
      const source = link.querySelector<HTMLElement>('[data-motion-photo]') ?? link.closest<HTMLElement>('[data-motion-photo]');
      if (pending.current?.source === source) return;
      capture(source);
    };
    const history = () => {if(!pending.current)capture(recipePhoto());};
    // Destination geometry is measured once. A moving viewport immediately
    // hands presentation back to the live photo instead of landing stale pixels.
    // Keep the pre-launch capture through the route's own scroll restoration.
    const viewportChanged = () => {if (pending.current?.timeline) settle();else if(pending.current)deferLaunch.current?.();};
    launch.current = contextSafe(() => {
      const flight = pending.current;
      if (!flight) return;
      const matches = Array.from(document.querySelectorAll<HTMLElement>('[data-motion-photo]')).filter(node => node.dataset.motionPhoto === flight.id
        && node !== flight.source && !node.closest('[inert],[aria-hidden="true"]') && getComputedStyle(node).visibility !== 'hidden' && readFrame(node).width > 0);
      const returning = flight.source.hasAttribute('data-motion-photo-target');
      const target = matches.find(node => node.hasAttribute('data-motion-photo-target') !== returning);
      if (!target) return;
      const frame = readFrame(target);
      let opacity = 1;
      let ancestor:HTMLElement|null=target;
      while(ancestor){
        if (ancestor !== target && !ancestor.style.willChange.includes('opacity')) opacity *= Number(getComputedStyle(ancestor).opacity);
        if(ancestor.matches('[data-motion-item],[data-motion-part],[data-motion-transition]')){
          const transform=getComputedStyle(ancestor).transform;
          if(transform!=='none'){const matrix=new DOMMatrixReadOnly(transform);frame.left-=matrix.m41;frame.top-=matrix.m42;}
        }
        ancestor=ancestor.parentElement;
      }
      const shape = readShape(target, frame);
      if (frame.top >= window.innerHeight || frame.top + frame.height <= 0) {settle(); return;}
      flight.target = target;
      if (flight.timeout) clearTimeout(flight.timeout);
      // Decoding runs alongside the flight. On a slow image, retain the landed
      // texture until the real Image view can paint, without blocking controls.
      const prepare = () => {
        const image = target.querySelector<HTMLImageElement>('img');
        if (!image) return;
        flight.observer?.disconnect();
        image.decode().then(() => {
          if (pending.current !== flight) return;
          flight.paint = requestAnimationFrame(() => {
            flight.ready = true;
            if (flight.landed) settle();
          });
        }).catch(() => {if (pending.current === flight) settle();});
      };
      flight.observer = new MutationObserver(prepare);
      flight.observer.observe(target, {childList: true, subtree: true});
      prepare();
      // Failed or cancelled image requests must not retain presentation forever.
      flight.timeout = setTimeout(settle, 5000);
      flight.timeline = gsap.timeline({onComplete: () => {flight.landed = true; if (flight.ready) settle();}});
      flight.timeline.to(flight.canvas, {...pose(flight, frame, shape), opacity, duration: .65, ease: 'power3.inOut'}, 0);
    });
    document.addEventListener('click', click, true);
    document.addEventListener('scroll', viewportChanged, {capture: true, passive: true});
    window.addEventListener('popstate', history);
    window.addEventListener('resize', viewportChanged, {passive: true});
    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', viewportChanged, {passive: true});
    viewport?.addEventListener('scroll', viewportChanged, {passive: true});
    return () => {
      document.removeEventListener('click', click, true);
      document.removeEventListener('scroll', viewportChanged, true);
      window.removeEventListener('popstate', history);
      window.removeEventListener('resize', viewportChanged);
      viewport?.removeEventListener('resize', viewportChanged);
      viewport?.removeEventListener('scroll', viewportChanged);
      launch.current = null;
      settle();
    };
  }, {scope: host, dependencies: [enabled], revertOnUpdate: true});
  useEffect(() => {
    if (!enabled || !pending.current) return;
    if (pending.current.timeline) {settle(); return;}
    let outer:number|undefined,inner:number|undefined;
    const attempt=()=>{
      if(pending.current&&!pending.current.timeline)launch.current?.();
      if(!pending.current||pending.current.timeline)observer.disconnect();
    };
    const schedule=()=>{
      if(outer!==undefined)cancelAnimationFrame(outer);if(inner!==undefined)cancelAnimationFrame(inner);
      outer=requestAnimationFrame(()=>{inner=requestAnimationFrame(attempt);});
    };
    const observer=new MutationObserver(schedule);
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-hidden','inert']});
    deferLaunch.current=schedule;schedule();
    return ()=>{deferLaunch.current=null;observer.disconnect();if(outer!==undefined)cancelAnimationFrame(outer);if(inner!==undefined)cancelAnimationFrame(inner);};
  }, [changeKey, enabled]);
  return <View ref={host} pointerEvents="none" accessible={false} {...motionData({motionPhotoRelayRoot: ''})} style={{position: 'absolute', width: 0, height: 0, zIndex: 40}} />;
}
