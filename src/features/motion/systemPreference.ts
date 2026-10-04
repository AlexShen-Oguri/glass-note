import {useSyncExternalStore} from 'react';
import {AccessibilityInfo, Platform} from 'react-native';
import {createMotionPreferenceStore, pendingMotionPreference} from '../../platform/motion-preference';

let media: MediaQueryList | undefined;
const browserMedia = () => media ??= window.matchMedia('(prefers-reduced-motion: reduce)');
const preference = createMotionPreferenceStore({
  read: () => Platform.OS === 'web'
    ? browserMedia().matches
    : AccessibilityInfo.isReduceMotionEnabled(),
  subscribe: change => {
    if (Platform.OS === 'web') {
      const query = browserMedia();
      const update = (event: MediaQueryListEvent) => change(event.matches);
      query.addEventListener('change', update);
      return () => query.removeEventListener('change', update);
    }
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', change);
    return () => subscription.remove();
  },
});
const serverSnapshot = () => pendingMotionPreference;

/** Web reads matchMedia synchronously; native retains the resolved shared read. */
export function useSystemMotionPreference() {
  return useSyncExternalStore(preference.subscribe, preference.getSnapshot, serverSnapshot);
}
