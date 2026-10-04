import React, {useEffect, useRef} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {usePathname} from 'expo-router';
import {useApp} from '../../platform/AppProvider';
import {motionData} from '../motion/attributes';
import {element, gsap, useGSAP, useVisibleMotion} from '../motion/gsap.web';
import {useMotionStatus} from '../motion/useMotionEnabled';
import {useViewport} from './components';
import type {AmbientLightProps} from './AmbientLight';
import type {GlassScene, GlassStage} from './sculpture.web';

type Box = {left:number; top:number; width:number; height:number; opacity:number};
/** Exact spatial endpoints from the accepted Night Score prototype. */
function composition(scene:GlassScene, width:number, height:number) {
  const phone=width<=700, short=!phone&&height<=800, tablet=!phone&&width<=1100;
  const glass=(w:number,h:number,x:number,y:number,opacity=1):Box=>({width:w,height:h,left:x-w/2,top:y-h/2,opacity});
  const portal=(diameter:number,x:number,y:number,opacity=1)=>glass(diameter,diameter,x,y,opacity);
  if(scene==='home') {
    if(phone)return {glass:glass(380,460,width*.57,510),portal:portal(290,width*.57,488)};
    if(short)return {glass:glass(540,610,width*.74,height*.48),portal:portal(470,width*.74,height*.49)};
    if(tablet)return {glass:glass(540,620,width*.75,height*.48),portal:portal(450,width*.75,height*.49)};
    return {glass:glass(650,720,width*.72,height*.48),portal:portal(580,width*.72,height*.49)};
  }
  if(scene==='mode'||scene==='guided') {
    const opacity=scene==='guided'?.48:1;
    if(phone)return {glass:glass(350,430,width*.93,390,scene==='guided'?.14:1),portal:portal(260,width*.93,386,scene==='guided'?.25:1)};
    return {glass:glass(500,600,width*.80,height*.50,opacity),portal:portal(410,width*.80,height*.48,scene==='guided'?.5:1)};
  }
  if(scene==='recipe')return {glass:glass(500,600,width*.3,height*.49,0),portal:phone?portal(290,width*.5,415,.55):portal(470,width*.3,height*.49,.55)};
  return {glass:glass(500,600,width*.94,height*.48,0),portal:phone?portal(450,width*.9,105,.18):portal(680,width*.94,180,.18)};
}

