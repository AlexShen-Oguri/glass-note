import React,{useRef} from 'react';
import {View,type StyleProp,type ViewStyle} from 'react-native';
import {transitionDuration} from '../../domain/discovery/motion';
import {motionData} from './attributes';
import {element,useGSAP} from './gsap.web';
import {relayEntrance,livePart} from './choreography.web';
import {useMotionStatus} from './useMotionEnabled';
export {useMotionEnabled} from './useMotionEnabled';
export {MotionPhotoRelay} from './PhotoRelay';

/** Live route/step entrances use the same score and have a single owner. */
export function MotionTransition({children,changeKey,kind='page',style,disabled=false}: {
  children:React.ReactNode;changeKey:string|number;kind?:keyof typeof transitionDuration;
  style?:StyleProp<ViewStyle>;disabled?:boolean;
}){
  const host=useRef<View>(null),played=useRef<string|number|null>(null);
  const {ready,enabled}=useMotionStatus();
  useGSAP((_context,contextSafe)=>{
    const node=element(host);if(disabled){played.current=null;return;}
    if(!node||!ready||played.current===changeKey||!contextSafe)return;
    if(!enabled){played.current=changeKey;return;}
    let entrance:ReturnType<typeof relayEntrance>=null;
    const observer=new MutationObserver(()=>attempt());
    const attempt=contextSafe(()=>{
      const live=(selector:string)=>Array.from(node.querySelectorAll<HTMLElement>(selector)).some(livePart);
      if(live('[data-motion-reveal]')||(kind==='page'&&live('[data-motion-transition="step"],[data-motion-transition="completion"]'))){played.current=changeKey;observer.disconnect();return;}
      entrance=relayEntrance(node,undefined,kind==='card');
      if(entrance){played.current=changeKey;observer.disconnect();}
    });
    observer.observe(node,{childList:true,subtree:true});attempt();
    return ()=>{observer.disconnect();entrance?.dispose();};
  },{scope:host,dependencies:[changeKey,ready,enabled,disabled],revertOnUpdate:true});
  return <View ref={host} {...motionData({motionTransition:kind,...(kind==='step'||kind==='completion'?{sceneContent:''}:{})})} style={style}>{children}</View>;
}
