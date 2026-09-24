import AsyncStorage from '@react-native-async-storage/async-storage';
import type {LocalKeyValueStorage} from './desktop-contract';
import {PersonalStorage} from './personalStorage';

/** iOS and other native builds keep the existing AsyncStorage implementation. */
const storage: LocalKeyValueStorage = AsyncStorage;
export const personalStorage = new PersonalStorage(storage);
export const createStorageSession = personalStorage.createSession;

export const isDesktopStorage = false;
export default storage;