/** One continuous, non-interactive space; route changes never remount the coupe. */
export function AmbientLight({paused, reduceMotion = false}: AmbientLightProps) {
  const host=useRef<View>(null), portal=useRef<View>(null), glassRig=useRef<View>(null), glass=useRef<View>(null);
  const stage=useRef<GlassStage|null>(null);
  const last=useRef<{scene:GlassScene;width:number;height:number;geometry:ReturnType<typeof composition>}|null>(null);
  const spatial=useRef<gsap.core.Timeline|null>(null);
  const {ready,enabled}=useMotionStatus();
  const animated=ready&&enabled&&!paused&&!reduceMotion;
  const {width,height}=useViewport();
  const pathname=usePathname();
  const {guided}=useApp();
  const scene:GlassScene=pathname==='/'?'home':pathname.startsWith('/cocktails/')?'recipe':pathname==='/make'?'guided':pathname==='/customize'?guided.mode===null?'mode':guided.phase==='choosing'?'guided':'results':'discover';
  const sculptureVisible=scene==='home'||scene==='mode'||scene==='guided';
  const running=useVisibleMotion(host,paused||reduceMotion||!sculptureVisible);
  const latest=useRef({scene,running,reduceMotion});latest.current={scene,running,reduceMotion};
  const geometry=composition(scene,width,height);
  useEffect(()=>{
    let disposed=false;
    void import('./sculpture.web').then(({createGlassStage})=>{
      const node=element(glass);if(disposed||!node)return;
      const current=latest.current;
      stage.current=createGlassStage(node,{paused:!current.running,reduced:current.reduceMotion});
      stage.current.setScene(current.scene,{duration:0});
    }).catch(()=>{const node=element(glass);if(node)node.dataset.glassError='unavailable';});
    return()=>{disposed=true;stage.current?.dispose();stage.current=null;};
  },[]);
  useEffect(()=>{
    stage.current?.setReduced(reduceMotion);
    stage.current?.setPaused(!running);
    stage.current?.setScene(scene,{duration:running ? .86 : 0});
  },[scene,running,reduceMotion]);
  useGSAP(()=>{
    const prior=last.current;last.current={scene,width,height,geometry};
    const changed=Boolean(prior&&prior.scene!==scene);
    const resized=Boolean(prior&&(prior.width!==width||prior.height!==height));
    const nodes=[{node:element(portal),box:geometry.portal,old:prior?.geometry.portal},{node:element(glassRig),box:geometry.glass,old:prior?.geometry.glass}];
    // Capture every current transform before writes. CSS commits the endpoint
    // once; only the compositor bridges the previous pose to that endpoint.
    const poses=nodes.map(({node,box,old})=>({node,box,from:node&&old?{
      x:old.left+Number(gsap.getProperty(node,'x'))-box.left,
      y:old.top+Number(gsap.getProperty(node,'y'))-box.top,
      scaleX:old.width*Number(gsap.getProperty(node,'scaleX'))/box.width,
      scaleY:old.height*Number(gsap.getProperty(node,'scaleY'))/box.height,
      // React has already committed the new inline opacity at this point;
      // the previous endpoint retains the actual outgoing scene's opacity.
      opacity:old.opacity,
    }:null}));
    spatial.current?.kill();
    const timeline=gsap.timeline({defaults:{duration:.85,ease:'power3.inOut'}});
    spatial.current=timeline;
    for(const {node,box,from} of poses){if(!node)continue;gsap.killTweensOf(node);if(!from||!animated||!changed||resized){gsap.set(node,{x:0,y:0,scaleX:1,scaleY:1,opacity:box.opacity,clearProps:'willChange'});continue;}
      timeline.fromTo(node,{...from,willChange:'transform,opacity'},{x:0,y:0,scaleX:1,scaleY:1,opacity:box.opacity,clearProps:'transform,willChange'},0);
    }
    return()=>{timeline.kill();};
  },{scope:host,dependencies:[scene,width,height,animated]});
  return <View ref={host} {...motionData({motionLoop:'night-space',nightScene:scene})} pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={styles.root}>
    <View style={styles.light}/><View style={styles.grain}/>
    <View ref={portal} {...motionData({motionSpacePortal:''})} style={[styles.rig,styles.portal,geometry.portal]}><View style={styles.inner}/><View style={styles.orbit}/><View style={styles.secondOrbit}/></View>
    <View ref={glassRig} {...motionData({motionSpaceGlass:''})} style={[styles.rig,geometry.glass]}><View ref={glass} style={styles.fill}/></View>
    {width>700&&<Text style={[styles.signature,{opacity:scene==='guided'?.5:scene==='home'?1:0}]}>A STUDY IN TASTE &amp; TIME</Text>}
  </View>;
}
export default AmbientLight;
const styles=StyleSheet.create({
  root:{position:'absolute',top:0,right:0,bottom:0,left:0,overflow:'hidden',zIndex:0,backgroundImage:'radial-gradient(ellipse at 85% 35%,#1d2b23 0,transparent 60%)'} as never,
  light:{position:'absolute',right:'-10%',top:'3%',width:'75%',height:'90%',backgroundImage:'radial-gradient(ellipse,rgba(181,198,169,.14),transparent 64%)'} as never,
  grain:{position:'absolute',top:0,right:0,bottom:0,left:0,opacity:.027,backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 170 170\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.89\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Cpath fill=\'white\' filter=\'url(%23n)\' d=\'M0 0h170v170H0z\'/%3E%3C/svg%3E")'} as never,
  rig:{position:'absolute',transformOrigin:'0 0'} as never,
  fill:{position:'absolute',top:0,right:0,bottom:0,left:0},
  portal:{borderRadius:999,borderWidth:1,borderColor:'rgba(181,198,169,.32)',backgroundImage:'radial-gradient(circle at 30% 20%,rgba(174,194,159,.19),rgba(68,88,65,.16) 40%,rgba(10,17,12,.5) 75%)',boxShadow:'0 0 85px rgba(147,176,129,.05),inset 0 0 70px rgba(0,0,0,.16)'} as never,
  inner:{position:'absolute',top:15,left:15,right:15,bottom:15,borderRadius:999,borderWidth:1,borderColor:'rgba(181,198,169,.08)'},
  orbit:{position:'absolute',top:-37,left:-37,right:-37,bottom:-37,borderRadius:999,borderWidth:1,borderColor:'rgba(212,173,115,.17)',transform:[{rotate:'-28deg'},{scaleY:.58}]},
  secondOrbit:{position:'absolute',top:-75,left:-75,right:-75,bottom:-75,borderRadius:999,borderWidth:1,borderColor:'rgba(181,198,169,.09)',transform:[{rotate:'32deg'},{scaleY:.7}]},
  signature:{position:'absolute',right:'6.1%',top:'16%',fontSize:10,letterSpacing:2.6,color:'#a7b3a7',writingMode:'vertical-rl'} as never,
});
