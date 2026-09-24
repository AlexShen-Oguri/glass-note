import React, {createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore} from 'react';
import {catalogue} from '../content/catalogue';
import {ingredientEntries, PANTRY_STORAGE_KEY, parsePantry} from '../domain/ingredients';
import {createStorageSession} from './storage';
import {useStorageParticipant} from './RecoveryProvider';
import {PantryStore} from './pantryStore';

const Context = createContext<PantryStore | null>(null);
const entries = ingredientEntries(catalogue);

export function PantryProvider({children}: {children: React.ReactNode}) {
  const [store] = useState(() => new PantryStore(createStorageSession(), PANTRY_STORAGE_KEY, raw => parsePantry(raw, catalogue, true)));
  useStorageParticipant('pantry', async()=>{await store.whenSaved();const s=store.getSnapshot();return s.hydrated&&s.storageAvailable&&!s.error;});
  useEffect(() => { void store.load(); }, [store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}

export function usePantry() {
  const store = useContext(Context);
  if (!store) throw new Error('usePantry requires PantryProvider');
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const toggleIngredient = useCallback((id: string) => {
    if (!entries.some(entry => entry.ingredient.id === id)) return;
    const add = !store.getSnapshot().pantry.ingredientIds.includes(id);
    store.change(value => {
      const brandsByIngredient = {...value.brandsByIngredient};
      if (!add) {
        delete brandsByIngredient[id];
        return {ingredientIds: value.ingredientIds.filter(item => item !== id), brandsByIngredient};
      }
      return {...value, ingredientIds: [...new Set([...value.ingredientIds, id])]};
    });
  }, [store]);
  const toggleBrand = useCallback((ingredientId: string, brandId: string) => {
    if (!entries.find(entry => entry.ingredient.id === ingredientId)?.brandIds.includes(brandId)) return;
    const add = !store.getSnapshot().pantry.brandsByIngredient[ingredientId]?.includes(brandId);
    store.change(value => {
      const current = value.brandsByIngredient[ingredientId] ?? [];
      return {ingredientIds: [...new Set([...value.ingredientIds, ingredientId])], brandsByIngredient: {...value.brandsByIngredient,
        [ingredientId]: add ? [...new Set([...current, brandId])] : current.filter(id => id !== brandId)}};
    });
  }, [store]);
  return {...snapshot, toggleIngredient, toggleBrand, retry: store.retry};
}
