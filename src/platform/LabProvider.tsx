import React, {createContext, useContext, useEffect, useState, useSyncExternalStore} from 'react';
import {LabStore} from '../domain/lab';
import {createStorageSession} from './storage';
import {useStorageParticipant} from './RecoveryProvider';

const Context = createContext<LabStore | null>(null);

export function LabProvider({children}: {children: React.ReactNode}) {
  const [store] = useState(() => new LabStore(createStorageSession()));
  useStorageParticipant('lab',async()=>{await store.whenSaved();return store.saveStatus();});
  useEffect(() => { void store.load(); }, [store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}

export function useLab() {
  const store = useContext(Context);
  if (!store) throw new Error('useLab requires LabProvider');
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return {
    ...snapshot,
    getSnapshot: store.getSnapshot,
    load: store.load,
    createProject: store.createProject,
    createComparisonProject: store.createComparisonProject,
    updateProject: store.updateProject,
    deleteProject: store.deleteProject,
    addVersion: store.addVersion,
    updateVersion: store.updateVersion,
    deleteVersion: store.deleteVersion,
    addBatch: store.addBatch,
    updateBatch: store.updateBatch,
    deleteBatch: store.deleteBatch,
    importBackup: store.importBackup,
    retrySave: store.retrySave,
    saveStatus: store.saveStatus,
    whenSaved: store.whenSaved,
  };
}
