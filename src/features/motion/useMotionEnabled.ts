import {useEffect,useState} from 'react';
import {AppState} from 'react-native';
import {useApp} from '../../platform/AppProvider';
import {motionEnabled} from '../../domain/discovery/motion';
import {useReduceMotion} from '../discovery/components';

export function useMotionEnabled() {
  const {preferencesHydrated,preferenceStorageAvailable,motionPaused}=useApp();
  const reduced=useReduceMotion();
  const [active,setActive]=useState(AppState.currentState==='active');
  useEffect(()=>{
    const update=()=>setActive(AppState.currentState==='active'&&(typeof document==='undefined'||!document.hidden));
    update();
    const subscription=AppState.addEventListener('change',update);
    if(typeof document!=='undefined')document.addEventListener('visibilitychange',update);
    return ()=>{subscription.remove();if(typeof document!=='undefined')document.removeEventListener('visibilitychange',update);};
  },[]);
  return active&&motionEnabled(preferencesHydrated,preferenceStorageAvailable,motionPaused,reduced);
}
