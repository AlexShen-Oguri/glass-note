import React,{useEffect,useRef,useState} from 'react';
import {Animated,AppState,Easing,Pressable,StyleSheet,Text,View} from 'react-native';
import type {Cocktail,Locale,MediaAsset} from '../../domain/contracts';
import {t} from '../../i18n/ui';
import {colors} from '../../theme/tokens';

export interface GuidedRevealCandidate extends Pick<Cocktail,'id'|'name'|'accent'> {asset?:MediaAsset}
export interface GuidedRevealProps {
  revealing:boolean;motionAllowed:boolean;activeWindow:boolean;locale:Locale;
  candidates:GuidedRevealCandidate[];resultPhotoRefs:React.MutableRefObject<Map<string,View>>;
  onFinish:()=>void;children:(resultPhotoOpacity?:Animated.Value)=>React.ReactNode;
}

/** Native adapter: the same immediately usable content, without DOM or GSAP. */
export function GuidedReveal({revealing,motionAllowed,activeWindow,locale,children,onFinish}:GuidedRevealProps) {
  const opacity=useRef(new Animated.Value(1)).current;
  const animation=useRef<Animated.CompositeAnimation|null>(null);
  const finish=useRef(onFinish),issued=useRef(false);
  const [foreground,setForeground]=useState(AppState.currentState==='active');
  finish.current=onFinish;
  const finishOnce=()=>{if(!issued.current){issued.current=true;finish.current();}};
  useEffect(()=>{const subscription=AppState.addEventListener('change',state=>setForeground(state==='active'));return ()=>subscription.remove();},[]);
  useEffect(()=>{
    opacity.setValue(1);
    if(!revealing){issued.current=false;return;}
    if(!activeWindow)return;
    if(!motionAllowed){finishOnce();return;}
    if(!foreground)return;
    opacity.setValue(0.72);
    const next=Animated.sequence([
      Animated.timing(opacity,{toValue:1,duration:500,easing:Easing.out(Easing.cubic),useNativeDriver:true}),
      Animated.delay(400),
    ]);
    animation.current=next;
    next.start(({finished})=>{if(finished)finishOnce();});
    return ()=>{next.stop();animation.current=null;opacity.setValue(1);};
  },[revealing,motionAllowed,activeWindow,foreground,opacity]);
  const skip=()=>{animation.current?.stop();opacity.setValue(1);finishOnce();};
  return <View><View testID="guided-results-layer">{children(opacity)}</View>{revealing&&motionAllowed?<Pressable testID="guided-reveal-stage" accessibilityRole="button" onPress={skip} style={styles.skip}><Text style={styles.skipText}>{t(locale,'guidedSkipAnimation')}</Text></Pressable>:null}</View>;
}
const styles=StyleSheet.create({skip:{position:'absolute',top:-44,right:0,zIndex:2,minHeight:48,alignSelf:'flex-start',justifyContent:'center',paddingHorizontal:12},skipText:{color:colors.accent,fontSize:14,lineHeight:22}});
