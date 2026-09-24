import React,{createContext,useContext,useEffect,useState,useSyncExternalStore} from 'react';
import {TasteStore} from './tasteStore';
import {createStorageSession} from './storage';
import {useStorageParticipant} from './RecoveryProvider';
const Context=createContext<TasteStore|null>(null);
export function TasteProvider({children}:{children:React.ReactNode}){
  const [store]=useState(()=>new TasteStore(createStorageSession()));
  useStorageParticipant('taste',store.whenSaved);
  useEffect(()=>{void store.load();},[store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useTaste(){const store=useContext(Context);if(!store)throw Error('TasteProvider required');
  const snapshot=useSyncExternalStore(store.subscribe,store.getSnapshot,store.getSnapshot);
  return {...snapshot,change:store.change,retry:store.retry};
}
