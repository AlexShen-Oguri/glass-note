import React,{useLayoutEffect,useRef} from 'react';
import {Animated,Easing,Platform,type StyleProp,type ViewStyle} from 'react-native';
import {transitionDuration} from '../../domain/discovery/motion';
import {useMotionEnabled} from './useMotionEnabled';
export {useMotionEnabled} from './useMotionEnabled';

/** Keeps the existing subtree mounted; input and provider state never reset for a transition. */
export function MotionTransition({children,changeKey,kind='page',style,disabled=false}: {
  children:React.ReactNode; changeKey:string|number; kind?:keyof typeof transitionDuration;
  style?:StyleProp<ViewStyle>; disabled?:boolean;
}) {
  const enabled=useMotionEnabled()&&!disabled;
  const progress=useRef(new Animated.Value(1)).current;
  const previous=useRef(changeKey);
  useLayoutEffect(()=>{
    const changed=previous.current!==changeKey;
    previous.current=changeKey;
    progress.stopAnimation();
    if (!enabled||!changed) {progress.setValue(1);return;}
    progress.setValue(0);
    const animation=Animated.timing(progress,{toValue:1,duration:transitionDuration[kind],easing:Easing.out(Easing.cubic),useNativeDriver:Platform.OS!=='web'});
    animation.start();
    return ()=>animation.stop();
  },[changeKey,enabled,kind,progress]);
  return <Animated.View style={[style,{opacity:progress,transform:[{translateY:progress.interpolate({inputRange:[0,1],outputRange:[4,0]})}]}]}>{children}</Animated.View>;
}
