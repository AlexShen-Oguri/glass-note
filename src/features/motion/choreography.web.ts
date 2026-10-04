import {gsap} from './gsap.web';
export type RelayKind='page'|'step'|'results'|'photo'|'back'|'intro'|'replay'|'filter';
type Entrance={timeline:gsap.core.Timeline;targets:HTMLElement[];active:boolean};
type Handoff={kind:RelayKind;direction:1|-1;skipped:boolean};
let handoff:Handoff|null=null;
const running=new Set<Entrance>(),listeners=new Set<()=>void>();
export const livePart=(node:HTMLElement)=>!node.closest('[inert],[aria-hidden="true"]')&&node.getBoundingClientRect().width>0;
export function subscribeRelayTrace(listener:()=>void){listeners.add(listener);return ()=>{listeners.delete(listener);};}
export function emitRelayTrace(){for(const listener of listeners)listener();}
export function beginHandoff(kind:RelayKind,direction:1|-1){
  for(const entrance of running){entrance.timeline.progress(1).kill();}
  running.clear();handoff={kind,direction,skipped:false};emitRelayTrace();
}
export function settleHandoff(){if(handoff)handoff.skipped=true;for(const entrance of running)entrance.timeline.progress(1);}
export function releaseHandoff(){handoff=null;}

/** Exact 4188 foreground score, applied before the incoming React paint. */
export function relayEntrance(root:HTMLElement,onComplete?:()=>void,cardsOnly=false,localKind?:RelayKind){
  const current=handoff,kind=localKind??current?.kind??'intro',direction=current?.direction??1;
  const query=(selector:string)=>Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(livePart);
  const lines=cardsOnly?[]:query('[data-motion-part="title-line"]');
  const details=cardsOnly||kind==='step'?[]:query('[data-motion-part="kicker"],[data-motion-part="detail"],[data-motion-part="copy"]')
    .filter(node=>!node.querySelector('[data-motion-part="title-line"]')&&!node.parentElement?.closest('[data-motion-part="copy"]'));
  const entries=cardsOnly?[]:query('[data-motion-part="entry"]');
  const grid=kind==='step'?query('[data-motion-part="options"]'):[];
  const cards=query('[data-motion-item]').filter(node=>cardsOnly||!node.closest('[data-motion-transition="card"]')).slice(0,8);
  const photoDetails=kind==='photo'?query('[data-motion-part="menu"]'):[];
  const targets=[...lines,...details,...entries,...grid,...cards,...photoDetails];
  if(!targets.length){onComplete?.();return null;}
  const clearProps='transform,opacity,visibility,willChange';
  gsap.set(targets,{willChange:'transform,opacity'});
  const entry:Entrance={targets,active:true,timeline:gsap.timeline({paused:true,defaults:{ease:'power3.out'},onComplete:()=>{running.delete(entry);if(entry.active)onComplete?.();}})};
  const titleDuration=kind==='step'?.48:kind==='photo'?.58:kind==='replay'?.56:.62;
  if(lines.length)entry.timeline.fromTo(lines,{y:(kind==='step'||kind==='replay'?18:28)*direction,opacity:.08},{y:0,opacity:1,duration:titleDuration,stagger:.035,clearProps},0);
  if(kind==='step'){
    if(grid.length)entry.timeline.fromTo(grid,{x:22*direction,opacity:.32},{x:0,opacity:1,duration:.46,clearProps},.015);
  }else{
    if(details.length)entry.timeline.fromTo(details,{y:8*direction,opacity:.48},{y:0,opacity:1,duration:.42,stagger:.025,clearProps},.035);
    if(entries.length)entry.timeline.fromTo(entries,{y:16*direction,opacity:.34},{y:0,opacity:1,duration:.52,stagger:.04,clearProps},.055);
    if(cards.length)entry.timeline.fromTo(cards,{y:(kind==='results'?24:18)*direction,opacity:.38},{y:0,opacity:1,duration:.62,stagger:.035,clearProps},0);
    if(photoDetails.length)entry.timeline.fromTo(photoDetails,{y:14*direction,opacity:.5},{y:0,opacity:1,duration:.48,stagger:.035,clearProps},.065);
  }
  running.add(entry);
  if(current?.skipped)entry.timeline.progress(1);else entry.timeline.play();
  // All owners in one React commit see the same score; cold routes acknowledge
  // only after they actually mount, rather than an arbitrary frame timeout.
  if(current)queueMicrotask(()=>{if(handoff===current)releaseHandoff();});
  return {timeline:entry.timeline,dispose:()=>{entry.active=false;running.delete(entry);entry.timeline.kill();gsap.set(entry.targets,{clearProps});}};
}
