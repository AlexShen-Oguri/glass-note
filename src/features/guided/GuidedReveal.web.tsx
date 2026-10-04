import React,{useRef,useState} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {motionData} from '../motion/attributes';
import {element,gsap,useGSAP} from '../motion/gsap.web';
import {relayEntrance} from '../motion/choreography.web';
import {useMotionStatus} from '../motion/useMotionEnabled';
import {t} from '../../i18n/ui';
import {colors} from '../../theme/tokens';
import type {GuidedRevealProps} from './GuidedReveal';

/** Wait for actual motion preferences; the real results run the 4188 relay score. */
export function GuidedReveal({revealing,motionAllowed,activeWindow,children,locale,onFinish}:GuidedRevealProps){
  const {ready,enabled:preferred}=useMotionStatus();
  const enabled=preferred&&motionAllowed&&activeWindow;
  const host=useRef<View>(null),timeline=useRef<gsap.core.Timeline|null>(null),finish=useRef(onFinish),issued=useRef(false),businessIssued=useRef(false),wasActive=useRef(false),started=useRef(revealing);
  const [complete,setComplete]=useState(!revealing);finish.current=onFinish;
  const finishOnce=()=>{if(issued.current)return;issued.current=true;setComplete(true);};
  useGSAP(()=>{
    const node=element(host);if(!node||!ready)return;
    if(!activeWindow){wasActive.current=false;return;}
    const resumed=!wasActive.current;wasActive.current=true;
    // Workflow state commits independently of presentation and interruption.
    if(started.current&&!businessIssued.current){businessIssued.current=true;finish.current();}
    if(issued.current&&!resumed)return;
    if(!enabled){finishOnce();return;}
    const entrance=relayEntrance(node,finishOnce,false,started.current&&!issued.current?'results':undefined);
    timeline.current=entrance?.timeline??null;
    return ()=>{entrance?.dispose();timeline.current=null;};
  },{scope:host,dependencies:[ready,enabled,activeWindow],revertOnUpdate:true});
  return <View ref={host} collapsable={false} style={styles.container} {...motionData({motionReveal:''})}>
    <View {...motionData({revealResults:''})} testID="guided-results-layer">{children(undefined,started.current&&!complete?<Pressable testID="guided-reveal-stage" accessibilityRole="button" onPress={()=>{timeline.current?.progress(1);finishOnce();}} style={styles.skip}><Text style={styles.skipText}>{t(locale,'guidedSkipAnimation')} →</Text></Pressable>:null)}</View>
  </View>;
}
const styles=StyleSheet.create({container:{position:'relative',width:'100%'},skip:{alignSelf:'center',minHeight:32,justifyContent:'center',paddingHorizontal:8,marginTop:0},skipText:{color:colors.amber,fontSize:12,letterSpacing:.4}});
