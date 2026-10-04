import React,{useRef} from 'react';
import {usePathname} from 'expo-router';
import {useApp} from '../../platform/AppProvider';
import {useViewport} from '../discovery/components';
import {gsap,useGSAP} from './gsap.web';
import {useMotionEnabled} from './useMotionEnabled';
/** Quiet orbital stroke retained from the approved transition prototype. */
export function RelayTrace(){
 const svg=useRef<SVGSVGElement>(null),path=useRef<SVGPathElement>(null);
 const {width,height}=useViewport(),pathname=usePathname(),{guided}=useApp();
 const enabled=useMotionEnabled(),key=`${pathname}:${pathname==='/customize'?`${guided.phase}:${guided.mode}:${guided.step}`:''}`;
 const previous=useRef(key);
 useGSAP(()=>{
  const changed=previous.current!==key;previous.current=key;
  const node=svg.current,line=path.current;if(!node||!line||!changed||!enabled)return;
  const length=line.getTotalLength();
  gsap.set(line,{strokeDasharray:length,strokeDashoffset:length});
  const tl=gsap.timeline();
  tl.fromTo(node,{opacity:0},{opacity:.22,duration:.14,ease:'sine.out'},0)
    .to(line,{strokeDashoffset:0,duration:.71,ease:'power2.inOut'},0)
    .to(node,{opacity:0,duration:.18,ease:'sine.in'},.67);
 },{scope:svg,dependencies:[key,enabled,width,height],revertOnUpdate:true});
 return <svg ref={svg} aria-hidden="true" data-motion-relay-trace="" viewBox={`0 0 ${width} ${height}`} style={{position:'fixed',inset:0,width:'100%',height:'100%',pointerEvents:'none',opacity:0,zIndex:3}}><path ref={path} d={`M ${width*.48} ${height*.72} C ${width*.58} ${height*.68}, ${width*.64} ${height*.27}, ${width*.86} ${height*.37}`} fill="none" stroke="#d4ad73" strokeWidth="1"/></svg>;
}
