import React,{useLayoutEffect,useRef,useState} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {t} from '../../i18n/ui';
import {colors} from '../../theme/tokens';
import {motionData} from '../motion/attributes';
import {element} from '../motion/gsap.web';
import {useGlassReveal} from '../motion/SceneTransition.web';
import {useMotionStatus} from '../motion/useMotionEnabled';
import type {GuidedRevealProps} from './GuidedReveal';

/** Live React content stays in place through the approved 4192 cup reveal. */
export function GuidedReveal({revealing,choosing=false,motionAllowed,activeWindow,children,departure,locale,onFinish}:GuidedRevealProps){
  const {ready,enabled}=useMotionStatus(),glass=useGlassReveal();
  const outgoing=useRef<View>(null),results=useRef<View>(null),cancel=useRef<(()=>void)|null>(null);
  const started=useRef(choosing||revealing),issued=useRef(false),played=useRef(false),finish=useRef(onFinish);
  const [landed,setLanded]=useState(!choosing&&!revealing),[complete,setComplete]=useState(!revealing);
  finish.current=onFinish;
  const finishOnce=()=>{cancel.current?.();cancel.current=null;setLanded(true);setComplete(true);};
  // The persistent ambient stage owns its GSAP context. A second context here
  // would adopt and revert that stage when returning to the choice screen.
  useLayoutEffect(()=>{
    if(choosing){started.current=true;issued.current=false;played.current=false;setLanded(false);setComplete(true);return;}
    if(!ready)return;
    if(!started.current)return;
    if(!issued.current){issued.current=true;finish.current();}
    if(!activeWindow||!enabled||!motionAllowed){finishOnce();return;}
    if(played.current)return;played.current=true;
    setComplete(false);
    const from=element(outgoing),to=element(results);
    if(!from||!to||!glass.current){finishOnce();return;}
    cancel.current=glass.current(from,to,()=>setLanded(true),()=>{cancel.current=null;setLanded(true);setComplete(true);});
    return ()=>{cancel.current?.();cancel.current=null;};
  },[choosing,ready,enabled,motionAllowed,activeWindow]);
  return <View {...motionData({...(!choosing?{motionReveal:''}:{}),revealPhase:choosing?'choosing':complete?'complete':landed?'results-enter':'cup'})} style={styles.host}>
    {(choosing||!landed)&&<View ref={outgoing} pointerEvents={choosing?'auto':'none'} {...(!choosing?{inert:true}: {})}>{departure}</View>}
    {!choosing&&<View ref={results} {...motionData({motionRevealResults:''})} style={!landed?styles.waiting:undefined} pointerEvents={landed?'auto':'none'} {...(!landed?{'aria-hidden':true,inert:true}: {})}>{children()}</View>}
    {!choosing&&!complete&&<Pressable testID="guided-reveal-stage" accessibilityRole="button" onPress={finishOnce} style={styles.skip}><Text style={styles.skipText}>{t(locale,'guidedSkipAnimation')} →</Text></Pressable>}
  </View>;
}
const styles=StyleSheet.create({
  host:{position:'relative',width:'100%'},
  waiting:{position:'absolute',top:0,left:0,right:0,opacity:0},
  skip:{position:'fixed',right:28,bottom:28,minHeight:44,justifyContent:'center',paddingHorizontal:16,backgroundColor:colors.background,borderWidth:1,borderColor:colors.border,zIndex:20} as never,
  skipText:{color:colors.amber,fontSize:12},
});
