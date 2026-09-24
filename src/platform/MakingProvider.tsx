import React,{createContext,useContext,useEffect,useState,useSyncExternalStore} from 'react';
import {MakingStore} from './makingStore';
import {createStorageSession} from './storage';
import {useStorageParticipant} from './RecoveryProvider';
const Context=createContext<MakingStore|null>(null);
export function MakingProvider({children}:{children:React.ReactNode}){
  const [store]=useState(()=>new MakingStore(createStorageSession()));
  useStorageParticipant('making',store.whenSaved);
  useEffect(()=>{void store.load();},[store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useMaking(){const store=useContext(Context);if(!store)throw Error('MakingProvider required');
  const snapshot=useSyncExternalStore(store.subscribe,store.getSnapshot,store.getSnapshot);
  return {...snapshot,change:store.change,retry:store.retry};
}
