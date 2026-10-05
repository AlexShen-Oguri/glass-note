import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {usePathname} from 'expo-router';
import {useApp} from '../../platform/AppProvider';
import {motionData} from '../motion/attributes';
import {element, gsap, useGSAP, useVisibleMotion} from '../motion/gsap.web';
import {livePart} from '../motion/choreography.web';
import {useGlassReveal} from '../motion/SceneTransition.web';
import {useMotionStatus} from '../motion/useMotionEnabled';
import {isCompactViewport, useViewport} from './components';
import type {AmbientLightProps} from './AmbientLight';
import type {GlassScene, GlassStage} from './sculpture.web';

type Box = {left:number; top:number; width:number; height:number; opacity:number};
/** Exact spatial endpoints from the accepted Night Score prototype. */
function composition(scene:GlassScene, width:number, height:number) {
  const phone=isCompactViewport({width,height}), short=!phone&&height<=800, tablet=!phone&&width<=1100;
  const glass=(w:number,h:number,x:number,y:number,opacity=1):Box=>({width:w,height:h,left:x-w/2,top:y-h/2,opacity});
  const portal=(diameter:number,x:number,y:number,opacity=1)=>glass(diameter,diameter,x,y,opacity);
  if(scene==='home') {
    if(phone)return {glass:glass(Math.min(350,width*.92),330,width*.5,200),portal:portal(Math.min(290,width*.8),width*.5,200)};
    if(short)return {glass:glass(540,610,width*.74,height*.48),portal:portal(470,width*.74,height*.49)};
    if(tablet)return {glass:glass(540,620,width*.75,height*.48),portal:portal(450,width*.75,height*.49)};
    return {glass:glass(650,720,width*.72,height*.48),portal:portal(580,width*.72,height*.49)};
  }
  if(scene==='guided')return phone?{glass:glass(Math.min(320,width*.86),280,width*.5,200),portal:portal(Math.min(250,width*.72),width*.5,200,.8)}:{glass:glass(500,530,width*.78,height*.54),portal:portal(440,width*.78,height*.54)};
  if(scene==='mode') {
    const opacity=1;
    if(phone)return {glass:glass(Math.min(320,width*.86),280,width*.5,200),portal:portal(Math.min(250,width*.72),width*.5,200)};
    return {glass:glass(500,600,width*.80,height*.50,opacity),portal:portal(410,width*.80,height*.48,1)};
  }
  if(scene==='recipe')return {glass:glass(500,600,width*.3,height*.49,0),portal:phone?portal(290,width*.5,415,.55):portal(470,width*.3,height*.49,.55)};
  return {glass:glass(500,600,width*.94,height*.48,0),portal:phone?portal(450,width*.9,105,.18):portal(680,width*.94,180,.18)};
}

