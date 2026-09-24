import AsyncStorage from '@react-native-async-storage/async-storage';
import {desktopRuntime} from './desktopRuntime';
import {createPlatformStorage} from './storageFactory';
import {PersonalStorage} from './personalStorage';

export const isDesktopStorage = desktopRuntime.isDesktop();

/** Browser web keeps AsyncStorage; Tauri webviews use the narrow host bridge. */
const storage = createPlatformStorage(desktopRuntime, AsyncStorage);
const hasLock = () => isDesktopStorage || (typeof navigator !== 'undefined' && !!navigator.locks);
export const personalStorage = new PersonalStorage(storage, task => {
  if (isDesktopStorage || typeof navigator === 'undefined' || !navigator.locks) return task();
  return navigator.locks.request('glass-notes-personal-data', task);
}, hasLock);
export const createStorageSession = personalStorage.createSession;

export default storage;
