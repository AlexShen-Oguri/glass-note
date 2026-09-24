import React, {createContext, useContext, useEffect, useState, useSyncExternalStore} from 'react';
import {catalogue} from '../content/catalogue';
import {favoriteVersionIds, FavoritesStore} from '../domain/favorites';
import {createStorageSession} from './storage';
import {useStorageParticipant} from './RecoveryProvider';

const Context = createContext<FavoritesStore | null>(null);
export function FavoritesProvider({children}: {children: React.ReactNode}) {
  const [store] = useState(() => new FavoritesStore(favoriteVersionIds(catalogue), createStorageSession(),catalogue));
  useStorageParticipant('favorites',async()=>{await store.whenSaved();const s=store.getSnapshot();return s.hydrated&&s.storageAvailable&&!s.saving&&!s.error;});
  useEffect(() => {void store.load();}, [store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useFavorites() {
  const store = useContext(Context);
  if (!store) throw new Error('FavoritesProvider is required');
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return {...snapshot,toggle:store.toggle,setSaved:store.set,retry:store.retry,createList:store.createList,renameList:store.renameList,
    addToList:store.addToList,removeFromList:store.removeFromList,deleteList:store.deleteList};
}
