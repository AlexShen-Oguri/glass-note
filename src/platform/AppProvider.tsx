import {getLocales} from 'expo-localization';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useReducer,
  useState,
} from 'react';
import {Platform} from 'react-native';
import type {Locale, SearchQuery, UnitPreference} from '../domain/contracts';
import type {GuidedAction, GuidedSession} from '../domain/guided/types';
import {createGuidedSession, guidedReducer} from '../domain/guided/session';
import {
  PREFERENCES_STORAGE_KEY,
  resolvePreferences,
  serializePreferences,
  validateStoredPreferences,
} from './preferences';
import {createStorageSession} from './storage';
import {useStorageParticipant} from './RecoveryProvider';

interface AppState {
  guided: GuidedSession; dispatchGuided: React.Dispatch<GuidedAction>;
  locale: Locale; setLocale: (value: Locale) => void;
  unit: UnitPreference; setUnit: (value: UnitPreference) => void;
  query: SearchQuery; setQuery: (value: SearchQuery) => void;
  motionPaused: boolean; setMotionPaused: (value: boolean) => void;
  preferenceStorageAvailable: boolean;
  preferencesHydrated: boolean;
}
const Context = createContext<AppState | null>(null);

export function AppProvider({children}: {children: React.ReactNode}) {
  const [storage] = useState(createStorageSession);
  const [guided, dispatchGuided] = useReducer(guidedReducer, undefined, createGuidedSession);
  const [locale, setLocaleState] = useState<Locale>('en');
  const [unit, setUnitState] = useState<UnitPreference>('ml');
  const [query, setQuery] = useState<SearchQuery>({});
  const [motionPaused, setMotionPausedState] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [preferenceStorageAvailable, setPreferenceStorageAvailable] = useState(true);
  const desktopReadSucceeded = useRef(false);
  const preferenceRevisions = useRef({locale: 0, unit: 0, motionPaused: 0});
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  const currentStorageState = useRef({hydrated, preferenceStorageAvailable});
  currentStorageState.current = {hydrated, preferenceStorageAvailable};
  useStorageParticipant('preferences', async () => {
    await writeQueue.current;
    return desktopReadSucceeded.current && currentStorageState.current.hydrated && currentStorageState.current.preferenceStorageAvailable;
  });

  const setLocale = useCallback((value: Locale) => {
    preferenceRevisions.current.locale += 1;
    setLocaleState(value);
  }, []);

  const setUnit = useCallback((value: UnitPreference) => {
    preferenceRevisions.current.unit += 1;
    setUnitState(value);
  }, []);

  const setMotionPaused = useCallback((value: boolean) => {
    preferenceRevisions.current.motionPaused += 1;
    setMotionPausedState(value);
  }, []);

  useEffect(() => {
    let active = true;
    const startingRevisions = {...preferenceRevisions.current};

    async function hydratePreferences() {
      let storedValue: string | null = null;
      try {
        storedValue = await storage.getItem(PREFERENCES_STORAGE_KEY);
        validateStoredPreferences(storedValue);
        desktopReadSucceeded.current = true;
      } catch {
        // Preferences are optional; blocked storage must not break discovery.
        if (active) setPreferenceStorageAvailable(false);
      }

      let deviceLanguages: Array<string | null> = [];
      try {
        deviceLanguages = getLocales().flatMap(({languageCode, languageTag}) => [
          languageCode,
          languageTag,
        ]);
      } catch {
        // A missing platform locale falls back to English.
      }

      if (!active) return;
      const preferences = resolvePreferences(storedValue, deviceLanguages);
      if (preferenceRevisions.current.locale === startingRevisions.locale) {
        setLocaleState(preferences.locale);
      }
      if (preferenceRevisions.current.unit === startingRevisions.unit) {
        setUnitState(preferences.unit);
      }
      if (preferenceRevisions.current.motionPaused === startingRevisions.motionPaused) {
        setMotionPausedState(preferences.motionPaused);
      }
      setHydrated(true);
    }

    void hydratePreferences();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !desktopReadSucceeded.current) return;
    // Hydration/recovery is a read, including a previously absent preferences key.
    if (Object.values(preferenceRevisions.current).every(revision => revision === 0)) return;

    const serialized = serializePreferences({locale, unit, motionPaused});
    writeQueue.current = writeQueue.current
      .catch(() => undefined)
      .then(() => storage.setItem(PREFERENCES_STORAGE_KEY, serialized))
      .then(() => setPreferenceStorageAvailable(true))
      .catch(() => setPreferenceStorageAvailable(false));
  }, [hydrated, locale, motionPaused, unit]);

  useEffect(() => {
    if (!hydrated || Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.lang = locale === 'zh' ? 'zh-Hans' : locale;
  }, [hydrated, locale]);

  return <Context.Provider value={{locale, setLocale, unit, setUnit, query, setQuery, motionPaused, setMotionPaused, preferenceStorageAvailable, preferencesHydrated:hydrated, guided, dispatchGuided}}>{children}</Context.Provider>;
}

export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error('useApp requires AppProvider');
  return value;
}
