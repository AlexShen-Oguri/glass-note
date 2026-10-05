import {useEffect,useState} from 'react';
import {AppState} from 'react-native';
import {useApp} from '../../platform/AppProvider';
import {motionEnabled} from '../../domain/discovery/motion';
import {useSystemMotionPreference} from './systemPreference';

export function useMotionStatus() {
  const {preferencesHydrated,preferenceStorageAvailable,motionPaused}=useApp();
  const {ready:systemReady,reduced}=useSystemMotionPreference();
  const [active,setActive]=useState(AppState.currentState==='active');
  useEffect(()=>{
    const update=()=>setActive(AppState.currentState==='active'&&(typeof document==='undefined'||!document.hidden));
    update();
    const subscription=AppState.addEventListener('change',update);
    if(typeof document!=='undefined')document.addEventListener('visibilitychange',update);
    return ()=>{subscription.remove();if(typeof document!=='undefined')document.removeEventListener('visibilitychange',update);};
  },[]);
  const ready=preferencesHydrated&&systemReady;
  return {ready,enabled:ready&&active&&motionEnabled(preferencesHydrated,preferenceStorageAvailable,motionPaused,reduced)};
}

export function useMotionEnabled() {return useMotionStatus().enabled;}
