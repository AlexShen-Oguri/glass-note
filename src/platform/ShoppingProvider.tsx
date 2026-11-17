import React,{createContext,useCallback,useContext,useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {catalogue} from '../content/catalogue';
import {ShoppingStore} from './shoppingStore';
import {createStorageSession} from './storage';
import {useRecovery,useStorageParticipant} from './RecoveryProvider';
import {purchaseShoppingItem} from './shoppingPurchase';
const Context=createContext<ShoppingStore|null>(null);
export function ShoppingProvider({children}:{children:React.ReactNode}){
 const [store]=useState(()=>new ShoppingStore(createStorageSession()));
 useStorageParticipant('shopping',store.whenSaved);
 useEffect(()=>{void store.load();},[store]);
 return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useShopping(){
 const store=useContext(Context);if(!store)throw Error('ShoppingProvider required');
 const snapshot=useSyncExternalStore(store.subscribe,store.getSnapshot,store.getSnapshot),recovery=useRecovery();
 const [purchaseError,setPurchaseError]=useState<string|undefined>(),[purchasing,setPurchasing]=useState(false);
 const pending=useRef<Promise<boolean>|undefined>(undefined),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const purchase=useCallback((itemId:string):Promise<boolean>=>{
  if(pending.current)return pending.current;
  setPurchasing(true);setPurchaseError(undefined);
  const run=purchaseShoppingItem(recovery,itemId,catalogue).catch(error=>{if(mounted.current)setPurchaseError(error instanceof Error?error.message:'shopping-purchase-failed');return false;}).finally(()=>{pending.current=undefined;if(mounted.current)setPurchasing(false);});
  pending.current=run;return run;
 },[recovery]);
 return {...snapshot,change:store.change,retry:store.retry,purchase,purchasing,purchaseError};
}
