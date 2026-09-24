import React, {createContext, useContext, useEffect, useState, useSyncExternalStore} from 'react';

import {PrivateRecipeStore} from './privateRecipeStore';
import {useStorageParticipant} from './RecoveryProvider';
import {createStorageSession} from './storage';

const Context = createContext<PrivateRecipeStore | null>(null);

export function PrivateRecipesProvider({children}: {children: React.ReactNode}) {
  const [store] = useState(() => new PrivateRecipeStore(createStorageSession()));
  useStorageParticipant('privateRecipes', async () => {
    const saved = await store.whenSaved();
    const snapshot = store.getSnapshot();
    return saved && snapshot.hydrated && snapshot.storageAvailable && !snapshot.saving && !snapshot.error;
  });
  useEffect(() => { void store.load(); }, [store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}

export function usePrivateRecipes() {
  const store = useContext(Context);
  if (!store) throw new Error('usePrivateRecipes requires PrivateRecipesProvider');
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return {
    ...snapshot,
    create: store.create,
    createOriginal: store.createOriginal,
    saveRevision: store.saveRevision,
    delete: store.delete,
    retry: store.retry,
    whenSaved: store.whenSaved,
    getSnapshot: store.getSnapshot,
  };
}
