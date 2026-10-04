import {motionData} from '../motion/attributes';
import React, {useRef} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {t} from '../../i18n/ui';
import {colors} from '../../theme/tokens';
import {element, gsap, useGSAP, useVisibleMotion} from '../motion/gsap.web';
import type {GuidedRevealProps} from './GuidedReveal';

/** Animate the actual recommendation photos; text and links are usable throughout. */
export function GuidedReveal({revealing,motionAllowed,activeWindow,locale,candidates,resultPhotoRefs,children,onFinish}:GuidedRevealProps) {
  const host=useRef<View>(null);
  const foreground=useVisibleMotion(host,!activeWindow);
  const timeline=useRef<gsap.core.Timeline|null>(null);
  const finish=useRef(onFinish),issued=useRef(false);
  finish.current=onFinish;
  const selectedKey=candidates.slice(0,3).map(item=>item.id).join('|');
  const finishOnce=()=>{if(!issued.current){issued.current=true;finish.current();}};
  useGSAP(()=>{
    if(!revealing){issued.current=false;return;}
    if(!activeWindow)return;
    if(!motionAllowed||!selectedKey){finishOnce();return;}
    if(!foreground)return;
    const node=element(host);
    if(!node)return;
    const photos=selectedKey.split('|').map(id=>resultPhotoRefs.current.get(id) as unknown as HTMLElement|undefined).filter((photo):photo is HTMLElement=>Boolean(photo));
    // Read all rectangles before changing styles; skip photos outside the viewport.
    const rectangles=photos.map(photo=>photo.getBoundingClientRect());
    const visible=photos.filter((_photo,index)=>rectangles[index]!.bottom>0&&rectangles[index]!.top<window.innerHeight);
    const reasons=node.querySelectorAll('[data-reveal-reasons]');
    const tl=gsap.timeline({onComplete:finishOnce});
    timeline.current=tl;
    if(visible.length)tl.fromTo(visible,{opacity:0.72,y:16,scale:0.985},{opacity:1,y:0,scale:1,duration:0.5,stagger:0.08,ease:'power3.out',clearProps:'transform,opacity'},0);
    if(reasons.length)tl.fromTo(reasons,{opacity:0.7,x:-8},{opacity:1,x:0,duration:0.24,stagger:0.06,ease:'power2.out',clearProps:'transform,opacity'},0.2);
    tl.call(()=>undefined,[],0.9);
    return ()=>{timeline.current=null;};
  },{scope:host,dependencies:[revealing,motionAllowed,activeWindow,foreground,selectedKey],revertOnUpdate:true});
  const skip=()=>{timeline.current?.progress(1);finishOnce();};
  return <View ref={host} collapsable={false}>
    <View {...motionData({revealResults:''})} testID="guided-results-layer">{children()}</View>
    {revealing&&motionAllowed?<Pressable testID="guided-reveal-stage" accessibilityRole="button" onPress={skip} style={styles.skip}><Text style={styles.skipText}>{t(locale,'guidedSkipAnimation')}</Text></Pressable>:null}
  </View>;
}
const styles=StyleSheet.create({
  skip:{position:'absolute',top:-44,right:0,zIndex:2,minHeight:48,alignSelf:'flex-start',justifyContent:'center',paddingHorizontal:12},
  skipText:{color:colors.accent,fontSize:14,lineHeight:22},
});
