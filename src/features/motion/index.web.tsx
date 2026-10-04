import {motionData} from './attributes';
import React, {useRef} from 'react';
import {View, type StyleProp, type ViewStyle} from 'react-native';
import {transitionDuration} from '../../domain/discovery/motion';
import {element, gsap, useGSAP, visibleItems} from './gsap.web';
import {useMotionEnabled} from './useMotionEnabled';
export {useMotionEnabled} from './useMotionEnabled';
export {MotionPhotoRelay} from './PhotoRelay';
const live=(node:HTMLElement)=>!node.closest('[inert],[aria-hidden="true"]')&&node.getBoundingClientRect().width>0;

/** Prototype choreography on live, bounded parts; retained routes never animate. */
export function MotionTransition({children,changeKey,kind='page',style,disabled=false}: {
  children:React.ReactNode;changeKey:string|number;kind?:keyof typeof transitionDuration;
  style?:StyleProp<ViewStyle>;disabled?:boolean;
}) {
  const host=useRef<View>(null), previous=useRef(changeKey), played=useRef(false);
  const enabled=useMotionEnabled()&&!disabled;
  useGSAP(()=>{
    const before=previous.current, changed=before!==changeKey;previous.current=changeKey;
    const node=element(host);if(!node||!enabled||(!changed&&played.current))return;
    played.current=true;
    const queries=(selector:string)=>Array.from(node.querySelectorAll<HTMLElement>(selector)).filter(live);
    if(queries('[data-motion-reveal]').length)return;
    // The question adapter owns its persistent frame. A navigator entrance must
    // not fade/translate that same question a second time.
    if(kind==='page'&&queries('[data-motion-transition="step"]').length)return;
    const parts=queries('[data-motion-part]').filter(part=>!part.parentElement?.closest('[data-motion-part]')&&!part.closest('[data-motion-entrance]'));
    const beforeStep=String(before).match(/choosing:(\d+)/)?.[1], nextStep=String(changeKey).match(/choosing:(\d+)/)?.[1];
    const direction=beforeStep!==undefined&&nextStep!==undefined&&Number(nextStep)<Number(beforeStep)?-1:1;
    const title=parts.filter(part=>part.dataset.motionPart==='title-line'||part.dataset.motionPart==='title');
    if(!title.length&&kind!=='card')title.push(...queries('[role="heading"][aria-level="1"]').slice(0,1));
    const entries=parts.filter(part=>part.dataset.motionPart==='entry');
    const options=parts.filter(part=>part.dataset.motionPart==='options');
    const details=parts.filter(part=>!title.includes(part)&&!entries.includes(part)&&!options.includes(part));
    const cards=kind==='card'?visibleItems(node):[];
    const targets=[...title,...entries,...details,...options,...cards];if(!targets.length)return;
    gsap.set(targets,{willChange:'transform,opacity'});
    const tl=gsap.timeline({defaults:{ease:'power3.out',overwrite:'auto'}});
    if(title.length)tl.fromTo(title,{y:(kind==='step'?18:28)*direction,opacity:.08},{y:0,opacity:1,duration:kind==='step'?.48:.62,stagger:.035,clearProps:'transform,opacity,willChange'},0);
    if(kind==='step'){
      if(options.length)tl.fromTo(options,{x:22*direction,opacity:.32},{x:0,opacity:1,duration:.46,clearProps:'transform,opacity,willChange'},.015);
    }else{
      if(details.length)tl.fromTo(details,{y:8*direction,opacity:.48},{y:0,opacity:1,duration:.42,stagger:.025,clearProps:'transform,opacity,willChange'},.035);
      if(entries.length)tl.fromTo(entries,{y:16*direction,opacity:.34},{y:0,opacity:1,duration:.52,stagger:.04,clearProps:'transform,opacity,willChange'},.055);
      if(cards.length)tl.fromTo(cards,{y:18*direction,opacity:.38},{y:0,opacity:1,duration:.62,stagger:.035,clearProps:'transform,opacity,willChange'},0);
    }
  },{scope:host,dependencies:[changeKey,enabled],revertOnUpdate:true});
  return <View ref={host} {...motionData({motionTransition:kind})} style={style}>{children}</View>;
}
