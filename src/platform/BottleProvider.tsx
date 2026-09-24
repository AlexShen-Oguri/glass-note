import React,{createContext,useContext,useEffect,useState,useSyncExternalStore} from 'react';
import {bottles} from '../content/bottles';
import {BottleOwnershipStore} from '../domain/bottles/ownership';
import {createStorageSession} from './storage';
import {useStorageParticipant} from './RecoveryProvider';
const Context=createContext<BottleOwnershipStore|null>(null);
export function BottleProvider({children}:{children:React.ReactNode}) {
  const [store]=useState(()=>new BottleOwnershipStore(new Set(bottles.map(b=>b.id)),createStorageSession()));
  useStorageParticipant('bottles',async()=>{await store.whenSaved();const s=store.getSnapshot();return s.hydrated&&!s.error;});
  useEffect(()=>{void store.load();},[store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useBottles(){const store=useContext(Context);if(!store)throw new Error('BottleProvider required');const snapshot=useSyncExternalStore(store.subscribe,store.getSnapshot,store.getSnapshot);return {...snapshot,toggle:store.toggle,load:store.load,retrySave:store.retrySave};}