/** One continuous, non-interactive space; route changes never remount the coupe. */
export function AmbientLight({paused, reduceMotion = false}: AmbientLightProps) {
  const host=useRef<View>(null), portal=useRef<View>(null), glassRig=useRef<View>(null), glass=useRef<View>(null);
  const flow=useRef<View>(null),[slotVisible,setSlotVisible]=useState(false);
  const alignMobile=useRef<(()=>void)|null>(null);
  const stage=useRef<GlassStage|null>(null),loaded=useRef<Promise<GlassStage|null>>(Promise.resolve(null));
  const revealController=useGlassReveal(),[revealActive,setRevealActive]=useState(false),signature=useRef<Text>(null);
  const revealCancel=useRef<(()=>void)|null>(null);
  const last=useRef<{scene:GlassScene;width:number;height:number;geometry:ReturnType<typeof composition>}|null>(null);
  const spatial=useRef<gsap.core.Timeline|null>(null);
  const {ready,enabled}=useMotionStatus();
  const animated=ready&&enabled&&!paused&&!reduceMotion;
  const {width,height}=useViewport();
  const compact=isCompactViewport({width,height});
  const pathname=usePathname();
  const {guided,locale}=useApp();
  const scene:GlassScene=pathname==='/'?'home':pathname.startsWith('/cocktails/')?'recipe':pathname==='/make'?'guided':pathname==='/customize'?guided.mode===null?'mode':guided.phase==='choosing'||guided.phase==='revealing'||revealActive?'guided':'results':'discover';
  const sculptureVisible=scene==='home'||scene==='mode'||scene==='guided';
  const running=useVisibleMotion(host,paused||reduceMotion||!sculptureVisible||(compact&&!slotVisible&&!revealActive));
  const latest=useRef({scene,running,reduceMotion,revealing:false});latest.current={scene,running,reduceMotion,revealing:guided.phase==='revealing'||revealActive};
  const geometry=composition(scene,width,height);
  useGSAP(()=>{
    const node=element(flow),root=element(host);
    if(!node||!root||!compact||!sculptureVisible){setSlotVisible(false);return;}
    let anchor=Array.from(document.querySelectorAll<HTMLElement>('[data-night-glass-anchor]')).find(livePart);
    const scroller=anchor?.closest<HTMLElement>('[data-night-scroll]');
    if(!anchor||!scroller){gsap.set(node,{opacity:0});setSlotVisible(false);return;}
    gsap.set(node,{opacity:1});
    const moveX=gsap.quickSetter(node,'x','px'),moveY=gsap.quickSetter(node,'y','px');
    let origin=0;
    const scroll=()=>{if(!latest.current.revealing)moveY(origin-scroller.scrollTop);};
    const measure=()=>{
      const current=latest.current.revealing?anchor:Array.from(scroller.querySelectorAll<HTMLElement>('[data-night-glass-anchor]')).find(livePart);
      if(!current)return;
      if(current!==anchor){
        resize.unobserve(anchor!);visible.unobserve(anchor!);anchor=current;
        resize.observe(anchor);visible.observe(anchor);
      }
      const frame=anchor.getBoundingClientRect(),bounds=root.getBoundingClientRect();
      origin=frame.top+frame.height/2-bounds.top-200+scroller.scrollTop;
      moveX(frame.left+frame.width/2-bounds.left-width/2);moveY(origin-scroller.scrollTop);
    };
    // The persistent GPU scene follows the real content slot. Scroll reads only
    // its offset; remeasure after layout changes, never once per animation frame.
    alignMobile.current=measure;
    const resize=new ResizeObserver(()=>{if(!latest.current.revealing)measure();});
    resize.observe(scroller.firstElementChild??anchor);resize.observe(anchor);
    const visible=new IntersectionObserver(([entry])=>setSlotVisible(Boolean(entry?.isIntersecting)),{root:scroller});
    const content=new MutationObserver(()=>{if(!latest.current.revealing)measure();});
    content.observe(scroller,{childList:true,subtree:true});
    visible.observe(anchor);measure();
    scroller.addEventListener('scroll',scroll,{passive:true});
    return()=>{alignMobile.current=null;content.disconnect();resize.disconnect();visible.disconnect();scroller.removeEventListener('scroll',scroll);gsap.set(node,{clearProps:'transform'});};
  },{scope:host,dependencies:[pathname,scene,width,height,locale,guided.step,guided.mode],revertOnUpdate:true});
  useEffect(()=>{
    let disposed=false;
    loaded.current=import('./sculpture.web').then(({createGlassStage})=>{
      const node=element(glass);if(disposed||!node)return null;
      const current=latest.current;
      stage.current=createGlassStage(node,{paused:!current.running,reduced:current.reduceMotion});
      stage.current.setScene(current.scene,{duration:0});
      stage.current.setFlavourState({aromas:guided.draft.flavours,tastes:guided.draft.tastes,strength:guided.draft.strengths?.[0],approach:guided.draft.approachability?.[0]});
      return stage.current;
    }).catch(()=>{const node=element(glass);if(node)node.dataset.glassError='unavailable';return null;});
    return()=>{disposed=true;revealCancel.current?.();stage.current?.dispose();stage.current=null;};
  },[]);
  useEffect(()=>{
    stage.current?.setReduced(reduceMotion);
    stage.current?.setPaused(!running);
    stage.current?.setScene(scene,{duration:running ? .86 : 0});
  },[scene,running,reduceMotion]);
  useEffect(()=>{stage.current?.setFlavourState({aromas:guided.draft.flavours,tastes:guided.draft.tastes,strength:guided.draft.strengths?.[0],approach:guided.draft.approachability?.[0]});},[guided.draft]);
  useGSAP(()=>{
    if(revealActive)return;
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
  },{scope:host,dependencies:[scene,width,height,animated,revealActive]});
  useGSAP((_context,contextSafe)=>{
    if(!contextSafe)return;
    revealController.current=contextSafe((outgoing,results,onResults,onComplete)=>{
      const rig=element(glassRig),ring=element(portal),label=element(signature);
      if(!rig||!ring){onResults();onComplete();return ()=>{};}
      let stopped=false,timeline:gsap.core.Timeline|null=null;
      const visibility=()=>{timeline?.paused(document.hidden);};
      document.addEventListener('visibilitychange',visibility);
      const presentation={turn:0,solidity:0,impulseX:0};
      const modeBar=outgoing.closest('[data-motion-transition="step"]')?.querySelector<HTMLElement>('[data-motion-mode-bar]');
      const departing=[outgoing,...(modeBar?[modeBar]:[])];
      setRevealActive(true);spatial.current?.kill();gsap.killTweensOf([rig,ring]);
      const restore=()=>{
        if(stopped)return;stopped=true;timeline?.kill();revealCancel.current=null;
        document.removeEventListener('visibilitychange',visibility);
        stage.current?.setPresentation({turn:0,solidity:0,impulseX:0});
        gsap.set([ring,...(label?[label]:[])],{clearProps:'transform,opacity,willChange'});
        gsap.set(rig,{opacity:0,clearProps:'transform,willChange'});
        gsap.set(departing,{clearProps:'transform,opacity,willChange'});
        gsap.set(results,{clearProps:'transform,opacity,willChange'});
        gsap.set(results.querySelectorAll('[data-reveal-entry]'),{clearProps:'transform,opacity,willChange'});
        last.current=null;setRevealActive(false);
      };
      revealCancel.current=()=>{restore();onResults();onComplete();};
      void loaded.current.then(async model=>{
        if(!model||!await model.ready){if(!stopped){restore();onResults();onComplete();}return;}
        if(stopped)return;
        model.setScene('guided',{duration:0});model.setPaused(false);model.setPresentation(presentation);
        if(compact){
          const scroller=outgoing.closest<HTMLElement>('[data-night-scroll]');
          if(scroller)scroller.scrollTop=0;
          alignMobile.current?.();
        }
        const rect=rig.getBoundingClientRect();
        const x=window.innerWidth/2-(rect.left+rect.width/2),y=window.innerHeight/2-(rect.top+rect.height/2);
        outgoing.inert=true;gsap.set(rig,{willChange:'transform,opacity'});
        // Decode real result photos during the cup sequence, without delaying search.
        const decoded=Promise.all(Array.from(results.querySelectorAll('img')).map(img=>img.decode().catch(()=>{})));
        const update=()=>model.setPresentation(presentation);
        const enter=contextSafe(async()=>{
          await decoded;if(stopped)return;
          const nodes=[...(modeBar?[modeBar]:[]),...Array.from(results.querySelectorAll<HTMLElement>('[data-motion-results-lead] > *,[data-motion-item], [data-reveal-empty], [data-reveal-actions]'))];
          nodes.forEach(node=>node.dataset.revealEntry='');
          gsap.set(nodes,{y:28,opacity:0,willChange:'transform,opacity'});
          onResults();
          timeline=gsap.timeline({paused:document.hidden,onComplete:()=>{restore();onComplete();}}).to(nodes,{y:0,opacity:1,duration:.65,stagger:.055,ease:'power3.out',clearProps:'transform,opacity,willChange'});
        });
        timeline=gsap.timeline({defaults:{ease:'power2.inOut'}})
          .to(departing,{opacity:0,y:-12,duration:.35},0)
          .to(label??[],{opacity:0,duration:.35},0)
          .to(ring,{opacity:.12,duration:.72},.22)
          .to(presentation,{solidity:1,duration:.70,onUpdate:update},.10)
          .to(rig,{x,y,scale:1.08,duration:.82},.22)
          .to(presentation,{impulseX:.8,duration:.20,onUpdate:update},.22)
          .to(presentation,{impulseX:-.35,duration:.25,onUpdate:update},.62)
          .to(presentation,{impulseX:0,duration:.30,onUpdate:update},.87)
          .to(presentation,{turn:Math.PI*2,duration:1.90,ease:'power1.inOut',onUpdate:update},1.04)
          .to(rig,{opacity:0,scale:1.04,duration:.40},3.17)
          .add(enter,3.57);
      });
      return restore;
    });
    const interrupt=()=>revealCancel.current?.();
    window.addEventListener('resize',interrupt);
    return ()=>{revealController.current=null;window.removeEventListener('resize',interrupt);interrupt();};
  },{scope:host,dependencies:[width,height],revertOnUpdate:true});
  return <View ref={host} {...motionData({motionLoop:'night-space',nightScene:scene})} pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={styles.root}>
    <View style={styles.light}/><View style={styles.grain}/>
    <View ref={flow} style={styles.fill}>
      <View ref={portal} {...motionData({motionSpacePortal:''})} style={[styles.rig,styles.portal,geometry.portal]}><View style={styles.inner}/><View style={styles.orbit}/><View style={styles.secondOrbit}/></View>
      <View ref={glassRig} {...motionData({motionSpaceGlass:''})} style={[styles.rig,geometry.glass]}><View ref={glass} style={styles.fill}/></View>
    </View>
    {!compact&&<Text ref={signature} style={[styles.signature,{opacity:scene==='guided'||scene==='home'?1:0}]}>A STUDY IN TASTE &amp; TIME</Text>}
  </View>;
}
export default AmbientLight;
const styles=StyleSheet.create({
  root:{position:'absolute',top:0,right:0,bottom:0,left:0,overflow:'hidden',zIndex:0,backgroundImage:'radial-gradient(ellipse at 85% 35%,#1d2b23 0,transparent 60%)'} as never,
  light:{position:'absolute',right:'-10%',top:'3%',width:'75%',height:'90%',backgroundImage:'radial-gradient(ellipse,rgba(181,198,169,.14),transparent 64%)'} as never,
  grain:{position:'absolute',top:0,right:0,bottom:0,left:0,opacity:.027,backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 170 170\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.89\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Cpath fill=\'white\' filter=\'url(%23n)\' d=\'M0 0h170v170H0z\'/%3E%3C/svg%3E")'} as never,
  rig:{position:'absolute',transformOrigin:'50% 50%'} as never,
  fill:{position:'absolute',top:0,right:0,bottom:0,left:0},
  portal:{borderRadius:999,borderWidth:1,borderColor:'rgba(181,198,169,.32)',backgroundImage:'radial-gradient(circle at 30% 20%,rgba(174,194,159,.19),rgba(68,88,65,.16) 40%,rgba(10,17,12,.5) 75%)',boxShadow:'0 0 85px rgba(147,176,129,.05),inset 0 0 70px rgba(0,0,0,.16)'} as never,
  inner:{position:'absolute',top:15,left:15,right:15,bottom:15,borderRadius:999,borderWidth:1,borderColor:'rgba(181,198,169,.08)'},
  orbit:{position:'absolute',top:-37,left:-37,right:-37,bottom:-37,borderRadius:999,borderWidth:1,borderColor:'rgba(212,173,115,.17)',transform:[{rotate:'-28deg'},{scaleY:.58}]},
  secondOrbit:{position:'absolute',top:-75,left:-75,right:-75,bottom:-75,borderRadius:999,borderWidth:1,borderColor:'rgba(181,198,169,.09)',transform:[{rotate:'32deg'},{scaleY:.7}]},
  signature:{position:'absolute',right:'6.1%',top:'16%',fontSize:10,letterSpacing:2.6,color:'#a7b3a7',writingMode:'vertical-rl'} as never,
});
