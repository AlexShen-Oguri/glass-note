import React,{useRef} from 'react';
import {View,type ViewProps} from 'react-native';
import {element,useGSAP} from './gsap.web';
import {relayEntrance,emitRelayTrace} from './choreography.web';
import {useMotionEnabled} from './useMotionEnabled';
/** 4188 recomposes results immediately, then relays the first eight cards. */
export function MotionResults({changeKey,replayKey=0,...props}:ViewProps&{changeKey:string;replayKey?:number}){
  const host=useRef<View>(null),previous=useRef({changeKey,replayKey}),enabled=useMotionEnabled();
  useGSAP(()=>{
    const before=previous.current,changed=before.changeKey!==changeKey;previous.current={changeKey,replayKey};
    const node=element(host);if(!node||!changed||!enabled)return;
    emitRelayTrace();
    const entrance=relayEntrance(node,undefined,false,before.replayKey!==replayKey?'replay':'filter');return ()=>entrance?.dispose();
  },{scope:host,dependencies:[changeKey,replayKey,enabled],revertOnUpdate:true});
  return <View ref={host} {...props}/>;
}
