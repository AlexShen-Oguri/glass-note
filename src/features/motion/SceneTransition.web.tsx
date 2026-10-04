import React,{createContext,useCallback,useContext,useEffect,useRef} from 'react';
import {useMotionStatus} from './useMotionEnabled';
import {beginHandoff,settleHandoff,releaseHandoff,type RelayKind} from './choreography.web';
import {captureTitleDeparture,settleTitleDeparture} from './TitleDeparture.web';
import type {SceneOptions} from './SceneTransition';

type Run=(commit:()=>void,options?:SceneOptions)=>void;
const Context=createContext<Run>(commit=>commit());
/** 4188 commits immediately. Presentation hands old title pixels to the new scene. */
export function SceneTransitionProvider({children}:{children:React.ReactNode}){
  const status=useMotionStatus(),enabled=useRef(status.enabled),lastAction=useRef(-Infinity),replay=useRef(false);
  enabled.current=status.enabled;
  const run=useCallback<Run>((commit,{direction=1,kind='page',automatic=false}={})=>{
    // Only repeated user navigation is throttled. A successful persistence
    // result or restored completed session must always commit its presentation.
    const now=performance.now();if(!automatic&&now-lastAction.current<130)return;lastAction.current=now;
    if(enabled.current&&!document.hidden){
      captureTitleDeparture(kind as RelayKind,direction);
      beginHandoff(kind as RelayKind,direction);
    }else {settleTitleDeparture();settleHandoff();releaseHandoff();}
    commit();
  },[]);
  useEffect(()=>{
    const click=(event:MouseEvent)=>{
      if(replay.current||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const node=event.target instanceof Element?event.target:null,link=node?.closest<HTMLAnchorElement>('a[href]');
      if(!link||link.origin!==location.origin||link.target==='_blank'||link.hasAttribute('download')||link.pathname+link.search===location.pathname+location.search||link.hash)return;
      event.preventDefault();event.stopImmediatePropagation();
      run(()=>{replay.current=true;try{link.click();}finally{replay.current=false;}},{kind:link.pathname.startsWith('/cocktails/')?'photo':link.pathname==='/'?'back':'page',direction:link.pathname==='/'?-1:1});
    };
    const settle=()=>{settleTitleDeparture();settleHandoff();releaseHandoff();};
    const visibility=()=>{if(document.hidden)settle();};
    document.addEventListener('click',click,true);document.addEventListener('visibilitychange',visibility);window.addEventListener('resize',settle);
    // Native history commits its own route. Its incoming adapter owns the relay;
    // an expected router.back() must not cancel that entrance on popstate.
    return ()=>{document.removeEventListener('click',click,true);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('resize',settle);settle();};
  },[run]);
  useEffect(()=>{if(status.ready&&!status.enabled){settleTitleDeparture();settleHandoff();releaseHandoff();}},[status.ready,status.enabled]);
  return <Context.Provider value={run}>{children}</Context.Provider>;
}
export function useSceneTransition(){return {run:useContext(Context)};}
